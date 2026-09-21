'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  MessageSquare,
  Search,
  ChevronDown,
  Filter,
  Edit,
  Trash2,
  Pin,
  ArrowRight,
  Info,
  Download,
  RefreshCw,
} from 'lucide-react';

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchNotes, setSearchNotes] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNote, setNewNote] = useState({
    title: '',
    notes: '',
    client: '',
  });

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/followups?limit=50');
      if (res && res.data) {
        setNotes(res.data.filter(f => f.notes || f.outcomeNotes).map(f => ({
          id: f._id,
          client: f.customerName || f.contactName || 'Client Inquiry',
          title: f.title || 'Client Interaction',
          notes: f.outcomeNotes || f.notes,
          time: new Date(f.createdAt || f.scheduledAt).toLocaleString(),
          actor: f.assignedToName || 'Sales Representative',
          pinned: f.priority === 'HIGH',
        })));
      }
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      await api.post('/followups', {
        title: newNote.title,
        notes: newNote.notes,
        scheduledAt: new Date().toISOString(),
        type: 'NOTE',
      });
      setShowAddModal(false);
      setNewNote({ title: '', notes: '', client: '' });
      fetchNotes();
    } catch (err) {
      alert(err.message || 'Failed to save note');
    }
  };

  const filteredNotes = notes.filter(n =>
    !searchNotes ||
    (n.title || '').toLowerCase().includes(searchNotes.toLowerCase()) ||
    (n.notes || '').toLowerCase().includes(searchNotes.toLowerCase()) ||
    (n.client || '').toLowerCase().includes(searchNotes.toLowerCase())
  );

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
                <FileText className="w-6 h-6 text-blue-600" />
                Notes & Remarks Repository
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Client communication notes, special production instructions, and audit log
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchNotes}
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
                Add Note
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes by keywords, client or details..."
                value={searchNotes}
                onChange={(e) => setSearchNotes(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                    {note.client}
                  </span>
                  <span className="text-[10px] text-slate-400">{note.time}</span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{note.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{note.notes}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                  Logged by: <span className="font-semibold text-slate-700">{note.actor}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredNotes.length === 0 && !loading && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs text-slate-400 text-xs">
              No notes found. Click &quot;Add Note&quot; to create a new client remark.
            </div>
          )}
        </div>
      </main>

      {/* Add Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Note / Remark</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Title / Topic *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Price discussion note"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Detailed Remarks *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Enter detailed client conversation or production instructions..."
                  value={newNote.notes}
                  onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
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
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
