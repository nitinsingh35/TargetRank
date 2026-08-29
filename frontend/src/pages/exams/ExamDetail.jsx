import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiBookOpen, FiCalendar, FiUsers, FiFileText,
  FiChevronRight, FiLayers, FiClock
} from 'react-icons/fi';
import { examAPI } from '../../api/api.js';
import LoadingSpinner from '../../components/exams/LoadingSpinner.jsx';
import toast from 'react-hot-toast';

export default function ExamDetail() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExam();
  }, [id]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const { data } = await examAPI.getExamById(id);
      setExam(data.exam);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Exam not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading exam details..." />;
  if (!exam) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Exam not found</p>
          <Link to="/exams" className="btn-primary inline-flex">Back to Exams</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back link */}
        <Link to="/exams" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <FiArrowLeft /> Back to Exams
        </Link>

        {/* Hero card */}
        <div className="glass-card p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-xl">
                <FiBookOpen className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white">{exam.title}</h1>
                <p className="text-slate-400 mt-1">{exam.conductingBody}</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed">{exam.shortDescription}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800">
              <div className="text-center">
                <p className="text-2xl font-extrabold text-brand-400">{exam.phaseCount}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1"><FiLayers /> Phases</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-accent-400">{exam.subjectCount}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1"><FiBookOpen /> Subjects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-extrabold text-emerald-400">{exam.topicCount}</p>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1"><FiClock /> Topics</p>
              </div>
            </div>

            <Link to={`/exams/${id}/syllabus`} className="btn-primary mt-6 w-full sm:w-auto">
              View Full Syllabus <FiChevronRight />
            </Link>
          </div>
        </div>

        {/* Details sections */}
        {exam.fullDescription && (
          <div className="glass-card p-6">
            <h2 className="font-bold text-white flex items-center gap-2 mb-3"><FiFileText className="text-brand-400" /> About This Exam</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{exam.fullDescription}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {exam.eligibility && (
            <div className="glass-card p-6">
              <h2 className="font-bold text-white flex items-center gap-2 mb-3"><FiUsers className="text-accent-400" /> Eligibility</h2>
              <p className="text-slate-400 text-sm">{exam.eligibility}</p>
            </div>
          )}
          {exam.examPattern && (
            <div className="glass-card p-6">
              <h2 className="font-bold text-white flex items-center gap-2 mb-3"><FiLayers className="text-emerald-400" /> Exam Pattern</h2>
              <p className="text-slate-400 text-sm">{exam.examPattern}</p>
            </div>
          )}
        </div>

        {exam.importantDates?.length > 0 && (
          <div className="glass-card p-6">
            <h2 className="font-bold text-white flex items-center gap-2 mb-4"><FiCalendar className="text-amber-400" /> Important Dates</h2>
            <div className="space-y-3">
              {exam.importantDates.map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-dark-800/60 rounded-xl border border-slate-800">
                  <span className="text-sm text-slate-300">{d.label}</span>
                  <span className="text-sm font-semibold text-brand-400">{d.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
