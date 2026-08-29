import React, { useState, useEffect } from 'react';
import { FiBookOpen, FiBookmark, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';
import SyllabusViewer from '../shared/SyllabusViewer.jsx';

export default function MentorSyllabus() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load exams list.');
        console.error(err);
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchSyllabus = async () => {
      setLoadingSyllabus(true);
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        setSyllabus(data.syllabus);
      } catch (err) {
        toast.error('Failed to load syllabus.');
        console.error(err);
      } finally {
        setLoadingSyllabus(false);
      }
    };
    fetchSyllabus();
  }, [selectedExamId]);

  if (loadingExams) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiBookmark className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Mentor Curriculum Guide</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Syllabus Curriculum Reference</h1>
            <p className="text-slate-500 text-xs mt-0.5">Verify topic frameworks to design matching mock tests and content planners.</p>
          </div>

          {/* Exam Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs text-slate-500 font-medium">Exam Stream:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all font-semibold"
            >
              {exams.map((e) => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic content rendering */}
        {selectedExamId === '' ? (
          <div className="glass-card p-12 text-center border-slate-800/80">
            <h3 className="text-sm font-bold text-white mb-2">No Active Exams Seeding Found</h3>
          </div>
        ) : loadingSyllabus ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <SyllabusViewer syllabus={syllabus} />
        )}
      </div>
    </div>
  );
}
