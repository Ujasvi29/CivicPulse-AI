import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkBackendHealth } from '../services/api';
import { Zap, Activity, ArrowRight, Sun, Moon, Cpu, Eye, BarChart2, MapPin } from 'lucide-react';

export const Landing = () => {
  const { user, profile } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [backendHealth, setBackendHealth] = useState({ loading: true, connected: false });

  useEffect(() => {
    checkBackendHealth().then((res) => {
      setBackendHealth({ loading: false, connected: res.success });
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans relative overflow-hidden transition-colors duration-200">
      {/* Top Navigation Header */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#3b6ea8]/10 dark:bg-blue-600/20 border border-[#3b6ea8]/20 dark:border-blue-500/30 rounded-2xl text-[#3b6ea8] dark:text-blue-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight text-[#17233c] dark:text-white block">
              CivicPulse AI
            </span>
            <span className="text-xs text-[#3b6ea8] dark:text-blue-400 font-semibold">
              From Citizen Voice to Civic Action
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="p-2.5 rounded-xl bg-white dark:bg-[#111c38] text-[#17233c] dark:text-slate-300 border border-[#dce5f0] dark:border-[#1e293b] hover:bg-[#edf2f7] dark:hover:bg-[#172447] transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#17233c]" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <Link
              to={profile?.role === 'admin' ? '/admin' : '/dashboard'}
              className="py-2.5 px-5 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <span>Go to {profile?.role === 'admin' ? 'Admin Console' : 'Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/login"
                className="py-2.5 px-3.5 text-[#52627a] dark:text-slate-300 hover:text-[#17233c] dark:hover:text-white text-xs font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-2.5 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 lg:py-20 flex-1 flex flex-col items-center text-center relative z-10 space-y-10">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950/80 dark:text-blue-300 border border-[#3b6ea8]/20 dark:border-blue-800">
          <Activity className="w-4 h-4 text-[#3b6ea8] dark:text-blue-400" />
          <span>AI-Powered Civic Intelligence Platform</span>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="max-w-3xl space-y-5">
          <h1 className="text-4xl lg:text-6xl font-black tracking-tight text-[#17233c] dark:text-white leading-tight">
            From Citizen Voice <br />
            to <span className="text-[#3b6ea8] dark:text-blue-400">Civic Action</span>.
          </h1>

          <p className="text-base lg:text-lg text-[#52627a] dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Report real-world civic problems in plain text or with photographs. Our multimodal AI analyzes severity, public impact, and department routing—creating transparent, trackable civic cases.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/register"
            className="w-full sm:w-auto py-3.5 px-8 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-sm font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Report a Civic Issue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto py-3.5 px-8 bg-white dark:bg-[#111c38] text-[#17233c] dark:text-slate-200 border border-[#dce5f0] dark:border-[#1e293b] text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer hover:bg-[#edf2f7] dark:hover:bg-slate-800 shadow-xs"
          >
            <span>Sign In to Your Account</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full pt-10 text-left">
          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 border border-[#3b6ea8]/20 rounded-xl w-fit">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17233c] dark:text-white">AI Understanding</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Converts unstructured complaints into structured categories, severity scores, and summary reports.
            </p>
          </div>

          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#3fa7a3]/10 text-[#3fa7a3] dark:bg-teal-950 dark:text-teal-400 border border-[#3fa7a3]/20 rounded-xl w-fit">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17233c] dark:text-white">Multimodal Vision</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Upload photographs of potholes, garbage, or damage for visual safety risk and evidence evaluation.
            </p>
          </div>

          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#6477c8]/10 text-[#6477c8] dark:bg-indigo-950 dark:text-indigo-400 border border-[#6477c8]/20 rounded-xl w-fit">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17233c] dark:text-white">Impact Engine</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Transparent 0-100 Civic Impact Score calculated from severity, urgency, public safety risk, and duration.
            </p>
          </div>

          <div className="civic-card p-6 space-y-3">
            <div className="p-3 bg-[#3e9b72]/10 text-[#3e9b72] dark:bg-emerald-950 dark:text-emerald-400 border border-[#3e9b72]/20 rounded-xl w-fit">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-[#17233c] dark:text-white">Case Tracking</h3>
            <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
              Real-time state machine tracking from submission to department assignment and verified resolution.
            </p>
          </div>
        </div>

        {/* Backend Connectivity Status */}
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] rounded-full text-xs font-mono text-[#52627a] dark:text-slate-400 shadow-xs">
          <span className="flex items-center gap-2 font-medium">
            <span className={`w-2 h-2 rounded-full ${backendHealth.connected ? 'bg-[#3e9b72] animate-ping' : 'bg-amber-400'}`} />
            FastAPI Backend API: {backendHealth.loading ? 'Checking...' : backendHealth.connected ? 'Connected (Port 8000)' : 'Offline'}
          </span>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • From Citizen Voice to Civic Action
      </footer>
    </div>
  );
};
