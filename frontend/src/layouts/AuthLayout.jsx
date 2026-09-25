import { Zap, Sun, Moon, ShieldCheck, MapPin, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const AuthLayout = ({ children, title, subtitle }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col lg:flex-row overflow-hidden font-sans transition-colors duration-200">
      {/* LEFT SIDE: Brand Narrative & Minimal Abstract City Network Graphic */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#edf2f7] via-[#f5f8fc] to-[#e2e8f0] dark:from-[#0b1329] dark:via-[#111c38] dark:to-[#0b1329] p-8 lg:p-16 flex flex-col justify-between relative border-b lg:border-b-0 lg:border-r border-[#dce5f0] dark:border-[#1e293b]">
        
        {/* Top Header Identity */}
        <div className="flex items-center justify-between relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="p-2.5 bg-[#3b6ea8]/10 dark:bg-blue-600/20 border border-[#3b6ea8]/20 dark:border-blue-500/30 rounded-2xl text-[#3b6ea8] dark:text-blue-400 group-hover:scale-105 transition shadow-xs">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#17233c] dark:text-white block">
                CivicPulse AI
              </span>
              <span className="text-xs text-[#3b6ea8] dark:text-blue-400 font-semibold">
                From Citizen Voice to Civic Action
              </span>
            </div>
          </Link>

          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="lg:hidden p-2 rounded-xl bg-white dark:bg-[#111c38] text-[#17233c] dark:text-slate-300 border border-[#dce5f0] dark:border-[#1e293b] transition"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-[#17233c]" />}
          </button>
        </div>

        {/* Brand Story & Abstract Network Graphic */}
        <div className="relative z-10 my-10 lg:my-0 space-y-8 max-w-lg">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950/80 dark:text-blue-300 border border-[#3b6ea8]/20 dark:border-blue-800">
              <Activity className="w-3.5 h-3.5 text-[#3b6ea8] dark:text-blue-400" />
              Public Service Intelligence
            </span>

            <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-[#17233c] dark:text-white leading-tight">
              Report civic issues, understand their impact, and follow their journey.
            </h1>

            <p className="text-sm text-[#52627a] dark:text-slate-300 leading-relaxed font-normal">
              CivicPulse AI connects citizens with municipal departments through transparent, trackable civic cases.
            </p>
          </div>

          {/* Minimal Abstract City Map & Node Visual */}
          <div className="bg-white/90 dark:bg-[#111c38]/90 border border-[#dce5f0] dark:border-[#1e293b] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#dce5f0] dark:border-[#1e293b] pb-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#52627a] dark:text-slate-400">
                <MapPin className="w-4 h-4 text-[#3e9b72] dark:text-emerald-400" />
                <span>Abstract Civic Network</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#3e9b72]/10 text-[#3e9b72] dark:bg-emerald-950 dark:text-emerald-400 border border-[#3e9b72]/20">
                ACTIVE PIPELINE
              </span>
            </div>

            {/* Abstract SVG City Nodes */}
            <div className="relative h-28 w-full bg-[#f5f8fc] dark:bg-[#0b1329] rounded-xl border border-[#dce5f0] dark:border-[#1e293b] overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full opacity-70 dark:opacity-50" viewBox="0 0 300 100" fill="none">
                {/* Connecting Dotted Lines */}
                <path d="M 40 50 Q 100 20 160 50 T 260 50" stroke="#3b6ea8" strokeWidth="1.5" strokeDasharray="4 4" />
                <path d="M 60 80 Q 140 90 220 30" stroke="#3fa7a3" strokeWidth="1.5" strokeDasharray="3 3" />
                
                {/* Location Nodes */}
                <circle cx="40" cy="50" r="5" fill="#c85c5c" />
                <circle cx="100" cy="30" r="4" fill="#c28a3a" />
                <circle cx="160" cy="50" r="6" fill="#3b6ea8" />
                <circle cx="220" cy="30" r="4" fill="#3e9b72" />
                <circle cx="260" cy="50" r="5" fill="#6477c8" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-around px-4 text-[11px] font-semibold text-[#52627a] dark:text-slate-300 pointer-events-none">
                <span className="bg-white dark:bg-[#111c38] px-2 py-0.5 rounded border border-[#dce5f0] dark:border-[#1e293b] text-[10px] shadow-2xs">
                  Report Submitted
                </span>
                <span className="bg-white dark:bg-[#111c38] px-2 py-0.5 rounded border border-[#dce5f0] dark:border-[#1e293b] text-[10px] shadow-2xs">
                  AI Categorization
                </span>
                <span className="bg-white dark:bg-[#111c38] px-2 py-0.5 rounded border border-[#dce5f0] dark:border-[#1e293b] text-[10px] shadow-2xs">
                  Department Action
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="relative z-10 flex items-center justify-between text-xs text-[#52627a] dark:text-slate-400 pt-4 border-t border-[#dce5f0] dark:border-[#1e293b]">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#3e9b72] dark:text-emerald-400" />
            Supabase Protected Authentication
          </span>
          <span>CivicPulse Platform</span>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Card Container */}
      <div className="lg:w-1/2 p-6 lg:p-16 flex flex-col justify-between relative bg-[#f5f8fc] dark:bg-[#0b1329]">
        {/* Desktop Theme Toggle */}
        <div className="hidden lg:flex justify-end">
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="p-2.5 rounded-xl bg-white dark:bg-[#111c38] text-[#17233c] dark:text-slate-300 border border-[#dce5f0] dark:border-[#1e293b] hover:bg-[#edf2f7] dark:hover:bg-[#172447] transition flex items-center gap-2 text-xs font-semibold cursor-pointer shadow-xs"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#17233c]" />
                <span>Dark Mode</span>
              </>
            )}
          </button>
        </div>

        {/* Auth Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="bg-white dark:bg-[#111c38] border border-[#dce5f0] dark:border-[#1e293b] rounded-2xl p-8 shadow-xs space-y-6">
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-[#17233c] dark:text-white">
                {title}
              </h1>
              <p className="text-xs text-[#52627a] dark:text-slate-400 leading-relaxed font-normal">
                {subtitle}
              </p>
            </div>

            {children}
          </div>
        </div>

        {/* Responsive Footer */}
        <div className="text-center text-xs text-[#718096] dark:text-slate-500 py-2 font-medium">
          CivicPulse AI • Public Service Platform
        </div>
      </div>
    </div>
  );
};
