'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Users,
} from 'lucide-react';

export default function AreasTerritoriesPage() {
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form State
  const [newArea, setNewArea] = useState({
    name: '',
    code: '',
    city: 'Delhi NCR',
    state: 'Delhi',
    managerId: '',
  });

  const [selectedArea, setSelectedArea] = useState(null);

  const fetchAreasData = async () => {
    try {
      setLoading(true);
      const [aRes, uRes] = await Promise.allSettled([
        api.get('/areas'),
        api.get('/users'),
      ]);

      if (aRes.status === 'fulfilled' && aRes.value?.data) {
        setAreas(aRes.value.data);
      }
      if (uRes.status === 'fulfilled' && uRes.value?.data) {
        const rawUsers = Array.isArray(uRes.value.data) ? uRes.value.data : [];
        setAssignableUsers(rawUsers.filter((u) => u.status !== 'INACTIVE' && u.isActive !== false));
      }
    } catch (err) {
      if (err?.message?.includes('403')) {
        setIsAuthorized(false);
      }
      console.error('Failed to fetch areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAreasData();
  }, []);

  const handleCreateArea = async (e) => {
    e.preventDefault();
    try {
      await api.post('/areas', {
        name: newArea.name.trim(),
        code: (newArea.code || newArea.name.slice(0, 4)).trim().toUpperCase(),
        city: newArea.city.trim(),
        state: newArea.state?.trim() || '',
        managerId: newArea.managerId && newArea.managerId !== '' ? newArea.managerId : null,
      });
      setShowCreateModal(false);
      setNewArea({ name: '', code: '', city: 'Delhi NCR', state: 'Delhi', managerId: '' });
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to create area');
    }
  };

  const handleUpdateArea = async (e) => {
    e.preventDefault();
    if (!selectedArea) return;
    try {
      await api.patch(`/areas/${selectedArea._id}`, {
        name: selectedArea.name.trim(),
        code: selectedArea.code ? selectedArea.code.trim().toUpperCase() : undefined,
        city: selectedArea.city?.trim(),
        state: selectedArea.state?.trim() || '',
        managerId: selectedArea.managerId && selectedArea.managerId !== '' ? selectedArea.managerId : null,
      });
      setShowEditModal(false);
      setSelectedArea(null);
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to update area');
    }
  };

  const handleDeleteArea = async (id) => {
    if (!confirm('Are you sure you want to delete this territory?')) return;
    try {
      await api.delete(`/areas/${id}`);
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to delete area');
    }
  };

  const filteredAreas = areas.filter(
    (a) =>
      !searchQuery ||
      (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.code || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                <MapPin className="w-6 h-6 text-teal-600" />
                Areas & Sales Territories Master
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Geographic zone boundaries, territory codes, and sales representative / branch allocations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAreasData}
                disabled={loading}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm shadow-teal-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Territory
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search territory by name, code, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 shadow-xs"
            />
          </div>

          {/* Areas Table */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="pb-3">Territory / Area</th>
                    <th className="pb-3">Code</th>
                    <th className="pb-3">City / State</th>
                    <th className="pb-3">Assigned Sales Rep / Manager</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">{a.name}</td>
                        <td className="py-3.5 font-mono text-[11px] text-teal-700 font-bold">{a.code || 'TERR'}</td>
                        <td className="py-3.5 text-slate-600">{a.city || 'Delhi'}, {a.state || 'Delhi'}</td>
                        <td className="py-3.5 text-slate-600">
                          {(() => {
                            if (a.managerId && typeof a.managerId === 'object' && a.managerId.name) {
                              return (
                                <div>
                                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                                    {a.managerId.name}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {(a.managerId.roleSlug || a.managerId.role || 'Sales Rep').toUpperCase()} • {a.managerId.email}
                                  </span>
                                </div>
                              );
                            }
                            const rawId = typeof a.managerId === 'object' ? a.managerId?._id : a.managerId;
                            const foundUser = rawId ? assignableUsers.find((u) => u._id === rawId) : null;
                            if (foundUser) {
                              return (
                                <div>
                                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                                    {foundUser.name}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 font-normal">
                                    {(foundUser.roleSlug || foundUser.role || 'Sales Rep').toUpperCase()} • {foundUser.email}
                                  </span>
                                </div>
                              );
                            }
                            if (a.managerName) {
                              return <span className="font-semibold text-slate-800">{a.managerName}</span>;
                            }
                            return (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic bg-slate-100 px-2 py-0.5 rounded-md">
                                Unassigned
                              </span>
                            );
                          })()}
                        </td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                            ACTIVE
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedArea({
                                  ...a,
                                  managerId:
                                    a.managerId?._id ||
                                    (typeof a.managerId === 'string' ? a.managerId : '') ||
                                    '',
                                });
                                setShowEditModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 cursor-pointer"
                              title="Edit Area"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteArea(a._id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 cursor-pointer"
                              title="Delete Area"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No territories configured. Click &quot;Add Territory&quot; to define a sales area.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Area Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Sales Territory</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Territory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Delhi Zone"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Territory Code</label>
                  <input
                    type="text"
                    placeholder="NDEL"
                    value={newArea.code}
                    onChange={(e) => setNewArea({ ...newArea, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newArea.city}
                    onChange={(e) => setNewArea({ ...newArea, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">State</label>
                <input
                  type="text"
                  value={newArea.state}
                  onChange={(e) => setNewArea({ ...newArea, state: e.target.value })}
                  placeholder="e.g. Delhi, Haryana, UP"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">Assigned Sales Representative / Manager</label>
                <select
                  value={newArea.managerId}
                  onChange={(e) => setNewArea({ ...newArea, managerId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Unassigned (None) --</option>
                  {assignableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({(u.roleSlug || u.role || 'sales').toUpperCase()}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Save Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Area Modal */}
      {showEditModal && selectedArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Edit Territory</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateArea} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Territory Name *</label>
                <input
                  type="text"
                  required
                  value={selectedArea.name}
                  onChange={(e) => setSelectedArea({ ...selectedArea, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Territory Code *</label>
                  <input
                    type="text"
                    required
                    value={selectedArea.code || ''}
                    onChange={(e) => setSelectedArea({ ...selectedArea, code: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={selectedArea.city || ''}
                    onChange={(e) => setSelectedArea({ ...selectedArea, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">State</label>
                <input
                  type="text"
                  value={selectedArea.state || ''}
                  onChange={(e) => setSelectedArea({ ...selectedArea, state: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold block mb-1">
                  Assigned Sales Representative / Manager
                </label>
                <select
                  value={selectedArea.managerId || ''}
                  onChange={(e) => setSelectedArea({ ...selectedArea, managerId: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                >
                  <option value="">-- Unassigned (None) --</option>
                  {assignableUsers.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({(u.roleSlug || u.role || 'sales').toUpperCase()}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold shadow-md shadow-teal-600/20 cursor-pointer"
                >
                  Update Territory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
