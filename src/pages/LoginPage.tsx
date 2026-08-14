import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, currentUser, userProfile } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProviderDisabled, setIsProviderDisabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // If already authenticated, show status
  if (isAuthenticated && currentUser) {
    const username = userProfile?.username || 'scholar';
    return (
      <div className="max-w-md mx-auto my-12 bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="w-12 h-12 rounded-sm bg-blue-950/80 border border-blue-500/40 mx-auto flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Already Signed In
          </h2>
          <p className="text-xs text-slate-400">
            You are actively signed in as{' '}
            <strong className="text-blue-400">@{username}</strong> ({currentUser.email}).
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/user/${username}`)}
          >
            Go to Your Profile
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
          >
            Explore Main Registry
          </Button>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProviderDisabled(false);

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to sign in.');
        if (result.isProviderDisabled) {
          setIsProviderDisabled(true);
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto py-4">
      <Breadcrumbs items={[{ label: 'Contributor Authentication' }]} />

      <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5 mb-6">
          <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-blue-600 to-indigo-800 border border-blue-400/40 flex items-center justify-center text-white font-legend font-bold text-sm shadow-[0_0_12px_rgba(59,130,246,0.4)]">
            <LogIn size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-sm border border-blue-500/30">
                Archival Codex
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
              Contributor Log In
            </h1>
          </div>
        </div>

        {/* Firebase Email/Password Disabled Notice Alert */}
        {isProviderDisabled && (
          <div className="mb-6 p-4 bg-amber-950/40 border border-amber-500/40 rounded-sm text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertCircle size={16} className="shrink-0" />
              <span>Firebase Email/Password Authentication Required</span>
            </div>
            <p className="leading-relaxed">
              Email/Password sign-in method must be enabled in your Firebase console.
            </p>
            <div className="bg-[#080c14]/80 p-2.5 rounded-sm font-mono text-[11px] border border-amber-500/20 text-amber-100">
              Firebase Console → Authentication → Sign-in method → Email/Password → Enable
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && !isProviderDisabled && (
          <div
            role="alert"
            className="mb-6 p-3.5 bg-red-950/40 border border-red-500/40 rounded-sm text-xs text-red-200 flex items-start gap-2.5"
          >
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={15} />
              </div>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) {
                    setFieldErrors((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                placeholder="scholar@thelegendswiki.org"
                className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#080c14] text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all ${
                  fieldErrors.email
                    ? 'border-red-500 ring-1 ring-red-500/50'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock size={15} />
              </div>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors((prev) => ({ ...prev, password: undefined }));
                  }
                }}
                placeholder="••••••••••••"
                className={`w-full text-xs pl-9 pr-10 py-2.5 border rounded-sm bg-[#080c14] text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all ${
                  fieldErrors.password
                    ? 'border-red-500 ring-1 ring-red-500/50'
                    : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-[11px] text-red-400 mt-1 font-medium">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Verifying Credentials...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn size={15} />
                  Log In to Codex
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer info & link to signup */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer ml-1"
            >
              Create Account
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-300 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} /> Back to Archive
          </button>
        </div>
      </div>
    </div>
  );
};
