import ffmpeg from "fluent-ffmpeg";
import { FFMPEG_PATH, FFPROBE_PATH } from "./ffmpeg-helper.js";

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

export const getAudioDurationInSeconds = (audioFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata?.format?.duration;
      resolve(duration ?? 0);
    });
  });
};
