'use client';

import { createStory } from "../../../../../../../../../lib/actions";
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { useState } from 'react';
import { FaArrowLeft, FaSpinner, FaCloudUploadAlt, FaMagic } from 'react-icons/fa';
import { get_channel_type } from "../../../../../../../../client_lib";
import axios from "axios";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full md:w-auto px-8"
    >
      {pending ? (
        <span className="flex items-center gap-2">
          <FaSpinner className="animate-spin" /> Creating Story & Uploading...
        </span>
      ) : (
        'Create Story'
      )}
    </button>
  );
}

export default function NewStoryPage() {
  const params = useParams();
  const { channelId, topicId } = params;

  const [previews, setPreviews] = useState([]);
  let pathname = usePathname()
  let channel_type = get_channel_type(channelId, pathname)

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Create preview URLs
    const newPreviews = files.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setPreviews(newPreviews);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link href={`/dashboard/channels/${channelId}/${channel_type}/topics/${topicId}`} className="text-gray-500 hover:text-gray-900 flex items-center gap-2 mb-6">
        <FaArrowLeft /> Back to Topic
      </Link>

      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
          Create New Story
        </h1>
        <p className="text-gray-500 mt-1">Draft your story and upload visuals.</p>
        <button className="border p-3 rounded-2xl"
          onClick={async () => {
            let url = 'https://me-chimaobi--whisper-api-optimized-whisperservice-transcribe.modal.run'

            const result = await axios.post(url, { url: "https://wilsaxbknhdsuwhyhzyh.supabase.co/storage/v1/object/public/facelessstudio/generated/completed_stories/comfort_kills.mp4" })
            console.log(result.data)
          }}>
          Test wishiper
        </button>
      </div>

      <div className="glass-panel p-8 rounded-xl border border-orange-100 shadow-sm">
        <form action={createStory} className="space-y-8">
          <input type="hidden" name="channelId" value={channelId} />
          <input type="hidden" name="topicId" value={topicId} />
          <input type="hidden" name="channel_type" value={channel_type} />

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Story Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              placeholder="e.g. The Mystery of the Pyramids"
              className="input-field"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              Story Content / Notes
            </label>
            <textarea
              id="content"
              name="content"
              rows={8}
              placeholder="Write your story draft here or paste your research notes..."
              className="input-field resize-none font-mono text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="social_media_target" className="text-sm font-medium text-gray-700">
              Social Media Target
            </label>
            <select
              id="social_media_target"
              name="social_media_target"
              className="input-field"
            >
              <option value="tiktok">TikTok / Reels / Shorts (9:16)</option>
              <option value="youtube">YouTube (16:9)</option>
              <option value="instagram_square">Instagram Square (1:1)</option>
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 block">
              Story Images
            </label>

            <div className="border-2 border-dashed border-orange-200 rounded-xl p-8 text-center hover:border-orange-400 transition-colors bg-orange-50/50">
              <input
                type="file"
                id="images"
                name="images"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-2">
                <FaCloudUploadAlt className="text-4xl text-orange-400" />
                <span className="text-gray-700 font-medium">Click to upload images</span>
                <span className="text-gray-500 text-sm">SVG, PNG, JPG or GIF (max. 5MB)</span>
              </label>
            </div>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-orange-100 bg-gray-100">
                    <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <FaMagic className="text-purple-500" />
              <span>AI Image Generation coming soon...</span>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
