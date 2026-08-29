import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen, FiCalendar, FiBriefcase, FiAward, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

export default function ExamDetails() {
  const { id: slug } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const { data } = await examAPI.getExamBySlug(slug);
        setExam(data);
      } catch (err) {
        toast.error('Failed to load exam details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExam();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-[#030712] py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Exam Not Found</h2>
        <Link to="/exams" className="text-brand-400 hover:underline flex items-center justify-center gap-2">
          <FiArrowLeft /> Back to Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Back Link */}
        <Link
          to="/exams"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Exams List
        </Link>

        {/* Header Block */}
        <div className="glass-card p-8 bg-dark-900/40 border-slate-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 text-brand-500/20">
            <FiAward className="text-7xl" />
          </div>

          <span className="text-[10px] font-bold text-brand-400 uppercase bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-full">
            {exam.conductingBody || 'National Level'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
            {exam.title}
          </h1>
          <p className="text-slate-400 text-sm mt-3 leading-relaxed max-w-2xl">
            {exam.shortDescription}
          </p>
        </div>

        {/* Content Tabs / Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main info cards */}
          <div className="md:col-span-2 space-y-6">
            {/* Description */}
            {exam.fullDescription && (
              <div className="glass-card p-6 border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FiFileText className="text-brand-400" /> Exam Overview
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                  {exam.fullDescription}
                </p>
              </div>
            )}

            {/* Pattern */}
            {exam.examPattern && (
              <div className="glass-card p-6 border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FiAward className="text-accent-400" /> Exam Pattern
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                  {exam.examPattern}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar cards */}
          <div className="space-y-6">
            {/* Action card */}
            <div className="glass-card p-6 border-brand-500/20 bg-brand-950/5 text-center">
              <h4 className="text-sm font-bold text-white mb-2">Explore the Syllabus</h4>
              <p className="text-slate-500 text-xs mb-4">
                Analyze complete exam phases, subjects, and topics to structure your studies.
              </p>
              <Link
                to={`/exams/${exam._id}/syllabus`}
                className="w-full btn-primary py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <FiBookOpen className="text-sm" /> View Syllabus Tree
              </Link>
            </div>

            {/* Eligibility */}
            {exam.eligibility && (
              <div className="glass-card p-6 border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <FiBriefcase className="text-purple-400" /> Eligibility Criteria
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {exam.eligibility}
                </p>
              </div>
            )}

            {/* Dates */}
            {exam.importantDates && exam.importantDates.length > 0 && (
              <div className="glass-card p-6 border-slate-800/80">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <FiCalendar className="text-emerald-400" /> Important Dates
                </h3>
                <div className="space-y-3">
                  {exam.importantDates.map((date, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{date.title}</span>
                      <span className="font-semibold text-slate-300">{date.dateString}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
