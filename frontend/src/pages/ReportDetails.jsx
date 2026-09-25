import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { CivicImpactCard } from '../components/CivicImpactCard';
import { VisualEvidenceCard } from '../components/VisualEvidenceCard';
import { getReportById } from '../services/reports';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Activity,
  Clock,
  CircleDot,
  Circle,
  FileText,
  Cpu,
  Users,
  Wrench,
  BadgeCheck,
} from 'lucide-react';

// ─── Status Badge ─────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  submitted:   'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
  ai_analyzed: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  assigned:    'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  in_progress: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
};

function StatusBadge({ status }) {
  const key = (status || 'submitted').toLowerCase();
  const display = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Submitted';
  return (
    <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${STATUS_BADGE[key] || STATUS_BADGE.submitted}`}>
      {display}
    </span>
  );
}

// ─── Timeline Step Config ─────────────────────────────────────────────────────
const LIFECYCLE_STEPS = [
  {
    key: 'Submitted',
    icon: FileText,
    label: 'Report Submitted',
    desc: 'Civic report recorded in the CivicPulse municipal registry',
  },
  {
    key: 'AI Analyzed',
    icon: Cpu,
    label: 'AI Analyzed',
    desc: 'CivicPulse AI completed multimodal diagnosis and civic impact scoring',
  },
  {
    key: 'Department Assigned',
    icon: Users,
    label: 'Department Assigned',
    desc: 'Case routed to the responsible municipal department',
  },
  {
    key: 'In Progress',
    icon: Wrench,
    label: 'In Progress',
    desc: 'Field inspection and repair operations underway',
  },
  {
    key: 'Resolved',
    icon: BadgeCheck,
    label: 'Resolved',
    desc: 'Civic issue has been verified and resolved',
  },
];

// Maps report.status → which lifecycle step index is completed
function getLifecycleIndex(status) {
  switch ((status || '').toLowerCase()) {
    case 'submitted':   return 0;
    case 'ai_analyzed': return 1;
    case 'assigned':    return 2;
    case 'in_progress': return 3;
    case 'resolved':    return 4;
    default:            return 0;
  }
}

// ─── Timeline Component ────────────────────────────────────────────────────────
function CaseTimeline({ updates, reportStatus }) {
  const currentStepIdx = getLifecycleIndex(reportStatus);

  // Build a lookup of actual db updates by their status string
  const updateByStatus = {};
  (updates || []).forEach(u => {
    updateByStatus[u.status] = u;
  });

  return (
    <div className="space-y-0">
      {LIFECYCLE_STEPS.map((step, idx) => {
        const isCompleted = idx <= currentStepIdx;
        const isCurrent = idx === currentStepIdx;
        const isLast = idx === LIFECYCLE_STEPS.length - 1;
        const dbUpdate = updateByStatus[step.key];
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-stretch gap-4 relative">
            {/* Vertical line connector */}
            <div className="flex flex-col items-center shrink-0" style={{ width: '32px' }}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-300 ${
                  isCompleted
                    ? isCurrent
                      ? 'bg-[var(--primary)] text-white shadow-md ring-4 ring-[var(--primary)]/20'
                      : 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-[var(--surface-secondary)] text-[var(--muted)] border-2 border-[var(--border)]'
                }`}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 my-1 rounded-full transition-colors duration-300 ${
                    idx < currentStepIdx ? 'bg-emerald-500' : 'bg-[var(--border)]'
                  }`}
                  style={{ minHeight: '24px' }}
                />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
              <div className={`p-4 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? 'bg-[var(--primary)]/5 border-[var(--primary)]/30 shadow-sm'
                  : isCompleted
                  ? 'bg-[var(--surface-secondary)]/60 border-[var(--border)]'
                  : 'bg-transparent border-[var(--border)]/50'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <h4 className={`text-sm font-bold transition-colors ${
                      isCompleted ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'
                    }`}>
                      {step.label}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-1.5 py-0.5 rounded-md border border-[var(--primary)]/20">
                          Current
                        </span>
                      )}
                    </h4>
                    {dbUpdate ? (
                      <p className="text-xs text-[var(--foreground)] font-medium leading-relaxed">
                        {dbUpdate.message}
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        {step.desc}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  {dbUpdate?.created_at && (
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-semibold whitespace-nowrap">
                        <Clock className="w-3 h-3" />
                        <span>
                          {new Date(dbUpdate.created_at).toLocaleDateString('en-US', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] text-[var(--muted)] mt-0.5">
                        {new Date(dbUpdate.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ReportDetails = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      const result = await getReportById(id);
      if (result.success) {
        setReport(result.data);
      } else {
        setError(result.error || 'Could not load report details.');
      }
      setLoading(false);
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans">
        <Header subtitle="Case Details" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--muted)] font-medium">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans">
        <Header subtitle="Case Details" />
        <div className="max-w-xl mx-auto my-auto p-8 text-center space-y-4">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl w-fit mx-auto border border-rose-500/20">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">Report Not Found</h2>
          <p className="text-xs text-[var(--muted)]">{error || 'The requested case could not be located.'}</p>
          <Link
            to="/reports"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Reports
          </Link>
        </div>
      </div>
    );
  }

  const ai = report.ai_analysis;
  const updates = report.updates || [];

  // Build metrics for CivicImpactCard from stored DB values
  const metrics = {
    impact_score: report.impact_score ?? 50,
    impact_level: (report.impact_score ?? 50) >= 75 ? 'CRITICAL' : (report.impact_score ?? 50) >= 50 ? 'HIGH' : (report.impact_score ?? 50) >= 25 ? 'MODERATE' : 'LOW',
    priority: report.priority || 'moderate',
    severity_score: report.severity ?? 50,
    severity_label: (report.severity ?? 50) >= 75 ? 'High' : (report.severity ?? 50) >= 50 ? 'Moderate' : 'Low',
    urgency_score: report.urgency ?? 50,
    urgency_label: (report.urgency ?? 50) >= 75 ? 'High' : (report.urgency ?? 50) >= 50 ? 'Medium' : 'Low',
    public_impact_score: report.public_impact ?? 50,
    public_impact_label: (report.public_impact ?? 50) >= 75 ? 'High' : (report.public_impact ?? 50) >= 50 ? 'Moderate' : 'Low',
    duration_score: 10,
    duration_label: 'Newly reported (1 day)',
    confidence_score: report.evidence_confidence ?? 80,
    confidence_label: `${report.evidence_confidence ?? 80}% Confidence`,
    formula_explanation: 'CivicPulse AI combines issue severity (30%), urgency (30%), public impact (25%), duration (5%), and evidence confidence (10%) to deterministically estimate civic impact.',
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle={`Case: ${report.case_number}`} />

      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">

        {/* ── Navigation + Case Meta Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/reports"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Reports</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-lg border border-[var(--primary)]/20">
              {report.case_number}
            </span>
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* ── 1. Case Information Card ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
                {report.category || 'General Civic Services'}
              </span>
              {report.subcategory && (
                <span className="text-xs font-medium text-[var(--muted)] bg-[var(--surface-secondary)] px-2.5 py-1 rounded-full border border-[var(--border)]">
                  {report.subcategory}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              {report.title}
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--muted)] border-y border-[var(--border)] py-3.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="truncate">{report.address || 'Location recorded with report'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Submitted on {new Date(report.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Problem Description</h3>
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line">
              {report.description}
            </p>
          </div>
        </div>

        {/* ── 2. Civic Impact Score ── */}
        <CivicImpactCard metrics={metrics} />

        {/* ── 3. AI Civic Intelligence Assessment ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">AI Civic Intelligence Assessment</h2>
                <p className="text-xs text-[var(--muted)]">Multimodal physical inspection and risk evaluation</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
              {report.evidence_confidence ?? 80}% Confidence
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Severity</div>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400">{metrics.severity_score}/100</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">{metrics.severity_label}</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Urgency</div>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400">{metrics.urgency_score}/100</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">{metrics.urgency_label}</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Public Impact</div>
              <div className="text-sm font-black text-sky-600 dark:text-sky-400">{metrics.public_impact_score}/100</div>
              <div className="text-[10px] text-[var(--muted)] mt-0.5">{metrics.public_impact_label}</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Priority</div>
              <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase">{report.priority || 'Moderate'}</div>
            </div>
          </div>

          <div className="space-y-3">
            {ai?.summary && (
              <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">AI Problem Summary</strong>
                <p className="text-sm text-[var(--foreground)] leading-relaxed">{ai.summary}</p>
              </div>
            )}
            {ai?.explanation && (
              <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">Classification Explanation</strong>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{ai.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── 4. Visual Evidence Intelligence ── */}
        <VisualEvidenceCard
          imageUrl={report.image_url}
          aiAnalysis={ai}
          hasImage={Boolean(report.image_url)}
        />

        {/* ── 5. Recommended Department & Action ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--primary)]" />
            Recommended Municipal Action & Routing
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
              <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">Responsible Authority</strong>
              <p className="text-sm font-bold text-[var(--foreground)]">
                {report.departments?.name || report.category || 'General Civic Services'}
              </p>
            </div>
            <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
              <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1.5">Suggested Municipal Action</strong>
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {ai?.recommended_action || 'Inspect reported site and schedule repair operations.'}
              </p>
            </div>
          </div>
        </div>

        {/* ── 6. Case Lifecycle Timeline ── */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]">Case Lifecycle Timeline</h2>
                <p className="text-xs text-[var(--muted)]">Track progress from submission to municipal resolution</p>
              </div>
            </div>
            <StatusBadge status={report.status} />
          </div>

          <CaseTimeline updates={updates} reportStatus={report.status} />

          {updates.length === 0 && (
            <div className="text-center py-4">
              <p className="text-xs text-[var(--muted)]">No timeline events recorded yet.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-4 px-6 text-center text-xs text-[var(--muted)] font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
