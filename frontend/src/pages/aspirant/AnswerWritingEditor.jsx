import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiCheck, FiSave, FiAlertCircle, FiLoader,
  FiPlay, FiPause, FiRotateCcw, FiBookOpen, FiArrowLeft, FiEdit3
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import answerWritingAPI from '../../api/answerWritingApi.js';

export default function AnswerWritingEditor() {
  const { questionId } = useParams();
  const navigate = useNavigate();

  // Core data states
  const [question, setQuestion] = useState(null);
  const [submissionId, setSubmissionId] = useState(null); // Set if draft exists
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Framework hints visibility
  const [showFramework, setShowFramework] = useState(false);

  // Timer states
  const [timeTaken, setTimeTaken] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef(null);

  // Auto-save states
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved, saving, error
  const autoSaveIntervalRef = useRef(null);
  const answerTextRef = useRef(answerText);
  const timeTakenRef = useRef(timeTaken);

  // Keep references updated for intervals
  useEffect(() => {
    answerTextRef.current = answerText;
  }, [answerText]);

  useEffect(() => {
    timeTakenRef.current = timeTaken;
  }, [timeTaken]);

  // Submission modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selfRating, setSelfRating] = useState('good');
  const [submitting, setSubmitting] = useState(false);

  // 1. Initial Load: Load question and search for existing drafts
  const initPage = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Load question details
      const { data: qData } = await answerWritingAPI.getQuestionById(questionId);
      if (qData.success) {
        setQuestion(qData.question);
      }

      // Check user's history to locate any existing 'draft' submissions
      const { data: subData } = await answerWritingAPI.getSubmissionHistory({
        examId: qData.question.examId?._id,
        status: 'draft',
      });

      // Filter drafts matching this descriptiveQuestionId
      const matchedDraft = (subData.submissions || []).find(
        sub => sub._id // We need detailed info, fetch detailed if match found
      );

      // Fetch the full details of the latest draft matching this question
      if (matchedDraft) {
        // Let's call getSubmissionHistory or fetch specifically
        // To be safe, let's load all submissions and find matching question
        const { data: fullSubHistory } = await answerWritingAPI.getSubmissionHistory({ limit: 100 });
        const draft = (fullSubHistory.submissions || []).find(
          s => s.status === 'draft' // get draft status
        );
        // Wait, getSubmissionById to load detailed text
        const draftDetails = await answerWritingAPI.getSubmissionHistory(); // list
        // Let's filter by checking if any submission matches this questionId
        // We can query all submissions of this user
        const response = await answerWritingAPI.getSubmissionHistory({ limit: 100 });
        // Let's search inside user's historical submissions
        // Wait! The history API returned a simplified list. Let's find if there is an active draft:
        // We can search through the list or fetch one.
        const matchingDraftHeader = (response.submissions || []).find(
          s => s.status === 'draft' // draft
        );
        
        // Wait, let's write a simple query. The list has `_id`. Let's fetch the detail:
        if (matchingDraftHeader) {
          const { data: detailData } = await answerWritingAPI.getSubmissionById(matchingDraftHeader._id);
          if (detailData.success && detailData.submission.descriptiveQuestionId?._id === questionId) {
            setSubmissionId(detailData.submission._id);
            setAnswerText(detailData.submission.answerText || '');
            setTimeTaken(detailData.submission.timeTakenSeconds || 0);
            setLastSaved(new Date(detailData.submission.lastSavedAt || detailData.submission.updatedAt));
          }
        }
      }

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load writing session.');
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    initPage();
  }, [initPage]);

  // 2. Timer Tick interval
  useEffect(() => {
    if (isTimerRunning && !loading && !error) {
      timerRef.current = setInterval(() => {
        setTimeTaken(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, loading, error]);

  // 3. Save Draft handler
  const handleSaveDraft = useCallback(async (isAuto = false) => {
    // Skip if not edited or empty initially
    if (!answerTextRef.current && isAuto) return;

    setSaveStatus('saving');
    try {
      if (submissionId) {
        // Update existing draft
        await answerWritingAPI.saveDraft(submissionId, {
          answerText: answerTextRef.current,
          timeTakenSeconds: timeTakenRef.current,
        });
      } else {
        // Create new draft submission
        const { data } = await answerWritingAPI.createSubmission({
          descriptiveQuestionId: questionId,
          answerText: answerTextRef.current,
          timeTakenSeconds: timeTakenRef.current,
          status: 'draft',
        });
        if (data.success && data.submissionId) {
          setSubmissionId(data.submissionId);
        }
      }
      setSaveStatus('saved');
      setLastSaved(new Date());
      if (!isAuto) {
        toast.success('Draft saved successfully.');
      }
    } catch (err) {
      console.error('Failed to save draft details', err);
      setSaveStatus('error');
      if (!isAuto) {
        toast.error('Draft save failed. Please check internet.');
      }
    }
  }, [submissionId, questionId]);

  // 4. Auto save timer (every 12 seconds)
  useEffect(() => {
    if (!loading && !error) {
      autoSaveIntervalRef.current = setInterval(() => {
        handleSaveDraft(true);
      }, 12000);
    }
    return () => clearInterval(autoSaveIntervalRef.current);
  }, [handleSaveDraft, loading, error]);

  // 5. Final Submission Handler
  const handleFinalSubmit = async () => {
    if (!answerText.trim()) {
      toast.error('Cannot submit an empty response.');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Submitting descriptive answer sheet...');
    try {
      let finalSubId = submissionId;

      // 1. If no draft exists, create one first in draft state with ratings
      if (!finalSubId) {
        const { data: createRes } = await answerWritingAPI.createSubmission({
          descriptiveQuestionId: questionId,
          answerText,
          timeTakenSeconds: timeTaken,
          aspirantSelfRating: selfRating,
          status: 'draft',
        });
        finalSubId = createRes.submissionId;
      } else {
        // Update final draft stats first
        await answerWritingAPI.saveDraft(finalSubId, {
          answerText,
          timeTakenSeconds: timeTaken,
        });
      }

      // 2. Submit the answer officially
      const { data: submitRes } = await answerWritingAPI.submitAnswer(finalSubId);
      if (submitRes.success) {
        clearInterval(timerRef.current);
        clearInterval(autoSaveIntervalRef.current);
        toast.success('Answer submitted successfully!', { id: toastId });
        setShowSubmitModal(false);
        // Redirect to submissions history list
        navigate('/aspirant/answer-writing/history');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Submission failed.', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper formats
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Word count calculations
  const wordCount = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;
  const wordLimitExceeded = question && wordCount > question.suggestedWordLimit;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading editor interface...</p>
        </div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Editor Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch question details.'}</p>
          </div>
          <button
            onClick={() => navigate('/aspirant/answer-writing')}
            className="btn-primary text-xs px-4 py-2 mx-auto justify-center"
          >
            Back to Practice Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-6 relative z-10">

        {/* Back Link */}
        <Link to="/aspirant/answer-writing" className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors font-bold">
          <FiArrowLeft /> Back to Question Library
        </Link>

        {/* Layout Split Grid: Question description and framework hints / TextArea editor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left panel: Question and hints */}
          <div className="space-y-6">
            
            {/* Question Details card */}
            <div className="glass-card p-6 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500">
                <span className="uppercase tracking-wider text-brand-400 bg-brand-500/10 border border-brand-500/25 px-2.5 py-0.5 rounded">
                  {question.marks} Marks
                </span>
                <span className="capitalize">{question.difficulty}</span>
              </div>

              <h2 className="text-sm font-extrabold text-white leading-relaxed">
                {question.questionText}
              </h2>

              <ul className="space-y-2 text-[10px] font-bold text-slate-450 pt-2 border-t border-slate-850">
                <li className="flex justify-between">
                  <span>Word Limit</span><span className="text-slate-200">{question.suggestedWordLimit} Words</span>
                </li>
                {question.suggestedTimeMinutes > 0 && (
                  <li className="flex justify-between">
                    <span>Suggested Time</span><span className="text-slate-200">{question.suggestedTimeMinutes} Mins</span>
                  </li>
                )}
                <li>
                  <span className="block opacity-60">Syllabus Tags</span>
                  <p className="text-[9px] text-slate-350 bg-dark-950 px-2.5 py-1.5 rounded border border-slate-850 mt-1">
                    {question.subjectId?.title} &gt; {question.topicId?.title}
                  </p>
                </li>
              </ul>
            </div>

            {/* Framework Hints toggle */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-3">
              <button
                onClick={() => setShowFramework(f => !f)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-350 hover:text-white transition-colors"
              >
                <span>Answer Framework Hints</span>
                <span>{showFramework ? 'Hide' : 'Show'}</span>
              </button>

              {showFramework && (
                <div className="space-y-4 pt-3 border-t border-slate-850 text-xs text-slate-400 leading-relaxed">
                  
                  {question.answerFramework?.introductionHints && (
                    <div className="space-y-0.5">
                      <strong className="text-slate-300 font-bold">Introduction:</strong>
                      <p>{question.answerFramework.introductionHints}</p>
                    </div>
                  )}

                  {question.answerFramework?.bodyHints && (
                    <div className="space-y-0.5">
                      <strong className="text-slate-300 font-bold">Body Arguments:</strong>
                      <p>{question.answerFramework.bodyHints}</p>
                    </div>
                  )}

                  {question.answerFramework?.conclusionHints && (
                    <div className="space-y-0.5">
                      <strong className="text-slate-300 font-bold">Conclusion:</strong>
                      <p>{question.answerFramework.conclusionHints}</p>
                    </div>
                  )}

                  {question.answerFramework?.keywords?.length > 0 && (
                    <div className="space-y-1">
                      <strong className="text-slate-300 font-bold">Suggested Keywords:</strong>
                      <div className="flex flex-wrap gap-1">
                        {question.answerFramework.keywords.map((kw, idx) => (
                          <span key={idx} className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-semibold">{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {question.answerFramework?.examples?.length > 0 && (
                    <div className="space-y-1">
                      <strong className="text-slate-300 font-bold">Case Studies / Examples:</strong>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {question.answerFramework.examples.map((ex, idx) => (
                          <li key={idx}>{ex}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Empty state hints */}
                  {!question.answerFramework?.introductionHints &&
                   !question.answerFramework?.bodyHints && (
                     <p className="text-[10px] text-slate-500 italic">No hints framework is loaded for this question yet.</p>
                   )}

                </div>
              )}
            </div>

          </div>

          {/* Right panel: textarea editor */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Editor header control details */}
            <div className="glass-card p-4 bg-dark-900/40 border-slate-850 flex items-center justify-between flex-wrap gap-4">
              
              {/* Timer clock */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5 bg-dark-950 border border-slate-800 px-3 py-1.5 rounded-lg">
                  <FiClock className="text-slate-500 shrink-0" />
                  <span>{formatTime(timeTaken)}</span>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => setIsTimerRunning(r => !r)}
                    className="p-2 border border-slate-800 rounded-lg bg-dark-950 text-slate-400 hover:text-white text-xs"
                    title={isTimerRunning ? 'Pause timer' : 'Start timer'}
                  >
                    {isTimerRunning ? <FiPause /> : <FiPlay />}
                  </button>
                  <button
                    onClick={() => setTimeTaken(0)}
                    className="p-2 border border-slate-800 rounded-lg bg-dark-950 text-slate-400 hover:text-white text-xs"
                    title="Reset clock"
                  >
                    <FiRotateCcw />
                  </button>
                </div>
              </div>

              {/* Status information save indicators */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg border ${
                  saveStatus === 'saving'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : saveStatus === 'error'
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-dark-950 border-slate-800 text-emerald-400'
                }`}>
                  {saveStatus === 'saving' ? (
                    <><FiLoader className="animate-spin" /><span>Saving draft…</span></>
                  ) : saveStatus === 'error' ? (
                    <><FiAlertCircle /><span>Unsaved</span></>
                  ) : (
                    <><FiCheck /><span>Draft Saved</span></>
                  )}
                </div>

                {lastSaved && (
                  <span className="text-[9px] text-slate-500 font-bold">
                    Last Saved: {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>

            </div>

            {/* Answer writing editor content */}
            <div className="space-y-2">
              <textarea
                placeholder="Type your descriptive answer sheet analysis here..."
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-2xl px-5 py-4 text-xs sm:text-sm text-slate-200 placeholder-slate-650 h-[380px] font-mono leading-relaxed"
              />

              {/* Counts footer bar */}
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 px-1">
                <span>Suggested: {question.suggestedWordLimit} Words max</span>
                <span className={wordLimitExceeded ? 'text-amber-500 font-black animate-pulse' : 'text-slate-400'}>
                  Word Count: {wordCount} {wordLimitExceeded && `(${wordCount - question.suggestedWordLimit} exceeded)`}
                </span>
              </div>
            </div>

            {/* Bottom Actions footer bar */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleSaveDraft(false)}
                className="btn-secondary py-2.5 px-4.5 text-xs font-bold border-slate-800 hover:bg-slate-900"
              >
                <FiSave /> Save Draft
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="btn-primary py-2.5 px-5 text-xs font-bold shadow-md shadow-brand-500/15"
              >
                <FiEdit3 /> Submit Practice Answer
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Submission Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-[#030712]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-slate-800 space-y-4">
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                <FiBookOpen className="text-lg" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Submit Descriptive Answer</h3>
                <p className="text-[10px] text-slate-550">This registers your descriptive practice to mentor desks.</p>
              </div>
            </div>

            <ul className="space-y-2 border-y border-slate-800 py-3 text-xs font-bold text-slate-450">
              <li className="flex justify-between">
                <span>Final Word Count</span>
                <span className={wordLimitExceeded ? 'text-amber-500' : 'text-white'}>{wordCount} Words</span>
              </li>
              <li className="flex justify-between">
                <span>Time Spent</span><span className="text-white">{formatTime(timeTaken)}</span>
              </li>
            </ul>

            {/* Aspirant self-evaluation selector */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Aspirant Self-Rating
              </label>
              <select
                value={selfRating}
                onChange={(e) => setSelfRating(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
              >
                <option value="poor">Poor (Need major improvement)</option>
                <option value="average">Average (Meets basic metrics)</option>
                <option value="good">Good (Strong arguments presented)</option>
                <option value="excellent">Excellent (Best approach framework)</option>
              </select>
            </div>

            <p className="text-[10px] text-slate-450 leading-relaxed">
              Once submitted, you will not be able to edit this answer draft. Mentors will review your writing structure and provide comments.
            </p>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                disabled={submitting}
                className="btn-secondary py-2 px-4 text-xs font-bold"
              >
                Keep Editing
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={submitting}
                className="btn-primary py-2 px-5 text-xs font-bold"
              >
                {submitting ? <FiLoader className="animate-spin" /> : <FiCheck />}
                <span>Confirm &amp; Submit</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
