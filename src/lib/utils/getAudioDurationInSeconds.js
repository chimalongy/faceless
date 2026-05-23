import ffmpeg from "fluent-ffmpeg";

import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);
export const getAudioDurationInSeconds = (audioFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) return reject(err);

      const duration = metadata?.format?.duration;
      resolve(duration ?? 0);
    });
  });
};
