import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';
import { SocialAuthProviders } from '../components/auth/SocialAuthProviders';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { verifyTurnstileTokenOnServer } from '../services/turnstileService';
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
  LogIn,
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
  const isSubmittingRef = useRef<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProviderDisabled, setIsProviderDisabled] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileTokenRef = useRef<string>('');
  const consumedTokensRef = useRef<Set<string>>(new Set());
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

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
    terms?: string;
  }>({});

  // If already authenticated
  if (isAuthenticated && currentUser) {
    const handle = userProfile?.username || 'scholar';
    return (
      <div className="max-w-md mx-auto my-12 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div className="w-12 h-12 rounded-sm bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-[#3366cc]">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#101418] font-serif">
            Account Active
          </h2>
          <p className="text-xs text-[#54595d]">
            You are currently registered and signed in as{' '}
            <strong className="text-[#3366cc]">@{handle}</strong>.
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
            variant="secondary"
            size="md"
            onClick={() => navigate('/')}
          >
            Explore Main Page
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
        setUsernameStatus({ available: true, message: 'Username is available' });
        setFieldErrors((prev) => ({ ...prev, username: undefined }));
      } else {
        setUsernameStatus({ available: false, message: 'This username is already taken' });
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
      terms?: string;
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

    if (!acceptedTerms) {
      errors.terms = 'You must accept the Terms of Use, Privacy Policy, and Legal Disclaimer to register.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || loading) {
      console.warn('[Registration Flow] Double submission prevented.');
      return;
    }

    setErrorMessage(null);
    setIsProviderDisabled(false);

    if (!validate()) {
      console.warn('[Registration Flow] Form validation stopped submission.');
      return;
    }

    const tokenToVerify = (turnstileTokenRef.current || turnstileToken || '').trim();
    if (!tokenToVerify || consumedTokensRef.current.has(tokenToVerify)) {
      setErrorMessage('Please complete the security verification challenge.');
      setTurnstileToken('');
      turnstileTokenRef.current = '';
      setTurnstileResetKey((prev) => prev + 1);
      return;
    }

    // Immediately clear stored token and mark as consumed to prevent any reuse
    consumedTokensRef.current.add(tokenToVerify);
    setTurnstileToken('');
    turnstileTokenRef.current = '';

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      console.log('[Registration Flow] Step 1: Validating Turnstile token server-side...');
      const verifyResult = await verifyTurnstileTokenOnServer(tokenToVerify, 'signup');
      if (!verifyResult.success) {
        console.warn('[Registration Flow] Turnstile verification failed:', verifyResult.error);
        setErrorMessage(verifyResult.error || 'Security verification failed. Please try again.');
        // Require a fresh challenge
        setTurnstileResetKey((prev) => prev + 1);
        return;
      }

      console.log('[Registration Flow] Step 2: Turnstile passed. Creating Firebase Auth user & profile...');
      const result = await signup(
        displayName.trim(),
        username.trim().toLowerCase(),
        email.trim().toLowerCase(),
        password
      );

      if (!result.success) {
        const isExpectedAuthWarning =
          result.error?.toLowerCase().includes('already registered') ||
          result.error?.toLowerCase().includes('already claimed') ||
          result.error?.toLowerCase().includes('weak-password') ||
          result.error?.toLowerCase().includes('invalid-email');

        if (isExpectedAuthWarning) {
          console.warn('[Registration Flow] Registration notice:', result.error);
        } else {
          console.error('[Registration Flow] Registration failed with error:', result.error);
        }

        setErrorMessage(result.error || 'Failed to create account.');
        if (result.error?.toLowerCase().includes('already registered')) {
          setFieldErrors((prev) => ({
            ...prev,
            email: 'This email address is already registered in TheLegendsWiki.',
          }));
        }

        // Token has been consumed for this attempt. Require a fresh challenge for retry:
        setTurnstileResetKey((prev) => prev + 1);
        if (result.isProviderDisabled) {
          setIsProviderDisabled(true);
        }
      } else {
        console.log('[Registration Flow] Step 3: Registration successful. Navigating to home.');
        navigate('/');
      }
    } catch (err: any) {
      console.error('[Registration Flow] Unexpected registration exception:', err);
      setErrorMessage(err?.message || 'An unexpected error occurred during registration.');
      setTurnstileResetKey((prev) => prev + 1);
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl mx-auto py-4">
      <Breadcrumbs items={[{ label: 'Create Contributor Account' }]} />

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 shadow-xs relative">
        {/* Card Header */}
        <div className="flex items-center gap-3.5 border-b border-[#eaecf0] pb-4 mb-6">
          <TheLegendsWikiLogo size="lg" className="rounded-sm border border-slate-200 bg-[#f8f9fa] p-0.5 shadow-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                Registration
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#101418] font-serif">
              Join TheLegendsWiki
            </h1>
          </div>
        </div>

        {/* Firebase Provider Notice */}
        {isProviderDisabled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertCircle size={16} className="shrink-0" />
              <span>Firebase Email/Password Authentication Required</span>
            </div>
            <p className="leading-relaxed">
              Email/Password sign-in method must be enabled in your Firebase console.
            </p>
            <div className="bg-white p-2.5 rounded-sm font-mono text-[11px] border border-amber-200 text-amber-800">
              Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Email/Password &rarr; Enable
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 space-y-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed font-medium">{errorMessage}</div>
            </div>
            {errorMessage.toLowerCase().includes('already registered') && (
              <div className="pt-2 border-t border-red-200/60 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/login${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#3366cc] text-white font-semibold rounded-sm hover:bg-[#2855aa] transition-colors text-xs cursor-pointer shadow-xs"
                >
                  <LogIn size={13} />
                  <span>Log In to Existing Account</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/forgot-password${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#54595d] hover:text-[#101418] hover:underline cursor-pointer"
                >
                  <span>Forgot password?</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social & Phone Auth Providers */}
        <div className="mb-4">
          <SocialAuthProviders 
            disabled={loading}
            onSuccess={() => navigate('/')}
            onError={(msg) => setErrorMessage(msg)}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Row 1: Display Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div>
              <label
                htmlFor="signup-name"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Full / Display Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none transition-all ${
                    fieldErrors.displayName
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                  }`}
                />
              </div>
              {fieldErrors.displayName && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.displayName}</p>
              )}
            </div>

            {/* Username */}
            <div>
              <label
                htmlFor="signup-username"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Username Handle <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d] font-mono text-xs">
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
                  className={`w-full text-xs pl-8 pr-3 py-2.5 font-mono border rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none transition-all ${
                    fieldErrors.username
                      ? 'border-red-500 ring-1 ring-red-500'
                      : usernameStatus.available
                      ? 'border-emerald-600 ring-1 ring-emerald-300'
                      : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                  }`}
                />
              </div>
              {fieldErrors.username ? (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.username}</p>
              ) : usernameStatus.message ? (
                <p
                  className={`text-[11px] mt-1 font-medium ${
                    usernameStatus.available ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {usernameStatus.message}
                </p>
              ) : (
                <p className="text-[10px] text-[#72777d] mt-1 font-mono">
                  3-30 chars (letters, numbers, underscores)
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="signup-email"
              className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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
                className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none transition-all ${
                  fieldErrors.email
                    ? 'border-red-500 ring-1 ring-red-500'
                    : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Row 2: Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label
                htmlFor="signup-password"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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
                  className={`w-full text-xs pl-9 pr-10 py-2.5 border rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none transition-all ${
                    fieldErrors.password
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#72777d] hover:text-[#101418] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="signup-confirm-password"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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
                  className={`w-full text-xs pl-9 pr-3 py-2.5 border rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none transition-all ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 ring-1 ring-red-500'
                      : 'border-[#a2a9b1] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc]'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-[11px] text-red-600 mt-1 font-medium">{fieldErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* Role clearance note */}
          <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm flex items-start gap-2.5 text-xs text-[#54595d]">
            <ShieldCheck size={16} className="text-[#3366cc] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              New accounts are registered as <strong className="text-[#101418]">User (Contributor)</strong> with draft authoring and contribution submission capabilities. Administrative roles are assigned by the Super Administrator.
            </div>
          </div>

          {/* Legal Terms & Privacy Policy Explicit Acknowledgement */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#54595d] select-none">
              <input
                type="checkbox"
                id="signup-terms-checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (fieldErrors.terms) {
                    setFieldErrors((prev) => ({ ...prev, terms: undefined }));
                  }
                }}
                className="mt-0.5 h-4 w-4 rounded border-[#a2a9b1] text-[#3366cc] focus:ring-[#3366cc]"
              />
              <span className="leading-relaxed">
                I have read and agree to the{' '}
                <button
                  type="button"
                  onClick={() => navigate('/terms')}
                  className="text-[#3366cc] underline hover:text-[#2557bb] font-semibold cursor-pointer"
                >
                  Terms of Use
                </button>
                ,{' '}
                <button
                  type="button"
                  onClick={() => navigate('/privacy-policy')}
                  className="text-[#3366cc] underline hover:text-[#2557bb] font-semibold cursor-pointer"
                >
                  Privacy Policy
                </button>
                , and{' '}
                <button
                  type="button"
                  onClick={() => navigate('/disclaimer')}
                  className="text-[#3366cc] underline hover:text-[#2557bb] font-semibold cursor-pointer"
                >
                  Legal Disclaimer
                </button>
                . <span className="text-red-500">*</span>
              </span>
            </label>
            {fieldErrors.terms && (
              <p className="text-[11px] text-red-600 mt-1 font-medium pl-6.5">
                {fieldErrors.terms}
              </p>
            )}
          </div>

          {/* Cloudflare Turnstile Security Verification */}
          <TurnstileWidget
            action="signup"
            onVerify={(token) => {
              const clean = (token || '').trim();
              if (clean && !consumedTokensRef.current.has(clean)) {
                setTurnstileToken(clean);
                turnstileTokenRef.current = clean;
                setErrorMessage(null);
              }
            }}
            onExpire={() => {
              setTurnstileToken('');
              turnstileTokenRef.current = '';
            }}
            onError={() => {
              setTurnstileToken('');
              turnstileTokenRef.current = '';
            }}
            resetKey={turnstileResetKey}
            disabled={loading}
          />

          {/* Submit button */}
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={loading}
              className="w-full justify-center"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Creating Account...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <UserPlus size={15} />
                  Complete Registration
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#eaecf0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#54595d]">
          <div>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#3366cc] hover:underline font-semibold cursor-pointer ml-1"
            >
              Log In
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-[#72777d] hover:text-[#101418] inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ArrowLeft size={12} /> Back to Main Page
          </button>
        </div>
      </div>
    </div>
  );
};
