import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FiAward, FiPlay, FiChevronRight, FiActivity,
  FiTrendingUp, FiBookOpen, FiCompass, FiCpu,
  FiUsers, FiCheckCircle, FiShield, FiZap
} from 'react-icons/fi';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { examAPI } from '../api/api.js';

const performanceData = [
  { name: 'Week 1', Score: 60, Accuracy: 72 },
  { name: 'Week 2', Score: 68, Accuracy: 78 },
  { name: 'Week 3', Score: 72, Accuracy: 81 },
  { name: 'Week 4', Score: 85, Accuracy: 89 },
];

const examsListFallback = [
  { id: 'UPSC',     name: 'UPSC Civil Services', code: 'IAS/IFS',       tests: '180+ Full Tests', color: 'from-purple-500 to-indigo-500' },
  { id: 'BPSC',     name: 'BPSC State PCS',      code: 'Bihar PCS',     tests: '95+ Full Tests',  color: 'from-blue-500 to-cyan-500'     },
  { id: 'UPPSC',    name: 'UPPSC State PCS',      code: 'UP PCS',        tests: '110+ Full Tests', color: 'from-emerald-500 to-teal-500'  },
  { id: 'SSC CGL',  name: 'SSC CGL',              code: 'Staff Selection', tests: '250+ Tier I & II',color: 'from-amber-500 to-orange-500' },
  { id: 'Banking',  name: 'IBPS / SBI PO & Clerk',code: 'Banking Exams', tests: '320+ Mocks',      color: 'from-pink-500 to-rose-500'    },
  { id: 'Railway',  name: 'RRB NTPC & Group D',   code: 'Railways',      tests: '140+ Mocks',      color: 'from-indigo-500 to-blue-500'   },
  { id: 'Defence',  name: 'NDA / CDS / AFCAT',    code: 'Armed Forces',  tests: '120+ Tests',      color: 'from-red-500 to-orange-500'    },
  { id: 'State PCS',name: 'Other State PCS',       code: 'Various States',tests: '150+ Mocks',      color: 'from-teal-500 to-emerald-500'  },
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [selectedExam, setSelectedExam] = useState('UPSC');
  const [exams, setExams] = useState([]);

  useEffect(() => {
    examAPI.getExams().then(({ data }) => setExams(data?.exams || [])).catch(() => setExams([]));
  }, []);

  const displayExams = (exams && exams.length > 0)
    ? exams.map((e) => ({
        id: e._id,
        name: e.title,
        code: e.conductingBody?.split('(')[0]?.trim() || e.slug,
        tests: `${e.topicCount || 0} Topics · ${e.phaseCount || 0} Phases`,
        color: 'from-brand-500 to-indigo-500',
        slug: e.slug,
      }))
    : examsListFallback.map((e) => ({ ...e, slug: e.id.toLowerCase() }));

  const handleStartMock = (examName) => {
    toast.loading(`Initializing ${examName} Mock Test...`, { id: 'test-loader' });
    setTimeout(() => {
      toast.success(`${examName} Mock Test ready!`, { id: 'test-loader', icon: '🚀', duration: 4000 });
    }, 1500);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    if (!email) { toast.error('Please enter a valid email address'); return; }
    toast.success('Check your inbox for smart study planners!', { icon: '📬' });
    e.target.reset();
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-accent-500/10 rounded-full blur-[150px] pointer-events-none" />

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-semibold tracking-wide uppercase">
                <FiZap /> Smart Preparation Platform
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-none">TargetRank</h1>
              <p className="text-xl sm:text-2xl font-bold text-slate-300">Prepare Smart. Practice Better. Rank Higher.</p>
              <p className="text-slate-400 text-base max-w-xl mx-auto lg:mx-0">
                Unlock success in India's toughest government competitive examinations with curated practice, adaptive mocks, and real-time analytics.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                {isAuthenticated ? (
                  <Link to="/aspirant/dashboard" className="btn-primary w-full sm:w-auto">
                    <FiActivity /> Go to Dashboard
                  </Link>
                ) : (
                  <Link to="/register" className="btn-primary w-full sm:w-auto">
                    <FiPlay className="fill-current" /> Start Free Mock
                  </Link>
                )}
                <a href="#exams" className="btn-secondary w-full sm:w-auto">Browse Exams <FiChevronRight /></a>
              </div>
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-900 max-w-md mx-auto lg:mx-0">
                <div><div className="text-3xl font-extrabold text-white">50k+</div><div className="text-xs text-slate-500 uppercase font-semibold">Aspirants</div></div>
                <div><div className="text-3xl font-extrabold text-white">1,200+</div><div className="text-xs text-slate-500 uppercase font-semibold">Mock Exams</div></div>
                <div><div className="text-3xl font-extrabold text-white">99.2%</div><div className="text-xs text-slate-500 uppercase font-semibold">Accuracy</div></div>
              </div>
            </div>

            {/* Chart Card */}
            <div className="lg:col-span-5">
              <div className="glass-card p-6 border-slate-800/80 relative overflow-hidden">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                    <FiTrendingUp className="text-brand-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Student Progress</h3>
                    <p className="text-xs text-slate-500">Weekly analytics mockup</p>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="homeScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="homeAccuracy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="Score"    stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#homeScore)"    name="Avg Score (%)" />
                      <Area type="monotone" dataKey="Accuracy" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#homeAccuracy)" name="Accuracy (%)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Exams Grid */}
        <section id="exams" className="py-20 border-t border-slate-900 bg-dark-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Choose Your Target Exam</h2>
              <p className="mt-3 text-slate-400">Select your stream to get personalized mock tests and syllabus checklists.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {displayExams.map((exam) => (
                <Link
                  key={exam.id}
                  to={exams.length > 0 ? `/exams/${exam.id}` : '/exams'}
                  onClick={() => setSelectedExam(exam.id)}
                  className={`glass-card glass-card-hover p-6 cursor-pointer block ${selectedExam === exam.id ? 'border-brand-500 bg-brand-500/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">{exam.code}</span>
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${exam.color}`} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{exam.name}</h3>
                  <p className="text-sm text-slate-500">{exam.tests}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1">
                      View Syllabus <FiChevronRight className="text-[10px]" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link to="/exams" className="btn-primary inline-flex text-sm py-2.5 px-6">
                View All Exams <FiChevronRight />
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 border-t border-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5 space-y-6">
                <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Why TargetRank?</h2>
                <p className="text-slate-400">Standard syllabus tracking and precise performance logs under one unified system.</p>
                <div className="space-y-4">
                  {[
                    { icon: FiCpu,    color: 'text-brand-400 bg-brand-500/10 border-brand-500/20',   title: 'AI-Powered Question Bank', desc: 'Adaptive analytics suggest weak subjects and customize daily grids.' },
                    { icon: FiShield, color: 'text-accent-400 bg-accent-500/10 border-accent-500/20', title: 'Exam Pattern Fidelity',    desc: 'Practice templates match real exam UI and timer guidelines.' },
                    { icon: FiUsers,  color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', title: 'State Rank Estimator',     desc: 'Real-time percentile rank compared to peer groups.' },
                  ].map((f) => (
                    <div key={f.title} className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${f.color}`}><f.icon className="text-lg" /></div>
                      <div><h4 className="font-semibold text-white">{f.title}</h4><p className="text-sm text-slate-500">{f.desc}</p></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[
                  { icon: FiBookOpen, color: 'text-brand-400', title: 'Subject Coverage', desc: 'GS, Aptitude, Reasoning, Current Affairs & Core Electives.', checks: ['Syllabus micro-tracking', 'Daily current sheets'] },
                  { icon: FiCompass,  color: 'text-accent-400', title: 'Detailed Solutions', desc: 'Standard explanations, shortcuts, and reference links.', checks: ['Interactive query forum', 'Expert verified'] },
                ].map((c) => (
                  <div key={c.title} className="glass-card p-6 bg-gradient-to-b from-dark-900/80 to-dark-950/80">
                    <c.icon className={`text-3xl ${c.color} mb-4`} />
                    <h3 className="font-bold text-white mb-2">{c.title}</h3>
                    <p className="text-sm text-slate-500 mb-4">{c.desc}</p>
                    <ul className="text-xs text-slate-400 space-y-2">
                      {c.checks.map((ch) => <li key={ch} className="flex items-center gap-2"><FiCheckCircle className={c.color} />{ch}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-dark-950 to-brand-950/20 border-t border-slate-900">
          <div className="max-w-4xl mx-auto text-center px-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Get Smart Study Calendars</h2>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">Subscribe for exam schedules, syllabus changes, and targeted practice booklets.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input name="email" type="email" placeholder="Enter your email"
                className="bg-dark-900/90 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 flex-grow text-sm transition-all"
              />
              <button type="submit" className="btn-primary py-3 px-6 text-sm">Join Now</button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-[#02040a] py-10 border-t border-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center">
              <FiAward className="text-white text-sm" />
            </div>
            <span className="text-lg font-bold text-white">TargetRank</span>
          </div>
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} TargetRank. Prepare Smart. Practice Better. Rank Higher.</p>
        </div>
      </footer>
    </div>
  );
}
