import React, { useState, useRef, useEffect } from 'react';
import { ConfirmationResult } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  X, 
  Shield, 
  Smartphone,
  KeyRound,
  Copy,
  Check,
} from 'lucide-react';
import { Button } from '../common/Button';

interface SocialAuthProvidersProps {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  disabled?: boolean;
}

export const SocialAuthProviders: React.FC<SocialAuthProvidersProps> = ({
  onSuccess,
  onError,
  disabled = false,
}) => {
  const { signInWithGoogle, signInWithApple, sendPhoneCode, verifyPhoneCode } = useAuth();
  const { navigate } = useRouter();

  const [activeProvider, setActiveProvider] = useState<'google' | 'apple' | 'phone' | null>(null);
  const [providerError, setProviderError] = useState<string | null>(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneStep, setPhoneStep] = useState<'number' | 'code'>('number');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const countdownIntervalRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startResendCountdown = () => {
    setCountdown(60);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleGoogleSignIn = async () => {
    if (disabled || activeProvider) return;
    setProviderError(null);
    setActiveProvider('google');

    try {
      const result = await signInWithGoogle();
      if (!result.success) {
        setProviderError(result.error || 'Google authentication could not be completed.');
        if (onError) onError(result.error || 'Google authentication failed.');
      } else {
        if (onSuccess) onSuccess();
        else navigate('/');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate with Google.';
      setProviderError(msg);
      if (onError) onError(msg);
    } finally {
      setActiveProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    if (disabled || activeProvider) return;
    setProviderError(null);
    setActiveProvider('apple');

    try {
      const result = await signInWithApple();
      if (!result.success) {
        setProviderError(result.error || 'Apple authentication could not be completed.');
        if (onError) onError(result.error || 'Apple authentication failed.');
      } else {
        if (onSuccess) onSuccess();
        else navigate('/');
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to authenticate with Apple.';
      setProviderError(msg);
      if (onError) onError(msg);
    } finally {
      setActiveProvider(null);
    }
  };

  const handleOpenPhoneModal = () => {
    if (disabled || activeProvider) return;
    setProviderError(null);
    setPhoneError(null);
    setPhoneStep('number');
    setVerificationCode('');
    setIsPhoneModalOpen(true);
  };

  const handleClosePhoneModal = () => {
    setIsPhoneModalOpen(false);
    setConfirmationResult(null);
    setPhoneError(null);
    setPhoneLoading(false);
    setPhoneStep('number');
  };

  const handleSendPhoneCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPhoneError(null);

    const cleanNumber = phoneNumber.trim();
    if (!cleanNumber) {
      setPhoneError('Please enter a valid phone number.');
      return;
    }

    if (!cleanNumber.startsWith('+')) {
      setPhoneError('Please include the country code prefix starting with "+" (e.g. +1 for US/Canada, +44 for UK, +91 for India).');
      return;
    }

    if (!recaptchaContainerRef.current) {
      setPhoneError('Anti-abuse reCAPTCHA component is initializing. Please try again.');
      return;
    }

    setPhoneLoading(true);
    try {
      const res = await sendPhoneCode(cleanNumber, recaptchaContainerRef.current);
      if (!res.success || !res.confirmationResult) {
        setPhoneError(res.error || 'Failed to send SMS code. Please verify the phone number.');
      } else {
        setConfirmationResult(res.confirmationResult);
        setPhoneStep('code');
        startResendCountdown();
      }
    } catch (err: any) {
      setPhoneError(err?.message || 'An unexpected error occurred while sending SMS code.');
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setPhoneError('Session expired. Please request a new SMS verification code.');
      setPhoneStep('number');
      return;
    }

    const cleanCode = verificationCode.trim().replace(/\D/g, '');
    if (!cleanCode || cleanCode.length < 4) {
      setPhoneError('Please enter the verification code received via SMS.');
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);

    try {
      const res = await verifyPhoneCode(confirmationResult, cleanCode);
      if (!res.success) {
        setPhoneError(res.error || 'Invalid or expired verification code.');
      } else {
        handleClosePhoneModal();
        if (onSuccess) onSuccess();
        else navigate('/');
      }
    } catch (err: any) {
      setPhoneError(err?.message || 'Verification failed. Please retry.');
    } finally {
      setPhoneLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Provider-level Error Alert */}
      {providerError && (
        <div
          className={`p-3.5 rounded-sm text-xs border space-y-2.5 ${
            providerError.toLowerCase().includes('authorized domain')
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle
              size={15}
              className={
                providerError.toLowerCase().includes('authorized domain')
                  ? 'text-amber-700 shrink-0 mt-0.5'
                  : 'text-red-600 shrink-0 mt-0.5'
              }
            />
            <div className="flex-1 leading-relaxed">{providerError}</div>
          </div>

          {providerError.toLowerCase().includes('authorized domain') && typeof window !== 'undefined' && (
            <div className="bg-white p-3 border border-amber-200 rounded-sm space-y-2">
              <div className="text-[11px] font-semibold text-amber-900 flex items-center justify-between gap-2">
                <span>Current Web Domain:</span>
                <button
                  type="button"
                  onClick={() => {
                    if (navigator?.clipboard) {
                      navigator.clipboard.writeText(window.location.hostname);
                      setCopiedDomain(true);
                      setTimeout(() => setCopiedDomain(false), 2500);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-[#3366cc] hover:underline cursor-pointer font-sans"
                >
                  {copiedDomain ? (
                    <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                      <Check size={12} /> Copied!
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Copy size={12} /> Copy Domain
                    </span>
                  )}
                </button>
              </div>
              <div className="font-mono text-[11px] bg-[#f8f9fa] p-1.5 border border-[#eaecf0] rounded-xs text-[#101418] break-all select-all">
                {window.location.hostname}
              </div>
              <p className="text-[11px] text-[#54595d] leading-relaxed">
                Tip: You can continue signing in immediately with Email/Password or Phone below while configuring OAuth domains in Firebase Console.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Hidden container for Firebase invisible reCAPTCHA */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} className="hidden" />

      {/* Providers Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Google Provider Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={disabled || !!activeProvider}
          className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 bg-[#ffffff] border border-[#a2a9b1] hover:border-[#72777d] hover:bg-[#f8f9fa] active:bg-[#eaecf0] rounded-sm text-xs font-semibold text-[#202122] transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sign in securely using your Google account"
        >
          {activeProvider === 'google' ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#3366cc]/30 border-t-[#3366cc] animate-spin shrink-0" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{activeProvider === 'google' ? 'Connecting...' : 'Google'}</span>
        </button>

        {/* Apple Provider Button */}
        <button
          type="button"
          onClick={handleAppleSignIn}
          disabled={disabled || !!activeProvider}
          className="flex items-center justify-center gap-2.5 px-3.5 py-2.5 bg-[#ffffff] border border-[#a2a9b1] hover:border-[#72777d] hover:bg-[#f8f9fa] active:bg-[#eaecf0] rounded-sm text-xs font-semibold text-[#202122] transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sign in securely using Apple ID"
        >
          {activeProvider === 'apple' ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-[#101418]/30 border-t-[#101418] animate-spin shrink-0" />
          ) : (
            <svg className="w-4 h-4 shrink-0 fill-current text-black" viewBox="0 0 170 170">
              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.69-7.86-12-14.45-5.99-9.13-10.76-19.46-14.33-30.98-3.56-11.53-5.34-22.38-5.34-32.56 0-14.35 3.56-26.11 10.68-35.29 7.12-9.17 16.03-13.88 26.73-14.12 4.47 0 9.48 1.15 15.02 3.44 5.54 2.29 9.3 3.51 11.28 3.65 1.52-.14 5.48-1.42 11.87-3.83 6.39-2.41 11.75-3.48 16.08-3.21 11.97.64 21.48 5.17 28.52 13.58-10.45 6.32-15.54 15.02-15.28 26.1.25 8.7 3.54 15.99 9.87 21.89 6.33 5.9 13.79 9.24 22.38 10.02-2.18 6.52-4.8 12.87-7.85 19.06zM119.22 31.84c0-7.38 2.65-14.28 7.95-20.7 5.3-6.42 11.76-10.37 19.38-11.14.65 1.09.98 2.18.98 3.27 0 7.39-2.77 14.4-8.31 21.03-5.54 6.63-12.16 10.45-19.86 11.46-.14-1.3-.14-2.61-.14-3.92z" />
            </svg>
          )}
          <span>{activeProvider === 'apple' ? 'Connecting...' : 'Apple'}</span>
        </button>

        {/* Phone Provider Button */}
        <button
          type="button"
          onClick={handleOpenPhoneModal}
          disabled={disabled || !!activeProvider}
          className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-[#ffffff] border border-[#a2a9b1] hover:border-[#72777d] hover:bg-[#f8f9fa] active:bg-[#eaecf0] rounded-sm text-xs font-semibold text-[#202122] transition-colors shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sign in with SMS phone verification"
        >
          <Phone size={14} className="text-[#3366cc] shrink-0" />
          <span>Phone</span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-[#eaecf0]"></div>
        <span className="flex-shrink mx-3 text-[10px] font-semibold uppercase tracking-wider text-[#72777d] bg-white px-1">
          Or continue with email
        </span>
        <div className="flex-grow border-t border-[#eaecf0]"></div>
      </div>

      {/* Phone Authentication Modal */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div 
            className="bg-white border border-[#a2a9b1] rounded-sm shadow-xl max-w-md w-full p-6 space-y-5 relative"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-modal-title"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleClosePhoneModal}
              disabled={phoneLoading}
              className="absolute top-4 right-4 text-[#72777d] hover:text-[#101418] p-1 rounded-sm cursor-pointer transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#eaecf0] pb-3">
              <div className="w-8 h-8 rounded-sm bg-blue-50 border border-blue-200 text-[#3366cc] flex items-center justify-center shrink-0">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 id="phone-modal-title" className="text-base font-bold text-[#101418] font-serif">
                  Phone Authentication
                </h3>
                <p className="text-xs text-[#54595d]">
                  {phoneStep === 'number'
                    ? 'Enter your mobile number to receive a verification SMS'
                    : `Enter the 6-digit code sent to ${phoneNumber}`}
                </p>
              </div>
            </div>

            {/* Error in modal */}
            {phoneError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed space-y-1">
                  <div className="font-semibold">SMS Dispatch Notice:</div>
                  <div>{phoneError}</div>
                  {phoneError.includes('Blaze') && (
                    <div className="mt-2 p-2 bg-white border border-red-200 rounded-xs font-mono text-[10px] text-red-900">
                      Tip: You can configure test phone numbers in Firebase Console &rarr; Authentication &rarr; Sign-in method &rarr; Phone &rarr; "Phone numbers for testing" (e.g. +1 650-555-3434 / 123456) to test without real SMS charges.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Phone Number Input */}
            {phoneStep === 'number' && (
              <form onSubmit={handleSendPhoneCode} className="space-y-4">
                <div>
                  <label 
                    htmlFor="phone-number-input"
                    className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5"
                  >
                    Mobile Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
                      <Phone size={14} />
                    </div>
                    <input
                      id="phone-number-input"
                      type="tel"
                      autoComplete="tel"
                      autoFocus
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full text-xs pl-9 pr-3 py-2.5 border border-[#a2a9b1] rounded-sm bg-[#ffffff] text-[#202122] placeholder:text-[#72777d] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-[#72777d] mt-1.5 leading-normal">
                    Format: Must include country code prefix (e.g. <span className="font-mono text-[#3366cc]">+1</span> for US/Canada, <span className="font-mono text-[#3366cc]">+44</span> for UK).
                  </p>
                </div>

                <div className="p-2.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm flex items-start gap-2 text-xs text-[#54595d]">
                  <Shield size={14} className="text-[#3366cc] shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-tight">
                    Standard SMS rates may apply. A 6-digit confirmation code will be dispatched to your handset.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleClosePhoneModal}
                    disabled={phoneLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={phoneLoading || !phoneNumber.trim()}
                  >
                    {phoneLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Dispatching SMS...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        Send Verification Code <ArrowRight size={13} />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Verification Code Input */}
            {phoneStep === 'code' && (
              <form onSubmit={handleVerifyPhoneCode} className="space-y-4">
                <div>
                  <label 
                    htmlFor="verification-code-input"
                    className="block text-xs font-semibold text-[#54595d] uppercase tracking-wider mb-1.5"
                  >
                    6-Digit SMS Verification Code
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#72777d]">
                      <KeyRound size={14} />
                    </div>
                    <input
                      id="verification-code-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      autoFocus
                      required
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full text-sm pl-9 pr-3 py-2.5 border border-[#a2a9b1] rounded-sm bg-[#ffffff] text-[#202122] tracking-widest placeholder:tracking-normal placeholder:text-[#72777d] focus:border-[#3366cc] focus:ring-1 focus:ring-[#3366cc] focus:outline-none transition-all font-mono text-center font-bold"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#54595d] mt-2">
                    <button
                      type="button"
                      onClick={() => setPhoneStep('number')}
                      className="text-[#3366cc] hover:underline cursor-pointer"
                    >
                      Change phone number
                    </button>
                    {countdown > 0 ? (
                      <span className="text-[#72777d]">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSendPhoneCode()}
                        disabled={phoneLoading}
                        className="text-[#3366cc] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={11} /> Resend SMS Code
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setPhoneStep('number')}
                    disabled={phoneLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={phoneLoading || verificationCode.trim().length < 4}
                  >
                    {phoneLoading ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Verifying Code...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 size={13} />
                        Verify & Sign In
                      </span>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
