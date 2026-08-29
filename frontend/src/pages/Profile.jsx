import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiPhone, FiSave, FiLock,
  FiEye, FiEyeOff, FiEdit2, FiShield, FiCalendar
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

const EXAMS = ['UPSC', 'BPSC', 'UPPSC', 'SSC CGL', 'Banking', 'Railway', 'Defence', 'State PCS'];
const ROLE_COLORS = {
  admin:    'text-rose-400 bg-rose-500/10 border-rose-500/30',
  mentor:   'text-amber-400 bg-amber-500/10 border-amber-500/30',
  aspirant: 'text-brand-400 bg-brand-500/10 border-brand-500/30',
};

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [showPw, setShowPw]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedExams, setSelectedExams] = useState(user?.selectedExams || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name:  user?.name  || '',
      phone: user?.phone || '',
    },
  });

  const toggleExam = (exam) => {
    setSelectedExams((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = { ...data, selectedExams };
      if (!data.password) delete payload.password;
      await updateProfile(payload);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Update failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px]" />

      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 mb-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-xl shadow-brand-500/20 shrink-0">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-extrabold text-white truncate">{user?.name}</h1>
              <p className="text-slate-500 text-sm truncate">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[user?.role]}`}>
                  <FiShield className="inline mr-1 text-[11px]" />{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </span>
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <FiCalendar className="text-[11px]" />
                  Joined {new Date(user?.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
            <FiEdit2 className="text-slate-600 shrink-0" />
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8">
          <h2 className="text-lg font-bold text-white mb-6">Edit Profile</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="prof-name" type="text"
                    className={`w-full bg-dark-800/80 border ${errors.name ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                    {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })}
                  />
                </div>
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="prof-phone" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="prof-phone" type="tel"
                    className="w-full bg-dark-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all"
                    {...register('phone')}
                  />
                </div>
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="email" value={user?.email || ''} readOnly
                  className="w-full bg-dark-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">Email cannot be changed.</p>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="prof-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">New Password <span className="text-slate-600 normal-case">(leave blank to keep current)</span></label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="prof-password" type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  className={`w-full bg-dark-800/80 border ${errors.password ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-11 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('password', {
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Selected Exams */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Target Exams</p>
              <div className="flex flex-wrap gap-2">
                {EXAMS.map((exam) => (
                  <button type="button" key={exam} onClick={() => toggleExam(exam)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                      selectedExams.includes(exam)
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'bg-dark-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {exam}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="profile-save-btn"
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 disabled:opacity-60 text-white font-semibold px-8 py-3 rounded-xl transition-all active:scale-[0.99] shadow-lg shadow-brand-500/20"
            >
              {submitting
                ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><FiSave /> Save Changes</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
