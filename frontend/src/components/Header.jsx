import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Zap, Sun, Moon, LogOut, User, ShieldCheck, Menu, X, PlusCircle, FileText, MapPin } from 'lucide-react';

export const Header = ({ subtitle = 'Citizen Portal' }) => {
  const { user, profile, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const authNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Zap },
    { name: 'Report Issue', path: '/report/new', icon: PlusCircle },
    { name: 'My Reports', path: '/reports', icon: FileText },
    { name: 'Community', path: '/community', icon: MapPin },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const publicNavItems = [
    { name: 'How It Works', path: '/#how-it-works' },
    { name: 'Community Pulse', path: '/community' },
  ];

  return (
    <header className="bg-white dark:bg-[#111c38] border-b border-[#dce5f0] dark:border-[#1e293b] px-4 sm:px-6 py-3 sticky top-0 z-50 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Identity */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-[#3b6ea8]/10 dark:bg-blue-600/20 border border-[#3b6ea8]/20 dark:border-blue-500/30 rounded-xl text-[#3b6ea8] dark:text-blue-400 group-hover:scale-105 transition">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-[#17233c] dark:text-white block leading-tight">
              CivicPulse AI
            </span>
            <span className="text-[11px] text-[#52627a] dark:text-slate-400 block font-medium">
              {subtitle}
            </span>
          </div>
        </Link>

        {/* Center Navigation Links (Desktop) */}
        {user ? (
          <nav className="hidden md:flex items-center gap-1 bg-[#f5f8fc] dark:bg-[#0b1329] p-1 rounded-xl border border-[#dce5f0] dark:border-[#1e293b]">
            {authNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white dark:bg-[#111c38] text-[#3b6ea8] dark:text-blue-400 shadow-xs'
                      : 'text-[#52627a] dark:text-slate-400 hover:text-[#17233c] dark:hover:text-white'
                  }`}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-6">
            {publicNavItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-xs font-semibold text-[#52627a] dark:text-slate-300 hover:text-[#3b6ea8] dark:hover:text-blue-400 transition"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Right Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
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
                <span className="hidden lg:inline text-[11px] font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#17233c]" />
                <span className="hidden lg:inline text-[11px] font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* User Profile & Sign Out (If Authenticated) */}
          {user ? (
            <>
              <div className="hidden lg:flex items-center gap-2 text-xs bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] px-3 py-1.5 rounded-full">
                <span className="text-[#17233c] dark:text-slate-200 font-semibold truncate max-w-[130px]">
                  {profile?.full_name || user?.email?.split('@')[0]}
                </span>
                <span className="w-1 h-1 bg-[#dce5f0] dark:bg-slate-700 rounded-full" />
                <span className="text-[#3e9b72] dark:text-emerald-400 font-mono flex items-center gap-1 font-bold text-[10px]">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role === 'admin' ? 'ADMIN' : 'CITIZEN'}
                </span>
              </div>

              <button
                onClick={signOut}
                title="Sign Out"
                className="hidden sm:flex py-1.5 px-3 bg-[#f5f8fc] hover:bg-[#edf2f7] dark:bg-[#172447] dark:hover:bg-slate-800 text-[#17233c] dark:text-slate-200 text-xs font-semibold rounded-xl transition items-center gap-1.5 cursor-pointer border border-[#dce5f0] dark:border-[#1e293b]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="py-1.5 px-3.5 text-[#52627a] dark:text-slate-300 hover:text-[#17233c] dark:hover:text-white text-xs font-semibold transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="py-1.5 px-3.5 bg-[#3b6ea8] hover:bg-[#2e598b] text-white text-xs font-semibold rounded-xl transition shadow-xs"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="md:hidden p-2 rounded-xl text-[#52627a] dark:text-slate-300 hover:bg-[#f5f8fc] dark:hover:bg-[#172447] border border-[#dce5f0] dark:border-[#1e293b] transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-[#dce5f0] dark:border-[#1e293b] mt-3 space-y-2">
          {user ? (
            <>
              <div className="px-3 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] rounded-xl border border-[#dce5f0] dark:border-[#1e293b] flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#17233c] dark:text-slate-200">
                  {profile?.full_name || user?.email}
                </span>
                <span className="text-[#3e9b72] dark:text-emerald-400 font-mono font-bold text-[11px]">
                  {profile?.role === 'admin' ? 'ADMIN' : 'CITIZEN'}
                </span>
              </div>
              {authNavItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#3b6ea8] text-white'
                        : 'text-[#52627a] dark:text-slate-300 hover:bg-[#f5f8fc] dark:hover:bg-[#172447]'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#c85c5c] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left cursor-pointer mt-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="space-y-2 pt-1">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 px-3 text-center text-xs font-semibold text-[#17233c] dark:text-slate-200 bg-[#f5f8fc] dark:bg-[#0b1329] rounded-xl border border-[#dce5f0] dark:border-[#1e293b]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full py-2 px-3 text-center text-xs font-semibold text-white bg-[#3b6ea8] hover:bg-[#2e598b] rounded-xl"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
