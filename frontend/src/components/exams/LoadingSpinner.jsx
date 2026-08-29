import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-10 h-10' : size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <FiLoader className={`${sizeClass} text-brand-400 animate-spin`} />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
