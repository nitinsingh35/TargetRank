import React, { useState, useEffect } from 'react';
import { FiClock, FiCheckSquare, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';

export default function MentorMockTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentorTests = async () => {
      try {
        const { data } = await testAPI.getMockTests();
        setTests(data);
      } catch (err) {
        toast.error('Failed to load mock tests.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMentorTests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-white">Curriculum Mock Tests</h1>
          <p className="text-slate-500 text-xs mt-0.5">Reference active simulated exam templates running on TargetRank.</p>
        </div>

        {/* List */}
        {tests.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-850">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto mb-4" />
            <p className="text-slate-500 text-xs">No simulated mock tests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tests.map((test) => (
              <div
                key={test._id}
                className="glass-card p-6 bg-dark-900 border-slate-850 flex justify-between items-center gap-4 flex-wrap"
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                      {test.examId?.title || 'Competitive Exam'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-2.5">{test.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1"><FiClock /> {test.durationMinutes} Mins</span>
                    <span>·</span>
                    <span>{test.questions?.length || 0} Questions</span>
                    <span>·</span>
                    <span>{test.totalMarks} Marks</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
