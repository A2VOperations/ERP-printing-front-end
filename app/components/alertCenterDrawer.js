'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Eye,
  Check,
  BellOff,
  Filter,
  RefreshCw,
  ShieldAlert,
  Mail,
  Save,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  AlertOctagon,
  LayoutDashboard,
} from 'lucide-react';

function formatIstDateTime(dateVal) {
  if (!dateVal) return '—';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return '—';
  }
}

export default function AlertCenterDrawer({ isOpen, onClose, onCountUpdated }) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'alerts' | 'preferences' | 'history' | 'digest-history' | 'escalations'
  const [overview, setOverview] = useState({
    operationalAlerts: {
      totalOpen: 0,
      byType: {
        FOLLOWUP_OVERDUE: 0,
        QUOTATION_EXPIRING: 0,
        RECEIVABLE_OVERDUE: 0,
        DESIGN_OVERDUE: 0,
      },
      bySeverity: {
        CRITICAL: 0,
        WARNING: 0,
        INFO: 0,
      },
      personalState: {
        unread: 0,
        read: 0,
        acknowledged: 0,
        dismissed: 0,
      },
    },
    escalations: {
      available: false,
    },
  });
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({
    openAlerts: 0,
    unreadAlerts: 0,
    criticalAlerts: 0,
  });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('OPEN');
  const [severityFilter, setSeverityFilter] = useState('');
  const [readFilter, setReadFilter] = useState('');

  // Preferences State
  const [preferences, setPreferences] = useState({
    email: {
      FOLLOWUP_OVERDUE: false,
      QUOTATION_EXPIRING: false,
      RECEIVABLE_OVERDUE: false,
      DESIGN_OVERDUE: false,
    },
    deliveryEmail: '',
  });
  const [loadingPrefs, setLoadingPrefs] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefMessage, setPrefMessage] = useState(null);
  const [userRole, setUserRole] = useState('admin');

  // Daily Alert Digest State
  const [digestPrefs, setDigestPrefs] = useState({
    enabled: false,
    timeOfDay: '09:00',
    timezone: 'Asia/Kolkata',
    includedAlertTypes: [
      'FOLLOWUP_OVERDUE',
      'QUOTATION_EXPIRING',
      'RECEIVABLE_OVERDUE',
      'DESIGN_OVERDUE',
    ],
    nextRunAt: null,
    deliveryEmail: '',
  });
  const [loadingDigestPrefs, setLoadingDigestPrefs] = useState(false);
  const [savingDigestPrefs, setSavingDigestPrefs] = useState(false);
  const [digestMessage, setDigestMessage] = useState(null);

  // Notification History State
  const [historyList, setHistoryList] = useState([]);
  const [historySummary, setHistorySummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    processing: 0,
    successRate: 0,
  });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [historyAlertTypeFilter, setHistoryAlertTypeFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Personal Daily Digest Run History State
  const [digestHistoryList, setDigestHistoryList] = useState([]);
  const [digestHistorySummary, setDigestHistorySummary] = useState({
    totalRuns: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    processing: 0,
    lastRun: null,
  });
  const [digestHistoryLoading, setDigestHistoryLoading] = useState(false);
  const [digestHistoryStatusFilter, setDigestHistoryStatusFilter] = useState('');
  const [digestHistoryReasonFilter, setDigestHistoryReasonFilter] = useState('');
  const [digestHistoryPage, setDigestHistoryPage] = useState(1);
  const [digestHistoryTotalPages, setDigestHistoryTotalPages] = useState(1);
  const [digestHistoryTotal, setDigestHistoryTotal] = useState(0);

  // Phase 8B-5: Operational Alert Escalation State
  const [escalationsList, setEscalationsList] = useState([]);
  const [escalationsSummary, setEscalationsSummary] = useState({
    totalOpen: 0,
    totalResolved: 0,
    openByAlertType: {
      FOLLOWUP_OVERDUE: 0,
      QUOTATION_EXPIRING: 0,
      RECEIVABLE_OVERDUE: 0,
      DESIGN_OVERDUE: 0,
    },
    oldestOpenEscalatedAt: null,
  });
  const [escalationsLoading, setEscalationsLoading] = useState(false);
  const [escalationsStatusFilter, setEscalationsStatusFilter] = useState('');
  const [escalationsTypeFilter, setEscalationsTypeFilter] = useState('');
  const [escalationsFromFilter, setEscalationsFromFilter] = useState('');
  const [escalationsToFilter, setEscalationsToFilter] = useState('');
  const [escalationsPage, setEscalationsPage] = useState(1);
  const [escalationsTotalPages, setEscalationsTotalPages] = useState(1);
  const [escalationsTotal, setEscalationsTotal] = useState(0);
  const [escalationsSubTab, setEscalationsSubTab] = useState('list'); // 'list' | 'settings'

  // Escalation Policies State (Admin only)
  const [escalationPolicies, setEscalationPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(null);
  const [policyMessage, setPolicyMessage] = useState(null);

  // Phase 8B-6: Escalation Email Preferences State (Admin & Manager)
  const [escalationEmailPrefs, setEscalationEmailPrefs] = useState([]);
  const [escalationDeliveryEmail, setEscalationDeliveryEmail] = useState('');
  const [loadingEscalationPrefs, setLoadingEscalationPrefs] = useState(false);
  const [savingEscalationPref, setSavingEscalationPref] = useState(null);
  const [escalationPrefMessage, setEscalationPrefMessage] = useState(null);

  // Phase 8B-7: Escalation Email Delivery History State (Admin & Manager)
  const [escalationHistoryList, setEscalationHistoryList] = useState([]);
  const [escalationHistorySummary, setEscalationHistorySummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    processing: 0,
    successRatePercent: null,
  });
  const [escalationHistoryLoading, setEscalationHistoryLoading] = useState(false);
  const [escalationHistoryStatusFilter, setEscalationHistoryStatusFilter] = useState('');
  const [escalationHistoryAlertTypeFilter, setEscalationHistoryAlertTypeFilter] = useState('');
  const [escalationHistoryEntityTypeFilter, setEscalationHistoryEntityTypeFilter] = useState('');
  const [escalationHistoryFromFilter, setEscalationHistoryFromFilter] = useState('');
  const [escalationHistoryToFilter, setEscalationHistoryToFilter] = useState('');
  const [escalationHistoryPage, setEscalationHistoryPage] = useState(1);
  const [escalationHistoryTotalPages, setEscalationHistoryTotalPages] = useState(1);
  const [escalationHistoryTotal, setEscalationHistoryTotal] = useState(0);

  // Phase 8B-8: Escalation Daily Digest Preference State (Admin & Manager)
  const [escalationDigestEnabled, setEscalationDigestEnabled] = useState(false);
  const [escalationDigestDeliveryEmail, setEscalationDigestDeliveryEmail] = useState('');
  const [loadingEscalationDigestPrefs, setLoadingEscalationDigestPrefs] = useState(false);
  const [savingEscalationDigestPref, setSavingEscalationDigestPref] = useState(false);
  const [escalationDigestPrefMessage, setEscalationDigestPrefMessage] = useState(null);

  // Phase 8B-9: Escalation Daily Digest Run History State (Admin & Manager)
  const [escalationDigestHistoryList, setEscalationDigestHistoryList] = useState([]);
  const [escalationDigestHistorySummary, setEscalationDigestHistorySummary] = useState({
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    processing: 0,
    successRatePercent: null,
  });
  const [escalationDigestHistoryLoading, setEscalationDigestHistoryLoading] = useState(false);
  const [escalationDigestHistoryStatusFilter, setEscalationDigestHistoryStatusFilter] = useState('');
  const [escalationDigestHistoryReasonFilter, setEscalationDigestHistoryReasonFilter] = useState('');
  const [escalationDigestHistoryLocalDateFilter, setEscalationDigestHistoryLocalDateFilter] = useState('');
  const [escalationDigestHistoryFromFilter, setEscalationDigestHistoryFromFilter] = useState('');
  const [escalationDigestHistoryToFilter, setEscalationDigestHistoryToFilter] = useState('');
  const [escalationDigestHistoryPage, setEscalationDigestHistoryPage] = useState(1);
  const [escalationDigestHistoryTotalPages, setEscalationDigestHistoryTotalPages] = useState(1);
  const [escalationDigestHistoryTotal, setEscalationDigestHistoryTotal] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = (localStorage.getItem('userRole') || 'admin').toLowerCase();
      setUserRole(role);
    }
  }, []);

  // Fetch summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/alerts/summary');
      if (res?.data) {
        setSummary(res.data);
        if (onCountUpdated) {
          onCountUpdated(res.data.unreadAlerts);
        }
      }
    } catch (err) {
      console.error('Failed to load alert summary:', err);
    }
  }, [onCountUpdated]);

  // Fetch overview (Phase 8B-10)
  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await api.get('/alerts/overview');
      if (res?.data) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to load alert overview:', err);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Fetch alerts list
  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') {
        queryParams.set('status', statusFilter);
      }
      if (severityFilter && severityFilter !== 'ALL') {
        queryParams.set('severity', severityFilter);
      }
      if (readFilter && readFilter !== 'ALL') {
        queryParams.set('readState', readFilter);
      }
      queryParams.set('limit', '50');

      const res = await api.get(`/alerts?${queryParams.toString()}`);
      if (res?.data) {
        setAlerts(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, readFilter]);

  // Fetch preferences
  const fetchPreferences = useCallback(async () => {
    setLoadingPrefs(true);
    try {
      const res = await api.get('/alerts/preferences');
      if (res?.data) {
        setPreferences({
          email: {
            FOLLOWUP_OVERDUE: Boolean(res.data.email?.FOLLOWUP_OVERDUE),
            QUOTATION_EXPIRING: Boolean(res.data.email?.QUOTATION_EXPIRING),
            RECEIVABLE_OVERDUE: Boolean(res.data.email?.RECEIVABLE_OVERDUE),
            DESIGN_OVERDUE: Boolean(res.data.email?.DESIGN_OVERDUE),
          },
          deliveryEmail: res.data.deliveryEmail || '',
        });
      }
    } catch (err) {
      console.error('Failed to load alert preferences:', err);
    } finally {
      setLoadingPrefs(false);
    }
  }, []);

  // Fetch daily alert digest preferences
  const fetchDigestPreferences = useCallback(async () => {
    setLoadingDigestPrefs(true);
    try {
      const res = await api.get('/alerts/digest-preferences');
      if (res?.data) {
        setDigestPrefs({
          enabled: Boolean(res.data.enabled),
          timeOfDay: res.data.timeOfDay || '09:00',
          timezone: res.data.timezone || 'Asia/Kolkata',
          includedAlertTypes: res.data.includedAlertTypes || [
            'FOLLOWUP_OVERDUE',
            'QUOTATION_EXPIRING',
            'RECEIVABLE_OVERDUE',
            'DESIGN_OVERDUE',
          ],
          nextRunAt: res.data.nextRunAt || null,
          deliveryEmail: res.data.deliveryEmail || '',
        });
      }
    } catch (err) {
      console.error('Failed to load alert digest preferences:', err);
    } finally {
      setLoadingDigestPrefs(false);
    }
  }, []);

  // Fetch notification history
  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (historyStatusFilter && historyStatusFilter !== 'ALL') {
        queryParams.set('status', historyStatusFilter);
      }
      if (historyAlertTypeFilter && historyAlertTypeFilter !== 'ALL') {
        queryParams.set('alertType', historyAlertTypeFilter);
      }
      queryParams.set('page', String(historyPage));
      queryParams.set('limit', '20');

      const res = await api.get(`/alerts/notifications?${queryParams.toString()}`);
      if (res?.data) {
        setHistoryList(res.data || []);
        if (res.pagination) {
          setHistoryTotal(res.pagination.total || 0);
          setHistoryTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyStatusFilter, historyAlertTypeFilter, historyPage]);

  // Fetch notification history summary metrics
  const fetchHistorySummary = useCallback(async () => {
    try {
      const res = await api.get('/alerts/notifications/summary');
      if (res?.data) {
        setHistorySummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load notification summary metrics:', err);
    }
  }, []);

  // Fetch personal daily digest history
  const fetchDigestHistory = useCallback(async () => {
    setDigestHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (digestHistoryStatusFilter && digestHistoryStatusFilter !== 'ALL') {
        queryParams.set('status', digestHistoryStatusFilter);
      }
      if (digestHistoryReasonFilter && digestHistoryReasonFilter !== 'ALL') {
        queryParams.set('failureReason', digestHistoryReasonFilter);
      }
      queryParams.set('page', String(digestHistoryPage));
      queryParams.set('limit', '20');

      const res = await api.get(`/alerts/digest-history?${queryParams.toString()}`);
      if (res?.data) {
        setDigestHistoryList(res.data || []);
        if (res.pagination) {
          setDigestHistoryTotal(res.pagination.total || 0);
          setDigestHistoryTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load digest history:', err);
    } finally {
      setDigestHistoryLoading(false);
    }
  }, [digestHistoryStatusFilter, digestHistoryReasonFilter, digestHistoryPage]);

  // Fetch personal daily digest history summary
  const fetchDigestHistorySummary = useCallback(async () => {
    try {
      const res = await api.get('/alerts/digest-history/summary');
      if (res?.data) {
        setDigestHistorySummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load digest history summary:', err);
    }
  }, []);

  // Fetch escalations list (Phase 8B-5)
  const fetchEscalations = useCallback(async () => {
    setEscalationsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (escalationsStatusFilter && escalationsStatusFilter !== 'ALL') {
        queryParams.set('status', escalationsStatusFilter);
      }
      if (escalationsTypeFilter && escalationsTypeFilter !== 'ALL') {
        queryParams.set('alertType', escalationsTypeFilter);
      }
      if (escalationsFromFilter) {
        queryParams.set('from', new Date(escalationsFromFilter).toISOString());
      }
      if (escalationsToFilter) {
        const toD = new Date(escalationsToFilter);
        toD.setHours(23, 59, 59, 999);
        queryParams.set('to', toD.toISOString());
      }
      queryParams.set('page', String(escalationsPage));
      queryParams.set('limit', '20');

      const res = await api.get(`/alerts/escalations?${queryParams.toString()}`);
      if (res?.data) {
        setEscalationsList(res.data || []);
        if (res.pagination) {
          setEscalationsTotal(res.pagination.total || 0);
          setEscalationsTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load escalations list:', err);
    } finally {
      setEscalationsLoading(false);
    }
  }, [escalationsStatusFilter, escalationsTypeFilter, escalationsFromFilter, escalationsToFilter, escalationsPage]);

  // Fetch escalations summary metrics (Phase 8B-5)
  const fetchEscalationsSummary = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (escalationsFromFilter) {
        queryParams.set('from', new Date(escalationsFromFilter).toISOString());
      }
      if (escalationsToFilter) {
        const toD = new Date(escalationsToFilter);
        toD.setHours(23, 59, 59, 999);
        queryParams.set('to', toD.toISOString());
      }
      const queryString = queryParams.toString();
      const url = queryString ? `/alerts/escalations/summary?${queryString}` : '/alerts/escalations/summary';
      const res = await api.get(url);
      if (res?.data) {
        setEscalationsSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load escalations summary:', err);
    }
  }, [escalationsFromFilter, escalationsToFilter]);

  // Fetch escalation policies (Phase 8B-5 Admin/Manager)
  const fetchEscalationPolicies = useCallback(async () => {
    setLoadingPolicies(true);
    try {
      const res = await api.get('/alerts/escalation-policies');
      if (res?.data) {
        setEscalationPolicies(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load escalation policies:', err);
    } finally {
      setLoadingPolicies(false);
    }
  }, []);

  // Update escalation policy (Phase 8B-5 Admin only)
  const handleUpdatePolicy = async (alertType, enabled, thresholdMinutes) => {
    setSavingPolicy(alertType);
    setPolicyMessage(null);
    try {
      const res = await api.put(`/alerts/escalation-policies/${alertType}`, {
        enabled: Boolean(enabled),
        thresholdMinutes: Number(thresholdMinutes),
      });
      if (res?.data) {
        setEscalationPolicies((prev) =>
          prev.map((p) => (p.alertType === alertType ? res.data : p))
        );
        setPolicyMessage({
          type: 'success',
          text: `Policy for ${alertType.replace(/_/g, ' ')} updated successfully.`,
        });
      }
    } catch (err) {
      setPolicyMessage({
        type: 'error',
        text: err?.response?.data?.error || err.message || 'Failed to update policy.',
      });
    } finally {
      setSavingPolicy(null);
    }
  };

  // Fetch escalation email preferences (Phase 8B-6 Admin/Manager)
  const fetchEscalationEmailPreferences = useCallback(async () => {
    setLoadingEscalationPrefs(true);
    try {
      const res = await api.get('/alerts/escalation-email-preferences');
      const payload = res?.data || res || {};
      const CANONICAL_ALERT_TYPES = [
        'FOLLOWUP_OVERDUE',
        'QUOTATION_EXPIRING',
        'RECEIVABLE_OVERDUE',
        'DESIGN_OVERDUE',
      ];

      let prefsList = [];
      if (Array.isArray(payload.preferences)) {
        prefsList = payload.preferences;
      } else if (payload.email && typeof payload.email === 'object') {
        prefsList = CANONICAL_ALERT_TYPES.map((type) => ({
          alertType: type,
          channel: 'EMAIL',
          enabled: Boolean(payload.email[type]),
        }));
      }

      setEscalationEmailPrefs(prefsList);
      setEscalationDeliveryEmail(payload.deliveryEmail || '');
    } catch (err) {
      console.error('Failed to load escalation email preferences:', err);
    } finally {
      setLoadingEscalationPrefs(false);
    }
  }, []);

  // Update escalation email preference (Phase 8B-6 Admin/Manager)
  const handleToggleEscalationEmailPref = async (alertType, currentEnabled) => {
    const nextEnabled = !currentEnabled;
    setSavingEscalationPref(alertType);
    setEscalationPrefMessage(null);
    try {
      const res = await api.put(`/alerts/escalation-email-preferences/${alertType}`, {
        enabled: nextEnabled,
      });
      const data = res?.data || res || {};
      const updatedEnabled =
        typeof data.enabled === 'boolean' ? data.enabled : nextEnabled;

      setEscalationEmailPrefs((prev) => {
        const exists = prev.some((p) => p.alertType === alertType);
        if (exists) {
          return prev.map((p) =>
            p.alertType === alertType
              ? {
                  ...p,
                  enabled: updatedEnabled,
                  updatedAt: data.updatedAt || new Date().toISOString(),
                }
              : p
          );
        }
        return [
          ...prev,
          {
            alertType,
            channel: 'EMAIL',
            enabled: updatedEnabled,
            updatedAt: data.updatedAt || new Date().toISOString(),
          },
        ];
      });

      if (data.deliveryEmail) {
        setEscalationDeliveryEmail(data.deliveryEmail);
      }

      setEscalationPrefMessage({
        type: 'success',
        text: `Email notifications for ${alertType.replace(/_/g, ' ')} turned ${
          updatedEnabled ? 'ON' : 'OFF'
        }.`,
      });
    } catch (err) {
      setEscalationPrefMessage({
        type: 'error',
        text:
          err?.response?.data?.error ||
          err.message ||
          'Failed to update escalation email preference.',
      });
    } finally {
      setSavingEscalationPref(null);
    }
  };

  // Fetch escalation email history (Phase 8B-7)
  const fetchEscalationHistory = useCallback(async () => {
    setEscalationHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (escalationHistoryStatusFilter && escalationHistoryStatusFilter !== 'ALL') {
        queryParams.set('status', escalationHistoryStatusFilter);
      }
      if (escalationHistoryAlertTypeFilter && escalationHistoryAlertTypeFilter !== 'ALL') {
        queryParams.set('alertType', escalationHistoryAlertTypeFilter);
      }
      if (escalationHistoryEntityTypeFilter && escalationHistoryEntityTypeFilter !== 'ALL') {
        queryParams.set('entityType', escalationHistoryEntityTypeFilter);
      }
      if (escalationHistoryFromFilter) {
        queryParams.set('from', new Date(escalationHistoryFromFilter).toISOString());
      }
      if (escalationHistoryToFilter) {
        queryParams.set('to', new Date(escalationHistoryToFilter).toISOString());
      }
      queryParams.set('page', String(escalationHistoryPage));
      queryParams.set('limit', '20');

      const res = await api.get(`/alerts/escalation-email-history?${queryParams.toString()}`);
      if (res?.data) {
        setEscalationHistoryList(res.data || []);
        if (res.pagination) {
          setEscalationHistoryTotal(res.pagination.total || 0);
          setEscalationHistoryTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load escalation email history:', err);
    } finally {
      setEscalationHistoryLoading(false);
    }
  }, [
    escalationHistoryStatusFilter,
    escalationHistoryAlertTypeFilter,
    escalationHistoryEntityTypeFilter,
    escalationHistoryFromFilter,
    escalationHistoryToFilter,
    escalationHistoryPage,
  ]);

  // Fetch escalation email history summary (Phase 8B-7)
  const fetchEscalationHistorySummary = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (escalationHistoryFromFilter) {
        queryParams.set('from', new Date(escalationHistoryFromFilter).toISOString());
      }
      if (escalationHistoryToFilter) {
        queryParams.set('to', new Date(escalationHistoryToFilter).toISOString());
      }
      const qs = queryParams.toString();
      const url = qs ? `/alerts/escalation-email-history/summary?${qs}` : '/alerts/escalation-email-history/summary';
      const res = await api.get(url);
      if (res?.data) {
        setEscalationHistorySummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load escalation email history summary:', err);
    }
  }, [escalationHistoryFromFilter, escalationHistoryToFilter]);

  // Fetch escalation daily digest preference (Phase 8B-8)
  const fetchEscalationDigestPreference = useCallback(async () => {
    setLoadingEscalationDigestPrefs(true);
    try {
      const res = await api.get('/alerts/escalation-digest-preference');
      if (res?.data) {
        setEscalationDigestEnabled(Boolean(res.data.enabled));
        setEscalationDigestDeliveryEmail(res.data.deliveryEmail || '');
      }
    } catch (err) {
      console.error('Failed to load escalation digest preferences:', err);
    } finally {
      setLoadingEscalationDigestPrefs(false);
    }
  }, []);

  // Toggle escalation daily digest preference (Phase 8B-8)
  const handleToggleEscalationDigest = async (newVal) => {
    setSavingEscalationDigestPref(true);
    setEscalationDigestPrefMessage(null);
    try {
      const res = await api.put('/alerts/escalation-digest-preference', { enabled: newVal });
      if (res?.data) {
        setEscalationDigestEnabled(Boolean(res.data.enabled));
        if (res.data.deliveryEmail) {
          setEscalationDigestDeliveryEmail(res.data.deliveryEmail);
        }
      } else {
        setEscalationDigestEnabled(newVal);
      }
      setEscalationDigestPrefMessage({
        type: 'success',
        text: newVal ? 'Escalation Daily Digest enabled' : 'Escalation Daily Digest disabled',
      });
    } catch (err) {
      console.error('Failed to update escalation digest preference:', err);
      setEscalationDigestPrefMessage({
        type: 'error',
        text: err?.response?.data?.error || err.message || 'Failed to update escalation digest preference',
      });
    } finally {
      setSavingEscalationDigestPref(false);
      setTimeout(() => setEscalationDigestPrefMessage(null), 4000);
    }
  };

  // Fetch escalation daily digest history (Phase 8B-9)
  const fetchEscalationDigestHistory = useCallback(async () => {
    setEscalationDigestHistoryLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (escalationDigestHistoryStatusFilter && escalationDigestHistoryStatusFilter !== 'ALL') {
        queryParams.set('status', escalationDigestHistoryStatusFilter);
      }
      if (escalationDigestHistoryReasonFilter && escalationDigestHistoryReasonFilter !== 'ALL') {
        queryParams.set('failureReason', escalationDigestHistoryReasonFilter);
      }
      if (escalationDigestHistoryLocalDateFilter) {
        queryParams.set('localDigestDate', escalationDigestHistoryLocalDateFilter);
      }
      if (escalationDigestHistoryFromFilter) {
        queryParams.set('from', new Date(escalationDigestHistoryFromFilter).toISOString());
      }
      if (escalationDigestHistoryToFilter) {
        queryParams.set('to', new Date(escalationDigestHistoryToFilter).toISOString());
      }
      queryParams.set('page', String(escalationDigestHistoryPage));
      queryParams.set('limit', '20');

      const res = await api.get(`/alerts/escalation-digest-history?${queryParams.toString()}`);
      if (res?.data) {
        setEscalationDigestHistoryList(res.data || []);
        if (res.pagination) {
          setEscalationDigestHistoryTotal(res.pagination.total || 0);
          setEscalationDigestHistoryTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load escalation digest history:', err);
    } finally {
      setEscalationDigestHistoryLoading(false);
    }
  }, [
    escalationDigestHistoryStatusFilter,
    escalationDigestHistoryReasonFilter,
    escalationDigestHistoryLocalDateFilter,
    escalationDigestHistoryFromFilter,
    escalationDigestHistoryToFilter,
    escalationDigestHistoryPage,
  ]);

  // Fetch escalation daily digest history summary (Phase 8B-9)
  const fetchEscalationDigestHistorySummary = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (escalationDigestHistoryFromFilter) {
        queryParams.set('from', new Date(escalationDigestHistoryFromFilter).toISOString());
      }
      if (escalationDigestHistoryToFilter) {
        queryParams.set('to', new Date(escalationDigestHistoryToFilter).toISOString());
      }
      const qs = queryParams.toString();
      const url = qs ? `/alerts/escalation-digest-history/summary?${qs}` : '/alerts/escalation-digest-history/summary';
      const res = await api.get(url);
      if (res?.data) {
        setEscalationDigestHistorySummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load escalation digest history summary:', err);
    }
  }, [escalationDigestHistoryFromFilter, escalationDigestHistoryToFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchSummary();
      if (activeTab === 'overview') {
        fetchOverview();
      } else if (activeTab === 'alerts') {
        fetchAlerts();
      } else if (activeTab === 'preferences') {
        fetchPreferences();
        fetchDigestPreferences();
      } else if (activeTab === 'history') {
        fetchHistory();
        fetchHistorySummary();
      } else if (activeTab === 'digest-history') {
        fetchDigestHistory();
        fetchDigestHistorySummary();
      } else if (activeTab === 'escalations') {
        fetchEscalations();
        fetchEscalationsSummary();
        fetchEscalationPolicies();
        fetchEscalationEmailPreferences();
        fetchEscalationHistory();
        fetchEscalationHistorySummary();
        fetchEscalationDigestPreference();
        fetchEscalationDigestHistory();
        fetchEscalationDigestHistorySummary();
      }
    }
  }, [
    isOpen,
    activeTab,
    fetchSummary,
    fetchOverview,
    fetchAlerts,
    fetchPreferences,
    fetchDigestPreferences,
    fetchHistory,
    fetchHistorySummary,
    fetchDigestHistory,
    fetchDigestHistorySummary,
    fetchEscalations,
    fetchEscalationsSummary,
    fetchEscalationPolicies,
    fetchEscalationEmailPreferences,
    fetchEscalationHistory,
    fetchEscalationHistorySummary,
    fetchEscalationDigestPreference,
    fetchEscalationDigestHistory,
    fetchEscalationDigestHistorySummary,
  ]);

  const handleMarkRead = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/read`);
      await fetchSummary();
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to mark alert read:', err);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/acknowledge`);
      await fetchSummary();
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleDismiss = async (alertId) => {
    try {
      await api.post(`/alerts/${alertId}/dismiss`);
      await fetchSummary();
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to dismiss alert:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/alerts/read-all');
      await fetchSummary();
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to mark all alerts read:', err);
    }
  };

  const handleTogglePreference = (alertType) => {
    setPreferences((prev) => ({
      ...prev,
      email: {
        ...prev.email,
        [alertType]: !prev.email[alertType],
      },
    }));
    setPrefMessage(null);
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    setPrefMessage(null);
    try {
      const res = await api.put('/alerts/preferences', {
        email: preferences.email,
      });
      if (res?.data) {
        setPreferences((prev) => ({
          ...prev,
          email: res.data.email,
        }));
        setPrefMessage({
          type: 'success',
          text: 'Email notification preferences saved successfully.',
        });
      }
    } catch (err) {
      setPrefMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to save preferences.',
      });
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleToggleDigestAlertType = (alertType) => {
    setDigestPrefs((prev) => {
      const current = prev.includedAlertTypes || [];
      const updated = current.includes(alertType)
        ? current.filter((t) => t !== alertType)
        : [...current, alertType];
      return {
        ...prev,
        includedAlertTypes: updated,
      };
    });
    setDigestMessage(null);
  };

  const handleSaveDigestPreferences = async () => {
    setSavingDigestPrefs(true);
    setDigestMessage(null);
    try {
      const res = await api.put('/alerts/digest-preferences', {
        enabled: digestPrefs.enabled,
        timeOfDay: digestPrefs.timeOfDay,
        timezone: 'Asia/Kolkata',
        includedAlertTypes: digestPrefs.includedAlertTypes,
      });
      if (res?.data) {
        setDigestPrefs((prev) => ({
          ...prev,
          ...res.data,
        }));
        setDigestMessage({
          type: 'success',
          text: 'Daily alert digest preferences saved successfully.',
        });
      }
    } catch (err) {
      setDigestMessage({
        type: 'error',
        text: err?.response?.data?.error || err.message || 'Failed to save digest preferences.',
      });
    } finally {
      setSavingDigestPrefs(false);
    }
  };

  const getEntityLink = (alert) => {
    if (alert.entityType === 'Followup') return '/dashboard/followups';
    if (alert.entityType === 'Quotation') return '/dashboard/quotations';
    if (alert.entityType === 'Order') return '/dashboard/orders';
    if (alert.entityType === 'DesignProject') return '/dashboard/design';
    return '/dashboard';
  };

  if (!isOpen) return null;

  const roleLower = (userRole || '').toLowerCase();
  const isAdmin = roleLower === 'admin';
  const isManager = roleLower === 'manager';
  const isSales = roleLower === 'sales';
  const isDesigner = roleLower === 'designer';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Operational Alerts
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Proactive business situation & exception notifications
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'overview'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'alerts'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Alerts ({summary.openAlerts})
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'preferences'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Prefs
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Alert History
            </button>
            <button
              onClick={() => setActiveTab('digest-history')}
              className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                activeTab === 'digest-history'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Digest History
            </button>
            {(isAdmin || isManager) && (
              <button
                onClick={() => setActiveTab('escalations')}
                className={`py-2.5 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  activeTab === 'escalations'
                    ? 'border-rose-600 text-rose-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <AlertOctagon className="w-4 h-4" />
                Escalations {escalationsSummary.totalOpen > 0 && `(${escalationsSummary.totalOpen})`}
              </button>
            )}
          </div>

          {activeTab === 'overview' ? (
            <div className="p-4 space-y-6 overflow-y-auto">
              {/* Header / Refresh Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Workload Overview</h3>
                  <p className="text-xs text-slate-500">Live operational alert snapshot and current workload</p>
                </div>
                <button
                  onClick={fetchOverview}
                  disabled={overviewLoading}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                  title="Refresh Overview"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${overviewLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {overviewLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
                  <span className="text-xs">Loading live overview...</span>
                </div>
              ) : (
                <>
                  {/* Operational Alerts Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-indigo-600" />
                        Operational Alerts
                      </h4>
                      <button
                        onClick={() => setActiveTab('alerts')}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        View All <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Total Open Alerts Card */}
                      <div
                        onClick={() => setActiveTab('alerts')}
                        className="cursor-pointer col-span-2 bg-gradient-to-br from-indigo-50 to-white p-4 rounded-xl border border-indigo-100 shadow-sm hover:border-indigo-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                              Total Open Alerts
                            </span>
                            <div className="text-2xl font-black text-slate-900 mt-1">
                              {overview.operationalAlerts?.totalOpen || 0}
                            </div>
                          </div>
                          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <ShieldAlert className="w-6 h-6" />
                          </div>
                        </div>
                        {/* Personal State Badges */}
                        <div className="mt-3 pt-3 border-t border-indigo-50 flex items-center gap-2 flex-wrap text-[11px]">
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md border border-amber-200/60 font-medium">
                            {overview.operationalAlerts?.personalState?.unread || 0} Unread
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-medium">
                            {overview.operationalAlerts?.personalState?.read || 0} Read
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200/60 font-medium">
                            {overview.operationalAlerts?.personalState?.acknowledged || 0} Ack'd
                          </span>
                          <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-200 font-medium">
                            {overview.operationalAlerts?.personalState?.dismissed || 0} Dismissed
                          </span>
                        </div>
                      </div>

                      {/* Follow-up Overdue */}
                      <div
                        onClick={() => setActiveTab('alerts')}
                        className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Follow-up Overdue
                        </span>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {overview.operationalAlerts?.byType?.FOLLOWUP_OVERDUE || 0}
                        </div>
                      </div>

                      {/* Quotation Expiring */}
                      <div
                        onClick={() => setActiveTab('alerts')}
                        className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Quotation Expiring
                        </span>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {overview.operationalAlerts?.byType?.QUOTATION_EXPIRING || 0}
                        </div>
                      </div>

                      {/* Receivable Overdue */}
                      <div
                        onClick={() => setActiveTab('alerts')}
                        className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Receivable Overdue
                        </span>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {overview.operationalAlerts?.byType?.RECEIVABLE_OVERDUE || 0}
                        </div>
                      </div>

                      {/* Design Overdue */}
                      <div
                        onClick={() => setActiveTab('alerts')}
                        className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Design Overdue
                        </span>
                        <div className="text-xl font-bold text-slate-900 mt-1">
                          {overview.operationalAlerts?.byType?.DESIGN_OVERDUE || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Management Escalations Section (strictly ADMIN & MANAGER only) */}
                  {(isAdmin || isManager) && overview.escalations?.available && (
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                          <AlertOctagon className="w-4 h-4 text-rose-600" />
                          Management Escalations
                        </h4>
                        <button
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
                        >
                          View List <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {/* Total Open Escalations Card */}
                        <div
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="cursor-pointer col-span-2 bg-gradient-to-br from-rose-50 to-white p-4 rounded-xl border border-rose-100 shadow-sm hover:border-rose-300 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                                Open Escalations
                              </span>
                              <div className="text-2xl font-black text-slate-900 mt-1">
                                {overview.escalations?.totalOpen || 0}
                              </div>
                            </div>
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                              <AlertOctagon className="w-6 h-6" />
                            </div>
                          </div>
                        </div>

                        {/* Follow-up Overdue Escalations */}
                        <div
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all"
                        >
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Follow-up Overdue
                          </span>
                          <div className="text-xl font-bold text-slate-900 mt-1">
                            {overview.escalations?.byType?.FOLLOWUP_OVERDUE || 0}
                          </div>
                        </div>

                        {/* Quotation Expiring Escalations */}
                        <div
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all"
                        >
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Quotation Expiring
                          </span>
                          <div className="text-xl font-bold text-slate-900 mt-1">
                            {overview.escalations?.byType?.QUOTATION_EXPIRING || 0}
                          </div>
                        </div>

                        {/* Receivable Overdue Escalations */}
                        <div
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all"
                        >
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Receivable Overdue
                          </span>
                          <div className="text-xl font-bold text-slate-900 mt-1">
                            {overview.escalations?.byType?.RECEIVABLE_OVERDUE || 0}
                          </div>
                        </div>

                        {/* Design Overdue Escalations */}
                        <div
                          onClick={() => {
                            setActiveTab('escalations');
                            setEscalationsSubTab('list');
                          }}
                          className="cursor-pointer bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all"
                        >
                          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                            Design Overdue
                          </span>
                          <div className="text-xl font-bold text-slate-900 mt-1">
                            {overview.escalations?.byType?.DESIGN_OVERDUE || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : activeTab === 'alerts' ? (
            <>
              {/* Metric Badges */}
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-100/60 border-b border-slate-200 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Open Alerts
                  </span>
                  <span className="text-lg font-extrabold text-slate-800">
                    {summary.openAlerts}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider block">
                    Unread
                  </span>
                  <span className="text-lg font-extrabold text-amber-600">
                    {summary.unreadAlerts}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider block">
                    Critical
                  </span>
                  <span className="text-lg font-extrabold text-rose-600">
                    {summary.criticalAlerts}
                  </span>
                </div>
              </div>

              {/* Filter Bar */}
              <div className="p-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-600 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Filters:
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="OPEN">Open Only</option>
                    <option value="RESOLVED">Resolved Only</option>
                    <option value="ALL">All Statuses</option>
                  </select>

                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="WARNING">Warning</option>
                    <option value="INFO">Info</option>
                  </select>

                  <select
                    value={readFilter}
                    onChange={(e) => setReadFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Read States</option>
                    <option value="UNREAD">Unread Only</option>
                    <option value="READ">Read Only</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  {summary.unreadAlerts > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      fetchSummary();
                      fetchAlerts();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                    title="Refresh alerts"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
              </div>

              {/* Alert List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {loading && alerts.length === 0 ? (
                  <div className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    <p className="text-xs">Loading operational alerts...</p>
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200 p-8">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/80" />
                    <p className="text-sm font-semibold text-slate-700">
                      All Clear
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      No operational exceptions matching your current filters.
                    </p>
                  </div>
                ) : (
                  alerts.map((alert) => {
                    const isUnread = !alert.isRead;
                    const isResolved = alert.status === 'RESOLVED';
                    const isCritical = alert.severity === 'CRITICAL';

                    return (
                      <div
                        key={alert._id}
                        className={`p-4 rounded-xl border transition-all ${
                          isResolved
                            ? 'bg-slate-50 border-slate-200 opacity-75'
                            : isUnread
                            ? 'bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50/50'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        {/* Top Meta */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-700'
                                  : alert.severity === 'WARNING'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {alert.severity}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {alert.alertType.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {alert.detectedAt
                                ? new Date(alert.detectedAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                            {isResolved && (
                              <span className="ml-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                RESOLVED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Message */}
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {alert.title}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {alert.message}
                        </p>

                        {/* Acknowledgment Notice if present */}
                        {alert.acknowledgedAt && (
                          <div className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>
                              Acknowledged on{' '}
                              {new Date(alert.acknowledgedAt).toLocaleString()}
                            </span>
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              onClose();
                              router.push(getEntityLink(alert));
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>View Record</span>
                          </button>

                          <div className="flex items-center gap-1">
                            {isUnread && (
                              <button
                                onClick={() => handleMarkRead(alert._id)}
                                title="Mark as Read"
                                className="p-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Read</span>
                              </button>
                            )}

                            {!alert.acknowledgedAt && !isResolved && (
                              <button
                                onClick={() => handleAcknowledge(alert._id)}
                                title="Acknowledge Exception"
                                className="p-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors inline-flex items-center gap-1 font-semibold"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Acknowledge</span>
                              </button>
                            )}

                            <button
                              onClick={() => handleDismiss(alert._id)}
                              title="Dismiss from your view"
                              className="p-1.5 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <BellOff className="w-3.5 h-3.5" />
                              <span>Dismiss</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : activeTab === 'preferences' ? (
            /* Preferences View */
            <div className="flex-1 overflow-y-auto p-5 bg-slate-50/60 flex flex-col justify-between">
              <div className="space-y-5">
                {/* Intro & Delivery Email Info */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Email Notifications
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Opt in to receive email notifications when new operational exceptions occur.
                      </p>
                      <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                        <span className="text-slate-500 block text-[11px] font-semibold uppercase">
                          Current Account Delivery Email
                        </span>
                        <span className="font-mono font-bold text-slate-900 mt-0.5 block">
                          {preferences.deliveryEmail || 'Loading current account email...'}
                        </span>
                        <p className="text-[11px] text-slate-400 mt-1 italic">
                          Alert emails are sent only to your current CRM account email.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Notice */}
                {prefMessage && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      prefMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {prefMessage.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>{prefMessage.text}</span>
                  </div>
                )}

                {/* Preference Toggles List */}
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Select Alert Categories
                    </span>
                  </div>

                  {/* 1. Followup Overdue */}
                  <div
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      isDesigner ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Overdue Follow-ups
                        </span>
                        {isDesigner && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            Sales Role Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email me when a scheduled customer follow-up passes its due time.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isDesigner || loadingPrefs || savingPrefs}
                        checked={Boolean(preferences.email.FOLLOWUP_OVERDUE)}
                        onChange={() => handleTogglePreference('FOLLOWUP_OVERDUE')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* 2. Quotation Expiring */}
                  <div
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      isDesigner ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Expiring Quotations
                        </span>
                        {isDesigner && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            Sales Role Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email me when an active quotation is expiring within the next 3 calendar days.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isDesigner || loadingPrefs || savingPrefs}
                        checked={Boolean(preferences.email.QUOTATION_EXPIRING)}
                        onChange={() => handleTogglePreference('QUOTATION_EXPIRING')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* 3. Receivable Overdue */}
                  <div
                    className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                      isDesigner ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Overdue Receivables
                        </span>
                        {isDesigner && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            Financial Role Only
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email me when an order payment is overdue with an outstanding balance.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={isDesigner || loadingPrefs || savingPrefs}
                        checked={Boolean(preferences.email.RECEIVABLE_OVERDUE)}
                        onChange={() => handleTogglePreference('RECEIVABLE_OVERDUE')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* 4. Design Overdue */}
                  <div className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <span className="text-xs font-bold text-slate-900">
                        Overdue Design Projects
                      </span>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Email me when an active design project passes its target delivery date.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={loadingPrefs || savingPrefs}
                        checked={Boolean(preferences.email.DESIGN_OVERDUE)}
                        onChange={() => handleTogglePreference('DESIGN_OVERDUE')}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>

                {/* Explanatory note */}
                <div className="flex items-start gap-2 text-slate-500 text-[11px] bg-slate-100/70 p-3 rounded-lg">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Turning email preferences off does not hide, dismiss, or resolve any in-app alerts.
                    In-app alerts remain fully available in this drawer.
                  </span>
                </div>

                {/* Save Immediate Preferences Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPrefs || loadingPrefs}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {savingPrefs ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Email Preferences</span>
                      </>
                    )}
                  </button>
                </div>

                {/* ---------------- Daily Alert Digest Card ---------------- */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            Daily Alert Digest
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Receive an optional consolidated daily email summarizing your open exceptions.
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer ml-3">
                          <input
                            type="checkbox"
                            disabled={loadingDigestPrefs || savingDigestPrefs}
                            checked={Boolean(digestPrefs.enabled)}
                            onChange={(e) =>
                              setDigestPrefs((prev) => ({
                                ...prev,
                                enabled: e.target.checked,
                              }))
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      {/* Status Notice */}
                      {digestMessage && (
                        <div
                          className={`mt-3 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                            digestMessage.type === 'success'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {digestMessage.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                          )}
                          <span>{digestMessage.text}</span>
                        </div>
                      )}

                      {/* Digest Options when Enabled */}
                      {digestPrefs.enabled && (
                        <div className="mt-4 space-y-4 pt-3 border-t border-slate-100">
                          {/* Time of Day & Timezone */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                Delivery Time (IST)
                              </label>
                              <select
                                value={digestPrefs.timeOfDay}
                                onChange={(e) =>
                                  setDigestPrefs((prev) => ({
                                    ...prev,
                                    timeOfDay: e.target.value,
                                  }))
                                }
                                disabled={savingDigestPrefs}
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="08:00">08:00 AM IST</option>
                                <option value="09:00">09:00 AM IST (Default)</option>
                                <option value="10:00">10:00 AM IST</option>
                                <option value="12:00">12:00 PM IST</option>
                                <option value="14:00">02:00 PM IST</option>
                                <option value="18:00">06:00 PM IST</option>
                                <option value="20:00">08:00 PM IST</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                Timezone
                              </label>
                              <div className="p-2 bg-slate-100/70 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 flex items-center justify-between">
                                <span>Asia/Kolkata</span>
                                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">IST (+05:30)</span>
                              </div>
                            </div>
                          </div>

                          {/* Next Run Info */}
                          {digestPrefs.nextRunAt && (
                            <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-lg text-xs text-indigo-900 flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                Next Scheduled Digest:
                              </span>
                              <span className="font-bold">
                                {new Date(digestPrefs.nextRunAt).toLocaleString('en-IN', {
                                  timeZone: 'Asia/Kolkata',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })}{' '}
                                IST
                              </span>
                            </div>
                          )}

                          {/* Included Alert Types */}
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                              Included Alert Categories
                            </span>
                            <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                              {/* Followup Overdue */}
                              <label
                                className={`flex items-center justify-between ${
                                  isDesigner ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <span className="font-medium text-slate-800">Follow-up Overdue</span>
                                <input
                                  type="checkbox"
                                  disabled={isDesigner || savingDigestPrefs}
                                  checked={Boolean(
                                    digestPrefs.includedAlertTypes?.includes('FOLLOWUP_OVERDUE')
                                  )}
                                  onChange={() => handleToggleDigestAlertType('FOLLOWUP_OVERDUE')}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </label>

                              {/* Quotation Expiring */}
                              <label
                                className={`flex items-center justify-between ${
                                  isDesigner ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <span className="font-medium text-slate-800">Expiring Quotations (next 3 calendar days)</span>
                                <input
                                  type="checkbox"
                                  disabled={isDesigner || savingDigestPrefs}
                                  checked={Boolean(
                                    digestPrefs.includedAlertTypes?.includes('QUOTATION_EXPIRING')
                                  )}
                                  onChange={() => handleToggleDigestAlertType('QUOTATION_EXPIRING')}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </label>

                              {/* Receivable Overdue */}
                              <label
                                className={`flex items-center justify-between ${
                                  isDesigner ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <span className="font-medium text-slate-800">Overdue Receivables</span>
                                <input
                                  type="checkbox"
                                  disabled={isDesigner || savingDigestPrefs}
                                  checked={Boolean(
                                    digestPrefs.includedAlertTypes?.includes('RECEIVABLE_OVERDUE')
                                  )}
                                  onChange={() => handleToggleDigestAlertType('RECEIVABLE_OVERDUE')}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </label>

                              {/* Design Overdue */}
                              <label
                                className={`flex items-center justify-between ${
                                  isSales ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                }`}
                              >
                                <span className="font-medium text-slate-800">Overdue Design Projects</span>
                                <input
                                  type="checkbox"
                                  disabled={isSales || savingDigestPrefs}
                                  checked={Boolean(
                                    digestPrefs.includedAlertTypes?.includes('DESIGN_OVERDUE')
                                  )}
                                  onChange={() => handleToggleDigestAlertType('DESIGN_OVERDUE')}
                                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                              </label>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 italic">
                            Daily digest emails are sent to your current CRM account email: <strong className="text-slate-600">{digestPrefs.deliveryEmail || preferences.deliveryEmail}</strong>
                          </p>
                        </div>
                      )}

                      {/* Digest Save Button */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={handleSaveDigestPreferences}
                          disabled={savingDigestPrefs || loadingDigestPrefs}
                          className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {savingDigestPrefs ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Save Digest Settings</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'history' ? (
            /* Email Notification History View */
            <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/60">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 p-4 bg-slate-100/70 border-b border-slate-200 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Attempts
                  </span>
                  <span className="text-base font-extrabold text-slate-800">
                    {historySummary.total}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                    Sent
                  </span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {historySummary.success}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                    Skipped
                  </span>
                  <span className="text-base font-extrabold text-amber-600">
                    {historySummary.skipped}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
                    Failed
                  </span>
                  <span className="text-base font-extrabold text-rose-600">
                    {historySummary.failed}
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={historyStatusFilter}
                    onChange={(e) => {
                      setHistoryStatusFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="SUCCESS">Success (Sent)</option>
                    <option value="SKIPPED">Skipped</option>
                    <option value="FAILED">Failed</option>
                    <option value="PROCESSING">Processing</option>
                  </select>

                  <select
                    value={historyAlertTypeFilter}
                    onChange={(e) => {
                      setHistoryAlertTypeFilter(e.target.value);
                      setHistoryPage(1);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    <option value="FOLLOWUP_OVERDUE">Follow-up Overdue</option>
                    <option value="QUOTATION_EXPIRING">Quotation Expiring</option>
                    <option value="RECEIVABLE_OVERDUE">Overdue Receivable</option>
                    <option value="DESIGN_OVERDUE">Design Overdue</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setHistoryStatusFilter('');
                    setHistoryAlertTypeFilter('');
                    setHistoryPage(1);
                    fetchHistory();
                    fetchHistorySummary();
                  }}
                  title="Reset filters"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Reset</span>
                </button>
              </div>

              {/* History Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-xs">Loading delivery history...</span>
                  </div>
                ) : historyList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No delivery attempts found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dispatched alert email notification records will appear here.
                    </p>
                  </div>
                ) : (
                  historyList.map((item) => {
                    const isSuccess = item.status === 'SUCCESS';
                    const isFailed = item.status === 'FAILED';
                    const isSkipped = item.status === 'SKIPPED';
                    const isProcessing = item.status === 'PROCESSING';

                    return (
                      <div
                        key={item._id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300"
                      >
                        {/* Status & Timing Header */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                                isSuccess
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFailed
                                  ? 'bg-rose-100 text-rose-800'
                                  : isSkipped
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isSuccess && <CheckCircle2 className="w-2.5 h-2.5" />}
                              {isFailed && <AlertCircle className="w-2.5 h-2.5" />}
                              {isSkipped && <Info className="w-2.5 h-2.5" />}
                              {isProcessing && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                              <span>{item.status}</span>
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              {item.alertType ? item.alertType.replace(/_/g, ' ') : 'ALERT'}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.attemptedAt
                              ? new Date(item.attemptedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </span>
                        </div>

                        {/* Alert Title */}
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {item.alertTitle || 'Operational Alert Notification'}
                        </h4>

                        {/* Reason Box if Skipped or Failed */}
                        {(item.failureReasonLabel || item.failureReason) && (
                          <div
                            className={`mt-2 p-2 rounded-lg text-[11px] flex items-start gap-1.5 ${
                              isSkipped
                                ? 'bg-amber-50 text-amber-800 border border-amber-200/60'
                                : 'bg-rose-50 text-rose-800 border border-rose-200/60'
                            }`}
                          >
                            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{item.failureReasonLabel || item.failureReason}</span>
                          </div>
                        )}

                        {/* Footer Info & Open Alert Action */}
                        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-600">
                              {item.channel || 'EMAIL'}
                            </span>
                            {item.recipient && (
                              <span className="text-slate-600">
                                To: <strong>{item.recipient.name}</strong>
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              onClose();
                              router.push(getEntityLink({ entityType: item.entityType }));
                            }}
                            className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline text-[11px]"
                          >
                            <span>Open Alert</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Bar */}
              {historyTotalPages > 1 && (
                <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {historyPage} of {historyTotalPages} ({historyTotal} items)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={historyPage <= 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                      disabled={historyPage >= historyTotalPages}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'digest-history' ? (
            /* Personal Daily Digest Run History View */
            <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/60">
              {/* Summary Metrics Bar */}
              <div className="grid grid-cols-4 gap-2 p-4 bg-slate-100/70 border-b border-slate-200 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Total Runs
                  </span>
                  <span className="text-base font-extrabold text-slate-800">
                    {digestHistorySummary.totalRuns}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                    Success
                  </span>
                  <span className="text-base font-extrabold text-emerald-600">
                    {digestHistorySummary.success}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                    Skipped
                  </span>
                  <span className="text-base font-extrabold text-amber-600">
                    {digestHistorySummary.skipped}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
                    Failed
                  </span>
                  <span className="text-base font-extrabold text-rose-600">
                    {digestHistorySummary.failed}
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={digestHistoryStatusFilter}
                    onChange={(e) => {
                      setDigestHistoryStatusFilter(e.target.value);
                      setDigestHistoryPage(1);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="SKIPPED">Skipped</option>
                    <option value="FAILED">Failed</option>
                    <option value="PROCESSING">Processing</option>
                  </select>

                  <select
                    value={digestHistoryReasonFilter}
                    onChange={(e) => {
                      setDigestHistoryReasonFilter(e.target.value);
                      setDigestHistoryPage(1);
                    }}
                    className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Outcomes / Reasons</option>
                    <option value="NO_OPEN_ALERTS">No Open Alerts</option>
                    <option value="USER_NOT_FOUND">User Not Found</option>
                    <option value="USER_INACTIVE">User Inactive</option>
                    <option value="TENANT_MISMATCH">Tenant Mismatch</option>
                    <option value="TENANT_INACTIVE">Tenant Inactive</option>
                    <option value="INVALID_USER_EMAIL">Invalid Email</option>
                    <option value="SMTP_CONFIG_MISSING">SMTP Not Configured</option>
                    <option value="EMAIL_SEND_FAILED">Email Delivery Failed</option>
                    <option value="DUPLICATE_DAILY_ATTEMPT">Duplicate Daily Run</option>
                    <option value="PREFERENCE_DISABLED">Digest Disabled</option>
                    <option value="FAILED_STALE">Run Incomplete (Stale)</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setDigestHistoryStatusFilter('');
                    setDigestHistoryReasonFilter('');
                    setDigestHistoryPage(1);
                    fetchDigestHistory();
                    fetchDigestHistorySummary();
                  }}
                  title="Reset filters"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Reset</span>
                </button>
              </div>

              {/* History Items List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {digestHistoryLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span className="text-xs">Loading digest history...</span>
                  </div>
                ) : digestHistoryList.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No daily digest runs found</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Daily digest executions for your account will appear here.
                    </p>
                  </div>
                ) : (
                  digestHistoryList.map((item) => {
                    const isSuccess = item.status === 'SUCCESS';
                    const isFailed = item.status === 'FAILED';
                    const isSkipped = item.status === 'SKIPPED';
                    const runIdentifier = item.runId || item._id;

                    return (
                      <div
                        key={runIdentifier}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300 space-y-2"
                      >
                        {/* Header: Date & Status */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {item.localDigestDate}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                isSuccess
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isFailed
                                  ? 'bg-rose-100 text-rose-800'
                                  : isSkipped
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>

                        {/* Execution Timestamps in explicit IST (Asia/Kolkata) */}
                        <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase">Scheduled For (IST)</span>
                            <span className="font-mono text-slate-700">{formatIstDateTime(item.scheduledFor)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase">Attempted At (IST)</span>
                            <span className="font-mono text-slate-700">
                              {item.attemptedAt ? formatIstDateTime(item.attemptedAt) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] font-medium uppercase">Completed At (IST)</span>
                            <span className="font-mono text-slate-700">
                              {item.completedAt ? formatIstDateTime(item.completedAt) : '—'}
                            </span>
                          </div>
                        </div>

                        {/* Alert count and breakdown */}
                        <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                          <span className="font-semibold text-slate-800">
                            {item.alertCount} alert{item.alertCount === 1 ? '' : 's'} summarized
                          </span>
                          {item.breakdown && (item.breakdown.critical > 0 || item.breakdown.warning > 0 || item.breakdown.info > 0) && (
                            <span className="text-[10px] text-slate-500 font-medium">
                              {item.breakdown.critical || 0} critical &bull; {item.breakdown.warning || 0} warning &bull; {item.breakdown.info || 0} info
                            </span>
                          )}
                        </div>

                        {/* Outcome / Reason message */}
                        {item.failureReasonLabel && (
                          <div className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700'
                              : isSkipped
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}>
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>{item.failureReasonLabel}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination Bar */}
              {digestHistoryTotalPages > 1 && (
                <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Page {digestHistoryPage} of {digestHistoryTotalPages} ({digestHistoryTotal} items)
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDigestHistoryPage((p) => Math.max(1, p - 1))}
                      disabled={digestHistoryPage <= 1}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDigestHistoryPage((p) => Math.min(digestHistoryTotalPages, p + 1))}
                      disabled={digestHistoryPage >= digestHistoryTotalPages}
                      className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'escalations' && (isAdmin || isManager) ? (
            /* Management-Only Escalations View (Phase 8B-5) */
            <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/60">
              {/* Management Sub-tabs (Admin & Manager) */}
              <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2 text-xs overflow-x-auto">
                <button
                  onClick={() => setEscalationsSubTab('list')}
                  className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    escalationsSubTab === 'list'
                      ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Escalations List
                </button>
                <button
                  onClick={() => {
                    setEscalationsSubTab('email-prefs');
                    fetchEscalationEmailPreferences();
                  }}
                  className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    escalationsSubTab === 'email-prefs'
                      ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Email Preferences
                </button>
                <button
                  onClick={() => {
                    setEscalationsSubTab('email-history');
                    fetchEscalationHistory();
                    fetchEscalationHistorySummary();
                  }}
                  className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    escalationsSubTab === 'email-history'
                      ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Email History
                </button>
                <button
                  onClick={() => {
                    setEscalationsSubTab('daily-digest');
                    fetchEscalationDigestPreference();
                  }}
                  className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    escalationsSubTab === 'daily-digest'
                      ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Daily Digest
                </button>
                <button
                  onClick={() => {
                    setEscalationsSubTab('escalation-digest-history');
                    fetchEscalationDigestHistory();
                    fetchEscalationDigestHistorySummary();
                  }}
                  className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                    escalationsSubTab === 'escalation-digest-history'
                      ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Escalation Digest History
                </button>
                {isAdmin && (
                  <button
                    onClick={() => setEscalationsSubTab('settings')}
                    className={`py-1.5 px-3 font-semibold rounded-t-lg whitespace-nowrap transition-colors ${
                      escalationsSubTab === 'settings'
                        ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Escalation Policies
                  </button>
                )}
              </div>

              {escalationsSubTab === 'email-prefs' ? (
                /* Management Personal Email Preferences View (Phase 8B-6) */
                <div className="flex-1 p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Escalation Email Notifications
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive an internal notification email immediately when a new operational alert escalates to management.
                    </p>
                  </div>

                  {/* Delivery Address Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Delivery Email Address
                      </span>
                      <span className="text-sm font-medium text-slate-900 break-all block mt-0.5">
                        {escalationDeliveryEmail || 'No verified email address on file'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Notifications are delivered strictly to your verified CRM user email on file. To update this address, contact an administrator.
                      </p>
                    </div>
                  </div>

                  {escalationPrefMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        escalationPrefMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{escalationPrefMessage.text}</span>
                    </div>
                  )}

                  {loadingEscalationPrefs ? (
                    <div className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      <p className="text-xs">Loading escalation email preferences...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        {
                          type: 'FOLLOWUP_OVERDUE',
                          title: 'Follow-up Overdue',
                          desc: 'Notify me via email when an overdue client follow-up escalates.',
                        },
                        {
                          type: 'QUOTATION_EXPIRING',
                          title: 'Quotation Expiring',
                          desc: 'Notify me via email when an expiring quotation alert escalates.',
                        },
                        {
                          type: 'RECEIVABLE_OVERDUE',
                          title: 'Receivable Overdue',
                          desc: 'Notify me via email when an overdue invoice or payment alert escalates.',
                        },
                        {
                          type: 'DESIGN_OVERDUE',
                          title: 'Design Overdue',
                          desc: 'Notify me via email when an overdue design task alert escalates.',
                        },
                      ].map((item) => {
                        const pref = escalationEmailPrefs.find((p) => p.alertType === item.type) || {
                          alertType: item.type,
                          enabled: false,
                        };
                        const isSaving = savingEscalationPref === item.type;

                        return (
                          <div
                            key={item.type}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-slate-900">
                                    {item.title}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                      pref.enabled
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-500 border border-slate-200'
                                    }`}
                                  >
                                    {pref.enabled ? 'Enabled' : 'Disabled'}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                  {item.desc}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  checked={Boolean(pref.enabled)}
                                  disabled={isSaving}
                                  onChange={() =>
                                    handleToggleEscalationEmailPref(item.type, Boolean(pref.enabled))
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600 disabled:opacity-50"></div>
                              </label>
                            </div>
                            {pref.updatedAt && (
                              <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                                Last updated: {formatIstDateTime(pref.updatedAt)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : escalationsSubTab === 'email-history' ? (
                /* Management Personal Escalation Email Delivery History View (Phase 8B-7) */
                <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/60">
                  {/* Summary Metrics Bar */}
                  <div className="p-4 bg-slate-100/70 border-b border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Personal Escalation Email History
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Read-only delivery attempts for your escalation emails. Observational only.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          fetchEscalationHistory();
                          fetchEscalationHistorySummary();
                        }}
                        title="Refresh History"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${escalationHistoryLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Total
                        </span>
                        <span className="text-base font-extrabold text-slate-800">
                          {escalationHistorySummary.total}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                          Success
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {escalationHistorySummary.success}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
                          Failed
                        </span>
                        <span className="text-base font-extrabold text-rose-600">
                          {escalationHistorySummary.failed}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                          Skipped
                        </span>
                        <span className="text-base font-extrabold text-amber-600">
                          {escalationHistorySummary.skipped}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">
                          Processing
                        </span>
                        <span className="text-base font-extrabold text-sky-600">
                          {escalationHistorySummary.processing}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                          Success Rate
                        </span>
                        <span className="text-base font-extrabold text-indigo-600 block">
                          {escalationHistorySummary.successRatePercent !== null
                            ? `${escalationHistorySummary.successRatePercent}%`
                            : 'N/A'}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-0.5">
                          (excl. skip/proc)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="p-3 bg-white border-b border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={escalationHistoryStatusFilter}
                          onChange={(e) => {
                            setEscalationHistoryStatusFilter(e.target.value);
                            setEscalationHistoryPage(1);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">All Statuses</option>
                          <option value="SUCCESS">Delivered (Success)</option>
                          <option value="FAILED">Failed</option>
                          <option value="SKIPPED">Skipped</option>
                          <option value="PROCESSING">Processing</option>
                        </select>

                        <select
                          value={escalationHistoryAlertTypeFilter}
                          onChange={(e) => {
                            setEscalationHistoryAlertTypeFilter(e.target.value);
                            setEscalationHistoryPage(1);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">All Alert Types</option>
                          <option value="FOLLOWUP_OVERDUE">Follow-up Overdue</option>
                          <option value="QUOTATION_EXPIRING">Quotation Expiring</option>
                          <option value="RECEIVABLE_OVERDUE">Receivable Overdue</option>
                          <option value="DESIGN_OVERDUE">Design Overdue</option>
                        </select>

                        <select
                          value={escalationHistoryEntityTypeFilter}
                          onChange={(e) => {
                            setEscalationHistoryEntityTypeFilter(e.target.value);
                            setEscalationHistoryPage(1);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">All Entity Types</option>
                          <option value="Followup">Followup</option>
                          <option value="Quotation">Quotation</option>
                          <option value="Order">Order</option>
                          <option value="DesignProject">Design Project</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setEscalationHistoryStatusFilter('');
                          setEscalationHistoryAlertTypeFilter('');
                          setEscalationHistoryEntityTypeFilter('');
                          setEscalationHistoryFromFilter('');
                          setEscalationHistoryToFilter('');
                          setEscalationHistoryPage(1);
                        }}
                        title="Reset filters"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reset</span>
                      </button>
                    </div>

                    {/* Date Filters based on attemptedAt */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Attempted From:</span>
                        <input
                          type="date"
                          value={escalationHistoryFromFilter}
                          onChange={(e) => {
                            setEscalationHistoryFromFilter(e.target.value);
                            setEscalationHistoryPage(1);
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Attempted To:</span>
                        <input
                          type="date"
                          value={escalationHistoryToFilter}
                          onChange={(e) => {
                            setEscalationHistoryToFilter(e.target.value);
                            setEscalationHistoryPage(1);
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* History List */}
                  <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {escalationHistoryLoading ? (
                      <div className="py-12 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-500" />
                        <p className="text-xs">Loading escalation delivery history...</p>
                      </div>
                    ) : escalationHistoryList.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 space-y-2">
                        <Mail className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-medium">No escalation email delivery attempts found.</p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Historical delivery attempts matching your active filters and scope will appear here.
                        </p>
                      </div>
                    ) : (
                      escalationHistoryList.map((item) => {
                        const isSuccess = item.status === 'SUCCESS';
                        const isFailed = item.status === 'FAILED';
                        const isSkipped = item.status === 'SKIPPED';
                        const isProcessing = item.status === 'PROCESSING';

                        const alertTypeLabels = {
                          FOLLOWUP_OVERDUE: 'Follow-up Overdue',
                          QUOTATION_EXPIRING: 'Quotation Expiring',
                          RECEIVABLE_OVERDUE: 'Receivable Overdue',
                          DESIGN_OVERDUE: 'Design Overdue',
                        };

                        const handleNavigate = () => {
                          if (!item.entityId) return;
                          if (item.entityType === 'Followup') router.push('/followups');
                          else if (item.entityType === 'Quotation') router.push('/quotations');
                          else if (item.entityType === 'Order') router.push('/orders');
                          else if (item.entityType === 'DesignProject') router.push('/design-projects');
                        };

                        return (
                          <div
                            key={item.historyId}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5 transition-all hover:border-slate-300"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${
                                    isSuccess
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : isFailed
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : isSkipped
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-sky-50 text-sky-700 border border-sky-200'
                                  }`}
                                >
                                  {item.statusLabel || item.status}
                                </span>
                                <span className="text-xs font-bold text-slate-900">
                                  {alertTypeLabels[item.alertType] || item.alertType}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                  {item.entityType}
                                </span>
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                  item.escalationStatus === 'RESOLVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.escalationStatus === 'RESOLVED' ? 'Resolved' : 'Escalation Open'}
                              </span>
                            </div>

                            {/* Timestamps & Threshold Details */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-500 bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Attempted At:</span>
                                <span className="font-medium text-slate-700">
                                  {formatIstDateTime(item.attemptedAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Completed At:</span>
                                <span className="font-medium text-slate-700">
                                  {formatIstDateTime(item.completedAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Threshold:</span>
                                <span className="font-medium text-slate-700">
                                  {item.thresholdMinutesSnapshot ? `${item.thresholdMinutesSnapshot}m` : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Failure / Skip Reason */}
                            {item.failureReasonLabel && (
                              <div
                                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                                  isSuccess
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isSkipped
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.failureReasonLabel}</span>
                              </div>
                            )}

                            {/* View Source Link */}
                            {item.entityId && (
                              <div className="flex justify-end pt-1 border-t border-slate-100">
                                <button
                                  onClick={handleNavigate}
                                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                >
                                  View Source <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination Bar */}
                  {escalationHistoryTotalPages > 1 && (
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Page {escalationHistoryPage} of {escalationHistoryTotalPages} ({escalationHistoryTotal} items)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEscalationHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={escalationHistoryPage <= 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEscalationHistoryPage((p) => Math.min(escalationHistoryTotalPages, p + 1))}
                          disabled={escalationHistoryPage >= escalationHistoryTotalPages}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : escalationsSubTab === 'settings' && isAdmin ? (
                /* Admin Policy Configuration View */
                <div className="flex-1 p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Operational Alert Escalation Policies
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure threshold durations. When an open alert remains unresolved beyond this limit, an escalation is created for management.
                    </p>
                  </div>

                  {policyMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        policyMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{policyMessage.text}</span>
                    </div>
                  )}

                  {loadingPolicies ? (
                    <div className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                      <p className="text-xs">Loading escalation policies...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {escalationPolicies.map((policy) => {
                        const alertTypeLabels = {
                          FOLLOWUP_OVERDUE: 'Follow-up Overdue',
                          QUOTATION_EXPIRING: 'Quotation Expiring',
                          RECEIVABLE_OVERDUE: 'Receivable Overdue',
                          DESIGN_OVERDUE: 'Design Overdue',
                        };

                        return (
                          <div
                            key={policy.alertType}
                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                  {alertTypeLabels[policy.alertType] || policy.alertType}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {policy.enabled
                                    ? `Escalates after ${policy.thresholdMinutes} mins (${Math.round(
                                        policy.thresholdMinutes / 60
                                      )}h)`
                                    : 'Escalation disabled'}
                                </span>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={policy.enabled}
                                  onChange={(e) => {
                                    const nextEnabled = e.target.checked;
                                    handleUpdatePolicy(
                                      policy.alertType,
                                      nextEnabled,
                                      policy.thresholdMinutes
                                    );
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                              </label>
                            </div>

                            {/* Preset Buttons & Custom Threshold */}
                            <div className="space-y-1.5 pt-1 border-t border-slate-100">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Threshold Presets:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {[
                                  { label: '1h', mins: 60 },
                                  { label: '2h', mins: 120 },
                                  { label: '4h', mins: 240 },
                                  { label: '8h', mins: 480 },
                                  { label: '24h', mins: 1440 },
                                  { label: '48h', mins: 2880 },
                                  { label: '72h', mins: 4320 },
                                  { label: '7d', mins: 10080 },
                                ].map((preset) => (
                                  <button
                                    key={preset.mins}
                                    type="button"
                                    onClick={() =>
                                      handleUpdatePolicy(
                                        policy.alertType,
                                        policy.enabled,
                                        preset.mins
                                      )
                                    }
                                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                                      policy.thresholdMinutes === preset.mins
                                        ? 'bg-rose-600 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {policy.updatedAt && (
                              <p className="text-[10px] text-slate-400">
                                Last updated: {formatIstDateTime(policy.updatedAt)}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : escalationsSubTab === 'daily-digest' ? (
                /* Management Escalation Daily Digest Preference View (Phase 8B-8) */
                <div className="flex-1 p-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Escalation Daily Digest
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Receive one daily email summarizing your currently open management escalations.
                    </p>
                  </div>

                  {escalationDigestPrefMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                        escalationDigestPrefMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      <Info className="w-4 h-4 shrink-0" />
                      <span>{escalationDigestPrefMessage.text}</span>
                    </div>
                  )}

                  {/* Delivery Address Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                        Delivery Email
                      </span>
                      <span className="text-sm font-medium text-slate-900 break-all block mt-0.5">
                        {escalationDigestDeliveryEmail || escalationDeliveryEmail || preferences.deliveryEmail || 'current CRM User.email'}
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Digest emails are delivered strictly to your current CRM account email.
                      </p>
                    </div>
                  </div>

                  {/* Digest Toggle Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5 pr-4">
                        <span className="text-xs font-bold text-slate-800 block">
                          Daily Digest
                        </span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          Receive one daily email summarizing your currently open management escalations.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Scheduled daily at 09:00 AM IST (Asia/Kolkata).
                        </p>
                        <p className="text-[11px] text-slate-400 italic">
                          No email is sent when you have no open escalations.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={escalationDigestEnabled}
                          disabled={loadingEscalationDigestPrefs || savingEscalationDigestPref}
                          onChange={(e) => handleToggleEscalationDigest(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600 disabled:opacity-50"></div>
                      </label>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Status: <strong className={escalationDigestEnabled ? 'text-emerald-600 font-semibold' : 'text-slate-500 font-semibold'}>{escalationDigestEnabled ? 'Enabled (ON)' : 'Disabled (OFF)'}</strong>
                      </span>
                      {savingEscalationDigestPref && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : escalationsSubTab === 'escalation-digest-history' ? (
                /* Management Personal Escalation Daily Digest Run History View (Phase 8B-9) */
                <div className="flex-1 overflow-y-auto flex flex-col bg-slate-50/60">
                  {/* Summary Metrics Bar */}
                  <div className="p-4 bg-slate-100/70 border-b border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          Personal Escalation Digest History
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Read-only history of your daily escalation digest executions. Observational only.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          fetchEscalationDigestHistory();
                          fetchEscalationDigestHistorySummary();
                        }}
                        title="Refresh History"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${escalationDigestHistoryLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* Informational Disclaimer */}
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 text-[11px] text-sky-800 flex items-start gap-1.5">
                      <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                      <span>
                        SUCCESS represents application/SMTP send success state recorded by Phase 8B-8 and is not proof that the recipient read or received the message in their inbox.
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1">
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Total Runs
                        </span>
                        <span className="text-base font-extrabold text-slate-800">
                          {escalationDigestHistorySummary.total}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                          Successful
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {escalationDigestHistorySummary.success}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
                          Failed
                        </span>
                        <span className="text-base font-extrabold text-rose-600">
                          {escalationDigestHistorySummary.failed}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider block">
                          Skipped
                        </span>
                        <span className="text-base font-extrabold text-amber-600">
                          {escalationDigestHistorySummary.skipped}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-sky-600 uppercase tracking-wider block">
                          Processing
                        </span>
                        <span className="text-base font-extrabold text-sky-600">
                          {escalationDigestHistorySummary.processing}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider block">
                          Success Rate
                        </span>
                        <span className="text-base font-extrabold text-indigo-600 block">
                          {escalationDigestHistorySummary.successRatePercent !== null
                            ? `${escalationDigestHistorySummary.successRatePercent}%`
                            : 'N/A'}
                        </span>
                        <span className="text-[9px] text-slate-400 block -mt-0.5">
                          (excl. skip/proc)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filters:</span>
                    </div>

                    <select
                      value={escalationDigestHistoryStatusFilter}
                      onChange={(e) => {
                        setEscalationDigestHistoryStatusFilter(e.target.value);
                        setEscalationDigestHistoryPage(1);
                      }}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="SUCCESS">Sent Successfully</option>
                      <option value="FAILED">Failed</option>
                      <option value="SKIPPED">Skipped</option>
                      <option value="PROCESSING">Processing</option>
                    </select>

                    <select
                      value={escalationDigestHistoryReasonFilter}
                      onChange={(e) => {
                        setEscalationDigestHistoryReasonFilter(e.target.value);
                        setEscalationDigestHistoryPage(1);
                      }}
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">All Reasons</option>
                      <option value="PREFERENCE_DISABLED">Digest Disabled</option>
                      <option value="USER_NOT_FOUND">User Not Found</option>
                      <option value="USER_INACTIVE">User Inactive</option>
                      <option value="TENANT_MISMATCH">Tenant Mismatch</option>
                      <option value="TENANT_INACTIVE">Tenant Inactive</option>
                      <option value="ROLE_NOT_ELIGIBLE">Role Not Eligible</option>
                      <option value="NO_OPEN_ESCALATIONS">No Open Escalations</option>
                      <option value="INVALID_USER_EMAIL">Invalid Email</option>
                      <option value="SMTP_CONFIG_MISSING">SMTP Missing</option>
                      <option value="EMAIL_SEND_FAILED">Email Send Failed</option>
                    </select>

                    <input
                      type="date"
                      value={escalationDigestHistoryLocalDateFilter}
                      onChange={(e) => {
                        setEscalationDigestHistoryLocalDateFilter(e.target.value);
                        setEscalationDigestHistoryPage(1);
                      }}
                      title="Filter by local digest date (YYYY-MM-DD)"
                      className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium text-xs focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 text-[10px] uppercase">Attempted:</span>
                      <input
                        type="datetime-local"
                        value={escalationDigestHistoryFromFilter}
                        onChange={(e) => {
                          setEscalationDigestHistoryFromFilter(e.target.value);
                          setEscalationDigestHistoryPage(1);
                        }}
                        title="From attempted time"
                        className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px]"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="datetime-local"
                        value={escalationDigestHistoryToFilter}
                        onChange={(e) => {
                          setEscalationDigestHistoryToFilter(e.target.value);
                          setEscalationDigestHistoryPage(1);
                        }}
                        title="To attempted time"
                        className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-[11px]"
                      />
                    </div>

                    <button
                      onClick={() => {
                        setEscalationDigestHistoryStatusFilter('');
                        setEscalationDigestHistoryReasonFilter('');
                        setEscalationDigestHistoryLocalDateFilter('');
                        setEscalationDigestHistoryFromFilter('');
                        setEscalationDigestHistoryToFilter('');
                        setEscalationDigestHistoryPage(1);
                      }}
                      title="Reset filters"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Reset</span>
                    </button>
                  </div>

                  {/* History Run Cards List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {escalationDigestHistoryLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-xs">Loading escalation digest history...</span>
                      </div>
                    ) : escalationDigestHistoryList.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-semibold text-slate-600">No escalation digest runs found</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Daily escalation digest executions for your account will appear here.
                        </p>
                      </div>
                    ) : (
                      escalationDigestHistoryList.map((item) => {
                        const isSuccess = item.status === 'SUCCESS';
                        const isFailed = item.status === 'FAILED';
                        const isSkipped = item.status === 'SKIPPED';
                        const runKey = item.historyId || item._id;

                        return (
                          <div
                            key={runKey}
                            className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm transition-all hover:border-slate-300 space-y-2.5"
                          >
                            {/* Header: Date, Status, Included Count */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                  {item.localDigestDate}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                    isSuccess
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : isFailed
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : isSkipped
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-sky-50 text-sky-700 border-sky-200'
                                  }`}
                                >
                                  {item.statusLabel || item.status}
                                </span>
                              </div>
                              <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                {item.includedCount} row{item.includedCount === 1 ? '' : 's'} included
                              </span>
                            </div>

                            {/* Execution Timestamps in explicit IST */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">Attempted At (IST)</span>
                                <span className="font-mono text-slate-700">
                                  {item.attemptedAt ? formatIstDateTime(item.attemptedAt) : '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">Completed At (IST)</span>
                                <span className="font-mono text-slate-700">
                                  {item.completedAt ? formatIstDateTime(item.completedAt) : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Open Escalations Snapshot & Breakdown */}
                            <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-700">
                                <span className="font-semibold text-slate-800">
                                  Total Open Snapshot: {item.openCountsSnapshot?.totalOpen || 0}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px] text-slate-500 pt-0.5">
                                <div className="bg-white px-2 py-1 rounded border border-slate-100">
                                  Follow-up: <strong className="text-slate-700">{item.openCountsSnapshot?.byAlertType?.FOLLOWUP_OVERDUE || 0}</strong>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-100">
                                  Quotation: <strong className="text-slate-700">{item.openCountsSnapshot?.byAlertType?.QUOTATION_EXPIRING || 0}</strong>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-100">
                                  Receivable: <strong className="text-slate-700">{item.openCountsSnapshot?.byAlertType?.RECEIVABLE_OVERDUE || 0}</strong>
                                </div>
                                <div className="bg-white px-2 py-1 rounded border border-slate-100">
                                  Design: <strong className="text-slate-700">{item.openCountsSnapshot?.byAlertType?.DESIGN_OVERDUE || 0}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Failure / Skip Reason Banner */}
                            {item.failureReasonLabel && (
                              <div
                                className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                                  isSuccess
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : isSkipped
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                <Info className="w-3.5 h-3.5 shrink-0" />
                                <span>{item.failureReasonLabel}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination Bar */}
                  {escalationDigestHistoryTotalPages > 1 && (
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Page {escalationDigestHistoryPage} of {escalationDigestHistoryTotalPages} ({escalationDigestHistoryTotal} items)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEscalationDigestHistoryPage((p) => Math.max(1, p - 1))}
                          disabled={escalationDigestHistoryPage <= 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEscalationDigestHistoryPage((p) => Math.min(escalationDigestHistoryTotalPages, p + 1))}
                          disabled={escalationDigestHistoryPage >= escalationDigestHistoryTotalPages}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Escalations List View */
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Summary Metrics Bar */}
                  <div className="p-4 bg-slate-100/70 border-b border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-rose-600 uppercase tracking-wider block">
                          Open Escalations
                        </span>
                        <span className="text-base font-extrabold text-rose-600">
                          {escalationsSummary.totalOpen}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider block">
                          Resolved
                        </span>
                        <span className="text-base font-extrabold text-emerald-600">
                          {escalationsSummary.totalResolved}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Oldest Overdue
                        </span>
                        <span className="text-xs font-bold text-slate-700 block truncate">
                          {escalationsSummary.oldestOpenEscalatedAt
                            ? formatIstDateTime(escalationsSummary.oldestOpenEscalatedAt)
                            : 'None'}
                        </span>
                      </div>
                    </div>
                    {/* All 4 Canonical Alert Types Breakdown */}
                    <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/80 text-center text-[10px]">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block truncate font-medium">Follow-up</span>
                        <span className="font-bold text-slate-800">{escalationsSummary.openByAlertType?.FOLLOWUP_OVERDUE || 0}</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block truncate font-medium">Quotation</span>
                        <span className="font-bold text-slate-800">{escalationsSummary.openByAlertType?.QUOTATION_EXPIRING || 0}</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block truncate font-medium">Receivable</span>
                        <span className="font-bold text-slate-800">{escalationsSummary.openByAlertType?.RECEIVABLE_OVERDUE || 0}</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                        <span className="text-slate-500 block truncate font-medium">Design</span>
                        <span className="font-bold text-slate-800">{escalationsSummary.openByAlertType?.DESIGN_OVERDUE || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Filters Bar */}
                  <div className="p-3 bg-white border-b border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          value={escalationsStatusFilter}
                          onChange={(e) => {
                            setEscalationsStatusFilter(e.target.value);
                            setEscalationsPage(1);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">All Statuses</option>
                          <option value="OPEN">Open Only</option>
                          <option value="RESOLVED">Resolved Only</option>
                        </select>

                        <select
                          value={escalationsTypeFilter}
                          onChange={(e) => {
                            setEscalationsTypeFilter(e.target.value);
                            setEscalationsPage(1);
                          }}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:ring-1 focus:ring-rose-500"
                        >
                          <option value="">All Alert Types</option>
                          <option value="FOLLOWUP_OVERDUE">Follow-up Overdue</option>
                          <option value="QUOTATION_EXPIRING">Quotation Expiring</option>
                          <option value="RECEIVABLE_OVERDUE">Receivable Overdue</option>
                          <option value="DESIGN_OVERDUE">Design Overdue</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setEscalationsStatusFilter('');
                          setEscalationsTypeFilter('');
                          setEscalationsFromFilter('');
                          setEscalationsToFilter('');
                          setEscalationsPage(1);
                        }}
                        title="Reset filters"
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Reset</span>
                      </button>
                    </div>

                    {/* Date Filters based on escalatedAt */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">From (Escalated At):</span>
                        <input
                          type="date"
                          value={escalationsFromFilter}
                          onChange={(e) => {
                            setEscalationsFromFilter(e.target.value);
                            setEscalationsPage(1);
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">To (Escalated At):</span>
                        <input
                          type="date"
                          value={escalationsToFilter}
                          onChange={(e) => {
                            setEscalationsToFilter(e.target.value);
                            setEscalationsPage(1);
                          }}
                          className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Escalations List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {escalationsLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                        <span className="text-xs">Loading escalations...</span>
                      </div>
                    ) : escalationsList.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 p-6">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        <p className="text-xs font-semibold text-slate-600">No escalations found</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Active operational alerts exceeding configured thresholds will appear here.
                        </p>
                      </div>
                    ) : (
                      escalationsList.map((item) => {
                        const isOpen = item.status === 'OPEN';
                        const alertTypeLabels = {
                          FOLLOWUP_OVERDUE: 'Follow-up Overdue',
                          QUOTATION_EXPIRING: 'Quotation Expiring',
                          RECEIVABLE_OVERDUE: 'Receivable Overdue',
                          DESIGN_OVERDUE: 'Design Overdue',
                        };

                        return (
                          <div
                            key={item.escalationId}
                            className={`p-3.5 rounded-xl border shadow-sm transition-all space-y-2 ${
                              isOpen
                                ? 'bg-white border-rose-200 ring-1 ring-rose-50'
                                : 'bg-slate-50 border-slate-200 opacity-80'
                            }`}
                          >
                            {/* Header: Alert Type & Status */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                                  {alertTypeLabels[item.alertType] || item.alertType}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                                    isOpen
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-slate-400">
                                {item.entityType}
                              </span>
                            </div>

                            {/* Source summary message if available */}
                            {item.sourceSummary?.title && (
                              <p className="text-xs font-semibold text-slate-900">
                                {item.sourceSummary.title}
                              </p>
                            )}

                            {/* Execution Timestamps in explicit IST (Asia/Kolkata) */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">
                                  Alert Detected At (IST)
                                </span>
                                <span className="font-mono text-slate-700">
                                  {formatIstDateTime(item.alertDetectedAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">
                                  Escalation Due At (IST)
                                </span>
                                <span className="font-mono text-slate-700">
                                  {formatIstDateTime(item.escalationDueAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">
                                  Escalated At (IST)
                                </span>
                                <span className="font-mono text-slate-700">
                                  {formatIstDateTime(item.escalatedAt)}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px] font-medium uppercase">
                                  Resolved At (IST)
                                </span>
                                <span className="font-mono text-slate-700">
                                  {item.resolvedAt ? formatIstDateTime(item.resolvedAt) : '—'}
                                </span>
                              </div>
                            </div>

                            {/* Threshold Snapshot and Source Link */}
                            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                              <span className="text-[11px] text-slate-600 font-medium">
                                Threshold Snapshot: {item.thresholdMinutesSnapshot} mins ({Math.round(item.thresholdMinutesSnapshot / 60)}h)
                              </span>
                              <button
                                onClick={() => {
                                  const link = getEntityLink(item);
                                  router.push(link);
                                  onClose();
                                }}
                                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                              >
                                View Source <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Pagination Bar */}
                  {escalationsTotalPages > 1 && (
                    <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Page {escalationsPage} of {escalationsTotalPages} ({escalationsTotal} items)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEscalationsPage((p) => Math.max(1, p - 1))}
                          disabled={escalationsPage <= 1}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEscalationsPage((p) => Math.min(escalationsTotalPages, p + 1))}
                          disabled={escalationsPage >= escalationsTotalPages}
                          className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40 rounded"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
