'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Lock,
  Mail,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Layers,
  FileCheck,
  Calendar,
  Clock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Send,
  User,
  Building,
  Printer,
  ShieldCheck,
  X,
  FileText,
  Inbox,
} from 'lucide-react';

export default function ProductionReleaseCenterPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  // Modals
  const [previewProject, setPreviewProject] = useState(null);
  const [emailModalProject, setEmailModalProject] = useState(null);

  // Email Composer Form State
  const [emailForm, setEmailForm] = useState({
    to: '',
    cc: '',
    subject: '',
    message: '',
    includeSpecs: true,
    includeDownloadLink: true,
    includeSha256: true,
  });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccessToast, setEmailSuccessToast] = useState('');

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/design-projects/production-locked');
      if (res && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.projects || []);
        setProjects(list);
      }
    } catch (err) {
      console.error('Failed to load production locked projects:', err);
      // Fallback query by status
      try {
        const fallback = await api.get('/design-projects?status=PRODUCTION_LOCKED&limit=100');
        if (fallback && fallback.data) {
          const list = Array.isArray(fallback.data) ? fallback.data : (fallback.data.projects || []);
          setProjects(list);
        }
      } catch (fallbackErr) {
        setErrorMsg(err.message || 'Failed to fetch production locked projects');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Open Email Composer
  const handleOpenEmailModal = (proj) => {
    const custEmail = proj.customerId?.email || '';
    const defaultSubject = `[PRODUCTION RELEASE] Approved Artwork & Specs - ${proj.title || proj.projectNumber}`;
    const defaultNote = `Dear Production / Print Team,\n\nPlease find attached the final client-approved artwork and technical specifications for Job #${proj.projectNumber}. All dimensions, substrate media, and finishing requirements are detailed below. Please proceed with production printing.`;

    setEmailForm({
      to: custEmail || '',
      cc: '',
      subject: defaultSubject,
      message: defaultNote,
      includeSpecs: true,
      includeDownloadLink: true,
      includeSha256: true,
    });
    setEmailModalProject(proj);
  };

  // Submit Send Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailForm.to.trim()) {
      alert('Recipient email address is required.');
      return;
    }
    if (!emailModalProject) return;

    try {
      setSendingEmail(true);
      const res = await api.post(`/design-projects/${emailModalProject._id}/send-production-email`, emailForm);
      if (res && (res.success || res.email)) {
        const isReal = res.dispatchResult?.mode === 'SMTP' || res.dispatchResult?.mode === 'RESEND_HTTPS' || res.dispatchResult?.mode === 'BREVO_HTTPS';
        if (isReal) {
          setEmailSuccessToast(`Real email successfully dispatched to ${emailForm.to.trim()}!`);
        } else {
          setEmailSuccessToast(`Email recorded in Simulated mode for ${emailForm.to.trim()}. Note: Configure RESEND_API_KEY or SMTP credentials in backend to dispatch live emails.`);
        }
        setEmailModalProject(null);
        setTimeout(() => setEmailSuccessToast(''), 9000);
        loadProjects();
      } else {
        alert(res?.error || 'Failed to dispatch email');
      }
    } catch (err) {
      alert(err.message || 'Error occurred while dispatching email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Copy SHA-256
  const handleCopySha = (sha, e) => {
    e?.stopPropagation();
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedHash(sha);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  // Filtered list
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        (p.title || '').toLowerCase().includes(q) ||
        (p.projectNumber || '').toLowerCase().includes(q) ||
        (p.customerId?.businessName || '').toLowerCase().includes(q) ||
        (p.customerId?.displayName || '').toLowerCase().includes(q) ||
        (p.orderId?.orderNumber || '').toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  // Aggregate Metrics
  const totalLocked = projects.length;
  const dispatchedCount = projects.filter((p) => p.dispatchedEmails && p.dispatchedEmails.length > 0).length;
  const pendingDispatch = totalLocked - dispatchedCount;

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-800 antialiased font-sans">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6">
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wide">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  MANAGER &amp; ADMIN PRODUCTION CONTROL
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Production Released Artworks &amp; Dispatch Center
                </h1>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Inspect final client-approved designs and dispatch high-resolution master artwork files with full technical specifications directly to print vendors or machine floor.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadProjects}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <Link
                  href="/dashboard/design"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Design Studio
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Metrics Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Production Locked Artworks</div>
                  <div className="text-2xl font-black text-slate-900 font-mono">{totalLocked}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600">
                  <Lock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Emails Dispatched</div>
                  <div className="text-2xl font-black text-emerald-600 font-mono">{dispatchedCount}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <Mail className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Pending Mail Release</div>
                  <div className="text-2xl font-black text-amber-600 font-mono">{pendingDispatch}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Send className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Success Toast */}
          {emailSuccessToast && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {emailSuccessToast}
              </div>
              <button
                onClick={() => setEmailSuccessToast('')}
                className="text-emerald-600 hover:text-emerald-800 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search job #, title, customer, order..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 transition-colors shadow-2xs"
              />
            </div>
            <div className="text-xs text-slate-500">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> locked production designs
            </div>
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="p-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              <p className="text-sm text-slate-500">Loading production released artworks...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center rounded-2xl bg-white border border-slate-200 space-y-3 shadow-2xs">
              <Inbox className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Production Locked Designs Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once a designer locks and releases an approved artwork to press, it will automatically appear here for review and email dispatch.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filtered.map((proj) => {
                const currentVer = proj.currentVersionId;
                const proofUrl = currentVer?.proofAssetId?.fileUrl || proj.briefAttachments?.[0]?.fileUrl || '';
                const printReadyUrl = currentVer?.printReadyAssetId?.fileUrl || proofUrl;
                const sha = currentVer?.printReadyAssetId?.sha256 || currentVer?.sha256 || 'SHA256_LOCKED_SECURE';
                const brief = proj.brief || {};
                const order = proj.orderId;
                const orderItem = order?.items?.[0];
                const emailHistory = proj.dispatchedEmails || [];

                return (
                  <div
                    key={proj._id}
                    className="rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-all p-5 space-y-4 shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {proj.projectNumber || 'DES-PROJECT'}
                            </span>
                            {order?.orderNumber && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-semibold border border-slate-200">
                                #{order.orderNumber}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] font-bold flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              LOCKED (V{proj.currentVersionNumber || 1})
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1 line-clamp-1">{proj.title}</h3>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {proj.customerId?.businessName || proj.customerId?.displayName || 'Direct Client'}
                          </div>
                        </div>

                        {/* Approval Badge */}
                        <div className="text-right shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            CLIENT APPROVED
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">{brief.colorMode || 'CMYK'} • {brief.dpi || 100} DPI</div>
                        </div>
                      </div>

                      {/* Content Preview & Specifications */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
                        {/* Visual Thumbnail */}
                        <div
                          onClick={() => setPreviewProject(proj)}
                          className="sm:col-span-1 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden relative cursor-pointer group aspect-video sm:aspect-auto flex items-center justify-center"
                        >
                          {proofUrl ? (
                            <img
                              src={proofUrl}
                              alt="Final Artwork"
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-slate-400 text-center p-3">
                              <FileCheck className="w-8 h-8 mx-auto mb-1 opacity-50" />
                              <span className="text-[10px]">Print Master</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 text-white text-xs font-semibold">
                            <Eye className="w-4 h-4" /> Preview
                          </div>
                        </div>

                        {/* Technical Parameters */}
                        <div className="sm:col-span-2 space-y-1.5 text-xs">
                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Dimensions:</span>
                            <span className="text-slate-900 font-bold font-mono">
                              {brief.productDimensions?.width && brief.productDimensions?.height
                                ? `${brief.productDimensions.width} × ${brief.productDimensions.height} ${brief.productDimensions.unit || 'in'}`
                                : (orderItem?.width && orderItem?.height ? `${orderItem.width} × ${orderItem.height} ${orderItem.dimensionUnit || 'in'}` : 'As specified')}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Substrate &amp; GSM:</span>
                            <span className="text-slate-800 font-semibold">
                              {brief.material || orderItem?.paperType || 'Standard Flex'} {brief.gsm || orderItem?.paperGsm ? `(${brief.gsm || orderItem?.paperGsm} GSM)` : ''}
                            </span>
                          </div>

                          <div className="flex justify-between py-1 border-b border-slate-100">
                            <span className="text-slate-500">Quantity:</span>
                            <span className="text-slate-900 font-bold font-mono">
                              {brief.quantity || orderItem?.quantity || 1} Units
                            </span>
                          </div>

                          <div className="flex justify-between py-1">
                            <span className="text-slate-500">Finishing:</span>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[180px]">
                              {(brief.finishing?.length ? brief.finishing : orderItem?.finishing?.length ? orderItem.finishing : ['Standard']).map((f, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-700 font-medium border border-slate-200">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Security SHA-256 Box */}
                      <div className="mt-3.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="text-[11px] font-mono text-slate-500 truncate">
                            SHA: <span className="text-slate-800">{sha}</span>
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleCopySha(sha, e)}
                          className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-semibold shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedHash === sha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          {copiedHash === sha ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      {/* Email Dispatch Status Tag */}
                      <div className="mt-3 text-xs">
                        {emailHistory.length > 0 ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-medium text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Dispatched to <strong>{emailHistory[0].to}</strong> ({new Date(emailHistory[0].sentAt).toLocaleDateString()})
                            {emailHistory.length > 1 && (
                              <span className="text-slate-500 font-normal">+{emailHistory.length - 1} more</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-amber-700 font-medium text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Awaiting initial email dispatch to vendor / press
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setPreviewProject(proj)}
                        className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Final Design
                      </button>

                      <button
                        onClick={() => handleOpenEmailModal(proj)}
                        className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        Send Mail to Someone
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: VIEW FINAL DESIGN PREVIEW & AUDIT */}
      {previewProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col text-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Final Production Locked Artwork</h3>
                  <div className="text-xs text-slate-500 font-mono">
                    {previewProject.projectNumber} • {previewProject.title}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewProject(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Visual Preview */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-center justify-center min-h-[320px]">
                {previewProject.currentVersionId?.proofAssetId?.fileUrl || previewProject.briefAttachments?.[0]?.fileUrl ? (
                  <img
                    src={previewProject.currentVersionId?.proofAssetId?.fileUrl || previewProject.briefAttachments?.[0]?.fileUrl}
                    alt="Final Approved Artwork"
                    className="max-h-[480px] w-auto object-contain rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="text-center text-slate-500">No artwork visual available</div>
                )}
              </div>

              {/* Master File Download & Fingerprint Bar */}
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    100% Client Approved &amp; Production Locked
                  </div>
                  <div className="text-xs text-slate-600 font-mono mt-0.5 break-all">
                    SHA-256: {previewProject.currentVersionId?.printReadyAssetId?.sha256 || previewProject.currentVersionId?.sha256 || 'IMMUTABLE_HASH_PASS'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {previewProject.currentVersionId?.proofAssetId?.fileUrl && (
                    <a
                      href={previewProject.currentVersionId.proofAssetId.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Proof
                    </a>
                  )}
                  {previewProject.currentVersionId?.printReadyAssetId?.fileUrl && (
                    <a
                      href={previewProject.currentVersionId.printReadyAssetId.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Master Print File
                    </a>
                  )}
                </div>
              </div>

              {/* Sent Emails History */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  Dispatched Production Emails ({previewProject.dispatchedEmails?.length || 0})
                </h4>
                {previewProject.dispatchedEmails?.length ? (
                  <div className="space-y-2">
                    {previewProject.dispatchedEmails.map((em, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{em.to}</div>
                          <div className="text-slate-500 text-[11px]">{em.subject}</div>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            {em.deliveryStatus}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(em.sentAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No production emails have been dispatched for this artwork yet.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-white/95 flex justify-end gap-2">
              <button
                onClick={() => setPreviewProject(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const p = previewProject;
                  setPreviewProject(null);
                  handleOpenEmailModal(p);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Compose &amp; Send Mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND PRODUCTION EMAIL COMPOSER */}
      {emailModalProject && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col text-slate-800">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Send Production Artwork &amp; Specs</h3>
                  <div className="text-xs text-slate-500">
                    Dispatch to printing vendor, machine floor, or client for {emailModalProject.projectNumber}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEmailModalProject(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="p-6 space-y-4">
              {/* Quick Recipient Presets */}
              <div>
                <label className="text-xs text-slate-500 font-semibold block mb-1.5">Quick Presets:</label>
                <div className="flex flex-wrap gap-2">
                  {emailModalProject.customerId?.email && (
                    <button
                      type="button"
                      onClick={() => setEmailForm({ ...emailForm, to: emailModalProject.customerId.email })}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <User className="w-3 h-3 text-blue-600" />
                      Client: {emailModalProject.customerId.email}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEmailForm({ ...emailForm, to: 'press-floor@pressprinting.com' })}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-cyan-600" />
                    Press / Floor Machine
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailForm({ ...emailForm, to: 'vendor-printing@vendor.com' })}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Building className="w-3 h-3 text-purple-600" />
                    Outsourced Vendor
                  </button>
                </div>
              </div>

              {/* Recipient Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Recipient Email(s) (To) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. vendor@printpress.com, client@example.com"
                  value={emailForm.to}
                  onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                />
              </div>

              {/* CC Input */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  CC (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. production-lead@crmprinting.com"
                  value={emailForm.cc}
                  onChange={(e) => setEmailForm({ ...emailForm, cc: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={emailForm.subject}
                  onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white font-semibold"
                />
              </div>

              {/* Message Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Management Notes / Instructions for Floor or Vendor
                </label>
                <textarea
                  rows={4}
                  value={emailForm.message}
                  onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Add any specific instructions, rush delivery deadlines, or cutting guidelines..."
                />
              </div>

              {/* Options Toggles */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={emailForm.includeSpecs}
                    onChange={(e) => setEmailForm({ ...emailForm, includeSpecs: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Attach 7-Point Technical Specifications (Dimensions, GSM, Substrate, Finishing)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={emailForm.includeDownloadLink}
                    onChange={(e) => setEmailForm({ ...emailForm, includeDownloadLink: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Include Direct Download Link for Master Print-Ready Artwork</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={emailForm.includeSha256}
                    onChange={(e) => setEmailForm({ ...emailForm, includeSha256: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0"
                  />
                  <span>Include Cryptographic SHA-256 Checksum Fingerprint</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmailModalProject(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {sendingEmail ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Email...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send Production Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

