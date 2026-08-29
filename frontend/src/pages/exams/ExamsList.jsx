import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiBookOpen, FiArrowRight, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

export default function ExamsList() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
      } catch (err) {
        toast.error('Failed to load exams list.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent-500/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold tracking-wide uppercase">
            <FiAward /> Standard Exam Syllabus Catalog
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Choose Your Career Path
          </h1>
          <p className="text-slate-400 text-lg">
            Review eligibility, key dates, pattern documents, and full syllabus trees for major state and national level examinations.
          </p>
        </div>

        {exams.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-800/80 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-dark-800/80 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <FiBookOpen className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No Exams Available</h3>
            <p className="text-slate-500 text-sm">
              We couldn't locate any active exams. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="glass-card glass-card-hover p-6 bg-dark-900/40 border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-brand-400 uppercase bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded">
                      {exam.conductingBody || 'Government Exam'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{exam.title}</h3>
                  <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    {exam.shortDescription}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-800/60">
                  {exam.eligibility && (
                    <div className="text-xs text-slate-500">
                      <strong className="text-slate-400">Eligibility:</strong> {exam.eligibility}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/exams/${exam.slug}`}
                      className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 group transition-colors"
                    >
                      View Details <FiArrowRight className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                    <Link
                      to={`/exams/${exam._id}/syllabus`}
                      className="text-xs font-semibold bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                    >
                      <FiBookOpen className="text-[11px]" /> Syllabus Tree
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
