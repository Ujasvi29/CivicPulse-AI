import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/Header';
import { updateUserProfile } from '../services/reports';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Landmark,
  ShieldAlert,
} from 'lucide-react';

export const Profile = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [city, setCity] = useState(profile?.city || '');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setLoading(true);
    const result = await updateUserProfile(user.id, {
      fullName: fullName.trim(),
      city: city.trim() || (isAdmin ? 'Municipal Administration' : 'City Region'),
    });
    setLoading(false);

    if (result.success) {
      setSuccessMessage('Profile details updated successfully.');
      if (refreshProfile) refreshProfile();
    } else {
      setErrorMessage(result.error || 'Failed to update profile.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f8fc] dark:bg-[#0b1329] text-[#17233c] dark:text-[#f8fafc] flex flex-col font-sans transition-colors duration-200">
      <Header subtitle={isAdmin ? 'Municipal Command Center' : 'Citizen Portal'} />

      <main className="max-w-3xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17233c] dark:text-white tracking-tight">
            {isAdmin ? 'Administrator Profile' : 'Citizen Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-[#52627a] dark:text-slate-400">
            {isAdmin
              ? 'Manage your municipal administrator credentials and department affiliation.'
              : 'Manage your personal profile and municipal region information.'}
          </p>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="p-4 bg-[#3e9b72]/10 border border-[#3e9b72]/30 rounded-xl text-[#3e9b72] dark:text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-4 bg-[#c85c5c]/10 border border-[#c85c5c]/30 rounded-xl text-[#c85c5c] dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
        )}

        {/* Profile Card & Form */}
        <div className="civic-card p-6 sm:p-8 space-y-6">
          {/* Identity Header */}
          <div className="flex items-center gap-4 pb-6 border-b border-[#dce5f0] dark:border-[#1e293b]">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-xl border ${
                isAdmin
                  ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border-amber-500/30'
                  : 'bg-[#3b6ea8]/10 text-[#3b6ea8] dark:bg-blue-950 dark:text-blue-400 border-[#3b6ea8]/20'
              }`}
            >
              {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#17233c] dark:text-white">
                  {profile?.full_name || (isAdmin ? 'Administrator' : 'Citizen')}
                </h2>
                <span
                  className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${
                    isAdmin
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                      : 'bg-[#3e9b72]/10 text-[#3e9b72] dark:text-emerald-400 border-[#3e9b72]/20'
                  }`}
                >
                  {isAdmin ? 'ADMINISTRATOR' : 'CITIZEN'}
                </span>
              </div>
              <p className="text-xs text-[#52627a] dark:text-slate-400 font-mono">
                {user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                {isAdmin ? 'Official Full Name' : 'Full Name'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] focus:outline-none focus:border-[#3b6ea8] transition font-medium"
                />
              </div>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                Email Address (Managed by Supabase Auth)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#718096] dark:text-slate-400 font-mono opacity-80 cursor-not-allowed"
                />
              </div>
            </div>

            {/* City / Department */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                {isAdmin ? 'Department / Office' : 'City / Municipality'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  {isAdmin ? <Landmark className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={isAdmin ? 'e.g. Roads & Infrastructure' : 'e.g. Austin, TX'}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] focus:outline-none focus:border-[#3b6ea8] transition font-medium"
                />
              </div>
            </div>

            {/* Role (Read Only - Protected against tampering) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#17233c] dark:text-slate-200 block">
                  Application Role (Immutable via Client)
                </label>
                <span className="text-[10px] text-[#718096] dark:text-slate-500 font-medium">
                  Verified by Server Authority
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  disabled
                  value={profile?.role ? profile.role.toUpperCase() : 'CITIZEN'}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm font-mono font-bold tracking-wider text-[#3b6ea8] dark:text-blue-400 opacity-90 cursor-not-allowed"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-[#dce5f0] dark:border-[#1e293b] flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-5 bg-[#3b6ea8] hover:bg-[#2e598b] active:bg-[#25466e] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="py-2.5 px-4 bg-[#f5f8fc] hover:bg-rose-50 dark:bg-[#0b1329] dark:hover:bg-rose-950/30 text-[#c85c5c] border border-[#dce5f0] dark:border-[#1e293b] text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="border-t border-[#dce5f0] dark:border-[#1e293b] py-4 px-6 text-center text-xs text-[#718096] dark:text-slate-500 font-medium">
        CivicPulse AI • Public Service Platform
      </footer>
    </div>
  );
};
