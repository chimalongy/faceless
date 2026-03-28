import modal
import io
from pydantic import BaseModel

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("git")
    .pip_install("uv")
    .run_commands(
        "git clone https://github.com/canopyai/Orpheus-TTS.git /opt/Orpheus-TTS",
        "uv pip install --system /opt/Orpheus-TTS/orpheus_tts_pypi",
        "uv pip install --system vllm==0.7.3",
        "uv pip install --system huggingface_hub numpy scipy pydantic",
    )
)

app = modal.App("orpheus-tts", image=image)

volume = modal.Volume.from_name("orpheus-tts-weights", create_if_missing=True)
MODEL_DIR = "/model-cache"
MODEL_NAME = "canopylabs/orpheus-tts-0.1-finetune-prod"


class TTSRequest(BaseModel):
    text: str = ""
    voice: str = "tara"


@app.cls(
    gpu="A10G",
    volumes={MODEL_DIR: volume},
    secrets=[modal.Secret.from_name("huggingface-secret")],
    scaledown_window=300,
)
class OrpheusTTS:

    @modal.enter()
    def load_model(self):
        import sys
        sys.path.insert(0, "/opt/Orpheus-TTS/orpheus_tts_pypi")
        from orpheus_tts import OrpheusModel
        self.model = OrpheusModel(
            model_name=MODEL_NAME,
            max_model_len=8192,
        )
        print("✅ Orpheus model loaded!")

    @modal.method()
    def synthesize(self, text: str, voice: str = "tara") -> bytes:
        import wave

        syn_tokens = self.model.generate_speech(
            prompt=text,
            voice=voice,
            repetition_penalty=1.1,
        )

        # ✅ Chunks are raw PCM bytes — write directly, do NOT numpy concatenate
        buffer = io.BytesIO()
        with wave.open(buffer, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(24000)
            for audio_chunk in syn_tokens:
                wf.writeframes(audio_chunk)

        buffer.seek(0)
        return buffer.read()

    @modal.fastapi_endpoint(method="POST")
    def api(self, request: TTSRequest) -> dict:
        import base64

        if not request.text:
            return {"error": "No text provided"}

        wav_bytes = self.synthesize.local(request.text, request.voice)
        audio_b64 = base64.b64encode(wav_bytes).decode("utf-8")

        return {
            "audio_base64": audio_b64,
            "voice": request.voice,
            "format": "wav",
            "sample_rate": 24000,
        }


@app.local_entrypoint()
def main():
    tts = OrpheusTTS()
    wav_bytes = tts.synthesize.remote(
        "Hello! This is Orpheus TTS running on Modal.",
        voice="tara"
    )
    with open("output.wav", "wb") as f:
        f.write(wav_bytes)
    print("✅ Saved output.wav")