import React from 'react';
import { FiX, FiCheckCircle, FiInfo, FiTag, FiClock, FiFileText } from 'react-icons/fi';

const TYPE_LABELS = {
  mcq: 'Multiple Choice (Single)',
  multiple_select: 'Multiple Choice (Multiple Correct)',
  true_false: 'True / False',
  assertion_reason: 'Assertion - Reason',
  match_the_following: 'Match the Following',
  statement_based: 'Statement Based',
  passage_based: 'Passage Based',
  numerical: 'Numerical Answer',
  descriptive: 'Descriptive/Written',
  interview: 'Interview Question',
  case_study: 'Case Study',
};

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
};

const STATUS_COLORS = {
  draft: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  pending_review: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  approved: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  rejected: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  published: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  archived: 'text-slate-500 bg-slate-800/10 border-slate-700/20',
};

export default function QuestionPreviewModal({ question, onClose }) {
  if (!question) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#0b0f19] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-850">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FiFileText className="text-brand-400" />
              Question Preview
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">ID: {question._id}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
            <FiX className="text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Question Texts */}
          <div className="space-y-4">
            <div className="bg-dark-900/50 border border-slate-800/60 rounded-xl p-4">
              <div className="text-[10px] font-bold text-brand-400 uppercase tracking-widest mb-1.5">Question (English)</div>
              <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: question.questionText }} />
            </div>
            {question.questionHindi && (
              <div className="bg-dark-900/50 border border-slate-800/60 rounded-xl p-4">
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1.5">Question (Hindi)</div>
                <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium" dangerouslySetInnerHTML={{ __html: question.questionHindi }} />
              </div>
            )}
          </div>

          {/* Options (if applicable) */}
          {['mcq', 'multiple_select', 'true_false', 'match_the_following', 'assertion_reason', 'statement_based'].includes(question.questionType) && question.options && question.options.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Options</h4>
              <div className="grid grid-cols-1 gap-2.5">
                {question.options.map((opt, idx) => {
                  const isCorrect = question.questionType === 'multiple_select'
                    ? question.correctAnswers?.includes(opt)
                    : question.correctAnswer === opt;
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                          : 'bg-dark-900/30 border-slate-850 text-slate-300'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[10px] ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <div className="leading-normal font-medium">{opt}</div>
                      {isCorrect && <FiCheckCircle className="text-emerald-400 ml-auto self-center shrink-0" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Correct Answer Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Correct Answer</span>
              <span className="text-slate-200 font-bold text-xs">
                {question.questionType === 'multiple_select'
                  ? question.correctAnswers?.join(' | ') || 'None selected'
                  : question.correctAnswer || 'None selected'}
              </span>
            </div>
            {question.estimatedSolveTime > 0 && (
              <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Est. Solve Time</span>
                <span className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  <FiClock className="text-brand-400" /> {question.estimatedSolveTime} Seconds
                </span>
              </div>
            )}
          </div>

          {/* Explanations */}
          <div className="space-y-4 border-t border-slate-900 pt-6">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Explanations</h4>
            {question.explanation ? (
              <div className="space-y-3">
                <div className="bg-dark-900/40 p-4 rounded-xl border border-slate-850">
                  <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Explanation (English)</div>
                  <div className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{question.explanation}</div>
                </div>
                {question.explanationHindi && (
                  <div className="bg-dark-900/40 p-4 rounded-xl border border-slate-850">
                    <div className="text-[9px] font-bold text-slate-500 uppercase mb-1">Explanation (Hindi)</div>
                    <div className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">{question.explanationHindi}</div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 italic">No explanation provided.</p>
            )}
          </div>

          {/* Metadata details */}
          <div className="border-t border-slate-900 pt-6 space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification & Metadata</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-slate-500 block mb-1">Exam</span>
                <span className="text-slate-300 font-semibold">{question.examId?.title || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Phase</span>
                <span className="text-slate-300 font-semibold">{question.phaseId?.title || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Subject</span>
                <span className="text-slate-300 font-semibold">{question.subjectId?.title || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Topic</span>
                <span className="text-slate-300 font-semibold">{question.topicId?.title || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Subtopic</span>
                <span className="text-slate-300 font-semibold">{question.subtopicId?.title || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Question Type</span>
                <span className="text-brand-400 font-bold">{TYPE_LABELS[question.questionType] || question.questionType}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Difficulty</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${DIFFICULTY_COLORS[question.difficulty] || ''}`}>
                  {question.difficulty?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Publish Status</span>
                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${STATUS_COLORS[question.qualityStatus] || ''}`}>
                  {question.qualityStatus?.toUpperCase()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Marks / Negative</span>
                <span className="text-slate-300 font-semibold font-mono">+{question.marks} / -{question.negativeMarks}</span>
              </div>
            </div>

            {/* Source Info */}
            <div className="bg-[#121824] rounded-xl p-4 space-y-2 border border-slate-850">
              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <FiInfo /> Source & Attribution
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <span className="text-slate-500 block">Source Type</span>
                  <span className="text-slate-300 font-medium capitalize">{question.sourceType?.replace(/_/g, ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source Name</span>
                  <span className="text-slate-300 font-medium">{question.sourceName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Source Year</span>
                  <span className="text-slate-300 font-semibold font-mono">{question.sourceYear || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Copyright Stance</span>
                  <span className="text-slate-300 font-medium capitalize">{question.copyrightStatus || '—'}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {question.tags && question.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center">
                <FiTag className="text-slate-500" />
                {question.tags.map((tag, idx) => (
                  <span key={idx} className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-700/60">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
