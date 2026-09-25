import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { getUserReports } from '../services/reports';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Clock,
  MapPin,
  ArrowRight,
  Inbox,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const fetchReports = async () => {
    if (!user?.id) return;
    setLoading(true);
    const result = await getUserReports(user.id);
    if (result.success) {
      setReports(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [user?.id]);

  // Filtering Logic
  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || report.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesCategory = categoryFilter === 'ALL' || report.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
            Assigned
          </span>
        );
      case 'ai_analyzed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            AI Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            Submitted
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">HIGH</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--primary)]/15 text-[var(--primary)] border border-[var(--primary)]/30">MODERATE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="My Reports" />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
              My Civic Reports
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)]">
              Track the status, severity, and resolution lifecycle of your submitted cases.
            </p>
          </div>

          <Link
            to="/report/new"
            className="py-2.5 px-4 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition inline-flex items-center gap-2 shadow-sm shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, case #, or category..."
              className="w-full pl-9 pr-4 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition font-medium"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="submitted">Submitted</option>
                <option value="ai_analyzed">AI Analyzed</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="Roads & Infrastructure">Roads & Infrastructure</option>
              <option value="Waste Management">Waste Management</option>
              <option value="Water & Drainage">Water & Drainage</option>
              <option value="Electricity & Public Lighting">Electricity & Public Lighting</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Sanitation">Sanitation</option>
              <option value="General Civic Services">General Civic Services</option>
            </select>
          </div>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mx-auto" />
            <p className="text-xs text-[var(--muted)] font-medium">
              Loading your civic reports...
            </p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)] rounded-2xl p-5 flex flex-col justify-between space-y-4 group cursor-pointer shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-lg border border-[var(--primary)]/20">
                      {report.case_number}
                    </span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(report.priority)}
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition line-clamp-1">
                      {report.title}
                    </h3>
                    <p className="text-xs text-[var(--muted)] line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)] font-medium">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                    <span className="truncate">{report.address || 'Location registered'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[var(--primary)] shrink-0">
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-10 text-center space-y-4 max-w-md mx-auto shadow-sm">
            <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-2xl flex items-center justify-center mx-auto border border-[var(--primary)]/20">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[var(--foreground)]">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No matching reports found'
                  : 'No civic reports submitted yet'}
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Try adjusting your search query or filters.'
                  : 'Report real-world problems in your neighborhood to track their resolution.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="py-2 px-4 bg-[var(--surface-secondary)] hover:bg-[var(--surface)] text-[var(--foreground)] text-xs font-semibold rounded-xl border border-[var(--border)] transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/report/new"
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-[var(--primary)] text-white text-xs font-semibold rounded-xl hover:opacity-90 transition shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit your first report</span>
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-4 px-6 text-center text-xs text-[var(--muted)] font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
