'use client';

import { useState } from 'react';
import { FaMagic } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Modal from '../../components/ui/Modal';

export default function GenerateAllImagesButton({ storyId, useCustomLink, defaultLink }) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imageGenLink, setImageGenLink] = useState('');
  const router = useRouter();

  const handleClick = () => {
    if (useCustomLink) {
      setShowModal(true);
    } else {
      handleGenerate(defaultLink || '');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setImageGenLink('');
  };

  const handleGenerate = async (link) => {
    const generationLink = link || imageGenLink;

    if (!storyId) {
      toast.error('Story ID is required');
      return;
    }

    setLoading(true);
    setShowModal(false);
    const loadingToast = toast.loading('Generating images from script...');

    try {
      const res = await fetch('/api/generate/image/generate-all-scene-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          storyId, 
          image_generation_link: generationLink || undefined
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Image generation failed');
      }

      toast.success('Images generated successfully!', { id: loadingToast });
      router.refresh();
    } catch (error) {
      toast.error(error.message, { id: loadingToast });
    } finally {
      setLoading(false);
      setImageGenLink('');
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold text-sm rounded-xl hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all shadow-md shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <FaMagic className="text-xs" />
        <span>{loading ? 'Generating…' : 'Generate All'}</span>
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Image Generation Link">
        <div className="space-y-4">
          <div>
            <label htmlFor="image-gen-link" className="block text-sm font-medium text-stone-700 mb-2">
              Enter the image generation link (optional)
            </label>
            <input
              id="image-gen-link"
              type="url"
              value={imageGenLink}
              onChange={(e) => setImageGenLink(e.target.value)}
              placeholder="https://example.gradio.live (optional)"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            />
            <p className="mt-2 text-xs text-stone-500">
              Leave empty to use the default image generation service
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-xl border border-gray-200 text-stone-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => handleGenerate()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:opacity-90 transition-all text-sm font-semibold shadow-md shadow-blue-500/20"
            >
              Generate
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}