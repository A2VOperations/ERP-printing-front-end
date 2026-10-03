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
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export default function AreasTerritoriesPage() {
  const router = useRouter();
  const [areas, setAreas] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
    zones: [],
  });
  const [isCodeManual, setIsCodeManual] = useState(false);

  const [createZoneInput, setCreateZoneInput] = useState('');
  const [createZoneRep, setCreateZoneRep] = useState('');

  const [selectedArea, setSelectedArea] = useState(null);
  const [editZoneInput, setEditZoneInput] = useState('');
  const [editZoneRep, setEditZoneRep] = useState('');

  // Quick inline zone add state
  const [quickZoneAreaId, setQuickZoneAreaId] = useState(null);
  const [quickZoneName, setQuickZoneName] = useState('');
  const [quickZoneRep, setQuickZoneRep] = useState('');
  const [isSubmittingQuickZone, setIsSubmittingQuickZone] = useState(false);

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
      console.error('Failed to fetch areas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [aRes, uRes] = await Promise.allSettled([
          api.get('/areas'),
          api.get('/users'),
        ]);
        if (!ignore) {
          if (aRes.status === 'fulfilled' && aRes.value?.data) {
            setAreas(aRes.value.data);
          }
          if (uRes.status === 'fulfilled' && uRes.value?.data) {
            const rawUsers = Array.isArray(uRes.value.data) ? uRes.value.data : [];
            setAssignableUsers(rawUsers.filter((u) => u.status !== 'INACTIVE' && u.isActive !== false));
          }
        }
      } catch (err) {
        console.error('Failed to load initial areas:', err);
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleAddZoneToNew = () => {
    if (!createZoneInput.trim()) return;
    const repUser = assignableUsers.find((u) => u._id === createZoneRep);
    const newZoneItem = {
      name: createZoneInput.trim(),
      code: createZoneInput.trim().slice(0, 4).toUpperCase(),
      assignedSalesId: createZoneRep || null,
      assignedSalesUser: repUser ? { name: repUser.name, email: repUser.email } : null,
    };
    setNewArea((prev) => ({
      ...prev,
      zones: [...(prev.zones || []), newZoneItem],
    }));
    setCreateZoneInput('');
    setCreateZoneRep('');
  };

  const handleRemoveZoneFromNew = (index) => {
    setNewArea((prev) => ({
      ...prev,
      zones: prev.zones.filter((_, idx) => idx !== index),
    }));
  };

  const handleAddZoneToEdit = () => {
    if (!editZoneInput.trim() || !selectedArea) return;
    const repUser = assignableUsers.find((u) => u._id === editZoneRep);
    const newZoneItem = {
      name: editZoneInput.trim(),
      code: editZoneInput.trim().slice(0, 4).toUpperCase(),
      assignedSalesId: editZoneRep || null,
      assignedSalesUser: repUser ? { name: repUser.name, email: repUser.email } : null,
    };
    setSelectedArea((prev) => ({
      ...prev,
      zones: [...(prev.zones || []), newZoneItem],
    }));
    setEditZoneInput('');
    setEditZoneRep('');
  };

  const handleRemoveZoneFromEdit = (index) => {
    if (!selectedArea) return;
    setSelectedArea((prev) => ({
      ...prev,
      zones: (prev.zones || []).filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    const trimmedName = newArea.name.trim();
    if (trimmedName.length < 2) {
      alert('Area name must be at least 2 characters');
      return;
    }

    try {
      let code = (newArea.code || '').trim().toUpperCase();
      if (code.length < 2) {
        const cleanName = trimmedName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        code = (cleanName.slice(0, 4) || 'AR').padEnd(2, '0');
      }

      // Collect all zones plus any pending zone input
      const combinedZones = [...(newArea.zones || [])];
      if (createZoneInput.trim()) {
        combinedZones.push({
          name: createZoneInput.trim(),
          code: createZoneInput.trim().slice(0, 4).toUpperCase(),
          assignedSalesId: createZoneRep || null,
        });
      }

      const validZones = combinedZones
        .map((z) => ({
          name: (z.name || '').trim(),
          code: (z.code || '').trim() || (z.name || '').slice(0, 4).toUpperCase(),
          assignedSalesId:
            (typeof z.assignedSalesId === 'object' ? z.assignedSalesId?._id : z.assignedSalesId) || null,
        }))
        .filter((z) => z.name.length > 0);

      await api.post('/areas', {
        name: trimmedName,
        code,
        city: (newArea.city || 'Delhi NCR').trim(),
        state: (newArea.state || 'Delhi').trim(),
        managerId: newArea.managerId && newArea.managerId !== '' ? newArea.managerId : null,
        zones: validZones,
      });

      setShowCreateModal(false);
      setIsCodeManual(false);
      setNewArea({ name: '', code: '', city: 'Delhi NCR', state: 'Delhi', managerId: '', zones: [] });
      setCreateZoneInput('');
      setCreateZoneRep('');
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to create area');
    }
  };

  const handleUpdateArea = async (e) => {
    e.preventDefault();
    if (!selectedArea) return;
    const trimmedName = (selectedArea.name || '').trim();
    if (trimmedName.length < 2) {
      alert('Area name must be at least 2 characters');
      return;
    }

    try {
      let code = selectedArea.code ? selectedArea.code.trim().toUpperCase() : undefined;
      if (code && code.length < 2) {
        code = code.padEnd(2, '0');
      }

      const combinedZones = [...(selectedArea.zones || [])];
      if (editZoneInput.trim()) {
        combinedZones.push({
          name: editZoneInput.trim(),
          code: editZoneInput.trim().slice(0, 4).toUpperCase(),
          assignedSalesId: editZoneRep || null,
        });
      }

      const validZones = combinedZones
        .map((z) => ({
          _id: z._id || undefined,
          name: (z.name || '').trim(),
          code: (z.code || '').trim() || (z.name || '').slice(0, 4).toUpperCase(),
          assignedSalesId:
            (typeof z.assignedSalesId === 'object' ? z.assignedSalesId?._id : z.assignedSalesId) || null,
        }))
        .filter((z) => z.name.length > 0);

      await api.patch(`/areas/${selectedArea._id}`, {
        name: trimmedName,
        code,
        city: (selectedArea.city || 'Delhi NCR').trim(),
        state: (selectedArea.state || 'Delhi').trim(),
        managerId: selectedArea.managerId && selectedArea.managerId !== '' ? selectedArea.managerId : null,
        zones: validZones,
      });

      setShowEditModal(false);
      setSelectedArea(null);
      setEditZoneInput('');
      setEditZoneRep('');
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to update area');
    }
  };

  const handleQuickAddZone = async (areaId) => {
    if (!quickZoneName.trim()) return;
    try {
      setIsSubmittingQuickZone(true);
      await api.post(`/areas/${areaId}/zones`, {
        name: quickZoneName.trim(),
        code: quickZoneName.trim().slice(0, 4).toUpperCase(),
        assignedSalesId: quickZoneRep || null,
      });
      setQuickZoneAreaId(null);
      setQuickZoneName('');
      setQuickZoneRep('');
      fetchAreasData();
    } catch (err) {
      alert(err.message || 'Failed to add zone');
    } finally {
      setIsSubmittingQuickZone(false);
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
      (a.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(a.zones) && a.zones.some((z) => (z.name || '').toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 mx-auto w-full">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <MapPin className="w-6 h-6 text-teal-600" />
                Areas & Zones Master
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Create and configure geographical areas and zones for data operator field capture & sales territory routing
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
                onClick={() => {
                  setIsCodeManual(false);
                  setNewArea({ name: '', code: '', city: 'Delhi NCR', state: 'Delhi', managerId: '', zones: [] });
                  setCreateZoneInput('');
                  setCreateZoneRep('');
                  setShowCreateModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm shadow-teal-600/25 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Area & Zones
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by area name, code, zone, or city..."
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
                    <th className="pb-3">Zones & Sub-Localities</th>
                    <th className="pb-3">Area Manager</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredAreas.length > 0 ? (
                    filteredAreas.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-xs">
                              {a.name?.slice(0, 2).toUpperCase()}
                            </span>
                            <span>{a.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-[11px] text-teal-700 font-bold">{a.code || 'TERR'}</td>
                        <td className="py-3.5 text-slate-600">{a.city || 'Delhi'}, {a.state || 'Delhi'}</td>
                        <td className="py-3.5 max-w-sm">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap gap-1.5 items-center">
                              {Array.isArray(a.zones) && a.zones.length > 0 ? (
                                a.zones.map((z, zIdx) => {
                                  const repName = z.assignedSalesId?.name || (typeof z.assignedSalesId === 'string' ? z.assignedSalesId : '');
                                  return (
                                    <span
                                      key={z._id || zIdx}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-200 transition-colors"
                                      title={repName ? `Assigned to: ${repName}` : 'Unassigned'}
                                    >
                                      <Compass className="w-3 h-3 text-teal-600" />
                                      <span className="font-semibold">{z.name}</span>
                                      {repName && (
                                        <span className="text-[9px] text-teal-600 bg-teal-100/60 px-1 py-0.2 rounded font-normal">
                                          {repName}
                                        </span>
                                      )}
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">No zones configured</span>
                              )}

                              {quickZoneAreaId !== a._id && (
                                <button
                                  onClick={() => {
                                    setQuickZoneAreaId(a._id);
                                    setQuickZoneName('');
                                    setQuickZoneRep('');
                                  }}
                                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-semibold border border-teal-200/80 cursor-pointer"
                                  title="Quick Add Zone"
                                >
                                  <Plus className="w-2.5 h-2.5" /> Zone
                                </button>
                              )}
                            </div>

                            {/* Inline Quick Add Zone Input */}
                            {quickZoneAreaId === a._id && (
                              <div className="flex items-center gap-1.5 pt-1 animate-scale-up">
                                <input
                                  type="text"
                                  placeholder="Zone name (e.g. Baba Colony)"
                                  value={quickZoneName}
                                  onChange={(e) => setQuickZoneName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleQuickAddZone(a._id);
                                    }
                                  }}
                                  className="px-2 py-1 text-[11px] rounded-lg border border-teal-300 bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 w-36"
                                  autoFocus
                                />
                                <select
                                  value={quickZoneRep}
                                  onChange={(e) => setQuickZoneRep(e.target.value)}
                                  className="px-1.5 py-1 text-[10px] rounded-lg border border-slate-200 bg-white focus:outline-none"
                                >
                                  <option value="">Rep (Optional)</option>
                                  {assignableUsers.map((u) => (
                                    <option key={u._id} value={u._id}>{u.name}</option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => handleQuickAddZone(a._id)}
                                  disabled={isSubmittingQuickZone}
                                  className="px-2 py-1 text-[10px] bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 cursor-pointer"
                                >
                                  Add
                                </button>
                                <button
                                  onClick={() => setQuickZoneAreaId(null)}
                                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
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
                                  zones: Array.isArray(a.zones) ? [...a.zones] : [],
                                });
                                setEditZoneInput('');
                                setEditZoneRep('');
                                setShowEditModal(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 cursor-pointer"
                              title="Edit Area & Zones"
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
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No territories configured. Click &quot;Add Area & Zones&quot; to define an area and its zones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Create Area & Zones Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Area & Zones</h3>
                <p className="text-[11px] text-slate-500">Configure new geographical area and sub-locality zones</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Area / Territory Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Burari, Rohini, Civil Lines"
                  value={newArea.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name
                      .replace(/[^A-Za-z0-9]/g, '')
                      .slice(0, 4)
                      .toUpperCase();
                    setNewArea((prev) => ({
                      ...prev,
                      name,
                      code: isCodeManual ? prev.code : autoCode,
                    }));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Territory Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="BUR"
                    value={newArea.code}
                    onChange={(e) => {
                      setIsCodeManual(true);
                      setNewArea((prev) => ({ ...prev, code: e.target.value.toUpperCase() }));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newArea.city}
                    onChange={(e) => setNewArea((prev) => ({ ...prev, city: e.target.value }))}
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
                <label className="text-slate-700 font-semibold block mb-1">Overall Area Manager (Optional)</label>
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

              {/* Zones Configuration Section */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-teal-600" />
                    Zones / Sub-Localities
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {(newArea.zones || []).length} zone(s) added
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Data operators will select from these zones when capturing leads. You can also assign a dedicated sales executive to each zone!
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter zone name (e.g. Baba Colony, Sector 3)"
                    value={createZoneInput}
                    onChange={(e) => setCreateZoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddZoneToNew();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                  />
                  <select
                    value={createZoneRep}
                    onChange={(e) => setCreateZoneRep(e.target.value)}
                    className="w-36 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] focus:outline-none"
                  >
                    <option value="">Assign Rep</option>
                    {assignableUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddZoneToNew}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                {/* List of Added Zones */}
                <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                  {(newArea.zones || []).length > 0 ? (
                    newArea.zones.map((z, idx) => {
                      const repUser = assignableUsers.find((u) => u._id === z.assignedSalesId);
                      return (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs border border-teal-200 font-medium"
                        >
                          <CheckCircle2 className="w-3 h-3 text-teal-600" />
                          <span>{z.name}</span>
                          {repUser && (
                            <span className="text-[10px] text-teal-600 font-normal">
                              ({repUser.name})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveZoneFromNew(idx)}
                            className="text-teal-400 hover:text-rose-600 cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      No zones added yet. Type a zone name and click Add.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                  Save Area & Zones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Area & Zones Modal */}
      {showEditModal && selectedArea && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Edit Area & Zones</h3>
                <p className="text-[11px] text-slate-500">Update area details and configure its zones</p>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleUpdateArea} className="space-y-4 text-xs">
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

              {/* Zones Configuration in Edit Modal */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-800 font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-teal-600" />
                    Manage Zones / Sub-Localities
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {(selectedArea.zones || []).length} zone(s)
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new zone (e.g. Baba Colony)"
                    value={editZoneInput}
                    onChange={(e) => setEditZoneInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddZoneToEdit();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:outline-none focus:border-teal-500"
                  />
                  <select
                    value={editZoneRep}
                    onChange={(e) => setEditZoneRep(e.target.value)}
                    className="w-36 px-2 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-[11px] focus:outline-none"
                  >
                    <option value="">Assign Rep</option>
                    {assignableUsers.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddZoneToEdit}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-1 max-h-36 overflow-y-auto">
                  {(selectedArea.zones || []).length > 0 ? (
                    selectedArea.zones.map((z, idx) => {
                      const repId = typeof z.assignedSalesId === 'object' ? z.assignedSalesId?._id : z.assignedSalesId;
                      const repUser = assignableUsers.find((u) => u._id === repId) || (typeof z.assignedSalesId === 'object' ? z.assignedSalesId : null);
                      return (
                        <span
                          key={z._id || idx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs border border-teal-200 font-medium"
                        >
                          <Compass className="w-3 h-3 text-teal-600" />
                          <span>{z.name}</span>
                          {repUser?.name && (
                            <span className="text-[10px] text-teal-600 font-normal">
                              ({repUser.name})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveZoneFromEdit(idx)}
                            className="text-teal-400 hover:text-rose-600 cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      No zones configured yet.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                  Update Area & Zones
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
