import ffmpeg from "fluent-ffmpeg";

export const getAudioDurationInSeconds = (audioFilePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) return reject(err);

      const duration = metadata?.format?.duration;
      resolve(duration ?? 0);
    });
  });
};
