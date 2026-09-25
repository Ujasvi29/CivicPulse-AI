import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { User, Mail, Building2, Lock, Eye, EyeOff, UserPlus, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    city: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const { fullName, email, city, password, confirmPassword } = formData;

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Your password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please check and try again.');
      return;
    }

    setLoading(true);

    const result = await signUp({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      city: city.trim() || 'Central City',
    });

    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <AuthLayout
      title="Create your CivicPulse account"
      subtitle="Turn everyday civic problems into actionable community cases."
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3 bg-[#c85c5c]/10 border border-[#c85c5c]/30 rounded-xl text-[#c85c5c] dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#c85c5c] dark:text-rose-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">Full Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="jane@example.com"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
          </div>
        </div>

        {/* City / Municipality */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">City / Municipality</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="e.g. Austin, TX"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full pl-10 pr-10 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#718096] hover:text-[#17233c] dark:hover:text-slate-200 transition cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">Confirm Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#718096] dark:text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              className="w-full pl-10 pr-4 py-2 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] active:bg-[#25466e] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Login Redirect Footer */}
        <div className="pt-3 border-t border-[#dce5f0] dark:border-[#1e293b] text-center text-xs text-[#52627a] dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#3b6ea8] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 transition ml-1"
          >
            Sign in
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
