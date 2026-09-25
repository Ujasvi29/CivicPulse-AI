import { Activity, ShieldAlert, AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const CivicImpactCard = ({ metrics }) => {
  if (!metrics) return null;

  const score = metrics.impact_score ?? 50;
  const level = metrics.impact_level || (score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MODERATE' : 'LOW');
  const priority = metrics.priority || level.toLowerCase();

  // Factor Scores
  const sevScore = metrics.severity_score ?? 50;
  const sevLabel = metrics.severity_label || (sevScore >= 75 ? 'High' : sevScore >= 50 ? 'Moderate' : 'Low');

  const urgScore = metrics.urgency_score ?? 50;
  const urgLabel = metrics.urgency_label || (urgScore >= 75 ? 'High' : urgScore >= 50 ? 'Medium' : 'Low');

  const pubScore = metrics.public_impact_score ?? 50;
  const pubLabel = metrics.public_impact_label || (pubScore >= 75 ? 'High' : pubScore >= 50 ? 'Moderate' : 'Low');

  const durScore = metrics.duration_score ?? 10;
  const durLabel = metrics.duration_label || 'Newly reported';

  const confScore = metrics.confidence_score ?? 80;
  const confLabel = metrics.confidence_label || `${confScore}% Confidence`;

  // Color scheme based on level
  const getColorScheme = () => {
    switch (level) {
      case 'CRITICAL':
        return {
          badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          ring: 'text-rose-600 dark:text-rose-400',
          bg: 'bg-rose-500',
          gradient: 'from-rose-500 to-red-600',
          barColor: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
          ring: 'text-amber-500 dark:text-amber-400',
          bg: 'bg-amber-500',
          gradient: 'from-amber-500 to-orange-600',
          barColor: 'bg-amber-500',
        };
      case 'MODERATE':
        return {
          badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
          ring: 'text-sky-500 dark:text-sky-400',
          bg: 'bg-sky-500',
          gradient: 'from-sky-500 to-blue-600',
          barColor: 'bg-sky-500',
        };
      default:
        return {
          badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          ring: 'text-emerald-500 dark:text-emerald-400',
          bg: 'bg-emerald-500',
          gradient: 'from-emerald-500 to-teal-600',
          barColor: 'bg-emerald-500',
        };
    }
  };

  const scheme = getColorScheme();

  // SVG Circular Meter math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2">
              Civic Impact Engine
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--surface-secondary)] text-[var(--muted)] border border-[var(--border)]">
                Deterministic
              </span>
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Multi-factor municipal urgency & public disruption scoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${scheme.badge}`}>
            {level} PRIORITY
          </span>
        </div>
      </div>

      {/* Main Score & Radial Progress */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Radial Meter Block */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-[var(--surface-secondary)]/60 border border-[var(--border)] text-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[var(--border)]"
                strokeWidth="9"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${scheme.ring} transition-all duration-1000 ease-out`}
                strokeWidth="9"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[var(--foreground)] tracking-tight">
                {score}
              </span>
              <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider">
                / 100
              </span>
            </div>
          </div>

          <span className="text-xs font-bold text-[var(--foreground)] mt-3">
            Civic Impact Score
          </span>
          <span className="text-[11px] text-[var(--muted)]">
            Overall Municipal Urgency
          </span>
        </div>

        {/* Explainable Factor Breakdown Bars */}
        <div className="md:col-span-8 space-y-3.5">
          <h3 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider mb-2">
            Why this score? (Explainable Factor Breakdown)
          </h3>

          {/* Severity Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">Physical Severity (30% weight)</span>
              <span className="text-[var(--muted)]">{sevLabel} ({sevScore}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: `${sevScore}%` }}
              />
            </div>
          </div>

          {/* Urgency Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">Response Urgency (30% weight)</span>
              <span className="text-[var(--muted)]">{urgLabel} ({urgScore}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${urgScore}%` }}
              />
            </div>
          </div>

          {/* Public Impact Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">Public Disruption (25% weight)</span>
              <span className="text-[var(--muted)]">{pubLabel} ({pubScore}%)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-500"
                style={{ width: `${pubScore}%` }}
              />
            </div>
          </div>

          {/* Evidence Confidence Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">Evidence Confidence (10% weight)</span>
              <span className="text-[var(--muted)]">{confLabel}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${confScore}%` }}
              />
            </div>
          </div>

          {/* Duration Factor Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-[var(--foreground)]">Unresolved Duration (5% weight)</span>
              <span className="text-[var(--muted)]">{durLabel}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${durScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Rationale Note */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs text-[var(--muted)] leading-relaxed">
        <strong className="text-[var(--foreground)] font-bold">Deterministic Calculation: </strong>
        CivicPulse AI combines issue severity, urgency, potential public impact, duration, and evidence confidence to deterministically estimate the report&apos;s civic impact without arbitrary scoring.
      </div>
    </div>
  );
};
