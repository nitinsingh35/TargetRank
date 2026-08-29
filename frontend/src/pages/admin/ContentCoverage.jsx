import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowLeft, FiAlertTriangle, FiCheckCircle, FiBookOpen,
  FiLoader, FiChevronDown, FiChevronRight, FiGrid, FiFolder,
  FiFileText, FiAward, FiInfo, FiTrendingUp
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminSyllabusAPI from '../../api/adminSyllabusApi.js';

export default function ContentCoverage() {
  const [coverageData, setCoverageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Expand state trackers (stores _ids of expanded nodes)
  const [expandedExams, setExpandedExams] = useState({});
  const [expandedPhases, setExpandedPhases] = useState({});
  const [expandedSubjects, setExpandedSubjects] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamId, setSelectedExamId] = useState('');

  useEffect(() => {
    fetchCoverage();
  }, [selectedExamId]);

  const fetchCoverage = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (selectedExamId) params.examId = selectedExamId;
      const { data } = await adminSyllabusAPI.getSyllabusCoverage(params);
      if (data.success) {
        setCoverageData(data.coverage || []);
        
        // Auto-expand first exam by default
        if (data.coverage && data.coverage.length > 0) {
          setExpandedExams(prev => ({ ...prev, [data.coverage[0]._id]: true }));
        }
      } else {
        throw new Error('Failed to load coverage report.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch syllabus coverage.');
      toast.error('Error loading coverage data.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle expand triggers
  const toggleExam = (id) => setExpandedExams(prev => ({ ...prev, [id]: !prev[id] }));
  const togglePhase = (id) => setExpandedPhases(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleSubject = (id) => setExpandedSubjects(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleTopic = (id) => setExpandedTopics(prev => ({ ...prev, [id]: !prev[id] }));

  // Aggregate stats across all exams loaded
  let totalExams = coverageData.length;
  let totalTopics = 0;
  let criticalGaps = 0; // count of topics with 0 questions
  let sumCoverage = 0;

  coverageData.forEach(exam => {
    (exam.phases || []).forEach(phase => {
      (phase.subjects || []).forEach(subject => {
        (subject.topics || []).forEach(topic => {
          totalTopics++;
          if (topic.currentCount === 0) criticalGaps++;
          sumCoverage += topic.coveragePercentage;
        });
      });
    });
  });

  const avgCoverage = totalTopics > 0 ? Math.round(sumCoverage / totalTopics) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="text-4xl text-brand-500 animate-spin" />
          <p className="text-slate-400 text-sm font-semibold">Analyzing syllabus coverage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Back Link */}
        <Link
          to="/admin/dashboard"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <FiArrowLeft /> Back to Admin Dashboard
        </Link>

        {/* Page Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiBookOpen className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Syllabus Expansion Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Syllabus Coverage Audit</h1>
          <p className="text-slate-500 text-sm mt-1">
            Audit question quotas, verified PYQs targets, and coverage percentage across UPSC, BPSC, JPSC, and UPPSC syllabus levels.
          </p>
        </div>

        {/* Aggregate statistics cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Monitored Exams</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalExams}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Total Syllabus Topics</p>
            <p className="text-2xl font-black text-white mt-0.5">{totalTopics}</p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Critical Gaps (0 Qs)</p>
            <p className={`text-2xl font-black mt-0.5 ${criticalGaps > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'}`}>
              {criticalGaps}
            </p>
          </div>
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
            <p className="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Avg Coverage</p>
            <p className="text-2xl font-black text-brand-450 mt-0.5">{avgCoverage}%</p>
          </div>
        </div>

        {/* Filters and search bar */}
        <div className="glass-card p-4 bg-dark-900/40 border-slate-850 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72">
            <input
              type="text"
              placeholder="Search topics / subtopics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Filter Exam</label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="bg-dark-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-semibold"
            >
              <option value="">All State Exams</option>
              {coverageData.map(e => (
                <option key={e._id} value={e._id}>{e.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tree content panel */}
        {error ? (
          <div className="glass-card border-rose-550/20 p-8 text-center space-y-4">
            <FiAlertTriangle className="text-5xl text-rose-500 mx-auto" />
            <p className="text-xs text-slate-400 font-semibold">{error}</p>
            <button onClick={fetchCoverage} className="btn-primary text-xs px-4 py-2 mx-auto justify-center">
              Retry Audit
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {coverageData.map((exam) => {
              const isExamExpanded = expandedExams[exam._id];
              return (
                <div key={exam._id} className="bg-dark-900/40 border border-slate-800 rounded-2xl overflow-hidden">
                  
                  {/* Exam Row */}
                  <div
                    onClick={() => toggleExam(exam._id)}
                    className="p-5 flex items-center justify-between bg-dark-950/40 cursor-pointer border-b border-slate-850/60 hover:bg-dark-900/20 transition-colors flex-wrap gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <FiGrid className="text-brand-400 shrink-0" />
                      <div>
                        <h2 className="text-sm font-extrabold text-white">{exam.title}</h2>
                        <span className="text-[10px] text-slate-550 font-bold">Exam Level Coverage</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col text-right">
                        <span className="text-xs font-black text-slate-350">{exam.currentCount} / {exam.targetCount} Qs</span>
                        <span className="text-[9px] text-slate-500 font-bold">Verified PYQs: {exam.currentPyqCount}</span>
                      </div>

                      <div className="w-20 bg-slate-850 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-500 h-full" style={{ width: `${exam.coveragePercentage}%` }} />
                      </div>

                      <span className="text-xs font-extrabold text-slate-300 w-8 text-right">{exam.coveragePercentage}%</span>

                      {isExamExpanded ? <FiChevronDown className="text-slate-450" /> : <FiChevronRight className="text-slate-450" />}
                    </div>
                  </div>

                  {/* Phases Container */}
                  {isExamExpanded && (
                    <div className="p-4 space-y-4 bg-dark-950/10">
                      {exam.phases.map(phase => {
                        const isPhaseExpanded = expandedPhases[phase._id];
                        return (
                          <div key={phase._id} className="border border-slate-850 rounded-xl overflow-hidden bg-dark-950/20">
                            
                            {/* Phase Row */}
                            <div
                              onClick={() => togglePhase(phase._id)}
                              className="p-4 flex items-center justify-between cursor-pointer border-b border-slate-850/40 hover:bg-dark-900/10 transition-colors flex-wrap gap-4"
                            >
                              <div className="flex items-center gap-2.5">
                                <FiFolder className="text-brand-400/80 shrink-0" />
                                <h3 className="text-xs font-black text-slate-200">{phase.title}</h3>
                              </div>

                              <div className="flex items-center gap-4">
                                <span className="text-[11px] font-bold text-slate-400">{phase.currentCount} / {phase.targetCount} Qs ({phase.coveragePercentage}%)</span>
                                {isPhaseExpanded ? <FiChevronDown className="text-slate-500" /> : <FiChevronRight className="text-slate-500" />}
                              </div>
                            </div>

                            {/* Subjects Container */}
                            {isPhaseExpanded && (
                              <div className="p-3 space-y-3 bg-dark-950/30">
                                {phase.subjects.map(subject => {
                                  const isSubjectExpanded = expandedSubjects[subject._id];
                                  return (
                                    <div key={subject._id} className="border border-slate-855 rounded-lg overflow-hidden bg-dark-950/40">
                                      
                                      {/* Subject Row */}
                                      <div
                                        onClick={() => toggleSubject(subject._id)}
                                        className="p-3 flex items-center justify-between cursor-pointer border-b border-slate-855/65 hover:bg-dark-900/10 transition-colors flex-wrap gap-4"
                                      >
                                        <div className="flex items-center gap-2">
                                          <FiFileText className="text-indigo-400 shrink-0" />
                                          <h4 className="text-[11px] font-bold text-slate-350">{subject.title}</h4>
                                        </div>

                                        <div className="flex items-center gap-3">
                                          <span className="text-[10px] font-semibold text-slate-400">{subject.currentCount} / {subject.targetCount} Qs</span>
                                          {isSubjectExpanded ? <FiChevronDown className="text-slate-500" /> : <FiChevronRight className="text-slate-500" />}
                                        </div>
                                      </div>

                                      {/* Topics list */}
                                      {isSubjectExpanded && (
                                        <div className="divide-y divide-slate-855">
                                          {subject.topics.map(topic => {
                                            const isTopicExpanded = expandedTopics[topic._id];
                                            return (
                                              <div key={topic._id} className="p-3.5 space-y-3.5 bg-dark-900/15">
                                                
                                                {/* Topic Summary */}
                                                <div className="flex justify-between items-start gap-4 flex-wrap">
                                                  <div className="space-y-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                      <span className="text-[11px] font-extrabold text-white">{topic.title}</span>
                                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                                                        topic.estimatedWeightage === 'high'
                                                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                          : topic.estimatedWeightage === 'medium'
                                                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                                      }`}>
                                                        Weightage: {topic.estimatedWeightage}
                                                      </span>

                                                      {topic.missingWarning && (
                                                        <span className="bg-rose-600 text-white border border-rose-700 text-[8px] font-black uppercase px-2 py-0.5 rounded animate-pulse flex items-center gap-0.5">
                                                          <FiAlertTriangle /> Missing Questions
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-3">
                                                    <div className="flex flex-col text-right text-[10px] font-bold text-slate-500">
                                                      <span>Quota: {topic.currentCount} / {topic.targetCount} Qs ({topic.coveragePercentage}%)</span>
                                                      <span>PYQs: {topic.currentPyqCount}</span>
                                                    </div>

                                                    {topic.subtopics?.length > 0 && (
                                                      <button
                                                        onClick={() => toggleTopic(topic._id)}
                                                        className="text-slate-500 hover:text-slate-300 p-1 border border-slate-850 rounded"
                                                      >
                                                        {isTopicExpanded ? <FiChevronDown /> : <FiChevronRight />}
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Subtopics detail list */}
                                                {isTopicExpanded && topic.subtopics?.length > 0 && (
                                                  <div className="pl-4 border-l border-slate-800 space-y-2">
                                                    <span className="text-[9px] font-bold text-slate-550 uppercase block">Subtopic breakdown metrics</span>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                      {topic.subtopics.map(st => (
                                                        <div key={st._id} className="bg-dark-950/40 border border-slate-855 rounded-xl p-3 flex justify-between items-center text-[10px] font-bold text-slate-400">
                                                          <div className="space-y-0.5">
                                                            <span className="text-slate-300 font-extrabold">{st.title}</span>
                                                            <div className="flex gap-1.5 text-[8px] text-slate-500">
                                                              <span>Current: {st.currentCount} Qs</span>
                                                              <span>•</span>
                                                              <span>PYQs: {st.currentPyqCount}</span>
                                                            </div>
                                                          </div>

                                                          <div className="flex items-center gap-2">
                                                            <span className={st.missingWarning ? 'text-rose-450 font-black' : 'text-slate-450'}>
                                                              {st.coveragePercentage}%
                                                            </span>
                                                            
                                                            {st.missingWarning && (
                                                              <FiAlertTriangle className="text-rose-500 animate-pulse text-xs shrink-0" />
                                                            )}
                                                          </div>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  </div>
                                                )}

                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                    </div>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
