import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Header } from '../components/Header';
import { useAuth } from '../context/AuthContext';
import {
  adminGetStats,
  adminGetAllReports,
  adminAssignDepartment,
  updateReportStatus,
  getReportById,
  getDepartments,
  getMappedReports,
} from '../services/reports';
import {
  ShieldCheck,
  BarChart3,
  Map,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Activity,
  Building2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Eye,
  MapPin,
  Calendar,
  Users,
  Cpu,
  Wrench,
  BadgeCheck,
  TrendingUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { CivicImpactCard } from '../components/CivicImpactCard';
import { VisualEvidenceCard } from '../components/VisualEvidenceCard';

// ─── Colour tokens ─────────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  critical: { badge: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800', dot: '#c85c5c' },
  high:     { badge: 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800', dot: '#c28a3a' },
  moderate: { badge: 'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800', dot: '#3b6ea8' },
  low:      { badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800', dot: '#3e9b72' },
};

const STATUS_COLORS = {
  submitted:   'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300',
  ai_analyzed: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300',
  assigned:    'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300',
  in_progress: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300',
  resolved:    'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300',
};

function PriorityBadge({ priority }) {
  const key = (priority || 'moderate').toLowerCase();
  const cfg = PRIORITY_COLORS[key] || PRIORITY_COLORS.moderate;
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${cfg.badge}`}>
      {key.charAt(0).toUpperCase() + key.slice(1)}
    </span>
  );
}

function StatusBadge({ status }) {
  const key = (status || 'submitted').toLowerCase();
  const display = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${STATUS_COLORS[key] || STATUS_COLORS.submitted}`}>
      {display}
    </span>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Map marker icon ───────────────────────────────────────────────────────────
function createPriorityIcon(priority) {
  const cfg = PRIORITY_COLORS[(priority || 'moderate').toLowerCase()] || PRIORITY_COLORS.moderate;
  const color = cfg.dot;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
    <circle cx="14" cy="14" r="12" fill="${color}" opacity="0.25"/>
    <circle cx="14" cy="14" r="8" fill="${color}" stroke="white" stroke-width="2"/>
    <path d="M14 26 L9 18 Q14 23 19 18 Z" fill="${color}"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [28, 36], iconAnchor: [14, 34], popupAnchor: [0, -32] });
}

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, colorClass, sub }) {
  return (
    <div className="civic-card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl border ${colorClass} shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-[#17233c] dark:text-white tabular-nums">
          {value !== undefined && value !== null ? value.toLocaleString() : '—'}
        </div>
        <div className="text-xs font-semibold text-[#52627a] dark:text-slate-400">{label}</div>
        {sub && <div className="text-[10px] text-[#718096] dark:text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

// ─── STATUS_MESSAGES ──────────────────────────────────────────────────────────
const STATUS_MESSAGES = {
  submitted:   'Report has been officially submitted into the civic registry.',
  ai_analyzed: 'CivicPulse AI has completed analysis and impact scoring.',
  assigned:    'Municipal team has been notified and the case has been assigned.',
  in_progress: 'Municipal team has started working on this issue.',
  resolved:    'The civic issue has been verified and resolved. Thank you for reporting.',
};

// ─── Admin Case Detail View ────────────────────────────────────────────────────
function AdminCaseDetail({ reportId, onBack }) {
  const [report, setReport] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusSaving, setStatusSaving] = useState(false);
  const [deptSaving, setDeptSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [saveResult, setSaveResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [rRes, dRes] = await Promise.all([getReportById(reportId), getDepartments()]);
      if (rRes.success && rRes.data) {
        setReport(rRes.data);
        setSelectedStatus(rRes.data.status || 'submitted');
        setSelectedDeptId(rRes.data.department_id || rRes.data.recommended_department_id || '');
        setStatusMsg(STATUS_MESSAGES[rRes.data.status] || '');
      }
      if (dRes.success) setDepartments(dRes.data || []);
      setLoading(false);
    };
    load();
  }, [reportId]);

  const handleStatusUpdate = async () => {
    if (!selectedStatus) return;
    setStatusSaving(true);
    setSaveResult(null);
    const msg = statusMsg || STATUS_MESSAGES[selectedStatus] || '';
    const res = await updateReportStatus(reportId, { status: selectedStatus, message: msg });
    setSaveResult(res.success ? { ok: true, text: 'Status updated successfully.' } : { ok: false, text: res.error });
    if (res.success) setReport(prev => ({ ...prev, status: selectedStatus }));
    setStatusSaving(false);
  };

  const handleDeptAssign = async () => {
    if (!selectedDeptId) return;
    setDeptSaving(true);
    setSaveResult(null);
    const res = await adminAssignDepartment(reportId, selectedDeptId);
    setSaveResult(res.success ? { ok: true, text: 'Department assigned successfully.' } : { ok: false, text: res.error });
    if (res.success) setReport(prev => ({ ...prev, department_id: selectedDeptId }));
    setDeptSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8]" />
      </div>
    );
  }
  if (!report) {
    return <p className="text-center text-[#52627a] dark:text-slate-400 py-16">Report not found.</p>;
  }

  const ai = report.ai_analysis;
  const aiDeptName = ai?.departments?.name || ai?.recommended_department || null;
  const assignedDept = departments.find(d => d.id === (report.department_id));
  const timeline = report.updates || [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-[#3b6ea8] hover:underline cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Reports
      </button>

      {/* Header */}
      <div className="civic-card p-6 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-xs font-mono text-[#52627a] dark:text-slate-400">#{report.case_number}</span>
            <h2 className="text-lg font-extrabold text-[#17233c] dark:text-white leading-tight">{report.title}</h2>
            <div className="flex flex-wrap gap-2 mt-1">
              <StatusBadge status={report.status} />
              <PriorityBadge priority={report.priority} />
              {report.category && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#f5f8fc] dark:bg-[#172447] border border-[#dce5f0] dark:border-[#1e293b] text-[#52627a] dark:text-slate-400">
                  {report.category}
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-[#718096] dark:text-slate-500 shrink-0 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(report.created_at)}
          </div>
        </div>

        {report.description && (
          <p className="text-sm text-[#52627a] dark:text-slate-300 leading-relaxed border-t border-[#dce5f0] dark:border-[#1e293b] pt-3">
            {report.description}
          </p>
        )}

        {(report.address || report.latitude) && (
          <div className="flex items-center gap-1.5 text-xs text-[#52627a] dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-[#3b6ea8]" />
            {report.address || `${report.latitude?.toFixed(4)}, ${report.longitude?.toFixed(4)}`}
          </div>
        )}
      </div>

      {/* AI + Impact */}
      {ai && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CivicImpactCard analysis={ai} metrics={{
            severity_score: ai.severity,
            urgency_score: ai.urgency,
            public_impact_score: ai.public_impact,
            confidence_score: ai.evidence_confidence,
            impact_score: report.impact_score,
            priority: report.priority,
          }} />
          {report.image_url && <VisualEvidenceCard analysis={ai} imageUrl={report.image_url} />}
        </div>
      )}

      {/* Department & Status Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department assignment */}
        <div className="civic-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#3b6ea8]" /> Department Assignment
          </h3>
          {aiDeptName && (
            <div className="text-xs text-[#52627a] dark:text-slate-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">AI Recommended:</span> {aiDeptName}
            </div>
          )}
          {assignedDept && (
            <div className="text-xs text-[#52627a] dark:text-slate-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
              <span className="font-semibold text-emerald-700 dark:text-emerald-300">Currently Assigned:</span> {assignedDept.name}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#52627a] dark:text-slate-400">Assign Department</label>
            <select
              value={selectedDeptId}
              onChange={e => setSelectedDeptId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#dce5f0] dark:border-[#1e293b] bg-white dark:bg-[#111c38] text-[#17233c] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3b6ea8]"
            >
              <option value="">Select department…</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleDeptAssign}
            disabled={deptSaving || !selectedDeptId}
            className="w-full py-2 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {deptSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            Assign Department
          </button>
        </div>

        {/* Status update */}
        <div className="civic-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#6477c8]" /> Update Case Status
          </h3>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#52627a] dark:text-slate-400">Status</label>
            <select
              value={selectedStatus}
              onChange={e => { setSelectedStatus(e.target.value); setStatusMsg(STATUS_MESSAGES[e.target.value] || ''); }}
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#dce5f0] dark:border-[#1e293b] bg-white dark:bg-[#111c38] text-[#17233c] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6477c8]"
            >
              {['submitted', 'ai_analyzed', 'assigned', 'in_progress', 'resolved'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#52627a] dark:text-slate-400">Update Message</label>
            <textarea
              value={statusMsg}
              onChange={e => setStatusMsg(e.target.value)}
              rows={3}
              placeholder="Enter message for citizen timeline…"
              className="w-full px-3 py-2 text-sm rounded-xl border border-[#dce5f0] dark:border-[#1e293b] bg-white dark:bg-[#111c38] text-[#17233c] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6477c8] resize-none"
            />
          </div>
          <button
            onClick={handleStatusUpdate}
            disabled={statusSaving}
            className="w-full py-2 px-4 bg-[#6477c8] hover:bg-[#4f62b0] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {statusSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Update Status
          </button>
          {saveResult && (
            <p className={`text-xs font-semibold ${saveResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {saveResult.text}
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="civic-card p-5 space-y-4">
          <h3 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#3fa7a3]" /> Case Timeline
          </h3>
          <div className="space-y-3">
            {timeline.map((u, i) => (
              <div key={u.id || i} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-[#3b6ea8] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#17233c] dark:text-white">{u.status}</span>
                    <span className="text-[10px] text-[#718096] dark:text-slate-500">{formatDate(u.created_at)}</span>
                  </div>
                  {u.message && <p className="text-xs text-[#52627a] dark:text-slate-400 mt-0.5 leading-relaxed">{u.message}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── All Reports Table ─────────────────────────────────────────────────────────
function AllReportsPanel({ onViewReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 15;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await adminGetAllReports({ limit: 200 });
      if (res.success) setReports(res.data);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = reports.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch = !search ||
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.case_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.category?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8]" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search case ID, title, category…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          className="flex-1 min-w-[200px] px-3 py-2 text-sm rounded-xl border border-[#dce5f0] dark:border-[#1e293b] bg-white dark:bg-[#111c38] text-[#17233c] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3b6ea8]"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(0); }}
          className="px-3 py-2 text-sm rounded-xl border border-[#dce5f0] dark:border-[#1e293b] bg-white dark:bg-[#111c38] text-[#17233c] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#3b6ea8]"
        >
          <option value="all">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="ai_analyzed">AI Analyzed</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <p className="text-xs text-[#718096] dark:text-slate-500">{filtered.length} report{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Desktop Table */}
      <div className="hidden md:block civic-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-[#dce5f0] dark:border-[#1e293b] bg-[#f5f8fc] dark:bg-[#0b1329]">
              {['Case ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-bold text-[#52627a] dark:text-slate-400 uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce5f0] dark:divide-[#1e293b]">
            {paginated.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-[#718096] dark:text-slate-500">No reports match your filters.</td></tr>
            ) : paginated.map(r => (
              <tr key={r.id} className="hover:bg-[#f5f8fc] dark:hover:bg-[#172447] transition-colors">
                <td className="px-4 py-3 font-mono text-[#3b6ea8] dark:text-blue-400 whitespace-nowrap">{r.case_number}</td>
                <td className="px-4 py-3 font-semibold text-[#17233c] dark:text-white max-w-[200px] truncate" title={r.title}>{r.title}</td>
                <td className="px-4 py-3 text-[#52627a] dark:text-slate-400 whitespace-nowrap">{r.category || '—'}</td>
                <td className="px-4 py-3"><PriorityBadge priority={r.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3 text-[#52627a] dark:text-slate-400 whitespace-nowrap">{r.departments?.name || '—'}</td>
                <td className="px-4 py-3 text-[#718096] dark:text-slate-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewReport(r.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#3b6ea8]/10 hover:bg-[#3b6ea8] text-[#3b6ea8] hover:text-white text-[10px] font-bold transition cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {paginated.length === 0 ? (
          <p className="text-center text-[#718096] dark:text-slate-500 py-8">No reports match your filters.</p>
        ) : paginated.map(r => (
          <div key={r.id} className="civic-card p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-[#3b6ea8] dark:text-blue-400">{r.case_number}</span>
                <p className="text-sm font-bold text-[#17233c] dark:text-white truncate">{r.title}</p>
              </div>
              <button
                onClick={() => onViewReport(r.id)}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-[#3b6ea8]/10 hover:bg-[#3b6ea8] text-[#3b6ea8] hover:text-white text-[10px] font-bold transition cursor-pointer"
              >
                <Eye className="w-3 h-3" /> View
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={r.status} />
              <PriorityBadge priority={r.priority} />
            </div>
            <div className="flex justify-between text-[10px] text-[#718096] dark:text-slate-500">
              <span>{r.category || '—'}</span>
              <span>{formatDate(r.created_at)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#dce5f0] dark:border-[#1e293b] text-[#52627a] dark:text-slate-400 disabled:opacity-40 hover:bg-[#f5f8fc] dark:hover:bg-[#172447] transition cursor-pointer"
          >Previous</button>
          <span className="text-xs text-[#718096] dark:text-slate-500">Page {page + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#dce5f0] dark:border-[#1e293b] text-[#52627a] dark:text-slate-400 disabled:opacity-40 hover:bg-[#f5f8fc] dark:hover:bg-[#172447] transition cursor-pointer"
          >Next</button>
        </div>
      )}
    </div>
  );
}

// ─── Admin Map Panel ──────────────────────────────────────────────────────────
function AdminMapPanel({ onViewReport }) {
  const [mappedReports, setMappedReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await getMappedReports();
      if (res.success) setMappedReports(res.data || []);
      setLoading(false);
    };
    load();
  }, []);

  const DEFAULT_CENTER = [20.5937, 78.9629];
  const mapCenter = mappedReports.length > 0
    ? [mappedReports[0].latitude, mappedReports[0].longitude]
    : DEFAULT_CENTER;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8]" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#52627a] dark:text-slate-400">{mappedReports.length} geolocated report{mappedReports.length !== 1 ? 's' : ''} on map</p>
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-[10px] font-semibold text-[#52627a] dark:text-slate-400">
          {Object.entries(PRIORITY_COLORS).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: cfg.dot }} />
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </span>
          ))}
        </div>
      </div>

      <div className="civic-card overflow-hidden" style={{ height: '500px' }}>
        {mappedReports.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#718096] dark:text-slate-500 text-sm">
            No geolocated reports to display.
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={mappedReports.length > 0 ? 12 : 5}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            {mappedReports.map(r => (
              <Marker
                key={r.id}
                position={[r.latitude, r.longitude]}
                icon={createPriorityIcon(r.priority)}
              >
                <Popup>
                  <div className="space-y-1 text-xs min-w-[160px]">
                    <p className="font-mono text-[#3b6ea8]">{r.case_number}</p>
                    <p className="font-bold text-[#17233c]">{r.title}</p>
                    <p className="text-[#52627a]">{r.category || '—'}</p>
                    <div className="flex gap-1 flex-wrap">
                      <StatusBadge status={r.status} />
                      <PriorityBadge priority={r.priority} />
                    </div>
                    <button
                      onClick={() => onViewReport(r.id)}
                      className="mt-1 flex items-center gap-1 text-[10px] text-[#3b6ea8] font-bold hover:underline cursor-pointer"
                    >
                      View Case <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  );
}

// ─── Overview Panel ────────────────────────────────────────────────────────────
function OverviewPanel({ stats, onViewReport }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-48">
      <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8]" />
    </div>
  );

  const catMax = stats.categoryDistribution[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Category Distribution */}
      <div className="civic-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#3b6ea8]" /> Reports by Category
        </h3>
        {stats.categoryDistribution.length === 0 ? (
          <p className="text-sm text-[#718096] dark:text-slate-500">No data available.</p>
        ) : (
          <div className="space-y-3">
            {stats.categoryDistribution.map(({ name, count }) => (
              <div key={name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#17233c] dark:text-white truncate max-w-[200px]" title={name}>{name}</span>
                  <span className="font-bold text-[#3b6ea8] dark:text-blue-400 ml-2 shrink-0">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-[#edf2f7] dark:bg-[#172447] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#3b6ea8] dark:bg-blue-500 transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.round((count / catMax) * 100))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Cases */}
      <div className="civic-card p-5 space-y-4">
        <h3 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-500" /> Critical Cases
        </h3>
        {stats.criticalCases.length === 0 ? (
          <p className="text-sm text-[#718096] dark:text-slate-500">No critical cases currently require attention.</p>
        ) : (
          <div className="space-y-2">
            {stats.criticalCases.map(r => (
              <button
                key={r.id}
                onClick={() => onViewReport(r.id)}
                className="w-full text-left civic-card civic-card-interactive p-3 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="min-w-0">
                  <span className="text-[10px] font-mono text-[#3b6ea8] dark:text-blue-400">{r.case_number}</span>
                  <p className="text-xs font-semibold text-[#17233c] dark:text-white truncate">{r.title}</p>
                  <div className="flex gap-1.5 mt-1">
                    <StatusBadge status={r.status} />
                    <span className="text-[10px] text-[#718096] dark:text-slate-500">{r.category}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#718096] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard ──────────────────────────────────────────────────────
export const AdminDashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active tab from URL path
  const getTabFromPath = useCallback(() => {
    if (location.pathname.includes('/admin/analytics')) return 'analytics';
    if (location.pathname.includes('/admin/map')) return 'map';
    if (location.pathname.match(/\/admin\/reports\/[^/]+/)) return 'case-detail';
    if (location.pathname.includes('/admin/reports')) return 'reports';
    return 'overview';
  }, [location.pathname]);

  const [activeTab, setActiveTab] = useState(getTabFromPath());
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [viewingReportId, setViewingReportId] = useState(null);

  // Extract report ID from URL
  useEffect(() => {
    const match = location.pathname.match(/\/admin\/reports\/([^/]+)/);
    if (match) {
      setViewingReportId(match[1]);
      setActiveTab('case-detail');
    }
  }, [location.pathname]);

  useEffect(() => {
    const tab = getTabFromPath();
    if (!location.pathname.match(/\/admin\/reports\/[^/]+/)) {
      setActiveTab(tab);
    }
  }, [location.pathname, getTabFromPath]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    const res = await adminGetStats();
    if (res.success) setStats(res.stats);
    setStatsLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setViewingReportId(null);
    const pathMap = { overview: '/admin', reports: '/admin/reports', map: '/admin/map', analytics: '/admin/analytics' };
    navigate(pathMap[tab] || '/admin');
  };

  const handleViewReport = (id) => {
    setViewingReportId(id);
    setActiveTab('case-detail');
    navigate(`/admin/reports/${id}`);
  };

  const handleBackToReports = () => {
    setViewingReportId(null);
    setActiveTab('reports');
    navigate('/admin/reports');
  };

  const TABS = [
    { id: 'overview',  label: 'Overview',  icon: Activity },
    { id: 'reports',   label: 'All Reports', icon: FileText },
    { id: 'map',       label: 'Civic Map',  icon: Map },
    { id: 'analytics', label: 'Analytics',  icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="Municipal Command Center" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

        {/* ── Banner ── */}
        <div className="bg-[#17233c] dark:bg-[#111c38] border border-[#3b6ea8]/30 dark:border-blue-500/20 rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono bg-[#3b6ea8]/20 text-blue-300 border border-[#3b6ea8]/30 px-3 py-1 rounded-full w-fit">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Authorized Admin Session
            </div>
            <h1 className="text-xl font-extrabold tracking-tight">Municipal Command Center</h1>
            <p className="text-sm text-slate-300">
              Welcome, <strong className="text-white">{profile?.full_name || 'Admin Officer'}</strong>. Monitor civic issues, prioritize action, and track resolution.
            </p>
          </div>
          <button
            onClick={loadStats}
            title="Refresh statistics"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Total Reports" value={stats?.total}
            icon={FileText}
            colorClass="bg-[#3b6ea8]/10 text-[#3b6ea8] border-[#3b6ea8]/20 dark:bg-blue-950 dark:text-blue-400"
          />
          <StatCard
            label="Critical Cases" value={stats?.critical}
            icon={AlertTriangle}
            colorClass="bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-400"
          />
          <StatCard
            label="Pending Cases" value={stats?.pending}
            icon={Clock}
            colorClass="bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400"
          />
          <StatCard
            label="Resolved Cases" value={stats?.resolved}
            icon={CheckCircle2}
            sub={stats ? `${stats.resolutionRate}% resolution rate` : undefined}
            colorClass="bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400"
          />
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-[#edf2f7] dark:bg-[#0b1329] p-1 rounded-xl border border-[#dce5f0] dark:border-[#1e293b] w-fit flex-wrap">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || (activeTab === 'case-detail' && tab.id === 'reports');
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#111c38] text-[#3b6ea8] dark:text-blue-400 shadow-sm'
                    : 'text-[#52627a] dark:text-slate-400 hover:text-[#17233c] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <div>
          {activeTab === 'overview' && <OverviewPanel stats={stats} onViewReport={handleViewReport} />}
          {(activeTab === 'reports') && <AllReportsPanel onViewReport={handleViewReport} />}
          {activeTab === 'case-detail' && viewingReportId && (
            <AdminCaseDetail reportId={viewingReportId} onBack={handleBackToReports} />
          )}
          {activeTab === 'map' && <AdminMapPanel onViewReport={handleViewReport} />}
          {activeTab === 'analytics' && <AnalyticsRedirect />}
        </div>
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI · Municipal Command Center · Admin Console
      </footer>
    </div>
  );
};

// Redirect analytics tab to full analytics page
function AnalyticsRedirect() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/admin/analytics'); }, [navigate]);
  return (
    <div className="flex items-center justify-center h-32">
      <Loader2 className="w-6 h-6 animate-spin text-[#3b6ea8]" />
    </div>
  );
}
