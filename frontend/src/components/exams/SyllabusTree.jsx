import React, { useState, useMemo } from 'react';
import {
  FiChevronDown, FiChevronRight, FiBook, FiFolder, FiFileText,
  FiClock, FiSearch, FiFilter, FiX
} from 'react-icons/fi';

function SubtopicList({ subtopics }) {
  if (!subtopics?.length) return null;
  return (
    <ul className="mt-2 ml-4 space-y-1.5 border-l border-slate-800 pl-4">
      {subtopics.map((st, i) => (
        <li key={st._id || i} className="text-xs text-slate-400 flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-500/60 mt-1.5 shrink-0" />
          <span>{st.title}</span>
        </li>
      ))}
    </ul>
  );
}

function TopicItem({ topic, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const hasSubtopics = topic.subtopics?.length > 0;

  return (
    <div className="border border-slate-800/60 rounded-xl overflow-hidden bg-dark-900/40">
      <button
        onClick={() => hasSubtopics && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${hasSubtopics ? 'hover:bg-dark-800/60 cursor-pointer' : 'cursor-default'}`}
      >
        {hasSubtopics ? (
          open ? <FiChevronDown className="text-brand-400 shrink-0" /> : <FiChevronRight className="text-slate-500 shrink-0" />
        ) : (
          <FiFileText className="text-slate-600 shrink-0 text-sm" />
        )}
        <div className="flex-grow min-w-0">
          <p className="text-sm font-medium text-slate-200">{topic.title}</p>
          {topic.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{topic.description}</p>}
        </div>
        {topic.estimatedStudyHours > 0 && (
          <span className="text-xs text-slate-600 flex items-center gap-1 shrink-0">
            <FiClock className="text-emerald-500" /> {topic.estimatedStudyHours}h
          </span>
        )}
        {hasSubtopics && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 shrink-0">
            {topic.subtopics.length} subtopics
          </span>
        )}
      </button>
      {open && hasSubtopics && (
        <div className="px-4 pb-3 border-t border-slate-800/40">
          <SubtopicList subtopics={topic.subtopics} />
        </div>
      )}
    </div>
  );
}

function SubjectAccordion({ subject, defaultOpen = false, searchTerm = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  const filteredTopics = useMemo(() => {
    if (!searchTerm) return subject.topics || [];
    const q = searchTerm.toLowerCase();
    return (subject.topics || []).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.subtopics?.some((st) => st.title.toLowerCase().includes(q))
    );
  }, [subject.topics, searchTerm]);

  if (searchTerm && filteredTopics.length === 0) return null;

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 bg-dark-900/60 hover:bg-dark-800/60 transition-colors text-left"
      >
        {open ? <FiChevronDown className="text-accent-400" /> : <FiChevronRight className="text-slate-500" />}
        <FiFolder className="text-accent-400" />
        <div className="flex-grow">
          <p className="font-semibold text-white">{subject.title}</p>
          {subject.description && <p className="text-xs text-slate-500 mt-0.5">{subject.description}</p>}
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-accent-500/10 text-accent-400">
          {filteredTopics.length} topics
        </span>
      </button>
      {open && (
        <div className="p-4 space-y-2 bg-dark-950/40 border-t border-slate-800">
          {filteredTopics.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-4">No topics in this subject</p>
          ) : (
            filteredTopics.map((topic) => (
              <TopicItem key={topic._id} topic={topic} defaultOpen={!!searchTerm} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PhaseSection({ phase, searchTerm = '', filterSubjectId = '' }) {
  const [open, setOpen] = useState(true);

  const filteredSubjects = useMemo(() => {
    let subjects = phase.subjects || [];
    if (filterSubjectId) {
      subjects = subjects.filter((s) => s._id === filterSubjectId);
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      subjects = subjects.filter((s) => {
        if (s.title.toLowerCase().includes(q)) return true;
        return (s.topics || []).some(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            t.subtopics?.some((st) => st.title.toLowerCase().includes(q))
        );
      });
    }
    return subjects;
  }, [phase.subjects, searchTerm, filterSubjectId]);

  if (filteredSubjects.length === 0) return null;

  const topicCount = filteredSubjects.reduce((acc, s) => acc + (s.topics?.length || 0), 0);

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 group"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <FiBook className="text-white" />
        </div>
        <div className="flex-grow text-left">
          <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors">{phase.title}</h3>
          {phase.description && <p className="text-xs text-slate-500">{phase.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-400">
            {filteredSubjects.length} subjects · {topicCount} topics
          </span>
          {open ? <FiChevronDown className="text-slate-500" /> : <FiChevronRight className="text-slate-500" />}
        </div>
      </button>

      {open && (
        <div className="ml-2 space-y-3 pl-4 border-l-2 border-brand-500/20">
          {filteredSubjects.map((subject) => (
            <SubjectAccordion
              key={subject._id}
              subject={subject}
              defaultOpen={!!searchTerm || !!filterSubjectId}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SyllabusTree({ syllabus, showFilters = true }) {
  const [search, setSearch] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const allSubjects = useMemo(() => {
    const subs = [];
    (syllabus?.phases || []).forEach((phase) => {
      (phase.subjects || []).forEach((s) => subs.push({ ...s, phaseId: phase._id, phaseTitle: phase.title }));
    });
    return subs;
  }, [syllabus]);

  const filteredPhases = useMemo(() => {
    let phases = syllabus?.phases || [];
    if (phaseFilter) phases = phases.filter((p) => p._id === phaseFilter);
    return phases;
  }, [syllabus, phaseFilter]);

  const hasResults = filteredPhases.some((phase) => {
    let subjects = phase.subjects || [];
    if (subjectFilter) subjects = subjects.filter((s) => s._id === subjectFilter);
    if (search) {
      const q = search.toLowerCase();
      subjects = subjects.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        (s.topics || []).some((t) =>
          t.title.toLowerCase().includes(q) ||
          t.subtopics?.some((st) => st.title.toLowerCase().includes(q))
        )
      );
    }
    return subjects.length > 0;
  });

  const clearFilters = () => {
    setSearch('');
    setPhaseFilter('');
    setSubjectFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {syllabus?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Phases', value: syllabus.stats.phaseCount, color: 'text-brand-400' },
            { label: 'Subjects', value: syllabus.stats.subjectCount, color: 'text-accent-400' },
            { label: 'Topics', value: syllabus.stats.topicCount, color: 'text-emerald-400' },
            { label: 'Subtopics', value: syllabus.stats.subtopicCount, color: 'text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="bg-dark-900/60 border border-slate-800 rounded-xl p-4 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <FiFilter className="text-brand-400" /> Filter & Search Syllabus
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search topics & subtopics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <select
              value={phaseFilter}
              onChange={(e) => { setPhaseFilter(e.target.value); setSubjectFilter(''); }}
              className="bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Phases</option>
              {(syllabus?.phases || []).map((p) => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="">All Subjects</option>
              {allSubjects
                .filter((s) => !phaseFilter || s.phaseId === phaseFilter)
                .map((s) => (
                  <option key={s._id} value={s._id}>{s.phaseTitle} → {s.title}</option>
                ))}
            </select>
          </div>
          {(search || phaseFilter || subjectFilter) && (
            <button onClick={clearFilters} className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
              <FiX /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Tree */}
      {!hasResults ? (
        <div className="text-center py-12">
          <FiSearch className="text-3xl text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500">No syllabus items match your filters.</p>
          <button onClick={clearFilters} className="text-sm text-brand-400 hover:text-brand-300 mt-2">Clear filters</button>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredPhases.map((phase) => (
            <PhaseSection
              key={phase._id}
              phase={phase}
              searchTerm={search}
              filterSubjectId={subjectFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
}
