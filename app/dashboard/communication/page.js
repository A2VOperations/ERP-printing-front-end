'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Plus,
  Search,
  Filter,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Building2,
  FileText,
  ShoppingBag,
  Palette,
  Layers,
  Truck,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  X,
  PhoneCall,
  Calendar,
  Lock,
  Tag,
  Paperclip,
} from 'lucide-react';

const CHANNELS = [
  { key: 'ALL', label: 'All Channels', icon: MessageSquare },
  { key: 'EMAIL', label: 'Email', icon: Mail, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { key: 'SMS', label: 'SMS', icon: MessageSquare, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
  { key: 'CALL', label: 'Calls', icon: Phone, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'OPEN', label: 'Open' },
  { value: 'WAITING_FOR_CUSTOMER', label: 'Waiting for Customer' },
  { value: 'WAITING_FOR_TEAM', label: 'Waiting for Team' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
];

const CALL_OUTCOMES = [
  { value: 'CONNECTED', label: 'Connected / Answered' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'WRONG_NUMBER', label: 'Wrong Number' },
  { value: 'CALLBACK_REQUESTED', label: 'Callback Requested' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'INTERESTED', label: 'Interested / In Discussion' },
  { value: 'SALE_CLOSED', label: 'Sale Closed' },
];

function CommunicationInboxContent() {
  // State
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [events, setEvents] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeComposerTab, setActiveComposerTab] = useState('EMAIL'); // EMAIL, CALL, WHATSAPP, SMS
  const [templates, setTemplates] = useState([]);

  // Email form state
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState(null);

  // Call form state
  const [callDirection, setCallDirection] = useState('OUTBOUND');
  const [callPhone, setCallPhone] = useState('');
  const [callDuration, setCallDuration] = useState(120);
  const [callOutcome, setCallOutcome] = useState('INTERESTED');
  const [callNotes, setCallNotes] = useState('');
  const [scheduleFollowup, setScheduleFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupTitle, setFollowupTitle] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);
  const [callStatusMsg, setCallStatusMsg] = useState(null);

  // WhatsApp form state
  const [waBody, setWaBody] = useState('');
  const [waTemplateId, setWaTemplateId] = useState('');
  const [sendingWa, setSendingWa] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState(null);
  const [providerStatus, setProviderStatus] = useState(null);

  const searchParams = useSearchParams();
  const queryLeadId = searchParams?.get('leadId') || '';

  // New Thread Modal state
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [contextType, setContextType] = useState(queryLeadId ? 'LEAD' : 'CUSTOMER');
  const [customersList, setCustomersList] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [newThreadCustomer, setNewThreadCustomer] = useState('');
  const [newThreadLead, setNewThreadLead] = useState(queryLeadId || '');
  const [newThreadChannel, setNewThreadChannel] = useState('EMAIL');
  const [newThreadSubject, setNewThreadSubject] = useState('');
  const [creatingThread, setCreatingThread] = useState(false);

  // Auto-scroll timeline to bottom
  const timelineEndRef = useRef(null);

  const scrollToBottom = () => {
    timelineEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchThreads();
    fetchTemplates();
    fetchCustomersList();
    fetchLeadsList();
    fetchProviderStatus();
  }, [channelFilter, statusFilter]);

  const fetchProviderStatus = async () => {
    try {
      const res = await api.get('/communications/provider-status');
      if (res.data) setProviderStatus(res.data);
    } catch (err) {
      console.error('Failed to load provider status:', err);
    }
  };

  useEffect(() => {
    if (activeThread?._id) {
      fetchEvents(activeThread._id);
      setEmailTo(activeThread.customerId?.email || activeThread.leadId?.email || '');
      setEmailCc('');
      setCallPhone(activeThread.customerId?.phone || activeThread.leadId?.phone || activeThread.contactPhone || '');
    }
  }, [activeThread?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [events]);

  // Fetch threads
  const fetchThreads = async () => {
    setLoadingThreads(true);
    try {
      const params = new URLSearchParams();
      if (channelFilter !== 'ALL') params.append('channel', channelFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await api.get(`/communications/threads?${params.toString()}`);
      const threadData = res.data || [];
      setThreads(threadData);

      if (queryLeadId) {
        const matchingLeadThread = threadData.find(
          (t) => (t.leadId?._id || t.leadId)?.toString() === queryLeadId.toString()
        );
        if (matchingLeadThread) {
          setActiveThread(matchingLeadThread);
        } else {
          // If no thread exists for this lead yet, load lead details for rapid thread start
          setContextType('LEAD');
          setNewThreadLead(queryLeadId);
          api.get(`/leads/${queryLeadId}`).then((leadRes) => {
            const l = leadRes.data;
            if (l) {
              setNewThreadSubject(`Inquiry: ${l.contactName || l.businessName || 'Lead'}`);
              setEmailTo(l.email || '');
              setCallPhone(l.phone || '');
            }
          }).catch(() => {});
        }
      } else if (threadData.length > 0 && !activeThread) {
        setActiveThread(threadData[0]);
      } else if (activeThread) {
        // Keep selected thread refreshed
        const updated = threadData.find((t) => t._id === activeThread._id);
        if (updated) setActiveThread(updated);
      }
    } catch (err) {
      console.error('Failed to load communication threads:', err);
    } finally {
      setLoadingThreads(false);
    }
  };

  // Fetch events for active thread
  const fetchEvents = async (threadId) => {
    setLoadingEvents(true);
    try {
      const res = await api.get(`/communications/threads/${threadId}/events`);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Failed to load thread events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Fetch templates for quick fill
  const fetchTemplates = async () => {
    try {
      const res = await api.get('/communication-templates?status=ACTIVE');
      setTemplates(res.data || []);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  // Fetch customers list for new thread modal
  const fetchCustomersList = async () => {
    try {
      const res = await api.get('/customers?limit=100');
      setCustomersList(res.data || []);
    } catch (err) {
      console.error('Failed to load customers for thread creation:', err);
    }
  };

  // Fetch leads list for new thread modal
  const fetchLeadsList = async () => {
    try {
      const res = await api.get('/leads?limit=100');
      const list = Array.isArray(res.data) ? res.data : (res.data?.leads || res.data?.records || []);
      setLeadsList(list);
    } catch (err) {
      console.error('Failed to load leads for thread creation:', err);
    }
  };

  // Template select handler
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;
    const tmpl = templates.find((t) => t._id === templateId);
    if (tmpl) {
      setEmailSubject(tmpl.subject || '');
      setEmailBody(tmpl.body || '');
    }
  };

  // Send Email Handler
  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!activeThread?._id || !emailBody) return;

    const targetEmail = (emailTo || activeThread.customerId?.email || activeThread.leadId?.email || '').trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setEmailStatusMsg({
        type: 'error',
        text: 'A valid recipient email address is required. Please enter an email in the "To" field.',
      });
      return;
    }

    setSendingEmail(true);
    setEmailStatusMsg(null);

    try {
      const payload = {
        to: targetEmail,
        cc: emailCc.trim() || undefined,
        subject: emailSubject || activeThread.subject || 'Follow-up regarding your order',
        body: emailBody,
        templateId: selectedTemplateId || undefined,
      };

      const res = await api.post(`/communications/threads/${activeThread._id}/send-email`, payload);

      if (res.data?.success) {
        setEmailStatusMsg({ type: 'success', text: 'Email sent successfully!' });
        setEmailBody('');
        setSelectedTemplateId('');
      } else {
        setEmailStatusMsg({
          type: 'error',
          text: res.data?.error || 'Email could not be delivered by SMTP provider.',
        });
      }

      fetchEvents(activeThread._id);
      fetchThreads();
    } catch (err) {
      setEmailStatusMsg({
        type: 'error',
        text: err.message || 'Failed to send email. Check SMTP settings.',
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Log Call Handler
  const handleLogCall = async (e) => {
    e.preventDefault();
    if (!activeThread?._id) return;
    setLoggingCall(true);
    setCallStatusMsg(null);

    try {
      const payload = {
        callDirection,
        phoneNumber: callPhone,
        durationSeconds: Number(callDuration) || 0,
        outcome: callOutcome,
        notes: callNotes,
        ...(scheduleFollowup && followupDate ? { nextFollowUpAt: followupDate, followUpTitle: followupTitle || 'Call Follow-up' } : {}),
      };

      await api.post(`/communications/threads/${activeThread._id}/log-call`, payload);
      setCallStatusMsg({ type: 'success', text: 'Call logged successfully!' });
      setCallNotes('');
      setScheduleFollowup(false);
      setFollowupDate('');
      setFollowupTitle('');
      fetchEvents(activeThread._id);
      fetchThreads();
    } catch (err) {
      setCallStatusMsg({ type: 'error', text: err.message || 'Failed to log call.' });
    } finally {
      setLoggingCall(false);
    }
  };

  // Send WhatsApp Message Handler
  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    if (!activeThread?._id) return;
    setSendingWa(true);
    setWaStatusMsg(null);

    try {
      const payload = {};
      if (waTemplateId) {
        payload.templateId = waTemplateId;
      } else {
        payload.body = waBody;
      }
      await api.post(`/communications/threads/${activeThread._id}/send-whatsapp`, payload);
      setWaStatusMsg({ type: 'success', text: 'WhatsApp message sent successfully' });
      setWaBody('');
      setWaTemplateId('');
      fetchEvents(activeThread._id);
      fetchThreads();
    } catch (err) {
      setWaStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to send WhatsApp message.',
      });
    } finally {
      setSendingWa(false);
    }
  };

  // Update thread status using semantic FSM endpoints
  const handleUpdateStatus = async (newStatus) => {
    if (!activeThread?._id) return;
    try {
      let endpoint = '';
      if (newStatus === 'RESOLVED') endpoint = `/communications/threads/${activeThread._id}/resolve`;
      else if (newStatus === 'OPEN') endpoint = `/communications/threads/${activeThread._id}/reopen`;
      else if (newStatus === 'CLOSED') endpoint = `/communications/threads/${activeThread._id}/close`;
      else if (newStatus === 'WAITING_FOR_CUSTOMER') endpoint = `/communications/threads/${activeThread._id}/wait-for-customer`;
      else if (newStatus === 'WAITING_FOR_TEAM') endpoint = `/communications/threads/${activeThread._id}/wait-for-team`;

      if (endpoint) {
        const res = await api.post(endpoint);
        setActiveThread(res.data || { ...activeThread, status: newStatus });
      }
      fetchThreads();
    } catch (err) {
      alert(err.message || 'Failed to update thread status');
    }
  };

  // Create new thread
  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (contextType === 'CUSTOMER' && !newThreadCustomer) return;
    if (contextType === 'LEAD' && !newThreadLead) return;
    setCreatingThread(true);
    try {
      const payload = {
        primaryChannel: newThreadChannel,
        subject: newThreadSubject || (contextType === 'LEAD' ? 'Lead Inquiry' : 'Customer Inquiry'),
      };
      if (contextType === 'LEAD') {
        payload.leadId = newThreadLead;
      } else {
        payload.customerId = newThreadCustomer;
      }

      const res = await api.post('/communications/threads', payload);
      setShowNewThreadModal(false);
      setNewThreadSubject('');
      setNewThreadCustomer('');
      setNewThreadLead('');
      await fetchThreads();
      if (res.data) setActiveThread(res.data);
    } catch (err) {
      alert(err.message || 'Failed to create communication thread');
    } finally {
      setCreatingThread(false);
    }
  };

  const isDnc = Boolean(
    activeThread?.customerId?.communicationPreferences?.doNotContact ||
      activeThread?.leadId?.communicationPreferences?.doNotContact
  );

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />

        {/* Omnichannel Header Bar */}
        <div className="h-14 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Communication Hub</h1>
              <p className="text-[11px] text-slate-400">Omnichannel Inbox • Email, Calls, WhatsApp, SMS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/communication/templates"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Templates
            </Link>
            <Link
              href="/dashboard/communication/settings"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              Gateways & Providers
            </Link>
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Conversation
            </button>
          </div>
        </div>

        {/* 3-Pane Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* PANE 1: THREADS LIST (LEFT) */}
          <div className="w-80 border-r border-slate-800 bg-[#0F172A]/70 flex flex-col shrink-0">
            {/* Search & Channel Filters */}
            <div className="p-3 border-b border-slate-800/80 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchThreads()}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Channel Selector Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  const isActive = channelFilter === ch.key;
                  return (
                    <button
                      key={ch.key}
                      onClick={() => setChannelFilter(ch.key)}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {ch.label}
                    </button>
                  );
                })}
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full py-1 px-2 rounded-md bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium focus:outline-none"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Thread List Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
              {loadingThreads ? (
                <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  Loading conversations...
                </div>
              ) : threads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No conversations found for current filter.
                </div>
              ) : (
                threads.map((thread) => {
                  const isSelected = activeThread?._id === thread._id;
                  const contactName =
                    thread.customerId?.displayName ||
                    thread.customerId?.companyName ||
                    thread.leadId?.contactName ||
                    'Unknown Contact';

                  return (
                    <button
                      key={thread._id}
                      onClick={() => setActiveThread(thread)}
                      className={`w-full text-left p-3 transition flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/10 border-l-4 border-blue-500'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[170px]">
                          {contactName}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(thread.lastMessageAt || thread.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 truncate font-medium">
                        {thread.subject || 'No subject'}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider border ${
                              thread.primaryChannel === 'EMAIL'
                                ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                                : thread.primaryChannel === 'CALL'
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                                : thread.primaryChannel === 'WHATSAPP'
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-violet-400 bg-violet-500/10 border-violet-500/20'
                            }`}
                          >
                            {thread.primaryChannel}
                          </span>
                          <span className="text-[9px] text-slate-500 font-semibold uppercase">
                            {thread.threadNumber}
                          </span>
                        </div>

                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            thread.status === 'OPEN'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : thread.status === 'WAITING_FOR_CUSTOMER'
                              ? 'bg-amber-500/20 text-amber-400'
                              : thread.status === 'WAITING_FOR_TEAM'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {thread.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANE 2: ACTIVE CONVERSATION TIMELINE & COMPOSER (MIDDLE) */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B1120]">
            {activeThread ? (
              <>
                {/* Active Thread Header */}
                <div className="h-14 px-6 border-b border-slate-800 bg-[#0F172A]/50 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                      {(activeThread.customerId?.displayName || activeThread.leadId?.contactName || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {activeThread.customerId?.displayName ||
                            activeThread.customerId?.companyName ||
                            activeThread.leadId?.contactName ||
                            'Conversation'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {activeThread.threadNumber}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {activeThread.customerId?.email || activeThread.leadId?.email || 'No email'}{' '}
                        • {activeThread.customerId?.phone || activeThread.leadId?.phone || 'No phone'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Status Dropdown */}
                    <select
                      value={activeThread.status}
                      onChange={(e) => handleUpdateStatus(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                    >
                      <option value="OPEN">Open</option>
                      <option value="WAITING_FOR_CUSTOMER">Waiting for Customer</option>
                      <option value="WAITING_FOR_TEAM">Waiting for Team</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                </div>

                {/* DNC Alert Banner if Customer has DNC active */}
                {isDnc && (
                  <div className="bg-rose-950/70 border-b border-rose-800/80 px-6 py-2.5 flex items-center gap-3 text-rose-200 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      DO NOT CONTACT (DNC) ACTIVE: Customer has opted out or flagged as Do Not Contact. Outbound messages are blocked.
                    </span>
                  </div>
                )}

                {/* Scrollable Event Feed */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {loadingEvents ? (
                    <div className="p-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                      Loading messages...
                    </div>
                  ) : events.length === 0 ? (
                    <div className="p-12 text-center text-xs text-slate-500">
                      No communication events recorded in this conversation yet. Send an email or log a call below.
                    </div>
                  ) : (
                    events.map((event) => {
                      const isOutbound = event.direction === 'OUTBOUND';

                      return (
                        <div
                          key={event._id}
                          className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-2xl rounded-xl p-4 border shadow-sm ${
                              isOutbound
                                ? 'bg-[#1E293B] border-slate-700/80 text-slate-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}
                          >
                            {/* Event Metadata Header */}
                            <div className="flex items-center gap-2 pb-2 mb-2 border-b border-slate-700/50 text-[10px]">
                              <span
                                className={`px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider ${
                                  event.channel === 'EMAIL'
                                    ? 'text-blue-400 bg-blue-500/10'
                                    : event.channel === 'CALL'
                                    ? 'text-amber-400 bg-amber-500/10'
                                    : event.channel === 'WHATSAPP'
                                    ? 'text-emerald-400 bg-emerald-500/10'
                                    : 'text-violet-400 bg-violet-500/10'
                                }`}
                              >
                                {event.channel}
                              </span>

                              <span className="font-semibold text-slate-400">
                                {event.sender?.name || (isOutbound ? 'Staff' : 'Customer')}
                              </span>

                              <span className="text-slate-500">•</span>

                              <span className="text-slate-500">
                                {new Date(event.createdAt).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>

                              <span className="ml-auto">
                                <span
                                  className={`px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                                    event.deliveryStatus === 'READ'
                                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                      : event.deliveryStatus === 'DELIVERED' || event.deliveryStatus === 'SENT'
                                      ? 'bg-emerald-500/20 text-emerald-400'
                                      : event.deliveryStatus === 'FAILED'
                                      ? 'bg-rose-500/20 text-rose-400'
                                      : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {event.deliveryStatus}
                                </span>
                              </span>
                            </div>

                            {/* Call Specific Details */}
                            {event.channel === 'CALL' && event.callMetadata && (
                              <div className="mb-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="font-bold text-white">Outcome:</span>
                                  <span className="text-amber-300 font-semibold">
                                    {event.callMetadata.outcome}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{Math.floor((event.callMetadata.durationSeconds || 0) / 60)}m {(event.callMetadata.durationSeconds || 0) % 60}s</span>
                                </div>
                              </div>
                            )}

                            {/* Subject if exists */}
                            {event.subject && (
                              <div className="text-xs font-bold text-white mb-1.5">
                                {event.subject}
                              </div>
                            )}

                            {/* Body Text */}
                            <div className="text-xs leading-relaxed whitespace-pre-wrap">
                              {event.body}
                            </div>

                            {/* Sanitized Failure Reason */}
                            {event.deliveryStatus === 'FAILED' && event.failureReason && (
                              <div className="mt-2 pt-1.5 border-t border-rose-900/40 text-[11px] text-rose-400 flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                                <span>{event.failureReason}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={timelineEndRef} />
                </div>

                {/* Bottom Composer */}
                <div className="border-t border-slate-800 bg-[#0F172A] p-4 shrink-0">
                  {/* Channel Tab Buttons */}
                  <div className="flex items-center gap-2 mb-3">
                    <button
                      onClick={() => setActiveComposerTab('EMAIL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        activeComposerTab === 'EMAIL'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Send Email
                    </button>
                    <button
                      onClick={() => setActiveComposerTab('CALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        activeComposerTab === 'CALL'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Log Call
                    </button>
                    <button
                      onClick={() => setActiveComposerTab('WHATSAPP')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        activeComposerTab === 'WHATSAPP'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp (Locked)
                    </button>
                    <button
                      onClick={() => setActiveComposerTab('SMS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        activeComposerTab === 'SMS'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      SMS (Locked)
                    </button>
                  </div>

                  {/* TAB 1: EMAIL COMPOSER */}
                  {activeComposerTab === 'EMAIL' && (
                    <form onSubmit={handleSendEmail} className="space-y-3">
                      {emailStatusMsg && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                            emailStatusMsg.type === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {emailStatusMsg.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{emailStatusMsg.text}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">To (Recipient Email) *</label>
                          <input
                            type="email"
                            placeholder="recipient@example.com"
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            disabled={isDnc}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">CC (Optional)</label>
                          <input
                            type="text"
                            placeholder="accounts@example.com"
                            value={emailCc}
                            onChange={(e) => setEmailCc(e.target.value)}
                            disabled={isDnc}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Subject</label>
                          <input
                            type="text"
                            placeholder="Email Subject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            disabled={isDnc}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          />
                        </div>

                        {/* Template selector */}
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Template</label>
                          <select
                            value={selectedTemplateId}
                            onChange={(e) => handleSelectTemplate(e.target.value)}
                            disabled={isDnc}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 disabled:opacity-50"
                          >
                            <option value="">Insert Template...</option>
                            {templates
                              .filter((t) => t.channel === 'EMAIL')
                              .map((tmpl) => (
                                <option key={tmpl._id} value={tmpl._id}>
                                  {tmpl.name}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      <textarea
                        rows={3}
                        placeholder={isDnc ? 'Outbound email disabled because customer has DNC active.' : 'Compose email message...'}
                        value={emailBody}
                        onChange={(e) => setEmailBody(e.target.value)}
                        disabled={isDnc}
                        className="w-full p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none disabled:opacity-50"
                      />

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Outbound email sent securely via authenticated SMTP
                        </span>

                        <button
                          type="submit"
                          disabled={sendingEmail || isDnc || !emailBody}
                          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
                        >
                          {sendingEmail ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Send Email
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: CALL LOG COMPOSER */}
                  {activeComposerTab === 'CALL' && (
                    <form onSubmit={handleLogCall} className="space-y-3">
                      {callStatusMsg && (
                        <div
                          className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                            callStatusMsg.type === 'success'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {callStatusMsg.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                          ) : (
                            <AlertCircle className="w-4 h-4 shrink-0" />
                          )}
                          <span>{callStatusMsg.text}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Phone Number</label>
                          <input
                            type="tel"
                            placeholder="+91 9876543210"
                            value={callPhone}
                            onChange={(e) => setCallPhone(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Direction</label>
                          <select
                            value={callDirection}
                            onChange={(e) => setCallDirection(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          >
                            <option value="OUTBOUND">Outbound Call</option>
                            <option value="INBOUND">Inbound Call</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Duration (Sec)</label>
                          <input
                            type="number"
                            value={callDuration}
                            onChange={(e) => setCallDuration(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block mb-1">Outcome</label>
                          <select
                            value={callOutcome}
                            onChange={(e) => setCallOutcome(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                          >
                            {CALL_OUTCOMES.map((oc) => (
                              <option key={oc.value} value={oc.value}>
                                {oc.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Detailed call discussion summary notes..."
                        value={callNotes}
                        onChange={(e) => setCallNotes(e.target.value)}
                        className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                      />

                      {/* Optional Follow-up Scheduling */}
                      <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="scheduleFollowup"
                            checked={scheduleFollowup}
                            onChange={(e) => setScheduleFollowup(e.target.checked)}
                            className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                          />
                          <label htmlFor="scheduleFollowup" className="text-xs font-semibold text-slate-300 cursor-pointer">
                            Schedule automatic follow-up task (CRM Follow-up Module)
                          </label>
                        </div>

                        {scheduleFollowup && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <input
                              type="datetime-local"
                              value={followupDate}
                              onChange={(e) => setFollowupDate(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                            />
                            <input
                              type="text"
                              placeholder="Follow-up Title / Reason"
                              value={followupTitle}
                              onChange={(e) => setFollowupTitle(e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="submit"
                          disabled={loggingCall}
                          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
                        >
                          {loggingCall ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Logging...
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-3.5 h-3.5" />
                              Save Call Record
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 3: WHATSAPP COMPOSER */}
                  {activeComposerTab === 'WHATSAPP' && (
                    providerStatus?.whatsapp?.configured ? (
                      <form onSubmit={handleSendWhatsApp} className="space-y-3">
                        {/* Session Window & Phone Banner */}
                        {(() => {
                          const isSessionActive =
                            activeThread?.lastInboundAt &&
                            Date.now() - new Date(activeThread.lastInboundAt).getTime() <= 24 * 60 * 60 * 1000;
                          const targetPhone =
                            activeThread?.customerId?.phone ||
                            activeThread?.leadId?.phone ||
                            activeThread?.contactPhone ||
                            'No phone on record';

                          return (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                              <div className="flex items-center gap-2">
                                {isSessionActive ? (
                                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    24h Customer Session Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <AlertCircle className="w-3 h-3 text-amber-400" />
                                    Outside 24h Window (Approved Template Required)
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 font-medium text-[11px]">
                                Recipient: <span className="text-white font-semibold font-mono">{targetPhone}</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Status Message */}
                        {waStatusMsg && (
                          <div
                            className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                              waStatusMsg.type === 'success'
                                ? 'bg-emerald-950/60 border border-emerald-800/60 text-emerald-300'
                                : 'bg-rose-950/60 border border-rose-800/60 text-rose-300'
                            }`}
                          >
                            {waStatusMsg.type === 'success' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                            )}
                            <span>{waStatusMsg.text}</span>
                          </div>
                        )}

                        {/* Template Selection Dropdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                              WhatsApp Template
                            </label>
                            <select
                              value={waTemplateId}
                              onChange={(e) => {
                                const tId = e.target.value;
                                setWaTemplateId(tId);
                                if (tId) {
                                  const t = templates.find((item) => item._id === tId);
                                  if (t) setWaBody(t.body);
                                }
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="">-- Direct Text (Session Messages) --</option>
                              {templates
                                .filter((t) => t.channel === 'WHATSAPP' && t.providerTemplateStatus === 'APPROVED')
                                .map((tmpl) => (
                                  <option key={tmpl._id} value={tmpl._id}>
                                    {tmpl.name} ({tmpl.providerTemplateName || 'Approved'})
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {/* Message Body Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Message Content
                          </label>
                          <textarea
                            rows={3}
                            value={waBody}
                            onChange={(e) => setWaBody(e.target.value)}
                            readOnly={Boolean(waTemplateId)}
                            placeholder={
                              waTemplateId
                                ? 'Template selected. Variables will be resolved server-side.'
                                : 'Type free-form message (permitted only within 24h customer window)...'
                            }
                            className={`w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none font-mono ${
                              waTemplateId ? 'opacity-80 bg-slate-900/50' : ''
                            }`}
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex items-center justify-end">
                          <button
                            type="submit"
                            disabled={sendingWa || (!waTemplateId && !waBody.trim())}
                            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5"
                          >
                            {sendingWa ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Sending via Meta...
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                Send WhatsApp
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-center space-y-2">
                        <div className="w-10 h-10 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                          <Lock className="w-5 h-5" />
                        </div>
                        <h3 className="text-xs font-bold text-white">Meta WhatsApp Cloud API Not Configured</h3>
                        <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                          Live WhatsApp messaging requires Meta Cloud API credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET`).
                        </p>
                        <Link
                          href="/dashboard/communication/settings"
                          className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/50 transition"
                        >
                          View Provider Settings
                        </Link>
                      </div>
                    )
                  )}

                  {/* TAB 4: SMS LOCKED NOTIFICATION */}
                  {activeComposerTab === 'SMS' && (
                    <div className="p-4 rounded-xl bg-violet-950/30 border border-violet-800/40 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/30">
                        <Lock className="w-5 h-5" />
                      </div>
                      <h3 className="text-xs font-bold text-white">SMS Gateway (Twilio/Kaleyra) Not Configured</h3>
                      <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                        Live outbound SMS messaging is locked in Phase 6A until SMS provider credentials and DLT registration are verified.
                      </p>
                      <Link
                        href="/dashboard/communication/settings"
                        className="inline-block mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-300 bg-violet-900/40 hover:bg-violet-900/60 border border-violet-700/50 transition"
                      >
                        View Provider Settings
                      </Link>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-400">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-300">Select a conversation</h3>
                <p className="text-xs max-w-sm">
                  Choose a customer conversation from the list on the left, or create a new conversation thread.
                </p>
              </div>
            )}
          </div>

          {/* PANE 3: CONTEXT CARD (RIGHT) */}
          {activeThread && (
            <div className="w-72 border-l border-slate-800 bg-[#0F172A]/70 p-4 flex flex-col gap-4 overflow-y-auto shrink-0">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Contact & Context
              </h2>

              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                <div className="text-xs font-bold text-white">
                  {activeThread.customerId?.displayName ||
                    activeThread.customerId?.companyName ||
                    activeThread.leadId?.contactName ||
                    'Contact Details'}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">
                      {activeThread.customerId?.email || activeThread.leadId?.email || 'None'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{activeThread.customerId?.phone || activeThread.leadId?.phone || 'None'}</span>
                  </div>
                </div>

                {/* Communication Preferences */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Channel Preferences
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        activeThread.customerId?.communicationPreferences?.emailAllowed !== false
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-slate-800 text-slate-500 line-through'
                      }`}
                    >
                      Email
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        activeThread.customerId?.communicationPreferences?.callAllowed !== false
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800 text-slate-500 line-through'
                      }`}
                    >
                      Calls
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        activeThread.customerId?.communicationPreferences?.whatsappAllowed !== false
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500 line-through'
                      }`}
                    >
                      WhatsApp
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked CRM Entities */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">
                  Linked CRM Objects
                </span>

                <div className="space-y-1.5">
                  {activeThread.quotationId && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>Quotation</span>
                      </div>
                      <Link
                        href={`/dashboard/quotations`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                      >
                        View
                      </Link>
                    </div>
                  )}

                  {activeThread.orderId && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Order</span>
                      </div>
                      <Link
                        href={`/dashboard/orders`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                      >
                        View
                      </Link>
                    </div>
                  )}

                  {activeThread.designProjectId && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-purple-400" />
                        <span>Design Project</span>
                      </div>
                      <Link
                        href={`/dashboard/design`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                      >
                        View
                      </Link>
                    </div>
                  )}

                  {activeThread.productionJobId && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Production Job</span>
                      </div>
                      <Link
                        href={`/dashboard/production`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                      >
                        View
                      </Link>
                    </div>
                  )}

                  {activeThread.deliveryJobId && (
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-amber-400" />
                        <span>Delivery Job</span>
                      </div>
                      <Link
                        href={`/dashboard/production/delivery`}
                        className="text-blue-400 hover:text-blue-300 font-semibold text-[11px]"
                      >
                        View
                      </Link>
                    </div>
                  )}

                  {!activeThread.quotationId &&
                    !activeThread.orderId &&
                    !activeThread.designProjectId &&
                    !activeThread.productionJobId &&
                    !activeThread.deliveryJobId && (
                      <div className="text-[11px] text-slate-500 italic">
                        No active commercial or production links.
                      </div>
                    )}
                </div>
              </div>

              {/* View Customer 360 */}
              {activeThread.customerId?._id && (
                <Link
                  href={`/dashboard/customers`}
                  className="mt-auto w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-center text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  View Customer Profile
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW THREAD MODAL */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-500" />
                New Conversation Thread
              </h3>
              <button
                onClick={() => setShowNewThreadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3">
              {/* Context Selector: Customer or Lead */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Context Entity</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setContextType('CUSTOMER')}
                    className={`py-1.5 px-3 rounded text-xs font-semibold transition ${
                      contextType === 'CUSTOMER'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setContextType('LEAD')}
                    className={`py-1.5 px-3 rounded text-xs font-semibold transition ${
                      contextType === 'LEAD'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Lead
                  </button>
                </div>
              </div>

              {contextType === 'CUSTOMER' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Customer</label>
                  <select
                    value={newThreadCustomer}
                    onChange={(e) => setNewThreadCustomer(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a customer...</option>
                    {customersList.map((cust) => (
                      <option key={cust._id} value={cust._id}>
                        {cust.displayName || cust.companyName} ({cust.customerNumber || cust.phone || cust.email})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Select Lead</label>
                  <select
                    value={newThreadLead}
                    onChange={(e) => setNewThreadLead(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Choose a lead...</option>
                    {leadsList.map((ld) => (
                      <option key={ld._id} value={ld._id}>
                        {ld.contactName || ld.businessName} ({ld.leadNumber || ld.phone || ld.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Primary Channel</label>
                <select
                  value={newThreadChannel}
                  onChange={(e) => setNewThreadChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="EMAIL">Email</option>
                  <option value="CALL">Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Subject / Discussion Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Brochure quotation discussion"
                  value={newThreadSubject}
                  onChange={(e) => setNewThreadSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingThread || (contextType === 'CUSTOMER' ? !newThreadCustomer : !newThreadLead)}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition"
                >
                  {creatingThread ? 'Creating...' : 'Start Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CommunicationInboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#0B1120] text-slate-200 font-sans">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <div className="p-16 text-center text-slate-400 text-xs my-auto">
              Loading Communication Hub...
            </div>
          </div>
        </div>
      }
    >
      <CommunicationInboxContent />
    </Suspense>
  );
}
