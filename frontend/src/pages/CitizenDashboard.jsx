import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Link } from 'react-router-dom';
import { FilePlus, Clock, MapPin, User, ArrowRight, Inbox, PlusCircle, Sparkles } from 'lucide-react';

export const CitizenDashboard = () => {
  const { user, profile } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Citizen';

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      {/* Header Navigation */}
      <Header subtitle="Citizen Portal" />

      {/* Main Centered Container */}
      <main className="max-w-7xl mx-auto w-full p-6 lg:p-8 flex-1 space-y-10">
        
        {/* Welcome Hero Section */}
        <section className="bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] rounded-2xl p-8 shadow-xs relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#52627a] dark:text-slate-400 block">
                {getGreeting()}, {userName}
              </span>
              <h1 className="text-2xl lg:text-4xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
                Make your community heard.
              </h1>
            </div>

            <p className="text-sm text-[#52627a] dark:text-slate-300 leading-relaxed">
              Report civic problems, understand their impact, and follow their journey toward resolution.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/report/new"
                className="py-3 px-6 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report a Civic Issue</span>
              </Link>
              <Link
                to="/reports"
                className="py-3 px-6 bg-[#f5f8fc] hover:bg-[#edf2f7] dark:bg-[#0b1329] dark:hover:bg-slate-800 text-[#17233c] dark:text-slate-200 border border-[#dce5f0] dark:border-[#1e293b] text-xs font-semibold rounded-xl transition flex items-center gap-2"
              >
                <span>View My Reports</span>
              </Link>
            </div>
          </div>

          {/* Hero Visual: Minimal Abstract City Map Network */}
          <div className="w-full lg:w-80 h-36 bg-[#f5f8fc] dark:bg-[#0b1329] rounded-xl border border-[#dce5f0] dark:border-[#1e293b] relative overflow-hidden flex items-center justify-center p-4">
            <svg className="w-full h-full opacity-75 dark:opacity-45" viewBox="0 0 240 90" fill="none">
              {/* Connecting Network Paths */}
              <path d="M 30 45 Q 80 15 130 45 T 210 45" stroke="#3b6ea8" strokeWidth="1.5" strokeDasharray="4 4" />
              <path d="M 50 70 Q 120 80 190 25" stroke="#3fa7a3" strokeWidth="1.5" strokeDasharray="3 3" />
              
              {/* Civic Nodes */}
              <circle cx="30" cy="45" r="4" fill="#c85c5c" />
              <circle cx="80" cy="25" r="3.5" fill="#c28a3a" />
              <circle cx="130" cy="45" r="5" fill="#3b6ea8" />
              <circle cx="190" cy="25" r="3.5" fill="#3e9b72" />
              <circle cx="210" cy="45" r="4" fill="#6477c8" />
            </svg>

            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[10px] font-semibold text-[#52627a] dark:text-slate-400 bg-white/90 dark:bg-[#111c38]/90 px-3 py-1 rounded-md border border-[#dce5f0] dark:border-[#1e293b]">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b6ea8]" />
                Location Intelligence
              </span>
              <span className="text-[#3e9b72] dark:text-emerald-400 font-mono">Connected</span>
            </div>
          </div>
        </section>

        {/* Quick Actions Section */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#17233c] dark:text-white tracking-tight">
              Quick Actions
            </h2>
            <p className="text-xs text-[#52627a] dark:text-slate-400">
              Select a task to get started
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Report an Issue */}
            <Link
              to="/report/new"
              className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="p-2.5 bg-[#3b6ea8]/10 dark:bg-blue-600/20 border border-[#3b6ea8]/20 dark:border-blue-500/30 rounded-xl text-[#3b6ea8] dark:text-blue-400 w-fit">
                  <FilePlus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17233c] dark:text-white group-hover:text-[#3b6ea8] transition">
                  Report an Issue
                </h3>
                <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                  Tell us what's happening in your neighborhood.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-[#3b6ea8] dark:text-blue-400 gap-1 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
                <span>Create report</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 2: My Reports */}
            <Link
              to="/reports"
              className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="p-2.5 bg-[#3fa7a3]/10 dark:bg-teal-600/20 border border-[#3fa7a3]/20 dark:border-teal-500/30 rounded-xl text-[#3fa7a3] dark:text-teal-400 w-fit">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17233c] dark:text-white group-hover:text-[#3fa7a3] transition">
                  My Reports
                </h3>
                <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                  Track the status of issues you've reported.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-[#3fa7a3] dark:text-teal-400 gap-1 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
                <span>View timeline</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 3: Community */}
            <Link
              to="/map"
              className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="p-2.5 bg-[#6477c8]/10 dark:bg-indigo-600/20 border border-[#6477c8]/20 dark:border-indigo-500/30 rounded-xl text-[#6477c8] dark:text-indigo-400 w-fit">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17233c] dark:text-white group-hover:text-[#6477c8] transition">
                  Community
                </h3>
                <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                  Explore civic issues affecting your area.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-[#6477c8] dark:text-indigo-400 gap-1 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
                <span>View map</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>

            {/* Card 4: My Profile */}
            <Link
              to="/profile"
              className="civic-card civic-card-interactive p-5 flex flex-col justify-between space-y-4 group cursor-pointer"
            >
              <div className="space-y-2.5">
                <div className="p-2.5 bg-[#3e9b72]/10 dark:bg-emerald-600/20 border border-[#3e9b72]/20 dark:border-emerald-500/30 rounded-xl text-[#3e9b72] dark:text-emerald-400 w-fit">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#17233c] dark:text-white group-hover:text-[#3e9b72] transition">
                  My Profile
                </h3>
                <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                  Manage your civic profile and settings.
                </p>
              </div>
              <div className="flex items-center text-xs font-semibold text-[#3e9b72] dark:text-emerald-400 gap-1 pt-2 border-t border-[#dce5f0] dark:border-[#1e293b]">
                <span>Manage profile</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          </div>
        </section>

        {/* Civic Activity Section (Meaningful Empty State) */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#17233c] dark:text-white tracking-tight">
              Your Civic Activity
            </h2>
            <p className="text-xs text-[#52627a] dark:text-slate-400">
              Your activity at a glance
            </p>
          </div>

          <div className="civic-card p-8 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-[#3b6ea8]/20">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-[#17233c] dark:text-white">No reports yet</h3>
              <p className="text-xs text-[#52627a] dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Your submitted civic issues and resolution status updates will appear here.
              </p>
            </div>
            <Link
              to="/report/new"
              className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report your first issue</span>
            </Link>
          </div>
        </section>

        {/* Community Pulse Section */}
        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#17233c] dark:text-white tracking-tight">
              Community Pulse
            </h2>
            <p className="text-xs text-[#52627a] dark:text-slate-400">
              See what matters in your neighborhood
            </p>
          </div>

          <div className="civic-card p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#3fa7a3] dark:text-teal-400 bg-[#3fa7a3]/10 px-2.5 py-1 rounded-full border border-[#3fa7a3]/20">
                <Sparkles className="w-3.5 h-3.5" /> Neighborhood Insights
              </span>
              <h3 className="font-bold text-base text-[#17233c] dark:text-white">Interactive Community Map</h3>
              <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                Community issue mapping will appear here as civic reports are submitted across your region.
              </p>
            </div>

            <Link
              to="/map"
              className="py-2.5 px-4 bg-[#f5f8fc] hover:bg-[#edf2f7] dark:bg-[#0b1329] dark:hover:bg-slate-800 text-[#17233c] dark:text-slate-200 border border-[#dce5f0] dark:border-[#1e293b] text-xs font-semibold rounded-xl transition shrink-0 flex items-center gap-1.5"
            >
              <span>Explore Map Area</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
