import React, { useState, useMemo } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiClock, FiBook, FiCpu, FiMinus } from 'react-icons/fi';

export default function SyllabusViewer({ syllabus }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhaseId, setSelectedPhaseId] = useState('all');
  const [selectedSubjectId, setSelectedSubjectId] = useState('all');

  // Accordion open/close states
  const [openPhases, setOpenPhases] = useState({});
  const [openSubjects, setOpenSubjects] = useState({});
  const [openTopics, setOpenTopics] = useState({});

  // Reset function
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedPhaseId('all');
    setSelectedSubjectId('all');
  };

  // Toggle helpers
  const togglePhase = (id) => {
    setOpenPhases((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubject = (id) => {
    setOpenSubjects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTopic = (id) => {
    setOpenTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Expand / Collapse All
  const handleExpandAll = (filteredTree) => {
    const newPhases = {};
    const newSubjects = {};
    const newTopics = {};
    
    filteredTree.forEach((phase) => {
      newPhases[phase._id] = true;
      phase.subjects.forEach((subject) => {
        newSubjects[subject._id] = true;
        subject.topics.forEach((topic) => {
          newTopics[topic._id] = true;
        });
      });
    });

    setOpenPhases(newPhases);
    setOpenSubjects(newSubjects);
    setOpenTopics(newTopics);
  };

  const handleCollapseAll = () => {
    setOpenPhases({});
    setOpenSubjects({});
    setOpenTopics({});
  };

  // Compute phases and subjects available for filters
  const filterOptions = useMemo(() => {
    const phases = syllabus.map(p => ({ id: p._id, title: p.title }));
    
    let subjects = [];
    syllabus.forEach(p => {
      if (selectedPhaseId === 'all' || p._id === selectedPhaseId) {
        p.subjects.forEach(s => {
          subjects.push({ id: s._id, title: s.title, phaseId: p._id });
        });
      }
    });

    return { phases, subjects };
  }, [syllabus, selectedPhaseId]);

  // Main filter logic
  const filteredSyllabus = useMemo(() => {
    const cleanSearch = searchTerm.toLowerCase().trim();

    return syllabus
      .map((phase) => {
        // Filter by Phase Select
        if (selectedPhaseId !== 'all' && phase._id !== selectedPhaseId) {
          return null;
        }

        const filteredSubjects = phase.subjects
          .map((subject) => {
            // Filter by Subject Select
            if (selectedSubjectId !== 'all' && subject._id !== selectedSubjectId) {
              return null;
            }

            const filteredTopics = subject.topics.filter((topic) => {
              const matchesTitle = topic.title.toLowerCase().includes(cleanSearch);
              const matchesDesc = topic.description?.toLowerCase().includes(cleanSearch);
              const matchesSubtopics = topic.subtopics.some(sub => sub.toLowerCase().includes(cleanSearch));
              return matchesTitle || matchesDesc || matchesSubtopics;
            });

            if (filteredTopics.length === 0 && cleanSearch !== '') {
              return null;
            }

            return {
              ...subject,
              topics: filteredTopics,
            };
          })
          .filter(Boolean);

        if (filteredSubjects.length === 0 && (selectedSubjectId !== 'all' || cleanSearch !== '')) {
          return null;
        }

        return {
          ...phase,
          subjects: filteredSubjects,
        };
      })
      .filter(Boolean);
  }, [syllabus, searchTerm, selectedPhaseId, selectedSubjectId]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <div className="glass-card p-6 bg-dark-900/40 border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
            <input
              type="text"
              placeholder="Search topic or subtopic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          {/* Phase Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedPhaseId}
              onChange={(e) => {
                setSelectedPhaseId(e.target.value);
                setSelectedSubjectId('all'); // reset subject filter on phase change
              }}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value="all">All Phases</option>
              {filterOptions.phases.map(p => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          {/* Subject Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full bg-dark-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-sm focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value="all">All Subjects</option>
              {filterOptions.subjects.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          <div className="md:col-span-1 text-right">
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-400 hover:text-brand-300 underline font-semibold transition-colors w-full text-center"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Tree Control actions */}
        <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-800/60 text-xs">
          <span className="text-slate-500">
            Showing <strong className="text-slate-300">{filteredSyllabus.length}</strong> matching phase(s)
          </span>
          <div className="flex gap-4">
            <button
              onClick={() => handleExpandAll(filteredSyllabus)}
              className="text-brand-400 hover:text-brand-300 font-semibold transition-all"
            >
              Expand All
            </button>
            <span className="text-slate-800">|</span>
            <button
              onClick={handleCollapseAll}
              className="text-slate-400 hover:text-slate-300 font-semibold transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      {/* Main Syllabus Tree Accordions */}
      <div className="space-y-4">
        {filteredSyllabus.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-800/80">
            <div className="w-12 h-12 rounded-full bg-dark-800/80 flex items-center justify-center mx-auto mb-4 text-slate-500">
              <FiBook className="text-xl" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">No matching topics found</h3>
            <p className="text-slate-500 max-w-sm mx-auto text-sm">
              We couldn't find any results matching "{searchTerm}". Try widening your filters or modifying the search terms.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 bg-dark-800 border border-slate-700 hover:bg-dark-700 rounded-lg text-xs font-semibold text-white transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredSyllabus.map((phase) => {
            const isPhaseOpen = !!openPhases[phase._id];
            return (
              <div
                key={phase._id}
                className="glass-card border-slate-800/80 overflow-hidden bg-dark-900/20"
              >
                {/* Phase Header */}
                <div
                  onClick={() => togglePhase(phase._id)}
                  className="flex justify-between items-center px-6 py-4.5 bg-dark-900/60 border-b border-slate-800/40 cursor-pointer hover:bg-dark-900/80 transition-all select-none"
                >
                  <div>
                    <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-500"></span>
                      {phase.title}
                    </h3>
                    {phase.description && (
                      <p className="text-slate-500 text-xs mt-0.5 ml-4.5">{phase.description}</p>
                    )}
                  </div>
                  <div>
                    {isPhaseOpen ? (
                      <FiChevronUp className="text-slate-400 text-lg" />
                    ) : (
                      <FiChevronDown className="text-slate-400 text-lg" />
                    )}
                  </div>
                </div>

                {/* Phase Content (Subjects) */}
                {isPhaseOpen && (
                  <div className="p-4 space-y-4 bg-[#030712]/40">
                    {phase.subjects.length === 0 ? (
                      <p className="text-xs text-slate-600 pl-4 py-2">No active subjects registered under this phase.</p>
                    ) : (
                      phase.subjects.map((subject) => {
                        const isSubjectOpen = !!openSubjects[subject._id];
                        return (
                          <div
                            key={subject._id}
                            className="border border-slate-850 rounded-xl bg-dark-950/40 overflow-hidden"
                          >
                            {/* Subject Header */}
                            <div
                              onClick={() => toggleSubject(subject._id)}
                              className="flex justify-between items-center px-5 py-3.5 bg-dark-900/40 border-b border-slate-900/60 cursor-pointer hover:bg-dark-900/60 transition-all select-none"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400">
                                  <FiBook className="text-sm" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-slate-200">{subject.title}</h4>
                                  {subject.description && (
                                    <p className="text-slate-600 text-[11px] mt-0.5">{subject.description}</p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {isSubjectOpen ? (
                                  <FiChevronUp className="text-slate-500 text-sm" />
                                ) : (
                                  <FiChevronDown className="text-slate-500 text-sm" />
                                )}
                              </div>
                            </div>

                            {/* Subject Content (Topics) */}
                            {isSubjectOpen && (
                              <div className="p-3 space-y-2 bg-dark-900/10">
                                {subject.topics.length === 0 ? (
                                  <p className="text-xs text-slate-600 pl-4 py-2">No active topics found matching search criteria.</p>
                                ) : (
                                  subject.topics.map((topic) => {
                                    const isTopicOpen = !!openTopics[topic._id];
                                    return (
                                      <div
                                        key={topic._id}
                                        className="border border-slate-900 rounded-lg bg-dark-950/20 overflow-hidden"
                                      >
                                        {/* Topic Header */}
                                        <div
                                          onClick={() => toggleTopic(topic._id)}
                                          className="flex justify-between items-center px-4 py-2.5 cursor-pointer hover:bg-dark-900/40 transition-all select-none"
                                        >
                                          <div className="flex items-center gap-2">
                                            <FiMinus className="text-slate-600 text-xs" />
                                            <span className="text-xs font-semibold text-slate-300">{topic.title}</span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            {topic.estimatedStudyHours > 0 && (
                                              <span className="text-[10px] bg-dark-800 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium">
                                                <FiClock className="text-[9px]" /> {topic.estimatedStudyHours} hrs
                                              </span>
                                            )}
                                            {isTopicOpen ? (
                                              <FiChevronUp className="text-slate-600 text-xs" />
                                            ) : (
                                              <FiChevronDown className="text-slate-600 text-xs" />
                                            )}
                                          </div>
                                        </div>

                                        {/* Topic Content (Subtopics) */}
                                        {isTopicOpen && (
                                          <div className="px-4 pb-3 pt-1 border-t border-slate-900 bg-[#030712]/30 space-y-2">
                                            {topic.description && (
                                              <p className="text-xs text-slate-500 italic mb-2 leading-relaxed">
                                                {topic.description}
                                              </p>
                                            )}
                                            {topic.subtopics && topic.subtopics.length > 0 ? (
                                              <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                  <FiCpu className="text-[9px]" /> Core Subtopics
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  {topic.subtopics.map((sub, sidx) => (
                                                    <div
                                                      key={sidx}
                                                      className="text-xs text-slate-400 bg-dark-900/40 border border-slate-850 px-2.5 py-1.5 rounded-lg flex items-center gap-2"
                                                    >
                                                      <span className="w-1 h-1 rounded-full bg-accent-400"></span>
                                                      <span>{sub}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            ) : (
                                              <p className="text-[10px] text-slate-600">No subtopics defined.</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
