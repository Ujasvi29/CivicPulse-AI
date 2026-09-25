import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { Activity, BarChart3, Map, ShieldCheck } from 'lucide-react';

export const AdminDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      {/* Universal Header */}
      <Header subtitle="Admin Command Console" />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full p-6 lg:p-8 flex-1 space-y-8">
        {/* Admin Banner */}
        <div className="bg-[#17233c] dark:bg-[#111c38] border border-[#3b6ea8]/30 dark:border-blue-500/20 rounded-2xl p-8 text-white space-y-3 shadow-xs">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono bg-[#3b6ea8]/20 text-[#6477c8] dark:text-blue-300 border border-[#3b6ea8]/30 w-fit">
            <ShieldCheck className="w-3.5 h-3.5 text-[#3b6ea8] dark:text-blue-400" />
            Authorized Admin Session
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold">Civic Operations Command Center</h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Welcome, <strong className="text-white">{profile?.full_name || 'Admin Officer'}</strong>. Department routing, priority overrides, and civic hotspot analytics will be activated as complaints are processed.
          </p>
        </div>

        {/* Operational Modules Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 border border-[#3b6ea8]/20 rounded-xl w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17233c] dark:text-white">Case Management</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Review incoming reports, update case statuses, and assign municipal departments.
            </p>
          </div>

          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#6477c8]/10 text-[#6477c8] dark:bg-indigo-950 dark:text-indigo-400 border border-[#6477c8]/20 rounded-xl w-fit">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17233c] dark:text-white">Civic Analytics</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Visualize issue trends, category distributions, and response time metrics.
            </p>
          </div>

          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#3fa7a3]/10 text-[#3fa7a3] dark:bg-teal-950 dark:text-teal-400 border border-[#3fa7a3]/20 rounded-xl w-fit">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#17233c] dark:text-white">Hotspot Detection</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Identify localized clusters of critical civic problems on the Leaflet map.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Admin Command Console
      </footer>
    </div>
  );
};
