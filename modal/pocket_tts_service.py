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
        "pocket-tts",
        "scipy",
        "fastapi",
        "python-multipart",
        "torch",
        "httpx",
        "huggingface_hub"
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
    voice: str = "alba"  # default voice


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
        from pocket_tts import TTSModel
        print("🚀 Loading Pocket-TTS model...")
        self.tts_model = TTSModel.load_model()
        print(f"✅ Model loaded. Sample rate: {self.tts_model.sample_rate}")

    # -------------------------
    # STANDARD TTS (built-in voices)
    # alba, marius, javert, jean, fantine, cosette, eponine, azelma
    # -------------------------
    @modal.fastapi_endpoint(method="POST")
    async def tts(self, data: TTSRequest):
        import scipy.io.wavfile
        from fastapi.responses import FileResponse

        try:
            voice_state = self.tts_model.get_state_for_audio_prompt(data.voice)

            audio = self.tts_model.generate_audio(voice_state, data.text.strip())

            output_file = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            ).name

            scipy.io.wavfile.write(
                output_file,
                self.tts_model.sample_rate,
                audio.numpy()
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
        import scipy.io.wavfile
        from fastapi.responses import FileResponse

        speaker_path = f"/voices/{data.voice_id}.wav"

        # Reload volume to ensure latest files are visible
        voice_volume.reload()

        if not os.path.exists(speaker_path):
            return {
                "error": f"Voice ID '{data.voice_id}' not found."
            }

        try:
            voice_state = self.tts_model.get_state_for_audio_prompt(speaker_path)

            audio = self.tts_model.generate_audio(voice_state, data.text.strip())

            output_file = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False
            ).name

            scipy.io.wavfile.write(
                output_file,
                self.tts_model.sample_rate,
                audio.numpy()
            )

            return FileResponse(
                output_file,
                media_type="audio/wav",
                filename="speech.wav"
            )

        except Exception as e:
            return {"error": str(e)}