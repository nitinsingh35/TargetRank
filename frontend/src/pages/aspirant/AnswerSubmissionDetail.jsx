import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiClock, FiAward, FiBookmark, FiLoader, FiAlertCircle,
  FiFileText, FiCheck, FiX, FiActivity, FiChevronDown, FiChevronUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import answerWritingAPI from '../../api/answerWritingApi.js';

export default function AnswerSubmissionDetail() {
  const { submissionId } = useParams();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bookmark toggle loading tracker
  const [bookmarking, setBookmarking] = useState(false);

  // Model answer collapse trigger
  const [showModelAnswer, setShowModelAnswer] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [submissionId]);

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await answerWritingAPI.getSubmissionById(submissionId);
      if (data.success) {
        setSubmission(data.submission);
      } else {
        setError('Failed to load submission detail.');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Error retrieving descriptive practice report details.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!submission) return;
    setBookmarking(true);
    try {
      const { data } = await answerWritingAPI.toggleBookmark(submission._id);
      toast.success(data.isBookmarked ? 'Submission bookmarked.' : 'Bookmark removed.');
      setSubmission(prev => prev ? { ...prev, isBookmarked: data.isBookmarked } : null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to change bookmark state.');
    } finally {
      setBookmarking(false);
    }
  };

  const formatDuration = (totalSecs) => {
    if (!totalSecs) return '0m 0s';
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'reviewed':
        return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5';
      case 'under_review':
      case 'submitted':
        return 'text-amber-450 border-amber-500/30 bg-amber-500/5';
      case 'returned':
        return 'text-rose-400 border-rose-500/30 bg-rose-500/5';
      default:
        return 'text-slate-400 border-slate-800 bg-slate-900/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Loading practice details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md w-full p-8 border-rose-500/20 text-center space-y-5">
          <FiAlertCircle className="text-5xl text-rose-500 mx-auto" />
          <div>
            <h2 className="text-lg font-bold text-white">Details Unavailable</h2>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{error || 'Could not fetch practice logs.'}</p>
          </div>
          <button
            onClick={() => navigate('/aspirant/answer-writing/history')}
            className="btn-primary text-xs px-4 py-2 mx-auto justify-center"
          >
            Back to Answer History
          </button>
        </div>
      </div>
    );
  }

  const question = submission.descriptiveQuestionId || {};
  const feedback = submission.mentorFeedbackId || null;

  // Timeline markers progress
  const timelineSteps = [
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'reviewed', label: 'Reviewed' }
  ];

  const currentStepIndex = timelineSteps.findIndex(s => s.key === submission.status);
  
  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">

        {/* Back Link */}
        <div className="flex items-center justify-between gap-3">
          <Link to="/aspirant/answer-writing/history" className="flex items-center gap-1.5 text-xs text-slate-450 hover:text-white transition-colors font-bold">
            <FiArrowLeft /> Back to Answer History
          </Link>

          <button
            onClick={handleToggleBookmark}
            disabled={bookmarking}
            className="text-slate-400 hover:text-white p-2 rounded-lg border border-slate-800 bg-dark-950 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            {bookmarking ? (
              <FiLoader className="text-xs animate-spin" />
            ) : (
              <FiBookmark className={submission.isBookmarked ? 'fill-current text-brand-400' : ''} />
            )}
            <span>{submission.isBookmarked ? 'Bookmarked' : 'Bookmark Submission'}</span>
          </button>
        </div>

        {/* Question Details header */}
        <div className="glass-card p-6 sm:p-8 bg-dark-900/40 border-slate-800 space-y-5">
          <div className="flex justify-between items-center text-[10px] font-extrabold text-slate-500 flex-wrap gap-2 pb-2.5 border-b border-slate-850">
            <div className="flex gap-2">
              <span className="uppercase text-brand-400 bg-brand-500/10 border border-brand-500/25 px-2.5 py-0.5 rounded">
                {question.marks} Marks Max
              </span>
              <span className="bg-slate-850 border border-slate-750 px-2 py-0.5 rounded text-slate-350">
                Word Limit: {question.suggestedWordLimit} Words
              </span>
            </div>
            <div className="flex gap-1.5 capitalize text-slate-400">
              <span>Syllabus: {question.subjectId?.title} &gt; {question.topicId?.title}</span>
            </div>
          </div>

          <h2 className="text-sm sm:text-base font-extrabold text-slate-100 leading-relaxed">
            {question.questionText}
          </h2>
        </div>

        {/* Status Timeline Tracking Trace */}
        {submission.status !== 'returned' && (
          <div className="glass-card p-5 bg-dark-900/40 border-slate-850 space-y-3.5">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Submission Status Pipeline</h4>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
              {timelineSteps.map((step, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                
                return (
                  <React.Fragment key={step.key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-dark-950 font-black shadow-md shadow-amber-500/25'
                          : isActive
                            ? 'bg-emerald-500 text-white font-black'
                            : 'bg-slate-800 text-slate-500 border border-slate-750'
                      }`}>
                        {isActive && !isCurrent ? <FiCheck /> : idx + 1}
                      </div>
                      <span className={`text-[11px] font-bold ${
                        isCurrent
                          ? 'text-amber-400 font-extrabold'
                          : isActive
                            ? 'text-slate-200'
                            : 'text-slate-600'
                      }`}>
                        {step.label}
                      </span>
                    </div>

                    {idx < timelineSteps.length - 1 && (
                      <div className={`hidden sm:block flex-1 h-0.5 transition-all ${
                        idx < currentStepIndex ? 'bg-emerald-500/50' : 'bg-slate-800'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Draft Alert warning */}
        {submission.status === 'draft' && (
          <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="space-y-1">
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
                <FiAlertCircle /> Practice Draft Version Pending
              </h4>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                This answer sheet is a saved draft and has not been submitted for evaluation. Auto-save has captured last changes.
              </p>
            </div>
            
            <button
              onClick={() => navigate(`/aspirant/answer-writing/question/${question._id}`)}
              className="btn-primary py-2 px-4.5 text-xs font-bold shrink-0"
            >
              Continue Writing
            </button>
          </div>
        )}

        {/* Submission Details: split view */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Answer Area */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
              <FiFileText /> Written Answer Text
            </h3>
            <div className="bg-dark-900/40 border border-slate-800 rounded-2xl p-5 sm:p-6 h-[400px] overflow-y-auto text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
              {submission.answerText || 'No answer content captured.'}
            </div>
          </div>

          {/* Review Area */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
              <FiAward /> Expert Evaluation Feedback
            </h3>

            {submission.status === 'reviewed' && feedback ? (
              <div className="glass-card border-slate-800 bg-dark-900/40 p-5 sm:p-6 space-y-4">
                
                {/* Score card */}
                <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex justify-between items-center text-xs font-bold text-slate-400">
                  <span>Mentor Score Card</span>
                  <span className="text-2xl font-black text-white">
                    {feedback.marksAwarded} <span className="text-xs text-slate-500 font-bold">/ {feedback.maxMarks}</span>
                  </span>
                </div>

                {/* Ratings parameters */}
                <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
                  <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                    <span className="block text-[8px] text-slate-500 uppercase">Structure</span>
                    <span className="capitalize text-slate-200">{feedback.structureRating}</span>
                  </div>
                  <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                    <span className="block text-[8px] text-slate-500 uppercase">Content</span>
                    <span className="capitalize text-slate-200">{feedback.contentRating}</span>
                  </div>
                  <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                    <span className="block text-[8px] text-slate-500 uppercase">Presentation</span>
                    <span className="capitalize text-slate-200">{feedback.presentationRating}</span>
                  </div>
                </div>

                {/* Overall comments */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Review</span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-dark-950/40 p-3 rounded-lg border border-slate-850/60 whitespace-pre-line">
                    {feedback.overallFeedback}
                  </p>
                </div>

                {/* Paragraph reviews */}
                {(feedback.introductionFeedback || feedback.bodyFeedback || feedback.conclusionFeedback) && (
                  <div className="space-y-3 pt-3 border-t border-slate-855">
                    {feedback.introductionFeedback && (
                      <div className="space-y-0.5">
                        <strong className="text-[10px] text-slate-300 font-bold">Introduction Segment:</strong>
                        <p className="text-[11px] text-slate-400 leading-relaxed bg-dark-950/20 p-2.5 rounded border border-slate-850">{feedback.introductionFeedback}</p>
                      </div>
                    )}
                    {feedback.bodyFeedback && (
                      <div className="space-y-0.5">
                        <strong className="text-[10px] text-slate-300 font-bold">Body &amp; Core Content:</strong>
                        <p className="text-[11px] text-slate-400 leading-relaxed bg-dark-950/20 p-2.5 rounded border border-slate-850">{feedback.bodyFeedback}</p>
                      </div>
                    )}
                    {feedback.conclusionFeedback && (
                      <div className="space-y-0.5">
                        <strong className="text-[10px] text-slate-300 font-bold">Conclusion Segment:</strong>
                        <p className="text-[11px] text-slate-400 leading-relaxed bg-dark-950/20 p-2.5 rounded border border-slate-850">{feedback.conclusionFeedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold pt-1">
                  <div className="space-y-1">
                    <span className="text-emerald-450 uppercase">Key Strengths</span>
                    <ul className="list-disc pl-3 text-slate-400 font-semibold space-y-0.5">
                      {feedback.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <span className="text-rose-450 uppercase">Areas to Improve</span>
                    <ul className="list-disc pl-3 text-slate-400 font-semibold space-y-0.5">
                      {feedback.improvements?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                    </ul>
                  </div>
                </div>

                {/* Approach */}
                {feedback.suggestedAnswerApproach && (
                  <div className="space-y-1 pt-2 border-t border-slate-855">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Answer Approach</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-dark-950/40 p-3 rounded-lg border border-slate-855 whitespace-pre-wrap">
                      {feedback.suggestedAnswerApproach}
                    </p>
                  </div>
                )}

                {/* Graded Date */}
                <p className="text-[9px] text-slate-500 font-bold text-right">
                  Reviewed Date: {new Date(feedback.reviewedAt || feedback.createdAt).toLocaleDateString()}
                </p>

              </div>
            ) : submission.status === 'returned' && feedback ? (
              <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-5 space-y-3 text-xs text-rose-400">
                <p className="font-bold flex items-center gap-1.5"><FiAlertCircle /> returned for resubmission</p>
                <p className="leading-relaxed opacity-95">
                  {feedback.overallFeedback}
                </p>
                <button
                  onClick={() => navigate(`/aspirant/answer-writing/question/${question._id}`)}
                  className="btn-primary bg-rose-650 hover:bg-rose-550 border-rose-700 py-2.5 px-4 text-xs font-bold w-full justify-center text-white"
                >
                  Rewrite Answer Response
                </button>
              </div>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-8 text-xs text-amber-400 text-center py-16 space-y-2">
                <FiClock className="text-3xl text-amber-450 mx-auto" />
                <p className="font-bold">Evaluation in Progress</p>
                <p className="text-[10px] opacity-80 max-w-xs mx-auto leading-relaxed">
                  Your answer sheet has been registered on the expert mentor evaluations dashboard. Graded scores and comments will be available here soon.
                </p>
              </div>
            )}

          </div>

        </div>

        {/* Model Reference Answer collapsible card */}
        {submission.status === 'reviewed' && question.modelAnswer && (
          <div className="glass-card border-slate-800 bg-dark-900/40 p-5">
            <button
              onClick={() => setShowModelAnswer(m => !m)}
              className="w-full flex justify-between items-center text-xs font-bold text-slate-300 hover:text-white"
            >
              <span className="flex items-center gap-1.5">
                <FiActivity className="text-emerald-450" /> Collapsible Reference Answer (Standard guidelines)
              </span>
              <span>{showModelAnswer ? <FiChevronUp /> : <FiChevronDown />}</span>
            </button>

            {showModelAnswer && (
              <div className="pt-4 border-t border-slate-855 mt-4 space-y-2.5 text-xs text-slate-400 leading-relaxed">
                <blockquote className="border-l-2 border-brand-500 pl-3 italic text-slate-500 text-[10px]">
                  Important Note: This is a high-level reference framework model answer. It represents one strong approach structure and is not the only correct response format.
                </blockquote>
                <p className="bg-dark-950/80 p-4 rounded-xl border border-slate-855 whitespace-pre-wrap">
                  {question.modelAnswer}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Global Nav Bottom buttons */}
        <div className="flex gap-2.5 justify-end">
          <button
            onClick={() => navigate('/aspirant/answer-writing')}
            className="btn-secondary py-2.5 px-4 text-xs font-bold border-slate-800 hover:bg-slate-900"
          >
            Practice Another Question
          </button>
          
          <button
            onClick={() => navigate('/aspirant/answer-writing/history')}
            className="btn-primary py-2.5 px-5 text-xs font-bold"
          >
            Back to Answer History
          </button>
        </div>

      </div>
    </div>
  );
}
