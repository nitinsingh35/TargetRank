import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  FiPlus, FiEdit2, FiTrash2, FiBookOpen, FiSettings, FiX, FiSave
} from 'react-icons/fi';
import { examAPI } from '../../api/api.js';
import LoadingSpinner from '../../components/exams/LoadingSpinner.jsx';
import EmptyState from '../../components/exams/EmptyState.jsx';
import toast from 'react-hot-toast';

function ExamModal({ exam, onClose, onSave }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: exam || {
      title: '', shortDescription: '', fullDescription: '', conductingBody: '',
      eligibility: '', examPattern: '', active: true,
    },
  });

  const onSubmit = async (data) => {
    try {
      if (exam) {
        await examAPI.updateExam(exam._id, data);
        toast.success('Exam updated successfully');
      } else {
        await examAPI.createExam(data);
        toast.success('Exam created successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="font-bold text-white">{exam ? 'Edit Exam' : 'Create New Exam'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><FiX /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Title *</label>
            <input {...register('title', { required: 'Title is required' })}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Short Description</label>
            <textarea {...register('shortDescription')} rows={2}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Conducting Body</label>
            <input {...register('conductingBody')}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Eligibility</label>
            <textarea {...register('eligibility')} rows={2}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Exam Pattern</label>
            <textarea {...register('examPattern')} rows={2}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Full Description</label>
            <textarea {...register('fullDescription')} rows={3}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...register('active')} className="rounded" /> Active
          </label>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5 text-sm">Cancel</button>
            <button type="submit" className="btn-primary flex-1 py-2.5 text-sm"><FiSave /> Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExamManagement() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const { data } = await examAPI.getExams({ active: 'all' });
      setExams(data.exams);
    } catch (err) {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}" and all its syllabus data? This cannot be undone.`)) return;
    try {
      await examAPI.deleteExam(id);
      toast.success('Exam deleted');
      fetchExams();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiSettings className="text-rose-400" />
              <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Admin Panel</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Exam Management</h1>
            <p className="text-slate-500 text-sm mt-1">Create, edit, and manage competitive exams and their syllabus.</p>
          </div>
          <button onClick={() => setModal('create')} className="btn-primary py-2.5 px-5 text-sm self-start">
            <FiPlus /> Add Exam
          </button>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading exams..." />
        ) : exams.length === 0 ? (
          <EmptyState
            icon={FiBookOpen}
            title="No exams yet"
            description="Create your first exam or run the seed script."
            action={<button onClick={() => setModal('create')} className="btn-primary text-sm py-2 px-4"><FiPlus /> Add Exam</button>}
          />
        ) : (
          <div className="bg-dark-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-6 py-4">Exam</th>
                    <th className="text-left px-4 py-4 hidden sm:table-cell">Conducting Body</th>
                    <th className="text-center px-4 py-4">Phases</th>
                    <th className="text-center px-4 py-4">Subjects</th>
                    <th className="text-center px-4 py-4">Topics</th>
                    <th className="text-center px-4 py-4">Status</th>
                    <th className="text-right px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {exams.map((exam) => (
                    <tr key={exam._id} className="hover:bg-dark-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-white">{exam.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{exam.shortDescription}</p>
                      </td>
                      <td className="px-4 py-4 text-slate-400 hidden sm:table-cell">{exam.conductingBody}</td>
                      <td className="px-4 py-4 text-center text-brand-400 font-semibold">{exam.phaseCount}</td>
                      <td className="px-4 py-4 text-center text-accent-400 font-semibold">{exam.subjectCount}</td>
                      <td className="px-4 py-4 text-center text-emerald-400 font-semibold">{exam.topicCount}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${exam.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {exam.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/admin/exams/${exam._id}/syllabus`}
                            className="p-2 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-colors" title="Manage Syllabus">
                            <FiBookOpen />
                          </Link>
                          <button onClick={() => setModal(exam)}
                            className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10 transition-colors" title="Edit">
                            <FiEdit2 />
                          </button>
                          <button onClick={() => handleDelete(exam._id, exam.title)}
                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors" title="Delete">
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <ExamModal
          exam={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={fetchExams}
        />
      )}
    </div>
  );
}
