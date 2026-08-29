import React from 'react';
import { FiLoader } from 'react-icons/fi';

export default function PageLoader({ message = 'Loading page...' }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center py-12 px-4">
      <FiLoader className="text-3xl text-brand-500 animate-spin mb-3" />
      <p className="text-sm text-slate-500 font-medium">{message}</p>
    </div>
  );
}
