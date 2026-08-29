import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDownload, FiUpload, FiArrowLeft, FiAlertTriangle, FiCheckSquare, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';
import contentAPI from '../../api/contentApi.js';
import examAPI from '../../api/examApi.js';

export default function BulkImport() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sourceType, setSourceType] = useState('practice_generated');
  const [language, setLanguage] = useState('english');
  
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('csv'); // csv or json
  const [uploading, setUploading] = useState(false);
  const [batchResult, setBatchResult] = useState(null);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExams();
  }, []);

  const handleDownloadTemplate = async (type) => {
    try {
      let response;
      if (type === 'csv') {
        response = await contentAPI.getCSVTemplate();
      } else {
        response = await contentAPI.getJSONTemplate();
      }

      const blob = new Blob([response.data], { type: type === 'csv' ? 'text/csv' : 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `question-import-template.${type}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      toast.error('Failed to download template.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    setFileType(ext === 'json' ? 'json' : 'csv');
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file to import.');
    if (!selectedExamId) return toast.error('Please map to an exam.');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('examId', selectedExamId);
    formData.append('sourceType', sourceType);
    formData.append('language', language);

    setUploading(true);
    setBatchResult(null);
    toast.loading('Processing bulk import chunks...', { id: 'import-loading' });

    try {
      let res;
      if (fileType === 'csv') {
        res = await contentAPI.importCSV(formData);
      } else {
        res = await contentAPI.importJSON(formData);
      }

      setBatchResult(res.data);
      toast.success('File processed successfully.', { id: 'import-loading' });
      
      // Load error warning log details
      if (res.data.invalid > 0) {
        toast.error(`Completed with ${res.data.invalid} row validation errors.`);
      }

      setFile(null);
      e.target.reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import pipeline failed.', { id: 'import-loading' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <Link
          to="/admin/content-command-center"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Command Center
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Bulk Content Import</h1>
            <p className="text-slate-500 text-xs mt-0.5">Upload exam sheets, detect duplicates, and filter formatting issues.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="btn-secondary py-2 px-3 text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <FiDownload /> CSV Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('json')}
              className="btn-secondary py-2 px-3 text-[10px] font-bold flex items-center gap-1 shrink-0"
            >
              <FiDownload /> JSON Template
            </button>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800 space-y-6">
          <form onSubmit={handleImportSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Exam */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Exam Mapping</label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="">Select Exam</option>
                  {exams.map(e => (
                    <option key={e._id} value={e._id}>{e.title}</option>
                  ))}
                </select>
              </div>

              {/* Source Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source Classification</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="practice_generated">AI Practice Generated</option>
                  <option value="verified_previous_year">Verified PYQ Paper</option>
                  <option value="pyq_inspired">PYQ Inspired Concept</option>
                  <option value="current_affairs">Current Affairs Dated</option>
                  <option value="static_gk">Static GK Fact</option>
                  <option value="book_based_concept_practice">Book Standard Reference</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                  <option value="bilingual">Bilingual</option>
                </select>
              </div>
            </div>

            {/* File Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Select CSV or JSON Sheet</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-3 border-t border-slate-850">
              <button
                type="submit"
                disabled={uploading}
                className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiUpload /> {uploading ? 'Processing Sheets...' : 'Upload & Validate'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Metrics Panel */}
        {batchResult && (
          <div className="glass-card p-6 bg-dark-900 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-2">
              <FiCheckSquare className="text-brand-400" /> Import Summary Reports
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-dark-950 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Imported</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">{batchResult.imported}</p>
              </div>
              <div className="p-3 bg-dark-950 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Duplicates</p>
                <p className="text-lg font-bold text-slate-300 mt-0.5">{batchResult.duplicates}</p>
              </div>
              <div className="p-3 bg-dark-950 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Invalid Rows</p>
                <p className="text-lg font-bold text-rose-400 mt-0.5">{batchResult.invalid}</p>
              </div>
              <div className="p-3 bg-dark-950 rounded-xl border border-slate-850">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Checked</p>
                <p className="text-lg font-bold text-white mt-0.5">{batchResult.imported + batchResult.duplicates + batchResult.invalid}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
