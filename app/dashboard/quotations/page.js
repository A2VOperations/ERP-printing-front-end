'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Edit3,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Percent,
  Trash2,
  ArrowRight,
  ShieldAlert,
  Send,
  ShoppingBag,
  RotateCcw,
  Check,
  X,
  Share2,
  MessageCircle,
} from 'lucide-react';

const formatDate = (dateVal) => {
  if (!dateVal) return '-';
  try {
    return new Date(dateVal).toLocaleDateString('en-IN');
  } catch (e) {
    return '-';
  }
};

function QuotationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get('leadId') || '';
  const customerNameParam = searchParams.get('customerName') || '';
  const phoneParam = searchParams.get('phone') || '';

  const [quotations, setQuotations] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [currentTenant, setCurrentTenant] = useState(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('tenant') : null;
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => {
        if (res?.data?.user) setCurrentUser(res.data.user);
        else if (res?.data) setCurrentUser(res.data);
        if (res?.data?.tenant) setCurrentTenant(res.data.tenant);
      })
      .catch(() => {});
  }, []);

  const userRole = (currentUser?.roleSlug || currentUser?.role?.name || currentUser?.role || '').toUpperCase();
  const isCEOOrAdmin = ['ADMIN', 'SUPER_ADMIN', 'CEO', 'CEO_ADMIN'].includes(userRole);
  const isManager = ['SALES_MANAGER', 'MANAGER'].includes(userRole);

  // Create Modal State
  const [showBuilderModal, setShowBuilderModal] = useState(false);
  const [newQuote, setNewQuote] = useState({
    leadId: '',
    customerName: '',
    phone: '',
    items: [
      { title: 'Flex Banner 440 GSM', description: 'Outdoor Frontlit 10x4 ft', quantity: 1, rate: 1500, discountPercent: 0 },
    ],
    discountPercent: 0,
    validityDays: 15,
    notes: 'Standard turn-around 24-48 hours upon artwork approval.',
    termsAndConditions: '50% advance along with confirmed purchase order. Balance upon pre-dispatch delivery intimation.',
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editValidityDays, setEditValidityDays] = useState(15);
  const [editNotes, setEditNotes] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editIsRevision, setEditIsRevision] = useState(false);

  useEffect(() => {
    if (leadIdParam || customerNameParam || phoneParam) {
      setNewQuote((prev) => ({
        ...prev,
        leadId: leadIdParam || prev.leadId,
        customerName: customerNameParam || prev.customerName,
        phone: phoneParam || prev.phone,
      }));
      setShowBuilderModal(true);
    }
  }, [leadIdParam, customerNameParam, phoneParam]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/quotations?limit=100');
      if (res && res.data) {
        const list = Array.isArray(res.data) ? res.data : (res.data.records || []);
        setQuotations(list);
        if (list.length > 0) {
          setSelectedQuote((prev) => {
            if (!prev) return list[0];
            const found = list.find((q) => q._id === prev._id);
            return found || list[0];
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  // Creation Item Management
  const handleAddCreateItem = () => {
    setNewQuote({
      ...newQuote,
      items: [
        ...newQuote.items,
        { title: 'Visiting Cards Matte 350 GSM', description: 'Standard 3.5x2 in, Double Sided', quantity: 1000, rate: 1.5, discountPercent: 0 },
      ],
    });
  };

  const handleRemoveCreateItem = (index) => {
    setNewQuote({
      ...newQuote,
      items: newQuote.items.filter((_, idx) => idx !== index),
    });
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await api.post('/quotations', {
        leadId: newQuote.leadId || leadIdParam || undefined,
        customerName: newQuote.customerName,
        phone: newQuote.phone,
        items: newQuote.items.map((item) => ({
          title: item.title || item.product || 'Print Item',
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unitRatePaise: Math.round((Number(item.rate) || 0) * 100),
          discountPercent: Number(item.discountPercent || newQuote.discountPercent || 0),
        })),
        validityDays: Number(newQuote.validityDays) || 15,
        notes: newQuote.notes,
        termsAndConditions: newQuote.termsAndConditions,
      });

      setShowBuilderModal(false);
      setNewQuote({
        leadId: '',
        customerName: '',
        phone: '',
        items: [{ title: 'Flex Banner 440 GSM', description: 'Outdoor Frontlit 10x4 ft', quantity: 1, rate: 1500, discountPercent: 0 }],
        discountPercent: 0,
        validityDays: 15,
        notes: 'Standard turn-around 24-48 hours upon artwork approval.',
        termsAndConditions: '50% advance along with confirmed purchase order. Balance upon pre-dispatch delivery intimation.',
      });
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to create quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (quote) => {
    if (!quote) return;
    setEditingQuote(quote);
    const isEditable = quote.status === 'DRAFT' || quote.status === 'PENDING_DISCOUNT_APPROVAL';
    setEditIsRevision(!isEditable);

    const items = (quote.items || []).map((item) => ({
      title: item.title || 'Print Item',
      description: item.description || '',
      quantity: item.quantity || 1,
      rate: item.unitRatePaise ? item.unitRatePaise / 100 : (item.rate || 0),
      discountPercent: item.discountPercent || 0,
    }));

    setEditItems(items.length > 0 ? items : [{ title: 'Print Item', description: '', quantity: 1, rate: 100, discountPercent: 0 }]);
    setEditDiscountPercent(quote.overallDiscountPercent || 0);
    setEditValidityDays(15);
    setEditNotes(quote.notes || 'Standard turn-around 24-48 hours upon artwork approval.');
    setEditTerms(quote.termsAndConditions || '50% advance along with confirmed purchase order.');
    setShowEditModal(true);
  };

  const handleAddEditItem = () => {
    setEditItems([
      ...editItems,
      { title: 'Brochures A4 Trifold', description: '170 GSM Gloss, 4+4 Color', quantity: 500, rate: 12, discountPercent: 0 },
    ]);
  };

  const handleRemoveEditItem = (index) => {
    setEditItems(editItems.filter((_, idx) => idx !== index));
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingQuote) return;

    try {
      setActionLoading(true);
      const payload = {
        items: editItems.map((item) => ({
          title: item.title,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitRatePaise: Math.round((Number(item.rate) || 0) * 100),
          discountPercent: Number(item.discountPercent || 0),
        })),
        validityDays: Number(editValidityDays) || 15,
        notes: editNotes,
        termsAndConditions: editTerms,
      };

      if (editingQuote.status === 'DRAFT' || editingQuote.status === 'PENDING_DISCOUNT_APPROVAL') {
        await api.patch(`/quotations/${editingQuote._id}`, payload);
      } else {
        await api.post(`/quotations/${editingQuote._id}/revise`, payload);
      }

      setShowEditModal(false);
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to update quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Discount Approval / Rejection Handlers
  const handleDirectApproveDiscount = async (quote) => {
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/approve`, {
        notes: 'Discount approved by Manager/Admin.',
      });
      alert('Discount approved successfully! Status is now APPROVED (Ready to send).');
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to approve discount');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDirectRejectDiscount = async (quote, reason) => {
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/reject`, { reason });
      alert('Quotation discount rejected.');
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to reject discount');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Quotation to Client
  const handleSendQuotation = async (quote) => {
    if (!confirm(`Dispatch quotation ${quote.quotationNumber} to customer? Status will change to SENT.`)) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/quotations/${quote._id}/send`);
      alert(`Quotation dispatched to client successfully! Digital token acceptance link generated: ${res.data?.acceptanceUrl || ''}`);
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to send quotation');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Client Accepted
  const handleMarkClientAccepted = async (quote) => {
    if (!confirm(`Mark quotation ${quote.quotationNumber} as ACCEPTED by client? This will convert it to a Commercial Order.`)) return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/manual-accept`, {
        acceptanceSource: 'PHONE_CONFIRMATION',
        acceptanceEvidence: 'Client confirmed via call/WhatsApp',
      });
      alert('Quotation accepted! Commercial order has been generated.');
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to mark quotation accepted');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Client Declined (Not Accepted)
  const handleMarkNotAccepted = async (quote) => {
    const reason = prompt('Please enter reason why client declined:');
    if (!reason || !reason.trim()) return;
    try {
      setActionLoading(true);
      await api.post(`/quotations/${quote._id}/not-accepted`, { reason: reason.trim() });
      alert('Quotation marked NOT_ACCEPTED.');
      await fetchQuotations();
    } catch (err) {
      alert(err.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter list
  const filteredQuotes = quotations.filter((q) => {
    const qNum = (q.quotationNumber || '').toLowerCase();
    const cName = (q.customerSnapshot?.displayName || q.customerSnapshot?.companyName || q.customerName || '').toLowerCase();
    const matchesSearch = !searchQuery || qNum.includes(searchQuery.toLowerCase()) || cName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate live edit totals
  const editSubtotal = editItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.rate) || 0), 0);
  const editDiscountAmount = (editSubtotal * (Number(editDiscountPercent) || 0)) / 100;
  const editTaxable = editSubtotal - editDiscountAmount;
  const editGst = editTaxable * 0.18;
  const editGrandTotal = editTaxable + editGst;

  // Selected Quote Resolved Values
  const tenantName = currentTenant?.name || 'A2V PRINTING SOLUTIONS';
  const tenantTagline = currentTenant?.branding?.tagline || 'Commercial Printing & Packaging Solutions';
  const tenantPhone = currentTenant?.phone || '+91 98765 43210';
  const tenantEmail = currentTenant?.email || 'contact@a2vprinting.com';
  const tenantGstin = currentTenant?.gstin || '27AAAAA0000A1Z5';

  const snap = selectedQuote?.customerSnapshot || {};
  const clientDisplayName = snap.displayName || snap.companyName || selectedQuote?.customerName || 'Valued Customer';
  const clientCompany = snap.companyName && snap.companyName !== clientDisplayName ? snap.companyName : '';
  const clientContact = snap.contactPerson || (!clientCompany ? clientDisplayName : '');
  const clientPhone = snap.phone || selectedQuote?.phone || 'Not provided';
  const clientEmail = snap.email || 'Not provided';
  const clientGstin = snap.gstin || 'Unregistered';

  const salesRep = selectedQuote?.assignedSalesId || {};
  const salesRepName = salesRep.name || '';
  const salesRepEmail = salesRep.email || '';
  const salesRepPhone = salesRep.phone || '';

  const quoteCreatedAt = formatDate(selectedQuote?.createdAt);
  const quoteValidUntil = formatDate(selectedQuote?.validUntil);

  const subtotalVal = selectedQuote?.subtotalPaise !== undefined
    ? selectedQuote.subtotalPaise / 100
    : (selectedQuote?.items || []).reduce((sum, it) => sum + (it.grossAmountPaise ? it.grossAmountPaise / 100 : (Number(it.quantity) || 1) * (it.unitRatePaise ? it.unitRatePaise / 100 : (it.rate || 0))), 0);
  const discountVal = selectedQuote?.discountTotalPaise !== undefined
    ? selectedQuote.discountTotalPaise / 100
    : (selectedQuote?.items || []).reduce((sum, it) => sum + (it.discountAmountPaise ? it.discountAmountPaise / 100 : 0), 0);
  const taxableVal = selectedQuote?.taxableTotalPaise !== undefined
    ? selectedQuote.taxableTotalPaise / 100
    : subtotalVal - discountVal;
  const cgstVal = selectedQuote?.cgstTotalPaise !== undefined ? selectedQuote.cgstTotalPaise / 100 : 0;
  const sgstVal = selectedQuote?.sgstTotalPaise !== undefined ? selectedQuote.sgstTotalPaise / 100 : 0;
  const igstVal = selectedQuote?.igstTotalPaise !== undefined ? selectedQuote.igstTotalPaise / 100 : 0;
  const grandTotalVal = selectedQuote?.grandTotalPaise !== undefined
    ? selectedQuote.grandTotalPaise / 100
    : (selectedQuote?.totalAmount || (taxableVal + cgstVal + sgstVal + igstVal));

  const getStatusBadge = (st) => {
    switch (st) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SENT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-900 border-green-400 font-black';
      case 'PENDING_DISCOUNT_APPROVAL':
        return 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse';
      case 'NOT_ACCEPTED':
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Quotations &amp; Commercial Studio
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Discount approval governance (≤5% Direct, 5-15% Manager, &gt;15% Admin), send dispatch, and client acceptance
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchQuotations}
                disabled={loading}
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs transition-all"
                title="Refresh Quotations"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <button
                onClick={() => setShowBuilderModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm shadow-blue-600/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                + Create Quotation
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'ALL', label: 'All Quotations' },
              { id: 'APPROVED', label: 'Approved (Ready to Send)' },
              { id: 'PENDING_DISCOUNT_APPROVAL', label: 'Pending Discount Approval' },
              { id: 'SENT', label: 'Sent to Client' },
              { id: 'ACCEPTED', label: 'Accepted by Client' },
              { id: 'NOT_ACCEPTED', label: 'Not Accepted' },
              { id: 'REJECTED', label: 'Rejected' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Quotation List */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Proposals Collection</h3>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Showing {filteredQuotes.length} of {quotations.length} quotes
                  </span>
                </div>
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search quote #, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Quotations Cards */}
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {filteredQuotes.map((item) => {
                  const isSelected = selectedQuote?._id === item._id;
                  const total = (item.grandTotalPaise ? item.grandTotalPaise / 100 : item.totalAmount || 0).toLocaleString('en-IN');
                  const client = item.customerSnapshot?.displayName || item.customerSnapshot?.companyName || item.customerName || 'Direct Customer';

                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedQuote(item)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-blue-50/70 border-blue-400 shadow-xs ring-1 ring-blue-400/30'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-extrabold text-slate-900">
                              {item.quotationNumber || 'QT-DRAFT'}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              v{item.version || 1}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm mt-0.5 truncate max-w-[200px]">
                            {client}
                          </h4>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {formatDate(item.createdAt)} • {item.items?.length || 1} Items
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(item.status)}`}>
                          {item.status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500 text-[11px]">Grand Total</span>
                        <strong className="font-mono font-bold text-slate-900">₹{total}</strong>
                      </div>
                    </div>
                  );
                })}

                {filteredQuotes.length === 0 && !loading && (
                  <div className="p-12 text-center text-slate-400 text-xs space-y-2">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p>No matching quotations found.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Quotation Sheet & Action Center */}
            <div className="lg:col-span-7 space-y-6">
              {selectedQuote ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden animate-fade-in">
                  {/* Action Top Bar */}
                  <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        OFFICIAL QUOTATION
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-200">
                        {selectedQuote.quotationNumber} (v{selectedQuote.version || 1})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(selectedQuote)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-all"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        {selectedQuote.status === 'DRAFT' || selectedQuote.status === 'PENDING_DISCOUNT_APPROVAL' ? 'Edit Quotation' : 'Revise Version'}
                      </button>

                      <button
                        onClick={() => {
                          const cId = selectedQuote.customerId || selectedQuote.customerSnapshot?._id || selectedQuote.leadId || '';
                          const phone = selectedQuote.customerSnapshot?.phone || selectedQuote.customerPhone || '';
                          const quoteNo = selectedQuote.quotationNumber || '';
                          router.push(`/dashboard/whatsapp?customerId=${cId}&phone=${phone}&quoteNo=${quoteNo}&template=quotation_followup`);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                        title="Follow up / Share via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            await api.downloadPdf(
                              `/quotations/${selectedQuote._id}/pdf`,
                              `Quotation-${selectedQuote.quotationNumber || selectedQuote._id}.pdf`
                            );
                          } catch (err) {
                            alert(err.message || 'Failed to download PDF');
                          }
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PDF
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* LIFECYCLE ACTION BANNERS BASED ON QUOTATION STATUS */}

                  {/* 1. Pending Approval Banner */}
                  {selectedQuote.status === 'PENDING_DISCOUNT_APPROVAL' && (() => {
                    const discountVal = selectedQuote.overallDiscountPercent || Math.round((selectedQuote.governingDiscountBps || 0) / 100);
                    const isExceedingManagerLimit = discountVal > 15;
                    const canUserApprove = isCEOOrAdmin || (isManager && !isExceedingManagerLimit);

                    return (
                      <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                          <div>
                            <strong className="block text-amber-950 font-bold">
                              Discount Approval Required ({discountVal}% Concession):
                            </strong>
                            <span className="text-[11px] text-amber-800">
                              {isExceedingManagerLimit
                                ? 'Exceeds 15% manager limit — requires CEO / Admin authorization only.'
                                : 'Requires Manager / Admin authorization (5% to 15% discount).'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {canUserApprove ? (
                            <>
                              <button
                                onClick={() => handleDirectApproveDiscount(selectedQuote)}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                ✓ Approve Discount
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('Please enter rejection reason:');
                                  if (reason && reason.trim()) {
                                    handleDirectRejectDiscount(selectedQuote, reason.trim());
                                  }
                                }}
                                disabled={actionLoading}
                                className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all flex items-center gap-1"
                              >
                                <XCircle className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-300">
                              🔒 Requires Admin Approval (&gt;15%)
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Approved Banner (Ready to Send by Sales) */}
                  {selectedQuote.status === 'APPROVED' && (
                    <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-emerald-950 font-bold">
                            Quotation is Approved &amp; Ready to Send
                          </strong>
                          <span className="text-[11px] text-emerald-800">
                            Sales representative can now dispatch the official quotation to the customer.
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendQuotation(selectedQuote)}
                        disabled={actionLoading}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
                      >
                        <Send className="w-4 h-4" />
                        🚀 Send to Client
                      </button>
                    </div>
                  )}

                  {/* 3. Sent Banner (Awaiting Client Acceptance or Rejection) */}
                  {selectedQuote.status === 'SENT' && (
                    <div className="p-4 bg-blue-50 border-b border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <strong className="block text-blue-950 font-bold">
                            Quotation Sent to Client
                          </strong>
                          <span className="text-[11px] text-blue-800">
                            Awaiting client response. Record acceptance to convert into an active order.
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkClientAccepted(selectedQuote)}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          ✓ Client Accepted (Convert to Order)
                        </button>
                        <button
                          onClick={() => handleMarkNotAccepted(selectedQuote)}
                          disabled={actionLoading}
                          className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition-all flex items-center gap-1"
                        >
                          <X className="w-4 h-4" />
                          ✕ Not Accepted
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 4. Accepted Banner */}
                  {selectedQuote.status === 'ACCEPTED' && (
                    <div className="p-4 bg-green-50 border-b border-green-200 text-green-950 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            ✓ Quotation Accepted by Client
                          </strong>
                          <span className="text-[11px] text-green-800">
                            Commercial deal closed and order generated.
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/orders`}
                        className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        View in Orders →
                      </Link>
                    </div>
                  )}

                  {/* 5. Not Accepted / Rejected Banner */}
                  {(selectedQuote.status === 'NOT_ACCEPTED' || selectedQuote.status === 'REJECTED') && (
                    <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-950 text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <strong className="block font-bold">
                            {selectedQuote.status === 'NOT_ACCEPTED' ? 'Client Declined Quotation' : 'Quotation Discount Rejected'}
                          </strong>
                          <span className="text-[11px] text-rose-800">
                            {selectedQuote.rejectedReason || selectedQuote.rejectionReason || 'No reason specified.'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenEdit(selectedQuote)}
                        className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Revise Proposal
                      </button>
                    </div>
                  )}

                  {/* Formal Quotation Document Body (Mirroring the Official PDF Document) */}
                  <div className="p-6 md:p-8 space-y-6 text-xs text-slate-700 bg-white">
                    {/* Header Banner matching PDF */}
                    <div className="rounded-2xl p-5 md:p-6 bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black tracking-tight">{tenantName}</h2>
                        <p className="text-sky-100 text-xs mt-1 font-medium">{tenantTagline}</p>
                      </div>

                      <div className="text-left md:text-right bg-white/10 backdrop-blur-xs border border-white/20 px-4 py-2.5 rounded-xl space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-sky-200 block">
                          COMMERCIAL QUOTATION
                        </span>
                        <div className="font-mono font-bold text-white text-xs">
                          No: {selectedQuote.quotationNumber || 'QT-DRAFT'} (v{selectedQuote.version || 1})
                        </div>
                        <div className="text-[11px] text-sky-100">
                          Date Issued: {quoteCreatedAt}
                        </div>
                        <div className="text-[11px] text-sky-200 font-semibold">
                          Valid Until: {quoteValidUntil}
                        </div>
                      </div>
                    </div>

                    {/* Two-Column Seller & Client Particulars */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2 border-b border-slate-200">
                      {/* Seller (Left) */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          ISSUED BY:
                        </span>
                        <strong className="text-slate-900 text-sm block font-bold">{tenantName}</strong>
                        <div className="text-slate-600 text-xs">Phone: <span className="font-medium text-slate-800">{tenantPhone}</span></div>
                        <div className="text-slate-600 text-xs">Email: <span className="font-medium text-slate-800">{tenantEmail}</span></div>
                        <div className="text-slate-600 text-xs">GSTIN: <span className="font-mono font-semibold text-slate-800">{tenantGstin}</span></div>
                      </div>

                      {/* Customer (Right) */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                          PREPARED FOR:
                        </span>
                        <strong className="text-slate-900 text-sm block font-bold">{clientDisplayName}</strong>
                        {(clientCompany || clientContact) && (
                          <div className="text-slate-600 text-xs">
                            {clientCompany ? `Company: ${clientCompany}` : `Contact: ${clientContact}`}
                          </div>
                        )}
                        <div className="text-slate-600 text-xs">
                          Phone: <span className="font-medium text-slate-800">{clientPhone}</span>
                          {clientEmail && clientEmail !== 'Not provided' && (
                            <span> | Email: <span className="font-medium text-slate-800">{clientEmail}</span></span>
                          )}
                        </div>
                        <div className="text-slate-600 text-xs">GSTIN: <span className="font-mono font-semibold text-slate-800">{clientGstin}</span></div>
                        {salesRepName && (
                          <div className="text-[11px] text-slate-500 pt-0.5 border-t border-slate-200 mt-1">
                            Sales Rep: <strong className="text-slate-700">{salesRepName}</strong> {salesRepEmail && `(${salesRepEmail})`}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items Table matching PDF columns */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                            <th className="py-3 px-3 text-center w-10">#</th>
                            <th className="py-3 px-4">ITEM &amp; SPECIFICATIONS</th>
                            <th className="py-3 px-3 text-right">QTY</th>
                            <th className="py-3 px-3 text-right">RATE (₹)</th>
                            <th className="py-3 px-3 text-right">DISC (₹)</th>
                            <th className="py-3 px-3 text-right">TAXABLE (₹)</th>
                            <th className="py-3 px-3 text-right">TAX (₹)</th>
                            <th className="py-3 px-4 text-right">TOTAL (₹)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(selectedQuote.items || []).map((item, idx) => {
                            const qty = Number(item.quantity) || 1;
                            const unitRate = item.unitRatePaise !== undefined ? item.unitRatePaise / 100 : Number(item.rate || 0);
                            const gross = item.grossAmountPaise !== undefined ? item.grossAmountPaise / 100 : qty * unitRate;
                            const disc = item.discountAmountPaise !== undefined ? item.discountAmountPaise / 100 : (gross * Number(item.discountPercent || 0) / 100);
                            const taxable = item.taxableAmountPaise !== undefined ? item.taxableAmountPaise / 100 : (gross - disc);
                            const tax = item.taxAmountPaise !== undefined ? item.taxAmountPaise / 100 : (taxable * Number(item.taxRatePercent || 18) / 100);
                            const lineTotal = item.itemTotalPaise !== undefined ? item.itemTotalPaise / 100 : (taxable + tax);

                            const specs = [];
                            if (item.paperGsm) specs.push(`${item.paperGsm} GSM ${item.paperType || ''}`.trim());
                            if (item.width && item.height) specs.push(`${item.width}x${item.height} ${item.dimensionUnit || 'inch'}`);
                            if (item.printSides && item.printSides !== 'NA') specs.push(item.printSides === 'SINGLE' ? 'Single Side' : 'Double Side');
                            if (item.colors) specs.push(item.colors);
                            if (item.finishing?.length) specs.push(`Finishing: ${Array.isArray(item.finishing) ? item.finishing.join(', ') : item.finishing}`);

                            return (
                              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-3 text-center text-slate-400 font-mono font-medium">{idx + 1}</td>
                                <td className="py-3 px-4">
                                  <strong className="text-slate-900 block font-bold text-xs">{item.title || 'Print Item'}</strong>
                                  {item.description && (
                                    <span className="text-[11px] text-slate-500 block mt-0.5">{item.description}</span>
                                  )}
                                  {specs.length > 0 && (
                                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-1 font-medium border border-blue-100">
                                      {specs.join(' • ')}
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right font-semibold text-slate-800 font-mono">{qty}</td>
                                <td className="py-3 px-3 text-right font-mono text-slate-700">
                                  ₹{unitRate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-slate-600">
                                  {disc > 0 ? (
                                    <span>
                                      ₹{disc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      {item.discountPercent ? <span className="text-[10px] text-slate-400 block font-normal">({item.discountPercent}%)</span> : null}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                                  ₹{taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-3 text-right font-mono text-slate-600">
                                  ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  {item.taxRatePercent ? <span className="text-[10px] text-slate-400 block font-normal">({item.taxRatePercent}%)</span> : null}
                                </td>
                                <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                                  ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Totals & Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 items-start">
                      {/* Notes & Terms Box */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            SPECIAL NOTES / INSTRUCTIONS
                          </span>
                          <p className="text-slate-700 text-xs leading-relaxed">
                            {selectedQuote.notes || 'Standard turn-around 24-48 hours upon client artwork approval.'}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-0.5">
                            TERMS &amp; CONDITIONS
                          </span>
                          <p className="text-slate-600 text-[11px] leading-relaxed whitespace-pre-line">
                            {selectedQuote.termsAndConditions || '1. Quotation valid for 15 days from issuance.\n2. 50% advance along with purchase order. Balance prior to delivery.\n3. Custom manufactured materials cannot be cancelled once processed.'}
                          </p>
                          <div className="mt-2 text-[11px] font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-100 inline-block">
                            Valid Until: {quoteValidUntil}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Financial Totals + Signatory */}
                      <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 font-mono">
                          <div className="flex justify-between text-slate-600 text-xs">
                            <span>Subtotal (Gross):</span>
                            <span>₹{subtotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>

                          {discountVal > 0 && (
                            <div className="flex justify-between text-emerald-600 text-xs font-semibold">
                              <span>Total Discount ({selectedQuote.overallDiscountPercent || 0}%):</span>
                              <span>-₹{discountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-slate-800 text-xs font-bold pt-1.5 border-t border-slate-200">
                            <span>Taxable Amount:</span>
                            <span>₹{taxableVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>

                          {cgstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>CGST (9%):</span>
                              <span>₹{cgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {sgstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>SGST (9%):</span>
                              <span>₹{sgstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          {igstVal > 0 && (
                            <div className="flex justify-between text-slate-500 text-xs">
                              <span>IGST (18%):</span>
                              <span>₹{igstVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          )}

                          <div className="flex justify-between items-center text-slate-900 font-extrabold text-sm pt-2.5 border-t-2 border-slate-300 p-2 bg-sky-50/80 rounded-xl border border-sky-200">
                            <span className="text-xs uppercase tracking-wider font-black text-sky-950">GRAND TOTAL:</span>
                            <span className="text-base text-sky-700 font-black">
                              ₹{grandTotalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Signatory Box */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-right">
                          <span className="text-[11px] font-bold text-slate-800 block">For {tenantName}</span>
                          <span className="text-[10px] text-slate-400 block mt-5 uppercase tracking-wider font-semibold">
                            Authorized Commercial Signatory
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-400 text-xs space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-semibold text-slate-600 text-sm">Select a quotation to preview details</p>
                  <p>Choose an offer from the collection on the left or create a new quotation.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* CREATE QUOTATION MODAL */}
      {showBuilderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Create New Quotation</h3>
              </div>
              <button
                onClick={() => setShowBuilderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Customer / Business Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Retailers"
                    value={newQuote.customerName}
                    onChange={(e) => setNewQuote({ ...newQuote, customerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210"
                    value={newQuote.phone}
                    onChange={(e) => setNewQuote({ ...newQuote, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-800 font-bold">Line Items &amp; Specifications</label>
                  <button
                    type="button"
                    onClick={handleAddCreateItem}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Item
                  </button>
                </div>

                {newQuote.items.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Item Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Flex Banner 440 GSM"
                          value={item.title}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].title = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Specifications</label>
                        <input
                          type="text"
                          placeholder="e.g. 10x4 ft Frontlit"
                          value={item.description}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].description = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].quantity = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Unit Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.rate}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].rate = e.target.value;
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Discount (%):</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => {
                            const copy = [...newQuote.items];
                            copy[idx].discountPercent = Number(e.target.value);
                            setNewQuote({ ...newQuote, items: copy });
                          }}
                          className="w-20 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold"
                        />
                        {item.discountPercent > 15 ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🔒 Requires Admin Approval (&gt;15%)
                          </span>
                        ) : item.discountPercent > 5 ? (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Requires Manager Approval (5-15%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Direct Approved (≤5%)
                          </span>
                        )}
                      </div>

                      {newQuote.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCreateItem(idx)}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Validity (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuote.validityDays}
                    onChange={(e) => setNewQuote({ ...newQuote, validityDays: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-bold block mb-1">Turnaround &amp; Remarks</label>
                  <input
                    type="text"
                    value={newQuote.notes}
                    onChange={(e) => setNewQuote({ ...newQuote, notes: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilderModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {actionLoading ? 'Creating Quotation...' : 'Create Official Quotation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / REVISE QUOTATION MODAL */}
      {showEditModal && editingQuote && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  {editIsRevision ? `Revise Quotation (V${editingQuote.version + 1})` : `Edit Quotation ${editingQuote.quotationNumber}`}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-slate-800 font-bold">Line Items &amp; Pricing</label>
                  <button
                    type="button"
                    onClick={handleAddEditItem}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Item
                  </button>
                </div>

                {editItems.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Item Title</label>
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].title = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Specifications</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].description = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].quantity = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-semibold"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Unit Rate (₹)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.rate}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].rate = e.target.value;
                            setEditItems(copy);
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold">Discount (%):</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => {
                            const copy = [...editItems];
                            copy[idx].discountPercent = Number(e.target.value);
                            setEditItems(copy);
                          }}
                          className="w-20 px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold"
                        />
                        {item.discountPercent > 15 ? (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            🔒 Requires Admin Approval (&gt;15%)
                          </span>
                        ) : item.discountPercent > 5 ? (
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ⏳ Requires Manager Approval (5-15%)
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            ✓ Direct Approved (≤5%)
                          </span>
                        )}
                      </div>

                      {editItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveEditItem(idx)}
                          className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-600/20"
                >
                  {actionLoading ? 'Saving...' : editIsRevision ? 'Save New Revision' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <div className="p-16 text-center text-slate-400 text-xs my-auto">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
              Loading Quotations Studio...
            </div>
          </main>
        </div>
      }
    >
      <QuotationsContent />
    </Suspense>
  );
}
