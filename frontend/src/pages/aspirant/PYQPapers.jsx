import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiAward, FiSearch, FiFilter, FiClock, FiCheckCircle,
  FiLock, FiChevronRight, FiBookOpen, FiCalendar, FiZap
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

const EXAM_COLORS = {
  'UPSC': 'from-amber-600 to-orange-600',
  'BPSC': 'from-blue-600 to-indigo-600',
  'JPSC': 'from-emerald-600 to-teal-600',
  'UPPSC': 'from-purple-600 to-violet-600',
  'SSC': 'from-rose-600 to-pink-600',
  'Banking': 'from-cyan-600 to-blue-600',
  'Railway': 'from-orange-600 to-amber-600',
  'Defence': 'from-slate-600 to-zinc-600',
};

function getExamColor(examTitle) {
  const key = Object.keys(EXAM_COLORS).find(k => examTitle?.toUpperCase().includes(k));
  return EXAM_COLORS[key] || 'from-brand-600 to-brand-500';
}

const StatusBadge = ({ status, attemptsLeft }) => {
  if (status === 'completed') return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
      <FiCheckCircle className="text-xs" /> Completed
    </span>
  );
  if (status === 'in_progress') return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
      <FiZap className="text-xs" /> In Progress
    </span>
  );
  if (attemptsLeft === 0) return (
    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
      <FiLock className="text-xs" /> Attempts Used
    </span>
  );
  return null;
};

export default function PYQPapers() {
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterExam, setFilterExam] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExams();
    loadPapers();
  }, []);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) { console.error(err); }
  };

  const loadPapers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterExam) params.examId = filterExam;
      if (filterYear) params.year = filterYear;
      if (filterType) params.paperType = filterType;
      if (filterLang) params.language = filterLang;
      if (searchQuery) params.search = searchQuery;
      const { data } = await pyqAPI.getPYQPapers(params);
      setPapers(data || []);
    } catch (err) {
      toast.error('Failed to load PYQ papers.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadPapers();
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiAward className="text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Previous Year Papers</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">PYQ Paper Simulator</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Attempt official previous year question papers in a realistic exam environment.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <RevisionSidebar active="PYQ Papers" />

          <div className="flex-1 space-y-5">

            {/* Filters */}
            <form onSubmit={handleSearch} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <select
                  value={filterExam}
                  onChange={e => setFilterExam(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Exams</option>
                  {exams.map(e => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Year (e.g. 2024)"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                />
                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Types</option>
                  <option value="prelims">Prelims</option>
                  <option value="mains">Mains</option>
                  <option value="tier_1">Tier I</option>
                  <option value="tier_2">Tier II</option>
                </select>
                <select
                  value={filterLang}
                  onChange={e => setFilterLang(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Languages</option>
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by exam name or paper…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-all"
                >
                  Search
                </button>
              </div>
            </form>

            {/* Paper Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : papers.length === 0 ? (
              <div className="text-center py-16">
                <FiAward className="text-4xl text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No papers found.</p>
                <p className="text-slate-600 text-sm mt-1">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {papers.map(paper => {
                  const gradient = getExamColor(paper.examId?.title);
                  const canAttempt = paper.attemptsLeft > 0 && paper.attemptStatus !== 'completed';
                  const attemptId = paper.activeAttemptId;

                  return (
                    <div
                      key={paper._id}
                      className="group bg-dark-900/60 border border-slate-800 hover:border-slate-600 rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-black/30"
                    >
                      {/* Card Header */}
                      <div className={`bg-gradient-to-r ${gradient} p-4 relative overflow-hidden`}>
                        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/5 backdrop-blur-sm" />
                        <div className="absolute -right-2 -bottom-3 w-12 h-12 rounded-full bg-white/5 backdrop-blur-sm" />
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{paper.examId?.title}</p>
                        <h3 className="text-base font-bold text-white mt-0.5 leading-tight line-clamp-2">{paper.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full font-semibold">{paper.year}</span>
                          <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full font-semibold capitalize">{paper.paperType}</span>
                          <span className="text-[10px] bg-white/15 text-white px-2 py-0.5 rounded-full font-semibold capitalize">{paper.language}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <FiBookOpen className="text-[11px]" /> {paper.questionIds?.length || 0}Q
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <FiClock className="text-[11px]" /> {paper.durationMinutes}min
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <FiCalendar className="text-[11px]" /> {paper.year}
                            </div>
                          </div>
                          <StatusBadge status={paper.attemptStatus} attemptsLeft={paper.attemptsLeft} />
                        </div>

                        {paper.negativeMarkingEnabled && (
                          <p className="text-[10px] text-rose-400/80">
                            ⚠ Negative Marking: –{paper.defaultNegativeMarks} per wrong answer
                          </p>
                        )}

                        {/* Attempt info */}
                        {paper.attemptsLeft !== undefined && (
                          <p className="text-[10px] text-slate-500">
                            {paper.attemptsLeft === 0
                              ? 'No more attempts allowed'
                              : `${paper.attemptsLeft} attempt${paper.attemptsLeft !== 1 ? 's' : ''} remaining`}
                          </p>
                        )}

                        {/* Action */}
                        <Link
                          to={
                            attemptId
                              ? `/aspirant/pyq-papers/attempt/${attemptId}`
                              : `/aspirant/pyq-papers/${paper._id}`
                          }
                          className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            canAttempt || attemptId
                              ? `bg-gradient-to-r ${gradient} text-white hover:opacity-90 shadow-lg`
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed pointer-events-none'
                          }`}
                        >
                          <span>
                            {attemptId ? 'Resume Attempt' : paper.attemptStatus === 'completed' ? 'View Results' : 'Start Paper'}
                          </span>
                          <FiChevronRight />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
