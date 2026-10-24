import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { Button } from '../components/common/Button';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TheLegendsWikiLogo } from '../components/common/TheLegendsWikiLogo';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Check,
  X,
} from 'lucide-react';

interface ResetPasswordPageProps {
  oobCode?: string;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ oobCode: propCode }) => {
  const { verifyResetActionCode, completePasswordReset } = useAuth();
  const { navigate } = useRouter();

  // Extract oobCode from prop or URL query params
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialCode = propCode || urlParams.get('oobCode') || urlParams.get('code') || '';

  const [code, setCode] = useState(initialCode);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [verifyingCode, setVerifyingCode] = useState(!!initialCode);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Verify the reset code when available
  useEffect(() => {
    let isMounted = true;

    async function checkCode() {
      if (!initialCode) {
        setVerifyingCode(false);
        return;
      }

      setVerifyingCode(true);
      setCodeError(null);

      try {
        const result = await verifyResetActionCode(initialCode);
        if (!isMounted) return;

        if (result.success && result.email) {
          setVerifiedEmail(result.email);
          setCodeError(null);
        } else {
          setCodeError(
            result.error ||
              'This password reset link is invalid, expired, or has already been used. Please request a new link.'
          );
        }
      } catch (err: any) {
        if (isMounted) {
          setCodeError(err?.message || 'Failed to verify password reset code.');
        }
      } finally {
        if (isMounted) {
          setVerifyingCode(false);
        }
      }
    }

    checkCode();

    return () => {
      isMounted = false;
    };
  }, [initialCode, verifyResetActionCode]);

  // Validation checks
  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const activeCode = (code || initialCode).trim();
    if (!activeCode) {
      setSubmitError('Password reset action code is missing.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setSubmitError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await completePasswordReset(activeCode, newPassword);
      if (result.success) {
        setResetSuccess(true);
      } else {
        setSubmitError(result.error || 'Failed to update password. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'An unexpected error occurred while resetting your password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setVerifyingCode(true);
    setCodeError(null);
    try {
      const result = await verifyResetActionCode(code.trim());
      if (result.success && result.email) {
        setVerifiedEmail(result.email);
      } else {
        setCodeError(result.error || 'Invalid or expired action code.');
      }
    } catch (err: any) {
      setCodeError(err?.message || 'Failed to verify action code.');
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 px-3 sm:px-0">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumbs
          items={[
            { label: 'Main Page', path: '/' },
            { label: 'Sign In', path: '/login' },
            { label: 'Set New Password' },
          ]}
        />
      </div>

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="border-b border-[#a2a9b1] pb-4 mb-6">
          <div className="flex items-center gap-3.5">
            <TheLegendsWikiLogo size="lg" className="rounded-sm border border-slate-200 bg-[#f8f9fa] p-0.5 shadow-xs shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-[#101418] font-serif tracking-tight">
                Create New Password
              </h1>
              <p className="text-xs text-[#54595d] mt-0.5">
                TheLegendsWiki Security & Credential Management
              </p>
            </div>
          </div>
        </div>

        {/* 1. Loading Verification State */}
        {verifyingCode && (
          <div className="py-10 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#3366cc]/30 border-t-[#3366cc] animate-spin mx-auto" />
            <p className="text-xs text-[#54595d]">
              Verifying secure password recovery authorization...
            </p>
          </div>
        )}

        {/* 2. Success State */}
        {!verifyingCode && resetSuccess && (
          <div className="space-y-6">
            <div
              role="status"
              className="p-5 bg-[#d5fdf4] border border-[#20c997] rounded-sm text-xs text-[#0f5132] space-y-3 shadow-xs"
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={20} className="text-[#0f5132]" />
                Password Reset Successfully
              </div>
              <p className="leading-relaxed text-xs">
                Your TheLegendsWiki account password has been updated in Firebase Authentication.
                All existing profile data, permissions, and articles remain intact.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate('/login?reset=success')}
              className="w-full justify-center"
            >
              Sign In with New Password
            </Button>
          </div>
        )}

        {/* 3. Code Verification Error */}
        {!verifyingCode && !resetSuccess && codeError && (
          <div className="space-y-6">
            <div
              role="alert"
              className="p-4 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-start gap-2.5"
            >
              <AlertCircle size={17} className="text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-semibold text-sm">Invalid or Expired Reset Link</div>
                <div className="leading-relaxed">{codeError}</div>
                <div className="text-[11px] text-red-600/80">
                  Password reset links are single-use and expire after a limited period for account security.
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={() => navigate('/forgot-password')}
                className="flex-1 justify-center"
              >
                Request a New Reset Link
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => navigate('/login')}
                className="flex-1 justify-center"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        )}

        {/* 4. Missing Code Prompt (User landed on /reset-password directly) */}
        {!verifyingCode && !resetSuccess && !codeError && !verifiedEmail && !initialCode && (
          <div className="space-y-5">
            <div className="p-4 bg-[#f8f9fa] border border-[#c8ccd1] rounded-sm text-xs text-[#54595d] space-y-2">
              <div className="font-semibold text-[#101418] text-sm">
                No Reset Code Detected
              </div>
              <p className="leading-relaxed">
                To reset your password, please use the secure link sent to your registered email address, or paste your reset action code below.
              </p>
            </div>

            <form onSubmit={handleManualCodeVerify} className="space-y-3">
              <div>
                <label htmlFor="manual-code" className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5">
                  Reset Action Code (oobCode)
                </label>
                <input
                  id="manual-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste code from email..."
                  className="w-full text-xs px-3 py-2 border border-[#a2a9b1] rounded-sm focus:outline-none focus:border-[#3366cc]"
                />
              </div>

              <Button type="submit" variant="primary" size="md" className="w-full justify-center">
                Verify Code & Continue
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs text-[#3366cc] hover:underline cursor-pointer"
              >
                Need a new reset link? Click here &rarr;
              </button>
            </div>
          </div>
        )}

        {/* 5. Password Reset Form (Code is verified) */}
        {!verifyingCode && !resetSuccess && !codeError && (verifiedEmail || initialCode) && (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Verified Email Banner */}
            {verifiedEmail && (
              <div className="p-3 bg-[#f8f9fa] border border-[#c8ccd1] rounded-xs text-xs text-[#202122] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#3366cc]" />
                  <span>Resetting password for: <strong>{verifiedEmail}</strong></span>
                </div>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 bg-green-100 text-green-800 rounded-xs">
                  Verified
                </span>
              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div
                role="alert"
                className="p-3.5 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{submitError}</div>
              </div>
            )}

            {/* New Password */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
                  <Lock size={15} />
                </div>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  name="newPassword"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 characters)"
                  className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#a2a9b1] rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] transition-all"
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
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5 font-sans"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
                  <Lock size={15} />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className="w-full text-xs pl-9 pr-10 py-2.5 border border-[#a2a9b1] rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:outline-none focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#72777d] hover:text-[#101418] cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password Validation Checklist */}
            <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs text-[11px] space-y-1.5">
              <div className="font-semibold text-[#54595d] uppercase tracking-wider text-[10px]">
                Password Requirements:
              </div>
              <div className={`flex items-center gap-1.5 ${isLengthValid ? 'text-green-700' : 'text-[#72777d]'}`}>
                {isLengthValid ? <Check size={13} className="text-green-600" /> : <X size={13} />}
                <span>At least 6 characters in length</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isMatchValid ? 'text-green-700' : 'text-[#72777d]'}`}>
                {isMatchValid ? <Check size={13} className="text-green-600" /> : <X size={13} />}
                <span>New password and confirmation match</span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={submitting || !isLengthValid || !isMatchValid}
                className="w-full justify-center"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Updating Password in Firebase...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <KeyRound size={15} />
                    Reset Password
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
            onClick={() => navigate('/forgot-password')}
            className="text-[#72777d] hover:text-[#101418] cursor-pointer"
          >
            Request New Link
          </button>
        </div>
      </div>
    </div>
  );
};
