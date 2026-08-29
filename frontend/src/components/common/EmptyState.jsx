import React from 'react';
import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ 
  title = 'No Data Available', 
  message = 'We couldn\'t find any records matching your request.', 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="glass-card border-slate-850 p-16 text-center space-y-4 max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-dark-950 border border-slate-800 flex items-center justify-center mx-auto">
        <FiInbox className="text-2xl text-slate-500" />
      </div>
      <div>
        <h3 className="text-base font-bold text-white">{title}</h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{message}</p>
      </div>
      {actionLabel && onAction && (
        <button 
          onClick={onAction} 
          className="btn-primary text-xs px-5 py-2.5 font-semibold"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
