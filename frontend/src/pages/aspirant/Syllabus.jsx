import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiSearch, FiChevronRight, FiTarget } from 'react-icons/fi';
import { examAPI } from '../../api/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import ExamCard from '../../components/exams/ExamCard.jsx';
import LoadingSpinner from '../../components/exams/LoadingSpinner.jsx';
import EmptyState from '../../components/exams/EmptyState.jsx';
import toast from 'react-hot-toast';

export default function AspirantSyllabus() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const selectedExams = user?.selectedExams || [];

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data } = await examAPI.getExams();
      setExams(data.exams);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast.error('Enter at least 2 characters');
      return;
    }
    try {
      setSearching(true);
      const { data } = await examAPI.searchTopics({ q: query.trim() });
      setSearchResults(data.topics);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const prioritizedExams = [...exams].sort((a, b) => {
    const aMatch = selectedExams.some((e) => a.title.includes(e) || a.slug.includes(e.toLowerCase()));
    const bMatch = selectedExams.some((e) => b.title.includes(e) || b.slug.includes(e.toLowerCase()));
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiTarget className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">My Syllabus</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Syllabus Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and track syllabus for your target exams
            {selectedExams.length > 0 && (
              <span className="text-brand-400"> — {selectedExams.join(', ')}</span>
            )}
          </p>
        </div>

        {/* Topic search */}
        <form onSubmit={handleSearch} className="bg-dark-900/60 border border-slate-800 rounded-2xl p-5">
          <h2 className="font-semibold text-white flex items-center gap-2 mb-3"><FiSearch className="text-accent-400" /> Search Topics Across Exams</h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="e.g. Fundamental Rights, Linear Equations, Seating Arrangement..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
            />
            <button type="submit" disabled={searching} className="btn-primary py-2.5 px-5 text-sm">
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800">
              <p className="text-sm text-slate-400">{searchResults.length} topic{searchResults.length !== 1 ? 's' : ''} found for "{query}"</p>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-80 overflow-y-auto">
              {searchResults.map((topic) => (
                <Link
                  key={topic._id}
                  to={`/exams/${topic.examId?._id || topic.examId}/syllabus`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-dark-800/40 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-brand-300">{topic.title}</p>
                    <p className="text-xs text-slate-500">
                      {topic.examId?.title} → {topic.phaseId?.title} → {topic.subjectId?.title}
                    </p>
                  </div>
                  <FiChevronRight className="text-slate-600 group-hover:text-brand-400" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Exam cards */}
        {loading ? (
          <LoadingSpinner message="Loading exams..." />
        ) : exams.length === 0 ? (
          <EmptyState icon={FiBookOpen} title="No exams available" description="Check back later or contact admin." />
        ) : (
          <>
            <h2 className="text-lg font-bold text-white">All Exams</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {prioritizedExams.map((exam) => (
                <ExamCard key={exam._id} exam={exam} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
