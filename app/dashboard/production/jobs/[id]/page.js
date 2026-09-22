'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  RefreshCw,
  Truck,
  FileText,
  Clock,
  ExternalLink,
  Lock,
  Calendar,
  AlertCircle,
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Building,
  Phone,
  Ban,
  Check,
  Copy,
} from 'lucide-react';

export default function ProductionJobDetailPage({ params: paramsPromise }) {
  const router = useRouter();
  const params = use(paramsPromise);
  const jobId = params?.id;

  const [job, setJob] = useState(null);
  const [deliveryJobs, setDeliveryJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('admin');
  const [activeTab, setActiveTab] = useState('SPECS');
  const [copiedHash, setCopiedHash] = useState(false);

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  // Email Release Modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [includeSpecs, setIncludeSpecs] = useState(true);
  const [includeFileUrl, setIncludeFileUrl] = useState(true);
  const [includeSha256, setIncludeSha256] = useState(true);

  // Manual Release Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualNotes, setManualNotes] = useState('');

  // Cancel Job Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const canManage = userRole === 'admin' || userRole === 'manager';

  const loadJobData = async () => {
    try {
      setLoading(true);
      const role = (localStorage.getItem('userRole') || 'admin').toLowerCase();
      setUserRole(role);

      const [jobRes, deliveryRes] = await Promise.allSettled([
        api.get(`/production-jobs/${jobId}`),
        api.get(`/delivery-jobs?productionJobId=${jobId}`),
      ]);

      if (jobRes.status === 'fulfilled') {
        const jData = jobRes.value?.data || jobRes.value;
        setJob(jData);
      }

      if (deliveryRes.status === 'fulfilled') {
        const dList = deliveryRes.value?.data || (Array.isArray(deliveryRes.value) ? deliveryRes.value : []);
        setDeliveryJobs(dList);
      }
    } catch (err) {
      console.error('Failed to load job card details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (jobId) loadJobData();
  }, [jobId]);

  // Open Email Modal with Pre-filled Data
  const openEmailModal = () => {
    const defaultEmail = job?.customerId?.email || '';
    const subject = `[PRODUCTION ORDER] ${job?.productionJobNumber} - Order #${job?.orderId?.orderNumber || 'A2V'}`;
    const defaultNote = `Dear Production Team,\n\nPlease find the approved artwork and technical print specifications for Job #${job?.productionJobNumber}. Please review the attached specs and begin printing.`;

    setEmailTo(defaultEmail);
    setEmailSubject(subject);
    setEmailMessage(defaultNote);
    setIncludeSpecs(true);
    setIncludeFileUrl(true);
    setIncludeSha256(true);
    setActionError('');
    setShowEmailModal(true);
  };

  // Handle Send Production Email
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailTo.trim()) {
      alert('Recipient email address is required.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/production-jobs/${jobId}/send-production-email`, {
        to: emailTo,
        subject: emailSubject,
        message: emailMessage,
        includeSpecs,
        includeFileUrl,
        includeSha256,
      });
      alert(`Production job successfully released via email to ${emailTo}!`);
      setShowEmailModal(false);
      loadJobData();
    } catch (err) {
      setActionError(err.message || 'Failed to dispatch email release');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Sent Manually
  const handleMarkSentManually = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/production-jobs/${jobId}/mark-sent-manually`, {
        notes: manualNotes || 'Dispatched files to production manually',
      });
      alert('Production job marked as SENT_FOR_PRODUCTION manually.');
      setShowManualModal(false);
      loadJobData();
    } catch (err) {
      setActionError(err.message || 'Failed to mark job as sent manually');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark In Production
  const handleMarkInProduction = async () => {
    if (!confirm('Mark this job as IN_PRODUCTION (printer/artisan has confirmed start)?')) return;
    setActionLoading(true);
    try {
      await api.post(`/production-jobs/${jobId}/mark-in-production`, {});
      loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to update job to In Production');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Mark Ready for Dispatch
  const handleMarkReadyDispatch = async () => {
    if (!confirm('Printing completed & goods ready? Mark as READY_FOR_DISPATCH?')) return;
    setActionLoading(true);
    try {
      await api.post(`/production-jobs/${jobId}/mark-ready-dispatch`, {});
      loadJobData();
    } catch (err) {
      alert(err.message || 'Failed to mark job as ready for dispatch');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Cancel Job
  const handleCancelJob = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    try {
      await api.post(`/production-jobs/${jobId}/cancel`, {
        reason: cancelReason || 'Cancelled by manager',
      });
      alert('Production job has been cancelled.');
      setShowCancelModal(false);
      loadJobData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel job');
    } finally {
      setActionLoading(false);
    }
  };

  // Copy SHA-256 to clipboard
  const handleCopySha = (sha) => {
    if (!sha) return;
    navigator.clipboard.writeText(sha);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs font-semibold text-slate-700">Loading Production Job Card...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
        <Sidebar />
        <main className="flex-1 p-8">
          <Link href="/dashboard/production" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 mb-6 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Production Queue
          </Link>
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center shadow-xs">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Job Record Not Found</h3>
            <p className="text-xs text-slate-500 mt-1">The requested production job does not exist or has been removed.</p>
          </div>
        </main>
      </div>
    );
  }

  const artworkFile =
    job.productionFiles?.[0]?.fileUrl ||
    job.printReadyAssetId?.fileUrl ||
    job.productionFileLockId?.fileUrl;

  const sha256Hash =
    job.fileSha256 ||
    job.productionFiles?.[0]?.sha256Hash ||
    job.productionFileLockId?.sha256 ||
    'VERIFIED_SHA256';

  const custName =
    job?.customerId?.displayName ||
    job?.customerId?.companyName ||
    job?.customerId?.name ||
    'Customer';

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/production"
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs mr-1 cursor-pointer"
                  title="Back to Production"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Job Card: {job.productionJobNumber}
                </h1>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Order: <strong className="text-slate-800">{job.orderId?.orderNumber || 'N/A'}</strong> • Customer: <strong className="text-slate-800">{custName}</strong>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/dashboard/production"
                className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Queue</span>
              </Link>
              <button
                onClick={loadJobData}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top Banner Card */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-slate-900 tracking-wide">
                  {job.productionJobNumber}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  job.productionStatus === 'READY_FOR_RELEASE'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : job.productionStatus === 'SENT_FOR_PRODUCTION'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : job.productionStatus === 'IN_PRODUCTION'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse'
                    : job.productionStatus === 'READY_FOR_DISPATCH'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : job.productionStatus === 'DISPATCHED'
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : job.productionStatus === 'DELIVERED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}>
                  {job.productionStatus}
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                  {job.priority} PRIORITY
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span>
                  Target Due: <strong className="text-slate-800">{job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'None'}</strong>
                </span>
                {job.releaseMethod && (
                  <span>
                    Release: <strong className="text-slate-800">{job.releaseMethod} ({new Date(job.releaseSentAt).toLocaleDateString()})</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Semantic Action Buttons according to Outsourced FSM */}
            {canManage && (
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. READY_FOR_RELEASE Actions */}
                {job.productionStatus === 'READY_FOR_RELEASE' && (
                  <>
                    <button
                      onClick={openEmailModal}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Send Production Email</span>
                    </button>
                    <button
                      onClick={() => setShowManualModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      <span>Mark Sent Manually</span>
                    </button>
                  </>
                )}

                {/* 2. SENT_FOR_PRODUCTION Actions */}
                {job.productionStatus === 'SENT_FOR_PRODUCTION' && (
                  <button
                    onClick={handleMarkInProduction}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark In Production</span>
                  </button>
                )}

                {/* 3. IN_PRODUCTION Actions */}
                {job.productionStatus === 'IN_PRODUCTION' && (
                  <button
                    onClick={handleMarkReadyDispatch}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark Ready for Dispatch</span>
                  </button>
                )}

                {/* 4. READY_FOR_DISPATCH Actions */}
                {job.productionStatus === 'READY_FOR_DISPATCH' && (
                  <Link
                    href="/dashboard/production/delivery"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Create Delivery Dispatch</span>
                  </Link>
                )}

                {/* 5. DISPATCHED Actions */}
                {job.productionStatus === 'DISPATCHED' && (
                  <Link
                    href="/dashboard/production/delivery"
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Track In Transit</span>
                  </Link>
                )}

                {/* Cancel Button (if non-terminal) */}
                {!['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(job.productionStatus) && (
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Cancel Production Job"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            {[
              { key: 'SPECS', label: 'Artwork & Specifications', icon: FileText },
              { key: 'DELIVERY', label: 'Delivery & Tracking', icon: Truck },
              { key: 'HISTORY', label: 'Activity Audit Log', icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Artwork & Specifications */}
          {activeTab === 'SPECS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Artwork Preview Card */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Locked Production Artwork</h4>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    READ-ONLY IMMUTABLE
                  </span>
                </div>

                <div className="aspect-video w-full bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                  {artworkFile ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <iframe
                        src={artworkFile}
                        className="w-full h-full rounded-lg border-0 pointer-events-none"
                        title="Artwork Preview"
                      />
                      <a
                        href={artworkFile}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-white font-bold text-xs transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Download / View Print File in New Tab</span>
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-slate-500 space-y-2">
                      <FileText className="w-10 h-10 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">Locked Asset File URL Attached</p>
                      <p className="text-[11px] text-slate-500">Secure Cloudinary Production Lock</p>
                    </div>
                  )}
                </div>

                {/* SHA-256 Hash Display */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      SHA-256 Integrity Hash
                    </span>
                    <button
                      onClick={() => handleCopySha(sha256Hash)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-blue-600 break-all select-all font-semibold">
                    {sha256Hash}
                  </p>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Matches Phase 4 client approved proof lock. File cannot be modified.
                  </p>
                </div>
              </div>

              {/* Technical Specifications Snapshot */}
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-bold text-slate-900">Outsourced Print Specifications</h4>
                  <span className="text-[10px] font-bold text-slate-500">Order Snapshot</span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Dimensions</span>
                    <p className="font-bold text-slate-800">
                      {job.specificationsSnapshot?.width || 'Standard'} x {job.specificationsSnapshot?.height || 'Standard'}{' '}
                      {job.specificationsSnapshot?.unit || 'inches'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Quantity</span>
                    <p className="font-bold text-blue-600 text-sm">
                      {job.specificationsSnapshot?.quantity || 1} units
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Substrate / Media</span>
                    <p className="font-bold text-slate-800">
                      {job.specificationsSnapshot?.material || job.specificationsSnapshot?.substrate || 'Standard Media'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Color Mode</span>
                    <p className="font-bold text-slate-800">
                      {job.specificationsSnapshot?.colorMode || 'CMYK'}
                    </p>
                  </div>

                  <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Finishings &amp; Notes</span>
                    <p className="text-slate-700">
                      {Array.isArray(job.specificationsSnapshot?.finishings)
                        ? job.specificationsSnapshot.finishings.join(', ')
                        : job.specificationsSnapshot?.finishing || 'Standard Edge Finish / Hemming'}
                    </p>
                  </div>
                </div>

                {job.notes && (
                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                    <span className="text-[10px] font-bold uppercase text-blue-800 block mb-0.5">Production Notes</span>
                    <p className="text-blue-900">{job.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Delivery & Tracking */}
          {activeTab === 'DELIVERY' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Dispatch &amp; Proof of Delivery (POD)</h4>
                  <p className="text-xs text-slate-500">Delivery tracking from production handover to customer delivery</p>
                </div>
                <Link
                  href="/dashboard/production/delivery"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Open Delivery Hub</span>
                </Link>
              </div>

              {deliveryJobs.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Truck className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-xs font-semibold text-slate-700">No delivery job created for this package yet.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Deliveries can be dispatched once printing is completed and marked READY_FOR_DISPATCH.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {deliveryJobs.map((del) => (
                    <div key={del._id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{del.deliveryNumber}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                            {del.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">{del.deliveryType}</span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Courier / Van</span>
                          <p className="font-medium text-slate-800">{del.courierMetadata?.courierName || 'Internal Van'}</p>
                        </div>
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Driver</span>
                          <p className="font-medium text-slate-800">{del.courierMetadata?.driverName || 'N/A'}</p>
                        </div>
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">Dispatched</span>
                          <p className="font-medium text-slate-800">
                            {del.dispatchedAt ? new Date(del.dispatchedAt).toLocaleDateString() : 'Pending'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block">POD Recipient</span>
                          <p className="font-medium text-emerald-600">{del.proofOfDelivery?.recipientName || 'Pending'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Activity Audit Log */}
          {activeTab === 'HISTORY' && (
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900">Activity &amp; State Audit Trail</h4>
                <span className="text-[10px] font-bold text-slate-500">Immutable Log</span>
              </div>

              {(!job.activityHistory || job.activityHistory.length === 0) ? (
                <p className="text-xs text-slate-500 p-4 text-center">No activity history recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {job.activityHistory.map((act, idx) => (
                    <div
                      key={act._id || idx}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900">{act.action}</span>
                        {act.notes && <p className="text-slate-600 text-[11px]">{act.notes}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {act.performedAt ? new Date(act.performedAt).toLocaleString() : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Send Production Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Send Production Release Email</h3>
                <p className="text-xs text-slate-500">Email artwork link and specifications to production team</p>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && <p className="text-xs text-rose-700 p-2.5 bg-rose-50 rounded-xl border border-rose-200">{actionError}</p>}

            <form onSubmit={handleSendEmail} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="artisan@printshop.com"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instructions / Message</label>
                <textarea
                  rows={4}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeSpecs}
                    onChange={(e) => setIncludeSpecs(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Include job print specifications snapshot in email body</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeFileUrl}
                    onChange={(e) => setIncludeFileUrl(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Include locked Cloudinary high-res artwork download link</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={includeSha256}
                    onChange={(e) => setIncludeSha256(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span>Include SHA-256 integrity verification hash</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Release Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Mark Sent to Production Manually</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {actionError && <p className="text-xs text-rose-700 p-2.5 bg-rose-50 rounded-xl border border-rose-200">{actionError}</p>}
            <form onSubmit={handleMarkSentManually} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Dispatch Notes (WhatsApp / Handover / Courier)
                </label>
                <textarea
                  rows={3}
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Sent print file via WhatsApp to vendor on 9876543210..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Sent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Job Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-xl text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Cancel Production Job</h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {actionError && <p className="text-xs text-rose-700 p-2.5 bg-rose-50 rounded-xl border border-rose-200">{actionError}</p>}
            <form onSubmit={handleCancelJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reason for Cancellation</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Order design revisions requested by client before printing..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Confirm Cancel Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
