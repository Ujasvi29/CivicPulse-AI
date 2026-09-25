import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Zap, Sun, Moon, LogOut, User, ShieldCheck } from 'lucide-react';

export const Header = ({ subtitle = 'Citizen Portal' }) => {
  const { user, profile, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'My Reports', path: '/reports' },
    { name: 'Community', path: '/map' },
    { name: 'Profile', path: '/profile' },
  ];

  return (
    <header className="bg-white dark:bg-[#111c38] border-b border-[#dce5f0] dark:border-[#1e293b] px-6 py-3 sticky top-0 z-50 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 bg-[#3b6ea8]/10 dark:bg-blue-600/20 border border-[#3b6ea8]/20 dark:border-blue-500/30 rounded-xl text-[#3b6ea8] dark:text-blue-400 group-hover:scale-105 transition">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[#17233c] dark:text-white block">
              CivicPulse AI
            </span>
            <span className="text-[11px] text-[#52627a] dark:text-slate-400 block font-medium">
              {subtitle}
            </span>
          </div>
        </Link>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#f5f8fc] dark:bg-[#0b1329] p-1 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  isActive
                    ? 'bg-white dark:bg-[#111c38] text-[#3b6ea8] dark:text-blue-400 shadow-xs'
                    : 'text-[#52627a] dark:text-slate-400 hover:text-[#17233c] dark:hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            className="p-2 rounded-xl text-[#52627a] dark:text-slate-300 hover:bg-[#f5f8fc] dark:hover:bg-[#172447] border border-[#dce5f0] dark:border-[#1e293b] transition flex items-center gap-1.5 text-xs font-medium cursor-pointer"
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

          {/* User Profile & Sign Out */}
          {user && (
            <>
              <div className="hidden sm:flex items-center gap-2 text-xs bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] px-3 py-1.5 rounded-full">
                <span className="flex items-center gap-1.5 text-[#17233c] dark:text-slate-200 font-semibold">
                  <User className="w-3.5 h-3.5 text-[#3b6ea8] dark:text-blue-400" />
                  {profile?.full_name || user?.email?.split('@')[0]}
                </span>
                <span className="w-1 h-1 bg-[#dce5f0] dark:bg-slate-700 rounded-full" />
                <span className="text-[#3e9b72] dark:text-emerald-400 font-mono flex items-center gap-1 font-bold text-[11px]">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role === 'admin' ? 'ADMIN' : 'CITIZEN'}
                </span>
              </div>

              <button
                onClick={signOut}
                title="Sign Out"
                className="py-1.5 px-3 bg-[#f5f8fc] hover:bg-[#edf2f7] dark:bg-[#172447] dark:hover:bg-slate-800 text-[#17233c] dark:text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-[#dce5f0] dark:border-[#1e293b]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
