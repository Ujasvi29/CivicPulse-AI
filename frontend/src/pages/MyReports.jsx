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

    const matchesStatus = statusFilter === 'ALL' || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'ALL' || report.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3e9b72]/15 text-[#3e9b72] dark:bg-emerald-950/80 dark:text-emerald-400 border border-[#3e9b72]/30">
            <CheckCircle2 className="w-3 h-3" /> Resolved
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3fa7a3]/15 text-[#3fa7a3] dark:bg-teal-950/80 dark:text-teal-400 border border-[#3fa7a3]/30">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      case 'assigned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#6477c8]/15 text-[#6477c8] dark:bg-indigo-950/80 dark:text-indigo-400 border border-[#6477c8]/30">
            Assigned
          </span>
        );
      case 'ai_analyzed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#3b6ea8]/15 text-[#3b6ea8] dark:bg-blue-950/80 dark:text-blue-400 border border-[#3b6ea8]/30">
            AI Analyzed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#c28a3a]/15 text-[#c28a3a] dark:bg-amber-950/80 dark:text-amber-400 border border-[#c28a3a]/30">
            Submitted
          </span>
        );
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c85c5c]/15 text-[#c85c5c] dark:bg-rose-950/80 dark:text-rose-400 border border-[#c85c5c]/30">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#c28a3a]/15 text-[#c28a3a] dark:bg-amber-950/80 dark:text-amber-400 border border-[#c28a3a]/30">HIGH</span>;
      case 'low':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3e9b72]/15 text-[#3e9b72] dark:bg-emerald-950/80 dark:text-emerald-400 border border-[#3e9b72]/30">LOW</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3b6ea8]/15 text-[#3b6ea8] dark:bg-blue-950/80 dark:text-blue-400 border border-[#3b6ea8]/30">MODERATE</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="My Reports" />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
        {/* Header Title & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
              My Civic Reports
            </h1>
            <p className="text-xs sm:text-sm text-[#52627a] dark:text-slate-400">
              Track the status, severity, and resolution lifecycle of your submitted cases.
            </p>
          </div>

          <Link
            to="/report/new"
            className="py-2.5 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition inline-flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report New Issue</span>
          </Link>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="civic-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096] dark:text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, case #, or category..."
              className="w-full pl-9 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-xs text-[#17233c] dark:text-slate-100 placeholder-[#718096] focus:outline-none focus:border-[#3b6ea8] transition font-medium"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#52627a] dark:text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-xs font-semibold text-[#17233c] dark:text-slate-100 focus:outline-none focus:border-[#3b6ea8] transition cursor-pointer"
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
              className="px-2.5 py-1.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-xs font-semibold text-[#17233c] dark:text-slate-100 focus:outline-none focus:border-[#3b6ea8] transition cursor-pointer"
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
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8] mx-auto" />
            <p className="text-xs text-[#52627a] dark:text-slate-400 font-medium">
              Loading your civic reports...
            </p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#3b6ea8] dark:text-blue-400 bg-[#3b6ea8]/10 px-2.5 py-1 rounded-lg border border-[#3b6ea8]/20">
                      {report.case_number}
                    </span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(report.priority)}
                      {getStatusBadge(report.status)}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#17233c] dark:text-white group-hover:text-[#3b6ea8] transition line-clamp-1">
                      {report.title}
                    </h3>
                    <p className="text-xs text-[#52627a] dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dce5f0] dark:border-[#1e293b] flex items-center justify-between text-xs text-[#718096] dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    <MapPin className="w-3.5 h-3.5 text-[#3b6ea8] shrink-0" />
                    <span className="truncate">{report.address || 'Location registered'}</span>
                  </div>
                  <div className="flex items-center gap-1 font-semibold text-[#3b6ea8] dark:text-blue-400 shrink-0">
                    <span>View details</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="civic-card p-10 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 bg-[#3b6ea8]/10 text-[#3b6ea8] rounded-2xl flex items-center justify-center mx-auto border border-[#3b6ea8]/20">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#17233c] dark:text-white">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'No matching reports found'
                  : 'No civic reports submitted yet'}
              </h3>
              <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed">
                {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                  ? 'Try adjusting your search query or filters.'
                  : 'Report real-world problems in your neighborhood to track their resolution.'}
              </p>
            </div>
            {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="py-2 px-4 bg-[#f5f8fc] hover:bg-[#edf2f7] dark:bg-[#172447] text-[#17233c] dark:text-slate-200 text-xs font-semibold rounded-xl border border-[#dce5f0] dark:border-[#1e293b] transition cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/report/new"
                className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit your first report</span>
              </Link>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
