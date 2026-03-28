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
      // Show modal to get custom link
      setShowModal(true);
    } else {
      // Use default link directly (can be empty, API will handle it)
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
          image_generation_link: generationLink || undefined // Send undefined if empty
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
        className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <FaMagic className="group-hover:scale-110 transition-transform" />
        <span>{loading ? 'Generating…' : 'Generate All'}</span>
      </button>

      <Modal isOpen={showModal} onClose={handleCloseModal} title="Image Generation Link">
        <div className="space-y-4">
          <div>
            <label htmlFor="image-gen-link" className="block text-sm font-medium text-gray-700 mb-2">
              Enter the image generation link (optional)
            </label>
            <input
              id="image-gen-link"
              type="url"
              value={imageGenLink}
              onChange={(e) => setImageGenLink(e.target.value)}
              placeholder="https://example.gradio.live (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
            <p className="mt-2 text-xs text-gray-500">
              Leave empty to use the default image generation service
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleGenerate()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
            >
              Generate
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
