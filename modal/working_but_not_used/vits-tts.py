import modal
import uuid

# -------------------- Model --------------------
MODEL_NAME = "tts_models/en/vctk/vits"

# -------------------- App --------------------
app = modal.App("vits-tts-api")

# Persistent volume for model cache
model_cache_volume = modal.Volume.from_name(
    "tts-model-cache",
    create_if_missing=True
)

# -------------------- Image --------------------
image = (
    modal.Image.debian_slim(python_version="3.10")
    # Install ffmpeg (for audio) + espeak (phonemizer)
    .apt_install("ffmpeg", "espeak")
    .pip_install(
        "torch",
        "TTS",
        "fastapi",
        "uvicorn",
        "soundfile"
    )
)

# -------------------- TTS Service --------------------
@app.cls(
    gpu="T4",  # remove or change if you want CPU only
    image=image,
    timeout=600,
    volumes={
        # Coqui model cache directory
        "/root/.local/share/tts": model_cache_volume
    },
)
class TTSService:

    # -------------------- Startup --------------------
    @modal.enter()
    def load_model(self):
        from TTS.api import TTS
        import torch

        print(f"🚀 Loading {MODEL_NAME}...")

        # Load the model
        self.tts = TTS(model_name=MODEL_NAME, progress_bar=True)

        # Move to GPU if available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tts.to(self.device)

        # Default built-in speaker
        self.default_speaker = "p326"

        print(f"✅ Model loaded on {self.device}")
        print(f"🎤 Default speaker: {self.default_speaker}")

    # -------------------- Speak Endpoint --------------------
    @modal.fastapi_endpoint(method="POST")
    async def speak(self, data: dict):
        text = data.get("text")

        if not text:
            return {
                "success": False,
                "message": "text is required"
            }

        try:
            out = f"/tmp/{uuid.uuid4()}.wav"

            self.tts.tts_to_file(
                text=text,
                speaker=self.default_speaker,
                file_path=out
            )

            from fastapi.responses import FileResponse
            return FileResponse(out, media_type="audio/wav")

        except Exception as e:
            return {
                "success": False,
                "message": "Speech generation failed",
                "data": {"error": str(e)}
            }