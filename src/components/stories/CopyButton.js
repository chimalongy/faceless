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

  const baseClasses = 'inline-flex items-center gap-2 rounded-xl transition-all border font-medium';
  const sizeClasses =
    size === 'lg'
      ? 'text-sm px-5 py-3'
      : size === 'md'
        ? 'text-sm px-4 py-2.5'
        : 'text-xs px-3 py-2';
  const styles =
    variant === 'primary'
      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent hover:opacity-90 hover:-translate-y-px active:translate-y-0 shadow-md shadow-orange-500/20'
      : 'text-stone-600 hover:text-orange-600 bg-white hover:bg-orange-50 border-gray-200 hover:border-orange-200';

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