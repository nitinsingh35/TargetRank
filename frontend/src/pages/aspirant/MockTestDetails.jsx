import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiClock, FiAward, FiBookOpen, FiAlertCircle, 
  FiArrowLeft, FiCheckCircle, FiPlay, FiList 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import mockTestAPI from '../../api/mockTestApi.js';

export default function MockTestDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const { data } = await mockTestAPI.getMockTest(id);
      if (data.success) {
        setTest(data.mockTest);
        setAttempts(data.attempts || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load mock test details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartAttempt = async (allowShortage = false) => {
    setStarting(true);
    try {
      const { data } = await mockTestAPI.startAttempt(id, { allowShortageMode: allowShortage });
      if (data.success) {
        toast.success(data.message || 'Attempt started.');
        navigate(`/aspirant/mock-tests/attempt/${data.attemptId}`);
      }
    } catch (err) {
      console.error(err);
      const res = err.response?.data;
      if (res?.shortage) {
        if (window.confirm(`${res.message}\n\nDo you want to start the test in Available-Count Mode with fewer questions?`)) {
          handleStartAttempt(true);
        }
      } else {
        toast.error(res?.message || 'Failed to start mock test attempt.');
      }
    } finally {
      setStarting(false);
      setShowConfirmModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="glass-card max-w-md p-6 border-slate-800 text-center space-y-4">
          <FiAlertCircle className="text-3xl text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Mock Test Not Found</h3>
          <p className="text-slate-500 text-xs leading-normal">
            This test has not been published or does not exist.
          </p>
          <Link to="/aspirant/mock-tests" className="btn-secondary py-2 px-4 text-xs font-bold border-slate-800 inline-block">
            Back to Mock Suite
          </Link>
        </div>
      </div>
    );
  }

  const sections = test.examPattern?.sections || [];
  const limit = test.attemptLimit || 1;
  const isLimitReached = attempts.filter(a => a.status === 'submitted').length >= limit;
  const hasActiveAttempt = attempts.some(a => ['created', 'started'].includes(a.status));
  const activeAttempt = attempts.find(a => ['created', 'started'].includes(a.status));

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Back navigation link */}
        <Link to="/aspirant/mock-tests" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-bold">
          <FiArrowLeft /> Back to Mock Suite
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title card */}
            <div className="glass-card p-6 bg-dark-900/30 border-slate-850 space-y-3">
              <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {test.category.replace('_', ' ')}
              </span>
              <h1 className="text-xl font-extrabold text-white">{test.title}</h1>
              {test.description && <p className="text-slate-400 text-xs leading-relaxed">{test.description}</p>}
            </div>

            {/* Test rules & Instructions */}
            <div className="glass-card p-6 bg-dark-900/30 border-slate-850 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Attempt Guidelines</h3>
              
              <div className="space-y-3 text-xs text-slate-400 leading-normal">
                {test.language === 'hindi' ? (
                  <p className="whitespace-pre-line">{test.instructionsHindi || 'कोई निर्देश उपलब्ध नहीं हैं।'}</p>
                ) : test.language === 'bilingual' ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">English</p>
                      <p className="whitespace-pre-line">{test.instructions || 'No instructions provided.'}</p>
                    </div>
                    <div className="pt-3 border-t border-slate-850">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Hindi</p>
                      <p className="whitespace-pre-line">{test.instructionsHindi || 'कोई निर्देश उपलब्ध नहीं हैं।'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line">{test.instructions || 'No instructions provided.'}</p>
                )}

                <div className="bg-[#030712]/50 border border-slate-850 p-4 rounded-xl space-y-2 mt-4">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Core Exam Constraints</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                    <li>This test contains <strong className="text-slate-200">{test.totalQuestions} questions</strong> worth <strong className="text-slate-200">{test.totalMarks} marks</strong>.</li>
                    <li>The overall duration is <strong className="text-slate-200">{test.durationMinutes} minutes</strong>.</li>
                    {test.negativeMarkingEnabled && (
                      <li>Negative marking is enabled. Incorrect attempts subtract <strong className="text-slate-200">{test.defaultNegativeMarks} marks</strong>.</li>
                    )}
                    <li>Passing criteria: securing at least <strong className="text-slate-200">{test.passingMarks} marks</strong>.</li>
                    <li>You are permitted to attempt this test a maximum of <strong className="text-slate-200">{limit} time(s)</strong>.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pattern Sections summary */}
            {sections.length > 0 && (
              <div className="glass-card bg-dark-900/30 border-slate-850 p-6 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Exam Pattern Sections</h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500 font-bold">
                        <th className="py-2.5">Section Name</th>
                        <th className="py-2.5 text-center">Questions</th>
                        <th className="py-2.5 text-center">Marks/Q</th>
                        <th className="py-2.5 text-center">Neg Marks</th>
                        <th className="py-2.5 text-right">Sec Timer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850 text-slate-300 font-medium">
                      {sections.sort((a, b) => a.order - b.order).map((sec, idx) => (
                        <tr key={idx} className="hover:bg-dark-900/10">
                          <td className="py-3 font-bold text-white">{sec.name}</td>
                          <td className="py-3 text-center text-slate-400">{sec.questionCount}</td>
                          <td className="py-3 text-center text-slate-400">+{sec.marksPerQuestion}</td>
                          <td className="py-3 text-center text-rose-500">-{sec.negativeMarks}</td>
                          <td className="py-3 text-right text-slate-400">
                            {sec.durationMinutes > 0 ? `${sec.durationMinutes}m` : 'None'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Action sidebar */}
          <div className="space-y-6">
            {/* Start Console card */}
            <div className="glass-card p-6 bg-dark-900/50 border-slate-800 text-center space-y-4">
              <FiAward className="text-3xl text-brand-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Simulate Mock</h3>
                <p className="text-[10px] text-slate-500 mt-1">Ready to attempt this mock exam under tight time bounds?</p>
              </div>

              <div className="pt-2">
                {hasActiveAttempt ? (
                  <button
                    onClick={() => navigate(`/aspirant/mock-tests/attempt/${activeAttempt._id}`)}
                    className="w-full btn-primary bg-amber-600 hover:bg-amber-500 border-amber-600 py-2.5 rounded-xl text-xs font-bold transition-all"
                  >
                    Resume In-Progress Attempt
                  </button>
                ) : isLimitReached ? (
                  <div className="p-3 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl text-[11px] font-semibold">
                    Attempt limit reached ({attempts.filter(a => a.status === 'submitted').length} / {limit})
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmModal(true)}
                    disabled={starting}
                    className="w-full btn-primary py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                  >
                    <FiPlay /> Start Mock Test
                  </button>
                )}
              </div>
            </div>

            {/* Attempt history list */}
            <div className="glass-card p-6 bg-dark-900/30 border-slate-850 space-y-4">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FiList /> Previous Attempts ({attempts.filter(a => a.status === 'submitted').length})
              </h3>

              {attempts.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic">No past attempts logged for this mock.</p>
              ) : (
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {attempts.map((att, idx) => {
                    const isSubmitted = att.status === 'submitted';
                    return (
                      <div key={idx} className="p-3 bg-[#030712] border border-slate-850 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-200">Attempt {attempts.length - idx}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(att.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>

                        <div>
                          {isSubmitted ? (
                            <Link
                              to={`/aspirant/mock-tests/attempt/${att._id}/result`}
                              className="text-[10px] font-bold text-brand-400 hover:underline"
                            >
                              Result: {att.score} Marks ({att.accuracy}% Acc)
                            </Link>
                          ) : (
                            <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full capitalize">
                              {att.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Start Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 bg-[#000]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full p-6 border-slate-800 bg-[#030712]/95 space-y-4 text-center">
              <FiAlertCircle className="text-4xl text-amber-400 mx-auto animate-pulse" />
              
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Start Timed Mock Exam?</h3>
                <p className="text-slate-400 text-xs leading-normal mt-2">
                  Once started, the mock test timer of <strong className="text-white">{test.durationMinutes} minutes</strong> will begin immediately. 
                  Refresh or tab closure will not pause the countdown.
                </p>
              </div>

              <div className="p-3.5 bg-dark-950 border border-slate-850 rounded-xl text-left text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Important Reminders:</p>
                <p>• Avoid switching tabs or minimizing the browser window during the attempt.</p>
                <p>• Answers are auto-saved in progress.</p>
                <p>• The test will auto-submit when the countdown hits zero.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 btn-secondary py-2 text-xs font-bold border-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleStartAttempt(false)}
                  disabled={starting}
                  className="flex-1 btn-primary py-2 text-xs font-bold"
                >
                  {starting ? 'Generating...' : 'Start Now'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
