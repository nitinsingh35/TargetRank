import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAward } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await login(data.email, data.password);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-[-15%] left-[-10%] w-96 h-96 bg-brand-500/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-15%] right-[-5%] w-80 h-80 bg-accent-500/10 rounded-full blur-[100px]" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-dark-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-8 shadow-2xl shadow-black/40">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center mb-3 shadow-lg shadow-brand-500/25">
              <FiAward className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-extrabold text-white">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to continue your preparation</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={`w-full bg-dark-800/80 border ${errors.email ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                  })}
                />
              </div>
              {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Password
                </label>
              </div>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-base" />
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full bg-dark-800/80 border ${errors.password ? 'border-rose-500' : 'border-slate-700'} rounded-xl pl-10 pr-11 py-3 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500 transition-all`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPw ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-brand-500/20 active:scale-[0.99] mt-2"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><FiLogIn className="text-lg" /> Sign In</>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold transition-colors">
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
