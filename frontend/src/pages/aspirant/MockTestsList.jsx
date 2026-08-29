import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiAward, FiBookOpen, FiClock, FiHelpCircle, FiArrowRight, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';
import examAPI from '../../api/examApi.js';

export default function MockTestsList() {
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch initial exam streams and test lists
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data: examData } = await examAPI.getExams();
        setExams(examData);
      } catch (err) {
        console.error(err);
      }
    };
    bootstrap();
  }, []);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      const { data } = await testAPI.getMockTests(params);
      setTests(data);
    } catch (err) {
      toast.error('Failed to load mock tests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [selectedExamId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Mock Test Series</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Simulated Examination Suite</h1>
            <p className="text-slate-500 text-sm mt-0.5">Attempt timed full mocks, daily quizzes, and track performance scores.</p>
          </div>

          <div className="flex items-center gap-3 self-start shrink-0">
            <span className="text-xs text-slate-500 font-semibold">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
            >
              <option value="">All Exams</option>
              {exams.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic List */}
        {tests.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850">
            <FiHelpCircle className="text-4xl text-slate-650 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No active mock tests</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">
              There are no simulated mock tests published for this exam stream. Please check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <div
                key={test._id}
                className="glass-card p-6 bg-dark-900/40 border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {test.testType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                      <FiClock /> {test.durationMinutes} mins
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{test.title}</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Sourced template for: <span className="text-slate-400 font-semibold">{test.examId?.title || 'Competitive Exam'}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-slate-500">Marks: <span className="text-slate-300 font-bold">{test.totalMarks}</span></p>
                    <p className="text-slate-500">Questions: <span className="text-slate-300 font-bold">{test.questions?.length || 0}</span></p>
                  </div>

                  <Link
                    to={`/aspirant/mock-tests/${test._id}/instructions`}
                    className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1 group"
                  >
                    Take Test <FiArrowRight className="group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
