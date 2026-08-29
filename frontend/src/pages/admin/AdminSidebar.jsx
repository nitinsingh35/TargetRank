import React from 'react';
import { Link } from 'react-router-dom';
import {
  FiGrid, FiUpload, FiCheckCircle, FiCheckSquare, FiAward,
  FiFileText, FiBarChart2, FiAlertCircle, FiBookOpen, FiShield, FiLayers,
  FiActivity
} from 'react-icons/fi';

export default function AdminSidebar({ active }) {
  const sidebarItems = [
    { label: 'Admin Dashboard',      path: '/admin/dashboard',             icon: FiGrid,        comingSoon: false },
    { label: 'Syllabus Management',  path: '/admin/syllabus',              icon: FiBookOpen,    comingSoon: false },
    { label: 'Question Library',     path: '/admin/question-library',      icon: FiLayers,      comingSoon: false },
    { label: 'Question Import',      path: '/admin/question-import',       icon: FiUpload,      comingSoon: false },
    { label: 'Question Quality',     path: '/admin/question-quality',      icon: FiCheckCircle, comingSoon: false },
    { label: 'Content Health',       path: '/admin/content-health',        icon: FiActivity,    comingSoon: false },
    { label: 'Content Analytics',    path: '/admin/content-analytics',     icon: FiBarChart2,   comingSoon: false },
    { label: 'Mock Tests',           path: '/admin/mock-tests',            icon: FiCheckSquare, comingSoon: false },
    { label: 'PYQ Papers',           path: '/admin/pyq-papers',            icon: FiAward,       comingSoon: false },
    { label: 'Current Affairs',      path: '/admin/current-affairs',       icon: FiFileText,    comingSoon: false },
    { label: 'Tutorials',            path: '/admin/tutorials',             icon: FiBookOpen,    comingSoon: false },
    { label: 'Question Reports',     path: '#',                            icon: FiAlertCircle, comingSoon: true },
  ];

  return (
    <aside className="w-full md:w-64 shrink-0 bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
      <div className="px-3 py-2 flex items-center gap-2">
        <FiShield className="text-rose-450" />
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin Control</h2>
      </div>
      <nav className="space-y-1">
        {sidebarItems.map((item, idx) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          if (item.comingSoon) {
            return (
              <div
                key={idx}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-none"
                title="Coming Soon"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="text-sm shrink-0" />
                  <span>{item.label}</span>
                </div>
                <span className="text-[9px] bg-slate-850 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Soon</span>
              </div>
            );
          }
          return (
            <Link
              key={idx}
              to={item.path}
              className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-rose-500/10 text-white border border-rose-500/20 shadow-md shadow-rose-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-dark-900 border border-transparent'
              }`}
            >
              <Icon className={`text-sm shrink-0 ${isActive ? 'text-rose-455' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
