import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiArrowLeft, FiSliders, FiPlayCircle, FiActivity, FiHelpCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';
import examAPI from '../../api/examApi.js';

export default function CustomPractice() {
  const navigate = useNavigate();
  
  // Streams
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);

  // Form selections
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState([]);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  
  const [generating, setGenerating] = useState(false);

  // Fetch initial exams list
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const { data } = await examAPI.getExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchExams();
  }, []);

  // Fetch subjects and topics on exam change
  useEffect(() => {
    if (!selectedExamId) {
      setSubjects([]);
      setTopics([]);
      setSelectedSubjectIds([]);
      setSelectedTopicIds([]);
      return;
    }

    const fetchSyllabus = async () => {
      try {
        const { data } = await examAPI.getExamSyllabus(selectedExamId);
        let allSubjects = [];
        let allTopics = [];
        data.syllabus.forEach(phase => {
          phase.subjects.forEach(sub => {
            allSubjects.push(sub);
            sub.topics.forEach(top => {
              allTopics.push(top);
            });
          });
        });
        setSubjects(allSubjects);
        setTopics(allTopics);
        setSelectedSubjectIds([]);
        setSelectedTopicIds([]);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSyllabus();
  }, [selectedExamId]);

  const handleToggleSubject = (subId) => {
    setSelectedSubjectIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const handleToggleTopic = (topId) => {
    setSelectedTopicIds(prev =>
      prev.includes(topId) ? prev.filter(id => id !== topId) : [...prev, topId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExamId) return toast.error('Please select an exam stream.');

    const payload = {
      examId: selectedExamId,
      subjectIds: selectedSubjectIds,
      topicIds: selectedTopicIds,
      questionCount: Number(questionCount) || 10,
      difficulty: difficulty || undefined,
      durationMinutes: Number(durationMinutes) || 20,
    };

    setGenerating(true);
    toast.loading('Assembling custom practice test...', { id: 'custom-gen-toast' });
    try {
      const genRes = await testAPI.generateCustomPractice(payload);
      const mockTestId = genRes.data.mockTestId;
      
      // Immediately start the test attempt!
      const startRes = await testAPI.startAttempt(mockTestId);
      toast.success('Practice test ready! Starting now...', { id: 'custom-gen-toast' });
      
      navigate(`/aspirant/mock-tests/${mockTestId}/attempt`, {
        state: {
          attemptId: startRes.data.attemptId,
          questions: startRes.data.questions,
          durationMinutes: startRes.data.durationMinutes,
          title: `Custom Practice Test (${new Date().toLocaleDateString('en-IN')})`
        }
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate practice test.';
      toast.error(msg, { id: 'custom-gen-toast' });
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        
        {/* Back Link */}
        <Link
          to="/aspirant/dashboard"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors animate-pulse-slow"
        >
          <FiArrowLeft /> Back to Dashboard
        </Link>

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FiSliders className="text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-widest">Custom Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Dynamic Practice Generator</h1>
          <p className="text-slate-500 text-xs mt-0.5">Customize subject filters, select difficulty ranges, and generate unique mock sets.</p>
        </div>

        {/* Generator Form Card */}
        <div className="glass-card p-8 bg-dark-900 border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Exam and Configuration Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Exam Stream */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Exam Stream</label>
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

              {/* Difficulty range */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Target Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="">All Difficulties</option>
                  <option value="easy">Easy Only</option>
                  <option value="medium">Medium Only</option>
                  <option value="hard">Hard Only</option>
                </select>
              </div>
            </div>

            {/* Questions count and Timings row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Questions count */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Number of Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="20">20 Questions</option>
                  <option value="30">30 Questions</option>
                </select>
              </div>

              {/* Study timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Time Limit (Minutes)</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-300 text-xs focus:outline-none"
                >
                  <option value="10">10 Minutes</option>
                  <option value="20">20 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                </select>
              </div>
            </div>

            {/* Subject check list selectors */}
            {subjects.length > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide pb-1.5 border-b border-slate-850">Filter Subjects (Optional)</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => {
                    const isSelected = selectedSubjectIds.includes(sub._id);
                    return (
                      <button
                        type="button"
                        key={sub._id}
                        onClick={() => handleToggleSubject(sub._id)}
                        className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                            : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        {sub.title}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Submit */}
            <div className="pt-4 border-t border-slate-850 flex justify-end">
              <button
                type="submit"
                disabled={generating}
                className="btn-primary py-2.5 px-6 text-xs font-semibold flex items-center gap-2"
              >
                <FiPlayCircle className="text-sm shrink-0" />
                {generating ? 'Assembling Quiz...' : 'Assemble & Start Quiz'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
