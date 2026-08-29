import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiClock, FiAward, FiSliders, FiFilter, FiAlertCircle,
  FiLoader, FiChevronLeft, FiChevronRight, FiCheckSquare,
  FiPlay, FiEye, FiCheck, FiX, FiCalendar, FiBookmark,
  FiFileText, FiActivity, FiArrowRight
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import answerWritingAPI from '../../api/answerWritingApi.js';
import examAPI from '../../api/examApi.js';
import { RevisionSidebar } from './RevisionDashboard.jsx';

export default function AnswerWritingHistory() {
  const navigate = useNavigate();

  // List states
  const [submissions, setSubmissions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Summary counts states
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    drafts: 0,
    underReview: 0,
    reviewed: 0,
    avgScore: 0,
  });

  // Filter dropdown lists
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Selected filters
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Selected submission details modal view
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Toggle bookmark loading state tracker
  const [bookmarkingId, setBookmarkingId] = useState(null);

  // 1. Initial Load: fetch exams filter list
  useEffect(() => {
    const loadExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data || []);
      } catch (err) {
        console.warn('Failed to load exams list', err);
      }
    };
    loadExams();
  }, []);

  // 2. Fetch Syllabus (Subjects, Topics) when Exam changes
  useEffect(() => {
    if (!selectedExam) {
      setSubjects([]);
      setTopics([]);
      setSelectedSubject('');
      setSelectedTopic('');
      return;
    }

    const loadSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExam);
        setSubjects(data.subjects || []);
        setTopics(data.topics || []);
        setSelectedSubject('');
        setSelectedTopic('');
      } catch (err) {
        console.warn('Failed to load syllabus', err);
      }
    };
    loadSyllabus();
  }, [selectedExam]);

  // 3. Fetch submissions list
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 8,
      };

      if (selectedExam)    params.examId = selectedExam;
      if (selectedSubject) params.subjectId = selectedSubject;
      if (selectedTopic)   params.topicId = selectedTopic;
      if (selectedStatus)  params.status = selectedStatus;

      const { data } = await answerWritingAPI.getSubmissionHistory(params);
      if (data.success) {
        setSubmissions(data.submissions || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } else {
        throw new Error('Failed to load submissions.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch history logs.');
      toast.error('Error loading submissions history.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedExam, selectedSubject, selectedTopic, selectedStatus]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // 4. Fetch general stats aggregate summaries across all attempts (unpaginated fetch)
  useEffect(() => {
    const fetchAverages = async () => {
      try {
        const { data } = await answerWritingAPI.getSubmissionHistory({ page: 1, limit: 100 });
        if (data.success && data.submissions?.length > 0) {
          const list = data.submissions;

          const draftsCount = list.filter(s => s.status === 'draft').length;
          const reviewCount = list.filter(s => s.status === 'submitted' || s.status === 'under_review').length;
          const gradedList  = list.filter(s => s.status === 'reviewed');

          let average = 0;
          if (gradedList.length > 0) {
            const sum = gradedList.reduce((acc, s) => acc + (s.marksAwarded || 0), 0);
            average = Number((sum / gradedList.length).toFixed(1));
          }

          setSummaryStats({
            total: data.total,
            drafts: draftsCount,
            underReview: reviewCount,
            reviewed: gradedList.length,
            avgScore: average,
          });
        } else {
          setSummaryStats({ total: 0, drafts: 0, underReview: 0, reviewed: 0, avgScore: 0 });
        }
      } catch (err) {
        console.warn('Failed to fetch aggregate summaries', err);
      }
    };
    fetchAverages();
  }, [selectedExam, selectedSubject, selectedTopic, selectedStatus]);

  // Pagination Change
  const handlePageChange = (p) => {
    if (p >= 1 && p <= pages) setPage(p);
  };

  // Reset Filters
  const handleClearFilters = () => {
    setSelectedExam('');
    setSelectedSubject('');
    setSelectedTopic('');
    setSelectedStatus('');
    setPage(1);
  };

  // Load detailed submission and feedback details for the Modal overlay
  const handleOpenSubmissionDetails = async (subId) => {
    setLoadingDetails(true);
    try {
      const { data: detailRes } = await answerWritingAPI.getSubmissionById(subId);
      if (detailRes.success) {
        setSelectedSubmission(detailRes.submission);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to retrieve full evaluation sheet details.');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = async (subId, e) => {
    e.stopPropagation(); // Avoid card click conflicts
    setBookmarkingId(subId);
    try {
      const { data } = await answerWritingAPI.toggleBookmark(subId);
      toast.success(data.isBookmarked ? 'Submission bookmarked.' : 'Bookmark removed.');
      
      // Update local state isBookmarked flag on history list
      setSubmissions(prev =>
        prev.map(s => s._id === subId ? { ...s, isBookmarked: data.isBookmarked } : s)
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to change bookmark state.');
    } finally {
      setBookmarkingId(null);
    }
  };

  // Helper statuses styling map
  const getStatusStyle = (status) => {
    switch (status) {
      case 'reviewed':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'under_review':
      case 'submitted':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'returned':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700/60';
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiFileText className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Mains descriptive practice</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">My Answer History</h1>
          <p className="text-slate-500 text-sm mt-1">
            Review detailed feedback reports, ratings, and keyword metrics for all your submitted descriptive answers.
          </p>
        </div>

        {/* Layout Split Grid */}
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Left Sidebar */}
          <RevisionSidebar active="My Answer History" />

          {/* Right Main workspace */}
          <div className="flex-1 w-full space-y-6">

            {/* Summary statistics dashboards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Practiced</p>
                <p className="text-2xl font-black text-white mt-0.5">{summaryStats.total}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Drafts</p>
                <p className="text-2xl font-black text-slate-400 mt-0.5">{summaryStats.drafts}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">In Review</p>
                <p className="text-2xl font-black text-amber-450 mt-0.5">{summaryStats.underReview}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Evaluated</p>
                <p className="text-2xl font-black text-emerald-450 mt-0.5">{summaryStats.reviewed}</p>
              </div>
              <div className="bg-dark-900/40 border border-slate-800/80 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
                <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Avg Score</p>
                <p className="text-2xl font-black text-brand-400 mt-0.5">{summaryStats.avgScore} <span className="text-[10px] text-slate-500 font-bold">Marks</span></p>
              </div>
            </div>

            {/* Filter settings panels */}
            <div className="glass-card p-5 bg-dark-900/40 border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilter className="text-brand-400" /> Filter Logs
                </span>
                <button onClick={handleClearFilters} className="text-[10px] text-slate-400 hover:text-white transition-colors">
                  Reset Filters
                </button>
              </div>

              {/* Selectors grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                
                {/* Exam select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Exam</label>
                  <select
                    value={selectedExam}
                    onChange={(e) => { setSelectedExam(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Exams</option>
                    {exams.map(ex => (
                      <option key={ex._id} value={ex._id}>{ex.title}</option>
                    ))}
                  </select>
                </div>

                {/* Subject select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Subject</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedSubject}
                    onChange={(e) => { setSelectedSubject(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(s => (
                      <option key={s._id} value={s._id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                {/* Topic select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Topic</label>
                  <select
                    disabled={!selectedExam}
                    value={selectedTopic}
                    onChange={(e) => { setSelectedTopic(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold disabled:opacity-30"
                  >
                    <option value="">All Topics</option>
                    {topics.map(t => (
                      <option key={t._id} value={t._id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                {/* Status select */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                    className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-300 font-semibold"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Drafts</option>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="returned">Returned / Revise</option>
                  </select>
                </div>

              </div>
            </div>

            {/* List spaces */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <FiLoader className="text-3xl text-brand-500 animate-spin" />
                <p className="text-slate-500 text-xs font-semibold">Loading practice history...</p>
              </div>
            ) : error ? (
              <div className="glass-card border-rose-500/20 p-8 text-center space-y-4">
                <FiAlertCircle className="text-4xl text-rose-500 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">{error}</p>
                <button onClick={fetchSubmissions} className="btn-primary text-xs px-4 py-2">
                  Retry Load
                </button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="glass-card border-slate-850 p-16 text-center space-y-3">
                <FiCheckSquare className="text-4xl text-slate-550 mx-auto" />
                <h3 className="text-sm font-bold text-white">No Answers Practiced</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  You have no descriptive answers practiced under current filters. Select topics in the Answer Writing Practice board.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* Submission logs mapping */}
                <div className="space-y-3.5">
                  {submissions.map((sub) => {
                    const statusClass = getStatusStyle(sub.status);
                    const isDraft = sub.status === 'draft';
                    const isGraded = sub.status === 'reviewed';

                    return (
                      <div key={sub._id} className="glass-card border-slate-800 bg-dark-900/30 p-5 flex flex-col justify-between space-y-4">
                        
                        {/* Header details */}
                        <div className="flex justify-between items-start gap-4 flex-wrap pb-1.5 border-b border-slate-850">
                          <div className="space-y-1">
                            <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${statusClass}`}>
                              {sub.status.replace('_', ' ')}
                            </span>
                            <h3 className="text-xs sm:text-sm font-extrabold text-white leading-relaxed pt-1.5 line-clamp-2">
                              {sub.questionText || 'Descriptive Practice'}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold shrink-0">
                            <FiCalendar />
                            <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Summary rating metrics or scoreboards */}
                        {isGraded ? (
                          <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3.5 flex justify-between items-center text-xs font-bold text-slate-400">
                            <span>Grades Awarded: <strong className="text-emerald-455 text-sm">{sub.marksAwarded}</strong> / {sub.maxMarks} Marks</span>
                            {sub.feedbackSummary && (
                              <span className="text-[10px] italic font-semibold text-slate-450 line-clamp-1 max-w-[50%]">
                                Feedback: "{sub.feedbackSummary}"
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-slate-500 flex justify-between items-center">
                            <span>Max Value: {sub.maxMarks || 10} Marks</span>
                            <span>{isDraft ? 'Draft version saved.' : 'Assigned to mentor review queue.'}</span>
                          </div>
                        )}

                        {/* Footer controllers */}
                        <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                          
                          {/* Bookmark trigger toggle */}
                          <button
                            onClick={(e) => handleToggleBookmark(sub._id, e)}
                            disabled={bookmarkingId === sub._id}
                            className="text-slate-400 hover:text-white p-1 rounded-lg border border-slate-850 bg-dark-950 transition-colors"
                            title="Bookmark Submission"
                          >
                            <FiBookmark className={sub.isBookmarked ? 'fill-current text-brand-400' : ''} />
                          </button>

                          <div className="flex gap-2">
                            {isDraft ? (
                              <button
                                onClick={() => navigate(`/aspirant/answer-writing/question/${sub.descriptiveQuestionId?._id || sub.questionId}`)}
                                className="btn-primary py-2 px-4.5 text-xs font-bold"
                              >
                                <FiPlay /> Continue Draft
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenSubmissionDetails(sub._id)}
                                className="btn-secondary py-2 px-4.5 text-xs font-bold border-slate-850 hover:bg-dark-900"
                              >
                                <FiEye /> Open Answer Details
                              </button>
                            )}
                          </div>

                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {pages > 1 && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-4 border-t border-slate-850">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="btn-secondary py-2 px-3 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft /> Prev
                    </button>
                    <span>
                      Page {page} of {pages} ({total} submissions)
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pages}
                      className="btn-secondary py-2 px-3 text-[10px] disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next <FiChevronRight />
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>

        </div>

      </div>

      {/* Submission Graded Details and Evaluator Sheet Modal Overlay */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-[#030712]/90 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-card max-w-4xl w-full p-6 sm:p-8 border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto relative animate-fade-in">
            
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg border border-slate-800 bg-dark-950 transition-colors"
            >
              <FiX className="text-lg" />
            </button>

            {/* Header Title */}
            <div>
              <span className={`px-2 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider ${getStatusStyle(selectedSubmission.status)}`}>
                {selectedSubmission.status.replace('_', ' ')}
              </span>
              <h2 className="text-base sm:text-lg font-black text-white mt-2 leading-relaxed">
                {selectedSubmission.descriptiveQuestionId?.questionText}
              </h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-bold">
                Max Marks: {selectedSubmission.descriptiveQuestionId?.marks} | Word Count: {selectedSubmission.wordCount} Words | Time Spent: {formatTime(selectedSubmission.timeTakenSeconds)}
              </p>
            </div>

            {/* Layout Columns: Written answer vs. Evaluation report */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-850">
              
              {/* Left Column: Student's Written Answer Text */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-brand-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FiFileText /> Aspirant Response Sheet
                </h3>
                <div className="bg-dark-950/80 border border-slate-850 rounded-xl p-4 sm:p-5 h-[340px] overflow-y-auto text-xs sm:text-sm text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {selectedSubmission.answerText || 'No answer text provided.'}
                </div>
              </div>

              {/* Right Column: Mentor evaluation scorecard report */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
                  <FiAward /> Evaluator Scoring Sheet
                </h3>

                {selectedSubmission.status === 'reviewed' && selectedSubmission.mentorFeedbackId ? (
                  <div className="space-y-4">
                    
                    {/* Marks awarded card */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex justify-between items-center text-xs font-extrabold text-slate-400">
                      <span>Graded Score</span>
                      <span className="text-2xl font-black text-white">
                        {selectedSubmission.mentorFeedbackId.marksAwarded} <span className="text-xs text-slate-500 font-bold">/ {selectedSubmission.mentorFeedbackId.maxMarks}</span>
                      </span>
                    </div>

                    {/* overall comments */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Overall Feedback</span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-dark-950/40 p-3 rounded-lg border border-slate-855">
                        {selectedSubmission.mentorFeedbackId.overallFeedback}
                      </p>
                    </div>

                    {/* ratings metrics details */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-center">
                      <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                        <span className="block text-[8px] text-slate-500 uppercase">Structure</span>
                        <span className="capitalize text-slate-200">{selectedSubmission.mentorFeedbackId.structureRating}</span>
                      </div>
                      <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                        <span className="block text-[8px] text-slate-500 uppercase">Content</span>
                        <span className="capitalize text-slate-200">{selectedSubmission.mentorFeedbackId.contentRating}</span>
                      </div>
                      <div className="bg-dark-950 border border-slate-850 rounded-lg p-2">
                        <span className="block text-[8px] text-slate-500 uppercase">Presentation</span>
                        <span className="capitalize text-slate-200">{selectedSubmission.mentorFeedbackId.presentationRating}</span>
                      </div>
                    </div>

                    {/* Strengths & Improvements */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                      <div className="space-y-1">
                        <span className="text-emerald-450 uppercase">Strengths</span>
                        <ul className="list-disc pl-3 text-slate-400 font-semibold space-y-0.5">
                          {selectedSubmission.mentorFeedbackId.strengths?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <span className="text-rose-450 uppercase">Improvements</span>
                        <ul className="list-disc pl-3 text-slate-400 font-semibold space-y-0.5">
                          {selectedSubmission.mentorFeedbackId.improvements?.map((s, i) => <li key={i}>{s}</li>) || <li>None</li>}
                        </ul>
                      </div>
                    </div>

                    {/* Suggested approach */}
                    {selectedSubmission.mentorFeedbackId.suggestedAnswerApproach && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suggested Answer Approach</span>
                        <p className="text-[11px] text-slate-450 leading-relaxed bg-dark-950/40 p-3 rounded-lg border border-slate-855 whitespace-pre-wrap">
                          {selectedSubmission.mentorFeedbackId.suggestedAnswerApproach}
                        </p>
                      </div>
                    )}

                  </div>
                ) : selectedSubmission.status === 'returned' && selectedSubmission.mentorFeedbackId ? (
                  <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4.5 space-y-2 text-xs text-rose-400">
                    <p className="font-bold flex items-center gap-1.5"><FiAlertCircle /> Returned for resubmission</p>
                    <p className="leading-relaxed opacity-95">
                      {selectedSubmission.mentorFeedbackId.overallFeedback}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedSubmission(null);
                        navigate(`/aspirant/answer-writing/question/${selectedSubmission.descriptiveQuestionId?._id}`);
                      }}
                      className="btn-primary bg-rose-600 hover:bg-rose-500 border-rose-650 py-2.5 px-4 text-xs font-bold w-full justify-center mt-2.5 text-white"
                    >
                      <FiPlay /> Resume and Fix Answer
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-5 text-xs text-amber-400 leading-relaxed text-center py-10 space-y-1.5">
                    <FiClock className="text-2xl text-amber-450 mx-auto" />
                    <p className="font-bold">Evaluation Pending</p>
                    <p className="text-[10px] opacity-80 max-w-xs mx-auto">
                      Your answer has been submitted and is currently in the mentor review queue. Graded metrics will show up here.
                    </p>
                  </div>
                )}

              </div>

            </div>

            {/* Model answer frame block: visible only when reviewed */}
            {selectedSubmission.status === 'reviewed' && selectedSubmission.descriptiveQuestionId?.modelAnswer && (
              <div className="border-t border-slate-850 pt-5 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FiCheckSquare className="text-emerald-450" /> Recommended Model Answer framework
                </span>
                <p className="text-slate-350 leading-relaxed bg-dark-950/40 p-4 rounded-xl border border-slate-855 whitespace-pre-wrap">
                  {selectedSubmission.descriptiveQuestionId.modelAnswer}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-secondary py-2 px-5 text-xs font-bold border-slate-850"
              >
                Close View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Helper time formatter
const formatTime = (totalSecs) => {
  if (!totalSecs) return '0m 0s';
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}m ${secs}s`;
};
