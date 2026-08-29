import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  FiUser, FiMail, FiLock, FiPhone,
  FiEye, FiEyeOff, FiUserPlus, FiAward, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

const EXAMS = ['UPSC', 'BPSC', 'UPPSC', 'SSC CGL', 'Banking', 'Railway', 'Defence', 'State PCS'];
const ROLES = [
  { value: 'aspirant', label: 'Aspirant', desc: 'I am preparing for exams' },
  { value: 'mentor',   label: 'Mentor',   desc: 'I guide and teach students' },
  { value: 'admin',    label: 'Admin',    desc: 'Platform administrator' },
];

export default function Register() {
  const { register: authRegister } = useAuth();
  const [showPw, setShowPw]           = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [selectedExams, setSelectedExams] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'aspirant' } });

  const toggleExam = (exam) => {
    setSelectedExams((prev) =>
      prev.includes(exam) ? prev.filter((e) => e !== exam) : [...prev, exam]
    );
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authRegister({ ...data, selectedExams });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-brand-500/8 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-80 h-80 bg-accent-500/8 rounded-full blur-[100px]" />

      <div className="w-full max-w-lg relative">
        <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">

          {/* Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center mb-3 shadow-lg shadow-brand-500/25">
              <FiAward className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Create your account</h1>
            <p className="text-sm text-slate-500 mt-1">Join 50,000+ aspirants on TargetRank</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>

            {/* Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="reg-name" type="text" placeholder="Rahul Sharma" autoComplete="name"
                  className={`w-full bg-dark-800/80 border ${errors.name ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'At least 2 characters' } })}
                />
              </div>
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="reg-email" type="email" placeholder="you@example.com" autoComplete="email"
                  className={`w-full bg-dark-800/80 border ${errors.email ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Phone <span className="text-slate-600 normal-case">(optional)</span></label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="reg-phone" type="tel" placeholder="+91 98765 43210" autoComplete="tel"
                  className="w-full bg-dark-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all"
                  {...register('phone')}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="reg-password" type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" autoComplete="new-password"
                  className={`w-full bg-dark-800/80 border ${errors.password ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-11 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Role selector */}
            <div>
              <label htmlFor="reg-role" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">I am a...</label>
              <div className="relative">
                <FiChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <select id="reg-role"
                  className="w-full appearance-none bg-dark-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-brand-500 transition-all"
                  {...register('role')}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value} className="bg-dark-900">{r.label} — {r.desc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Exams */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Target Exams <span className="text-slate-600 normal-case">(optional)</span></p>
              <div className="flex flex-wrap gap-2">
                {EXAMS.map((exam) => (
                  <button
                    type="button"
                    key={exam}
                    onClick={() => toggleExam(exam)}
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

            {/* Submit */}
            <button
              id="register-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20 active:scale-[0.99] mt-2"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><FiUserPlus className="text-lg" /> Create Account</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
