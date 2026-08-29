import React, { useState, useEffect, useRef } from 'react';
import {
  FiUploadCloud, FiDownload, FiCheckCircle, FiAlertCircle,
  FiPlay, FiTrash2, FiClock, FiFileText, FiList, FiAlertTriangle,
  FiRotateCcw, FiLoader, FiArrowRight, FiInfo, FiChevronLeft,
  FiChevronRight, FiSettings, FiAlertOctagon
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminQuestionImportAPI from '../../api/adminQuestionImportApi.js';

/* ── Standard target DB field list for mapping ── */
const TARGET_FIELDS = [
  { key: 'questionText',     label: 'Question Text (English) *' },
  { key: 'questionHindi',    label: 'Question Text (Hindi)' },
  { key: 'questionType',     label: 'Question Type' },
  { key: 'optionA',          label: 'Option A' },
  { key: 'optionB',          label: 'Option B' },
  { key: 'optionC',          label: 'Option C' },
  { key: 'optionD',          label: 'Option D' },
  { key: 'correctAnswer',    label: 'Correct Answer' },
  { key: 'explanation',      label: 'Explanation (English)' },
  { key: 'explanationHindi', label: 'Explanation (Hindi)' },
  { key: 'marks',            label: 'Marks' },
  { key: 'negativeMarks',    label: 'Negative Marks' },
  { key: 'difficulty',       label: 'Difficulty' },
  { key: 'importanceLevel',  label: 'Importance' },
  { key: 'language',         label: 'Language' },
  { key: 'examCode',         label: 'Exam Slug/Code *' },
  { key: 'phaseCode',        label: 'Phase Slug/Code *' },
  { key: 'subjectCode',      label: 'Subject Slug/Code *' },
  { key: 'topicCode',        label: 'Topic Slug/Code *' },
  { key: 'subtopicCode',     label: 'Subtopic Slug/Code' },
  { key: 'sourceType',       label: 'Source Type' },
  { key: 'sourceName',       label: 'Source Name' },
  { key: 'sourceYear',       label: 'Source Year' },
  { key: 'paperName',        label: 'Paper Name' },
  { key: 'tags',             label: 'Tags (comma-separated)' },
];

const STEP_LABELS = ['Upload File', 'Field Mapping', 'Validate', 'Importing…', 'Report'];

export default function QuestionImportDashboard() {
  /* ── stats & history ── */
  const [stats, setStats]               = useState(null);
  const [batches, setBatches]           = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage]   = useState(1);
  const [historyPages, setHistoryPages] = useState(1);

  /* ── view toggle ── */
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'wizard'

  /* ── wizard ── */
  const [step, setStep]                     = useState(1);
  const [file, setFile]                     = useState(null);
  const [dragActive, setDragActive]         = useState(false);
  const [uploading, setUploading]           = useState(false);
  const [activeBatch, setActiveBatch]       = useState(null);
  const [previewHeaders, setPreviewHeaders] = useState([]);
  const [previewRows, setPreviewRows]       = useState([]);
  const [fieldMapping, setFieldMapping]     = useState({});
  const [duplicateStance, setDuplStance]    = useState('skip');
  const [publishNow, setPublishNow]         = useState(false);
  const [validation, setValidation]         = useState(null);  // { summary, errorReport }
  const [importPct, setImportPct]           = useState(0);
  const [importing, setImporting]           = useState(false);
  const pollRef                             = useRef(null);

  /* ── initial load ── */
  useEffect(() => { fetchStats(); }, []);
  useEffect(() => {
    if (activeTab === 'dashboard') fetchHistory();
  }, [activeTab, historyPage]);

  /* ── cleanup poll on unmount ── */
  useEffect(() => () => clearInterval(pollRef.current), []);

  /* ═══════════════════════════════════════════════════════
     Data fetchers
  ═══════════════════════════════════════════════════════ */
  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const { data } = await adminQuestionImportAPI.getImportStats();
      if (data.success) setStats(data);
    } catch { toast.error('Could not load stats'); }
    finally { setLoadingStats(false); }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await adminQuestionImportAPI.getImportBatches({ page: historyPage, limit: 6 });
      if (data.success) { setBatches(data.batches); setHistoryPages(data.pages || 1); }
    } catch { toast.error('Could not load history'); }
    finally { setLoadingHistory(false); }
  };

  /* ═══════════════════════════════════════════════════════
     Drag-and-drop handlers
  ═══════════════════════════════════════════════════════ */
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files[0]) setValidFile(e.dataTransfer.files[0]);
  };
  const setValidFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv','json','xlsx','xls'].includes(ext)) {
      toast.error('Unsupported format. Use CSV, JSON, or Excel.');
      return;
    }
    setFile(f);
  };

  /* ═══════════════════════════════════════════════════════
     STEP 1 — Upload
  ═══════════════════════════════════════════════════════ */
  const doUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const { data } = await adminQuestionImportAPI.uploadImportFile(fd);
      if (data.success) {
        setActiveBatch(data.batch);
        toast.success('File uploaded!');
        await doPreview(data.batchId);
      }
    } catch (err) { toast.error(err.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  /* ═══════════════════════════════════════════════════════
     STEP 2 — Preview & auto-map headers
  ═══════════════════════════════════════════════════════ */
  const doPreview = async (batchId) => {
    try {
      const { data } = await adminQuestionImportAPI.previewImportFile(batchId);
      if (data.success) {
        setPreviewHeaders(data.headers || []);
        setPreviewRows(data.previewRows || []);

        // Auto-match: case-insensitive exact or stripped match
        const autoMap = {};
        TARGET_FIELDS.forEach(tf => {
          const match = (data.headers || []).find(h =>
            h.toLowerCase().trim() === tf.key.toLowerCase() ||
            h.toLowerCase().replace(/[^a-z0-9]/g, '') === tf.key.toLowerCase()
          );
          if (match) autoMap[tf.key] = match;
        });
        setFieldMapping(autoMap);
        setStep(2);
      }
    } catch { toast.error('Failed to parse file headers'); }
  };

  /* ═══════════════════════════════════════════════════════
     STEP 3 — Validate
  ═══════════════════════════════════════════════════════ */
  const doValidate = async () => {
    if (!activeBatch) return;
    setUploading(true);
    try {
      const { data } = await adminQuestionImportAPI.validateImportFile(activeBatch._id, {
        fieldMapping, duplicateStance
      });
      if (data.success) {
        setValidation({ summary: data.summary, errorReport: data.errorReport || [] });
        setStep(3);
      }
    } catch { toast.error('Validation failed'); }
    finally { setUploading(false); }
  };

  /* ═══════════════════════════════════════════════════════
     STEP 4 — Commit (background) + live progress poll
  ═══════════════════════════════════════════════════════ */
  const doCommit = async () => {
    if (!activeBatch) return;
    setImporting(true);
    setStep(4);
    try {
      await adminQuestionImportAPI.commitImportFile(activeBatch._id, {
        publishAfterImport: publishNow,
        duplicateStance,
      });
      startPoll();
    } catch { toast.error('Commit initiation failed'); setImporting(false); }
  };

  const startPoll = () => {
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await adminQuestionImportAPI.getImportBatchById(activeBatch._id);
        const b = data.batch;
        const pct = b.totalRows ? Math.round((b.importedRows / b.totalRows) * 100) : 0;
        setImportPct(pct);
        if (b.status === 'completed' || b.status === 'failed') {
          clearInterval(pollRef.current);
          setImporting(false);
          setActiveBatch(b);
          setStep(5);
          fetchStats();
          toast.success('Import complete!');
        }
      } catch { clearInterval(pollRef.current); setImporting(false); }
    }, 1500);
  };

  /* ═══════════════════════════════════════════════════════
     History actions
  ═══════════════════════════════════════════════════════ */
  const doRollback = async (batchId) => {
    if (!window.confirm('Rollback will delete all un-used questions from this batch. Continue?')) return;
    try {
      const { data } = await adminQuestionImportAPI.rollbackImportBatch(batchId);
      if (data.success) {
        toast.success(`Deleted: ${data.deletedCount}, Archived: ${data.archivedCount}`);
        fetchHistory(); fetchStats();
      }
    } catch { toast.error('Rollback failed'); }
  };

  const doRetry = async (batchId) => {
    try {
      await adminQuestionImportAPI.retryFailedRows(batchId);
      toast.success('Retry triggered in background!');
      fetchHistory();
    } catch { toast.error('Retry failed'); }
  };

  /* ═══════════════════════════════════════════════════════
     Template download
  ═══════════════════════════════════════════════════════ */
  const downloadTemplate = async (fmt) => {
    try {
      const res = await adminQuestionImportAPI.getSampleTemplateFile(fmt);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `questions_template.${fmt}`;
      document.body.appendChild(a); a.click(); a.remove();
      toast.success(`${fmt.toUpperCase()} template downloaded!`);
    } catch { toast.error('Download failed'); }
  };

  /* ═══════════════════════════════════════════════════════
     Error CSV download
  ═══════════════════════════════════════════════════════ */
  const downloadErrors = async (batchId) => {
    try {
      const res = await adminQuestionImportAPI.getImportBatchErrors(batchId, { format: 'csv' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `errors_${batchId}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch { toast.error('Error CSV download failed'); }
  };

  /* ─── wizard reset ─── */
  const resetWizard = () => {
    setFile(null); setActiveBatch(null); setPreviewHeaders([]); setPreviewRows([]);
    setFieldMapping({}); setValidation(null); setImportPct(0); setStep(1);
    setActiveTab('dashboard'); fetchStats(); fetchHistory();
  };

  /* ═══════════════════════════════════════════════════════
     STATUS BADGE
  ═══════════════════════════════════════════════════════ */
  const StatusBadge = ({ status }) => {
    const cls = {
      completed:   'bg-emerald-500/10 text-emerald-400',
      failed:      'bg-rose-500/10 text-rose-400',
      rolled_back: 'bg-slate-700 text-slate-400',
    }[status] || 'bg-amber-500/10 text-amber-400';
    return <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${cls}`}>{status}</span>;
  };

  /* ═══════════════════════════════════════════════════════
     STAT CARD
  ═══════════════════════════════════════════════════════ */
  const StatCard = ({ label, value, color = 'text-white' }) => (
    <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">{label}</span>
      <span className={`text-2xl font-black mt-1 block ${color}`}>{loadingStats ? '—' : value}</span>
    </div>
  );

  /* ═══════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── Page Header ─── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-slate-900">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FiUploadCloud className="text-indigo-400" />
              Question Import Center
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">
              Enterprise pipeline · CSV / Excel / JSON · Duplicate detection · Field mapping · Background batches
            </p>
          </div>
          {activeTab === 'dashboard' ? (
            <button
              onClick={() => setActiveTab('wizard')}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              <FiUploadCloud /> New Import Wizard
            </button>
          ) : (
            <button
              onClick={resetWizard}
              className="bg-[#0d1117] border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              ✕ Cancel & Exit
            </button>
          )}
        </div>

        {/* ════════════════════════════════════════════════
            DASHBOARD TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Total Import Batches" value={stats?.totalImports ?? 0} />
              <StatCard label="Questions Imported"   value={stats?.importedQuestions ?? 0} />
              <StatCard label="Published Questions"  value={stats?.publishedQuestions ?? 0} color="text-emerald-400" />
              <StatCard label="Draft / Pending"      value={stats?.draftQuestions ?? 0} />
              <StatCard label="Duplicate Questions"  value={stats?.duplicateQuestions ?? 0} color="text-orange-400" />
              <StatCard label="Failed Rows"          value={stats?.failedRows ?? 0} color="text-rose-400" />
              <StatCard label="Pending Review"       value={stats?.pendingReview ?? 0} color="text-indigo-400" />
              <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Last Import Date</span>
                <span className="text-sm font-bold text-white mt-2 block">
                  {loadingStats ? '—' : stats?.lastImportDate
                    ? new Date(stats.lastImportDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
                    : 'No imports yet'}
                </span>
              </div>
            </div>

            {/* Template Downloads Bar */}
            <div className="bg-[#0d1117] border border-slate-800/60 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FiInfo className="text-indigo-400 text-lg shrink-0" />
                <div>
                  <p className="text-xs font-bold text-white">Download Sample Template Files</p>
                  <p className="text-[10px] text-slate-500">Ensure your spreadsheet headers match the expected TargetRank classification schema</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['csv', 'xlsx', 'json'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => downloadTemplate(fmt)}
                    className="flex items-center gap-1.5 bg-[#0d1117] border border-slate-700 hover:border-indigo-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 transition-colors uppercase"
                  >
                    <FiDownload /> {fmt} Template
                  </button>
                ))}
              </div>
            </div>

            {/* Import History Table */}
            <div className="bg-[#0d1117] border border-slate-800/80 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-900 flex items-center gap-2">
                <FiClock className="text-slate-400" />
                <h3 className="text-xs font-bold text-white">Import History</h3>
              </div>

              {loadingHistory ? (
                <div className="flex justify-center py-20">
                  <FiLoader className="text-indigo-500 text-2xl animate-spin" />
                </div>
              ) : batches.length === 0 ? (
                <p className="text-center py-20 text-slate-500 text-xs">No import batches yet. Start the wizard to import your first question set.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 bg-[#080d13] text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {['Date', 'Uploader', 'File', 'Type', 'Rows', 'Imported', 'Errors', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-5 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900">
                      {batches.map(b => (
                        <tr key={b._id} className="hover:bg-slate-900/20 text-slate-300">
                          <td className="px-5 py-3.5">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="px-5 py-3.5 font-semibold text-slate-200">{b.uploadedBy?.name || 'Admin'}</td>
                          <td className="px-5 py-3.5 font-mono text-[10px] truncate max-w-[160px]">{b.fileName}</td>
                          <td className="px-5 py-3.5 uppercase font-bold text-slate-400">{b.fileType}</td>
                          <td className="px-5 py-3.5 font-mono">{b.totalRows}</td>
                          <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">{b.importedRows}</td>
                          <td className="px-5 py-3.5 font-mono text-rose-400 font-bold">{b.invalidRows}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {b.invalidRows > 0 && (
                                <button onClick={() => downloadErrors(b._id)} className="text-[10px] text-slate-500 hover:text-rose-400 font-bold flex items-center gap-0.5" title="Download error CSV">
                                  <FiDownload className="text-[9px]" /> Errors
                                </button>
                              )}
                              {b.status === 'completed' && b.rollbackAllowed && (
                                <button onClick={() => doRollback(b._id)} className="text-[10px] text-slate-500 hover:text-rose-400 font-bold flex items-center gap-0.5" title="Rollback">
                                  <FiRotateCcw className="text-[9px]" /> Rollback
                                </button>
                              )}
                              {b.status === 'failed' && (
                                <button onClick={() => doRetry(b._id)} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold" title="Retry">
                                  <FiPlay className="text-[9px] inline mr-0.5" /> Retry
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {historyPages > 1 && (
                <div className="flex justify-between items-center px-5 py-3 border-t border-slate-900 text-xs">
                  <span className="text-slate-500">Page {historyPage} of {historyPages}</span>
                  <div className="flex gap-1">
                    <button disabled={historyPage === 1} onClick={() => setHistoryPage(p => p - 1)}
                      className="p-1.5 text-slate-400 disabled:opacity-30 hover:text-white"><FiChevronLeft /></button>
                    <button disabled={historyPage >= historyPages} onClick={() => setHistoryPage(p => p + 1)}
                      className="p-1.5 text-slate-400 disabled:opacity-30 hover:text-white"><FiChevronRight /></button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════
            IMPORT WIZARD TAB
        ════════════════════════════════════════════════ */}
        {activeTab === 'wizard' && (
          <div className="bg-[#0d1117] border border-slate-800/80 rounded-2xl p-6 space-y-8">

            {/* ── Step Progress Bar ── */}
            <div className="flex items-center justify-between">
              {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = step === stepNum;
                const isDone   = step > stepNum;
                return (
                  <React.Fragment key={label}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                        isDone ? 'bg-emerald-500 text-white' :
                        isActive ? 'bg-indigo-600 text-white ring-4 ring-indigo-600/20' :
                        'bg-slate-800 text-slate-600'
                      }`}>
                        {isDone ? <FiCheckCircle className="text-xs" /> : stepNum}
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-white' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 transition-colors ${step > stepNum ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* ════════════ STEP 1: Upload ════════════ */}
            {step === 1 && (
              <div className="max-w-xl mx-auto space-y-6 py-6">
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white">Upload Question Set File</h3>
                  <p className="text-[10px] text-slate-500 mt-1">CSV · Excel (.xlsx) · JSON — up to 100,000 questions per batch</p>
                </div>

                {/* Drag-drop zone */}
                <div
                  onDragEnter={handleDrag} onDragOver={handleDrag}
                  onDragLeave={() => setDragActive(false)} onDrop={handleDrop}
                  onClick={() => document.getElementById('qimport-file').click()}
                  className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                    dragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-800 hover:border-slate-700 bg-[#080d13]'
                  }`}
                >
                  <FiUploadCloud className={`text-4xl ${dragActive ? 'text-indigo-400 animate-bounce' : 'text-slate-600'}`} />
                  <p className="text-xs font-semibold text-slate-400">
                    {file ? `✓ ${file.name}` : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-[10px] text-slate-600">Accepted: .csv  .xlsx  .xls  .json</p>
                  <input
                    id="qimport-file" type="file"
                    accept=".csv,.json,.xlsx,.xls"
                    className="hidden"
                    onChange={e => e.target.files[0] && setValidFile(e.target.files[0])}
                  />
                </div>

                <button
                  disabled={!file || uploading}
                  onClick={doUpload}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 disabled:opacity-40 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl text-xs font-bold transition-all"
                >
                  {uploading ? <><FiLoader className="animate-spin" /> Processing…</> : <><FiArrowRight /> Upload & Preview Columns</>}
                </button>
              </div>
            )}

            {/* ════════════ STEP 2: Field Mapping ════════════ */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">Column Field Mapping</h3>
                    <p className="text-[10px] text-slate-500">Map your spreadsheet columns to TargetRank database fields</p>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 font-bold">Duplicate policy:</span>
                    <select
                      value={duplicateStance}
                      onChange={e => setDuplStance(e.target.value)}
                      className="bg-[#080d13] border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-[11px] focus:outline-none focus:border-indigo-500"
                    >
                      <option value="skip">Skip duplicates</option>
                      <option value="replace">Replace existing</option>
                      <option value="keep_both">Keep both (append suffix)</option>
                    </select>
                  </div>
                </div>

                {/* Mapping grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-[#080d13] border border-slate-900 p-5 rounded-xl">
                  {TARGET_FIELDS.map(tf => (
                    <div key={tf.key} className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400">{tf.label}</label>
                      <select
                        value={fieldMapping[tf.key] || ''}
                        onChange={e => setFieldMapping(m => ({ ...m, [tf.key]: e.target.value }))}
                        className="bg-[#0d1117] border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">— Not Mapped —</option>
                        {previewHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Data preview snippet */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">First 5 Rows Preview</p>
                  <div className="overflow-x-auto border border-slate-900 rounded-xl max-h-48">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-[#080d13] border-b border-slate-900 text-slate-500 font-bold">
                          {previewHeaders.map(h => <th key={h} className="px-3 py-2 font-mono whitespace-nowrap">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        {previewRows.slice(0,5).map((row, i) => (
                          <tr key={i} className="text-slate-400">
                            {previewHeaders.map(h => (
                              <td key={h} className="px-3 py-1.5 font-mono truncate max-w-[140px]">
                                {row[h] !== undefined ? String(row[h]) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setStep(1)} className="bg-[#080d13] border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold">
                    ← Back
                  </button>
                  <button
                    disabled={uploading}
                    onClick={doValidate}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-5 py-2 rounded-xl text-xs font-bold"
                  >
                    {uploading ? <><FiLoader className="animate-spin" /> Validating…</> : <>Run Validation Check <FiArrowRight /></>}
                  </button>
                </div>
              </div>
            )}

            {/* ════════════ STEP 3: Validation Report ════════════ */}
            {step === 3 && validation && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-white">Validation Report</h3>
                  <p className="text-[10px] text-slate-500">Every row was checked against syllabus slugs, answer integrity, and duplicate detection</p>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#080d13] border border-slate-900 p-5 rounded-xl text-center">
                  {[
                    { label: 'Total Rows',     val: validation.summary.totalRows,    color: 'text-white'       },
                    { label: 'Valid (Ready)',   val: validation.summary.validRows,    color: 'text-emerald-400' },
                    { label: 'Invalid (Error)', val: validation.summary.invalidRows, color: 'text-rose-400'    },
                    { label: 'Duplicates',     val: validation.summary.duplicateRows, color: 'text-orange-400' },
                  ].map(s => (
                    <div key={s.label}>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">{s.label}</span>
                      <span className={`text-xl font-black mt-1 block font-mono ${s.color}`}>{s.val}</span>
                    </div>
                  ))}
                </div>

                {/* Error table */}
                {validation.errorReport.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <FiAlertTriangle className="text-[9px]" /> {validation.errorReport.length} Rows Failed Validation
                      </h4>
                      <button onClick={() => downloadErrors(activeBatch._id)} className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-bold">
                        <FiDownload /> Download Error CSV
                      </button>
                    </div>
                    <div className="overflow-x-auto border border-rose-900/30 rounded-xl max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead className="sticky top-0">
                          <tr className="bg-rose-950/30 text-rose-300 border-b border-rose-900/30 font-bold">
                            <th className="px-4 py-2 w-14">Row</th>
                            <th className="px-4 py-2 max-w-[180px]">Question Snippet</th>
                            <th className="px-4 py-2">Errors</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-900/10">
                          {validation.errorReport.map((err, i) => (
                            <tr key={i} className="bg-rose-950/5 text-rose-300/80">
                              <td className="px-4 py-2 font-mono font-bold">{err.row}</td>
                              <td className="px-4 py-2 truncate max-w-[180px]">{err.questionText}</td>
                              <td className="px-4 py-2">
                                {err.errors.map((e, idx) => (
                                  <div key={idx} className="flex items-start gap-1 leading-relaxed">
                                    <FiAlertOctagon className="text-[8px] mt-0.5 shrink-0" /> {e}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Publish option */}
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-semibold bg-[#080d13] border border-slate-900 px-4 py-3 rounded-xl">
                  <input
                    type="checkbox"
                    checked={publishNow}
                    onChange={e => setPublishNow(e.target.checked)}
                    className="w-4 h-4 rounded bg-[#0d1117] border border-slate-700 accent-indigo-600"
                  />
                  Publish questions immediately after import (only approved-quality questions)
                  <span className="ml-auto text-[10px] text-slate-500 font-normal">Otherwise imported as Draft/Pending Review</span>
                </label>

                <div className="flex justify-end gap-3">
                  <button onClick={() => setStep(2)} className="bg-[#080d13] border border-slate-800 text-slate-400 hover:text-white px-4 py-2 rounded-xl text-xs font-bold">
                    ← Back
                  </button>
                  <button
                    disabled={validation.summary.validRows === 0}
                    onClick={doCommit}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20"
                  >
                    Commit {validation.summary.validRows} Valid Questions <FiArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* ════════════ STEP 4: Progress ════════════ */}
            {step === 4 && (
              <div className="max-w-sm mx-auto py-16 text-center space-y-6">
                <FiLoader className="text-5xl text-indigo-500 animate-spin mx-auto" />
                <div>
                  <h3 className="text-sm font-bold text-white">Importing Questions…</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Batched background process — safe on large datasets</p>
                </div>
                <div className="space-y-1">
                  <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-500 rounded-full" style={{ width: `${importPct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>PROGRESS</span><span className="font-bold text-white">{importPct}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════ STEP 5: Summary Report ════════════ */}
            {step === 5 && activeBatch && (
              <div className="max-w-md mx-auto py-10 text-center space-y-6">
                <FiCheckCircle className="text-5xl text-emerald-400 mx-auto" />
                <div>
                  <h3 className="text-base font-extrabold text-white">Import Completed!</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Your question batch has been processed without timeouts</p>
                </div>

                <div className="bg-[#080d13] border border-slate-900 rounded-2xl p-6 text-xs text-left space-y-3">
                  {[
                    { label: 'Total Rows Processed', val: activeBatch.totalRows,     color: 'text-white' },
                    { label: 'Questions Imported',   val: activeBatch.importedRows,  color: 'text-emerald-400' },
                    { label: 'Skipped Duplicates',   val: activeBatch.duplicateRows, color: 'text-orange-400' },
                    { label: 'Validation Errors',    val: activeBatch.invalidRows,   color: 'text-rose-400' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-1.5 border-b border-slate-900/60 last:border-0">
                      <span className="text-slate-400 font-medium">{r.label}</span>
                      <span className={`font-black font-mono ${r.color}`}>{r.val ?? 0}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  {activeBatch.invalidRows > 0 && (
                    <button onClick={() => downloadErrors(activeBatch._id)} className="flex items-center gap-1.5 bg-[#080d13] border border-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold">
                      <FiDownload /> Error CSV
                    </button>
                  )}
                  <button onClick={resetWizard} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
                    Return to Dashboard
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
