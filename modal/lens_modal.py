"""
Microsoft Lens — Modal Deploy
==============================
Based on the official microsoft/Lens README and requirements.txt:
  https://github.com/microsoft/Lens
  https://huggingface.co/microsoft/Lens

Tested environment (from docs): Python 3.12 · CUDA 12.6 · PyTorch 2.11.0+cu126

Usage
-----
  # Deploy as a persistent web endpoint:
  modal deploy lens_modal.py

  # Run a one-off generation:
  modal run lens_modal.py

  # Call the deployed web endpoint:
  curl -X POST https://<your-modal-app>.modal.run/generate \
    -H "Content-Type: application/json" \
    -d '{"prompt": "A cat holding a sign that says hello world", "steps": 20}'
"""

import io
import modal

# ---------------------------------------------------------------------------
# 1. Image — install exact pinned deps from requirements.txt
#    PyTorch is installed first from the cu126 wheel index, then the rest.
# ---------------------------------------------------------------------------

def download_model():
    """Bake model weights into the image at build time for fast cold starts."""
    from huggingface_hub import snapshot_download
    # Downloads all three variants; remove entries you don't need to save space.
    snapshot_download("microsoft/Lens")        # RL-tuned default  (~30.7 GB)
    # snapshot_download("microsoft/Lens-Turbo")  # 4-step fast variant
    # snapshot_download("microsoft/Lens-Base")   # Base supervised model


image = (
    modal.Image.debian_slim(python_version="3.12")
    # Clone the inference package so `from lens import LensPipeline` works
    .run_commands(
        "apt-get update && apt-get install -y git",
        "git clone https://github.com/microsoft/Lens /opt/lens",
    )
    # Install PyTorch with CUDA 12.6 support (exact version from docs)
    .pip_install(
        "torch==2.11.0+cu126",
        "torchvision==0.26.0+cu126",
        extra_index_url="https://download.pytorch.org/whl/cu126",
    )
    # Install the rest of the pinned requirements from requirements.txt
    .pip_install(
        "accelerate==1.13.0",
        "diffusers==0.38.0",
        "einops==0.8.2",
        "huggingface_hub==1.14.0",
        "numpy==2.4.3",
        "pillow>=12.2.0",
        "safetensors>=0.7.0",
        "tokenizers==0.22.2",
        "tqdm==4.67.3",
        "transformers==5.8.0",
        # Optional — needed only for MXFP4 quantized GPT-OSS encoder on H100
        "kernels==0.14.0",
        "fastapi[standard]",
    )
    # Pre-download weights into the image (comment out to download at runtime)
    .run_function(download_model, secrets=[modal.Secret.from_name("huggingface-secret")])
)

app = modal.App("microsoft-lens", image=image)

# ---------------------------------------------------------------------------
# 2. GPU class — load the pipeline once per container, reuse across requests
# ---------------------------------------------------------------------------

@app.cls(
    gpu="A100",           # Minimum: A10G (24 GB VRAM). A100 recommended.
                          # Use "H100" for MXFP4 quantized encoder (no --disable_mxfp4)
    timeout=600,
    scaledown_window=300, # Keep warm for 5 min between requests
                          # (renamed from container_idle_timeout on 2025-02-24)
)
class LensModel:

    @modal.enter()
    def load(self):
        """Called once when the container starts."""
        import sys
        import torch
        sys.path.insert(0, "/opt/lens")   # Make `from lens import ...` work
        from lens import LensPipeline

        # On A100 / V100: MXFP4 kernels are NOT available, so the GPT-OSS
        # encoder is loaded in bf16 automatically. On H100 / Hopper+, remove
        # the disable_mxfp4 workaround and the encoder stays in MXFP4.
        self.pipe = LensPipeline.from_pretrained(
            "microsoft/Lens",
            torch_dtype=torch.bfloat16,
        )

        # If you're tight on VRAM, swap .to("cuda") for CPU offload:
        #   self.pipe.enable_model_cpu_offload()
        self.pipe = self.pipe.to("cuda")

    @modal.method()
    def generate(
        self,
        prompt: str,
        base_resolution: int = 1440,
        aspect_ratio: str = "1:1",
        num_inference_steps: int = 20,
        guidance_scale: float = 5.0,
        seed: int | None = None,
    ) -> bytes:
        """
        Generate an image and return it as PNG bytes.

        Args:
            prompt:               Text description of the image.
            base_resolution:      1024 or 1440 (default 1440).
            aspect_ratio:         One of: 1:2, 9:16, 2:3, 3:4, 1:1,
                                  4:3, 3:2, 16:9, 2:1  (default 1:1).
            num_inference_steps:  Denoising steps. Use 4 with Lens-Turbo.
            guidance_scale:       CFG scale (default 5.0; use 1.0 for Turbo).
            seed:                 Optional int seed for reproducibility.
        """
        import torch

        generator = (
            torch.Generator("cuda").manual_seed(seed)
            if seed is not None
            else None
        )

        image = self.pipe(
            prompt=prompt,
            base_resolution=base_resolution,
            aspect_ratio=aspect_ratio,
            num_inference_steps=num_inference_steps,
            guidance_scale=guidance_scale,
            generator=generator,
        ).images[0]

        buf = io.BytesIO()
        image.save(buf, format="PNG")
        return buf.getvalue()


# ---------------------------------------------------------------------------
# 3. Web endpoint — POST /generate  →  returns PNG image bytes
# ---------------------------------------------------------------------------

@app.function()
@modal.fastapi_endpoint(method="POST")
def generate_endpoint(request: dict):
    """
    POST body (JSON):
      {
        "prompt":        "A cat holding a sign",   # required
        "resolution":    1440,                      # optional
        "aspect_ratio":  "1:1",                    # optional
        "steps":         20,                        # optional
        "cfg":           5.0,                       # optional
        "seed":          42                         # optional
      }

    Returns: PNG image (Content-Type: image/png)
    """
    from fastapi.responses import Response
    model = LensModel()
    png_bytes = model.generate.remote(
        prompt=request["prompt"],
        base_resolution=request.get("resolution", 1440),
        aspect_ratio=request.get("aspect_ratio", "1:1"),
        num_inference_steps=request.get("steps", 20),
        guidance_scale=request.get("cfg", 5.0),
        seed=request.get("seed"),
    )
    return Response(content=png_bytes, media_type="image/png")


# ---------------------------------------------------------------------------
# 4. Local entrypoint — `modal run lens_modal.py` for quick testing
# ---------------------------------------------------------------------------

@app.local_entrypoint()
def main():
    model = LensModel()

    prompts = [
        'A cat holding a sign that says "hello world"',
        "A cinematic mountain lake at sunrise, soft mist, detailed reflections",
    ]

    for i, prompt in enumerate(prompts):
        print(f"Generating [{i}]: {prompt[:60]}...")
        png = model.generate.remote(
            prompt=prompt,
            base_resolution=1440,
            aspect_ratio="1:1",
            num_inference_steps=20,
            guidance_scale=5.0,
            seed=42,
        )
        out_path = f"lens_output_{i}.png"
        with open(out_path, "wb") as f:
            f.write(png)
        print(f"  Saved → {out_path}")


# ---------------------------------------------------------------------------
# NOTES
# ---------------------------------------------------------------------------
# Switching to Lens-Turbo (4-step, faster):
#   Change LensPipeline.from_pretrained("microsoft/Lens", ...) to
#          LensPipeline.from_pretrained("microsoft/Lens-Turbo", ...)
#   And pass: num_inference_steps=4, guidance_scale=1.0
#
# Switching to Lens-Base (no RL, 50 steps):
#   Change repo to "microsoft/Lens-Base", steps=50, cfg=5.0
#
# GPU cost guide (approximate Modal on-demand prices):
#   A10G  (24 GB) — cheaper,  enough for offload mode or lower resolutions
#   A100  (40 GB) — recommended for 1440×1440 without offload
#   H100  (80 GB) — fastest; also unlocks MXFP4 quantized GPT-OSS encoder
#
# HuggingFace secret:
#   Create a Modal secret named "huggingface-secret" with key HF_TOKEN
#   pointing to your HF read token (needed to download gated model files).
#   modal secret create huggingface-secret HF_TOKEN=hf_...