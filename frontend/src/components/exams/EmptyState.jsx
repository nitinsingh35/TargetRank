import React from 'react';
import { FiInbox } from 'react-icons/fi';

export default function EmptyState({ icon: Icon = FiInbox, title = 'No data found', description = '', action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-slate-800 flex items-center justify-center mb-4">
        <Icon className="text-2xl text-slate-600" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
