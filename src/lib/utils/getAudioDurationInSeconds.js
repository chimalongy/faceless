import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";

import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

let finalFfmpegPath = process.env.FFMPEG_PATH;
let finalFfprobePath = process.env.FFPROBE_PATH;

if (!finalFfmpegPath) {
  const workspacePath = path.join(
    process.cwd(),
    "node_modules",
    "ffmpeg-static",
    process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
  );
  if (fs.existsSync(workspacePath)) {
    finalFfmpegPath = workspacePath;
  } else {
    finalFfmpegPath = ffmpegPath;
  }
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
  if (fs.existsSync(workspacePath)) {
    finalFfprobePath = workspacePath;
  } else {
    finalFfprobePath = ffprobePath.path;
  }
}

ffmpeg.setFfmpegPath(finalFfmpegPath);
ffmpeg.setFfprobePath(finalFfprobePath);

export const getAudioDurationInSeconds = (audioFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) return reject(err);

      const duration = metadata?.format?.duration;
      resolve(duration ?? 0);
    });
  });
};
