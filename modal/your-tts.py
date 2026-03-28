import modal
import os
import uuid
import json
import requests
import subprocess
from datetime import datetime

# The registry name for YourTTS
MODEL_NAME = "tts_models/multilingual/multi-dataset/your_tts"

app = modal.App("your-tts-api")

# Volumes
voice_volume = modal.Volume.from_name("voice-cache", create_if_missing=True)
model_cache_volume = modal.Volume.from_name("tts-model-cache", create_if_missing=True)

# Image
image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install("ffmpeg")
    .pip_install(
        "torch",
        "TTS",
        "requests",
        "fastapi",
        "uvicorn",
        "soundfile"
    )
)

@app.cls(
    gpu="T4",
    image=image,
    timeout=900,
    volumes={
        "/voices": voice_volume,
        "/root/.local/share/tts": model_cache_volume
    },
)
class VoiceCloner:

    # -------------------- Startup --------------------
    @modal.enter()
    def load_model(self):
        from TTS.api import TTS
        import torch

        print(f"🚀 Loading {MODEL_NAME}...")

        self.tts = TTS(model_name=MODEL_NAME, progress_bar=True)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tts.to(self.device)

        print(f"✅ Model loaded on {self.device}")

    # -------------------- Helpers --------------------
    def normalize_audio(self, input_path, output_path):
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path,
            "-ar", "22050", "-ac", "1", output_path
        ], check=True)

    def download_audio(self, url):
        raw_id = str(uuid.uuid4())
        raw = f"/tmp/{raw_id}_raw"
        wav = f"/tmp/{raw_id}.wav"

        r = requests.get(url, timeout=60)
        r.raise_for_status()

        with open(raw, "wb") as f:
            f.write(r.content)

        self.normalize_audio(raw, wav)
        return wav

    # -------------------- Voice Cache --------------------
    def voice_dir(self, voice_id):
        return f"/voices/{voice_id}"

    def voice_exists(self, voice_id):
        return os.path.exists(self.voice_dir(voice_id))

    def save_voice(self, voice_id, wav_path):
        os.makedirs(self.voice_dir(voice_id), exist_ok=True)

        speaker_path = f"{self.voice_dir(voice_id)}/speaker.wav"
        meta_path = f"{self.voice_dir(voice_id)}/metadata.json"

        subprocess.run(["cp", wav_path, speaker_path])

        with open(meta_path, "w") as f:
            json.dump({
                "voice_id": voice_id,
                "created_at": datetime.utcnow().isoformat()
            }, f)

        voice_volume.commit()

    def load_voice(self, voice_id):
        speaker = f"{self.voice_dir(voice_id)}/speaker.wav"
        if not os.path.exists(speaker):
            raise FileNotFoundError(f"Voice '{voice_id}' not found")
        return speaker

    # -------------------- API --------------------

    @modal.fastapi_endpoint(method="POST")
    async def clone(self, data: dict):
        audio_url = data.get("audio_url")
        voice_id = data.get("voice_id")

        if not audio_url or not voice_id:
            return {
                "success": False,
                "message": "audio_url and voice_id are required"
            }

        if self.voice_exists(voice_id):
            return {
                "success": False,
                "message": f"Voice '{voice_id}' already exists",
                "data": {"voice_id": voice_id}
            }

        try:
            speaker_wav = self.download_audio(audio_url)
            self.save_voice(voice_id, speaker_wav)
        except Exception as e:
            return {
                "success": False,
                "message": "Voice cloning failed",
                "data": {"error": str(e)}
            }

        return {
            "success": True,
            "message": "Voice cloned successfully",
            "data": {
                "voice_id": voice_id,
                "created_at": datetime.utcnow().isoformat()
            }
        }

    # -------------------- Speak --------------------
    @modal.fastapi_endpoint(method="POST")
    async def speak(self, data: dict):
        voice_id = data.get("voice_id")
        text = data.get("text")

        if not voice_id or not text:
            return {
                "success": False,
                "message": "voice_id and text are required"
            }

        try:
            speaker_wav = self.load_voice(voice_id)
        except Exception:
            return {
                "success": False,
                "message": f"Voice '{voice_id}' not found"
            }

        try:
            out = f"/tmp/{uuid.uuid4()}.wav"

            self.tts.tts_to_file(
                text=text,
                speaker_wav=speaker_wav,
                language="en",
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

    # -------------------- Get Voices --------------------
    @modal.fastapi_endpoint(method="GET")
    async def get_voices(self):
        voices = []

        try:
            if os.path.exists("/voices"):
                for v in os.listdir("/voices"):
                    meta = f"/voices/{v}/metadata.json"
                    if os.path.exists(meta):
                        with open(meta) as f:
                            voices.append(json.load(f))

            return {
                "success": True,
                "message": "Voices fetched successfully",
                "data": {
                    "voices": voices,
                    "count": len(voices)
                }
            }

        except Exception as e:
            return {
                "success": False,
                "message": "Failed to fetch voices",
                "data": {"error": str(e)}
            }
