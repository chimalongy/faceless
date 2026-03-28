import modal
import uuid

MODEL_NAME = "tts_models/en/vctk/vits"

app = modal.App("vits-tts-api")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg")
    .pip_install(
        "torch",
        "TTS",
        "fastapi",
        "uvicorn",
        "soundfile"
    )
)

@app.cls(
    gpu="T4",  # Remove this line if you want CPU only
    image=image,
    timeout=600,
)
class TTSService:

    # -------------------- Startup --------------------
    @modal.enter()
    def load_model(self):
        from TTS.api import TTS
        import torch

        print(f"🚀 Loading {MODEL_NAME}...")

        self.tts = TTS(model_name=MODEL_NAME, progress_bar=True)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tts.to(self.device)

        # Choose a default built-in speaker
        self.default_speaker = "p225"

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