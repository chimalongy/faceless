import fs from "fs";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

// ── Resolve ffmpeg binary path ─────────────────────────────────────────────
let finalFfmpegPath = null;
if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
  finalFfmpegPath = process.env.FFMPEG_PATH;
}
if (!finalFfmpegPath) {
  const workspacePath = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  finalFfmpegPath = fs.existsSync(workspacePath) ? workspacePath : ffmpegStatic;
}

// ── Resolve ffprobe binary path ────────────────────────────────────────────
let finalFfprobePath = null;
if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
  finalFfprobePath = process.env.FFPROBE_PATH;
}
if (!finalFfprobePath) {
  const workspacePath = path.join(
    process.cwd(),
    "node_modules",
    "ffprobe-static",
    "bin",
    process.platform,
    process.arch,
    process.platform === "win32" ? "ffprobe.exe" : "ffprobe"
  );
  finalFfprobePath = fs.existsSync(workspacePath) ? workspacePath : ffprobeStatic.path;
}

export { finalFfmpegPath as FFMPEG_PATH, finalFfprobePath as FFPROBE_PATH };
