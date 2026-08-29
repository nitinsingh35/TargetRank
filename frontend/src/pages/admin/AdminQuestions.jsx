import React, { useState, useEffect } from 'react';
import { FiDownload, FiUpload, FiCheck, FiX, FiTrash2, FiSettings, FiActivity, FiHelpCircle, FiClock, FiCheckSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import questionAPI from '../../api/questionApi.js';
import API from '../../api/api.js';

export default function AdminQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [totalCount, setTotalCount] = useState(0);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchQuestionsList = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter || undefined,
        limit: 50,
      };
      const { data } = await questionAPI.getQuestions(params);
      setQuestions(data.questions);
      setTotalCount(data.total);
    } catch (err) {
      toast.error('Failed to load questions catalog.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionsList();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await questionAPI.reviewQuestion(id, 'published');
      toast.success('Question published successfully.');
      fetchQuestionsList();
    } catch (err) {
      toast.error('Failed to approve question.');
    }
  };

  const handleReject = async (id) => {
    try {
      await questionAPI.reviewQuestion(id, 'rejected');
      toast.success('Question rejected.');
      fetchQuestionsList();
    } catch (err) {
      toast.error('Failed to reject question.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await questionAPI.deleteQuestion(id);
      toast.success('Question deleted.');
      fetchQuestionsList();
    } catch (err) {
      toast.error('Failed to delete question.');
    }
  };

  // CSV Template download
  const handleDownloadTemplate = async () => {
    try {
      const response = await API.get('/questions/template', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'questions_bulk_template.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to download template.');
    }
  };

  // CSV Bulk Upload
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a CSV file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    toast.loading('Processing CSV upload...', { id: 'csv-upload-toast' });
    try {
      const { data } = await questionAPI.bulkUpload(formData);
      toast.success(data.message || 'Questions uploaded successfully!', { id: 'csv-upload-toast' });
      if (data.errors && data.errors.length > 0) {
        toast((t) => (
          <span className="text-xs">
            Completed with {data.errors.length} formatting warnings (e.g. check duplicate keys).
          </span>
        ), { duration: 6000, icon: '⚠️' });
      }
      setSelectedFile(null);
      e.target.reset();
      fetchQuestionsList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'CSV processing failed.', { id: 'csv-upload-toast' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiSettings className="text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Admin moderation panel</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Questions Manager</h1>
            <p className="text-slate-500 text-xs mt-0.5">Moderate questions submitted by mentors or run high-volume CSV uploads.</p>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex items-center gap-1.5 self-start"
          >
            <FiDownload /> Download CSV Template
          </button>
        </div>

        {/* CSV Upload Block */}
        <div className="glass-card p-6 border-slate-800 bg-dark-900/20 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FiUpload className="text-brand-400" /> Bulk CSV Question Import
          </h3>
          <form onSubmit={handleUploadSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
            />
            <button
              type="submit"
              disabled={uploading}
              className="btn-primary py-2.5 px-5 text-xs font-semibold shrink-0 w-full sm:w-auto"
            >
              Upload CSV
            </button>
          </form>
        </div>

        {/* Filters and List */}
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-dark-900/60 p-4 rounded-xl border border-slate-850/60 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Filter by Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-dark-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs focus:outline-none"
              >
                <option value="pending_review">Pending Review</option>
                <option value="published">Published</option>
                <option value="draft">Drafts</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Total questions: {totalCount}</span>
          </div>

          {/* List items */}
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : questions.length === 0 ? (
            <div className="glass-card p-12 text-center border-slate-850">
              <FiHelpCircle className="text-3xl text-slate-650 mx-auto mb-4" />
              <p className="text-slate-500 text-xs">No questions found in this folder status.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div key={q._id} className="glass-card p-6 bg-dark-900 border-slate-800 space-y-4">
                  {/* Category and source */}
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                        {q.category}
                      </span>
                      {q.examId?.title && (
                        <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                          {q.examId.title}
                        </span>
                      )}
                      {q.year && (
                        <span className="text-[10px] font-bold text-accent-400 bg-accent-500/10 border border-accent-500/20 px-2 py-0.5 rounded-full">
                          PYQ {q.year}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {q.status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprove(q._id)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                          >
                            <FiCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(q._id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all text-[10px] font-bold flex items-center gap-1"
                          >
                            <FiX /> Reject
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="p-1.5 rounded-lg bg-dark-950 border border-slate-800 hover:bg-slate-750 text-slate-500 hover:text-rose-400 transition-all"
                      >
                        <FiTrash2 className="text-xs" />
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-semibold whitespace-pre-line">
                    {q.questionText}
                  </p>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((option, oidx) => {
                      const isCorrect = option === q.correctAnswer;
                      return (
                        <div
                          key={oidx}
                          className={`px-4 py-2 border rounded-lg text-xs font-medium flex items-center justify-between ${
                            isCorrect
                              ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                              : 'border-slate-850 bg-dark-950 text-slate-500'
                          }`}
                        >
                          <span>{option}</span>
                          {isCorrect && <FiCheck className="text-xs shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation preview */}
                  {q.explanation && (
                    <div className="p-3 bg-dark-950/60 border border-slate-850 rounded-lg text-slate-500 text-xs">
                      <strong className="text-slate-400">Solution:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
