import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiArrowLeft, FiClock, FiBookOpen, FiCheckCircle, FiChevronLeft, 
  FiChevronRight, FiPlay, FiBook, FiCheck, FiSave, FiAlertCircle, FiLoader 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import tutorialAPI from '../../api/tutorialApi.js';

export default function TutorialDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tutorial, setTutorial] = useState(null);
  const [progress, setProgress] = useState({
    progressPercent: 0,
    watchedSeconds: 0,
    isCompleted: false,
    personalNote: '',
  });

  // Prev / Next refs
  const [prevTutorial, setPrevTutorial] = useState(null);
  const [nextTutorial, setNextTutorial] = useState(null);

  // States
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [personalNote, setPersonalNote] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data } = await tutorialAPI.getTutorialById(id);
      if (data?.success) {
        setTutorial(data.tutorial);
        setProgress(data.progress);
        setPersonalNote(data.progress?.personalNote || '');
        setPrevTutorial(data.prevTutorial);
        setNextTutorial(data.nextTutorial);
      } else {
        throw new Error('Could not resolve response data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load topic contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Update progress helper
  const saveProgress = async (updates) => {
    try {
      const payload = {
        ...progress,
        ...updates,
      };
      const { data } = await tutorialAPI.updateProgress(id, payload);
      if (data?.success) {
        setProgress(data.progress);
      }
    } catch (err) {
      console.warn('Could not save user progress details', err);
    }
  };

  const handleMarkComplete = async () => {
    const nextCompleted = !progress.isCompleted;
    const progressPercent = nextCompleted ? 100 : 0;
    
    const toastId = toast.loading(nextCompleted ? 'Marking topic complete...' : 'Reopening topic...');
    try {
      await saveProgress({
        isCompleted: nextCompleted,
        progressPercent,
      });
      toast.success(nextCompleted ? 'Topic completed! Keep it up. 🚀' : 'Topic reopened.', { id: toastId });
    } catch (err) {
      toast.error('Failed to save completion status.', { id: toastId });
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await saveProgress({ personalNote });
      toast.success('Notes saved successfully.');
    } catch (err) {
      toast.error('Failed to save your notes.');
    } finally {
      setSavingNote(false);
    }
  };

  const handlePracticeRedirect = () => {
    if (!tutorial) return;
    
    // Redirect to Smart Practice page passing state payload
    navigate('/aspirant/smart-practice', {
      state: {
        preselectedExamId: tutorial.examIds?.[0]?._id || tutorial.examIds?.[0],
        preselectedPhaseId: tutorial.phaseIds?.[0]?._id || tutorial.phaseIds?.[0],
        preselectedSubjectId: tutorial.subjectId?._id || tutorial.subjectId,
        preselectedTopicId: tutorial.topicId?._id || tutorial.topicId,
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading contents...</p>
        </div>
      </div>
    );
  }

  if (!tutorial) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-card border-rose-500/20 p-8 text-center space-y-4">
          <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Topic Not Found</h2>
          <p className="text-xs text-slate-450">This content is unavailable or has been archived by the administrator.</p>
          <Link to="/aspirant/tutorials" className="btn-primary w-full py-2 text-xs font-semibold inline-block">
            Back to Tutorials
          </Link>
        </div>
      </div>
    );
  }

  const cleanSubjectTitle = tutorial.subjectId?.title || 'General Syllabus';
  const cleanTopicTitle = tutorial.topicId?.title || 'General Concept';

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        {/* Back navigation & syllabus breadcrumb */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-500">
          <Link to="/aspirant/tutorials" className="hover:text-white flex items-center gap-1.5 transition-colors">
            <FiArrowLeft /> Back to Lessons
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold uppercase tracking-wider">
            <span>{cleanSubjectTitle}</span>
            <span>•</span>
            <span className="text-slate-400">{cleanTopicTitle}</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {tutorial.title}
            </h1>
            <p className="text-slate-400 text-xs mt-1.5">{tutorial.shortDescription}</p>
          </div>
          <div className="flex gap-2 self-start shrink-0">
            <button
              onClick={handleMarkComplete}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                progress.isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-dark-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FiCheckCircle className="text-sm" />
              {progress.isCompleted ? 'Completed' : 'Mark Complete'}
            </button>
            <button
              onClick={handlePracticeRedirect}
              className="btn-primary px-4 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-500/10"
            >
              <FiPlay /> Practice Topic
            </button>
          </div>
        </div>

        {/* Video Player or Article notes content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main workspace (Video / Article / Note details) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 border-slate-850 bg-dark-900/30 space-y-6">
              
              {/* Type specified render */}
              {tutorial.tutorialType === 'video' && tutorial.videoUrl && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-850 bg-black relative">
                  <iframe
                    title={tutorial.title}
                    src={tutorial.videoUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Summary Notes details */}
              {tutorial.tutorialType === 'article' && tutorial.articleContent && (
                <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 font-medium leading-relaxed whitespace-pre-line bg-dark-950/50 p-4 sm:p-6 rounded-2xl border border-slate-850">
                  {tutorial.articleContent}
                </div>
              )}

              {/* PDF Preview details */}
              {tutorial.tutorialType === 'pdf' && tutorial.pdfUrl && (
                <div className="p-8 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl bg-dark-950/30">
                  <FiBook className="text-4xl text-slate-500 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">Reference PDF Document Available</p>
                    <p className="text-xs text-slate-500 mt-1">Download or preview the official attached syllabus notes.</p>
                  </div>
                  <a
                    href={tutorial.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-secondary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    View PDF File
                  </a>
                </div>
              )}

              {/* External web links */}
              {tutorial.tutorialType === 'external_link' && tutorial.externalUrl && (
                <div className="p-8 text-center space-y-4 border border-dashed border-slate-800 rounded-2xl bg-dark-950/30">
                  <FiBookOpen className="text-4xl text-slate-500 mx-auto" />
                  <div>
                    <p className="text-sm font-bold text-white">External Concept Resource</p>
                    <p className="text-xs text-slate-500 mt-1">This topic links to official reference platforms or recommended studies.</p>
                  </div>
                  <a
                    href={tutorial.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary px-5 py-2.5 text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    Visit External Source
                  </a>
                </div>
              )}

              {/* Notes content detail fallback */}
              {tutorial.tutorialType === 'notes' && tutorial.fullDescription && (
                <div className="text-xs sm:text-sm text-slate-350 leading-relaxed font-semibold whitespace-pre-line p-4 bg-dark-950/40 rounded-xl border border-slate-850">
                  {tutorial.fullDescription}
                </div>
              )}

              {/* Detailed Explanation if available */}
              {tutorial.fullDescription && tutorial.tutorialType !== 'notes' && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Concept Notes</h4>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed whitespace-pre-line font-medium">
                    {tutorial.fullDescription}
                  </p>
                </div>
              )}
            </div>

            {/* Sibling navigation row */}
            <div className="flex justify-between items-center gap-4 text-xs font-bold text-slate-500">
              {prevTutorial ? (
                <Link to={`/aspirant/tutorials/${prevTutorial._id}`} className="hover:text-white flex items-center gap-1">
                  <FiChevronLeft className="text-base" /> Prev: {prevTutorial.title.substring(0, 20)}...
                </Link>
              ) : (
                <span className="opacity-40 flex items-center gap-1"><FiChevronLeft /> Start of Subject</span>
              )}
              {nextTutorial ? (
                <Link to={`/aspirant/tutorials/${nextTutorial._id}`} className="hover:text-white flex items-center gap-1">
                  Next: {nextTutorial.title.substring(0, 20)}... <FiChevronRight className="text-base" />
                </Link>
              ) : (
                <span className="opacity-40 flex items-center gap-1">Subject Completed <FiChevronRight /></span>
              )}
            </div>
          </div>

          {/* Right sidebar: Personal notes */}
          <div className="space-y-6">
            <div className="glass-card p-5 border-slate-850 bg-dark-900/30 space-y-4">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <FiBook className="text-brand-400" /> Topic Revision Notes
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                Scribble down shortcuts, key cases, or topics to cross-reference later. These notes are saved to your profile.
              </p>
              <textarea
                rows="8"
                placeholder="Write your notes here..."
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                className="w-full bg-dark-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-brand-500 font-semibold"
              />
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="btn-primary w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <FiSave /> {savingNote ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
