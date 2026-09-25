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
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Loader2,
  Activity,
  Check
} from 'lucide-react';

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

  const getStatusStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case 'submitted':
        return 1;
      case 'ai_analyzed':
        return 2;
      case 'assigned':
      case 'acknowledged':
        return 3;
      case 'in_progress':
      case 'resolution_submitted':
        return 4;
      case 'resolved':
        return 5;
      default:
        return 1;
    }
  };

  const timelineSteps = [
    { title: 'Report Submitted', desc: 'Case recorded in CivicPulse municipal registry' },
    { title: 'AI Analyzed', desc: 'Multimodal diagnostic, visual inspection & impact score calculated' },
    { title: 'Department Assigned', desc: 'Routed to responsible municipal department' },
    { title: 'In Progress', desc: 'Field inspection and repair operations underway' },
    { title: 'Resolved', desc: 'Civic issue verified and resolved' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans">
        <Header subtitle="Report Details" />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--muted)] font-medium">
            Loading case details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans">
        <Header subtitle="Report Details" />
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

  const currentStep = getStatusStepIndex(report.status);
  const ai = report.ai_analysis;

  // Build metrics for CivicImpactCard
  const metrics = {
    impact_score: report.impact_score || 50,
    impact_level: report.impact_score >= 75 ? 'CRITICAL' : report.impact_score >= 50 ? 'HIGH' : report.impact_score >= 25 ? 'MODERATE' : 'LOW',
    priority: report.priority || 'moderate',
    severity_score: report.severity || 50,
    severity_label: report.severity >= 75 ? 'High' : report.severity >= 50 ? 'Moderate' : 'Low',
    urgency_score: report.urgency || 50,
    urgency_label: report.urgency >= 75 ? 'High' : report.urgency >= 50 ? 'Medium' : 'Low',
    public_impact_score: report.public_impact || 50,
    public_impact_label: report.public_impact >= 75 ? 'High' : report.public_impact >= 50 ? 'Moderate' : 'Low',
    duration_score: report.duration_days ? Math.min(100, 10 + (report.duration_days - 1) * 10) : 10,
    duration_label: report.duration_days > 1 ? `Unresolved (${report.duration_days} days)` : 'Newly reported (1 day)',
    confidence_score: report.evidence_confidence || 80,
    confidence_label: `${report.evidence_confidence || 80}% Confidence`,
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle={`Case: ${report.case_number}`} />

      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Navigation & Case Meta Bar */}
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
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {report.status?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* 1. Case Information Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full border border-[var(--primary)]/20">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[var(--muted)] border-y border-[var(--border)] py-3.5">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <span className="truncate">{report.address || 'Address provided with report'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
              <span>
                Submitted on {new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Problem Description</h3>
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-line font-normal">
              {report.description}
            </p>
          </div>
        </div>

        {/* 2. AI Civic Assessment Diagnostic Card */}
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
              Confidence: {report.evidence_confidence || 80}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Severity</div>
              <div className="text-sm font-black text-rose-600 dark:text-rose-400">{report.severity || 50}/100</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Urgency</div>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400">{report.urgency || 50}/100</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Public Impact</div>
              <div className="text-sm font-black text-sky-600 dark:text-sky-400">{report.public_impact || 50}/100</div>
            </div>
            <div className="bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border)]">
              <div className="text-[var(--muted)] text-[10px] uppercase font-bold tracking-wider mb-1">Priority Rank</div>
              <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase">{report.priority || 'Moderate'}</div>
            </div>
          </div>

          {/* Detailed Findings */}
          <div className="space-y-3 pt-2">
            {ai?.summary && (
              <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">AI Problem Summary:</strong>
                <p className="text-sm text-[var(--foreground)]">{ai.summary}</p>
              </div>
            )}

            {ai?.explanation && (
              <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
                <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Classification Explanation:</strong>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{ai.explanation}</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Phase 9: Visual Evidence Intelligence Card */}
        <VisualEvidenceCard
          imageUrl={report.image_url}
          aiAnalysis={ai}
          hasImage={Boolean(report.image_url)}
        />

        {/* 4. Phase 10: Civic Impact Score Card */}
        <CivicImpactCard metrics={metrics} />

        {/* 5. Recommended Department & Action Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--primary)]" />
            Recommended Municipal Action & Routing
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
              <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Responsible Authority:</strong>
              <p className="text-sm font-bold text-[var(--foreground)]">{report.departments?.name || report.category || 'General Civic Services'}</p>
            </div>

            <div className="bg-[var(--surface-secondary)] p-4 rounded-xl border border-[var(--border)]">
              <strong className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Suggested Municipal Action:</strong>
              <p className="text-sm font-semibold text-[var(--foreground)]">{ai?.recommended_action || 'Inspect reported site and schedule repair operations.'}</p>
            </div>
          </div>
        </div>

        {/* 6. Resolution Timeline Tracker */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[var(--foreground)]">Resolution Lifecycle Timeline</h2>
            <p className="text-xs text-[var(--muted)]">Track progress from initial submission to municipal resolution</p>
          </div>

          <div className="space-y-6 pt-2">
            {timelineSteps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isCompleted = stepNumber <= currentStep;
              const isCurrent = stepNumber === currentStep;

              return (
                <div key={step.title} className="flex items-start gap-4 relative">
                  {idx < timelineSteps.length - 1 && (
                    <div
                      className={`absolute left-[15px] top-[30px] bottom-[-24px] w-[2px] ${
                        stepNumber < currentStep ? 'bg-emerald-500' : 'bg-[var(--border)]'
                      }`}
                    />
                  )}

                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs z-10 transition ${
                      isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isCurrent
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--muted)] border border-[var(--border)]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
                  </div>

                  <div className="space-y-0.5 pt-0.5">
                    <h4 className={`text-sm font-bold ${isCompleted ? 'text-[var(--foreground)]' : 'text-[var(--muted)]'}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-[var(--muted)]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] py-4 px-6 text-center text-xs text-[var(--muted)] font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
