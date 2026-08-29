import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiFileText, FiBook, FiPlus, FiFilter, FiRefreshCw,
  FiCheckCircle, FiAlertCircle, FiArchive, FiTrash2,
  FiCopy, FiBarChart2, FiGlobe, FiCalendar, FiSearch, FiClock
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import examAPI from '../../api/examApi.js';
import AdminSidebar from './AdminSidebar.jsx';

const STATUS_BADGE = {
  draft:          'bg-slate-500/10 text-slate-400 border-slate-500/20',
  pending_review: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  approved:       'bg-blue-500/10 text-blue-400 border-blue-500/20',
  published:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  archived:       'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

const CATEGORY_LABELS = {
  national: 'National', international: 'International', economy: 'Economy',
  environment: 'Environment', science_technology: 'Sci & Tech', government_schemes: 'Schemes',
  awards: 'Awards', sports: 'Sports', reports_indexes: 'Reports', state_special: 'State Special',
  art_culture: 'Art & Culture', defence: 'Defence', important_days: 'Days',
  judiciary: 'Judiciary', social_issues: 'Social Issues', miscellaneous: 'Miscellaneous'
};

const SOURCE_CAT_LABELS = {
  government: 'Govt Portal', official_report: 'Official Report', international_organization: 'Int Org',
  press_release: 'Press Release', newspaper: 'Newspaper', original_summary: 'Original Summary', other: 'Other'
};

export default function CurrentAffairsManagement() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sources');
  const [loading, setLoading] = useState(true);

  // States
  const [sources, setSources] = useState([]);
  const [packs, setPacks] = useState([]);
  const [exams, setExams] = useState([]);

  // Source Filters
  const [srcMonth, setSrcMonth] = useState('');
  const [srcYear, setSrcYear] = useState('');
  const [srcCat, setSrcCat] = useState('');
  const [srcReliability, setSrcReliability] = useState('');
  const [srcStatus, setSrcStatus] = useState('');
  const [srcLang, setSrcLang] = useState('');
  const [srcSearch, setSrcSearch] = useState('');

  // Pack Filters
  const [packMonth, setPackMonth] = useState('');
  const [packYear, setPackYear] = useState('');
  const [packExam, setPackExam] = useState('');
  const [packCat, setPackCat] = useState('');
  const [packLang, setPackLang] = useState('');
  const [packStatus, setPackStatus] = useState('');

  useEffect(() => {
    loadExams();
    if (activeTab === 'sources') {
      loadSources();
    } else {
      loadPacks();
    }
  }, [activeTab]);

  const loadExams = async () => {
    try {
      const { data } = await examAPI.getExams();
      setExams(data.exams || data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSources = async () => {
    setLoading(true);
    try {
      const params = {};
      if (srcMonth) params.month = srcMonth;
      if (srcYear) params.year = srcYear;
      if (srcCat) params.sourceCategory = srcCat;
      if (srcReliability) params.reliabilityLevel = srcReliability;
      if (srcStatus) params.status = srcStatus;
      if (srcLang) params.language = srcLang;
      if (srcSearch) params.search = srcSearch;

      const { data } = await currentAffairsAPI.adminGetSources(params);
      setSources(data || []);
    } catch (err) {
      toast.error('Failed to load current affairs sources.');
    } finally {
      setLoading(false);
    }
  };

  const loadPacks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (packMonth) params.month = packMonth;
      if (packYear) params.year = packYear;
      if (packExam) params.examId = packExam;
      if (packCat) params.category = packCat;
      if (packLang) params.language = packLang;
      if (packStatus) params.status = packStatus;

      const { data } = await currentAffairsAPI.adminGetPacks(params);
      setPacks(data || []);
    } catch (err) {
      toast.error('Failed to load current affairs packs.');
    } finally {
      setLoading(false);
    }
  };

  // Actions Source
  const handleVerifySource = async (id) => {
    try {
      await currentAffairsAPI.adminVerifySource(id);
      toast.success('Source verified successfully!');
      loadSources();
    } catch (err) {
      toast.error('Verification failed.');
    }
  };

  const handleArchiveSource = async (id) => {
    if (!window.confirm('Archive this source?')) return;
    try {
      await currentAffairsAPI.adminArchiveSource(id);
      toast.success('Source archived.');
      loadSources();
    } catch (err) {
      toast.error('Archive failed.');
    }
  };

  // Actions Pack
  const handleValidatePack = async (id) => {
    try {
      const { data } = await currentAffairsAPI.adminValidatePack(id);
      if (data.canPublish) {
        toast.success(`Pack validation passed! Ready to publish.`);
      } else {
        toast.error(`Pack has ${data.errors?.length} validation issues.`);
      }
    } catch (err) {
      toast.error('Validation request failed.');
    }
  };

  const handlePublishPack = async (id) => {
    try {
      const { data } = await currentAffairsAPI.adminPublishPack(id);
      toast.success('Pack published successfully!');
      loadPacks();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Publish failed.');
    }
  };

  const handleArchivePack = async (id) => {
    if (!window.confirm('Archive this pack? Aspirants can no longer start practice.')) return;
    try {
      await currentAffairsAPI.adminArchivePack(id);
      toast.success('Pack archived.');
      loadPacks();
    } catch (err) {
      toast.error('Archive failed.');
    }
  };

  const handleDuplicatePack = async (id) => {
    try {
      await currentAffairsAPI.adminDuplicatePack(id);
      toast.success('Pack copied as a draft!');
      loadPacks();
    } catch (err) {
      toast.error('Duplication failed.');
    }
  };

  const handleDeletePack = async (id) => {
    if (!window.confirm('Delete this pack? If it has practice history, it will be archived instead.')) return;
    try {
      const { data } = await currentAffairsAPI.adminDeletePack(id);
      toast.success(data.archived ? 'Pack archived (has attempt history).' : 'Pack deleted.');
      loadPacks();
    } catch (err) {
      toast.error('Delete failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiFileText className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">Admin Mod</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Current Affairs Management</h1>
            <p className="text-slate-500 text-sm mt-0.5">Moderators can manage verified current affairs sources and monthly practice packs.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/admin/current-affairs/sources/create"
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
            >
              <FiPlus /> Add Source
            </Link>
            <Link
              to="/admin/current-affairs/packs/create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20"
            >
              <FiPlus /> Create Pack
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="Current Affairs" />

          {/* Main Panel */}
          <div className="flex-1 space-y-6">

            {/* Tabs */}
            <div className="border-b border-slate-800 flex gap-2">
              <button
                onClick={() => { setActiveTab('sources'); }}
                className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'sources' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Sources
              </button>
              <button
                onClick={() => { setActiveTab('packs'); }}
                className={`pb-2.5 px-4 text-sm font-bold border-b-2 transition-all ${activeTab === 'packs' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                Monthly Packs
              </button>
            </div>

            {/* TAB: SOURCES */}
            {activeTab === 'sources' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FiFilter /> Filters
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    <select
                      value={srcMonth}
                      onChange={e => setSrcMonth(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Year"
                      value={srcYear}
                      onChange={e => setSrcYear(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    />
                    <select
                      value={srcCat}
                      onChange={e => setSrcCat(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Categories</option>
                      {Object.entries(SOURCE_CAT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <select
                      value={srcReliability}
                      onChange={e => setSrcReliability(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Reliability</option>
                      <option value="official">Official</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                    <select
                      value={srcStatus}
                      onChange={e => setSrcStatus(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
                      <input
                        type="text"
                        placeholder="Search sources by title or publisher…"
                        value={srcSearch}
                        onChange={e => setSrcSearch(e.target.value)}
                        className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg pl-8 pr-3 py-2"
                      />
                    </div>
                    <button
                      onClick={loadSources}
                      className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <FiRefreshCw /> Apply
                    </button>
                  </div>
                </div>

                {/* Sources Table */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : sources.length === 0 ? (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                    No sources found. Add your first current affairs source above.
                  </div>
                ) : (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <th className="px-4 py-3">Source Title</th>
                            <th className="px-4 py-3">Publisher</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Reliability</th>
                            <th className="px-4 py-3">Verified</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60 text-slate-300">
                          {sources.map(src => (
                            <tr key={src._id} className="hover:bg-dark-800/40 transition-colors text-xs">
                              <td className="px-4 py-3">
                                <p className="font-semibold text-white truncate max-w-[200px]">{src.title}</p>
                                {src.publicationDate && (
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {new Date(src.publicationDate).toLocaleDateString()}
                                  </p>
                                )}
                              </td>
                              <td className="px-4 py-3">{src.publisherName}</td>
                              <td className="px-4 py-3 capitalize">{SOURCE_CAT_LABELS[src.sourceCategory] || src.sourceCategory}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded font-bold capitalize ${
                                  src.reliabilityLevel === 'official' ? 'bg-emerald-500/10 text-emerald-400' :
                                  src.reliabilityLevel === 'high' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  {src.reliabilityLevel}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {src.isVerified ? (
                                  <span className="text-emerald-400 flex items-center gap-1"><FiCheckCircle /> Yes</span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1"><FiAlertCircle /> No</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_BADGE[src.status] || STATUS_BADGE.draft}`}>
                                  {src.status}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <Link
                                    to={`/admin/current-affairs/sources/${src._id}/edit`}
                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                                    title="Edit"
                                  >
                                    Edit
                                  </Link>
                                  {!src.isVerified && src.status !== 'archived' && (
                                    <button
                                      onClick={() => handleVerifySource(src._id)}
                                      className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded"
                                      title="Verify"
                                    >
                                      Verify
                                    </button>
                                  )}
                                  {src.status !== 'archived' && (
                                    <button
                                      onClick={() => handleArchiveSource(src._id)}
                                      className="p-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 rounded"
                                      title="Archive"
                                    >
                                      Archive
                                    </button>
                                  )}
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
            )}

            {/* TAB: MONTHLY PACKS */}
            {activeTab === 'packs' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <FiFilter /> Filters
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                    <select
                      value={packMonth}
                      onChange={e => setPackMonth(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Months</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Year"
                      value={packYear}
                      onChange={e => setPackYear(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    />
                    <select
                      value={packExam}
                      onChange={e => setPackExam(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Exams</option>
                      {exams.map(e => (
                        <option key={e._id} value={e._id}>{e.title}</option>
                      ))}
                    </select>
                    <select
                      value={packCat}
                      onChange={e => setPackCat(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Categories</option>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <select
                      value={packLang}
                      onChange={e => setPackLang(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Languages</option>
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="bilingual">Bilingual</option>
                    </select>
                    <select
                      value={packStatus}
                      onChange={e => setPackStatus(e.target.value)}
                      className="bg-dark-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2"
                    >
                      <option value="">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="pending_review">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={loadPacks}
                      className="flex items-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-lg transition-all"
                    >
                      <FiRefreshCw /> Apply Filters
                    </button>
                  </div>
                </div>

                {/* Packs Grid */}
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : packs.length === 0 ? (
                  <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                    No packs found. Create your first Monthly Current Affairs Pack.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packs.map(pack => (
                      <div key={pack._id} className="bg-dark-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between gap-4 transition-all">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                              {new Date(0, pack.month - 1).toLocaleString('en', { month: 'long' })} {pack.year}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${STATUS_BADGE[pack.status] || STATUS_BADGE.draft}`}>
                              {pack.status}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-white mt-1.5">{pack.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1">{pack.description || 'No description provided.'}</p>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {pack.examIds?.map(ex => (
                              <span key={ex._id} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded">
                                {ex.title}
                              </span>
                            ))}
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded">
                              {pack.questionIds?.length || 0} Questions
                            </span>
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded capitalize">
                              {pack.language}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 pt-3 gap-2">
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/admin/current-affairs/packs/${pack._id}/edit`}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => handleValidatePack(pack._id)}
                              className="p-1.5 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-semibold rounded"
                            >
                              Validate
                            </button>
                            {pack.status !== 'published' && pack.status !== 'archived' && (
                              <button
                                onClick={() => handlePublishPack(pack._id)}
                                className="p-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 text-xs font-semibold rounded"
                              >
                                Publish
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Link
                              to={`/admin/current-affairs/packs/${pack._id}/analytics`}
                              className="p-1.5 text-slate-400 hover:text-white"
                              title="Analytics"
                            >
                              <FiBarChart2 />
                            </Link>
                            <button
                              onClick={() => handleDuplicatePack(pack._id)}
                              className="p-1.5 text-slate-400 hover:text-white"
                              title="Duplicate"
                            >
                              <FiCopy />
                            </button>
                            {pack.status !== 'archived' && (
                              <button
                                onClick={() => handleArchivePack(pack._id)}
                                className="p-1.5 text-slate-400 hover:text-white"
                                title="Archive"
                              >
                                <FiArchive />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePack(pack._id)}
                              className="p-1.5 text-rose-500 hover:text-rose-400"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
