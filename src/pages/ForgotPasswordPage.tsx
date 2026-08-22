import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { verifyTurnstileTokenOnServer } from '../services/turnstileService';
import {
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Info,
  ShieldCheck,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const { resetPasswordEmail, isAuthenticated, currentUser, userProfile } = useAuth();
  const { navigate } = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [turnstileResetKey, setTurnstileResetKey] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address format.');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the security verification challenge.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify Turnstile challenge server-side
      const verifyResult = await verifyTurnstileTokenOnServer(turnstileToken, 'password_reset');
      if (!verifyResult.success) {
        setErrorMessage(verifyResult.error || 'Security verification failed. Please try again.');
        setTurnstileToken('');
        setTurnstileResetKey((prev) => prev + 1);
        setLoading(false);
        return;
      }

      // 2. Dispatch password reset email via Firebase Auth
      const result = await resetPasswordEmail(cleanEmail);
      if (result.success) {
        setSuccessEmail(cleanEmail);
        setResendCooldown(60);

        // Start 60s cooldown timer
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(result.error || 'Failed to dispatch password reset email. Please try again.');
        setTurnstileToken('');
        setTurnstileResetKey((prev) => prev + 1);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while requesting password reset.');
      setTurnstileToken('');
      setTurnstileResetKey((prev) => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !successEmail || loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await resetPasswordEmail(successEmail);
      if (result.success) {
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(result.error || 'Failed to resend reset email.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to resend reset email.');
    } finally {
      setLoading(false);
    }
  };

  // If already signed in, show informative note
  if (isAuthenticated && currentUser) {
    const username = userProfile?.username || 'scholar';
    return (
      <div className="max-w-md mx-auto my-12 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 text-center space-y-6 shadow-xs">
        <div className="w-12 h-12 rounded-sm bg-blue-50 border border-blue-200 mx-auto flex items-center justify-center text-[#3366cc]">
          <ShieldCheck size={24} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[#101418] font-serif">
            Active Session Detected
          </h2>
          <p className="text-xs text-[#54595d]">
            You are signed in as <strong className="text-[#3366cc]">@{username}</strong> ({currentUser.email || 'Authenticated'}).
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
            Explore Encyclopedia
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-3 sm:px-0">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Main Page', path: '/' },
            { label: 'Sign In', path: '/login' },
            { label: 'Password Recovery' },
          ]}
        />
      </div>

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="border-b border-[#a2a9b1] pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs text-[#3366cc]">
              <KeyRound size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#101418] font-serif tracking-tight">
                Reset Account Password
              </h1>
              <p className="text-xs text-[#54595d] mt-0.5">
                TheLegendsWiki Security & Identity Verification
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-start gap-2.5"
          >
            <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Success View */}
        {successEmail ? (
          <div className="space-y-6">
            <div
              role="status"
              className="p-4 bg-[#d5fdf4] border border-[#20c997] rounded-sm text-xs text-[#0f5132] flex items-start gap-3 shadow-xs"
            >
              <CheckCircle2 size={18} className="text-[#0f5132] shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <div className="font-semibold text-sm">
                  Password Reset Link Dispatched
                </div>
                <p className="leading-relaxed text-xs">
                  We have sent an official password recovery link to{' '}
                  <strong className="underline underline-offset-2">{successEmail}</strong>.
                </p>
                <div className="p-3 bg-white/80 border border-[#20c997]/40 rounded-xs text-[11px] space-y-1 text-[#0f5132]">
                  <div>• Open the email sent from <strong>Firebase Authentication</strong>.</div>
                  <div>• Click the secure reset link inside the email to establish a new password.</div>
                  <div>• If you do not see it within a couple minutes, please inspect your <strong>Spam / Junk</strong> folder.</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={resendCooldown > 0 || loading}
                onClick={handleResend}
                className="flex-1 justify-center"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    Resending...
                  </span>
                ) : resendCooldown > 0 ? (
                  `Resend Link in ${resendCooldown}s`
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={14} />
                    Resend Reset Link
                  </span>
                )}
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate('/login')}
                className="flex-1 justify-center"
              >
                Return to Sign In
              </Button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <p className="text-xs text-[#54595d] leading-relaxed">
              Enter your registered institutional or personal email address below. We will send a secure password reset link to create a new password.
            </p>

            {/* Email Field */}
            <div>
              <label
                htmlFor="reset-email"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Registered Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
                  <Mail size={15} />
                </div>
                <input
                  id="reset-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="scholar@thelegendswiki.org"
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-[#a2a9b1] rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] transition-all"
                />
              </div>
            </div>

            {/* Provider Notice */}
            <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs text-[11px] text-[#54595d] flex items-start gap-2">
              <Info size={14} className="text-[#3366cc] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Third-Party & Phone Accounts:</strong> If you authenticated using <strong>Google</strong>, <strong>Apple</strong>, or <strong>Phone (SMS)</strong>, you do not need a password. You can sign in directly through your provider on the login page.
              </div>
            </div>

            {/* Cloudflare Turnstile Verification */}
            <TurnstileWidget
              action="password_reset"
              onVerify={(token) => {
                setTurnstileToken(token);
                setErrorMessage(null);
              }}
              onExpire={() => setTurnstileToken('')}
              onError={() => setTurnstileToken('')}
              resetKey={turnstileResetKey}
              disabled={loading}
            />

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
                    Sending Reset Link...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Mail size={15} />
                    Send Reset Link
                  </span>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-[#eaecf0] flex items-center justify-between text-xs text-[#54595d]">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#3366cc] hover:underline font-medium inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={13} /> Back to Sign In
          </button>

          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="text-[#72777d] hover:text-[#101418] cursor-pointer"
          >
            Create New Account &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
