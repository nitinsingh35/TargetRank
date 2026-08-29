import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiSave, FiCheckCircle, FiFileText,
  FiGlobe, FiClock, FiAlertCircle, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import currentAffairsAPI from '../../api/currentAffairsApi.js';
import AdminSidebar from './AdminSidebar.jsx';

export default function CurrentAffairsSourceEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const [form, setForm] = useState({
    title: '',
    publisherName: '',
    sourceUrl: '',
    publicationDate: new Date().toISOString().split('T')[0],
    sourceCategory: 'government',
    reliabilityLevel: 'official',
    summary: '',
    tags: '',
    language: 'english',
    status: 'draft',
    isVerified: false
  });

  useEffect(() => {
    if (isEditing) {
      loadSource();
    }
  }, [id]);

  const loadSource = async () => {
    setLoading(true);
    try {
      const { data } = await currentAffairsAPI.adminGetSource(id);
      setForm({
        title: data.title || '',
        publisherName: data.publisherName || '',
        sourceUrl: data.sourceUrl || '',
        publicationDate: data.publicationDate ? new Date(data.publicationDate).toISOString().split('T')[0] : '',
        sourceCategory: data.sourceCategory || 'government',
        reliabilityLevel: data.reliabilityLevel || 'official',
        summary: data.summary || '',
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
        language: data.language || 'english',
        status: data.status || 'draft',
        isVerified: data.isVerified || false
      });
    } catch (err) {
      toast.error('Failed to load source details.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleValidateForm = () => {
    const list = [];
    if (!form.title.trim()) list.push('Title is required.');
    if (!form.publisherName.trim()) list.push('Publisher Name is required.');
    if (form.sourceCategory !== 'original_summary' && !form.sourceUrl.trim()) {
      list.push('Source URL is required for referenced media/news articles.');
    }
    if (form.sourceCategory === 'original_summary' && !form.summary.trim()) {
      list.push('Admin-written Summary is required for original summaries.');
    }
    setErrors(list);
    return list.length === 0;
  };

  const handleSave = async (submitForReview = false) => {
    if (!handleValidateForm()) {
      toast.error('Please resolve validation errors first.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: submitForReview ? 'pending_review' : form.status
      };

      if (isEditing) {
        await currentAffairsAPI.adminUpdateSource(id, payload);
        toast.success(submitForReview ? 'Source submitted for review!' : 'Source saved as draft!');
      } else {
        await currentAffairsAPI.adminCreateSource(payload);
        toast.success(submitForReview ? 'Source created and submitted!' : 'Source draft created!');
      }
      navigate('/admin/current-affairs');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify = async () => {
    try {
      await currentAffairsAPI.adminVerifySource(id);
      toast.success('Source verified and approved!');
      navigate('/admin/current-affairs');
    } catch (err) {
      toast.error('Verification failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FiFileText className="text-amber-400" />
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                {isEditing ? 'Edit Source' : 'Create Source'}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">
              {isEditing ? 'Source Details' : 'New Current Affairs Source'}
            </h1>
          </div>
          <Link
            to="/admin/current-affairs"
            className="flex items-center gap-1.5 px-3 py-2 bg-dark-800 border border-slate-700 hover:bg-dark-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
          >
            <FiArrowLeft /> Back
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <AdminSidebar active="Current Affairs" />

          {/* Form Main */}
          <div className="flex-1 space-y-6">

            {errors.length > 0 && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-1">
                <p className="text-xs font-bold text-rose-400 flex items-center gap-1">
                  <FiAlertCircle /> Form Validation Issues:
                </p>
                <ul className="list-disc pl-5 text-[11px] text-rose-300 space-y-0.5">
                  {errors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <div className="bg-dark-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source Title *</label>
                  <input
                    value={form.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="e.g. Union Budget 2026-27 Summary"
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Publisher/Agency Name *</label>
                  <input
                    value={form.publisherName}
                    onChange={e => handleChange('publisherName', e.target.value)}
                    placeholder="e.g. Press Information Bureau (PIB)"
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Publication Date</label>
                  <input
                    type="date"
                    value={form.publicationDate}
                    onChange={e => handleChange('publicationDate', e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source Category *</label>
                  <select
                    value={form.sourceCategory}
                    onChange={e => handleChange('sourceCategory', e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  >
                    <option value="government">Government Portal</option>
                    <option value="official_report">Official Report</option>
                    <option value="international_organization">Int. Organization</option>
                    <option value="press_release">Press Release</option>
                    <option value="newspaper">Newspaper/Journal</option>
                    <option value="original_summary">Original Summary</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Reliability Level *</label>
                  <select
                    value={form.reliabilityLevel}
                    onChange={e => handleChange('reliabilityLevel', e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  >
                    <option value="official">Official (Highly Trusted)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Language *</label>
                  <select
                    value={form.language}
                    onChange={e => handleChange('language', e.target.value)}
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  >
                    <option value="english">English</option>
                    <option value="hindi">Hindi</option>
                    <option value="bilingual">Bilingual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Tags (comma separated)</label>
                  <input
                    value={form.tags}
                    onChange={e => handleChange('tags', e.target.value)}
                    placeholder="budget, economy, finance"
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source URL (not needed for original summaries)</label>
                  <div className="flex gap-2">
                    <input
                      value={form.sourceUrl}
                      onChange={e => handleChange('sourceUrl', e.target.value)}
                      placeholder="https://pib.gov.in/newsite/..."
                      className="flex-1 bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5"
                    />
                    {form.sourceUrl && (
                      <a href={form.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl">
                        <FiExternalLink />
                      </a>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Source Summary / Original Summary content</label>
                  <textarea
                    value={form.summary}
                    onChange={e => handleChange('summary', e.target.value)}
                    rows={6}
                    placeholder="Write a clear, non-copyrighted original summary of the news/report. Do not paste full paid articles."
                    className="w-full bg-dark-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions Panel */}
            <div className="flex justify-between items-center">
              <div>
                {isEditing && !form.isVerified && (
                  <button
                    onClick={handleVerify}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                  >
                    <FiCheckCircle /> Verify & Approve
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700"
                >
                  {saving ? 'Saving…' : 'Save Draft'}
                </button>
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Submit Review
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
