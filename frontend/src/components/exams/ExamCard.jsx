import React from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiLayers, FiChevronRight, FiClock } from 'react-icons/fi';

const EXAM_COLORS = {
  'upsc-cse': 'from-purple-500 to-indigo-600',
  'bpsc': 'from-blue-500 to-cyan-600',
  'uppsc': 'from-emerald-500 to-teal-600',
  'ssc-cgl': 'from-amber-500 to-orange-600',
  'banking': 'from-pink-500 to-rose-600',
};

export default function ExamCard({ exam, linkPrefix = '/exams' }) {
  const gradient = EXAM_COLORS[exam.slug] || 'from-brand-500 to-accent-600';

  return (
    <Link
      to={`${linkPrefix}/${exam._id}`}
      className="glass-card glass-card-hover p-6 block group"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
          <FiBookOpen className="text-white text-xl" />
        </div>
        {exam.active === false && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Inactive</span>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-300 transition-colors">{exam.title}</h3>
      <p className="text-sm text-slate-500 line-clamp-2 mb-4">{exam.shortDescription}</p>

      {exam.conductingBody && (
        <p className="text-xs text-slate-600 mb-3">{exam.conductingBody}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1"><FiLayers className="text-brand-400" /> {exam.phaseCount || 0} Phases</span>
        <span className="flex items-center gap-1"><FiBookOpen className="text-accent-400" /> {exam.subjectCount || 0} Subjects</span>
        <span className="flex items-center gap-1"><FiClock className="text-emerald-400" /> {exam.topicCount || 0} Topics</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-800/60">
        <span className="text-xs font-semibold text-brand-400 group-hover:text-brand-300">View Details</span>
        <FiChevronRight className="text-slate-600 group-hover:text-brand-400 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  );
}
