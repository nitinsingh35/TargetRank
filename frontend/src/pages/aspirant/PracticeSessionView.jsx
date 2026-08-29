import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FiClock, FiCheckSquare, FiChevronLeft, FiChevronRight, FiList, FiBookmark } from 'react-icons/fi';
import toast from 'react-hot-toast';
import practiceAPI from '../../api/practiceApi.js';
import questionAPI from '../../api/questionApi.js';

export default function PracticeSessionView() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { questions = [], durationMinutes = 30, sessionTitle = 'Smart Practice' } = location.state || {};

  useEffect(() => {
    if (questions.length === 0) {
      toast.error('Session state missing. Start from the practice deck.');
      navigate('/aspirant/smart-practice');
    }
  }, [questions, navigate]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qid]: optionText }
  const [markedForReview, setMarkedForReview] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { data } = await questionAPI.getBookmarks();
        setBookmarkedIds(data.map(b => b._id));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBookmarks();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = async (qid, optionText) => {
    setAnswers(prev => ({ ...prev, [qid]: optionText }));
    try {
      await practiceAPI.saveAnswer(sessionId, { questionId: qid, selectedOption: optionText });
    } catch (err) {
      console.warn('Auto-save answer failed');
    }
  };

  const handleClearAnswer = async (qid) => {
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[qid];
      return updated;
    });
    try {
      await practiceAPI.saveAnswer(sessionId, { questionId: qid, selectedOption: null });
    } catch (err) {
      console.warn('Auto-save clear failed');
    }
  };

  const handleToggleReview = (qid) => {
    setMarkedForReview(prev =>
      prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    );
  };

  const handleToggleBookmark = async (qid) => {
    try {
      const { data } = await questionAPI.toggleBookmark(qid);
      if (data.bookmarked) {
        setBookmarkedIds(prev => [...prev, qid]);
        toast.success('Question bookmarked!');
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== qid));
        toast.success('Bookmark removed.');
      }
    } catch (err) {
      toast.error('Failed to update bookmark.');
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    toast.loading('Timer expired. Auto-submitting practice quiz...', { id: 'submit-toast' });
    try {
      await practiceAPI.submitSession(sessionId);
      toast.success('Practice session submitted!', { id: 'submit-toast' });
      navigate(`/aspirant/practice-session/${sessionId}/result`);
    } catch (err) {
      toast.error('Submission failed.', { id: 'submit-toast' });
    }
  };

  const handleManualSubmit = async () => {
    if (!window.confirm('Do you want to finalize and submit your practice session?')) return;
    setSubmitting(true);
    toast.loading('Submitting practice answers...', { id: 'submit-toast' });
    try {
      await practiceAPI.submitSession(sessionId);
      toast.success('Practice session submitted!', { id: 'submit-toast' });
      navigate(`/aspirant/practice-session/${sessionId}/result`);
    } catch (err) {
      toast.error('Submission failed.', { id: 'submit-toast' });
      setSubmitting(false);
    }
  };

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const qIdStr = currentQ._id;

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col">
      {/* Top sticky timer bar */}
      <div className="bg-dark-900 border-b border-slate-900 sticky top-[72px] z-40 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 font-bold text-white truncate max-w-sm sm:max-w-md">
            <FiCheckSquare className="text-brand-400 shrink-0" />
            <span className="truncate">{sessionTitle}</span>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 font-extrabold ${
              timeLeft < 120 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' : 'bg-dark-950 border-slate-800 text-slate-300'
            }`}>
              <FiClock /> {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold px-4 py-1.5 rounded-xl transition-all shadow-md text-[11px]"
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>

      {/* Main body split */}
      <div className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Quiz question pane */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-8 bg-dark-900 border-slate-850 space-y-6 min-h-[400px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>QUESTION {currentIndex + 1} OF {questions.length}</span>
                
                <button
                  onClick={() => handleToggleBookmark(qIdStr)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    bookmarkedIds.includes(qIdStr) ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-dark-950 border-slate-800 text-slate-550'
                  }`}
                >
                  <FiBookmark className={bookmarkedIds.includes(qIdStr) ? 'fill-current' : ''} />
                </button>
              </div>

              {/* Question Text */}
              <div className="text-sm sm:text-base font-semibold text-slate-200 leading-relaxed whitespace-pre-line border-b border-slate-900 pb-5">
                {currentQ.questionText}
              </div>

              {/* MCQ Options list */}
              <div className="space-y-3 pt-3">
                {currentQ.options.map((opt, oidx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isSel = answers[qIdStr] === opt;
                  return (
                    <button
                      key={oidx}
                      onClick={() => handleSelectOption(qIdStr, opt)}
                      className={`w-full text-left px-5 py-4 border rounded-xl flex items-center gap-4 text-xs transition-all ${
                        isSel
                          ? 'border-brand-500 bg-brand-500/5 text-brand-300'
                          : 'border-slate-850 bg-dark-950/40 hover:border-slate-700/80 text-slate-400'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        isSel ? 'bg-brand-500 text-white' : 'bg-dark-800 text-slate-500'
                      }`}>
                        {letters[oidx]}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom action controls */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-900 flex-wrap gap-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentIndex(prev => prev - 1)}
                  disabled={currentIndex === 0}
                  className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                >
                  <FiChevronLeft className="inline mr-1" /> Prev
                </button>
                <button
                  onClick={() => setCurrentIndex(prev => prev + 1)}
                  disabled={currentIndex === questions.length - 1}
                  className="btn-secondary py-2 px-3 text-xs disabled:opacity-40"
                >
                  Next <FiChevronRight className="inline ml-1" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleClearAnswer(qIdStr)}
                  disabled={!answers[qIdStr]}
                  className="bg-dark-950 hover:bg-dark-800 border border-slate-800 text-slate-500 hover:text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all"
                >
                  Clear Answer
                </button>
                <button
                  onClick={() => handleToggleReview(qIdStr)}
                  className={`px-4 py-2 border rounded-xl text-xs font-semibold transition-all ${
                    markedForReview.includes(qIdStr)
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-dark-950 border-slate-800 text-slate-550 hover:text-slate-350'
                  }`}
                >
                  {markedForReview.includes(qIdStr) ? 'Marked' : 'Review Later'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Palette sidebar */}
        <div className="space-y-6">
          <div className="glass-card p-6 bg-dark-900 border-slate-850 space-y-6">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-850 pb-3">
              <FiList className="text-brand-400" /> Question Palette
            </h3>

            <div className="grid grid-cols-5 gap-2.5">
              {questions.map((q, idx) => {
                const qid = q._id;
                const isCurrent = idx === currentIndex;
                const isAnswered = !!answers[qid];
                const isMarked = markedForReview.includes(qid);

                let badgeStyle = 'bg-dark-950 border-slate-850 text-slate-500 hover:border-slate-650';
                if (isAnswered) {
                  badgeStyle = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20';
                } else if (isMarked) {
                  badgeStyle = 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20';
                }

                if (isCurrent) {
                  badgeStyle += ' ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-900';
                }

                return (
                  <button
                    key={qid}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold transition-all ${badgeStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Colors guides */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-850 text-[10px] font-semibold text-slate-550">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-500/10 border border-emerald-500/30"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-purple-500/10 border border-purple-500/30"></span>
                <span>Review</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
