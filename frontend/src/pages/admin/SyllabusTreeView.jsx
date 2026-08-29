import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiChevronRight, FiChevronDown, FiSearch, FiFilter,
  FiBookOpen, FiLayers, FiList, FiGrid, FiGitMerge,
  FiRefreshCw, FiArrowLeft, FiArrowRight, FiEye,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import examAPI from '../../api/examApi.js';

// ─── Level Configs ────────────────────────────────────────────────────────────
const LEVEL_STYLES = {
  exam:     { dot: 'bg-brand-500',    label: 'text-white font-black text-sm', indent: 0, badge: 'bg-brand-500/10 text-brand-400 border border-brand-500/20' },
  phase:    { dot: 'bg-purple-500',   label: 'text-slate-100 font-bold text-xs', indent: 5, badge: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
  subject:  { dot: 'bg-cyan-400',     label: 'text-slate-200 font-semibold text-xs', indent: 10, badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' },
  topic:    { dot: 'bg-emerald-400',  label: 'text-slate-300 font-medium text-[11px]', indent: 15, badge: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  subtopic: { dot: 'bg-amber-400',    label: 'text-slate-400 font-normal text-[11px]', indent: 20, badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
};

const WEIGHTAGE_BADGE = {
  high:   'bg-rose-500/10 text-rose-400',
  medium: 'bg-amber-500/10 text-amber-400',
  low:    'bg-emerald-500/10 text-emerald-400',
};

// ─── Tree Node ────────────────────────────────────────────────────────────────
function TreeNode({ node, type, depth = 0, searchQuery, expandAll }) {
  const style = LEVEL_STYLES[type];
  const children = node.phases || node.subjects || node.topics || node.subtopics || [];
  const hasChildren = children.length > 0;
  const childType = { exam: 'phase', phase: 'subject', subject: 'topic', topic: 'subtopic', subtopic: null };

  // Determine if this node matches search or contains matching children
  const matches = !searchQuery || node.title.toLowerCase().includes(searchQuery.toLowerCase());

  const [expanded, setExpanded] = useState(depth < 2);
  useEffect(() => { if (expandAll !== undefined) setExpanded(expandAll); }, [expandAll]);

  // If searching, auto-expand if any descendant matches
  useEffect(() => {
    if (searchQuery) setExpanded(true);
  }, [searchQuery]);

  if (searchQuery && !matches && !hasChildren) return null;

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-slate-800/40 pl-2' : ''}>
      <div
        className={`flex items-center gap-2 py-1.5 px-3 rounded-lg cursor-pointer group transition-all hover:bg-dark-900/60 ${matches ? '' : 'opacity-50'}`}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {/* Expand / Collapse icon */}
        <div className="w-4 shrink-0 text-slate-600 flex items-center justify-center">
          {hasChildren
            ? expanded ? <FiChevronDown className="text-[10px]" /> : <FiChevronRight className="text-[10px]" />
            : <span className="w-1.5 h-1.5 rounded-full bg-slate-700 inline-block" />}
        </div>

        {/* Color dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${style.dot}`} />

        {/* Title */}
        <span className={`flex-1 ${style.label} leading-tight`}>{node.title}</span>

        {/* Badges */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.estimatedWeightage && (
            <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded uppercase ${WEIGHTAGE_BADGE[node.estimatedWeightage] || ''}`}>
              {node.estimatedWeightage}
            </span>
          )}
          {node.questionTarget && (
            <span className="text-[9px] text-slate-500 font-mono">
              🎯 {node.questionTarget}
            </span>
          )}
          {children.length > 0 && (
            <span className={`text-[9px] font-bold px-1.5 py-0.25 rounded ${style.badge}`}>
              {children.length} {childType[type] || 'items'}
            </span>
          )}
        </div>
      </div>

      {/* Description (shown when expanded for topics/subtopics) */}
      {expanded && node.description && (type === 'topic' || type === 'subtopic') && (
        <div className="ml-10 mr-3 text-[10px] text-slate-500 italic pb-1 leading-relaxed">{node.description}</div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child._id}
              node={child}
              type={childType[type]}
              depth={depth + 1}
              searchQuery={searchQuery}
              expandAll={expandAll}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SyllabusTreeView() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [expandAll, setExpandAll] = useState(undefined);
  const [stats, setStats] = useState({ exams: 0, phases: 0, subjects: 0, topics: 0, subtopics: 0 });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data } = await examAPI.getFullSyllabusTree(examFilter || null);
      setTree(data.tree);
      // Compute stats
      let phases = 0, subjects = 0, topics = 0, subtopics = 0;
      data.tree.forEach(ex => {
        ex.phases?.forEach(ph => {
          phases++;
          ph.subjects?.forEach(sub => {
            subjects++;
            sub.topics?.forEach(t => {
              topics++;
              subtopics += (t.subtopics?.length || 0);
            });
          });
        });
      });
      setStats({ exams: data.tree.length, phases, subjects, topics, subtopics });
    } catch (err) {
      toast.error('Failed to load syllabus tree.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [examFilter]);

  const visibleTree = useMemo(() => {
    if (!search) return tree;
    const q = search.toLowerCase();
    const filterNode = (node) => {
      if (node.title.toLowerCase().includes(q)) return node;
      const childKey = Object.keys(node).find(k => Array.isArray(node[k]) && node[k].length && node[k][0]._id);
      if (!childKey) return null;
      const filteredChildren = node[childKey].map(filterNode).filter(Boolean);
      if (filteredChildren.length) return { ...node, [childKey]: filteredChildren };
      return null;
    };
    return tree.map(filterNode).filter(Boolean);
  }, [tree, search]);

  const statItems = [
    { label: 'Exams', value: stats.exams, color: 'text-brand-400' },
    { label: 'Phases', value: stats.phases, color: 'text-purple-400' },
    { label: 'Subjects', value: stats.subjects, color: 'text-cyan-400' },
    { label: 'Topics', value: stats.topics, color: 'text-emerald-400' },
    { label: 'Subtopics', value: stats.subtopics, color: 'text-amber-400' },
  ];

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4 pb-5 border-b border-slate-900">
          <Link to="/admin/syllabus" className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold transition-colors">
            <FiArrowLeft /> Back
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <FiGitMerge className="text-brand-400" /> Syllabus Tree View
            </h1>
            <p className="text-slate-500 text-xs mt-0.5">Expand/collapse the full exam hierarchy</p>
          </div>
          <button onClick={fetch} className="p-2.5 rounded-xl bg-dark-900 border border-slate-800 text-slate-400 hover:text-white transition-all" title="Refresh">
            <FiRefreshCw className="text-sm" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3">
          {statItems.map(s => (
            <div key={s.label} className="bg-dark-900/60 border border-slate-800/60 rounded-xl p-3 text-center">
              <div className={`text-lg font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
          {Object.entries(LEVEL_STYLES).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${val.dot}`} />
              <span className="capitalize">{key}</span>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search across all levels..."
              className="w-full bg-dark-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-200 text-xs focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setExpandAll(true)} className="px-3 py-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-dark-800 transition-all">
              Expand All
            </button>
            <button onClick={() => setExpandAll(false)} className="px-3 py-2 rounded-xl bg-dark-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-dark-800 transition-all">
              Collapse All
            </button>
          </div>
        </div>

        {/* Tree */}
        <div className="bg-dark-900/30 border border-slate-800/60 rounded-2xl p-4 min-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-60">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : visibleTree.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-xs">
              {search ? `No results for "${search}"` : 'No exams found. Seed data or create exams first.'}
            </div>
          ) : (
            <div className="space-y-1">
              {visibleTree.map(exam => (
                <TreeNode
                  key={exam._id}
                  node={exam}
                  type="exam"
                  depth={0}
                  searchQuery={search}
                  expandAll={expandAll}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-between items-center text-xs text-slate-500">
          <span>Click any node to expand/collapse. Hover to see details.</span>
          <Link to="/admin/syllabus" className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 font-semibold transition-colors">
            Manage Syllabus <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
