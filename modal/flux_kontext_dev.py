import os
import io
import base64
import modal
from pathlib import Path

# Setup persistent model storage volume specifically for Kontext-dev
volume = modal.Volume.from_name("flux-kontext-cache", create_if_missing=True)
CACHE_DIR = "/cache"

# Container setup incorporating standard system-level utilities 
image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install("git")
    .uv_pip_install(
        "diffusers>=0.32.0",
        "transformers",
        "accelerate",
        "torch",
        "fastapi[standard]",
        "pillow",
        "requests"
    )
)

# App instance utilizing the explicit model configuration identifier
app = modal.App("flux-kontext-dev-service", image=image)
MODEL_NAME = "black-forest-labs/FLUX.1-Kontext-dev"

@app.cls(
    gpu="A100-80GB", 
    timeout=600,
    volumes={CACHE_DIR: volume},
    secrets=[modal.Secret.from_name("huggingface-secret")] # Required for gated models
)
class FluxKontextGenerator:
    @modal.enter()
    def load_pipeline(self):
        import torch
        from diffusers import FluxKontextPipeline
        
        print(f"📡 Loading {MODEL_NAME} weights onto 80GB VRAM instance...")
        self.pipe = FluxKontextPipeline.from_pretrained(
            MODEL_NAME,
            torch_dtype=torch.bfloat16,
            cache_dir=CACHE_DIR
        ).to("cuda")
        print("✅ FLUX Kontext Dev Engine live.")

    @modal.method()
    def generate(self, prompt: str, image_bytes: bytes = None, width: int = 1024, height: int = 1024) -> bytes:
        from PIL import Image
        import torch
        
        # Enforce structural multiple-of-16 rule to protect VAE layer processing
        if width % 16 != 0 or height % 16 != 0:
            raise ValueError("❌ Custom canvas width and height parameters must be strictly divisible by 16!")

        kwargs = {
            "prompt": prompt,
            "width": width,
            "height": height,
            "num_inference_steps": 28,
            "guidance_scale": 3.5,
        }

        # Handle Image-to-Image (I2I) flow if conditioning frame bytes are provided
        if image_bytes:
            print(f"🖼️ Running Image-to-Image conditioning step ({width}x{height})...")
            init_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            # Resize source image smoothly to clean layout targets
            init_image = init_image.resize((width, height), Image.Resampling.LANCZOS)
            kwargs["image"] = init_image
        else:
            print(f"✍️ Running Text-to-Image generation step ({width}x{height})...")

        # Execute generation tracking block
        output_image = self.pipe(**kwargs).images[0]
        
        buffer = io.BytesIO()
        output_image.save(buffer, format="PNG")
        return buffer.getvalue()


# 🚀 Unified Endpoint: Auto-detects T2I vs I2I based on data layout payloads
@app.function(image=image)
@modal.fastapi_endpoint(method="POST", label="flux-process")
def api_endpoint(data: dict):
    prompt = data.get("prompt", "")
    image_url = data.get("image_url", None)
    
    # Extract resolution parameters, defaulting back to Standard Square
    width = int(data.get("width", 1024))
    height = int(data.get("height", 1024))
    
    # Process base64 payload configurations
    image_bytes = None
    if image_url and "," in image_url:
        try:
            raw_encoded = image_url.split(",")[1]
            image_bytes = base64.b64decode(raw_encoded)
        except Exception as e:
            print(f"⚠️ Failed decoding base64 image sequence: {str(e)}")

    generator = FluxKontextGenerator()
    generated_png_bytes = generator.generate.remote(
        prompt=prompt, 
        image_bytes=image_bytes, 
        width=width, 
        height=height
    )
    
    base64_output = base64.b64encode(generated_png_bytes).decode("utf-8")
    return {
        "status": "success",
        "width": width,
        "height": height,
        "image": f"data:image/png;base64,{base64_output}"
    }