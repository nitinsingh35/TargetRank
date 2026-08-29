import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiClock, FiAlertCircle, FiPower, FiTrash2, FiEdit2, 
  FiCopy, FiPlus, FiSliders, FiBarChart2, FiDollarSign, 
  FiArchive, FiCheckCircle, FiFilter, FiRefreshCw 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';
import examAPI from '../../api/examApi.js';

export default function MockTestManagement() {
  const navigate = useNavigate();

  // State lists
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedPremium, setSelectedPremium] = useState('');

  // Availability Preview State
  const [previewingTestId, setPreviewingTestId] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    fetchMockTests();
  }, [selectedExamId, selectedPhaseId, selectedCategory, selectedStatus, selectedLanguage, selectedPremium]);

  const fetchExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exams list.');
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
      toast.error('Failed to load phases.');
    }
  };

  const fetchMockTests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      if (selectedPhaseId) params.phaseId = selectedPhaseId;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedLanguage) params.language = selectedLanguage;
      if (selectedPremium) params.isPremium = selectedPremium;

      const { data } = await mockTestAPI.adminGetMockTests(params);
      if (data.success) {
        setTests(data.mockTests || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch mock tests catalog.');
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handlePublish = async (id) => {
    try {
      const { data } = await mockTestAPI.adminPublishMockTest(id, { allowAvailableCountMode: false });
      if (data.success) {
        toast.success('Mock test published successfully!');
        fetchMockTests();
      }
    } catch (err) {
      console.error(err);
      const res = err.response?.data;
      if (res?.shortage) {
        // Confirm if they want to override with shortage available-count mode
        if (window.confirm(`${res.message}\n\nDo you want to publish in "Available-Count Mode" which starts with whatever questions are available?`)) {
          try {
            const overrideRes = await mockTestAPI.adminPublishMockTest(id, { allowAvailableCountMode: true });
            if (overrideRes.data.success) {
              toast.success('Published in Available-Count Mode.');
              fetchMockTests();
            }
          } catch (overrideErr) {
            toast.error(overrideErr.response?.data?.message || 'Publish override failed.');
          }
        }
      } else {
        toast.error(res?.message || 'Failed to publish mock test.');
      }
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to unpublish and archive this mock test? Aspirants will no longer be able to start new attempts.')) return;
    try {
      const { data } = await mockTestAPI.adminArchiveMockTest(id);
      if (data.success) {
        toast.success('Mock test archived.');
        fetchMockTests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to archive.');
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await mockTestAPI.adminDuplicateMockTest(id);
      if (data.success) {
        toast.success('Duplicated to draft successfully!');
        fetchMockTests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to duplicate test.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const { data } = await mockTestAPI.adminDeleteMockTest(id);
      if (data.success) {
        if (data.archived) {
          toast.success(data.message); // Mock test has attempts, so it was archived
        } else {
          toast.success('Mock test deleted successfully.');
        }
        fetchMockTests();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Deletion failed.');
    }
  };

  const handlePreviewAvailability = async (id) => {
    setPreviewingTestId(id);
    setPreviewLoading(true);
    setPreviewData(null);
    try {
      const { data } = await mockTestAPI.adminPreviewAvailability(id);
      if (data.success) {
        setPreviewData(data);
      }
    } catch (err) {
      toast.error('Failed to preview availability.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Published</span>;
      case 'archived':
        return <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full uppercase">Archived</span>;
      default:
        return <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">Draft</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Mock Test Management</h1>
            <p className="text-slate-500 text-xs mt-1">Design sections, balance question limits, check real-time availability, and view student attempt distributions.</p>
          </div>
          <Link
            to="/admin/mock-tests/create"
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5"
          >
            <FiPlus className="text-sm" /> Create Mock Test
          </Link>
        </div>

        {/* Filters Panel */}
        <div className="glass-card p-5 bg-dark-900/40 border-slate-850 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Exam stream */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
            >
              <option value="">All Exams</option>
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>

          {/* Exam Phase */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Phase</label>
            <select
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
              disabled={!selectedExamId}
            >
              <option value="">All Phases</option>
              {phases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
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

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Language */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Language</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
            >
              <option value="">All Languages</option>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>

          {/* Premium */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tier</label>
            <select
              value={selectedPremium}
              onChange={(e) => setSelectedPremium(e.target.value)}
              className="w-full bg-[#030712] border border-slate-800 text-slate-300 rounded-lg p-2 text-xs focus:outline-none focus:border-slate-700"
            >
              <option value="">All Tiers</option>
              <option value="false">Free</option>
              <option value="true">Premium</option>
            </select>
          </div>
        </div>

        {/* Content catalog */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 text-xs font-semibold">Loading catalog tests...</p>
          </div>
        ) : tests.length === 0 ? (
          <div className="glass-card p-12 border-slate-850 text-center space-y-3">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto" />
            <h3 className="text-slate-300 font-bold text-sm">No Mock Tests Configured</h3>
            <p className="text-slate-500 text-xs max-w-sm mx-auto">Click "Create Mock Test" above to define parameters and configure dynamic templates.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map((test) => (
              <div 
                key={test._id} 
                className="glass-card p-5 bg-dark-900/30 border-slate-850 hover:border-slate-800 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-800 border border-slate-750 px-2 py-0.5 rounded-full capitalize">
                      {test.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {test.isPremium && (
                        <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded flex items-center">
                          <FiDollarSign /> {test.price || 'Premium'}
                        </span>
                      )}
                      {getStatusBadge(test.status)}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white leading-snug line-clamp-1">{test.title}</h3>
                    <p className="text-[10px] text-slate-500 font-semibold mt-1">
                      {test.examId?.title || 'Exam'} · {test.phaseId?.title || 'Phase'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-[#030712]/60 border border-slate-850 p-2.5 rounded-lg text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Questions</p>
                      <p className="text-xs font-black text-slate-200 mt-0.5">{test.totalQuestions}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Marks</p>
                      <p className="text-xs font-black text-slate-200 mt-0.5">{test.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium">Duration</p>
                      <p className="text-xs font-black text-slate-200 mt-0.5">{test.durationMinutes}m</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1"><FiClock /> {test.language}</span>
                    <span>Attempts: <strong className="text-slate-300">{test.attemptsCount || 0}</strong></span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    {/* Preview Availability */}
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handlePreviewAvailability(test._id)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/10 rounded-lg transition-all"
                        title="Check question availability"
                      >
                        <FiSliders className="text-sm" />
                      </button>
                    )}

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(test._id)}
                      className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 border border-transparent hover:border-purple-500/10 rounded-lg transition-all"
                      title="Duplicate test"
                    >
                      <FiCopy className="text-sm" />
                    </button>

                    {/* Analytics */}
                    {test.status === 'published' && (
                      <button
                        onClick={() => navigate(`/admin/mock-tests/${test._id}/analytics`)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/10 rounded-lg transition-all"
                        title="Student attempts analytics"
                      >
                        <FiBarChart2 className="text-sm" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(test._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/10 rounded-lg transition-all"
                      title="Delete test"
                    >
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {test.status === 'draft' && (
                      <>
                        <button
                          onClick={() => navigate(`/admin/mock-tests/${test._id}/edit`)}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handlePublish(test._id)}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-all"
                        >
                          Publish
                        </button>
                      </>
                    )}

                    {test.status === 'published' && (
                      <button
                        onClick={() => handleArchive(test._id)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-all"
                      >
                        Archive
                      </button>
                    )}

                    {test.status === 'archived' && (
                      <span className="text-[10px] font-medium text-slate-500 select-none">No actions</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Real-time Availability Preview Modal */}
        {previewingTestId && (
          <div className="fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-lg w-full p-6 border-slate-800 bg-[#030712]/95 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-850">
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                  <FiSliders className="text-sky-400 animate-pulse" /> Section Question Availability Check
                </h3>
                <button 
                  onClick={() => setPreviewingTestId(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {previewLoading ? (
                <div className="h-40 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-[10px] font-semibold">Running aggregates...</p>
                </div>
              ) : previewData ? (
                <div className="space-y-4">
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {previewData.sectionsPreview.map((sec, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 border rounded-xl flex justify-between items-center gap-4 ${
                          sec.isSufficient 
                            ? 'border-emerald-500/10 bg-emerald-500/5' 
                            : 'border-rose-500/10 bg-rose-500/5'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{sec.sectionName}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Available in bank: <strong className="text-slate-300">{sec.available}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-300">
                            Required: {sec.required}
                          </p>
                          {sec.shortage > 0 ? (
                            <span className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Shortage: {sec.shortage} Qs
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded mt-1 inline-block">
                              Sufficient
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {previewData.overallShortage > 0 ? (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-400 leading-normal">
                      <FiAlertCircle className="text-base shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white">Question Shortage Detected</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">There is a combined shortage of <strong className="text-amber-300">{previewData.overallShortage} questions</strong>. You will not be able to publish this test unless you explicitly choose to allow "Available-Count Mode" which starts attempts with smaller subsets.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <FiCheckCircle className="text-base" />
                      <span>Ready to publish! The question bank has a sufficient number of matching questions.</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-500 text-xs text-center py-4">No data received.</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-850">
                <button
                  onClick={() => setPreviewingTestId(null)}
                  className="btn-secondary px-4 py-2 text-xs font-bold border-slate-800"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
