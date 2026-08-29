import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiPlayCircle, FiCpu, FiFileText, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import generationAPI from '../../api/generationApi.js';
import examAPI from '../../api/examApi.js';

export default function QuestionGenerator() {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [generatorType, setGeneratorType] = useState('polity');
  const [count, setCount] = useState(10);
  
  const [batches, setBatches] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingBatches, setLoadingBatches] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        if (data.length > 0) setSelectedExamId(data[0]._id);
      } catch (err) {
        console.error(err);
      }
    };
    bootstrap();
    fetchBatchesList();
  }, []);

  const fetchBatchesList = async () => {
    setLoadingBatches(true);
    try {
      const { data } = await generationAPI.getBatches();
      setBatches(data);
    } catch (err) {
      toast.error('Failed to load generator batches.');
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return toast.error('Please map to an exam stream.');

    setSubmitting(true);
    toast.loading('Queueing question generator job in background...', { id: 'generator-toast' });
    
    try {
      await generationAPI.createJob({
        generatorType,
        count: Number(count),
        examId: selectedExamId
      });
      toast.success('Job queued successfully!', { id: 'generator-toast' });
      fetchBatchesList();
    } catch (err) {
      toast.error('Failed to submit generator job.', { id: 'generator-toast' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm('Delete this batch log permanently?')) return;
    try {
      await generationAPI.deleteBatch(id);
      toast.success('Batch removed.');
      fetchBatchesList();
    } catch (err) {
      toast.error('Failed to delete batch log.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link
          to="/admin/content-command-center"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Command Center
        </Link>

        {/* Header */}
        <div className="flex justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Dynamic Practice Generator</h1>
            <p className="text-slate-500 text-xs mt-0.5">Submit automated curriculum generators. Generated questions must require admin validation before publishing.</p>
          </div>
          
          <button
            onClick={fetchBatchesList}
            className="p-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 hover:text-white transition-all shrink-0"
          >
            <FiRefreshCw />
          </button>
        </div>

        {/* Generator Form */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Exam */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Target</label>
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

              {/* Generator Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Syllabus Field</label>
                <select
                  value={generatorType}
                  onChange={(e) => setGeneratorType(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="polity">Polity (GS Polity Facts)</option>
                  <option value="history">History (GS History Facts)</option>
                  <option value="geography">Geography (GS Geography Facts)</option>
                  <option value="economy">Economy (GS Economy Facts)</option>
                  <option value="environment">Environment (Ecology Facts)</option>
                  <option value="science">Science (General Physics/Bio)</option>
                  <option value="quant">Quantitative Aptitude (Math)</option>
                  <option value="reasoning">Logical Reasoning (Sequence)</option>
                  <option value="english">English Language (Grammar)</option>
                  <option value="banking">Banking Awareness</option>
                  <option value="bihar">Bihar General Knowledge</option>
                  <option value="up">Uttar Pradesh General Knowledge</option>
                </select>
              </div>

              {/* Count */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Quantity Count</label>
                <select
                  value={count}
                  onChange={(e) => setCount(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="10">10 Questions</option>
                  <option value="50">50 Questions</option>
                  <option value="100">100 Questions</option>
                  <option value="200">200 Questions</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-850">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-1.5"
              >
                <FiPlayCircle /> Queue Generation Job
              </button>
            </div>
          </form>
        </div>

        {/* Generator Job logs */}
        <div className="glass-card p-6 bg-dark-900 border-slate-850 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <FiFileText className="text-brand-400" /> Background Generator Batches
          </h3>

          {loadingBatches ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : batches.length === 0 ? (
            <p className="text-slate-500 text-xs py-2">No generator job batches logs found.</p>
          ) : (
            <div className="divide-y divide-slate-850">
              {batches.map((b) => (
                <div key={b._id} className="py-4 flex justify-between items-center text-xs flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-slate-200">{b.batchName}</h4>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Imported: <span className="text-emerald-400 font-semibold">{b.importedRows}</span> | Duplicates: {b.duplicateRows} | Date: {new Date(b.createdAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${
                      b.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      b.status === 'failed' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                      'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {b.status}
                    </span>

                    <button
                      onClick={() => handleDeleteBatch(b._id)}
                      className="p-1 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-rose-400 transition-all"
                    >
                      <FiTrash2 className="text-xs" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
