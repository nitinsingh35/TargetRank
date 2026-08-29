import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiCheckSquare, FiChevronLeft, FiChevronRight,
  FiBookmark, FiAlertCircle, FiSliders, FiPlay,
  FiLoader, FiCheck, FiSave, FiList, FiX, FiFlag,
  FiTag, FiAlertTriangle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';

// ── Palette colour helper ─────────────────────────────────────────────────────
function getPaletteClass(sq, isCurrent) {
  const isAnswered = !!sq.selectedAnswer;
  const isMarked   = !!sq.isMarkedForReview;
  const isVisited  = !!sq.visited;
  let base = '';
  if      (isAnswered && isMarked) base = 'bg-amber-500/20  border-amber-500  text-amber-300';
  else if (isAnswered)             base = 'bg-emerald-600/20 border-emerald-500 text-emerald-300';
  else if (isMarked)               base = 'bg-purple-600/20 border-purple-500  text-purple-300';
  else if (isVisited)              base = 'bg-rose-600/10   border-rose-500/40  text-rose-400';
  else                             base = 'bg-dark-950      border-slate-700    text-slate-500';
  if (isCurrent) base += ' ring-2 ring-brand-400 ring-offset-1 ring-offset-dark-900 scale-110';
  return base;
}

// ── Timer formatter ───────────────────────────────────────────────────────────
function formatTime(secs) {
  if (secs === null || secs === undefined || isNaN(secs)) return '00:00';
  const s = Math.max(0, Math.floor(secs));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

// ── localStorage keys ─────────────────────────────────────────────────────────
const timerKey = (id) => `tr_ps_timer_${id}`;
const indexKey = (id) => `tr_ps_idx_${id}`;

// ═════════════════════════════════════════════════════════════════════════════
export default function PracticeSession() {
  const { sessionId } = useParams();
  const navigate      = useNavigate();

  // ── Core state ──
  const [session,   setSession]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // ── UI state ──
  const [currentIndex,    setCurrentIndex]    = useState(0);
  const [saveStatus,      setSaveStatus]      = useState('saved'); // 'saving'|'saved'|'error'
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [isPaletteOpen,   setIsPaletteOpen]   = useState(false);

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef                = useRef(null);
  const autoSubmitRef           = useRef(false);

  // ═══════════════════════════════════════════════════════════════════════════
  //  LOAD INITIAL DATA
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    fetchSession();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const fetchSession = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await practiceAPI.getSessionDetails(sessionId);
      const s = data.session;
      if (!s) throw new Error('Session data not found.');

      // Already submitted → go to result
      if (s.status === 'submitted') {
        navigate(`/aspirant/practice-session/${sessionId}/result`, { replace: true });
        return;
      }

      setSession(s);

      // If started → load live attempt console
      if (s.status === 'started') {
        await loadAttempt();
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load practice session.');
      setLoading(false);
    }
  };

  const loadAttempt = async () => {
    try {
      const { data } = await practiceAPI.getAttempt(sessionId);

      // Expired / auto-submitted by backend
      if (data.expired || data.submitted) {
        toast.error('This session expired and was auto-submitted.');
        localStorage.removeItem(timerKey(sessionId));
        localStorage.removeItem(indexKey(sessionId));
        navigate(`/aspirant/practice-session/${sessionId}/result`, { replace: true });
        return;
      }

      setSession(data.session);
      setQuestions(data.questions || []);

      // Restore question index from localStorage
      const savedIdx = parseInt(localStorage.getItem(indexKey(sessionId)) || '0', 10);
      setCurrentIndex(savedIdx || data.session.currentQuestionIndex || 0);

      if (data.session.durationMinutes > 0) {
        // Restore timer from localStorage (refresh-safe)
        const storedExpiry = localStorage.getItem(timerKey(sessionId));
        let remaining;
        if (storedExpiry) {
          remaining = Math.max(0, Math.round((parseInt(storedExpiry, 10) - Date.now()) / 1000));
        } else {
          remaining = Math.max(0, data.remainingSeconds || 0);
          localStorage.setItem(timerKey(sessionId), String(Date.now() + remaining * 1000));
        }
        setTimeLeft(remaining);
        startCountdown(remaining);
      } else {
        setTimeLeft(null);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load attempt data.');
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  COUNTDOWN TIMER
  // ═══════════════════════════════════════════════════════════════════════════
  const startCountdown = useCallback((initialSecs) => {
    clearInterval(timerRef.current);
    const endTime = Date.now() + initialSecs * 1000;
    localStorage.setItem(timerKey(sessionId), String(endTime));

    timerRef.current = setInterval(async () => {
      const remaining = Math.max(0, Math.round((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (!autoSubmitRef.current) {
          autoSubmitRef.current = true;
          await handleAutoSubmit();
        }
      }
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  PRE-START: fire the start API
  // ═══════════════════════════════════════════════════════════════════════════
  const handleStartSession = async () => {
    setLoading(true);
    try {
      const { data } = await practiceAPI.startSession(sessionId);

      if (!data.questions || data.questions.length === 0) {
        setLoading(false);
        toast.error(
          'No questions are available for this practice setup yet. Add questions later or change filters.',
          { duration: 6000 }
        );
        setSession(prev => ({ ...prev, ...data.session, _noQuestions: true }));
        return;
      }

      toast.success('Session started! Best of luck. 🎯');
      setSession(data.session);
      setQuestions(data.questions);
      setCurrentIndex(0);
      localStorage.removeItem(indexKey(sessionId));
      localStorage.removeItem(timerKey(sessionId));

      if (data.session.durationMinutes > 0) {
        const rem = Math.max(
          0,
          Math.round((new Date(data.session.expiresAt).getTime() - Date.now()) / 1000)
        );
        setTimeLeft(rem);
        startCountdown(rem);
      } else {
        setTimeLeft(null);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to start session.';
      toast.error(msg);
      if (msg.toLowerCase().includes('no questions') || msg.toLowerCase().includes('not available')) {
        setSession(prev => ({ ...prev, _noQuestions: true }));
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  AUTO-SUBMIT
  // ═══════════════════════════════════════════════════════════════════════════
  const handleAutoSubmit = async () => {
    toast.loading('Time is up! Auto-submitting your responses...', { id: 'auto-submit' });
    try {
      await practiceAPI.autoSubmitSession(sessionId);
      toast.success('Session submitted successfully.', { id: 'auto-submit' });
    } catch (err) {
      toast.error('Auto-submit failed. Redirecting to result.', { id: 'auto-submit' });
    } finally {
      localStorage.removeItem(timerKey(sessionId));
      localStorage.removeItem(indexKey(sessionId));
      navigate(`/aspirant/practice-session/${sessionId}/result`, { replace: true });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  ANSWER SAVING
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSelectOption = async (optionText) => {
    if (!session || questions.length === 0) return;
    const currentQ = questions[currentIndex];
    const sq       = session.questions?.[currentIndex];
    if (!sq) return;

    // Optimistic UI update
    const updatedTracking = session.questions.map((q, i) =>
      i === currentIndex ? { ...q, selectedAnswer: optionText, visited: true } : q
    );
    setSession(prev => ({ ...prev, questions: updatedTracking }));
    setSaveStatus('saving');

    try {
      await practiceAPI.saveAnswer(sessionId, {
        questionId:           currentQ._id,
        selectedAnswer:       optionText,
        timeSpentSeconds:     sq.timeSpentSeconds || 0,
        currentQuestionIndex: currentIndex,
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      if (err.response?.data?.expired) {
        toast.error('Session expired. Redirecting...');
        navigate(`/aspirant/practice-session/${sessionId}/result`);
      } else {
        toast.error('Auto-save failed. Check your connection and try again.', { id: 'save-err' });
      }
    }
  };

  const handleClearResponse = async () => {
    if (!session || questions.length === 0) return;
    const currentQ = questions[currentIndex];

    const updatedTracking = session.questions.map((q, i) =>
      i === currentIndex ? { ...q, selectedAnswer: '', visited: true } : q
    );
    setSession(prev => ({ ...prev, questions: updatedTracking }));
    setSaveStatus('saving');

    try {
      await practiceAPI.saveAnswer(sessionId, {
        questionId:           currentQ._id,
        selectedAnswer:       null,
        timeSpentSeconds:     0,
        currentQuestionIndex: currentIndex,
      });
      setSaveStatus('saved');
      toast.success('Response cleared.', { duration: 1500 });
    } catch (err) {
      setSaveStatus('error');
      toast.error('Failed to clear response.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  MARK FOR REVIEW
  // ═══════════════════════════════════════════════════════════════════════════
  const handleToggleReview = async () => {
    if (!session || questions.length === 0) return;
    const currentQ  = questions[currentIndex];
    const sq        = session.questions?.[currentIndex];
    if (!sq) return;
    const nextState = !sq.isMarkedForReview;

    const updatedTracking = session.questions.map((q, i) =>
      i === currentIndex ? { ...q, isMarkedForReview: nextState, visited: true } : q
    );
    setSession(prev => ({ ...prev, questions: updatedTracking }));

    try {
      await practiceAPI.markReview(sessionId, {
        questionId:        currentQ._id,
        isMarkedForReview: nextState,
      });
      toast.success(nextState ? 'Marked for review.' : 'Review mark removed.', { duration: 1500 });
    } catch (err) {
      toast.error('Failed to update review status.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  BOOKMARK
  // ═══════════════════════════════════════════════════════════════════════════
  const handleToggleBookmark = async () => {
    if (!session || questions.length === 0) return;
    const currentQ  = questions[currentIndex];
    const sq        = session.questions?.[currentIndex];
    if (!sq) return;
    const nextState = !sq.isBookmarked;

    const updatedTracking = session.questions.map((q, i) =>
      i === currentIndex ? { ...q, isBookmarked: nextState } : q
    );
    setSession(prev => ({ ...prev, questions: updatedTracking }));

    try {
      await practiceAPI.bookmarkQuestion(sessionId, { questionId: currentQ._id });
      toast.success(nextState ? 'Question bookmarked!' : 'Bookmark removed.', { duration: 1500 });
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  const markVisited = useCallback(async (idx) => {
    if (!session) return;
    const sq = session.questions?.[idx];
    if (!sq || sq.visited) return;

    const updatedTracking = session.questions.map((q, i) =>
      i === idx ? { ...q, visited: true } : q
    );
    setSession(prev => ({ ...prev, questions: updatedTracking }));

    try {
      await practiceAPI.saveAnswer(sessionId, {
        questionId:           questions[idx]._id,
        selectedAnswer:       sq.selectedAnswer || null,
        timeSpentSeconds:     sq.timeSpentSeconds || 0,
        currentQuestionIndex: idx,
      });
    } catch (e) {
      console.warn('Mark-visited save failed', e);
    }
  }, [session, questions, sessionId]);

  const goToQuestion = useCallback((idx) => {
    setCurrentIndex(idx);
    localStorage.setItem(indexKey(sessionId), String(idx));
    markVisited(idx);
    if (window.innerWidth < 768) setIsPaletteOpen(false);
  }, [sessionId, markVisited]);

  const handleSaveAndNext = () => {
    if (currentIndex < questions.length - 1) goToQuestion(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) goToQuestion(currentIndex - 1);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  MANUAL SUBMIT
  // ═══════════════════════════════════════════════════════════════════════════
  const handleManualSubmit = async () => {
    setShowSubmitModal(false);
    setSubmitting(true);
    const toastId = toast.loading('Submitting practice session…');
    try {
      await practiceAPI.submitSession(sessionId);
      toast.success('Session submitted! Generating scorecard…', { id: toastId });
      localStorage.removeItem(timerKey(sessionId));
      localStorage.removeItem(indexKey(sessionId));
      clearInterval(timerRef.current);
      navigate(`/aspirant/practice-session/${sessionId}/result`, { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Submission failed.', { id: toastId });
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('Abandon this session? No result will be calculated.')) return;
    try {
      await practiceAPI.abandonSession(sessionId);
      toast.success('Session abandoned.');
      localStorage.removeItem(timerKey(sessionId));
      localStorage.removeItem(indexKey(sessionId));
      navigate('/aspirant/smart-practice');
    } catch (err) {
      toast.error('Abandon request failed.');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  //  DERIVED PALETTE COUNTS
  // ═══════════════════════════════════════════════════════════════════════════
  const totalQuestions  = questions.length;
  const answeredCount   = session?.questions?.filter(q => q.selectedAnswer)?.length  || 0;
  const markedCount     = session?.questions?.filter(q => q.isMarkedForReview)?.length || 0;
  const visitedCount    = session?.questions?.filter(q => q.visited)?.length          || 0;
  const unansweredCount = visitedCount - answeredCount;
  const notVisitedCount = totalQuestions - visitedCount;

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: LOADING
  // ═══════════════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading practice workspace…</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: ERROR
  // ═══════════════════════════════════════════════════════════════════════════
  if (error) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Something went wrong</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/aspirant/smart-practice" className="btn-secondary text-xs px-4 py-2">
              <FiSliders /> Change Filters
            </Link>
            <button onClick={fetchSession} className="btn-primary text-xs px-4 py-2">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STATE A – PRE-START
  // ═══════════════════════════════════════════════════════════════════════════
  if (session && session.status === 'created') {
    const subjectIds  = session.subjectIds || [];
    const topicIds    = session.topicIds   || [];
    const noQuestions = session._noQuestions;

    return (
      <div className="min-h-screen bg-[#030712] py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-accent-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-2xl mx-auto space-y-6 relative z-10">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Link to="/aspirant/smart-practice" className="hover:text-brand-400 transition-colors flex items-center gap-1">
              <FiSliders className="text-[10px]" /> Smart Practice
            </Link>
            <span>/</span>
            <span className="text-slate-400">Session Deck</span>
          </div>

          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiCheckSquare className="text-brand-400" />
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Practice Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ready to Begin?</h1>
            <p className="text-slate-500 text-xs mt-1">
              Review your session parameters, then hit{' '}
              <span className="text-brand-400 font-bold">Start Practice</span> to launch the countdown.
            </p>
          </div>

          {/* No-questions warning */}
          {noQuestions && (
            <div className="glass-card p-4 border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
              <FiAlertTriangle className="text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-amber-300">No Questions Available</p>
                <p className="text-amber-400 mt-1 leading-relaxed">
                  No questions are available for this practice setup yet. Add questions to the question bank or change your filters before starting.
                </p>
              </div>
            </div>
          )}

          {/* Parameters card */}
          <div className="glass-card p-6 sm:p-8 border-slate-800 space-y-6">

            {/* Key parameters grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-slate-800 pb-6">
              {[
                { label: 'Target Exam',       value: session.examId?.title || '—' },
                { label: 'Phase / Stage',     value: session.phaseId?.title || '—' },
                { label: 'Practice Mode',     value: (session.mode || '').replace(/_/g, ' '), accent: true },
                { label: 'Duration',          value: `${session.durationMinutes} minutes` },
                { label: 'Est. Questions',    value: `${session.requestedQuestionCount || '—'} questions` },
                { label: 'Difficulty',        value: session.difficultyPreference || 'mixed', cap: true },
                { label: 'Language',          value: session.language || 'english', cap: true },
                { label: 'Source Filter',     value: (session.sourceFilter || 'all').replace(/_/g, ' '), cap: true },
              ].map(({ label, value, accent, cap }) => (
                <div key={label} className="space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">{label}</span>
                  <p className={`text-sm font-bold ${accent ? 'text-brand-400 uppercase tracking-wide' : 'text-white'} ${cap ? 'capitalize' : ''}`}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Subject chips */}
            {subjectIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FiTag className="text-brand-400" /> Filtered Subjects
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {subjectIds.map((id, i) => (
                    <span key={i} className="text-[10px] font-bold text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-full">
                      {typeof id === 'object' ? id.title : `Subject ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Topic chips */}
            {topicIds.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FiTag className="text-accent-400" /> Filtered Topics
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {topicIds.map((id, i) => (
                    <span key={i} className="text-[10px] font-bold text-accent-300 bg-accent-500/10 border border-accent-500/20 px-2.5 py-1 rounded-full">
                      {typeof id === 'object' ? id.title : `Topic ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleStartSession}
                className="btn-primary w-full py-4 text-sm font-bold shadow-xl shadow-brand-500/20"
              >
                <FiPlay /> Start Practice
              </button>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/aspirant/smart-practice" className="btn-secondary py-3 text-xs font-bold justify-center">
                  <FiSliders /> Back to Smart Practice
                </Link>
                <Link to="/aspirant/practice-history" className="btn-secondary py-3 text-xs font-bold justify-center">
                  <FiClock /> Back to Practice History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER: STATE B – ACTIVE TEST
  // ═══════════════════════════════════════════════════════════════════════════
  const currentQuestion = questions[currentIndex];
  const currentTracking = session?.questions?.[currentIndex] || {};
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion  = currentIndex === totalQuestions - 1;
  const timerWarning    = timeLeft !== null && timeLeft < 300; // < 5 min
  const timerDanger     = timeLeft !== null && timeLeft < 120; // < 2 min

  return (
    <div className="min-h-screen bg-[#030712] flex flex-col text-slate-100">

      {/* ── Sticky header ── */}
      <header className="bg-dark-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 py-3 flex-wrap">

          {/* Left: branding + meta */}
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-base font-black text-white shrink-0">
              Target<span className="text-brand-400">Rank</span>
            </h1>
            <span className="w-px h-5 bg-slate-800 hidden sm:block shrink-0" />
            <div className="hidden sm:block min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">
                {session?.examId?.title}
                {session?.phaseId?.title ? ` — ${session.phaseId.title}` : ''}
              </p>
              <p className="text-[10px] text-slate-500 capitalize">
                {(session?.mode || '').replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          {/* Right: save pill + timer + submit + mobile palette toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* Save status */}
            <div className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg border ${
              saveStatus === 'saving'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : saveStatus === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-dark-950 border-slate-800 text-emerald-400'
            }`}>
              {saveStatus === 'saving' ? (
                <><FiLoader className="animate-spin" /><span>Saving…</span></>
              ) : saveStatus === 'error' ? (
                <><FiAlertCircle /><span>Unsaved</span></>
              ) : (
                <><FiSave /><span>Saved</span></>
              )}
            </div>

            {/* Countdown timer */}
            {session?.durationMinutes > 0 && (
              <div className={`flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-lg border transition-all ${
                timerDanger
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse'
                  : timerWarning
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    : 'bg-dark-950 border-slate-800 text-slate-300'
              }`}>
                <FiClock /><span>{formatTime(timeLeft)}</span>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => setShowSubmitModal(true)}
              disabled={submitting}
              className="btn-primary py-2 px-3 sm:px-5 text-xs font-bold shadow-md shadow-brand-500/20 disabled:opacity-50"
            >
              <FiCheckSquare className="hidden sm:inline" />
              <span>{session?.durationMinutes === 0 ? 'Finish Revision Practice' : 'Submit Test'}</span>
            </button>

            {/* Mobile palette toggle */}
            <button
              onClick={() => setIsPaletteOpen(p => !p)}
              className="md:hidden p-2 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-white transition-all"
              aria-label="Toggle palette"
            >
              {isPaletteOpen ? <FiX /> : <FiList />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main workspace ── */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row gap-4 p-3 sm:p-4 lg:p-6 items-start">

        {/* ── LEFT: Question panel ── */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 order-2 md:order-1">

          {currentQuestion ? (
            <div className="glass-card bg-dark-900/50 border-slate-800 p-5 sm:p-7 flex flex-col gap-5">

              {/* Question header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-extrabold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-md">
                    Question {currentIndex + 1} of {totalQuestions}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                    +{currentQuestion.marks ?? 2} marks
                  </span>
                  {(currentQuestion.negativeMarks ?? 0) > 0 && (
                    <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-md">
                      -{currentQuestion.negativeMarks} negative
                    </span>
                  )}
                  {currentQuestion.subjectId && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800/60 border border-slate-700/50 px-2 py-1 rounded-md">
                      {typeof currentQuestion.subjectId === 'object' ? currentQuestion.subjectId.title : 'Subject'}
                    </span>
                  )}
                  {currentQuestion.topicId && (
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800/40 border border-slate-700/30 px-2 py-1 rounded-md">
                      {typeof currentQuestion.topicId === 'object' ? currentQuestion.topicId.title : 'Topic'}
                    </span>
                  )}
                </div>

                {/* Bookmark */}
                <button
                  onClick={handleToggleBookmark}
                  title={currentTracking.isBookmarked ? 'Remove bookmark' : 'Bookmark question'}
                  className={`p-2 rounded-lg border transition-all shrink-0 ${
                    currentTracking.isBookmarked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : 'bg-dark-950 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <FiBookmark className={`text-sm ${currentTracking.isBookmarked ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Question text */}
              <div className="text-sm sm:text-[15px] text-slate-100 font-semibold leading-relaxed whitespace-pre-line bg-dark-950/50 border border-slate-800 rounded-xl p-4 sm:p-5">
                {currentQuestion.questionText}
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQuestion.options?.map((opt, oidx) => {
                  const optionVal = typeof opt === 'string' ? opt : opt.text;
                  const isSelected = currentTracking.selectedAnswer === optionVal;
                  const letter     = String.fromCharCode(65 + oidx);
                  return (
                    <button
                      key={oidx}
                      onClick={() => handleSelectOption(optionVal)}
                      className={`w-full text-left px-4 sm:px-5 py-3.5 border rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-brand-500/10 border-brand-500 text-white shadow-md shadow-brand-500/10'
                          : 'bg-dark-950/60 border-slate-800 text-slate-400 hover:border-slate-600 hover:bg-dark-900/40'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black border shrink-0 transition-all ${
                        isSelected
                          ? 'bg-brand-500 border-brand-500 text-white'
                          : 'bg-dark-900 border-slate-700 text-slate-500'
                      }`}>
                        {letter}
                      </span>
                      <span className="flex-1">
                        {typeof opt === 'string' ? opt : (
                          <div>
                            <div>{opt.text}</div>
                            {opt.textHindi && <div className="text-xs text-slate-400 font-normal mt-1">{opt.textHindi}</div>}
                          </div>
                        )}
                      </span>
                      {isSelected && <FiCheck className="text-brand-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Controls footer */}
              <div className="border-t border-slate-800 pt-5 flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={isFirstQuestion}
                    className="btn-secondary py-2.5 px-3.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <FiChevronLeft /> Previous
                  </button>
                  <button
                    onClick={handleSaveAndNext}
                    disabled={isLastQuestion}
                    className="btn-secondary py-2.5 px-3.5 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Save &amp; Next <FiChevronRight />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleClearResponse}
                    disabled={!currentTracking.selectedAnswer}
                    className="btn-secondary py-2.5 px-3.5 text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:text-rose-400"
                  >
                    Clear Response
                  </button>
                  <button
                    onClick={handleToggleReview}
                    className={`py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all ${
                      currentTracking.isMarkedForReview
                        ? 'bg-purple-500/15 border-purple-500 text-purple-300 hover:bg-purple-500/20'
                        : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    <FiFlag className="inline mr-1" />
                    {currentTracking.isMarkedForReview ? 'Remove Review' : 'Mark for Review'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card border-slate-800 p-12 text-center flex-1 flex flex-col justify-center items-center gap-3">
              <FiAlertCircle className="text-4xl text-amber-500" />
              <h3 className="text-base font-bold text-white">No Questions Available</h3>
              <p className="text-slate-500 text-xs">Please start a new session with different filters.</p>
            </div>
          )}

          {/* Abandon + mobile palette toggle */}
          <div className="flex justify-between items-center px-1">
            <button
              onClick={handleAbandon}
              className="text-xs font-semibold text-slate-600 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
            >
              <FiX /> Abandon Session
            </button>
            <button
              onClick={() => setIsPaletteOpen(p => !p)}
              className="md:hidden text-xs font-semibold text-brand-400 flex items-center gap-1.5"
            >
              <FiList /> {isPaletteOpen ? 'Hide Palette' : 'Show Palette'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: Question Palette ── */}
        <div className={`md:w-72 lg:w-80 w-full shrink-0 order-1 md:order-2 ${isPaletteOpen ? 'block' : 'hidden'} md:block`}>
          <div className="glass-card bg-dark-900/60 border-slate-800 p-5 md:sticky md:top-20 space-y-5">

            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FiList className="text-brand-400" /> Question Palette
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Click a number to jump to that question.</p>
            </div>

            {/* Counters */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Answered',          count: answeredCount,   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
                { label: 'Not Answered',      count: unansweredCount, color: 'text-rose-400    bg-rose-500/10    border-rose-500/20'    },
                { label: 'Marked for Review', count: markedCount,     color: 'text-purple-400  bg-purple-500/10  border-purple-500/20'  },
                { label: 'Not Visited',       count: notVisitedCount, color: 'text-slate-400   bg-slate-800/60   border-slate-700/50'   },
              ].map(({ label, count, color }) => (
                <div key={label} className={`rounded-lg border px-2.5 py-2 ${color}`}>
                  <p className="text-lg font-black">{count}</p>
                  <p className="text-[9px] font-bold opacity-80 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Palette grid */}
            <div className="grid grid-cols-5 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {session?.questions?.map((sq, idx) => (
                <button
                  key={idx}
                  onClick={() => goToQuestion(idx)}
                  className={`h-9 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all ${getPaletteClass(sq, idx === currentIndex)}`}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-3 pt-3 border-t border-slate-800 text-[9px] font-bold text-slate-500">
              {[
                { bg: 'bg-emerald-600/20 border-emerald-500',  label: 'Answered'            },
                { bg: 'bg-rose-600/10 border-rose-500/40',     label: 'Visited, Unanswered' },
                { bg: 'bg-purple-600/20 border-purple-500',    label: 'Marked for Review'   },
                { bg: 'bg-amber-500/20 border-amber-500',      label: 'Answered + Marked'   },
                { bg: 'bg-dark-950 border-slate-700',          label: 'Not Visited'         },
              ].map(({ bg, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded-sm border shrink-0 ${bg}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-dark-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="glass-card max-w-sm w-full p-7 border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                <FiCheckSquare className="text-xl text-brand-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {session?.durationMinutes === 0 ? 'Confirm Finish Revision' : 'Confirm Submission'}
                </h3>
                <p className="text-[10px] text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <ul className="space-y-2 border-y border-slate-800 py-4 text-xs font-bold">
              <li className="flex justify-between text-slate-300">
                <span>Total Questions</span><span className="text-white">{totalQuestions}</span>
              </li>
              <li className="flex justify-between text-emerald-400">
                <span>Answered</span><span>{answeredCount}</span>
              </li>
              <li className="flex justify-between text-rose-400">
                <span>Unanswered</span><span>{unansweredCount + notVisitedCount}</span>
              </li>
              <li className="flex justify-between text-purple-400">
                <span>Marked for Review</span><span>{markedCount}</span>
              </li>
            </ul>

            <p className="text-xs text-slate-400 leading-relaxed">
              You have{' '}
              <span className="text-rose-400 font-bold">{unansweredCount + notVisitedCount} unanswered</span>
              {' '}and{' '}
              <span className="text-purple-400 font-bold">{markedCount} marked-for-review</span>
              {' '}questions. Do you want to finalize?
            </p>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="btn-secondary py-2.5 px-4 text-xs font-bold"
              >
                Keep Reviewing
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={submitting}
                className="btn-primary py-2.5 px-5 text-xs font-bold"
              >
                {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                {session?.durationMinutes === 0 ? 'Finish Revision Practice' : 'Submit Practice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
