import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiEdit, FiTrash2, FiSearch, FiFilter, FiRefreshCw,
  FiArchive, FiEye, FiEyeOff, FiBookOpen, FiLayers, FiGrid,
  FiChevronDown, FiX, FiCheck, FiGitMerge, FiList,
  FiBarChart2, FiActivity, FiChevronRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'exams',     label: 'Exams',     icon: FiGitMerge },
  { key: 'phases',    label: 'Phases',    icon: FiLayers },
  { key: 'subjects',  label: 'Subjects',  icon: FiBookOpen },
  { key: 'topics',    label: 'Topics',    icon: FiList },
  { key: 'subtopics', label: 'Subtopics', icon: FiGrid },
];

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'civil_services', label: 'Civil Services' },
  { value: 'state_psc',      label: 'State PSC' },
  { value: 'ssc',            label: 'SSC' },
  { value: 'banking',        label: 'Banking' },
  { value: 'railway',        label: 'Railway' },
  { value: 'defence',        label: 'Defence' },
  { value: 'gk',             label: 'GK/GS' },
  { value: 'other',          label: 'Other' },
];

const WEIGHTAGE_COLORS = {
  high:   'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  medium: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  low:    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
};

// ─── Reusable Mini Components ─────────────────────────────────────────────────
function Badge({ children, className = '' }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${className}`}>
      {children}
    </span>
  );
}

function StatusDot({ isPublished, isArchived }) {
  if (isArchived) return <Badge className="bg-slate-700 text-slate-400">Archived</Badge>;
  if (isPublished) return <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Published</Badge>;
  return <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20">Draft</Badge>;
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all"
      />
    </div>
  );
}

function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-slate-800/60">
      <span className="text-[11px] text-slate-500">
        Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`w-7 h-7 rounded text-[11px] font-bold transition-all ${p === pagination.page ? 'bg-brand-600 text-white' : 'bg-dark-900 text-slate-400 hover:bg-dark-800 border border-slate-800'}`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── MODAL: Generic Create/Edit Form ─────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-950 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800">
            <FiX />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-brand-500 transition-all"
      {...rest}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-brand-500 transition-all resize-none"
    />
  );
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────
function StatsBar({ stats }) {
  if (!stats) return null;
  const items = [
    { label: 'Exams',     value: stats.exams,     color: 'text-brand-400' },
    { label: 'Phases',    value: stats.phases,    color: 'text-purple-400' },
    { label: 'Subjects',  value: stats.subjects,  color: 'text-cyan-400' },
    { label: 'Topics',    value: stats.topics,    color: 'text-emerald-400' },
    { label: 'Subtopics', value: stats.subtopics, color: 'text-amber-400' },
  ];
  return (
    <div className="grid grid-cols-5 gap-3 mb-6">
      {items.map(item => (
        <div key={item.label} className="bg-dark-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
          <div className={`text-xl font-black ${item.color}`}>{item.value ?? '—'}</div>
          <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── TABLE ────────────────────────────────────────────────────────────────────
function TableRow({ children }) {
  return <tr className="border-b border-slate-800/60 hover:bg-dark-900/40 transition-colors">{children}</tr>;
}

function Td({ children, className = '' }) {
  return <td className={`px-4 py-3 text-xs text-slate-300 ${className}`}>{children}</td>;
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">{children}</th>;
}

// ─── EXAMS TAB ────────────────────────────────────────────────────────────────
function ExamsTab({ onRefreshStats }) {
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editing, setEditing] = useState(null);

  // Form state
  const [form, setForm] = useState({ title: '', shortDescription: '', fullDescription: '', conductingBody: '', eligibility: '', examPattern: '', category: 'other', displayOrder: 0 });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.listExams({ search, category, page, limit: 15 });
      setExams(data.exams);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  }, [search, category, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setForm({ title: '', shortDescription: '', fullDescription: '', conductingBody: '', eligibility: '', examPattern: '', category: 'other', displayOrder: 0 }); setEditing(null); setModal('exam'); };
  const openEdit = (exam) => {
    setForm({ title: exam.title, shortDescription: exam.shortDescription, fullDescription: exam.fullDescription || '', conductingBody: exam.conductingBody || '', eligibility: exam.eligibility || '', examPattern: exam.examPattern || '', category: exam.category || 'other', displayOrder: exam.displayOrder || 0 });
    setEditing(exam);
    setModal('exam');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.shortDescription) return toast.error('Title and short description required.');
    try {
      if (editing) { await examAPI.updateExam(editing._id, form); toast.success('Exam updated.'); }
      else { await examAPI.createExam(form); toast.success('Exam created.'); }
      setModal(null);
      fetch();
      onRefreshStats?.();
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this exam and ALL its phases, subjects, topics, and subtopics permanently?')) return;
    try { await examAPI.deleteExam(id); toast.success('Exam deleted.'); fetch(); onRefreshStats?.(); }
    catch { toast.error('Delete failed.'); }
  };

  const handleArchive = async (exam) => {
    try { await examAPI.toggleArchive('exam', exam._id); toast.success(`Exam ${exam.isArchived ? 'restored' : 'archived'}.`); fetch(); }
    catch { toast.error('Failed.'); }
  };

  const handlePublish = async (exam) => {
    try { await examAPI.togglePublish('exam', exam._id); toast.success(`Exam ${exam.isPublished ? 'unpublished' : 'published'}.`); fetch(); }
    catch { toast.error('Failed.'); }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search exams..." />
        <select value={category} onChange={e => { setCategory(e.target.value); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20">
          <FiPlus /> New Exam
        </button>
        <Link to="/admin/syllabus/tree" className="flex items-center gap-1.5 bg-dark-900 hover:bg-dark-800 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all">
          <FiGitMerge /> Tree View
        </Link>
      </div>

      {/* Table */}
      <div className="bg-dark-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-900/80 border-b border-slate-800">
            <tr><Th>Exam</Th><Th>Category</Th><Th>Conducting Body</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">Loading...</td></tr>
            ) : exams.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">No exams found.</td></tr>
            ) : exams.map(exam => (
              <TableRow key={exam._id}>
                <Td>
                  <div className="font-semibold text-white">{exam.title}</div>
                  <div className="text-slate-500 text-[10px] mt-0.5">{exam.shortDescription}</div>
                </Td>
                <Td><Badge className="bg-brand-500/10 text-brand-400 border border-brand-500/20">{exam.category || 'other'}</Badge></Td>
                <Td className="text-slate-400">{exam.conductingBody || '—'}</Td>
                <Td><StatusDot isPublished={exam.isPublished} isArchived={exam.isArchived} /></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Link to={`/admin/exams/${exam._id}/syllabus`} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-brand-400 transition-all" title="Edit Syllabus">
                      <FiChevronRight className="text-sm" />
                    </Link>
                    <button onClick={() => openEdit(exam)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-all" title="Edit Exam">
                      <FiEdit className="text-sm" />
                    </button>
                    <button onClick={() => handlePublish(exam)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-emerald-400 transition-all" title={exam.isPublished ? 'Unpublish' : 'Publish'}>
                      {exam.isPublished ? <FiEyeOff className="text-sm" /> : <FiEye className="text-sm" />}
                    </button>
                    <button onClick={() => handleArchive(exam)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-amber-400 transition-all" title={exam.isArchived ? 'Restore' : 'Archive'}>
                      <FiArchive className="text-sm" />
                    </button>
                    <button onClick={() => handleDelete(exam._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all" title="Delete">
                      <FiTrash2 className="text-sm" />
                    </button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPage={setPage} />

      {/* Create/Edit Modal */}
      {modal === 'exam' && (
        <Modal title={editing ? `Edit: ${editing.title}` : 'Create New Exam'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Exam Title *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. UPSC Civil Services" /></FormField>
              <FormField label="Category">
                <Select value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} options={CATEGORIES.slice(1)} />
              </FormField>
            </div>
            <FormField label="Short Description *"><Input value={form.shortDescription} onChange={v => setForm(f => ({ ...f, shortDescription: v }))} placeholder="Brief one-liner" /></FormField>
            <FormField label="Full Description"><Textarea value={form.fullDescription} onChange={v => setForm(f => ({ ...f, fullDescription: v }))} placeholder="Detailed description..." /></FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Conducting Body"><Input value={form.conductingBody} onChange={v => setForm(f => ({ ...f, conductingBody: v }))} placeholder="e.g. UPSC" /></FormField>
              <FormField label="Eligibility"><Input value={form.eligibility} onChange={v => setForm(f => ({ ...f, eligibility: v }))} placeholder="e.g. Graduate, Age 21-32" /></FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Exam Pattern"><Input value={form.examPattern} onChange={v => setForm(f => ({ ...f, examPattern: v }))} placeholder="e.g. Prelims + Mains + Interview" /></FormField>
              <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={v => setForm(f => ({ ...f, displayOrder: Number(v) }))} /></FormField>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setModal(null)} className="px-4 py-2 rounded-xl bg-dark-800 text-slate-400 text-xs font-semibold hover:bg-dark-700 transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all flex items-center gap-1.5">
                <FiCheck /> {editing ? 'Save Changes' : 'Create Exam'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── PHASES TAB ───────────────────────────────────────────────────────────────
function PhasesTab() {
  const [phases, setPhases] = useState([]);
  const [exams, setExams] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ examId: '', title: '', description: '', displayOrder: 0 });

  const loadExams = async () => {
    try { const { data } = await examAPI.listExams({ limit: 100 }); setExams(data.exams); }
    catch {}
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.listPhases({ search, examId: examFilter, page, limit: 20 });
      setPhases(data.phases);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load phases'); }
    finally { setLoading(false); }
  }, [search, examFilter, page]);

  useEffect(() => { loadExams(); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => { setForm({ examId: exams[0]?._id || '', title: '', description: '', displayOrder: 0 }); setEditing(null); setModal(true); };
  const openEdit = (phase) => { setForm({ examId: phase.examId?._id || phase.examId, title: phase.title, description: phase.description || '', displayOrder: phase.displayOrder || phase.order || 0 }); setEditing(phase); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examId || !form.title) return toast.error('Exam and title required.');
    try {
      if (editing) { await examAPI.updatePhase(editing._id, form); toast.success('Phase updated.'); }
      else { await examAPI.createPhase(form.examId, form); toast.success('Phase created.'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this phase and all nested subjects/topics?')) return;
    try { await examAPI.deletePhase(id); toast.success('Phase deleted.'); fetch(); }
    catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search phases..." />
        <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Exams</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all">
          <FiPlus /> New Phase
        </button>
      </div>
      <div className="bg-dark-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-900/80 border-b border-slate-800">
            <tr><Th>Phase</Th><Th>Exam</Th><Th>Order</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">Loading...</td></tr>
            : phases.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">No phases found.</td></tr>
            : phases.map(phase => (
              <TableRow key={phase._id}>
                <Td><div className="font-semibold text-white">{phase.title}</div>{phase.description && <div className="text-slate-500 text-[10px] mt-0.5">{phase.description}</div>}</Td>
                <Td><span className="text-brand-400 text-[11px] font-semibold">{phase.examId?.title || '—'}</span></Td>
                <Td><span className="text-slate-400">{phase.displayOrder ?? phase.order ?? 0}</span></Td>
                <Td><StatusDot isPublished={phase.isPublished} isArchived={phase.isArchived} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(phase)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-all"><FiEdit className="text-sm" /></button>
                    <button onClick={() => handleDelete(phase._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={editing ? 'Edit Phase' : 'Create Phase'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Exam *">
              <Select value={form.examId} onChange={v => setForm(f => ({ ...f, examId: v }))} options={exams.map(e => ({ value: e._id, label: e.title }))} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Phase Title *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Prelims" /></FormField>
              <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={v => setForm(f => ({ ...f, displayOrder: Number(v) }))} /></FormField>
            </div>
            <FormField label="Description"><Textarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional..." /></FormField>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-dark-800 text-slate-400 text-xs font-semibold hover:bg-dark-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"><FiCheck /> {editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── SUBJECTS TAB ─────────────────────────────────────────────────────────────
function SubjectsTab() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [phases, setPhases] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ examId: '', phaseId: '', title: '', description: '', estimatedWeightage: 'medium', displayOrder: 0 });

  const loadMeta = async () => {
    try {
      const [ed, pd] = await Promise.all([examAPI.listExams({ limit: 100 }), examAPI.listPhases({ limit: 100 })]);
      setExams(ed.data.exams);
      setPhases(pd.data.phases);
    } catch {}
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.listSubjects({ search, examId: examFilter, phaseId: phaseFilter, page, limit: 20 });
      setSubjects(data.subjects);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load subjects'); }
    finally { setLoading(false); }
  }, [search, examFilter, phaseFilter, page]);

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const filteredPhases = examFilter ? phases.filter(p => (p.examId?._id || p.examId?.toString()) === examFilter) : phases;

  const openCreate = () => { setForm({ examId: exams[0]?._id || '', phaseId: '', title: '', description: '', estimatedWeightage: 'medium', displayOrder: 0 }); setEditing(null); setModal(true); };
  const openEdit = (sub) => { setForm({ examId: sub.examId?._id || sub.examId, phaseId: sub.phaseId?._id || sub.phaseId, title: sub.title, description: sub.description || '', estimatedWeightage: sub.estimatedWeightage || 'medium', displayOrder: sub.displayOrder || sub.order || 0 }); setEditing(sub); setModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examId || !form.phaseId || !form.title) return toast.error('Exam, phase, and title required.');
    try {
      if (editing) { await examAPI.updateSubject(editing._id, form); toast.success('Subject updated.'); }
      else { await examAPI.createSubject(form.examId, form); toast.success('Subject created.'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject and all its topics?')) return;
    try { await examAPI.deleteSubject(id); toast.success('Deleted.'); fetch(); }
    catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search subjects..." />
        <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setPhaseFilter(''); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Exams</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <select value={phaseFilter} onChange={e => { setPhaseFilter(e.target.value); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Phases</option>
          {filteredPhases.map(p => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"><FiPlus /> New Subject</button>
      </div>

      <div className="bg-dark-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-900/80 border-b border-slate-800">
            <tr><Th>Subject</Th><Th>Exam / Phase</Th><Th>Weightage</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">Loading...</td></tr>
            : subjects.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">No subjects found.</td></tr>
            : subjects.map(sub => (
              <TableRow key={sub._id}>
                <Td><div className="font-semibold text-white">{sub.title}</div></Td>
                <Td><div className="text-brand-400 text-[11px] font-semibold">{sub.examId?.title || '—'}</div><div className="text-slate-500 text-[10px]">{sub.phaseId?.title || '—'}</div></Td>
                <Td><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${WEIGHTAGE_COLORS[sub.estimatedWeightage] || WEIGHTAGE_COLORS.medium}`}>{sub.estimatedWeightage || 'medium'}</span></Td>
                <Td><StatusDot isPublished={sub.isPublished} isArchived={sub.isArchived} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(sub)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-all"><FiEdit className="text-sm" /></button>
                    <button onClick={() => handleDelete(sub._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={editing ? 'Edit Subject' : 'Create Subject'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Exam *">
                <Select value={form.examId} onChange={v => setForm(f => ({ ...f, examId: v }))} options={exams.map(e => ({ value: e._id, label: e.title }))} />
              </FormField>
              <FormField label="Phase *">
                <Select value={form.phaseId} onChange={v => setForm(f => ({ ...f, phaseId: v }))} options={phases.filter(p => !form.examId || (p.examId?._id || p.examId) === form.examId).map(p => ({ value: p._id, label: p.title }))} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Subject Title *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. History" /></FormField>
              <FormField label="Weightage">
                <Select value={form.estimatedWeightage} onChange={v => setForm(f => ({ ...f, estimatedWeightage: v }))} options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </FormField>
            </div>
            <FormField label="Description"><Textarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional..." /></FormField>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-dark-800 text-slate-400 text-xs font-semibold hover:bg-dark-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5"><FiCheck /> {editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── TOPICS TAB ───────────────────────────────────────────────────────────────
function TopicsTab() {
  const [topics, setTopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ examId: '', phaseId: '', subjectId: '', title: '', description: '', estimatedWeightage: 'medium', questionTarget: 100, pyqTarget: 10, displayOrder: 0 });

  const loadMeta = async () => {
    try {
      const [ed, sd] = await Promise.all([examAPI.listExams({ limit: 100 }), examAPI.listSubjects({ limit: 200 })]);
      setExams(ed.data.exams);
      setSubjects(sd.data.subjects);
    } catch {}
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.listTopics({ search, examId: examFilter, subjectId: subjectFilter, page, limit: 20 });
      setTopics(data.topics);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load topics'); }
    finally { setLoading(false); }
  }, [search, examFilter, subjectFilter, page]);

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const filteredSubjects = examFilter ? subjects.filter(s => (s.examId?._id || s.examId?.toString()) === examFilter) : subjects;

  const openCreate = () => { setForm({ examId: exams[0]?._id || '', phaseId: '', subjectId: '', title: '', description: '', estimatedWeightage: 'medium', questionTarget: 100, pyqTarget: 10, displayOrder: 0 }); setEditing(null); setModal(true); };
  const openEdit = (t) => {
    setForm({ examId: t.examId?._id || t.examId, phaseId: t.phaseId?._id || t.phaseId, subjectId: t.subjectId?._id || t.subjectId, title: t.title, description: t.description || '', estimatedWeightage: t.estimatedWeightage || 'medium', questionTarget: t.questionTarget || 100, pyqTarget: t.pyqTarget || 10, displayOrder: t.displayOrder || t.order || 0 });
    setEditing(t); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examId || !form.subjectId || !form.title) return toast.error('Exam, subject, and title required.');
    // derive phaseId from selected subject
    const selectedSub = subjects.find(s => s._id === form.subjectId);
    const payload = { ...form, phaseId: selectedSub?.phaseId?._id || selectedSub?.phaseId || form.phaseId };
    try {
      if (editing) { await examAPI.updateTopic(editing._id, payload); toast.success('Topic updated.'); }
      else { await examAPI.createTopic(form.examId, payload); toast.success('Topic created.'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this topic?')) return;
    try { await examAPI.deleteTopic(id); toast.success('Deleted.'); fetch(); }
    catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search topics..." />
        <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setSubjectFilter(''); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Exams</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Subjects</option>
          {filteredSubjects.map(s => <option key={s._id} value={s._id}>{s.title}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"><FiPlus /> New Topic</button>
      </div>

      <div className="bg-dark-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-900/80 border-b border-slate-800">
            <tr><Th>Topic</Th><Th>Exam / Subject</Th><Th>Weightage</Th><Th>Q Target</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">Loading...</td></tr>
            : topics.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">No topics found.</td></tr>
            : topics.map(t => (
              <TableRow key={t._id}>
                <Td><div className="font-semibold text-white">{t.title}</div>{t.description && <div className="text-slate-500 text-[10px] mt-0.5 truncate max-w-xs">{t.description}</div>}</Td>
                <Td><div className="text-brand-400 text-[11px] font-semibold">{t.examId?.title || '—'}</div><div className="text-slate-500 text-[10px]">{t.subjectId?.title || '—'}</div></Td>
                <Td><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${WEIGHTAGE_COLORS[t.estimatedWeightage] || WEIGHTAGE_COLORS.medium}`}>{t.estimatedWeightage || 'medium'}</span></Td>
                <Td className="text-slate-400">{t.questionTarget || 100}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-all"><FiEdit className="text-sm" /></button>
                    <button onClick={() => handleDelete(t._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={editing ? 'Edit Topic' : 'Create Topic'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Exam *">
                <Select value={form.examId} onChange={v => setForm(f => ({ ...f, examId: v, subjectId: '' }))} options={exams.map(e => ({ value: e._id, label: e.title }))} />
              </FormField>
              <FormField label="Subject *">
                <Select value={form.subjectId} onChange={v => setForm(f => ({ ...f, subjectId: v }))} options={subjects.filter(s => !form.examId || (s.examId?._id || s.examId) === form.examId).map(s => ({ value: s._id, label: s.title }))} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Topic Title *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Ancient India" /></FormField>
              <FormField label="Weightage">
                <Select value={form.estimatedWeightage} onChange={v => setForm(f => ({ ...f, estimatedWeightage: v }))} options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </FormField>
            </div>
            <FormField label="Description"><Textarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional topic description..." /></FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Q Target"><Input type="number" value={form.questionTarget} onChange={v => setForm(f => ({ ...f, questionTarget: Number(v) }))} /></FormField>
              <FormField label="PYQ Target"><Input type="number" value={form.pyqTarget} onChange={v => setForm(f => ({ ...f, pyqTarget: Number(v) }))} /></FormField>
              <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={v => setForm(f => ({ ...f, displayOrder: Number(v) }))} /></FormField>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-dark-800 text-slate-400 text-xs font-semibold hover:bg-dark-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"><FiCheck /> {editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── SUBTOPICS TAB ────────────────────────────────────────────────────────────
function SubtopicsTab() {
  const [subtopics, setSubtopics] = useState([]);
  const [exams, setExams] = useState([]);
  const [topics, setTopics] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ examId: '', phaseId: '', subjectId: '', topicId: '', title: '', description: '', estimatedWeightage: 'medium', questionTarget: 30, pyqTarget: 3, displayOrder: 0 });

  const loadMeta = async () => {
    try {
      const [ed, td] = await Promise.all([examAPI.listExams({ limit: 100 }), examAPI.listTopics({ limit: 500 })]);
      setExams(ed.data.exams);
      setTopics(td.data.topics);
    } catch {}
  };

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.listSubtopics({ search, examId: examFilter, topicId: topicFilter, page, limit: 20 });
      setSubtopics(data.subtopics);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load subtopics'); }
    finally { setLoading(false); }
  }, [search, examFilter, topicFilter, page]);

  useEffect(() => { loadMeta(); }, []);
  useEffect(() => { fetch(); }, [fetch]);

  const filteredTopics = examFilter ? topics.filter(t => (t.examId?._id || t.examId?.toString()) === examFilter) : topics;

  const openCreate = () => { setForm({ examId: exams[0]?._id || '', phaseId: '', subjectId: '', topicId: '', title: '', description: '', estimatedWeightage: 'medium', questionTarget: 30, pyqTarget: 3, displayOrder: 0 }); setEditing(null); setModal(true); };
  const openEdit = (st) => {
    setForm({ examId: st.examId?._id || st.examId, phaseId: st.phaseId, subjectId: st.subjectId, topicId: st.topicId?._id || st.topicId, title: st.title, description: st.description || '', estimatedWeightage: st.estimatedWeightage || 'medium', questionTarget: st.questionTarget || 30, pyqTarget: st.pyqTarget || 3, displayOrder: st.displayOrder || st.order || 0 });
    setEditing(st); setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.examId || !form.topicId || !form.title) return toast.error('Exam, topic, and title required.');
    const selectedTopic = topics.find(t => t._id === form.topicId);
    const payload = { ...form, phaseId: selectedTopic?.phaseId || form.phaseId, subjectId: selectedTopic?.subjectId?._id || selectedTopic?.subjectId || form.subjectId };
    try {
      if (editing) { await examAPI.updateSubtopic(editing._id, payload); toast.success('Subtopic updated.'); }
      else { await examAPI.createSubtopic(form.examId, payload); toast.success('Subtopic created.'); }
      setModal(false); fetch();
    } catch (err) { toast.error(err?.response?.data?.message || 'Save failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subtopic?')) return;
    try { await examAPI.deleteSubtopic(id); toast.success('Deleted.'); fetch(); }
    catch { toast.error('Delete failed.'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search subtopics..." />
        <select value={examFilter} onChange={e => { setExamFilter(e.target.value); setTopicFilter(''); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Exams</option>
          {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
        </select>
        <select value={topicFilter} onChange={e => { setTopicFilter(e.target.value); setPage(1); }} className="bg-dark-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none focus:border-brand-500">
          <option value="">All Topics</option>
          {filteredTopics.map(t => <option key={t._id} value={t._id}>{t.title}</option>)}
        </select>
        <button onClick={openCreate} className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all"><FiPlus /> New Subtopic</button>
      </div>

      <div className="bg-dark-900/40 border border-slate-800/60 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-900/80 border-b border-slate-800">
            <tr><Th>Subtopic</Th><Th>Exam / Topic</Th><Th>Weightage</Th><Th>Q Target</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">Loading...</td></tr>
            : subtopics.length === 0 ? <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-xs">No subtopics found.</td></tr>
            : subtopics.map(st => (
              <TableRow key={st._id}>
                <Td><div className="font-semibold text-white">{st.title}</div>{st.description && <div className="text-slate-500 text-[10px] mt-0.5 truncate max-w-xs">{st.description}</div>}</Td>
                <Td><div className="text-brand-400 text-[11px] font-semibold">{st.examId?.title || '—'}</div><div className="text-slate-500 text-[10px]">{st.topicId?.title || '—'}</div></Td>
                <Td><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${WEIGHTAGE_COLORS[st.estimatedWeightage] || WEIGHTAGE_COLORS.medium}`}>{st.estimatedWeightage || 'medium'}</span></Td>
                <Td className="text-slate-400">{st.questionTarget || 30}</Td>
                <Td>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(st)} className="p-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white transition-all"><FiEdit className="text-sm" /></button>
                    <button onClick={() => handleDelete(st._id)} className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"><FiTrash2 className="text-sm" /></button>
                  </div>
                </Td>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={editing ? 'Edit Subtopic' : 'Create Subtopic'} onClose={() => setModal(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Exam *">
                <Select value={form.examId} onChange={v => setForm(f => ({ ...f, examId: v, topicId: '' }))} options={exams.map(e => ({ value: e._id, label: e.title }))} />
              </FormField>
              <FormField label="Topic *">
                <Select value={form.topicId} onChange={v => setForm(f => ({ ...f, topicId: v }))} options={topics.filter(t => !form.examId || (t.examId?._id || t.examId) === form.examId).map(t => ({ value: t._id, label: t.title }))} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Subtopic Title *"><Input value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g. Indus Valley Civilization" /></FormField>
              <FormField label="Weightage">
                <Select value={form.estimatedWeightage} onChange={v => setForm(f => ({ ...f, estimatedWeightage: v }))} options={[{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </FormField>
            </div>
            <FormField label="Description"><Textarea value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Optional..." /></FormField>
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Q Target"><Input type="number" value={form.questionTarget} onChange={v => setForm(f => ({ ...f, questionTarget: Number(v) }))} /></FormField>
              <FormField label="PYQ Target"><Input type="number" value={form.pyqTarget} onChange={v => setForm(f => ({ ...f, pyqTarget: Number(v) }))} /></FormField>
              <FormField label="Display Order"><Input type="number" value={form.displayOrder} onChange={v => setForm(f => ({ ...f, displayOrder: Number(v) }))} /></FormField>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-xl bg-dark-800 text-slate-400 text-xs font-semibold hover:bg-dark-700">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5"><FiCheck /> {editing ? 'Save' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function SyllabusManagement() {
  const [activeTab, setActiveTab] = useState('exams');
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const { data } = await examAPI.getSyllabusStats();
      setStats(data.stats);
    } catch {}
  };

  useEffect(() => { loadStats(); }, []);

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiGitMerge className="text-brand-400" />
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Phase 10.1</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Syllabus Management</h1>
            <p className="text-slate-500 text-xs mt-0.5">Complete exam hierarchy — Exam → Phase → Subject → Topic → Subtopic</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/syllabus/tree" className="flex items-center gap-1.5 bg-dark-900 hover:bg-dark-800 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all">
              <FiGitMerge /> Tree View
            </Link>
            <Link to="/admin/exams" className="flex items-center gap-1.5 bg-dark-900 hover:bg-dark-800 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all">
              <FiActivity /> Legacy Editor
            </Link>
            <button onClick={loadStats} className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
              <FiRefreshCw className="text-sm" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <StatsBar stats={stats} />

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-900/60 border border-slate-800/60 rounded-2xl p-1.5">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <Icon className="text-sm shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'exams'     && <ExamsTab onRefreshStats={loadStats} />}
          {activeTab === 'phases'    && <PhasesTab />}
          {activeTab === 'subjects'  && <SubjectsTab />}
          {activeTab === 'topics'    && <TopicsTab />}
          {activeTab === 'subtopics' && <SubtopicsTab />}
        </div>
      </div>
    </div>
  );
}
