import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';
import { SocialAuthProviders } from '../components/auth/SocialAuthProviders';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { verifyTurnstileTokenOnServer } from '../services/turnstileService';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, currentUser, userProfile } = useAuth();
  const { navigate } = useRouter();

  const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [email, setEmail] = useState(() => urlParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProviderDisabled, setIsProviderDisabled] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [requiresCaptcha, setRequiresCaptcha] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);

  const resetSuccess = urlParams.get('reset') === 'success';

  // Synchronize email state if URL changes
  React.useEffect(() => {
    const qEmail = new URLSearchParams(window.location.search).get('email');
    if (qEmail && !email) {
      setEmail(qEmail);
    }
  }, [email]);

  // If already authenticated, show status
  if (isAuthenticated && currentUser) {
    const username = userProfile?.username || 'scholar';
    return (
      <div className="max-w-md mx-auto my-12 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div className="w-12 h-12 rounded-sm bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-[#3366cc]">
          <CheckCircle2 size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#101418] font-serif">
            Already Signed In
          </h2>
          <p className="text-xs text-[#54595d]">
            You are actively signed in as{' '}
            <strong className="text-[#3366cc]">@{username}</strong> ({currentUser.email || currentUser.phoneNumber || 'Authenticated'}).
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

    // If multiple failed attempts occurred, require and verify Turnstile token
    if (requiresCaptcha) {
      if (!turnstileToken) {
        setErrorMessage('Please complete the security verification challenge before continuing.');
        return;
      }

      setLoading(true);
      const verifyResult = await verifyTurnstileTokenOnServer(turnstileToken, 'login');
      if (!verifyResult.success) {
        setErrorMessage(verifyResult.error || 'Security verification failed. Please try again.');
        setTurnstileToken('');
        setTurnstileResetKey((prev) => prev + 1);
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    try {
      const result = await login(email.trim(), password);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to sign in.');
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= 2) {
          setRequiresCaptcha(true);
        }
        if (requiresCaptcha) {
          setTurnstileToken('');
          setTurnstileResetKey((prev) => prev + 1);
        }
        if (result.isProviderDisabled) {
          setIsProviderDisabled(true);
        }
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during login.');
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 2) {
        setRequiresCaptcha(true);
      }
      if (requiresCaptcha) {
        setTurnstileToken('');
        setTurnstileResetKey((prev) => prev + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto py-4">
      <Breadcrumbs items={[{ label: 'Contributor Authentication' }]} />

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 shadow-xs relative">
        {/* Card Header */}
        <div className="flex items-center gap-3.5 border-b border-[#eaecf0] pb-4 mb-6">
          <TheLegendsWikiLogo size="lg" className="rounded-sm border border-slate-200 bg-[#f8f9fa] p-0.5 shadow-xs shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3366cc] bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-200">
                Authentication
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#101418] font-serif">
              Contributor Log In
            </h1>
          </div>
        </div>

        {/* Firebase Email/Password Disabled Notice Alert */}
        {isProviderDisabled && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-800">
              <AlertCircle size={16} className="shrink-0" />
              <span>Firebase Authentication Method Configuration</span>
            </div>
            <p className="leading-relaxed">
              This sign-in method must be enabled in your Firebase console.
            </p>
            <div className="bg-white p-2.5 rounded-sm font-mono text-[11px] border border-amber-200 text-amber-800">
              Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Enable
            </div>
          </div>
        )}

        {/* Password Reset Success Alert */}
        {resetSuccess && !errorMessage && (
          <div
            role="status"
            className="mb-6 p-3.5 bg-[#d5fdf4] border border-[#20c997] rounded-sm text-xs text-[#0f5132] flex items-start gap-2.5 shadow-xs"
          >
            <CheckCircle2 size={16} className="text-[#0f5132] shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <strong className="font-semibold">Password updated successfully.</strong> Please sign in with your new password credentials.
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && !isProviderDisabled && (
          <div
            role="alert"
            className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-start gap-2.5"
          >
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
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

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
            >
              Account Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider font-sans"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] text-[#3366cc] hover:underline cursor-pointer font-sans transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
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

          {/* Conditional Security Verification on repeated attempts */}
          {requiresCaptcha && (
            <TurnstileWidget
              action="login_protection"
              onVerify={(token) => {
                setTurnstileToken(token);
                setErrorMessage(null);
              }}
              onExpire={() => setTurnstileToken('')}
              onError={() => setTurnstileToken('')}
              resetKey={turnstileResetKey}
              disabled={loading}
            />
          )}

          {/* Submit Button */}
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
                  Verifying Credentials...
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <LogIn size={15} />
                  Log In
                </span>
              )}
            </Button>
          </div>
        </form>

        {/* Footer info & link to signup */}
        <div className="mt-6 pt-4 border-t border-[#eaecf0] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#54595d]">
          <div>
            Need an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="text-[#3366cc] hover:underline font-semibold cursor-pointer ml-1"
            >
              Create Account
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
