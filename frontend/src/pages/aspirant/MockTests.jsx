import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiClock, FiBookOpen, FiAward, FiAlertCircle, 
  FiArrowRight, FiActivity, FiFilter, FiDollarSign, FiCalendar 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';
import examAPI from '../../api/examApi.js';

export default function MockTests() {
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedPremium, setSelectedPremium] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('active'); // active, upcoming

  useEffect(() => {
    bootstrap();
  }, []);

  useEffect(() => {
    fetchMockTests();
  }, [selectedExamId, selectedPhaseId, selectedCategory, selectedLanguage, selectedPremium, selectedStatusFilter]);

  const bootstrap = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExamChange = async (examId) => {
    setSelectedExamId(examId);
    setSelectedPhaseId('');
    setPhases([]);
    if (!examId) return;

    try {
      const { data } = await examAPI.getExamPhases(examId);
      setPhases(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMockTests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      if (selectedPhaseId) params.phaseId = selectedPhaseId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedPremium) params.isPremium = selectedPremium;
      if (selectedStatusFilter) params.statusFilter = selectedStatusFilter;

      const { data } = await mockTestAPI.getMockTests(params);
      if (data.success) {
        setTests(data.mockTests || []);
      }
    } catch (err) {
      toast.error('Failed to load mock tests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiActivity className="text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">TargetRank Mock Suite</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Simulated Examination Console</h1>
            <p className="text-slate-500 text-sm mt-0.5">Attempt timed exam patterns under real guidelines, track cohort ranks, and review detailed scorecards.</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/aspirant/mock-test-history"
              className="px-4 py-2.5 bg-dark-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
            >
              My Mock History
            </Link>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-5 bg-dark-900/40 border-slate-850 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Exam filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">All Exams</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>

          {/* Phase filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Phase</label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
              disabled={!selectedExamId}
            >
              <option value="">All Phases</option>
              {phases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          {/* Category filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="full_length">Full Length</option>
              <option value="sectional">Sectional</option>
              <option value="subject_wise">Subject Wise</option>
              <option value="topic_wise">Topic Wise</option>
              <option value="pyq_paper">PYQ Paper</option>
              <option value="current_affairs">Current Affairs</option>
            </select>
          </div>

          {/* Language filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">All Languages</option>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>

          {/* Cost filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tier</label>
            <select
              value={selectedPremium}
              onChange={(e) => setSelectedPremium(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">All Tiers</option>
              <option value="false">Free</option>
              <option value="true">Premium Only</option>
            </select>
          </div>

          {/* Status filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Availability</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="active">Available Now</option>
              <option value="upcoming">Upcoming tests</option>
            </select>
          </div>
        </div>

        {/* Dynamic tests cards list */}
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : tests.length === 0 ? (
          <div className="glass-card p-16 text-center border-slate-850 space-y-3">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto" />
            <h3 className="text-white font-bold text-sm">No Mock Tests Available</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">There are no mock test templates matching your selected filter guidelines. Try adjusting filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => {
              const now = new Date();
              const hasAvailableFrom = test.availableFrom && now < new Date(test.availableFrom);
              const isExpired = test.availableUntil && now > new Date(test.availableUntil);

              return (
                <div 
                  key={test._id} 
                  className="glass-card p-6 bg-dark-900/40 border-slate-800/80 hover:border-slate-750 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center gap-2 mb-3">
                      <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {test.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-semibold">
                        <FiClock /> {test.durationMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-white line-clamp-2 leading-snug">{test.title}</h3>
                    <p className="text-[11px] text-slate-500 font-semibold mt-1.5 uppercase tracking-wide">
                      {test.examId?.title || 'Exam'}
                    </p>

                    <div className="grid grid-cols-3 gap-2 bg-[#030712]/50 border border-slate-850 p-2.5 rounded-lg text-center mt-4">
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Questions</p>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{test.totalQuestions}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Marks</p>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{test.totalMarks}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-medium">Passing</p>
                        <p className="text-xs font-black text-slate-200 mt-0.5">{test.passingMarks}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between gap-4">
                    <div className="text-[10px] font-semibold text-slate-500 space-y-0.5">
                      {test.isPremium ? (
                        <p className="text-amber-400 flex items-center"><FiDollarSign /> {test.price} Premium</p>
                      ) : (
                        <p className="text-slate-400">Free Access</p>
                      )}
                      <p className="capitalize">Lang: {test.language}</p>
                    </div>

                    <div>
                      {hasAvailableFrom ? (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 select-none">
                          <FiCalendar /> Upcoming
                        </span>
                      ) : isExpired ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg select-none">
                          Closed
                        </span>
                      ) : test.hasActiveAttempt ? (
                        <Link
                          to={`/aspirant/mock-tests/attempt/${test.activeAttemptId}`}
                          className="btn-primary py-2 px-3 text-xs bg-amber-600 hover:bg-amber-500 border-amber-600 rounded-lg font-bold"
                        >
                          Resume
                        </Link>
                      ) : test.isAttemptLimitReached ? (
                        <Link
                          to={`/aspirant/mock-tests/${test._id}`}
                          className="btn-secondary py-2 px-3 text-xs border-slate-800 rounded-lg font-bold"
                        >
                          Completed
                        </Link>
                      ) : (
                        <Link
                          to={`/aspirant/mock-tests/${test._id}`}
                          className="btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1 group rounded-lg"
                        >
                          View details <FiArrowRight className="group-hover:translate-x-0.5 transition-all text-xs" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
