"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/app/components/sidebar";
import Navbar from "@/app/components/navbar";
import { api } from "@/lib/api";
import {
  normalizeWhatsAppNumber,
  isValidWhatsAppNumber,
  formatPhoneForDisplay,
  buildWhatsAppUrl,
  openWhatsAppChat,
  MESSAGE_TEMPLATES,
  generateTemplateMessage,
} from "@/lib/whatsappUtils";
import {
  MessageCircle,
  Search,
  ExternalLink,
  Copy,
  Check,
  Building2,
  Phone,
  User,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  RotateCcw,
  Send,
  X,
  Plus,
} from "lucide-react";

function WhatsAppCommunicationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL Query Parameters
  const customerIdParam = searchParams.get("customerId") || "";
  const leadIdParam = searchParams.get("leadId") || "";
  const initialPhoneParam = searchParams.get("phone") || "";
  const initialQuoteNo = searchParams.get("quoteNo") || "";
  const initialOrderNo = searchParams.get("orderNo") || "";
  const initialTemplate = searchParams.get("template") || "quotation_followup";

  // Current logged in user info
  const [currentUser, setCurrentUser] = useState(null);

  // Search & Customers List
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [allContacts, setAllContacts] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Selected Customer/Lead State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [manualPhone, setManualPhone] = useState(initialPhoneParam);

  // Message Composer State
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplate);
  const [messageContent, setMessageContent] = useState("");
  const [quoteNo, setQuoteNo] = useState(initialQuoteNo);
  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [amount, setAmount] = useState("");

  // UI Feedback States
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [lastOpenedUrl, setLastOpenedUrl] = useState("");
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [chatOpenedSuccess, setChatOpenedSuccess] = useState(false);

  // CRM Conversation Note State
  const [noteType, setNoteType] = useState("WhatsApp");
  const [conversationNote, setConversationNote] = useState("");
  const [nextFollowupDate, setNextFollowupDate] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSavedSuccess, setNoteSavedSuccess] = useState(false);

  // 1. Load current logged-in user details
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          setCurrentUser(JSON.parse(stored));
        }
      } catch {}
    }
  }, []);

  // 2. Fetch initial CRM customers and leads for quick selection
  useEffect(() => {
    let isMounted = true;
    const fetchContacts = async () => {
      try {
        setLoadingInitial(true);
        const [leadsRes, customersRes] = await Promise.allSettled([
          api.get("/leads?limit=50", { silent: true }),
          api.get("/customers?limit=50", { silent: true }),
        ]);

        const combined = [];

        if (leadsRes.status === "fulfilled" && leadsRes.value?.data) {
          const lList = Array.isArray(leadsRes.value.data)
            ? leadsRes.value.data
            : leadsRes.value.data.leads || [];
          lList.forEach((l) => {
            combined.push({
              _id: l._id,
              type: "lead",
              name: l.contactName || l.businessName || "Lead Contact",
              company: l.companyName || l.businessName || "",
              phone: l.phone || l.contactPhone || "",
              whatsappNumber: l.phone || l.contactPhone || "",
              status: l.status || "NEW",
              leadId: l._id,
            });
          });
        }

        if (customersRes.status === "fulfilled" && customersRes.value?.data) {
          const cList = Array.isArray(customersRes.value.data)
            ? customersRes.value.data
            : customersRes.value.data.customers || [];
          cList.forEach((c) => {
            combined.push({
              _id: c._id,
              type: "customer",
              name:
                c.displayName || c.name || c.contactPersonName || "Customer",
              company: c.companyName || "",
              phone: c.phone || c.phoneNormalized || "",
              whatsappNumber: c.phone || c.phoneNormalized || "",
              status: c.status || "ACTIVE",
              customerId: c._id,
            });
          });
        }

        if (isMounted) {
          setAllContacts(combined);
        }
      } catch {
        // Suppress initial fetch errors
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    };

    fetchContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Resolve customer/lead from URL query parameters (?customerId=123 or ?leadId=123)
  useEffect(() => {
    let isMounted = true;
    const loadFromQuery = async () => {
      const targetId = customerIdParam || leadIdParam;
      if (!targetId) return;

      // Check if already in cached list
      const matched = allContacts.find(
        (c) =>
          c._id === targetId ||
          c.customerId === targetId ||
          c.leadId === targetId,
      );
      if (matched && isMounted) {
        setSelectedCustomer(matched);
        setManualPhone(matched.phone || "");
        return;
      }

      // Fetch individually if not in cache
      try {
        if (leadIdParam) {
          const res = await api.get(`/leads/${leadIdParam}`, { silent: true });
          const lead = res?.data;
          if (lead && isMounted) {
            const item = {
              _id: lead._id,
              type: "lead",
              name: lead.contactName || lead.businessName || "Lead Contact",
              company: lead.companyName || lead.businessName || "",
              phone: lead.phone || lead.contactPhone || initialPhoneParam,
              whatsappNumber:
                lead.phone || lead.contactPhone || initialPhoneParam,
              status: lead.status || "NEW",
              leadId: lead._id,
            };
            setSelectedCustomer(item);
            setManualPhone(item.phone);
          }
        } else if (customerIdParam) {
          const res = await api.get(`/customers/${customerIdParam}`, {
            silent: true,
          });
          const cust = res?.data;
          if (cust && isMounted) {
            const item = {
              _id: cust._id,
              type: "customer",
              name:
                cust.displayName ||
                cust.name ||
                cust.contactPersonName ||
                "Customer",
              company: cust.companyName || "",
              phone: cust.phone || cust.phoneNormalized || initialPhoneParam,
              whatsappNumber:
                cust.phone || cust.phoneNormalized || initialPhoneParam,
              status: cust.status || "ACTIVE",
              customerId: cust._id,
            };
            setSelectedCustomer(item);
            setManualPhone(item.phone);
          }
        }
      } catch {
        // Fallback with query parameters
        if (initialPhoneParam && isMounted) {
          setSelectedCustomer({
            _id: targetId,
            type: "customer",
            name: "Customer",
            company: "",
            phone: initialPhoneParam,
            whatsappNumber: initialPhoneParam,
          });
          setManualPhone(initialPhoneParam);
        }
      }
    };

    loadFromQuery();
    return () => {
      isMounted = false;
    };
  }, [customerIdParam, leadIdParam, allContacts, initialPhoneParam]);

  // 4. Update message content when template or customer details change
  const refreshMessageFromTemplate = useCallback(
    (tplId, customCustomer = selectedCustomer) => {
      const repName = currentUser?.name || currentUser?.fullName || "Ravinder";
      const custName = customCustomer?.name || "Valued Client";
      const compName = customCustomer?.company || "";

      const generated = generateTemplateMessage(tplId, {
        customerName: custName,
        companyName: compName,
        repName,
        quoteNo,
        orderNo,
        amount,
        customText: messageContent,
      });

      setMessageContent(generated);
    },
    [selectedCustomer, currentUser, quoteNo, orderNo, amount, messageContent],
  );

  // Trigger template update when template, customer, quote, or order changes
  useEffect(() => {
    if (selectedTemplate !== "custom") {
      refreshMessageFromTemplate(selectedTemplate);
    }
  }, [selectedTemplate, selectedCustomer?.name, quoteNo, orderNo, amount]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase().trim();
    const filtered = allContacts.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)),
    );
    setSearchResults(filtered);
  }, [searchQuery, allContacts]);

  // Handle selecting a customer from search
  const handleSelectCustomer = (item) => {
    setSelectedCustomer(item);
    setManualPhone(item.phone || "");
    setSearchQuery("");
    setSearchResults([]);
    setValidationError("");
    setChatOpenedSuccess(false);
    refreshMessageFromTemplate(selectedTemplate, item);
  };

  // Determine active phone number
  const activePhoneNumber = useMemo(() => {
    return manualPhone || selectedCustomer?.phone || "";
  }, [manualPhone, selectedCustomer]);

  // Normalized phone
  const cleanNormalizedPhone = useMemo(() => {
    return normalizeWhatsAppNumber(activePhoneNumber);
  }, [activePhoneNumber]);

  // Primary Action: Open WhatsApp Chat
  const handleOpenWhatsAppChat = () => {
    setValidationError("");
    setPopupBlocked(false);

    if (!activePhoneNumber.trim()) {
      setValidationError(
        "Please select a customer or enter a valid phone number.",
      );
      return;
    }

    if (!cleanNormalizedPhone || cleanNormalizedPhone.length < 10) {
      setValidationError(
        `Invalid phone number "${activePhoneNumber}". Please provide a 10-digit number or international number with country code.`,
      );
      return;
    }

    const res = openWhatsAppChat(cleanNormalizedPhone, messageContent);
    setLastOpenedUrl(res.url);

    if (res.blocked) {
      setPopupBlocked(true);
    } else {
      setChatOpenedSuccess(true);
    }
  };

  // Copy Number to Clipboard
  const handleCopyNumber = () => {
    if (!cleanNormalizedPhone) return;
    navigator.clipboard.writeText(cleanNormalizedPhone);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  // Copy Message to Clipboard
  const handleCopyMessage = () => {
    if (!messageContent) return;
    navigator.clipboard.writeText(messageContent);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  // Save Conversation Note to CRM
  const handleSaveConversationNote = async (e) => {
    e.preventDefault();
    if (!conversationNote.trim()) {
      alert("Please enter a conversation note before saving.");
      return;
    }

    setSavingNote(true);
    try {
      const custName = selectedCustomer?.name || "Customer";
      const custPhone = cleanNormalizedPhone || activePhoneNumber;
      const targetLeadId = selectedCustomer?.leadId || selectedCustomer?._id;

      // 1. If lead is linked, save note to lead's remarks
      if (selectedCustomer?.type === "lead" && targetLeadId) {
        await api.post(`/leads/${targetLeadId}/notes`, {
          content: `[${noteType}] ${conversationNote.trim()}`,
          category: "COMMUNICATION",
          isPinned: false,
        });
      }

      // 2. If next follow-up date is provided, create a scheduled follow-up
      if (nextFollowupDate) {
        await api.post("/followups", {
          title: `${noteType} Follow-up with ${custName}`,
          scheduledAt: new Date(nextFollowupDate).toISOString(),
          type: noteType.toUpperCase() === "WHATSAPP" ? "WHATSAPP" : "CALL",
          priority: "MEDIUM",
          notes: conversationNote.trim(),
          leadId: selectedCustomer?.type === "lead" ? targetLeadId : undefined,
          customerId:
            selectedCustomer?.type === "customer"
              ? selectedCustomer?._id
              : undefined,
        });
      }

      setNoteSavedSuccess(true);
      setConversationNote("");
      setTimeout(() => setNoteSavedSuccess(false), 4000);
    } catch (err) {
      alert(err.message || "Failed to save conversation note to CRM");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto w-full">
          {/* PAGE HEADER */}
          <div className="bg-white p-5 md:p-6 rounded-md border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                  WhatsApp Communication
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-normal">
                Communicate with customers through your existing WhatsApp
                account.
              </p>
            </div>

            {/* STATUS INDICATOR (Ready — no fake "Connected") */}
            <div className="flex items-center gap-2 self-start sm:self-center px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-xs font-semibold text-slate-700">
                ● Ready
              </span>
            </div>
          </div>

          {/* MAIN 2-COLUMN WORKSPACE (Desktop: 2 columns, Mobile: 1 column) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: Customer Selection & Information (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Search Customer Card */}
              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1.5">
                    Search Customer
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search customer, company or phone number..."
                      className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Results Dropdown List */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto bg-white shadow-sm">
                    {searchResults.map((item) => (
                      <button
                        key={`${item.type}-${item._id}`}
                        type="button"
                        onClick={() => handleSelectCustomer(item)}
                        className="w-full p-2.5 text-left hover:bg-blue-50/60 transition flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-800 truncate">
                            {item.name}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.company || "Direct Contact"}
                          </p>
                        </div>
                        <span className="font-mono text-[11px] text-slate-600 shrink-0 font-medium">
                          {item.phone || "No Phone"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Selected Customer Card Display */}
                {selectedCustomer ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Selected Customer
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {selectedCustomer.name}
                        </h3>
                        {selectedCustomer.company && (
                          <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {selectedCustomer.company}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setManualPhone("");
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold"
                        title="Clear customer selection"
                      >
                        Change
                      </button>
                    </div>

                    <div className="pt-2 border-t border-slate-200/70 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Phone Number
                        </span>
                        <p className="font-mono text-slate-800 font-semibold mt-0.5">
                          {selectedCustomer.phone || "Not recorded"}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          WhatsApp Number
                        </span>
                        <p className="font-mono text-slate-900 font-bold mt-0.5 text-sm">
                          {formatPhoneForDisplay(
                            cleanNormalizedPhone || selectedCustomer.phone,
                          ) || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyNumber}
                        disabled={!cleanNormalizedPhone}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {copiedNumber ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedNumber ? "Copied" : "Copy Number"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
                    <p className="text-xs font-medium text-slate-500">
                      Or enter customer phone number manually:
                    </p>
                    <div>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210 or 9876543210"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Context Details (Quote / Order Ref) */}
              <div className="bg-white rounded-md p-5 border border-slate-200/90 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  ERP Reference Tags (Optional)
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Quotation Number
                    </label>
                    <input
                      type="text"
                      value={quoteNo}
                      onChange={(e) => setQuoteNo(e.target.value)}
                      placeholder="e.g. QT-9021"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:border-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Order / Job Number
                    </label>
                    <input
                      type="text"
                      value={orderNo}
                      onChange={(e) => setOrderNo(e.target.value)}
                      placeholder="e.g. ORD-894"
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Message Composer & Main Action & Notes (7 Cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* MESSAGE COMPOSER */}
              <div className="bg-white rounded-md p-5 md:p-6 border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Message Template
                  </label>

                  {/* Template Dropdown */}
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      const tpl = e.target.value;
                      setSelectedTemplate(tpl);
                      refreshMessageFromTemplate(tpl);
                    }}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    {MESSAGE_TEMPLATES.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Editable Message Content Area */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 text-xs">
                    <span className="font-semibold text-slate-700">
                      Message Content
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      disabled={!messageContent}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium cursor-pointer disabled:opacity-50"
                    >
                      {copiedMessage ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedMessage ? "Copied" : "Copy Message"}</span>
                    </button>
                  </div>

                  <textarea
                    rows={5}
                    value={messageContent}
                    onChange={(e) => {
                      setMessageContent(e.target.value);
                      if (selectedTemplate !== "custom") {
                        setSelectedTemplate("custom");
                      }
                    }}
                    placeholder="Write your customer message here..."
                    className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-sans"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>
                      You can edit the message before opening WhatsApp.
                    </span>
                    <span>{messageContent.length} characters</span>
                  </div>
                </div>

                {/* Validation Error Alert */}
                {validationError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Popup Blocked Warning & Direct Link Fallback */}
                {popupBlocked && lastOpenedUrl && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                    <p className="font-bold">
                      Your browser blocked the popup tab.
                    </p>
                    <a
                      href={lastOpenedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-blue-700 font-bold hover:underline"
                    >
                      <span>Click here to open WhatsApp directly</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Chat Launched Notice */}
                {chatOpenedSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      WhatsApp chat opened in a new tab. Send your message and
                      record conversation notes below.
                    </span>
                  </div>
                )}

                {/* MAIN ACTION: OPEN WHATSAPP CHAT */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleOpenWhatsAppChat}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Open WhatsApp Chat</span>
                  </button>
                  <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                    Opens standard WhatsApp Web/App via{" "}
                    <span className="font-mono text-slate-500">
                      https://wa.me/
                    </span>{" "}
                    link in a new tab.
                  </p>
                </div>
              </div>

              {/* CRM CONVERSATION NOTES SECTION */}
              <form
                onSubmit={handleSaveConversationNote}
                className="bg-white rounded-md p-5 md:p-6 border border-slate-200/90 shadow-xs space-y-4"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Add Conversation Note
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Record summary of communication into the CRM lead/customer
                    history.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Conversation Type
                    </label>
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Call">Call</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Email">Email</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Next Follow-up (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={nextFollowupDate}
                      onChange={(e) => setNextFollowupDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Note & Key Points Discussed
                  </label>
                  <textarea
                    rows={3}
                    value={conversationNote}
                    onChange={(e) => setConversationNote(e.target.value)}
                    placeholder="Enter key customer feedback, next steps, or order requirements discussed..."
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl leading-relaxed text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                {noteSavedSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Conversation note recorded in CRM successfully.</span>
                  </div>
                )}

                <div className="pt-1 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={savingNote || !conversationNote.trim()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {savingNote ? "Saving..." : "Save Conversation"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WhatsAppPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-[#F8FAFC] items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WhatsAppCommunicationContent />
    </Suspense>
  );
}
