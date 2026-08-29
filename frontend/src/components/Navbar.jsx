import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiAward, FiMenu, FiX, FiUser, FiLogOut, FiLogIn, FiUserPlus, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABELS = { admin: 'Admin', mentor: 'Mentor', aspirant: 'Aspirant' };
const ROLE_COLORS = {
  admin:    'text-rose-400 bg-rose-500/10 border-rose-500/20',
  mentor:   'text-amber-400 bg-amber-500/10 border-amber-500/20',
  aspirant: 'text-brand-400 bg-brand-500/10 border-brand-500/20',
};
const ROLE_DASHBOARDS = {
  admin:    '/admin/dashboard',
  mentor:   '/mentor/dashboard',
  aspirant: '/aspirant/dashboard',
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [dropOpen,    setDropOpen]    = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#030712]/80 backdrop-blur-xl border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4 py-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <FiAward className="text-white text-lg" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Target<span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-400">Rank</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={`transition-colors ${isActive('/') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Home</Link>
          <Link to="/exams" className={`transition-colors ${location.pathname.startsWith('/exams') ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Exams</Link>
          {isAuthenticated && (
            <Link
              to={ROLE_DASHBOARDS[user.role]}
              className={`transition-colors ${location.pathname.includes('dashboard') ? 'text-white' : 'text-slate-400 hover:text-white'}`}
            >
              Dashboard
            </Link>
          )}
        </nav>

        {/* Right: Auth Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setDropOpen(!dropOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl bg-dark-900/60 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
                <FiChevronDown className={`text-slate-400 text-sm transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 bg-dark-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-50"
                  onBlur={() => setDropOpen(false)}
                >
                  <Link
                    to="/profile"
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    <FiUser className="text-brand-400" /> My Profile
                  </Link>
                  <Link
                    to={ROLE_DASHBOARDS[user.role]}
                    onClick={() => setDropOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-dark-800 hover:text-white transition-colors"
                  >
                    <FiAward className="text-accent-400" /> Dashboard
                  </Link>
                  <div className="border-t border-slate-800 mx-3"></div>
                  <button
                    onClick={() => { setDropOpen(false); logout(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-all"
              >
                <FiLogIn className="text-base" /> Sign In
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 px-4 py-2 rounded-xl transition-all shadow-md shadow-brand-600/15 active:scale-95"
              >
                <FiUserPlus className="text-base" /> Get Started
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            {menuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-900 bg-[#030712]/95 backdrop-blur-xl px-4 py-4 space-y-2">
          <Link to="/" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Home</Link>
          <Link to="/exams" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Exams</Link>
          {isAuthenticated ? (
            <>
              <Link to={ROLE_DASHBOARDS[user.role]} onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Dashboard</Link>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Profile</Link>
              <button onClick={() => { setMenuOpen(false); logout(); }} className="w-full text-left py-2.5 px-3 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-medium">Sign Out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-slate-300 hover:text-white rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium">Sign In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block py-2.5 px-3 text-white bg-brand-600 hover:bg-brand-500 rounded-lg transition-colors text-sm font-medium">Get Started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
