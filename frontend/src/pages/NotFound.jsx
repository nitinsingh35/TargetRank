import React from 'react';
import { Link } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-500/5 rounded-full blur-[100px]" />
      
      <div className="max-w-md w-full glass-card border-slate-800 p-8 text-center space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto text-brand-400">
          <FiAlertCircle className="text-3xl" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-extrabold text-white">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page you are looking for does not exist or has been moved. Use the link below to return home safely.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="btn-secondary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="text-sm" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
