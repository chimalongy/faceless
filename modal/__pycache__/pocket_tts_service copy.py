import modal
import os
import tempfile
from pydantic import BaseModel

# -----------------------------
# Modal App + Volume
# -----------------------------
app = modal.App("pocket-tts-service")

voice_volume = modal.Volume.from_name(
    "voice-cache",
    create_if_missing=True
)

image = (
    modal.Image.debian_slim(python_version="3.10")
    .pip_install(
        "TTS",
        "fastapi",
        "python-multipart",
        "soundfile",
        "torch",
        "httpx"
    )
)

# -----------------------------
# Request Schemas
# -----------------------------
class CloneRequest(BaseModel):
    voice_id: str
    url: str


class TTSRequest(BaseModel):
    text: str


class TTSCloneRequest(BaseModel):
    text: str
    voice_id: str


# -----------------------------
# TTS Service Class
# -----------------------------
@app.cls(
    image=image,
    gpu="A10G",
    timeout=600,
    volumes={"/voices": voice_volume},
)
class VoiceTTS:

    @modal.enter()
    def load_model(self):
        from TTS.api import TTS
        print("🚀 Loading YourTTS model on GPU...")
        self.tts = TTS(
            "tts_models/multilingual/multi-dataset/your_tts"
        ).to("cuda")
        print("✅ Available speakers:", self.tts.speakers)

    # -------------------------
    # STANDARD TTS
    # -------------------------
    @modal.fastapi_endpoint(method="POST")
    async def tts(self, data: TTSRequest):
        from fastapi.responses import FileResponse

        try:
            output_file = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            ).name

            self.tts.tts_to_file(
                text=data.text.strip(),
                speaker="alba",
                language="en",
                file_path=output_file
            )

            return FileResponse(
                output_file,
                media_type="audio/wav",
                filename="speech.wav"
            )

        except Exception as e:
            return {"error": str(e)}

    # -------------------------
    # CLONE VOICE (Save WAV to Volume)
    # -------------------------
    @modal.fastapi_endpoint(method="POST")
    async def clone(self, data: CloneRequest):
        import httpx

        save_path = f"/voices/{data.voice_id}.wav"

        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.get(
                    data.url,
                    follow_redirects=True
                )

            if response.status_code != 200:
                return {
                    "success": False,
                    "message": f"Download failed: HTTP {response.status_code}",
                    "error": True,
                }

            with open(save_path, "wb") as f:
                f.write(response.content)

            voice_volume.commit()

            return {
                "success": True,
                "message": "Voice cloned successfully",
                "error": False,
            }

        except Exception as e:
            return {
                "success": False,
                "message": f"Internal Error: {str(e)}",
                "error": True,
            }

    # -------------------------
    # TTS USING CLONED VOICE
    # -------------------------
    @modal.fastapi_endpoint(method="POST")
    async def tts_clone(self, data: TTSCloneRequest):
        from fastapi.responses import FileResponse

        speaker_path = f"/voices/{data.voice_id}.wav"

        if not os.path.exists(speaker_path):
            return {
                "error": f"Voice ID '{data.voice_id}' not found."
            }

        try:
            output_file = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            ).name

            self.tts.tts_to_file(
                text=data.text.strip(),
                speaker_wav=speaker_path,
                file_path=output_file,
                language="en",
            )

            return FileResponse(
                output_file,
                media_type="audio/wav",
                filename="speech.wav"
            )

        except Exception as e:
            return {"error": str(e)}