import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import {
  UserPlus,
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { isUsernameAvailable } from '../services/userService';

export const SignupPage: React.FC = () => {
  const { signup, isAuthenticated, currentUser, userProfile } = useAuth();
  const { navigate } = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProviderDisabled, setIsProviderDisabled] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<{
    checking?: boolean;
    available?: boolean;
    message?: string;
  }>({});

  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string;
    username?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // If already authenticated
  if (isAuthenticated && currentUser) {
    const handle = userProfile?.username || 'scholar';
    return (
      <div className="max-w-md mx-auto my-12 bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-2xl">
        <div className="w-12 h-12 rounded-sm bg-blue-950/80 border border-blue-500/40 mx-auto flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-100 font-display">
            Account Active
          </h2>
          <p className="text-xs text-slate-400">
            You are currently registered and signed in as{' '}
            <strong className="text-blue-400">@{handle}</strong>.
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate(`/user/${handle}`)}
          >
            View Your Profile
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => navigate('/')}
          >
            Explore Main Codex
          </Button>
        </div>
      </div>
    );
  }

  const handleUsernameBlur = async () => {
    const clean = username.trim().toLowerCase();
    if (!clean) return;

    if (clean.length < 3 || clean.length > 30 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      setUsernameStatus({
        available: false,
        message: 'Must be 3-30 letters, numbers, or underscores.',
      });
      return;
    }

    setUsernameStatus({ checking: true });
    try {
      const available = await isUsernameAvailable(clean);
      if (available) {
        setUsernameStatus({ available: true, message: 'Handle is available' });
        setFieldErrors((prev) => ({ ...prev, username: undefined }));
      } else {
        setUsernameStatus({ available: false, message: 'This handle is already taken' });
      }
    } catch {
      setUsernameStatus({});
    }
  };

  const validate = (): boolean => {
    const errors: {
      displayName?: string;
      username?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!displayName.trim() || displayName.trim().length < 2) {
      errors.displayName = 'Display name must be at least 2 characters.';
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      errors.username = 'Username must be at least 3 characters.';
    } else if (cleanUsername.length > 30) {
      errors.username = 'Username cannot exceed 30 characters.';
    } else if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      errors.username = 'Username may only contain letters, numbers, and underscores.';
    }

    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      const result = await signup(
        displayName.trim(),
        username.trim().toLowerCase(),
        email.trim().toLowerCase(),
        password
      );

      if (!result.success) {
        setErrorMessage(result.error || 'Failed to create account.');
        if (result.isProviderDisabled) {
          setIsProviderDisabled(true);
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-4">
      <Breadcrumbs items={[{ label: 'Create Contributor Account' }]} />

      <div className="bg-[#0e1424] border border-slate-800 rounded-sm p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-800 pb-5 mb-6">
          <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border border-blue-400/40 flex items-center justify-center text-white font-legend font-bold text-sm shadow-[0_0_12px_rgba(59,130,246,0.4)]">
            <UserPlus size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded-sm border border-blue-500/30">
                Registry Induction
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
              Join TheLegendsWiki
            </h1>
          </div>
        </div>

        {/* Firebase Provider Notice */}
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
          {/* Row 1: Display Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Full / Display Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={15} />
                </div>
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    if (fieldErrors.displayName) {
                      setFieldErrors((prev) => ({ ...prev, displayName: undefined }));
                    }
                  }}
                  placeholder="e.g., Ada Lovelace"
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#080c14] text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all ${
                    fieldErrors.displayName
                      ? 'border-red-500 ring-1 ring-red-500/50'
                      : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
              {fieldErrors.displayName && (
                <p className="text-[11px] text-red-400 mt-1 font-medium">{fieldErrors.displayName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Archival Handle <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                  <AtSign size={14} />
                </div>
                <input
                  id="signup-username"
                  type="text"
                  name="username"
                  autoComplete="username"
                  required
                  value={username}
                  onBlur={handleUsernameBlur}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setUsername(val);
                    setUsernameStatus({});
                    if (fieldErrors.username) {
                      setFieldErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  placeholder="ada_curator"
                  className={`w-full text-xs pl-8 pr-3 py-2.5 font-mono border rounded-sm bg-[#080c14] text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all ${
                    fieldErrors.username
                      ? 'border-red-500 ring-1 ring-red-500/50'
                      : usernameStatus.available
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
              {fieldErrors.username ? (
                <p className="text-[11px] text-red-400 mt-1 font-medium">{fieldErrors.username}</p>
              ) : usernameStatus.message ? (
                <p
                  className={`text-[11px] mt-1 font-medium ${
                    usernameStatus.available ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {usernameStatus.message}
                </p>
              ) : (
                <p className="text-[10px] text-slate-500 mt-1 font-mono">
                  3-30 chars (letters, numbers, underscores)
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
            >
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail size={15} />
              </div>
              <input
                id="signup-email"
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
                placeholder="scholar@university.edu"
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

          {/* Row 2: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  name="new-password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock size={15} />
                </div>
                <input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }
                  }}
                  placeholder="Repeat password"
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#080c14] text-slate-100 placeholder:text-slate-600 focus:outline-none transition-all ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 ring-1 ring-red-500/50'
                      : 'border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-400 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Role clearance note */}
          <div className="p-3 bg-[#121829] border border-slate-800 rounded-sm flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              New accounts are registered as <strong className="text-slate-200">Registered Scholar</strong> with public article authoring capabilities. Elevated editorial privileges are assigned through peer review by administrators.
            </div>
          </div>

          {/* Submit button */}
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
                  Creating Researcher Account...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={15} />
                  Complete Induction & Join
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer ml-1"
            >
              Log In
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
