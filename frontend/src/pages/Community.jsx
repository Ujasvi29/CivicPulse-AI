import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { getPublicReports } from '../services/reports';
import {
  MapPin,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  ArrowRight,
  Inbox,
  Loader2,
  Sparkles,
} from 'lucide-react';

export const Community = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  useEffect(() => {
    getPublicReports().then((res) => {
      if (res.success) {
        setReports(res.data || []);
      }
      setLoading(false);
    });
  }, []);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle="Community Pulse" />

      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Header Hero */}
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3fa7a3] dark:text-teal-400 bg-[#3fa7a3]/10 px-3 py-1 rounded-full border border-[#3fa7a3]/20 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Neighborhood Transparency
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
            Community Pulse
          </h1>
          <p className="text-xs sm:text-sm text-[#52627a] dark:text-slate-400">
            Explore reported civic issues and follow community infrastructure status across your area.
          </p>
        </div>

        {/* Map Preview Shell Card */}
        <div className="civic-card p-6 relative overflow-hidden bg-gradient-to-br from-white via-[#f5f8fc] to-white dark:from-[#111c38] dark:via-[#0b1329] dark:to-[#111c38]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#dce5f0] dark:border-[#1e293b] pb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#17233c] dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#3b6ea8]" />
                Geographic Civic Map
              </h3>
              <p className="text-xs text-[#52627a] dark:text-slate-400">
                Interactive spatial visualization of reported cases and priority markers
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:text-blue-400 rounded-full border border-[#3b6ea8]/20">
              Active Community Registry
            </span>
          </div>

          {/* Minimal Map Node Graphic */}
          <div className="h-44 w-full my-4 bg-[#f5f8fc] dark:bg-[#0b1329] rounded-xl border border-[#dce5f0] dark:border-[#1e293b] relative overflow-hidden flex items-center justify-center">
            <svg className="w-full h-full opacity-60 dark:opacity-40" viewBox="0 0 400 120" fill="none">
              <path d="M 40 60 Q 120 20 200 60 T 360 60" stroke="#3b6ea8" strokeWidth="1.5" strokeDasharray="5 5" />
              <path d="M 80 100 Q 180 110 300 40" stroke="#3fa7a3" strokeWidth="1.5" strokeDasharray="4 4" />
              <circle cx="60" cy="50" r="5" fill="#c85c5c" />
              <circle cx="140" cy="35" r="4" fill="#c28a3a" />
              <circle cx="210" cy="65" r="6" fill="#3b6ea8" />
              <circle cx="290" cy="40" r="4" fill="#3e9b72" />
              <circle cx="350" cy="60" r="5" fill="#6477c8" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="bg-white/95 dark:bg-[#111c38]/95 px-4 py-2 rounded-xl border border-[#dce5f0] dark:border-[#1e293b] text-xs font-semibold text-[#17233c] dark:text-white shadow-xs">
                Community cases are automatically registered on the civic map
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="civic-card p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#718096] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search community issues by keyword or location..."
              className="w-full pl-9 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-xs text-[#17233c] dark:text-slate-100 placeholder-[#718096] focus:outline-none focus:border-[#3b6ea8] transition font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#52627a]" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-xs font-semibold text-[#17233c] dark:text-slate-100 focus:outline-none focus:border-[#3b6ea8] transition cursor-pointer"
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

        {/* Public Reports Feed */}
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#3b6ea8] mx-auto" />
            <p className="text-xs text-[#52627a] dark:text-slate-400 font-medium">Loading community feed...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                to={`/reports/${report.id}`}
                className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-3 group cursor-pointer"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-[#3b6ea8] bg-[#3b6ea8]/10 px-2 py-0.5 rounded border border-[#3b6ea8]/20">
                      {report.case_number}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#3fa7a3]/10 text-[#3fa7a3] border border-[#3fa7a3]/20">
                      {report.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#17233c] dark:text-white group-hover:text-[#3b6ea8] transition line-clamp-1">
                    {report.title}
                  </h3>

                  <p className="text-xs text-[#52627a] dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {report.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#dce5f0] dark:border-[#1e293b] flex items-center justify-between text-[11px] text-[#718096] dark:text-slate-400 font-medium">
                  <span className="truncate max-w-[160px]">{report.address || 'Public Record'}</span>
                  <div className="flex items-center gap-1 font-semibold text-[#3b6ea8] dark:text-blue-400">
                    <span>View Case</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="civic-card p-10 text-center space-y-4 max-w-md mx-auto">
            <div className="w-12 h-12 bg-[#3fa7a3]/10 text-[#3fa7a3] rounded-2xl flex items-center justify-center mx-auto border border-[#3fa7a3]/20">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#17233c] dark:text-white">No community reports yet</h3>
              <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed">
                Community issues submitted in your area will appear here for public transparency and collective action.
              </p>
            </div>
            <Link
              to="/report/new"
              className="inline-flex items-center gap-2 py-2 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition shadow-xs"
            >
              <span>Submit the first report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
