import React, { useState, useEffect } from 'react';
import { FiTrash2, FiClock, FiSettings, FiCheckSquare, FiAlertCircle, FiPower } from 'react-icons/fi';
import toast from 'react-hot-toast';
import testAPI from '../../api/testApi.js';

export default function AdminMockTests() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminTestsList = async () => {
    setLoading(true);
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

  useEffect(() => {
    fetchAdminTestsList();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test template and all student attempts associated with it? This action is permanent!')) {
      return;
    }

    try {
      await testAPI.deleteMockTest(id);
      toast.success('Mock test template deleted successfully.');
      fetchAdminTestsList();
    } catch (err) {
      toast.error('Failed to delete mock test.');
    }
  };

  const handleToggleActive = async (test) => {
    try {
      await testAPI.updateMockTest(test._id, { active: !test.active });
      toast.success(`Mock test status updated.`);
      fetchAdminTestsList();
    } catch (err) {
      toast.error('Failed to toggle active status.');
    }
  };

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
          <div className="flex items-center gap-2 mb-1">
            <FiSettings className="text-rose-400" />
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Admin mock test moderation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Mock Test Catalog Editor</h1>
          <p className="text-slate-500 text-xs mt-0.5">Toggle status of exam series or wipe out old practice attempt records.</p>
        </div>

        {/* Catalog List */}
        {tests.length === 0 ? (
          <div className="glass-card p-12 text-center border-slate-850">
            <FiAlertCircle className="text-3xl text-slate-650 mx-auto mb-4" />
            <p className="text-slate-500 text-xs">No active mock test series configured.</p>
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      test.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {test.active ? 'Active' : 'Deactivated'}
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

                {/* Operations panel */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(test)}
                    className={`p-2 rounded-lg border transition-all text-xs font-bold flex items-center gap-1 ${
                      test.active
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                  >
                    <FiPower /> {test.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(test._id)}
                    className="p-2 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-slate-500 hover:text-rose-400 transition-all"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
