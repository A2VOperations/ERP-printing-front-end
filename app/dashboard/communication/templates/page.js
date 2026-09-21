'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Mail,
  MessageSquare,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowLeft,
  Tag,
  Copy,
} from 'lucide-react';

const ALLOWED_VARS = [
  'customerName',
  'customerCompany',
  'customerPhone',
  'customerEmail',
  'quotationNumber',
  'orderNumber',
  'jobName',
  'deliveryAddress',
  'trackingUrl',
  'amount',
  'dueDate',
  'companyName',
  'agentName',
];

export default function CommunicationTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [category, setCategory] = useState('GENERAL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [providerTemplateName, setProviderTemplateName] = useState('');
  const [providerTemplateLanguage, setProviderTemplateLanguage] = useState('en_US');
  const [providerTemplateStatus, setProviderTemplateStatus] = useState('NOT_LINKED');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time Preview State
  const [previewValues, setPreviewValues] = useState({
    customerName: 'Rahul Verma',
    customerCompany: 'Apex Prints Ltd',
    quotationNumber: 'QT-2026-0042',
    orderNumber: 'ORD-2026-0189',
    amount: '₹ 15,400',
    jobName: 'Glossy Brochure Run',
    trackingUrl: 'https://a2v.com/track/TRK-9871',
    agentName: 'A2V Sales Desk',
  });

  useEffect(() => {
    fetchTemplates();
  }, [channelFilter]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'ALL') params.append('channel', channelFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/communication-templates?${params.toString()}`);
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setActiveTemplateId(null);
    setName('');
    setChannel('EMAIL');
    setCategory('GENERAL');
    setSubject('');
    setBody('');
    setStatus('ACTIVE');
    setProviderTemplateName('');
    setProviderTemplateLanguage('en_US');
    setProviderTemplateStatus('NOT_LINKED');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleOpenEdit = (tmpl) => {
    setIsEditing(true);
    setActiveTemplateId(tmpl._id);
    setName(tmpl.name);
    setChannel(tmpl.channel);
    setCategory(tmpl.category || 'GENERAL');
    setSubject(tmpl.subject || '');
    setBody(tmpl.body);
    setStatus(tmpl.status || 'ACTIVE');
    setProviderTemplateName(tmpl.providerTemplateName || '');
    setProviderTemplateLanguage(tmpl.providerTemplateLanguage || 'en_US');
    setProviderTemplateStatus(tmpl.providerTemplateStatus || 'NOT_LINKED');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleInsertVariable = (varName) => {
    const token = `{{${varName}}}`;
    setBody((prev) => `${prev} ${token} `);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name,
        channel,
        category,
        subject: channel === 'EMAIL' ? subject : undefined,
        body,
        status,
        ...(channel === 'WHATSAPP'
          ? {
              providerTemplateName: providerTemplateName || undefined,
              providerTemplateLanguage,
              providerTemplateStatus,
            }
          : {}),
      };

      if (isEditing) {
        await api.put(`/communication-templates/${activeTemplateId}`, payload);
      } else {
        await api.post('/communication-templates', payload);
      }

      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save template. Check variables syntax.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to deactivate this template?')) return;
    try {
      await api.delete(`/communication-templates/${id}`);
      fetchTemplates();
    } catch (err) {
      alert(err.message || 'Failed to delete template');
    }
  };

  // Render preview with mock values
  const renderPreview = (text) => {
    if (!text) return '';
    let rendered = text;
    Object.keys(previewValues).forEach((key) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      rendered = rendered.replace(regex, previewValues[key]);
    });
    return rendered;
  };

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        {/* Header */}
        <div className="h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/communication"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Back to Inbox"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Communication Templates</h1>
              <p className="text-[11px] text-slate-400">Standardized messages with authorized variable interpolation</p>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-[#0F172A]/60 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {['ALL', 'EMAIL', 'WHATSAPP', 'SMS'].map((ch) => (
              <button
                key={ch}
                onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  channelFilter === ch
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ch === 'ALL' ? 'All Channels' : ch}
              </button>
            ))}
          </div>

          <div className="relative w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTemplates()}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div className="p-16 text-center text-slate-500 space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <div className="text-sm font-bold text-slate-400">No templates found</div>
              <p className="text-xs max-w-sm mx-auto">
                Create standardized message templates to accelerate customer communications.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tmpl) => (
                <div
                  key={tmpl._id}
                  className="rounded-xl bg-slate-900 border border-slate-800 p-4 shadow-sm hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                          tmpl.channel === 'EMAIL'
                            ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                            : tmpl.channel === 'WHATSAPP'
                            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                            : 'text-violet-400 bg-violet-500/10 border border-violet-500/20'
                        }`}
                      >
                        {tmpl.channel}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">
                        {tmpl.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{tmpl.name}</h3>

                    {tmpl.channel === 'WHATSAPP' && (
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-slate-500 font-semibold">Meta Template:</span>
                        <span
                          className={`px-1.5 py-0.5 rounded font-extrabold uppercase ${
                            tmpl.providerTemplateStatus === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : tmpl.providerTemplateStatus === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-400'
                              : tmpl.providerTemplateStatus === 'REJECTED'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {tmpl.providerTemplateStatus || 'NOT_LINKED'}
                        </span>
                        {tmpl.providerTemplateName && (
                          <span className="text-slate-400 font-mono text-[10px] truncate max-w-[150px]">
                            ({tmpl.providerTemplateName})
                          </span>
                        )}
                      </div>
                    )}

                    {tmpl.subject && (
                      <div className="text-xs text-slate-400 font-medium">
                        <span className="text-slate-500 font-bold">Subject: </span>
                        {tmpl.subject}
                      </div>
                    )}

                    <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs text-slate-300 font-mono line-clamp-3 whitespace-pre-wrap">
                      {tmpl.body}
                    </div>

                    {tmpl.variables && tmpl.variables.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {tmpl.variables.map((v) => (
                          <span
                            key={v}
                            className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-800 text-blue-400"
                          >
                            {`{{${v}}}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-800/80">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        tmpl.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {tmpl.status}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(tmpl)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        title="Edit Template"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                {isEditing ? 'Edit Communication Template' : 'New Communication Template'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Template Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Quotation Ready for Client"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="GENERAL">General</option>
                    <option value="LEAD">Lead Follow-up</option>
                    <option value="QUOTATION">Quotation</option>
                    <option value="ORDER">Order Updates</option>
                    <option value="PRODUCTION">Production Updates</option>
                    <option value="DELIVERY">Delivery Updates</option>
                    <option value="PAYMENT">Payment Reminder</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive / Archived</option>
                  </select>
                </div>
              </div>

              {channel === 'EMAIL' && (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Your Print Quotation {{quotationNumber}} is Ready"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {channel === 'WHATSAPP' && (
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
                  <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Meta WhatsApp Business Template Settings
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Meta Template Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. quote_ready_v1"
                        value={providerTemplateName}
                        onChange={(e) => setProviderTemplateName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Language
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. en_US"
                        value={providerTemplateLanguage}
                        onChange={(e) => setProviderTemplateLanguage(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                        Approval Status
                      </label>
                      <select
                        value={providerTemplateStatus}
                        onChange={(e) => setProviderTemplateStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200"
                      >
                        <option value="NOT_LINKED">Not Linked</option>
                        <option value="PENDING">Pending Approval</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="PAUSED">Paused</option>
                        <option value="DISABLED">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Variable Quick-Insert Toolbar */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Message Body</span>
                  <span className="text-[11px] text-slate-500 font-normal">Click variable pill to insert</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-slate-950 border border-slate-800">
                  {ALLOWED_VARS.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInsertVariable(v)}
                      className="px-2 py-1 rounded text-[10px] font-semibold bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-300 transition"
                    >
                      {`+ {{${v}}}`}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={5}
                  required
                  placeholder="Dear {{customerName}}, thank you for reaching out..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Live Interpolation Preview
                </span>
                {channel === 'EMAIL' && subject && (
                  <div className="text-xs font-bold text-white">
                    Subject: {renderPreview(subject)}
                  </div>
                )}
                <div className="text-xs text-slate-300 whitespace-pre-wrap">
                  {renderPreview(body) || '(Start typing to preview interpolated content...)'}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Update Template' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
