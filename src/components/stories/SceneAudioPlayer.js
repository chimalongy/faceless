'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';

const SceneAudioPlayer = forwardRef(({ audioUrl, mimeType }, ref) => {
  const audioRef = useRef(null);

  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && audioUrl) {
        audioRef.current.play().catch(err => {
          console.error('Audio playback failed:', err);
          console.error('Audio URL:', audioUrl);
        });
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
    toggle: () => {
      if (audioRef.current && audioUrl) {
        if (audioRef.current.paused) {
          audioRef.current.play().catch(err => {
            console.error('Audio playback failed:', err);
            console.error('Audio URL:', audioUrl);
            console.error('MIME type:', mimeType);
          });
        } else {
          audioRef.current.pause();
        }
      }
    }
  }));

  if (!audioUrl) {
    console.warn('SceneAudioPlayer: No audioUrl provided');
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <audio
        ref={audioRef}
        controls
        className="h-9 w-full max-w-[220px] rounded-lg"
        preload="metadata"
        src={audioUrl}
        onError={(e) => {
          console.error('Audio element error:', e);
          console.error('Failed to load audio from:', audioUrl);
          console.error('MIME type:', mimeType);
        }}
      >
        Your browser does not support the audio element.
      </audio>
    </div>
  );
});

SceneAudioPlayer.displayName = 'SceneAudioPlayer';

export default SceneAudioPlayer;