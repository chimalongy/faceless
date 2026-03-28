import modal
import subprocess

# -------------------------------------------------------------------
# Image
# -------------------------------------------------------------------
image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install(
        "git",
        "curl",
        "ffmpeg",
        "libsndfile1",
    )
    .run_commands(
        # Install uv
        "curl -LsSf https://astral.sh/uv/install.sh | sh",

        # Clone ACE-Step
        "git clone https://github.com/ace-step/ACE-Step-1.5.git /opt/ACE-Step-1.5",

        # Install dependencies
        "cd /opt/ACE-Step-1.5 && /root/.local/bin/uv sync",
    )
)

app = modal.App("ace-step", image=image)

# Persistent model storage
volume = modal.Volume.from_name("ace-step-models", create_if_missing=True)
CHECKPOINTS_DIR = "/opt/ACE-Step-1.5/checkpoints"

# -------------------------------------------------------------------
# One-time model download
# Run once with:
#   modal run ace_step_modal.py::download_models
# -------------------------------------------------------------------
@app.function(
    volumes={CHECKPOINTS_DIR: volume},
    timeout=3600,
)
def download_models():
    subprocess.run(
        ["/root/.local/bin/uv", "run", "acestep-download"],
        cwd="/opt/ACE-Step-1.5",
        check=True,
    )

    volume.commit()
    print("✅ Models downloaded and committed to volume!")


# -------------------------------------------------------------------
# Web API Server
# -------------------------------------------------------------------
@app.function(
    gpu="A10G",
    volumes={CHECKPOINTS_DIR: volume},
    scaledown_window=300,
    timeout=600,
)
@modal.web_server(port=8001, startup_timeout=600)
def run_server():
    # IMPORTANT: use run() not Popen()
    subprocess.run(
        [
            "/root/.local/bin/uv",
            "run",
            "acestep-api",
            "--port",
            "8001",
            "--server-name",
            "0.0.0.0",
            "--backend",
            "pt",
        ],
        cwd="/opt/ACE-Step-1.5",
        check=True,
    )


# -------------------------------------------------------------------
# Local helper
# -------------------------------------------------------------------
@app.local_entrypoint()
def main():
    print(
        """
ACE-Step on Modal — Usage:

1️⃣ Download models (RUN ONCE):
   modal run ace_step_modal.py::download_models

2️⃣ Deploy API:
   modal deploy ace_step_modal.py

3️⃣ Your API will be live at:
   https://<your-org>--ace-step-runserver.modal.run

4️⃣ API docs:
   https://<your-org>--ace-step-runserver.modal.run/docs
"""
    )