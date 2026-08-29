import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit, FiTrash2, FiAward, FiSettings, FiCheck, FiX, FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form modal/drawer states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState(null);
  
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [conductingBody, setConductingBody] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [examPattern, setExamPattern] = useState('');
  const [active, setActive] = useState(true);

  // Fetch all exams (including inactive)
  const fetchAllExams = async () => {
    try {
      const { data } = await examAPI.getAllExamsAdmin();
      setExams(data);
    } catch (err) {
      toast.error('Failed to load admin exams list.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllExams();
  }, []);

  const resetForm = () => {
    setTitle('');
    setShortDescription('');
    setFullDescription('');
    setConductingBody('');
    setEligibility('');
    setExamPattern('');
    setActive(true);
    setEditingExamId(null);
    setIsFormOpen(false);
  };

  const openCreateModal = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditModal = (exam) => {
    setEditingExamId(exam._id);
    setTitle(exam.title);
    setShortDescription(exam.shortDescription);
    setFullDescription(exam.fullDescription || '');
    setConductingBody(exam.conductingBody || '');
    setEligibility(exam.eligibility || '');
    setExamPattern(exam.examPattern || '');
    setActive(exam.active);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !shortDescription) {
      toast.error('Title and short description are required.');
      return;
    }

    const payload = {
      title,
      shortDescription,
      fullDescription,
      conductingBody,
      eligibility,
      examPattern,
      active,
    };

    try {
      if (editingExamId) {
        await examAPI.updateExam(editingExamId, payload);
        toast.success('Exam updated successfully.');
      } else {
        await examAPI.createExam(payload);
        toast.success('Exam created successfully.');
      }
      resetForm();
      fetchAllExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save exam.');
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam and all associated phases/subjects/topics? This action is permanent!')) {
      return;
    }

    try {
      await examAPI.deleteExam(id);
      toast.success('Exam deleted successfully.');
      fetchAllExams();
    } catch (err) {
      toast.error('Failed to delete exam.');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiSettings className="text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Admin Workspace</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Manage Exams</h1>
            <p className="text-slate-500 text-xs mt-0.5">Scaffold new competitive exam templates and construct curriculum nodes.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <FiPlus /> Add New Exam
          </button>
        </div>

        {/* Form Drawer (Inline Overlay) */}
        {isFormOpen && (
          <div className="glass-card p-6 border-brand-500/20 bg-brand-950/5 space-y-6 animate-pulse-slow">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white">
                {editingExamId ? 'Edit Exam Details' : 'Create New Exam'}
              </h2>
              <button onClick={resetForm} className="text-slate-500 hover:text-white transition-colors">
                <FiX className="text-lg" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. UPSC Civil Services"
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Conducting Body */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Conducting Body</label>
                  <input
                    type="text"
                    value={conductingBody}
                    onChange={(e) => setConductingBody(e.target.value)}
                    placeholder="e.g. Union Public Service Commission"
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Short Description</label>
                  <input
                    type="text"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief description for catalog cards"
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all"
                  />
                </div>

                {/* Eligibility */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Eligibility Criteria</label>
                  <textarea
                    rows="3"
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    placeholder="Age limits, educational criteria..."
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {/* Full Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Full Description</label>
                  <textarea
                    rows="3"
                    value={fullDescription}
                    onChange={(e) => setFullDescription(e.target.value)}
                    placeholder="Complete detailed examination info..."
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all resize-none"
                  />
                </div>

                {/* Exam Pattern */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Pattern</label>
                  <textarea
                    rows="3"
                    value={examPattern}
                    onChange={(e) => setExamPattern(e.target.value)}
                    placeholder="Details about stages, papers, negative markings..."
                    className="w-full bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all resize-none"
                  />
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="exam-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-500 focus:ring-brand-500 bg-dark-900 border-slate-800"
                  />
                  <label htmlFor="exam-active" className="text-xs font-semibold text-slate-300 select-none cursor-pointer">
                    Publish Exam (Active Status)
                  </label>
                </div>
              </div>

              {/* Submit panel */}
              <div className="md:col-span-2 flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-dark-800 hover:bg-dark-700 text-slate-300 border border-slate-700 font-semibold px-4 py-2 rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary py-2 px-5 text-xs font-semibold"
                >
                  {editingExamId ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Exams List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="glass-card p-6 border-slate-800 bg-dark-900/20 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                    {exam.conductingBody || 'Unspecified'}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    exam.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {exam.active ? 'Active' : 'Draft'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{exam.title}</h3>
                <p className="text-slate-500 text-xs mb-6 truncate">{exam.shortDescription}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
                {/* Syllabus manager redirect */}
                <Link
                  to={`/admin/exams/${exam._id}/syllabus`}
                  className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition-colors"
                >
                  <FiSettings /> Edit Syllabus Tree
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(exam)}
                    className="p-2 rounded-lg bg-dark-800 border border-slate-700 hover:bg-slate-750 text-slate-300 transition-all"
                  >
                    <FiEdit className="text-sm" />
                  </button>
                  <button
                    onClick={() => handleDelete(exam._id)}
                    className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-all"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
