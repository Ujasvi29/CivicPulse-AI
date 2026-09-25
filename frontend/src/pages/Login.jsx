import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../layouts/AuthLayout';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname || null;

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

    if (!formData.email.trim() || !formData.password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setLoading(true);

    const result = await signIn({
      email: formData.email.trim(),
      password: formData.password,
    });

    setLoading(false);

    if (result.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (result.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Continue making your community heard."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 bg-[#c85c5c]/10 border border-[#c85c5c]/30 rounded-xl text-[#c85c5c] dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#c85c5c] dark:text-rose-400 mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">
            Email Address
          </label>
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
              placeholder="citizen@example.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#17233c] dark:text-slate-300 block">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs text-[#3b6ea8] dark:text-blue-400 hover:underline font-semibold transition"
            >
              Forgot password?
            </Link>
          </div>
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
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 bg-[#f5f8fc] dark:bg-[#0b1329] border border-[#dce5f0] dark:border-[#1e293b] rounded-xl text-sm text-[#17233c] dark:text-slate-100 placeholder-[#718096] dark:placeholder-slate-500 focus:outline-none focus:border-[#3b6ea8] focus:ring-1 focus:ring-[#3b6ea8] transition font-medium"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#3b6ea8] hover:bg-[#2e598b] active:bg-[#25466e] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs mt-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </>
          )}
        </button>

        {/* Registration Redirect Footer */}
        <div className="pt-4 border-t border-[#dce5f0] dark:border-[#1e293b] text-center text-xs text-[#52627a] dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-[#3b6ea8] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1 transition ml-1"
          >
            Create an account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};
