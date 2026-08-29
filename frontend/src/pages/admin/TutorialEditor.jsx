import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiInfo, FiLoader, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import tutorialAPI from '../../api/tutorialApi.js';
import examAPI from '../../api/examApi.js';

export default function TutorialEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Metadata loaders
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [selectedPhases, setSelectedPhases] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [tutorialType, setTutorialType] = useState('video');
  const [contentLanguage, setContentLanguage] = useState('english');
  const [videoUrl, setVideoUrl] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [difficulty, setDifficulty] = useState('beginner');
  const [orderNumber, setOrderNumber] = useState(0);
  const [isFree, setIsFree] = useState(true);
  const [status, setStatus] = useState('draft');

  // Loading states
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  // 1. Initial Load: exams list
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data || []);
      } catch (err) {
        console.warn('Failed to load exams list', err);
      }
    };
    fetchExams();
  }, []);

  // 2. Load edit detail if edit mode
  useEffect(() => {
    if (!isEditMode) return;
    const fetchDetails = async () => {
      try {
        const { data } = await tutorialAPI.adminGetById(id);
        if (data?.success) {
          const t = data.tutorial;
          setTitle(t.title || '');
          setShortDescription(t.shortDescription || '');
          setFullDescription(t.fullDescription || '');
          
          // Map array ids
          const exIds = Array.isArray(t.examIds) ? t.examIds.map(x => x._id || x) : [];
          setSelectedExams(exIds);
          
          const phIds = Array.isArray(t.phaseIds) ? t.phaseIds.map(x => x._id || x) : [];
          setSelectedPhases(phIds);

          setSelectedSubject(t.subjectId?._id || t.subjectId || '');
          setSelectedTopic(t.topicId?._id || t.topicId || '');
          setSelectedSubtopic(t.subtopicId?._id || t.subtopicId || '');

          setTutorialType(t.tutorialType || 'video');
          setContentLanguage(t.contentLanguage || 'english');
          setVideoUrl(t.videoUrl || '');
          setArticleContent(t.articleContent || '');
          setPdfUrl(t.pdfUrl || '');
          setExternalUrl(t.externalUrl || '');
          setThumbnailUrl(t.thumbnailUrl || '');
          setDurationMinutes(t.durationMinutes || 0);
          setDifficulty(t.difficulty || 'beginner');
          setOrderNumber(t.orderNumber || 0);
          setIsFree(t.isFree !== undefined ? t.isFree : true);
          setStatus(t.status || 'draft');
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load tutorial details.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, isEditMode]);

  // 3. Load phases, subjects, topics, subtopics based on exam selection
  // In our simplified structure, we load syllabus from the first selected exam
  useEffect(() => {
    if (selectedExams.length === 0) {
      setPhases([]);
      setSubjects([]);
      setTopics([]);
      setSubtopics([]);
      return;
    }

    const firstExamId = selectedExams[0];
    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(firstExamId);
        setPhases(data.phases || []);
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
        setSubtopics(data.subtopics || []);
      } catch (err) {
        console.warn('Failed to load syllabus for first exam', err);
      }
    };
    fetchSyllabus();
  }, [selectedExams]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check validations
    if (!title.trim()) return toast.error('Title is required.');
    if (selectedExams.length === 0) return toast.error('Please link at least one Target Exam.');
    if (!selectedSubject) return toast.error('Please assign a Subject.');
    if (!shortDescription.trim()) return toast.error('Short description is required.');

    if (tutorialType === 'video' && !videoUrl.trim()) {
      return toast.error('Video URL is required for video tutorials.');
    }
    if (tutorialType === 'article' && !articleContent.trim()) {
      return toast.error('Article content is required for article tutorials.');
    }
    if (tutorialType === 'pdf' && !pdfUrl.trim()) {
      return toast.error('PDF file URL is required for PDF tutorials.');
    }
    if (tutorialType === 'external_link' && !externalUrl.trim()) {
      return toast.error('External URL is required for link tutorials.');
    }

    setSaving(true);
    const toastId = toast.loading(isEditMode ? 'Updating tutorial...' : 'Creating tutorial...');

    try {
      const payload = {
        title,
        shortDescription,
        fullDescription,
        examIds: selectedExams,
        phaseIds: selectedPhases,
        subjectId: selectedSubject,
        topicId: selectedTopic || undefined,
        subtopicId: selectedSubtopic || undefined,
        tutorialType,
        contentLanguage,
        videoUrl: tutorialType === 'video' ? videoUrl : undefined,
        articleContent: tutorialType === 'article' ? articleContent : undefined,
        pdfUrl: tutorialType === 'pdf' ? pdfUrl : undefined,
        externalUrl: tutorialType === 'external_link' ? externalUrl : undefined,
        thumbnailUrl,
        durationMinutes,
        difficulty,
        orderNumber,
        isFree,
        status,
      };

      if (isEditMode) {
        await tutorialAPI.adminUpdate(id, payload);
        toast.success('Tutorial updated successfully.', { id: toastId });
      } else {
        await tutorialAPI.adminCreate(payload);
        toast.success('Tutorial created successfully.', { id: toastId });
      }

      navigate('/admin/tutorials');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save tutorial.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExam = (exId) => {
    if (selectedExams.includes(exId)) {
      setSelectedExams(selectedExams.filter(id => id !== exId));
    } else {
      setSelectedExams([...selectedExams, exId]);
    }
  };

  const handleTogglePhase = (phId) => {
    if (selectedPhases.includes(phId)) {
      setSelectedPhases(selectedPhases.filter(id => id !== phId));
    } else {
      setSelectedPhases([...selectedPhases, phId]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading tutorial details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        
        {/* Back navigation */}
        <Link
          to="/admin/tutorials"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Management
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            {isEditMode ? 'Edit Tutorial Topic' : 'Compose New Tutorial'}
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Build target resource material linked to syllabus categories.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Main Info */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Topic Details
            </h3>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Tutorial Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Fundamental Rights - Indian Polity Notes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Description Short */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Short Description (Card Preview)</label>
              <textarea
                required
                rows="2"
                placeholder="Explain what the aspirant will master in this summary..."
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Description Full */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Full Description (Optional)</label>
              <textarea
                rows="4"
                placeholder="Detail guidelines, references, syllabus correlation..."
                value={fullDescription}
                onChange={(e) => setFullDescription(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Syllabus Context */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Link Syllabus Categories
            </h3>

            {/* Exams Link (Multi select) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Target Competitive Exams</label>
              <div className="flex flex-wrap gap-2">
                {exams.map(ex => (
                  <button
                    key={ex._id}
                    type="button"
                    onClick={() => handleToggleExam(ex._id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedExams.includes(ex._id)
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {ex.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Phase Link (Multi select) */}
            {phases.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase">Exam Stages/Phases</label>
                <div className="flex flex-wrap gap-2">
                  {phases.map(ph => (
                    <button
                      key={ph._id}
                      type="button"
                      onClick={() => handleTogglePhase(ph._id)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                        selectedPhases.includes(ph._id)
                          ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {ph.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grid Selectors for Subject & Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Subject</label>
                <select
                  disabled={selectedExams.length === 0}
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold disabled:opacity-40"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.title}</option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Topic (Optional)</label>
                <select
                  disabled={!selectedSubject}
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold disabled:opacity-40"
                >
                  <option value="">Select Topic</option>
                  {topics.filter(t => t.subjectId === selectedSubject).map(top => (
                    <option key={top._id} value={top._id}>{top.title}</option>
                  ))}
                </select>
              </div>

              {/* Subtopic */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Subtopic (Optional)</label>
                <select
                  disabled={!selectedTopic}
                  value={selectedSubtopic}
                  onChange={(e) => setSelectedSubtopic(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold disabled:opacity-40"
                >
                  <option value="">Select Subtopic</option>
                  {subtopics.filter(s => s.topicId === selectedTopic).map(sub => (
                    <option key={sub._id} value={sub._id}>{sub.title}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Settings & Parameters */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Parameters & Access
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Type</label>
                <select
                  value={tutorialType}
                  onChange={(e) => setTutorialType(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold"
                >
                  <option value="video">Video</option>
                  <option value="article">Article</option>
                  <option value="notes">Notes</option>
                  <option value="pdf">PDF File</option>
                  <option value="external_link">External Link</option>
                  <option value="recorded_class">Recorded Class</option>
                </select>
              </div>

              {/* Language */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Language</label>
                <select
                  value={contentLanguage}
                  onChange={(e) => setContentLanguage(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-semibold"
                >
                  <option value="draft">Draft</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Duration (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              {/* Order */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Order Number</label>
                <input
                  type="number"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(Number(e.target.value))}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              {/* Free access toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase block">Access Label</label>
                <select
                  value={isFree ? 'free' : 'paid'}
                  onChange={(e) => setIsFree(e.target.value === 'free')}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-semibold"
                >
                  <option value="free">Free Access</option>
                  <option value="paid">Premium Plan Only</option>
                </select>
              </div>
            </div>

            {/* Thumbnail URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase">Thumbnail Image URL (Optional)</label>
              <input
                type="text"
                placeholder="https://example.com/images/thumb.jpg"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Dynamic Content Details based on Type */}
          <div className="glass-card p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">
              Content Specifications
            </h3>

            {tutorialType === 'video' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Video URL (YouTube embed or direct link)</label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            )}

            {tutorialType === 'article' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">Article Content (HTML/Markdown notes)</label>
                <textarea
                  required
                  rows="8"
                  placeholder="Compose your structured revision notes, concepts, and summaries here..."
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>
            )}

            {tutorialType === 'pdf' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">PDF Document URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com/files/chapter-1-polity.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>
            )}

            {tutorialType === 'external_link' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase">External Resource Link URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://official-upsc-documents.nic.in/syllabus.pdf"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>
            )}

            {/* Fallback info */}
            {tutorialType === 'notes' && (
              <div className="p-3 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-center gap-3">
                <FiInfo className="text-brand-400 text-lg shrink-0" />
                <p className="text-[11px] text-slate-455">
                  <strong>Concept Notes:</strong> Admins can compile study cards or descriptive guidelines. Use the 'Full Description' field above to write note contents.
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3.5">
            <Link to="/admin/tutorials" className="btn-secondary px-6 py-2.5 text-xs font-bold">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-8 py-2.5 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave /> {saving ? 'Saving...' : 'Save Tutorial'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
