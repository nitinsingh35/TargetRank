import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';
import SyllabusViewer from '../shared/SyllabusViewer.jsx';

export default function ExamSyllabus() {
  const { id } = useParams();
  const [exam, setExam] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(id);
        setExam(data.exam);
        setSyllabus(data.syllabus);
      } catch (err) {
        toast.error('Failed to load syllabus tree.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSyllabus();
  }, [id]);

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
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Back navigation */}
        <Link
          to={`/exams/${exam.slug}`}
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to {exam.title} Details
        </Link>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <FiBookOpen className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Syllabus Structure
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Detailed study structure for <strong>{exam.title}</strong>
            </p>
          </div>
        </div>

        {/* Dynamic Interactive Tree Viewer */}
        <SyllabusViewer syllabus={syllabus} />
      </div>
    </div>
  );
}
