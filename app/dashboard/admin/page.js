'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/app/components/sidebar';
import Navbar from '@/app/components/navbar';
import { api } from '@/lib/api';
import {
  Search,
  Bell,
  Menu,
  Calendar,
  ChevronDown,
  Users,
  FileText,
  Package,
  CreditCard,
  Palette,
  Settings,
  CheckCircle2,
  Truck,
  Box,
  BarChart3,
  AlertTriangle,
  Flame,
  Clock,
  Wrench,
  CheckSquare,
  RefreshCw,
  Plus,
  ShieldCheck,
  Layers,
  UserPlus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  X,
  ExternalLink,
  Building2,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userRoleDisplay, setUserRoleDisplay] = useState('Super Admin');
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');

  // Timeframe Filters
  const [salesTimeframe, setSalesTimeframe] = useState('This Month'); // 'Today' | 'This Week' | 'This Month' | 'All Time'
  const [orderFilter, setOrderFilter] = useState('All Orders'); // 'All Orders' | 'In Progress' | 'Completed' | 'Overdue'
  const [financeTimeframe, setFinanceTimeframe] = useState('This Month'); // 'Today' | 'This Week' | 'This Month' | 'All Time'
  const [teamTimeframe, setTeamTimeframe] = useState('This Month'); // 'Today' | 'This Week' | 'This Month' | 'All Time'
  const [teamTab, setTeamTab] = useState('SALES'); // 'SALES' | 'DESIGN'

  // Dropdown Open States
  const [openDropdown, setOpenDropdown] = useState(null); // 'sales' | 'order' | 'finance' | 'team' | null

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // Raw Real API Datasets
  const [leads, setLeads] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [recSummary, setRecSummary] = useState(null);
  const [designProjects, setDesignProjects] = useState([]);
  const [productionJobs, setProductionJobs] = useState([]);
  const [prodMetrics, setProdMetrics] = useState(null);
  const [deliveryJobs, setDeliveryJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers] = useState([]);

  // Live dynamic clock and greeting
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
      const hour = now.getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch logged in user info
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('userName');
      const storedRole = (localStorage.getItem('userRole') || 'admin').toLowerCase();
      if (storedName) {
        setUserName(storedName.split(' ')[0] || storedName);
      }
      if (storedRole === 'admin' || storedRole === 'super_admin') setUserRoleDisplay('Super Admin');
      else if (storedRole === 'ceo_admin') setUserRoleDisplay('CEO / Executive');
      else if (storedRole === 'manager') setUserRoleDisplay('Operations Manager');
      else setUserRoleDisplay(storedRole.toUpperCase());
    } catch (e) {}
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchResults(false);
      }
      setOpenDropdown(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch all live backend data concurrently
  const loadDashboardData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const [
        leadsRes,
        quotesRes,
        ordersRes,
        recSumRes,
        designsRes,
        prodJobsRes,
        prodMetricsRes,
        deliveryRes,
        paymentsRes,
        leaderRes,
        auditsRes,
        usersRes,
      ] = await Promise.allSettled([
        api.get('/leads?limit=150'),
        api.get('/quotations?limit=100'),
        api.get('/orders?limit=100'),
        api.get('/receivables/summary'),
        api.get('/design-projects?limit=100'),
        api.get('/production-jobs?limit=100'),
        api.get('/production-jobs/metrics'),
        api.get('/delivery-jobs?limit=100'),
        api.get('/payments?limit=100'),
        api.get('/targets/leaderboard?timeframe=month'),
        api.get('/audit-logs?limit=15'),
        api.get('/users'),
      ]);

      if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
        const raw = leadsRes.value.data;
        setLeads(Array.isArray(raw) ? raw : (raw.records || raw.leads || []));
      }
      if (quotesRes.status === 'fulfilled' && quotesRes.value?.data) {
        const raw = quotesRes.value.data;
        setQuotations(Array.isArray(raw) ? raw : (raw.items || raw.records || []));
      }
      if (ordersRes.status === 'fulfilled' && ordersRes.value?.data) {
        const raw = ordersRes.value.data;
        setOrders(Array.isArray(raw) ? raw : (raw.items || raw.records || []));
      }
      if (recSumRes.status === 'fulfilled' && recSumRes.value?.data) {
        setRecSummary(recSumRes.value.data?.summary || recSumRes.value.data || null);
      }
      if (designsRes.status === 'fulfilled' && designsRes.value?.data) {
        const raw = designsRes.value.data;
        setDesignProjects(Array.isArray(raw) ? raw : (raw.projects || raw.records || []));
      }
      if (prodJobsRes.status === 'fulfilled' && prodJobsRes.value?.data) {
        const raw = prodJobsRes.value.data;
        setProductionJobs(Array.isArray(raw) ? raw : (raw.jobs || raw.records || []));
      }
      if (prodMetricsRes.status === 'fulfilled' && prodMetricsRes.value?.data) {
        setProdMetrics(prodMetricsRes.value.data);
      }
      if (deliveryRes.status === 'fulfilled' && deliveryRes.value?.data) {
        const raw = deliveryRes.value.data;
        setDeliveryJobs(Array.isArray(raw) ? raw : (raw.jobs || raw.records || []));
      }
      if (paymentsRes.status === 'fulfilled' && paymentsRes.value?.data) {
        const raw = paymentsRes.value.data;
        setPayments(Array.isArray(raw) ? raw : (raw.items || raw.records || []));
      }
      if (leaderRes.status === 'fulfilled' && leaderRes.value?.data) {
        const raw = leaderRes.value.data;
        const list = Array.isArray(raw) ? raw : (raw?.rankings || []);
        // Only show genuine sales reps — mirrors the backend isSalesUser helper
        const salesOnly = list.filter((p) => {
          const u = p.user || p;
          const role = String(u.roleSlug || u.role || p.roleSlug || p.role || '').toLowerCase().trim();
          const name = String(u.name || p.userName || p.name || '').toLowerCase();
          const email = String(u.email || p.email || '').toLowerCase();
          // Exclude non-sales roles explicitly
          if (
            role.includes('admin') ||
            role === 'manager' ||
            role === 'designer' ||
            role === 'customer' ||
            role === 'operator' ||
            role === 'delivery' ||
            name.includes('admin') ||
            email.includes('admin')
          ) return false;
          // Only include confirmed sales/employee roles
          return role === 'sales' || role === 'employee';
        });
        setTopPerformers(salesOnly);
      }
      if (auditsRes.status === 'fulfilled' && auditsRes.value?.data) {
        const raw = auditsRes.value.data;
        setAuditLogs(Array.isArray(raw) ? raw : (raw.records || raw.data || []));
      }
      if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
        const raw = usersRes.value.data;
        setUsers(Array.isArray(raw) ? raw : (raw.records || []));
      }
    } catch (err) {
      console.error('Failed to load live admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + Real-time auto refresh every 30 seconds
  useEffect(() => {
    loadDashboardData();
    const pollInterval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);
    return () => clearInterval(pollInterval);
  }, [loadDashboardData]);

  // Helper date filter
  const isDateInTimeframe = useCallback((dateString, tf) => {
    if (!dateString) return false;
    if (tf === 'All Time') return true;
    const d = new Date(dateString);
    const now = new Date();
    if (isNaN(d.getTime())) return false;

    if (tf === 'Today') {
      return d.toDateString() === now.toDateString();
    }
    if (tf === 'This Week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return d >= oneWeekAgo && d <= now;
    }
    if (tf === 'This Month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  }, []);

  // ==========================================
  // 100% DYNAMIC METRICS FROM REAL DATA ONLY
  // ==========================================
  const metrics = useMemo(() => {
    const now = new Date();

    // 1. Total Leads
    const totalLeads = leads.length;
    const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
    const wonLeadsCount = leads.filter((l) => l.status === 'WON').length;
    const thisMonthLeads = leads.filter((l) => {
      const d = new Date(l.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    const leadsTrend = totalLeads > 0 ? Math.round((thisMonthLeads / totalLeads) * 100) : 0;
    const leadsFooter = `+${thisMonthLeads} this month`;

    // 2. Open Quotations
    const openQuoteList = quotations.filter((q) =>
      ['DRAFT', 'PENDING_DISCOUNT_APPROVAL', 'APPROVED', 'SENT'].includes(q.status)
    );
    const openQuotations = openQuoteList.length;
    const awaitingApprovalQuotes = quotations.filter((q) => q.status === 'PENDING_DISCOUNT_APPROVAL').length;
    const quotesTrend = quotations.length > 0 ? Math.round((openQuotations / quotations.length) * 100) : 0;
    const openQuotesFooter = `${awaitingApprovalQuotes} awaiting approval`;

    // 3. Active Orders
    const activeOrderList = orders.filter(
      (o) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.orderStatus)
    );
    const activeOrders = activeOrderList.length;
    const inProductionOrders = orders.filter((o) => o.orderStatus === 'PRODUCTION').length;
    const ordersTrend = orders.length > 0 ? Math.round((activeOrders / orders.length) * 100) : 0;
    const activeOrdersFooter = `${inProductionOrders} in production`;

    // 4. Outstanding Receivables
    const totalOutstandingPaise =
      recSummary?.totalOutstandingPaise !== undefined
        ? recSummary.totalOutstandingPaise
        : orders.reduce((sum, o) => sum + (o.balancePaise || 0), 0);
    const totalBilledPaise = orders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);
    const recTrend = totalBilledPaise > 0 ? Math.round((totalOutstandingPaise / totalBilledPaise) * 100) : 0;
    const outstandingReceivablesFormatted = `₹ ${(totalOutstandingPaise / 100).toLocaleString('en-IN')}`;
    const pendingOrdersCount = orders.filter((o) => (o.balancePaise || 0) > 0).length;
    const outstandingFooter = `${pendingOrdersCount} orders pending`;

    // 5. Designs Pending Approval
    const clientReviewDesigns = designProjects.filter(
      (d) => d.approvalStatus === 'PENDING' || ['CLIENT_REVIEW', 'BRIEFING'].includes(d.status)
    ).length;
    const inClientReviewCount = designProjects.filter((d) => d.status === 'CLIENT_REVIEW').length;
    const designTrend = designProjects.length > 0 ? Math.round((clientReviewDesigns / designProjects.length) * 100) : 0;
    const designsFooter = `${inClientReviewCount} in client review`;

    // 6. Jobs In Production
    const jobsInProd = prodMetrics?.inProduction !== undefined
      ? prodMetrics.inProduction
      : productionJobs.filter((j) =>
          ['SENT_FOR_PRODUCTION', 'IN_PRODUCTION'].includes(j.productionStatus)
        ).length;
    const sentToProdCount = prodMetrics?.sentForProduction !== undefined
      ? prodMetrics.sentForProduction
      : productionJobs.filter((j) => j.productionStatus === 'SENT_FOR_PRODUCTION').length;
    const prodTrend = productionJobs.length > 0 ? Math.round((jobsInProd / productionJobs.length) * 100) : 0;
    const jobsInProdFooter = `${sentToProdCount} in queue`;

    // 7. Ready for Release
    const readyForReleaseCount = prodMetrics?.readyForRelease !== undefined
      ? prodMetrics.readyForRelease
      : productionJobs.filter((j) => j.productionStatus === 'READY_FOR_RELEASE').length;
    const readyReleaseFooter = `${readyForReleaseCount} awaiting release`;

    // 8. Ready for Dispatch
    const readyDispatch =
      prodMetrics?.readyForDispatch !== undefined
        ? prodMetrics.readyForDispatch
        : orders.filter((o) => o.orderStatus === 'READY').length ||
          deliveryJobs.filter((d) => ['READY', 'READY_FOR_PICKUP'].includes(d.status)).length;
    const scheduledToday = deliveryJobs.filter((d) => d.status === 'READY').length;
    const dispatchTrend = deliveryJobs.length > 0 ? Math.round((readyDispatch / deliveryJobs.length) * 100) : 0;
    const dispatchFooter = `${scheduledToday} scheduled today`;

    // 9. Delivered Today
    const deliveredToday =
      prodMetrics?.deliveredToday !== undefined
        ? prodMetrics.deliveredToday
        : deliveryJobs.filter((d) => d.status === 'DELIVERED').length;
    const totalDeliveries = deliveryJobs.length;
    const deliveryRate = totalDeliveries > 0 ? Math.round((deliveredToday / totalDeliveries) * 100) : 0;
    const deliveredFooter = `Out of ${totalDeliveries} total`;

    // 10. Today's Revenue
    const todayRevenuePaise = payments
      .filter((p) => {
        const d = new Date(p.receivedAt || p.createdAt);
        return d.toDateString() === now.toDateString();
      })
      .reduce((sum, p) => sum + (p.amountPaise || 0), 0);
    const todayRevenueFormatted = `₹ ${(todayRevenuePaise / 100).toLocaleString('en-IN')}`;
    const completedOrdersCount = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.orderStatus)).length;
    const revenueFooter = `From ${completedOrdersCount} orders`;

    // 11. Overdue Orders
    const overdueOrders = orders.filter(
      (o) =>
        o.promisedDeliveryDate &&
        new Date(o.promisedDeliveryDate) < now &&
        !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.orderStatus)
    ).length;
    const overdueTrend = activeOrders > 0 ? Math.round((overdueOrders / activeOrders) * 100) : 0;
    const overdueFooter = overdueOrders > 0 ? 'Need immediate action' : 'All SLAs on track';

    // 12. Payment Verification
    const pendingVerifications = payments.filter((p) => p.status === 'PENDING_VERIFICATION').length;
    const verifTrend = payments.length > 0 ? Math.round((pendingVerifications / payments.length) * 100) : 0;
    const pendingVerifFooter = `${pendingVerifications} awaiting approval`;

    // ==========================================
    // DYNAMIC PIPELINES BASED ON TIMEFRAME
    // ==========================================
    const filteredLeads = leads.filter((l) => isDateInTimeframe(l.createdAt, salesTimeframe));
    const filteredQuotes = quotations.filter((q) => isDateInTimeframe(q.createdAt, salesTimeframe));
    const filteredOrders = orders.filter((o) => isDateInTimeframe(o.orderDate || o.createdAt, salesTimeframe));

    const leadsCount = filteredLeads.length || leads.length;
    const interestedCount = leads.filter((l) =>
      ['INTERESTED', 'QUOTATION_SENT', 'NEGOTIATION', 'WON'].includes(l.status)
    ).length;
    const quotationCount = filteredQuotes.length || quotations.length;
    const orderCount = filteredOrders.length || orders.length;
    const maxPipeline = Math.max(1, leadsCount, interestedCount, quotationCount, orderCount);

    // Dynamic 7 Order Stages based on orderFilter
    let ordersForPipeline = orders;
    if (orderFilter === 'In Progress') {
      ordersForPipeline = orders.filter((o) => !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.orderStatus));
    } else if (orderFilter === 'Completed') {
      ordersForPipeline = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.orderStatus));
    } else if (orderFilter === 'Overdue') {
      ordersForPipeline = orders.filter(
        (o) =>
          o.promisedDeliveryDate &&
          new Date(o.promisedDeliveryDate) < now &&
          !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(o.orderStatus)
      );
    }

    const orderStages = {
      confirmed: ordersForPipeline.filter((o) => ['CONFIRMED', 'AWAITING_ADVANCE'].includes(o.orderStatus)).length,
      design: ordersForPipeline.filter((o) => o.orderStatus === 'DESIGN').length,
      approval: ordersForPipeline.filter((o) => o.orderStatus === 'APPROVAL').length,
      production: ordersForPipeline.filter((o) => o.orderStatus === 'PRODUCTION').length,
      ready: ordersForPipeline.filter((o) => o.orderStatus === 'READY').length,
      dispatch: ordersForPipeline.filter((o) => o.orderStatus === 'DISPATCHED').length,
      delivered: ordersForPipeline.filter((o) => ['DELIVERED', 'COMPLETED'].includes(o.orderStatus)).length,
    };
    const maxOrderStage = Math.max(1, ...Object.values(orderStages));

    // Dynamic Financial Overview based on financeTimeframe
    const financeOrders = orders.filter((o) => isDateInTimeframe(o.orderDate || o.createdAt, financeTimeframe));
    const dynamicOrdersList = financeOrders.length > 0 ? financeOrders : orders;
    const totalOrderValuePaise = dynamicOrdersList.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0);
    const paymentReceivedPaise = dynamicOrdersList.reduce((sum, o) => sum + (o.totalPaidPaise || 0), 0);
    const outstandingPaise = dynamicOrdersList.reduce((sum, o) => sum + (o.balancePaise || 0), 0);
    const overdueReceivablesPaise = recSummary?.overdue30PlusPaise || 0;
    const pendingVerificationPaise = payments
      .filter((p) => p.status === 'PENDING_VERIFICATION')
      .reduce((sum, p) => sum + (p.amountPaise || 0), 0);

    const receivedPercent = totalOrderValuePaise > 0 ? Math.round((paymentReceivedPaise / totalOrderValuePaise) * 100) : 0;
    const outstandingPercent = totalOrderValuePaise > 0 ? Math.round((outstandingPaise / totalOrderValuePaise) * 100) : 0;

    // Operational Breakdown Data
    const designStats = {
      total: designProjects.length,
      unassigned: designProjects.filter((d) => !d.assignedDesignerId).length,
      inProgress: designProjects.filter((d) => ['IN_PROGRESS', 'ASSIGNED'].includes(d.status)).length,
      clientReview: designProjects.filter((d) => d.status === 'CLIENT_REVIEW' || d.approvalStatus === 'PENDING').length,
      revision: designProjects.filter((d) => d.approvalStatus === 'REVISION_REQUESTED' || d.status === 'REVISION_REQUESTED').length,
      approved: designProjects.filter((d) => d.approvalStatus === 'APPROVED' || d.status === 'APPROVED').length,
      readyProduction: designProjects.filter((d) => d.status === 'DESIGN_PRODUCTION_READY').length,
      productionLocked: designProjects.filter((d) => d.productionLocked || d.status === 'PRODUCTION_LOCKED').length,
    };

    const prodStats = {
      readyForRelease: prodMetrics?.readyForRelease !== undefined ? prodMetrics.readyForRelease : productionJobs.filter((j) => j.productionStatus === 'READY_FOR_RELEASE').length,
      sentForProduction: prodMetrics?.sentForProduction !== undefined ? prodMetrics.sentForProduction : productionJobs.filter((j) => j.productionStatus === 'SENT_FOR_PRODUCTION').length,
      inProduction: prodMetrics?.inProduction !== undefined ? prodMetrics.inProduction : productionJobs.filter((j) => j.productionStatus === 'IN_PRODUCTION').length,
      readyDispatch: prodMetrics?.readyForDispatch !== undefined ? prodMetrics.readyForDispatch : productionJobs.filter((j) => j.productionStatus === 'READY_FOR_DISPATCH').length,
      dispatched: prodMetrics?.dispatched !== undefined ? prodMetrics.dispatched : productionJobs.filter((j) => j.productionStatus === 'DISPATCHED').length,
      delivered: prodMetrics?.deliveredToday !== undefined ? prodMetrics.deliveredToday : productionJobs.filter((j) => j.productionStatus === 'DELIVERED').length,
    };

    const deliveryStats = {
      ready: deliveryJobs.filter((d) => d.status === 'READY').length || orders.filter((o) => o.orderStatus === 'READY').length,
      dispatched: deliveryJobs.filter((d) => d.status === 'DISPATCHED').length || orders.filter((o) => o.orderStatus === 'DISPATCHED').length,
      outForDelivery: deliveryJobs.filter((d) => ['IN_TRANSIT', 'DISPATCHED'].includes(d.status)).length,
      failed: deliveryJobs.filter((d) => d.status === 'FAILED').length,
      fitting: deliveryJobs.filter((d) => d.deliveryType === 'FITTING' && d.status !== 'DELIVERED').length,
      delivered: deliveryJobs.filter((d) => d.status === 'DELIVERED').length,
    };

    const attentionItems = [
      { label: 'Follow-ups overdue', count: orders.filter((o) => o.promisedDeliveryDate && new Date(o.promisedDeliveryDate) < now).length, href: '/dashboard/followups' },
      { label: 'Quotations awaiting approval', count: quotations.filter((q) => q.status === 'PENDING_DISCOUNT_APPROVAL').length, href: '/dashboard/quotations' },
      { label: 'Payments awaiting verification', count: payments.filter((p) => p.status === 'PENDING_VERIFICATION').length, href: '/dashboard/payments' },
      { label: 'Designs awaiting client approval', count: designProjects.filter((d) => d.approvalStatus === 'PENDING').length, href: '/dashboard/design?filter=CLIENT_REVIEW' },
      { label: 'Production jobs overdue', count: productionJobs.filter((j) => j.dueDate && new Date(j.dueDate) < now && j.productionStatus !== 'DELIVERED').length, href: '/dashboard/production' },
      { label: 'Jobs awaiting release', count: productionJobs.filter((j) => j.productionStatus === 'READY_FOR_RELEASE').length, href: '/dashboard/production' },
      { label: 'Jobs in active production', count: productionJobs.filter((j) => ['SENT_FOR_PRODUCTION', 'IN_PRODUCTION'].includes(j.productionStatus)).length, href: '/dashboard/production' },
      { label: 'Failed deliveries', count: deliveryJobs.filter((d) => d.status === 'FAILED').length, href: '/dashboard/production/delivery' },
      { label: 'Outstanding payments', count: orders.filter((o) => (o.balancePaise || 0) > 0).length, href: '/dashboard/receivables' },
    ];

    // Designers list from users
    const designers = users.filter((u) => (u.role || u.roleSlug || '').toLowerCase() === 'designer');

    // Dynamic Sales Representatives Performance Calculation (Directly from orders + leads)
    const salesUsers = users.filter((u) => {
      const r = (u.role || u.roleSlug || '').toLowerCase();
      return !r.includes('admin') && (r.includes('sales') || r.includes('employee') || r.includes('executive'));
    });

    const dynamicSalesTeam = salesUsers.map((rep) => {
      const repOrders = orders.filter((o) => {
        const sid = o.assignedSalesId?._id || o.assignedSalesId;
        return String(sid) === String(rep._id);
      });
      const repLeads = leads.filter((l) => {
        const aid = l.assignedToId?._id || l.assignedToId;
        return String(aid) === String(rep._id);
      });
      const repRevenue = repOrders.reduce((sum, o) => sum + (o.grandTotalPaise || 0), 0) / 100;

      // Check if leaderboard ranking exists for more context
      const existingRank = topPerformers.find((tp) => {
        const uid = tp.user?._id || tp.user?.id || tp._id;
        return String(uid) === String(rep._id);
      });

      return {
        _id: rep._id,
        name: rep.name,
        leads: existingRank?.totalLeads || repLeads.length || leads.length,
        orders: existingRank?.ordersWonCount || existingRank?.dealsWon || repOrders.length,
        revenue: existingRank ? (existingRank.achievedPaise || 0) / 100 : repRevenue,
      };
    });

    return {
      totalLeads,
      leadsTrend,
      leadsFooter,
      openQuotations,
      quotesTrend,
      openQuotesFooter,
      activeOrders,
      ordersTrend,
      activeOrdersFooter,
      outstandingReceivablesFormatted,
      recTrend,
      outstandingFooter,
      clientReviewDesigns,
      designTrend,
      designsFooter,
      jobsInProd,
      prodTrend,
      jobsInProdFooter,
      readyForReleaseCount,
      readyReleaseFooter,
      readyDispatch,
      dispatchTrend,
      dispatchFooter,
      deliveredToday,
      deliveryRate,
      deliveredFooter,
      todayRevenueFormatted,
      revenueFooter,
      overdueOrders,
      overdueTrend,
      overdueFooter,
      pendingVerifications,
      verifTrend,
      pendingVerifFooter,
      // Dynamic Pipelines
      leadsCount,
      interestedCount,
      quotationCount,
      orderCount,
      maxPipeline,
      orderStages,
      maxOrderStage,
      // Dynamic Financial Overview
      totalOrderValueFormatted: `₹ ${(totalOrderValuePaise / 100).toLocaleString('en-IN')}`,
      paymentReceivedFormatted: `₹ ${(paymentReceivedPaise / 100).toLocaleString('en-IN')}`,
      receivedPercent,
      outstandingBalanceFormatted: `₹ ${(outstandingPaise / 100).toLocaleString('en-IN')}`,
      outstandingPercent,
      overdueReceivablesFormatted: `₹ ${(overdueReceivablesPaise / 100).toLocaleString('en-IN')}`,
      pendingVerificationFormatted: `₹ ${(pendingVerificationPaise / 100).toLocaleString('en-IN')}`,
      // Operational
      designStats,
      prodStats,
      deliveryStats,
      attentionItems,
      designers,
      dynamicSalesTeam,
    };
  }, [
    leads,
    quotations,
    orders,
    recSummary,
    designProjects,
    prodMetrics,
    productionJobs,
    deliveryJobs,
    payments,
    users,
    topPerformers,
    salesTimeframe,
    orderFilter,
    financeTimeframe,
    isDateInTimeframe,
  ]);

  // Live Instant Search Filter Results
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.trim().length < 2) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchedOrders = orders.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerSnapshot?.displayName && o.customerSnapshot.displayName.toLowerCase().includes(q)) ||
        (o.customerSnapshot?.companyName && o.customerSnapshot.companyName.toLowerCase().includes(q))
    ).slice(0, 4);

    const matchedLeads = leads.filter(
      (l) =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.companyName && l.companyName.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q))
    ).slice(0, 4);

    const matchedJobs = productionJobs.filter(
      (j) =>
        (j.productionJobNumber && j.productionJobNumber.toLowerCase().includes(q))
    ).slice(0, 3);

    return {
      orders: matchedOrders,
      leads: matchedLeads,
      jobs: matchedJobs,
      totalMatches: matchedOrders.length + matchedLeads.length + matchedJobs.length,
    };
  }, [searchQuery, orders, leads, productionJobs]);

  return (
    <div className="flex bg-[#F8FAFC] min-h-screen text-slate-800 font-sans antialiased">
      {/* 1. Left Dark Sidebar with Crimson Highlight */}
      <Sidebar />

      {/* 2. Main Executive Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <Navbar />

        {/* Dashboard Canvas */}
        <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
          {/* Greeting Header & Live Clock */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {greeting}, <span className="text-[#E11D48]">{userName}!</span>
              </h1>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Here's what's happening with your business today.
              </p>
            </div>

            <div className="flex items-center gap-2.5 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs self-start sm:self-auto">
              <Calendar className="w-4 h-4 text-slate-600" />
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 block leading-tight">
                  {currentDate || 'Tuesday, 9 September 2026'}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold block leading-tight font-mono">
                  {currentTime || '10:24 AM'}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 1. TWELVE STAT KPI CARDS (2 ROWS OF 6) */}
          {/* ========================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* 1. Total Leads */}
            <Link
              href="/dashboard/leads"
              className="bg-[#EFF6FF] p-4 rounded-2xl border border-blue-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.leadsTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Total Leads</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.totalLeads}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.leadsFooter}</span>
              </div>
            </Link>

            {/* 2. Open Quotations */}
            <Link
              href="/dashboard/quotations"
              className="bg-[#ECFDF5] p-4 rounded-2xl border border-emerald-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.quotesTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Open Quotations</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.openQuotations}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.openQuotesFooter}</span>
              </div>
            </Link>

            {/* 3. Active Orders */}
            <Link
              href="/dashboard/orders"
              className="bg-[#FFFBEB] p-4 rounded-2xl border border-amber-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.ordersTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Active Orders</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.activeOrders}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.activeOrdersFooter}</span>
              </div>
            </Link>

            {/* 4. Outstanding Receivables */}
            <Link
              href="/dashboard/receivables"
              className="bg-[#FAF5FF] p-4 rounded-2xl border border-purple-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> {metrics.recTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Outstanding Receivables</span>
                <span className="text-lg font-black text-slate-900 block mt-0.5 truncate">
                  {metrics.outstandingReceivablesFormatted}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.outstandingFooter}</span>
              </div>
            </Link>

            {/* 5. Designs Pending Approval */}
            <Link
              href="/dashboard/design?filter=CLIENT_REVIEW"
              className="bg-[#FFF1F2] p-4 rounded-2xl border border-rose-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingDown className="w-2.5 h-2.5" /> {metrics.designTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Designs Pending Approval</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.clientReviewDesigns}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.designsFooter}</span>
              </div>
            </Link>

            {/* 6. Jobs In Production */}
            <Link
              href="/dashboard/production"
              className="bg-[#ECFEFF] p-4 rounded-2xl border border-cyan-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.prodTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Jobs In Production</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.jobsInProd}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.jobsInProdFooter}</span>
              </div>
            </Link>

            {/* 7. Ready for Release */}
            <Link
              href="/dashboard/production"
              className="bg-[#EEF2FF] p-4 rounded-2xl border border-indigo-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/70 px-1.5 py-0.5 rounded-md">
                  Queue
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Ready for Release</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.readyForReleaseCount}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.readyReleaseFooter}</span>
              </div>
            </Link>

            {/* 8. Ready for Dispatch */}
            <Link
              href="/dashboard/production/delivery"
              className="bg-[#FDF2F8] p-4 rounded-2xl border border-pink-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Truck className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-pink-700 bg-pink-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.dispatchTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Ready for Dispatch</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.readyDispatch}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.dispatchFooter}</span>
              </div>
            </Link>

            {/* 9. Delivered Today */}
            <Link
              href="/dashboard/production/delivery"
              className="bg-[#ECFDF5] p-4 rounded-2xl border border-emerald-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Box className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> +{metrics.deliveryRate}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Delivered Today</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.deliveredToday}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.deliveredFooter}</span>
              </div>
            </Link>

            {/* 10. Today's Revenue */}
            <Link
              href="/dashboard/payments"
              className="bg-[#EFF6FF] p-4 rounded-2xl border border-blue-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded-md">
                  Cashflow
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Today's Revenue</span>
                <span className="text-lg font-black text-slate-900 block mt-0.5 truncate">
                  {metrics.todayRevenueFormatted}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.revenueFooter}</span>
              </div>
            </Link>

            {/* 11. Overdue Orders */}
            <Link
              href="/dashboard/orders"
              className="bg-[#FFF1F2] p-4 rounded-2xl border border-red-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100/70 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> {metrics.overdueTrend}%
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Overdue Orders</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.overdueOrders}</span>
                <span className="text-[10px] text-rose-600 font-semibold block mt-1">{metrics.overdueFooter}</span>
              </div>
            </Link>

            {/* 12. Payment Verification */}
            <Link
              href="/dashboard/payments"
              className="bg-[#F5F3FF] p-4 rounded-2xl border border-violet-100/80 shadow-xs flex flex-col justify-between space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.5 rounded-md">
                  {metrics.verifTrend}% audit
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 block">Payment Verification</span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">{metrics.pendingVerifications}</span>
                <span className="text-[10px] text-slate-400 font-medium block mt-1">{metrics.pendingVerifFooter}</span>
              </div>
            </Link>
          </div>

          {/* ========================================== */}
          {/* 2. MIDDLE ROW: 3 DYNAMIC PANELS */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sales Pipeline Dynamic Bar Chart (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Sales Pipeline</h3>
                </div>
                {/* Dynamic Timeframe Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === 'sales' ? null : 'sales');
                    }}
                    className="text-[11px] font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    {salesTimeframe} <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {openDropdown === 'sales' && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[110px] text-xs">
                      {['Today', 'This Week', 'This Month', 'All Time'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setSalesTimeframe(tf);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 font-medium hover:bg-slate-50 transition-colors ${
                            salesTimeframe === tf ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-slate-700'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Vertical Columns matching mockup */}
              <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
                {/* Leads */}
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-bold text-slate-800">{metrics.leadsCount}</span>
                  <div
                    className="w-full bg-[#2563EB] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.leadsCount / metrics.maxPipeline) * 100))}%` }}
                    title={`Total Leads: ${metrics.leadsCount}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">Leads</span>
                </div>
                {/* Interested */}
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-bold text-slate-800">{metrics.interestedCount}</span>
                  <div
                    className="w-full bg-[#10B981] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.interestedCount / metrics.maxPipeline) * 100))}%` }}
                    title={`Interested / Won Leads: ${metrics.interestedCount}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">Interested</span>
                </div>
                {/* Quotation */}
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-bold text-slate-800">{metrics.quotationCount}</span>
                  <div
                    className="w-full bg-[#F59E0B] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.quotationCount / metrics.maxPipeline) * 100))}%` }}
                    title={`Quotations: ${metrics.quotationCount}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">Quotation</span>
                </div>
                {/* Order */}
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-xs font-bold text-slate-800">{metrics.orderCount}</span>
                  <div
                    className="w-full bg-[#EF4444] rounded-t-lg transition-all duration-500 hover:brightness-110 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderCount / metrics.maxPipeline) * 100))}%` }}
                    title={`Commercial Orders: ${metrics.orderCount}`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">Order</span>
                </div>
              </div>
            </div>

            {/* Order Pipeline 7 Stages (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Order Pipeline</h3>
                </div>
                {/* Dynamic Stage Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === 'order' ? null : 'order');
                    }}
                    className="text-[11px] font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    {orderFilter} <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {openDropdown === 'order' && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[120px] text-xs">
                      {['All Orders', 'In Progress', 'Completed', 'Overdue'].map((of) => (
                        <button
                          key={of}
                          onClick={() => {
                            setOrderFilter(of);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 font-medium hover:bg-slate-50 transition-colors ${
                            orderFilter === of ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-slate-700'
                          }`}
                        >
                          {of}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic 7 Vertical Columns */}
              <div className="h-44 flex items-end justify-between gap-1.5 pt-4 px-1">
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.confirmed}</span>
                  <div
                    className="w-full bg-[#8B5CF6] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.confirmed / metrics.maxOrderStage) * 100))}%` }}
                    title={`Confirmed: ${metrics.orderStages.confirmed}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Confirmed</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.design}</span>
                  <div
                    className="w-full bg-[#3B82F6] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.design / metrics.maxOrderStage) * 100))}%` }}
                    title={`Design: ${metrics.orderStages.design}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Design</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.approval}</span>
                  <div
                    className="w-full bg-[#FBBF24] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.approval / metrics.maxOrderStage) * 100))}%` }}
                    title={`Approval: ${metrics.orderStages.approval}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Approval</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.production}</span>
                  <div
                    className="w-full bg-[#14B8A6] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.production / metrics.maxOrderStage) * 100))}%` }}
                    title={`Production: ${metrics.orderStages.production}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Production</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.ready}</span>
                  <div
                    className="w-full bg-[#10B981] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.ready / metrics.maxOrderStage) * 100))}%` }}
                    title={`Ready: ${metrics.orderStages.ready}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Ready</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.dispatch}</span>
                  <div
                    className="w-full bg-[#84CC16] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.dispatch / metrics.maxOrderStage) * 100))}%` }}
                    title={`Dispatch: ${metrics.orderStages.dispatch}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Dispatch</span>
                </div>
                <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-800">{metrics.orderStages.delivered}</span>
                  <div
                    className="w-full bg-[#0EA5E9] rounded-t-lg transition-all duration-500 shadow-xs"
                    style={{ height: `${Math.max(10, Math.round((metrics.orderStages.delivered / metrics.maxOrderStage) * 100))}%` }}
                    title={`Delivered: ${metrics.orderStages.delivered}`}
                  />
                  <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[36px]">Delivered</span>
                </div>
              </div>
            </div>

            {/* Financial Overview (4 cols) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Financial Overview</h3>
                </div>
                {/* Dynamic Timeframe Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === 'finance' ? null : 'finance');
                    }}
                    className="text-[11px] font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    {financeTimeframe} <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {openDropdown === 'finance' && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[110px] text-xs">
                      {['Today', 'This Week', 'This Month', 'All Time'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setFinanceTimeframe(tf);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-3 py-1.5 font-medium hover:bg-slate-50 transition-colors ${
                            financeTimeframe === tf ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-slate-700'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Order Value</span>
                  <span className="font-black text-slate-900">{metrics.totalOrderValueFormatted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Payment Received</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{metrics.paymentReceivedFormatted}</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> {metrics.receivedPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Outstanding Balance</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{metrics.outstandingBalanceFormatted}</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> {metrics.outstandingPercent}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Overdue Receivables</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{metrics.overdueReceivablesFormatted}</span>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Aging</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Pending Verification</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{metrics.pendingVerificationFormatted}</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Audit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 3. OPERATIONAL ROW: 4 PANELS (100% DYNAMIC) */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Design Projects */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Design Projects</h3>
                </div>
                <Link href="/dashboard/design" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Total Projects</span>
                  <span className="w-6 h-6 rounded-md bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.total}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Unassigned</span>
                  <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.unassigned}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">In Progress</span>
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.inProgress}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Client Review</span>
                  <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.clientReview}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Revision Requested</span>
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.revision}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Approved</span>
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.approved}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Ready for Production</span>
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.readyProduction}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Production Locked</span>
                  <span className="w-6 h-6 rounded-md bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center">
                    {metrics.designStats.productionLocked}
                  </span>
                </div>
              </div>
            </div>

            {/* Production Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Production Overview</h3>
                </div>
                <Link href="/dashboard/production" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Ready for Release</span>
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.readyForRelease}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Sent to Production</span>
                  <span className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.sentForProduction}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">In Production</span>
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.inProduction}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Ready for Dispatch</span>
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.readyDispatch}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Dispatched</span>
                  <span className="w-6 h-6 rounded-md bg-cyan-100 text-cyan-800 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.dispatched}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Delivered Today</span>
                  <span className="w-6 h-6 rounded-md bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                    {metrics.prodStats.delivered}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Production Jobs */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Active Production Jobs</h3>
                </div>
                <Link href="/dashboard/production" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="pb-2 font-bold">Job #</th>
                      <th className="pb-2 font-bold">Status</th>
                      <th className="pb-2 font-bold text-right">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {productionJobs.slice(0, 5).map((j) => (
                      <tr key={j._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2 text-slate-800 font-semibold">{j.productionJobNumber}</td>
                        <td className="py-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-50 text-indigo-700">
                            {j.productionStatus}
                          </span>
                        </td>
                        <td className="py-2 text-right text-slate-700 font-mono text-[11px]">
                          {j.priority}
                        </td>
                      </tr>
                    ))}
                    {productionJobs.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400">
                          No active production jobs
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Outsourced Production Handoff */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Production Fulfillment</h3>
                </div>
                <Link href="/dashboard/production" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/dashboard/production"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Ready for Release</span>
                  </div>
                  <span className="font-bold text-xs text-slate-700">{metrics.prodStats.readyForRelease}</span>
                </Link>

                <Link
                  href="/dashboard/production"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <RefreshCw className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Sent to Production</span>
                  </div>
                  <span className="font-bold text-xs text-slate-700">{metrics.prodStats.sentForProduction}</span>
                </Link>

                <Link
                  href="/dashboard/production"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">In Production</span>
                  </div>
                  <span className="font-bold text-xs text-slate-700">{metrics.prodStats.inProduction}</span>
                </Link>

                <Link
                  href="/dashboard/production"
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">Ready for Dispatch</span>
                  </div>
                  <span className="font-bold text-xs text-slate-700">{metrics.prodStats.readyDispatch}</span>
                </Link>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 4. BOTTOM ROW: 4 PANELS (100% DYNAMIC) */}
          {/* ========================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Dispatch & Delivery */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Dispatch & Delivery</h3>
                </div>
                <Link href="/dashboard/production/delivery" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Ready for Dispatch</span>
                  <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.ready}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Dispatched Today</span>
                  <span className="w-6 h-6 rounded-md bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.dispatched}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Out for Delivery</span>
                  <span className="w-6 h-6 rounded-md bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.outForDelivery}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Delivery Failed</span>
                  <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Fitting Scheduled</span>
                  <span className="w-6 h-6 rounded-md bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.fitting}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-600 font-medium">Delivered Today</span>
                  <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    {metrics.deliveryStats.delivered}
                  </span>
                </div>
              </div>
            </div>

            {/* Attention Required (Dynamic Alert Center) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-xs">Attention Required</h3>
                </div>
                <Link href="/dashboard/orders" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-1.5 text-xs font-medium">
                {metrics.attentionItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between py-0.5 hover:bg-slate-50 rounded px-1 -mx-1 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <AlertTriangle
                        className={`w-3.5 h-3.5 shrink-0 ${item.count > 0 ? 'text-rose-500' : 'text-slate-300'}`}
                      />
                      <span className="text-slate-600 truncate">{item.label}</span>
                    </div>
                    <span className={`font-bold ${item.count > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {item.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Team Performance (Dynamic Sales / Design Tabs!) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Team Performance</h3>
                </div>
                {/* Dynamic Timeframe Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === 'team' ? null : 'team');
                    }}
                    className="text-[10px] font-semibold text-slate-600 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-slate-50 transition-colors"
                  >
                    {teamTimeframe} <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  {openDropdown === 'team' && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-20 min-w-[100px] text-xs">
                      {['Today', 'This Week', 'This Month', 'All Time'].map((tf) => (
                        <button
                          key={tf}
                          onClick={() => {
                            setTeamTimeframe(tf);
                            setOpenDropdown(null);
                          }}
                          className={`w-full text-left px-2.5 py-1 font-medium hover:bg-slate-50 transition-colors ${
                            teamTimeframe === tf ? 'text-[#E11D48] font-bold bg-rose-50/50' : 'text-slate-700'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 text-xs">
                <button
                  onClick={() => setTeamTab('SALES')}
                  className={`pb-1.5 font-bold mr-4 transition-colors ${
                    teamTab === 'SALES' ? 'text-[#E11D48] border-b-2 border-[#E11D48]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sales Team
                </button>
                <button
                  onClick={() => setTeamTab('DESIGN')}
                  className={`pb-1.5 font-bold transition-colors ${
                    teamTab === 'DESIGN' ? 'text-[#E11D48] border-b-2 border-[#E11D48]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Design Team
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] text-slate-400 font-bold uppercase border-b border-slate-100">
                      <th className="pb-1.5 font-bold">Name</th>
                      <th className="pb-1.5 font-bold text-center">{teamTab === 'SALES' ? 'Leads' : 'Projects'}</th>
                      <th className="pb-1.5 font-bold text-center">{teamTab === 'SALES' ? 'Orders' : 'Approved'}</th>
                      <th className="pb-1.5 font-bold text-right">{teamTab === 'SALES' ? 'Revenue' : 'Locked'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium">
                    {teamTab === 'SALES' ? (
                      metrics.dynamicSalesTeam.length > 0 ? (
                        metrics.dynamicSalesTeam.slice(0, 4).map((rep) => (
                          <tr key={rep._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-1.5 text-slate-800 font-semibold truncate max-w-[85px]">{rep.name}</td>
                            <td className="py-1.5 text-center text-slate-600">{rep.leads}</td>
                            <td className="py-1.5 text-center text-slate-600">{rep.orders}</td>
                            <td className="py-1.5 text-right font-bold text-slate-900">
                              ₹ {rep.revenue.toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            No sales performance records
                          </td>
                        </tr>
                      )
                    ) : metrics.designers.length > 0 ? (
                      metrics.designers.slice(0, 4).map((d) => {
                        const projects = designProjects.filter(
                          (dp) => String(dp.assignedDesignerId) === String(d._id)
                        ).length;
                        const approved = designProjects.filter(
                          (dp) => String(dp.assignedDesignerId) === String(d._id) && dp.approvalStatus === 'APPROVED'
                        ).length;
                        const locked = designProjects.filter(
                          (dp) => String(dp.assignedDesignerId) === String(d._id) && dp.productionLocked
                        ).length;
                        return (
                          <tr key={d._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-1.5 text-slate-800 font-semibold truncate max-w-[85px]">{d.name}</td>
                            <td className="py-1.5 text-center text-slate-600">{projects}</td>
                            <td className="py-1.5 text-center text-slate-600">{approved}</td>
                            <td className="py-1.5 text-right font-bold text-slate-900">{locked}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          No designers registered
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Activity (Dynamic from /audit-logs!) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <h3 className="font-bold text-slate-900 text-xs">Recent Activity</h3>
                </div>
                <Link href="/dashboard/admin/audit" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All
                </Link>
              </div>

              {/* Dynamic Timeline Items */}
              <div className="space-y-3 pt-1 text-xs">
                {auditLogs.length > 0 ? (
                  auditLogs.slice(0, 5).map((log) => (
                    <div key={log._id} className="flex items-start gap-2.5 group">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0 group-hover:scale-125 transition-transform" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        <div className="font-bold text-slate-900 truncate max-w-[170px]">
                          {log.actionCode || log.action || 'System action'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[170px]">
                          {log.collectionName}{' '}
                          {log.documentId ? '· ' + String(log.documentId).slice(-6).toUpperCase() : ''}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs">No recent activity records logged.</div>
                )}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* 5. QUICK ACTIONS BOTTOM BAR */}
          {/* ========================================== */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <span className="text-xs font-black text-slate-900 block">Quick Actions</span>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/dashboard/leads"
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" /> Add Lead
              </Link>

              <Link
                href="/dashboard/customers"
                className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <Users className="w-4 h-4" /> Create Customer
              </Link>

              <Link
                href="/dashboard/quotations"
                className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <FileText className="w-4 h-4" /> New Quotation
              </Link>

              <Link
                href="/dashboard/payments"
                className="px-4 py-2 rounded-xl bg-[#D97706] hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <CreditCard className="w-4 h-4" /> Verify Payments
              </Link>

              <Link
                href="/dashboard/discount-approvals"
                className="px-4 py-2 rounded-xl bg-[#7C3AED] hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-4 h-4" /> View Approvals
              </Link>

              <Link
                href="/dashboard/production"
                className="px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <Layers className="w-4 h-4" /> Production Jobs
              </Link>

              <Link
                href="/dashboard/production/delivery"
                className="px-4 py-2 rounded-xl bg-[#0D9488] hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <Truck className="w-4 h-4" /> Deliveries Hub
              </Link>

              <Link
                href="/dashboard/admin/users"
                className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-violet-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
              >
                <UserPlus className="w-4 h-4" /> Manage Users
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
