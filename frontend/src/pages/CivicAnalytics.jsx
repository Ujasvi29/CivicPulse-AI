import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { Header } from '../components/Header';
import { adminGetStats } from '../services/reports';
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Info,
} from 'lucide-react';

// ─── Colour palettes ───────────────────────────────────────────────────────────
const CATEGORY_COLORS = ['#3b6ea8', '#6477c8', '#3fa7a3', '#c28a3a', '#3e9b72', '#8b5cf6', '#c85c5c'];

const PRIORITY_PALETTE = {
  Critical: '#c85c5c',
  High:     '#c28a3a',
  Moderate: '#3b6ea8',
  Low:      '#3e9b72',
};

const STATUS_PALETTE = {
  'Submitted':   '#6477c8',
  'Ai Analyzed': '#8b5cf6',
  'Assigned':    '#c28a3a',
  'In Progress': '#3b6ea8',
  'Resolved':    '#3e9b72',
};

// Custom tooltip styled for the app
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl px-3 py-2 shadow-lg text-xs">
      {label && <p className="font-semibold text-[#17233c] dark:text-white mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color || '#3b6ea8' }} className="font-bold">
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  );
};

function SectionCard({ title, icon: Icon, iconColor, children }) {
  return (
    <div className="civic-card p-5 space-y-4">
      <h2 className="text-sm font-bold text-[#17233c] dark:text-white flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatBadge({ label, value, colorClass, sub }) {
  return (
    <div className={`rounded-xl border p-4 space-y-1 ${colorClass}`}>
      <div className="text-2xl font-extrabold tabular-nums">
        {value !== undefined && value !== null ? (typeof value === 'number' ? value.toLocaleString() : value) : '—'}
      </div>
      <div className="text-xs font-semibold opacity-80">{label}</div>
      {sub && <div className="text-[10px] opacity-60">{sub}</div>}
    </div>
  );
}

// Truncate long category names for chart axis
const truncateLabel = (label, maxLen = 16) =>
  label && label.length > maxLen ? label.slice(0, maxLen) + '…' : label;

// Format trend date label
const formatTrendDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// ─── Main Analytics Page ───────────────────────────────────────────────────────
export const CivicAnalytics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    const res = await adminGetStats();
    if (res.success) setStats(res.stats);
    else setError(res.error || 'Failed to load analytics data.');
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // Determine trend data has actual non-zero values
  const hasTrendData = stats?.trendData?.some(d => d.count > 0);

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="Civic Analytics" />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate('/admin')}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#3b6ea8] hover:underline cursor-pointer mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Command Center
            </button>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#17233c] dark:text-white">
              Civic Analytics & Insights
            </h1>
            <p className="text-sm text-[#52627a] dark:text-slate-400">
              Understand civic trends and identify areas requiring attention.
            </p>
          </div>
          <button
            onClick={loadStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#dce5f0] dark:border-[#1e293b] text-xs font-semibold text-[#52627a] dark:text-slate-400 hover:bg-[#edf2f7] dark:hover:bg-[#172447] transition cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-[#3b6ea8]" />
          </div>
        )}

        {error && !loading && (
          <div className="civic-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
            <button onClick={loadStats} className="mt-3 text-xs text-[#3b6ea8] hover:underline cursor-pointer">Try again</button>
          </div>
        )}

        {!loading && !error && stats && (
          <>
            {/* ── Top summary stats ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBadge
                label="Total Reports"
                value={stats.total}
                colorClass="bg-white dark:bg-[#111c38] border-[#dce5f0] dark:border-[#1e293b] text-[#17233c] dark:text-white"
              />
              <StatBadge
                label="Resolution Rate"
                value={stats.total > 0 ? `${stats.resolutionRate}%` : 'N/A'}
                colorClass="bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                sub={`${stats.resolved} of ${stats.total} resolved`}
              />
              <StatBadge
                label="Critical Cases"
                value={stats.critical}
                colorClass="bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"
              />
              <StatBadge
                label="Top Category"
                value={stats.mostReportedCategory ? stats.mostReportedCategory.split(' ').slice(0, 2).join(' ') : 'N/A'}
                colorClass="bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300"
                sub={stats.mostReportedCategory || ''}
              />
            </div>

            {/* ── Resolution Statistics ── */}
            {stats.total === 0 ? (
              <div className="civic-card p-8 text-center">
                <Info className="w-8 h-8 text-[#718096] mx-auto mb-2" />
                <p className="text-sm text-[#718096] dark:text-slate-500">No resolution data available yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Cases', value: stats.total, color: '#3b6ea8' },
                  { label: 'Resolved', value: stats.resolved, color: '#3e9b72' },
                  { label: 'Pending', value: stats.pending, color: '#c28a3a' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="civic-card p-5 flex items-center gap-4">
                    <div className="w-3 h-10 rounded-full shrink-0" style={{ background: color }} />
                    <div>
                      <div className="text-2xl font-extrabold tabular-nums" style={{ color }}>{value.toLocaleString()}</div>
                      <div className="text-xs font-semibold text-[#52627a] dark:text-slate-400">{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Reports by Category ── */}
            <SectionCard title="Reports by Category" icon={BarChart3} iconColor="text-[#3b6ea8]">
              {stats.categoryDistribution.length === 0 ? (
                <p className="text-sm text-[#718096] dark:text-slate-500">No category data available.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={stats.categoryDistribution} margin={{ top: 4, right: 8, left: -8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dce5f0" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#52627a' }}
                      tickFormatter={v => truncateLabel(v, 14)}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#52627a' }} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Reports" radius={[4, 4, 0, 0]}>
                      {stats.categoryDistribution.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* ── Status + Priority ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status distribution */}
              <SectionCard title="Case Status Distribution" icon={Activity} iconColor="text-[#6477c8]">
                {stats.statusDistribution.length === 0 ? (
                  <p className="text-sm text-[#718096] dark:text-slate-500">No status data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={stats.statusDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) => percent > 0.05 ? `${Math.round(percent * 100)}%` : ''}
                        labelLine={false}
                      >
                        {stats.statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={STATUS_PALETTE[entry.name] || CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>

              {/* Priority distribution */}
              <SectionCard title="Priority Distribution" icon={AlertTriangle} iconColor="text-amber-500">
                {stats.priorityDistribution.every(d => d.count === 0) ? (
                  <p className="text-sm text-[#718096] dark:text-slate-500">No priority data available.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.priorityDistribution} layout="vertical" margin={{ top: 4, right: 24, left: 12, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dce5f0" strokeOpacity={0.5} horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#52627a' }} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#52627a' }} width={68} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" name="Reports" radius={[0, 4, 4, 0]}>
                        {stats.priorityDistribution.map((entry) => (
                          <Cell key={entry.name} fill={PRIORITY_PALETTE[entry.name] || '#3b6ea8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </SectionCard>
            </div>

            {/* ── Civic Trends ── */}
            <SectionCard title="Civic Trends — Last 30 Days" icon={TrendingUp} iconColor="text-[#3fa7a3]">
              {!hasTrendData ? (
                <div className="flex items-center gap-2 text-sm text-[#718096] dark:text-slate-500 py-4">
                  <Info className="w-4 h-4 shrink-0" />
                  Insufficient data for trend analysis. More reports will generate trend data over time.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.trendData} margin={{ top: 4, right: 8, left: -8, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#dce5f0" strokeOpacity={0.5} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 9, fill: '#52627a' }}
                      tickFormatter={formatTrendDate}
                      interval={Math.floor(stats.trendData.length / 7)}
                    />
                    <YAxis tick={{ fontSize: 10, fill: '#52627a' }} allowDecimals={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl px-3 py-2 shadow-lg text-xs">
                            <p className="font-semibold text-[#17233c] dark:text-white mb-1">{label}</p>
                            <p className="text-[#3fa7a3] font-bold">{payload[0].value} report{payload[0].value !== 1 ? 's' : ''}</p>
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      name="Reports"
                      stroke="#3fa7a3"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 5, fill: '#3fa7a3' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </SectionCard>

            {/* ── Civic Hotspots ── */}
            <SectionCard title="Civic Hotspots" icon={MapPin} iconColor="text-rose-500">
              {stats.hotspots.length === 0 ? (
                <div className="text-sm text-[#718096] dark:text-slate-500 flex items-center gap-2 py-2">
                  <Info className="w-4 h-4 shrink-0" />
                  No geographic hotspots detected. Hotspots appear when multiple reports are submitted from the same area.
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-[#718096] dark:text-slate-500">
                    Areas with clustered civic reports, based on GPS coordinates (~1 km grid).
                  </p>
                  {stats.hotspots.map((h, i) => (
                    <div key={i} className="civic-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-black">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-mono text-[#52627a] dark:text-slate-400 truncate">
                            {h.lat}°N, {h.lng}°E
                          </p>
                          <p className="text-xs font-semibold text-[#17233c] dark:text-white truncate">{h.topCategory}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#3b6ea8]/10 text-[#3b6ea8] dark:text-blue-400 border border-[#3b6ea8]/20">
                          {h.count} report{h.count !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          h.topPriority === 'Critical' ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' :
                          h.topPriority === 'High' ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' :
                          'bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                        }`}>
                          {h.topPriority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* ── AI Civic Insights ── */}
            <SectionCard title="AI Civic Insights" icon={Sparkles} iconColor="text-[#6477c8]">
              {stats.insights.length === 0 ? (
                <div className="text-sm text-[#718096] dark:text-slate-500 flex items-center gap-2 py-2">
                  <Info className="w-4 h-4 shrink-0" />
                  No insights available yet. Submit more reports to generate civic intelligence.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[#718096] dark:text-slate-500">
                    Deterministic insights derived from real civic report data — no fabricated statistics.
                  </p>
                  <ul className="space-y-2">
                    {stats.insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#17233c] dark:text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI · Civic Analytics · Admin Only
      </footer>
    </div>
  );
};
