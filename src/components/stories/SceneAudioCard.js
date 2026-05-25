'use client';

import { useRef } from 'react';
import { FaPlay, FaPause, FaMusic } from 'react-icons/fa';
import SceneAudioPlayer from './SceneAudioPlayer';

export default function SceneAudioCard({ scene, audio, storyId, GenerateButton }) {
  const audioPlayerRef = useRef(null);

  const handleCardClick = (e) => {
    if (e.target.closest('audio')) return;

    if (audioPlayerRef.current) {
      audioPlayerRef.current.toggle();
    }
  };

  return (
    <div
      onClick={audio ? handleCardClick : undefined}
      className={`group relative rounded-xl border transition-all overflow-hidden ${
        audio 
          ? 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)] cursor-pointer' 
          : 'border-gray-100 bg-gray-50/50'
      }`}
    >
      {/* Bottom accent bar on hover */}
      {audio && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left pointer-events-none" />
      )}

      <div className="flex items-center gap-4 p-4">
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            audio 
              ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-md' 
              : 'bg-purple-50'
          }`}>
            {audio ? (
              <FaMusic className="text-white text-sm" />
            ) : (
              <span className="text-purple-500 font-bold text-sm">{scene.sceneNumber}</span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-stone-900 text-sm">
              Scene {scene.sceneNumber}
            </h4>
            {scene.title && (
              <span className="text-xs text-stone-400">• {scene.title}</span>
            )}
            {audio?.is_ai_generated && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 border border-purple-100 text-purple-700 text-[10px] font-semibold">
                <span className="text-[8px]">✨</span>
                AI Generated
              </span>
            )}
          </div>
          {audio ? (
            <div className="flex items-center gap-3 text-xs text-stone-400">
              {audio.audio_format && (
                <span className="uppercase font-medium">{audio.audio_format}</span>
              )}
              {audio.duration_seconds && (
                <span>{Math.floor(audio.duration_seconds / 60)}:{(audio.duration_seconds % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
          ) : (
            <p className="text-xs text-stone-400">No audio generated yet</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
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