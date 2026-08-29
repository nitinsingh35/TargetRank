import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiPlus, FiEdit2, FiTrash2, FiArchive, FiCheckCircle,
  FiBarChart2, FiCopy, FiFilter, FiRefreshCw, FiAlertCircle,
  FiAward, FiPower, FiSearch
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import pyqAPI from '../../api/pyqApi.js';
import examAPI from '../../api/examApi.js';
import AdminSidebar from './AdminSidebar.jsx';

const STATUS_BADGE = {
  draft:          'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  published:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived:       'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const PAPER_TYPE_LABELS = {
  prelims: 'Prelims', mains: 'Mains', tier_1: 'Tier I',
  tier_2: 'Tier II', descriptive: 'Descriptive', interview: 'Interview',
};

export default function PYQPaperManagement() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);

  const [filterExam, setFilterExam] = useState('');
  const [filterPhase, setFilterPhase] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLang, setFilterLang] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadExams();
    loadPapers();
  }, []);

  useEffect(() => {
    if (filterExam) {
      const ex = exams.find(e => e._id === filterExam);
      setPhases(ex?.phases || []);
      setFilterPhase('');
    } else {
      setPhases([]);
      setFilterPhase('');
    }
  }, [filterExam, exams]);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPapers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterExam) params.examId = filterExam;
      if (filterPhase) params.phaseId = filterPhase;
      if (filterYear) params.year = filterYear;
      if (filterType) params.paperType = filterType;
      if (filterLang) params.language = filterLang;
      if (filterStatus) params.status = filterStatus;

      const { data } = await pyqAPI.adminGetPYQPapers(params);
      setPapers(data || []);
    } catch (err) {
      toast.error('Failed to load PYQ papers.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => loadPapers();

  const handleValidate = async (id) => {
    setValidatingId(id);
    try {
      const { data } = await pyqAPI.adminValidatePYQPaper(id);
      if (data.canPublish) {
        toast.success(`Validation passed! ${data.validQuestions}/${data.totalLinked} questions valid.`);
      } else {
        toast.error(`Validation failed: ${data.errors?.length} issue(s) found.`);
      }
    } catch (err) {
      toast.error('Validation request failed.');
    } finally {
      setValidatingId(null);
    }
  };

  const handlePublish = async (id) => {
    setPublishingId(id);
    try {
      await pyqAPI.adminPublishPYQPaper(id);
      toast.success('PYQ Paper published successfully!');
      loadPapers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publish failed.');
    } finally {
      setPublishingId(null);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Archive this PYQ paper? Students will no longer be able to start new attempts.')) return;
    try {
      await pyqAPI.adminArchivePYQPaper(id);
      toast.success('PYQ Paper archived.');
      loadPapers();
    } catch (err) {
      toast.error('Archive failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this PYQ paper? If it has student attempts, it will be archived instead.')) return;
    try {
      const { data } = await pyqAPI.adminDeletePYQPaper(id);
      toast.success(data.archived ? 'PYQ Paper archived (has student attempts).' : 'PYQ Paper deleted.');
      loadPapers();
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await pyqAPI.adminDuplicatePYQPaper(id);
      toast.success('Draft copy created!');
      loadPapers();
    } catch (err) {
      toast.error('Duplicate failed.');
    }
  };

  const filteredPapers = papers.filter(p => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.paperName?.toLowerCase().includes(q) ||
      p.examId?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiAward className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Admin — PYQ Papers</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">PYQ Paper Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage official previous year question papers for all competitive exams.</p>
          </div>
          <Link
            to="/admin/pyq-papers/create"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-600/20"
          >
            <FiPlus /> Create PYQ Paper
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <AdminSidebar active="PYQ Papers" />

          {/* Main */}
          <div className="flex-1 space-y-4">

            {/* Filters */}
            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FiFilter /> Filters
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                <select
                  value={filterPhase}
                  onChange={e => setFilterPhase(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                  disabled={!filterExam}
                >
                  <option value="">All Phases</option>
                  {phases.map(p => (
                    <option key={p._id} value={p._id}>{p.title}</option>
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
                  {Object.entries(PAPER_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
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
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                >
                  <option value="">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
                  <input
                    type="text"
                    placeholder="Search by title, paper name, or exam…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-2"
                  />
                </div>
                <button
                  onClick={handleApplyFilters}
                  className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <FiRefreshCw className="text-xs" /> Apply
                </button>
              </div>
            </div>

            {/* Papers Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center">
                <FiAward className="text-4xl text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold">No PYQ papers found.</p>
                <p className="text-slate-600 text-sm mt-1">Create your first official PYQ paper to get started.</p>
                <Link
                  to="/admin/pyq-papers/create"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold rounded-xl transition-all"
                >
                  <FiPlus /> Create PYQ Paper
                </Link>
              </div>
            ) : (
              <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Paper</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Exam / Year</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Source</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredPapers.map(paper => (
                        <tr key={paper._id} className="hover:bg-dark-800/40 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-white truncate max-w-[200px]">{paper.title}</p>
                            <p className="text-xs text-slate-500">{paper.paperName}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-xs text-slate-300">{paper.examId?.title || '—'}</p>
                            <p className="text-xs text-slate-500">{paper.year}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                              {PAPER_TYPE_LABELS[paper.paperType] || paper.paperType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-white">{paper.questionIds?.length || 0}</span>
                            <span className="text-xs text-slate-500"> / {paper.totalMarks || 0} marks</span>
                          </td>
                          <td className="px-4 py-3">
                            {paper.sourceVerified ? (
                              <span className="flex items-center gap-1 text-xs text-emerald-400">
                                <FiCheckCircle /> Verified
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-amber-400">
                                <FiAlertCircle /> Unverified
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${STATUS_BADGE[paper.status] || STATUS_BADGE.draft}`}>
                              {paper.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                to={`/admin/pyq-papers/${paper._id}/edit`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-brand-600/20 text-slate-400 hover:text-brand-400 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="text-xs" />
                              </Link>
                              <button
                                onClick={() => handleValidate(paper._id)}
                                disabled={validatingId === paper._id}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 transition-colors"
                                title="Validate"
                              >
                                <FiCheckCircle className="text-xs" />
                              </button>
                              {paper.status !== 'published' && paper.status !== 'archived' && (
                                <button
                                  onClick={() => handlePublish(paper._id)}
                                  disabled={publishingId === paper._id}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/20 text-slate-400 hover:text-emerald-400 transition-colors"
                                  title="Publish"
                                >
                                  <FiPower className="text-xs" />
                                </button>
                              )}
                              <Link
                                to={`/admin/pyq-papers/${paper._id}/analytics`}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-400 hover:text-indigo-400 transition-colors"
                                title="Analytics"
                              >
                                <FiBarChart2 className="text-xs" />
                              </Link>
                              <button
                                onClick={() => handleDuplicate(paper._id)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-600/20 text-slate-400 hover:text-amber-400 transition-colors"
                                title="Duplicate"
                              >
                                <FiCopy className="text-xs" />
                              </button>
                              {paper.status !== 'archived' && (
                                <button
                                  onClick={() => handleArchive(paper._id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-orange-600/20 text-slate-400 hover:text-orange-400 transition-colors"
                                  title="Archive"
                                >
                                  <FiArchive className="text-xs" />
                                </button>
                              )}
                              {paper.status === 'draft' && (
                                <button
                                  onClick={() => handleDelete(paper._id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="text-xs" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
                  Showing {filteredPapers.length} paper{filteredPapers.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
