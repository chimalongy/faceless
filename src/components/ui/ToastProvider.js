'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'glass-panel text-sm font-medium',
        style: {
          background: '#fff',
          color: '#1f2937',
          border: '1px solid #fed7aa', // orange-200
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: '#ecfdf5',
          },
          style: {
            background: '#fff',
            border: '1px solid #10B981',
          },
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: '#fef2f2',
          },
          style: {
            background: '#fff',
            border: '1px solid #EF4444',
          },
        },
      }}
    />
  );
}
