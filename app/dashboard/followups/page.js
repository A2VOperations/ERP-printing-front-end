'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Clock,
  Plus,
  PhoneCall,
  MessageSquare,
  Filter,
  Check,
  Edit,
  MoreVertical,
  ChevronDown,
  Calendar,
  Paperclip,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';

const OUTCOME_OPTIONS = [
  { value: 'INTERESTED', label: 'Client Interested' },
  { value: 'QUOTATION_REQUESTED', label: 'Quotation Requested' },
  { value: 'CALLBACK_REQUESTED', label: 'Callback Requested' },
  { value: 'CALL_LATER', label: 'Call Later' },
  { value: 'ORDER_CONFIRMED', label: 'Order Confirmed' },
  { value: 'NOT_INTERESTED', label: 'Not Interested' },
  { value: 'NO_RESPONSE', label: 'No Response / Unreachable' },
  { value: 'BUSY', label: 'Line Busy' },
  { value: 'LOST', label: 'Lost Deal' },
];

export default function FollowupsPage() {
  const [followups, setFollowups] = useState([]);
  const [selectedFollowup, setSelectedFollowup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Complete Modal State
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeTargetId, setCompleteTargetId] = useState(null);
  const [completeForm, setCompleteForm] = useState({
    outcome: '',
    outcomeNotes: '',
    nextAction: 'NONE',
    nextFollowupTitle: '',
    nextFollowupDate: '',
  });

  // Create Form State
  const [newFollowup, setNewFollowup] = useState({
    title: 'Customer Requirement Follow-up',
    scheduledAt: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    type: 'CALL',
    priority: 'HIGH',
    notes: 'Discuss quotation and give best commercial offer.',
  });

  const fetchFollowups = async () => {
    try {
      setLoading(true);
      const query = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await api.get(`/followups${query}`);
      if (res && res.data) {
        setFollowups(res.data);
        if (res.data.length > 0 && !selectedFollowup) {
          setSelectedFollowup(res.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch followups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowups();
  }, [statusFilter]);

  const handleOpenComplete = (id) => {
    setCompleteTargetId(id);
    setCompleteForm({
      outcome: '',
      outcomeNotes: '',
      nextAction: 'NONE',
      nextFollowupTitle: '',
      nextFollowupDate: '',
    });
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeForm.outcome) {
      alert('Please select a valid follow-up outcome.');
      return;
    }

    try {
      const payload = {
        outcome: completeForm.outcome,
        outcomeNotes: completeForm.outcomeNotes || '',
        nextAction: completeForm.nextAction || 'NONE',
      };
      if (completeForm.nextAction === 'SCHEDULE_FOLLOWUP' && completeForm.nextFollowupTitle && completeForm.nextFollowupDate) {
        payload.nextFollowup = {
          title: completeForm.nextFollowupTitle,
          scheduledAt: completeForm.nextFollowupDate,
        };
      }
      await api.post(`/followups/${completeTargetId}/complete`, payload);
      setShowCompleteModal(false);
      fetchFollowups();
    } catch (err) {
      alert(err.message || 'Failed to complete follow-up');
    }
  };

  const handleCreateFollowup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/followups', newFollowup);
      setShowAddModal(false);
      fetchFollowups();
    } catch (err) {
      alert(err.message || 'Failed to create follow-up');
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-6 h-6 text-blue-600" />
                Follow-ups Manager
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Schedule calls, outreach and track client commitments
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchFollowups}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Follow-up
              </button>
            </div>
          </div>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Follow-up List (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Follow-up List ({followups.length})</h3>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1 pr-5 rounded-lg focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">All Status</option>
                    <option value="PENDING">Upcoming / Pending</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* List Items */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                {followups.map((item) => {
                  const isSelected = selectedFollowup?._id === item._id;
                  const dateObj = new Date(item.scheduledAt || Date.now());
                  const day = dateObj.getDate();
                  const month = dateObj.toLocaleString('en-US', { month: 'short' });
                  const time = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedFollowup(item)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#FFFBEB] border-amber-300 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Date Block */}
                        <div className={`w-12 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-amber-100/70 border-amber-300 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          <span className="text-base font-extrabold leading-none">{day}</span>
                          <span className="text-[9px] font-bold uppercase">{month}</span>
                          <span className="text-[8px] text-slate-400">{dateObj.getFullYear()}</span>
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400">{time}</span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">{item.title || 'Client Follow-up'}</h4>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate leading-tight">{item.notes || 'Follow-up discussion'}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 text-slate-600 font-semibold">
                              {item.type === 'WHATSAPP' ? <MessageSquare className="w-3 h-3 text-emerald-600" /> : <PhoneCall className="w-3 h-3 text-emerald-600" />}
                              {item.type || 'CALL'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          item.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {followups.length === 0 && !loading && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No follow-ups found. Click &quot;Add Follow-up&quot; to schedule one.
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Follow-up Details Card (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {selectedFollowup ? (
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Follow-up Details</h3>
                    <div className="flex items-center gap-2">
                      {selectedFollowup.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleOpenComplete(selectedFollowup._id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark as Done
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Topic / Title</span>
                      <p className="font-bold text-slate-900 text-sm">{selectedFollowup.title}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Instructions & Notes</span>
                      <p className="text-slate-800 leading-relaxed">{selectedFollowup.notes || 'No specific notes recorded.'}</p>
                    </div>

                    {selectedFollowup.outcome && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Completed Outcome</span>
                        <p className="font-bold text-emerald-950">{selectedFollowup.outcome}</p>
                        {selectedFollowup.outcomeNotes && (
                          <p className="text-emerald-800 text-[11px]">{selectedFollowup.outcomeNotes}</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block">Scheduled Time</span>
                        <span className="font-semibold text-slate-800">{new Date(selectedFollowup.scheduledAt).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Priority</span>
                        <span className="font-bold text-rose-600">{selectedFollowup.priority || 'HIGH'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs text-slate-400 text-xs">
                  Select a follow-up to view details and mark completion.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Complete Follow-up Modal with Required Outcome Selection */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Complete Follow-up</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Follow-up Outcome *</label>
                <select
                  required
                  value={completeForm.outcome}
                  onChange={(e) => setCompleteForm({ ...completeForm, outcome: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="">Select Outcome...</option>
                  {OUTCOME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Outcome Notes / Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Record summary of discussion with client..."
                  value={completeForm.outcomeNotes}
                  onChange={(e) => setCompleteForm({ ...completeForm, outcomeNotes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Next Action</label>
                <select
                  value={completeForm.nextAction}
                  onChange={(e) => setCompleteForm({ ...completeForm, nextAction: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="NONE">None</option>
                  <option value="SCHEDULE_FOLLOWUP">Schedule Next Follow-up</option>
                  <option value="CALL_LATER">Call Later</option>
                  <option value="SEND_PROPOSAL">Send Proposal</option>
                  <option value="MEETING">Meeting</option>
                </select>
              </div>

              {completeForm.nextAction === 'SCHEDULE_FOLLOWUP' && (
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-2.5 animate-fade-in">
                  <div>
                    <label className="text-blue-900 font-semibold block mb-1 text-[11px]">Next Follow-up Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Quotation Review Call"
                      value={completeForm.nextFollowupTitle}
                      onChange={(e) => setCompleteForm({ ...completeForm, nextFollowupTitle: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-800 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-blue-900 font-semibold block mb-1 text-[11px]">Next Follow-up Date *</label>
                    <input
                      type="datetime-local"
                      required
                      value={completeForm.nextFollowupDate}
                      onChange={(e) => setCompleteForm({ ...completeForm, nextFollowupDate: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-slate-800 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md shadow-emerald-600/20"
                >
                  Complete Follow-up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Follow-up</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateFollowup} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={newFollowup.title}
                  onChange={(e) => setNewFollowup({ ...newFollowup, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Date & Time *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newFollowup.scheduledAt}
                    onChange={(e) => setNewFollowup({ ...newFollowup, scheduledAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Mode</label>
                  <select
                    value={newFollowup.type}
                    onChange={(e) => setNewFollowup({ ...newFollowup, type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="CALL">Call</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="VISIT">Store Visit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={newFollowup.notes}
                  onChange={(e) => setNewFollowup({ ...newFollowup, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-600/20"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
