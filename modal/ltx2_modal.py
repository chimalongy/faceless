import modal
import base64
import os
import subprocess
from pydantic import BaseModel

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git", "curl", "ffmpeg", "libsndfile1")
    .run_commands(
        "curl -LsSf https://astral.sh/uv/install.sh | sh",
        "git clone https://github.com/Lightricks/LTX-2.git /opt/LTX-2",
        "cd /opt/LTX-2 && /root/.local/bin/uv sync --frozen",
        "cp -r /opt/LTX-2/.venv/lib/python3.12/site-packages/* /usr/local/lib/python3.12/site-packages/",
    )
    .pip_install("fastapi[standard]")
)

app = modal.App("ltx-2", image=image)

volume = modal.Volume.from_name("ltx-2-models", create_if_missing=True)
MODELS_DIR = "/models"


# ---------------------------------------------------------------------------
# One-time model download — run ONCE with:
#   modal run ltx2_modal.py::download_models
# ---------------------------------------------------------------------------
@app.function(
    volumes={MODELS_DIR: volume},
    timeout=7200,
    secrets=[modal.Secret.from_name("huggingface-secret")],
)
def download_models():
    env = {**os.environ, "HF_TOKEN": os.environ["HF_TOKEN"]}

    files_to_download = [
        "ltx-2-19b-dev.safetensors",   # ✅ regular bf16 — FP8 has circular import bug
        "ltx-2-spatial-upscaler-x2-1.0.safetensors",
        "ltx-2-19b-distilled-lora-384.safetensors",
    ]

    for f in files_to_download:
        print(f"Downloading {f}...")
        subprocess.run([
            "/root/.local/bin/uv", "run", "hf", "download",
            "Lightricks/LTX-2", f,
            "--local-dir", f"{MODELS_DIR}/ltx-2",
        ], cwd="/opt/LTX-2", check=True, env=env)

    print("Downloading Gemma text encoder (~8GB)...")
    subprocess.run([
        "/root/.local/bin/uv", "run", "hf", "download",
        "google/gemma-3-12b-it-qat-q4_0-unquantized",
        "--local-dir", f"{MODELS_DIR}/gemma",
    ], cwd="/opt/LTX-2", check=True, env=env)

    volume.commit()
    print("✅ All models downloaded and committed to volume!")


# ---------------------------------------------------------------------------
# Request schema
# ---------------------------------------------------------------------------
class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: str = (
        "worst quality, inconsistent motion, blurry, jittery, distorted, "
        "watermark, text, signature, low quality, deformed, ugly."
    )
    width: int = 960       # must be divisible by 32
    height: int = 512      # must be divisible by 32
    duration: int = 6      # seconds
    frame_rate: int = 24
    num_inference_steps: int = 40
    cfg_guidance_scale: float = 4.0
    seed: int = 42


# ---------------------------------------------------------------------------
# Main inference class
# ---------------------------------------------------------------------------
@app.cls(
    gpu="A100",
    volumes={MODELS_DIR: volume},
    scaledown_window=300,
    timeout=600,
)
class LTX2:

    @modal.enter()
    def load_pipeline(self):
        import sys
        import torch
        sys.path.insert(0, "/opt/LTX-2/packages/ltx-pipelines/src")
        sys.path.insert(0, "/opt/LTX-2/packages/ltx-core/src")

        from ltx_pipelines.ti2vid_two_stages import TI2VidTwoStagesPipeline
        from ltx_core.loader import LoraPathStrengthAndSDOps
        from ltx_core.loader.sd_ops import LTXV_LORA_COMFY_RENAMING_MAP

        print("Loading TI2VidTwoStagesPipeline...")

        # ✅ Use regular bf16 checkpoint — FP8 quantization module has a circular
        # import bug in the current version of the repo, so we skip it entirely.
        # quantization=None is the default so we don't need to pass it.
        self.pipeline = TI2VidTwoStagesPipeline(
            checkpoint_path=f"{MODELS_DIR}/ltx-2/ltx-2-19b-dev.safetensors",
            distilled_lora=[
                LoraPathStrengthAndSDOps(
                    path=f"{MODELS_DIR}/ltx-2/ltx-2-19b-distilled-lora-384.safetensors",
                    strength=1.0,
                    sd_ops=LTXV_LORA_COMFY_RENAMING_MAP,
                )
            ],
            spatial_upsampler_path=f"{MODELS_DIR}/ltx-2/ltx-2-spatial-upscaler-x2-1.0.safetensors",
            gemma_root=f"{MODELS_DIR}/gemma",
            loras=[],
            device=torch.device("cuda"),
        )
        print("✅ Pipeline loaded!")

    @modal.method()
    def generate(self, req: GenerateRequest) -> bytes:
        import sys
        import torch
        import tempfile
        sys.path.insert(0, "/opt/LTX-2/packages/ltx-pipelines/src")
        sys.path.insert(0, "/opt/LTX-2/packages/ltx-core/src")

        from ltx_core.model.video_vae import TilingConfig, get_video_chunks_number
        from ltx_pipelines.utils.constants import AUDIO_SAMPLE_RATE
        from ltx_pipelines.utils.media_io import encode_video

        num_frames = req.duration * req.frame_rate + 1
        tiling_config = TilingConfig.default()
        video_chunks_number = get_video_chunks_number(num_frames, tiling_config)

        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
            output_path = tmp.name

        with torch.inference_mode():
            video, audio = self.pipeline(
                prompt=req.prompt,
                negative_prompt=req.negative_prompt,
                seed=req.seed,
                height=req.height,
                width=req.width,
                num_frames=num_frames,
                frame_rate=req.frame_rate,
                num_inference_steps=req.num_inference_steps,
                cfg_guidance_scale=req.cfg_guidance_scale,
                tiling_config=tiling_config,
            )

        encode_video(
            video=video,
            fps=req.frame_rate,
            audio=audio,
            audio_sample_rate=AUDIO_SAMPLE_RATE,
            output_path=output_path,
            video_chunks_number=video_chunks_number,
        )

        with open(output_path, "rb") as f:
            video_bytes = f.read()

        os.unlink(output_path)
        return video_bytes

    @modal.fastapi_endpoint(method="POST")
    def api(self, req: GenerateRequest) -> dict:
        video_bytes = self.generate.local(req)
        return {
            "video_base64": base64.b64encode(video_bytes).decode("utf-8"),
            "format": "mp4",
            "width": req.width,
            "height": req.height,
            "duration": req.duration,
            "frame_rate": req.frame_rate,
        }


# ---------------------------------------------------------------------------
# Local test entrypoint
# ---------------------------------------------------------------------------
@app.local_entrypoint()
def main():
    ltx = LTX2()
    video_bytes = ltx.generate.remote(GenerateRequest(
        prompt=(
            "A serene ocean at sunset, golden light reflecting off calm waves, "
            "a lone seagull glides across the frame, gentle sound of waves."
        ),
        width=960,
        height=512,
        duration=6,
    ))
    with open("output.mp4", "wb") as f:
        f.write(video_bytes)
    print("✅ Saved output.mp4")