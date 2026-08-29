import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiPlus, FiSearch, FiSliders, FiEdit2, FiTrash2, FiPlay, 
  FiFileText, FiAward, FiEye, FiLoader, FiAlertCircle, FiRefreshCw 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import tutorialAPI from '../../api/tutorialApi.js';
import examAPI from '../../api/examApi.js';
import AdminSidebar from './AdminSidebar.jsx';

export default function TutorialManagement() {
  const navigate = useNavigate();

  // List states
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown lists for filters
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);

  // Selected filters
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tutorialType, setTutorialType] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchFilters = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data || []);
    } catch (err) {
      console.warn('Failed to load exams list for filters', err);
    }
  };

  const fetchTutorials = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (examId) params.examId = examId;
      if (subjectId) params.subjectId = subjectId;
      if (tutorialType) params.tutorialType = tutorialType;
      if (status) params.status = status;
      if (search) params.search = search;

      const { data } = await tutorialAPI.adminGetAll(params);
      if (data?.success) {
        setTutorials(data.tutorials || []);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to load tutorials list.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch subjects when selected exam changes
  useEffect(() => {
    if (!examId) {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    const loadSubjects = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(examId);
        setSubjects(data.subjects || []);
        setSubjectId('');
      } catch (err) {
        console.warn('Failed to load subjects for exam', err);
      }
    };
    loadSubjects();
  }, [examId]);

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchTutorials();
  }, [examId, subjectId, tutorialType, status]);

  // Actions
  const handlePublish = async (id) => {
    const toastId = toast.loading('Publishing tutorial...');
    try {
      await tutorialAPI.adminPublish(id);
      toast.success('Tutorial published successfully.', { id: toastId });
      fetchTutorials();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to publish tutorial.', { id: toastId });
    }
  };

  const handleArchive = async (id) => {
    const toastId = toast.loading('Archiving tutorial...');
    try {
      await tutorialAPI.adminArchive(id);
      toast.success('Tutorial archived successfully.', { id: toastId });
      fetchTutorials();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to archive tutorial.', { id: toastId });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to delete this tutorial? This action will permanently remove it along with all student progress statistics.')) {
      return;
    }
    const toastId = toast.loading('Deleting tutorial...');
    try {
      await tutorialAPI.adminDelete(id);
      toast.success('Tutorial deleted successfully.', { id: toastId });
      fetchTutorials();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to delete tutorial.', { id: toastId });
    }
  };

  const handleResetFilters = () => {
    setExamId('');
    setSubjectId('');
    setTutorialType('');
    setStatus('');
    setSearch('');
    fetchTutorials();
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiFileText className="text-rose-455" />
              <span className="text-xs font-semibold text-rose-450 uppercase tracking-widest">Tutorial Module</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Tutorials Management</h1>
            <p className="text-slate-500 text-sm mt-1">
              Publish structured study materials, video notes, and articles aligned to targets.
            </p>
          </div>
          <Link
            to="/admin/tutorials/create"
            className="btn-primary self-start sm:self-center px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/10"
          >
            <FiPlus className="text-sm" /> Create Tutorial
          </Link>
        </div>

        {/* Workspace Row */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          
          <AdminSidebar active="Tutorials" />

          {/* Right Workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Filter controls bar */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiSliders className="text-brand-400" /> Filter Options
                </span>
                <button
                  onClick={handleResetFilters}
                  className="text-[10px] text-slate-400 hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam</label>
                  <select
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Subject select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    disabled={!examId}
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold disabled:opacity-40"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(sub => (
                      <option key={sub._id} value={sub._id}>{sub.title}</option>
                    ))}
                  </select>
                </div>

                {/* Type select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content Type</label>
                  <select
                    value={tutorialType}
                    onChange={(e) => setTutorialType(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Types</option>
                    <option value="video">Video</option>
                    <option value="article">Article</option>
                    <option value="notes">Notes</option>
                    <option value="pdf">PDF File</option>
                    <option value="external_link">External Link</option>
                    <option value="recorded_class">Recorded Class</option>
                  </select>
                </div>

                {/* Status select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Publish Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="approved">Approved</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Search text input */}
              <div className="relative pt-2">
                <FiSearch className="absolute left-3.5 top-5.5 text-slate-500 text-sm" />
                <input
                  type="text"
                  placeholder="Search by tutorial title or description..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTutorials()}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-550"
                />
              </div>
            </div>

            {/* List Table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading tutorials log...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchTutorials} className="btn-primary text-xs px-4 py-2">
                  <FiRefreshCw className="mr-1" /> Retry
                </button>
              </div>
            ) : tutorials.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiFileText className="text-4xl text-slate-500 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Tutorials Added</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Click the "Create Tutorial" button at the top to draft your first learning guide.
                </p>
              </div>
            ) : (
              <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-semibold text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-800 bg-dark-950/40 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-4">Title & Details</th>
                      <th className="px-6 py-4">Syllabus Context</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {tutorials.map((item) => (
                      <tr key={item._id} className="hover:bg-dark-800/20 transition-colors">
                        <td className="px-6 py-4 max-w-xs">
                          <p className="font-bold text-white text-sm truncate">{item.title}</p>
                          <p className="text-slate-500 font-medium text-[11px] line-clamp-1 mt-0.5">{item.shortDescription}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-slate-200">
                            {Array.isArray(item.examIds) && item.examIds.map(e => e.title).join(', ') || 'N/A'}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Sub: {item.subjectId?.title || 'General'}
                          </p>
                        </td>
                        <td className="px-6 py-4 capitalize">
                          <span className="bg-slate-850 px-2 py-0.5 rounded text-[10px] font-bold text-slate-350">
                            {item.tutorialType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            item.status === 'published'
                              ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                              : item.status === 'archived'
                                ? 'text-slate-500 bg-slate-800/60'
                                : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-1.5 whitespace-nowrap">
                          {item.status !== 'published' && (
                            <button
                              onClick={() => handlePublish(item._id)}
                              className="text-[10px] bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white px-2.5 py-1 rounded transition-colors font-bold"
                            >
                              Publish
                            </button>
                          )}
                          {item.status === 'published' && (
                            <button
                              onClick={() => handleArchive(item._id)}
                              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2.5 py-1 rounded transition-colors font-bold"
                            >
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/admin/tutorials/${item._id}/edit`)}
                            className="p-1.5 bg-dark-800 hover:bg-dark-700 text-slate-300 hover:text-white rounded transition-colors inline-block"
                            title="Edit Tutorial"
                          >
                            <FiEdit2 className="text-xs" />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-1.5 bg-dark-800 hover:bg-dark-700 hover:text-rose-400 rounded transition-colors inline-block"
                            title="Delete"
                          >
                            <FiTrash2 className="text-xs" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
