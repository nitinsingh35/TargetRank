import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiEdit, FiTrash2, FiClock, FiPlusCircle, FiX, FiCheck, FiCpu } from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

export default function AdminSyllabus() {
  const { examId } = useParams();
  const [exam, setExam] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form overlay states
  const [activeForm, setActiveForm] = useState(null); // 'phase' | 'subject' | 'topic'
  const [editingId, setEditingId] = useState(null); // ID of record being edited

  // Common Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState(0);

  // Phase Specific
  // (uses common fields)

  // Subject Specific
  const [selectedPhaseId, setSelectedPhaseId] = useState('');

  // Topic Specific
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [estimatedStudyHours, setEstimatedStudyHours] = useState(0);
  const [subtopicsText, setSubtopicsText] = useState(''); // comma-separated strings

  // Fetch full syllabus
  const fetchSyllabusTree = async () => {
    try {
      const { data } = await examAPI.getExamSyllabus(examId);
      setExam(data.exam);
      setSyllabus(data.syllabus);
    } catch (err) {
      toast.error('Failed to load syllabus tree.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSyllabusTree();
  }, [examId]);

  const closeForm = () => {
    setActiveForm(null);
    setEditingId(null);
    setTitle('');
    setDescription('');
    setOrder(0);
    setSelectedPhaseId('');
    setSelectedSubjectId('');
    setEstimatedStudyHours(0);
    setSubtopicsText('');
  };

  // ─── PHASES ───
  const openAddPhase = () => {
    closeForm();
    setActiveForm('phase');
  };

  const openEditPhase = (phase) => {
    closeForm();
    setEditingId(phase._id);
    setTitle(phase.title);
    setDescription(phase.description || '');
    setOrder(phase.order || 0);
    setActiveForm('phase');
  };

  const handlePhaseSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error('Phase title is required.');

    const payload = { title, description, order };

    try {
      if (editingId) {
        await examAPI.updatePhase(editingId, payload);
        toast.success('Phase updated.');
      } else {
        await examAPI.createPhase(examId, payload);
        toast.success('Phase added.');
      }
      closeForm();
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Error saving phase.');
    }
  };

  const handleDeletePhase = async (id) => {
    if (!window.confirm('Delete phase? This deletes all nested subjects and topics permanently!')) return;
    try {
      await examAPI.deletePhase(id);
      toast.success('Phase deleted.');
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  // ─── SUBJECTS ───
  const openAddSubject = (phaseId) => {
    closeForm();
    setSelectedPhaseId(phaseId);
    setActiveForm('subject');
  };

  const openEditSubject = (subject) => {
    closeForm();
    setEditingId(subject._id);
    setSelectedPhaseId(subject.phaseId);
    setTitle(subject.title);
    setDescription(subject.description || '');
    setOrder(subject.order || 0);
    setActiveForm('subject');
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error('Subject title is required.');

    const payload = { phaseId: selectedPhaseId, title, description, order };

    try {
      if (editingId) {
        await examAPI.updateSubject(editingId, payload);
        toast.success('Subject updated.');
      } else {
        await examAPI.createSubject(examId, payload);
        toast.success('Subject added.');
      }
      closeForm();
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Error saving subject.');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete subject and all its topics permanently?')) return;
    try {
      await examAPI.deleteSubject(id);
      toast.success('Subject deleted.');
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  // ─── TOPICS ───
  const openAddTopic = (phaseId, subjectId) => {
    closeForm();
    setSelectedPhaseId(phaseId);
    setSelectedSubjectId(subjectId);
    setActiveForm('topic');
  };

  const openEditTopic = (topic) => {
    closeForm();
    setEditingId(topic._id);
    setSelectedPhaseId(topic.phaseId);
    setSelectedSubjectId(topic.subjectId);
    setTitle(topic.title);
    setDescription(topic.description || '');
    setOrder(topic.order || 0);
    setEstimatedStudyHours(topic.estimatedStudyHours || 0);
    setSubtopicsText(topic.subtopics ? topic.subtopics.join(', ') : '');
    setActiveForm('topic');
  };

  const handleTopicSubmit = async (e) => {
    e.preventDefault();
    if (!title) return toast.error('Topic title is required.');

    // Split subtopics by comma and trim
    const subtopics = subtopicsText
      .split(',')
      .map(s => s.trim())
      .filter(s => s !== '');

    const payload = {
      phaseId: selectedPhaseId,
      subjectId: selectedSubjectId,
      title,
      description,
      order,
      estimatedStudyHours,
      subtopics,
    };

    try {
      if (editingId) {
        await examAPI.updateTopic(editingId, payload);
        toast.success('Topic updated.');
      } else {
        await examAPI.createTopic(examId, payload);
        toast.success('Topic added.');
      }
      closeForm();
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Error saving topic.');
    }
  };

  const handleDeleteTopic = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try {
      await examAPI.deleteTopic(id);
      toast.success('Topic deleted.');
      fetchSyllabusTree();
    } catch (err) {
      toast.error('Delete failed.');
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
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/admin/exams"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Exams Manager
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Syllabus Editor</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Constructing phases, subjects, and topics for: <strong className="text-brand-400">{exam?.title}</strong>
            </p>
          </div>
          <button
            onClick={openAddPhase}
            className="btn-primary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <FiPlus /> Add New Phase
          </button>
        </div>

        {/* ─── MODAL/FORM RENDERING ─── */}
        {activeForm && (
          <div className="glass-card p-6 border-brand-500/20 bg-brand-950/5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                {editingId ? 'Edit' : 'Add'} {activeForm.toUpperCase()}
              </h3>
              <button onClick={closeForm} className="text-slate-500 hover:text-white transition-colors">
                <FiX />
              </button>
            </div>

            <form
              onSubmit={
                activeForm === 'phase'
                  ? handlePhaseSubmit
                  : activeForm === 'subject'
                  ? handleSubjectSubmit
                  : handleTopicSubmit
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter title"
                    className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Sorting Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional brief description"
                  className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* Topic-specific configurations */}
              {activeForm === 'topic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Estimated Hours */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Est. Study Hours</label>
                    <input
                      type="number"
                      value={estimatedStudyHours}
                      onChange={(e) => setEstimatedStudyHours(Number(e.target.value))}
                      className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Subtopics */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">Subtopics (Comma Separated)</label>
                    <input
                      type="text"
                      value={subtopicsText}
                      onChange={(e) => setSubtopicsText(e.target.value)}
                      placeholder="Subtopic A, Subtopic B, Subtopic C"
                      className="w-full bg-dark-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="bg-dark-800 hover:bg-dark-750 text-slate-400 px-3 py-1.5 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <FiCheck /> {editingId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── SYLLABUS TREE ACCORDION ─── */}
        <div className="space-y-4">
          {syllabus.length === 0 ? (
            <div className="glass-card p-12 text-center border-slate-850">
              <p className="text-slate-500 text-xs">Syllabus is empty. Click "Add New Phase" above to begin building.</p>
            </div>
          ) : (
            syllabus.map((phase) => (
              <div key={phase._id} className="glass-card p-6 border-slate-800 bg-dark-900/10 space-y-4">
                {/* Phase Title Bar */}
                <div className="flex justify-between items-center bg-dark-900/60 p-3 rounded-lg border border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
                      {phase.title}
                      <span className="text-[10px] bg-dark-850 text-slate-500 border border-slate-800 px-1.5 py-0.25 rounded">
                        Phase Order: {phase.order}
                      </span>
                    </h3>
                    {phase.description && <p className="text-[11px] text-slate-500 ml-4.5 mt-0.5">{phase.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openAddSubject(phase._id)}
                      className="text-[10px] bg-brand-600/10 hover:bg-brand-600/25 border border-brand-500/20 text-brand-400 px-2 py-1 rounded flex items-center gap-1 transition-all"
                    >
                      <FiPlusCircle /> Add Subject
                    </button>
                    <button
                      onClick={() => openEditPhase(phase)}
                      className="p-1.5 rounded bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white"
                    >
                      <FiEdit className="text-xs" />
                    </button>
                    <button
                      onClick={() => handleDeletePhase(phase._id)}
                      className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </div>
                </div>

                {/* Phase subjects grid */}
                <div className="pl-4 space-y-3">
                  {phase.subjects.map((subject) => (
                    <div key={subject._id} className="border border-slate-850 rounded-lg p-4 bg-dark-950/40 space-y-3">
                      {/* Subject Title Bar */}
                      <div className="flex justify-between items-center bg-dark-900/30 p-2.5 rounded border border-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded bg-accent-400"></span>
                          <h4 className="text-xs font-bold text-slate-300">{subject.title}</h4>
                          <span className="text-[9px] bg-dark-850 text-slate-500 px-1.5 py-0.25 rounded">
                            Order: {subject.order}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openAddTopic(phase._id, subject._id)}
                            className="text-[9px] bg-accent-600/10 hover:bg-accent-600/25 border border-accent-500/20 text-accent-400 px-2 py-0.5 rounded flex items-center gap-1 transition-all"
                          >
                            <FiPlusCircle /> Add Topic
                          </button>
                          <button
                            onClick={() => openEditSubject(subject)}
                            className="p-1 rounded bg-dark-800 hover:bg-dark-750 text-slate-400 hover:text-white"
                          >
                            <FiEdit className="text-[10px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject._id)}
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          >
                            <FiTrash2 className="text-[10px]" />
                          </button>
                        </div>
                      </div>

                      {/* Subject Topics List */}
                      <div className="pl-4 space-y-2">
                        {subject.topics.map((topic) => (
                          <div key={topic._id} className="bg-dark-900/20 border border-slate-900 rounded p-3 flex justify-between items-start gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-400">{topic.title}</span>
                                {topic.estimatedStudyHours > 0 && (
                                  <span className="text-[9px] bg-dark-800 border border-slate-800 text-slate-500 px-2 py-0.25 rounded-full flex items-center gap-1 font-medium">
                                    <FiClock /> {topic.estimatedStudyHours} hrs
                                  </span>
                                )}
                              </div>
                              {topic.description && <p className="text-[10px] text-slate-500 leading-relaxed italic">{topic.description}</p>}
                              {topic.subtopics && topic.subtopics.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {topic.subtopics.map((sub, sidx) => (
                                    <span key={sidx} className="text-[9px] bg-dark-850 text-slate-400 px-2 py-0.5 rounded border border-slate-900">
                                      {sub}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex gap-1.5 shrink-0">
                              <button
                                onClick={() => openEditTopic(topic)}
                                className="p-1 rounded bg-dark-850 hover:bg-dark-750 text-slate-500 hover:text-white"
                              >
                                <FiEdit className="text-[10px]" />
                              </button>
                              <button
                                onClick={() => handleDeleteTopic(topic._id)}
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                              >
                                <FiTrash2 className="text-[10px]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
