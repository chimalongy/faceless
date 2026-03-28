'use client';

import { useRef } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import SceneAudioPlayer from './SceneAudioPlayer';

export default function SceneAudioCard({ scene, audio, storyId, GenerateButton }) {
  const audioPlayerRef = useRef(null);

  const handleCardClick = (e) => {
    // Don't trigger if clicking on the audio controls themselves
    if (e.target.closest('audio')) return;
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.toggle();
    }
  };

  return (
    <div
      onClick={audio ? handleCardClick : undefined}
      className={`group relative rounded-xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/50 to-fuchsia-50/30 p-4 transition-all ${
        audio ? 'hover:border-purple-300 cursor-pointer hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center">
            {audio ? (
              <FaPlay className="text-white text-lg" />
            ) : (
              <span className="text-white font-bold">{scene.sceneNumber}</span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900">
              Scene {scene.sceneNumber}
            </h4>
            {scene.title && (
              <span className="text-sm text-gray-500">• {scene.title}</span>
            )}
            {audio?.is_ai_generated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                <span className="text-[10px]">✨</span>
                AI Generated
              </span>
            )}
          </div>
          {audio ? (
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {audio.audio_format && (
                <span className="uppercase">{audio.audio_format}</span>
              )}
              {audio.duration_seconds && (
                <span>{Math.floor(audio.duration_seconds / 60)}:{(audio.duration_seconds % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No audio generated yet</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {audio ? (
            <SceneAudioPlayer 
              ref={audioPlayerRef}
              audioUrl={audio.audio_url}
              mimeType={`audio/${audio.audio_format || 'wav'}`}
            />
          ) : (
            GenerateButton
          )}
        </div>
      </div>
    </div>
  );
}
