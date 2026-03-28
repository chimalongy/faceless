'use client';

import { useState } from 'react';
import { FaCopy, FaCheck } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

export default function CopyButton({
  text,
  variant = 'secondary',
  label,
  icon,
  size = 'sm',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text) {
      toast.error('Nothing to copy');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
      toast.error('Failed to copy');
    }
  };

  const baseClasses = 'flex items-center gap-2 rounded-lg transition-colors border';
  const sizeClasses =
    size === 'lg'
      ? 'text-base px-5 py-3'
      : size === 'md'
        ? 'text-sm px-4 py-2.5'
        : 'text-sm px-3 py-2';
  const styles =
    variant === 'primary'
      ? 'bg-gray-900 text-white hover:bg-gray-800 border-gray-900'
      : 'text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border-gray-200';

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`${baseClasses} ${sizeClasses} ${styles}`}
    >
      {copied ? <FaCheck className="text-emerald-500" /> : (icon ?? <FaCopy />)}
      <span>{copied ? 'Copied' : label}</span>
    </button>
  );
}


