import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiBookOpen, FiArrowRight, FiTarget, FiSearch, FiChevronDown,
  FiChevronRight, FiClock, FiBarChart2, FiZap, FiCheck,
  FiFilter, FiList, FiGrid, FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext.jsx';
import examAPI from '../../api/examApi.js';

// ─── Weightage Config ─────────────────────────────────────────────────────────
const WEIGHTAGE_STYLES = {
  high:   { text: 'HIGH',   cls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  medium: { text: 'MED',    cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  low:    { text: 'LOW',    cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
};

// ─── Subtopic Pill ────────────────────────────────────────────────────────────
function SubtopicPill({ subtopic }) {
  const w = WEIGHTAGE_STYLES[subtopic.estimatedWeightage] || WEIGHTAGE_STYLES.medium;
  return (
    <div className="flex items-center justify-between gap-2 bg-dark-900/60 border border-slate-800/60 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
        <span className="text-[11px] text-slate-300 font-medium">{subtopic.title}</span>
        {subtopic.description && (
          <span className="text-[10px] text-slate-600 truncate max-w-xs hidden sm:block">{subtopic.description}</span>
        )}
      </div>
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${w.cls}`}>{w.text}</span>
    </div>
  );
}

// ─── Topic Row ────────────────────────────────────────────────────────────────
function TopicRow({ topic }) {
  const [expanded, setExpanded] = useState(false);
  const subtopics = topic.subtopics || [];
  const w = WEIGHTAGE_STYLES[topic.estimatedWeightage] || WEIGHTAGE_STYLES.medium;

  // Determine difficulty from priority
  const difficulty = useMemo(() => {
    const prio = topic.priority || 5;
    if (prio >= 8) return { text: 'Hard', cls: 'text-rose-400 bg-rose-500/10 border-rose-500/25' };
    if (prio >= 5) return { text: 'Medium', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/25' };
    return { text: 'Easy', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' };
  }, [topic.priority]);

  // Sum study hours if 0 (sum subtopics)
  const studyHours = useMemo(() => {
    if (topic.estimatedStudyHours > 0) return topic.estimatedStudyHours;
    return subtopics.reduce((acc, st) => acc + (st.estimatedStudyHours || 0), 0) || 3;
  }, [topic.estimatedStudyHours, subtopics]);

  return (
    <div className="border border-slate-800/50 rounded-xl overflow-hidden transition-all">
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-dark-900/30 hover:bg-dark-900/60 cursor-pointer transition-all group"
        onClick={() => subtopics.length > 0 && setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          {/* Expand icon */}
          <div className="w-4 shrink-0 text-slate-600">
            {subtopics.length > 0
              ? expanded ? <FiChevronDown className="text-[11px]" /> : <FiChevronRight className="text-[11px]" />
              : <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />}
          </div>

          {/* Dot */}
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />

          {/* Title */}
          <span className="text-[12px] font-semibold text-slate-200 leading-tight">{topic.title}</span>
        </div>

        {/* Badges and Progress */}
        <div className="flex items-center gap-3 justify-between sm:justify-end shrink-0 pl-7 sm:pl-0">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${w.cls}`}>{w.text}</span>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${difficulty.cls}`}>{difficulty.text}</span>
            <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
              <FiClock className="text-[9px]" /> {studyHours}h
            </span>
          </div>

          {/* Progress Placeholder */}
          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <div className="w-12 bg-slate-800/80 h-1.5 rounded-full overflow-hidden hidden xs:block">
              <div className="bg-brand-500 h-full w-[0%]" />
            </div>
            <span className="text-[10px] text-slate-500 font-mono font-bold">0%</span>
          </div>

          {/* Practice link */}
          <Link
            to={`/aspirant/topic-practice`}
            state={{ topicId: topic._id, topicTitle: topic.title }}
            onClick={e => e.stopPropagation()}
            className="hidden group-hover:flex items-center gap-1 text-[10px] text-brand-400 font-bold hover:text-brand-300 transition-colors"
          >
            Practice <FiArrowRight />
          </Link>
        </div>
      </div>

      {/* Topic description */}
      {topic.description && !expanded && (
        <div className="px-11 py-1.5 text-[10px] text-slate-500 italic border-t border-slate-800/30 bg-dark-950/20">{topic.description}</div>
      )}

      {/* Subtopics */}
      {expanded && subtopics.length > 0 && (
        <div className="px-4 py-3 space-y-2 border-t border-slate-800/40 bg-dark-950/30">
          {topic.description && <p className="text-[10px] text-slate-500 italic mb-2">{topic.description}</p>}
          {subtopics.map(st => <SubtopicPill key={st._id} subtopic={st} />)}
        </div>
      )}
    </div>
  );
}

// ─── Subject Card ─────────────────────────────────────────────────────────────
function SubjectCard({ subject }) {
  const [expanded, setExpanded] = useState(false);
  const topics = subject.topics || [];
  const w = WEIGHTAGE_STYLES[subject.estimatedWeightage] || WEIGHTAGE_STYLES.medium;

  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-4 bg-dark-900/50 hover:bg-dark-900/80 cursor-pointer transition-all"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-slate-100">{subject.title}</h4>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${w.cls}`}>{w.text}</span>
          </div>
          {subject.description && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{subject.description}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-slate-500">{topics.length} topics</span>
          {expanded ? <FiChevronDown className="text-slate-500 text-sm" /> : <FiChevronRight className="text-slate-500 text-sm" />}
        </div>
      </div>

      {expanded && (
        <div className="px-5 py-4 space-y-2 border-t border-slate-800/60 bg-dark-950/20">
          {topics.length === 0
            ? <p className="text-[11px] text-slate-600 py-2">No topics added yet.</p>
            : topics.map(topic => <TopicRow key={topic._id} topic={topic} />)}
        </div>
      )}
    </div>
  );
}

// ─── Phase Section ────────────────────────────────────────────────────────────
function PhaseSection({ phase, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const subjects = phase.subjects || [];

  return (
    <div className="glass-card border-slate-800 overflow-hidden">
      <div
        className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-dark-900/30 transition-all border-b border-slate-800/60"
        onClick={() => setExpanded(e => !e)}
      >
        <span className="w-3 h-3 rounded-full bg-purple-500 shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-white">{phase.title}</h3>
          {phase.description && <p className="text-[11px] text-slate-500 mt-0.5">{phase.description}</p>}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-500 hidden sm:block">{subjects.length} subjects</span>
          {expanded ? <FiChevronDown className="text-slate-400" /> : <FiChevronRight className="text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-6 py-5 space-y-3">
          {subjects.length === 0
            ? <p className="text-xs text-slate-600 py-4">No subjects in this phase yet.</p>
            : subjects.map(subject => <SubjectCard key={subject._id} subject={subject} />)}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function AspirantSyllabus() {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [examInfo, setExamInfo] = useState(null);
  const [loadingExams, setLoadingExams] = useState(true);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch active exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        const userExams = user?.selectedExams || [];
        if (data.length > 0) {
          const match = data.find(e => userExams.includes(e.id) || userExams.includes(e.title) || userExams.includes(e.slug));
          setSelectedExamId(match ? match._id : data[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load exams.');
      } finally {
        setLoadingExams(false);
      }
    };
    fetchExams();
  }, [user]);

  // Fetch syllabus when exam changes
  useEffect(() => {
    if (!selectedExamId) return;
    const fetchSyllabus = async () => {
      setLoadingSyllabus(true);
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        setSyllabus(data.syllabus || []);
        setExamInfo(data.exam);
        setSearch('');
      } catch (err) {
        toast.error('Failed to load syllabus.');
      } finally {
        setLoadingSyllabus(false);
      }
    };
    fetchSyllabus();
  }, [selectedExamId]);

  // Filter by search across all levels
  const filteredSyllabus = useMemo(() => {
    if (!search.trim()) return syllabus;
    const q = search.toLowerCase();
    return syllabus.map(phase => {
      const phaseMatch = phase.title.toLowerCase().includes(q);
      const filteredSubjects = (phase.subjects || []).map(sub => {
        const subMatch = sub.title.toLowerCase().includes(q);
        const filteredTopics = (sub.topics || []).filter(t =>
          t.title.toLowerCase().includes(q) ||
          (t.subtopics || []).some(st => st.title.toLowerCase().includes(q))
        );
        if (subMatch || filteredTopics.length) return { ...sub, topics: subMatch ? sub.topics : filteredTopics };
        return null;
      }).filter(Boolean);
      if (phaseMatch || filteredSubjects.length) return { ...phase, subjects: phaseMatch ? phase.subjects : filteredSubjects };
      return null;
    }).filter(Boolean);
  }, [syllabus, search]);

  // Compute stats from syllabus
  const syllabusStats = useMemo(() => {
    let totalSubjects = 0, totalTopics = 0, totalSubtopics = 0;
    syllabus.forEach(ph => {
      ph.subjects?.forEach(sub => {
        totalSubjects++;
        sub.topics?.forEach(t => {
          totalTopics++;
          totalSubtopics += (t.subtopics?.length || 0);
        });
      });
    });
    return { phases: syllabus.length, subjects: totalSubjects, topics: totalTopics, subtopics: totalSubtopics };
  }, [syllabus]);

  if (loadingExams) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiTarget className="text-brand-400" />
              <span className="text-xs font-bold text-brand-400 uppercase tracking-widest">Syllabus Explorer</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white">Interactive Syllabus</h1>
            <p className="text-slate-500 text-xs mt-0.5">Browse the complete exam hierarchy. Click any subject to expand topics.</p>
          </div>

          {/* Exam Selector */}
          <div className="shrink-0">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Exam</label>
            <select
              value={selectedExamId}
              onChange={e => setSelectedExamId(e.target.value)}
              className="bg-dark-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all font-semibold min-w-48"
            >
              {exams.map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
            </select>
          </div>
        </div>

        {/* Exam info card */}
        {examInfo && (
          <div className="glass-card p-5 border-slate-800/60 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-white">{examInfo.title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{examInfo.shortDescription}</p>
              {examInfo.conductingBody && (
                <p className="text-[11px] text-slate-500 mt-1">Conducted by: <span className="text-slate-300">{examInfo.conductingBody}</span></p>
              )}
            </div>
            <div className="flex gap-4 text-center shrink-0">
              {[
                { label: 'Phases',   value: syllabusStats.phases,    color: 'text-purple-400' },
                { label: 'Subjects', value: syllabusStats.subjects,  color: 'text-cyan-400' },
                { label: 'Topics',   value: syllabusStats.topics,    color: 'text-emerald-400' },
              ].map(s => (
                <div key={s.label}>
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
            <Link
              to="/aspirant/topic-practice"
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-500/20 shrink-0"
            >
              <FiZap /> Start Practice
            </Link>
          </div>
        )}

        {/* Search */}
        {syllabus.length > 0 && (
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search phases, subjects, topics, subtopics..."
              className="w-full bg-dark-900/60 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-slate-200 text-sm focus:outline-none focus:border-brand-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                ✕
              </button>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-600">
          {[['purple-400', 'Phase'], ['cyan-400', 'Subject'], ['emerald-400', 'Topic'], ['amber-400', 'Subtopic']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full bg-${color}`} />
              {label}
            </div>
          ))}
          <div className="flex items-center gap-3 ml-2">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-rose-500/10 text-rose-400 border-rose-500/20">HIGH</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">MED</span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">LOW</span>
            <span className="text-slate-600">= Exam weightage</span>
          </div>
        </div>

        {/* Content */}
        {loadingSyllabus ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredSyllabus.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-800/60">
            <FiAlertCircle className="text-3xl text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white mb-1">
              {search ? `No results for "${search}"` : 'Syllabus Not Available'}
            </h3>
            <p className="text-slate-500 text-xs">
              {search ? 'Try a different search term.' : 'This exam syllabus will be added soon.'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-brand-400 text-xs font-semibold hover:text-brand-300 transition-colors">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSyllabus.map((phase, idx) => (
              <PhaseSection key={phase._id} phase={phase} defaultExpanded={idx === 0} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
