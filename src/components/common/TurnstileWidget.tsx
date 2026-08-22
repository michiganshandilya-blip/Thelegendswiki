import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          cData?: string;
          callback?: (token: string) => void;
          'error-callback'?: (errorCode?: string) => void;
          'expired-callback'?: () => void;
          'timeout-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact' | 'flexible';
          tabindex?: number;
          'response-field'?: boolean;
          'response-field-name'?: string;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
    onTurnstileLoaded?: () => void;
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error?: string) => void;
  onExpire?: () => void;
  onTimeout?: () => void;
  action?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact' | 'flexible';
  className?: string;
  resetKey?: number | string;
  disabled?: boolean;
}

// Default to official Cloudflare test sitekey for "Always Passes" if not configured
const DEFAULT_SITE_KEY = '1x00000000000000000000AA';

export const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
  onError,
  onExpire,
  onTimeout,
  action,
  theme = 'light',
  size = 'normal',
  className = '',
  resetKey,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isScriptReady, setIsScriptReady] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const siteKey =
    ((import.meta as any).env?.VITE_TURNSTILE_SITE_KEY as string) || DEFAULT_SITE_KEY;

  // Load Cloudflare Turnstile script dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.turnstile) {
      setIsScriptReady(true);
      return;
    }

    const scriptId = 'cloudflare-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src =
        'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsScriptReady(true);
      };

      script.onerror = () => {
        setLoadError(
          'Security challenge script failed to load. Please disable ad-blockers or check your connection.'
        );
        onError?.('Script failed to load');
      };

      document.head.appendChild(script);
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          setIsScriptReady(true);
          clearInterval(checkInterval);
        }
      }, 100);

      return () => clearInterval(checkInterval);
    }
  }, [onError]);

  // Render Turnstile widget once script is ready
  useEffect(() => {
    if (!isScriptReady || !containerRef.current || !window.turnstile) return;

    // Clean up any existing widget instance in this container
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore removal error
      }
      widgetIdRef.current = null;
    }

    setIsVerified(false);

    try {
      const id = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: theme as 'light' | 'dark' | 'auto',
        size: size as 'normal' | 'compact' | 'flexible',
        callback: (token: string) => {
          setIsVerified(true);
          setLoadError(null);
          onVerify(token);
        },
        'error-callback': (code?: string) => {
          setIsVerified(false);
          setLoadError('Verification challenge error. Please click to retry.');
          onError?.(code || 'Verification error');
        },
        'expired-callback': () => {
          setIsVerified(false);
          onExpire?.();
        },
        'timeout-callback': () => {
          setIsVerified(false);
          onTimeout?.();
        },
      });

      widgetIdRef.current = id;
    } catch (err: any) {
      console.error('Failed to render Turnstile widget:', err);
      setLoadError('Failed to initialize security verification.');
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [isScriptReady, siteKey, action, theme, size, resetKey]);

  const handleManualRetry = () => {
    setLoadError(null);
    setIsVerified(false);
    if (widgetIdRef.current && window.turnstile) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div
      aria-label="Security Verification"
      className={`p-3 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs text-[#202122] space-y-2 ${className} ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#eaecf0] pb-1.5">
        <span className="font-semibold text-[11px] uppercase tracking-wide text-[#54595d] flex items-center gap-1.5 font-sans">
          <ShieldCheck
            size={13}
            className={isVerified ? 'text-emerald-600' : 'text-[#3366cc]'}
          />
          <span>Security Verification</span>
        </span>
        <span className="text-[10px] font-mono text-[#72777d]">
          Cloudflare Turnstile
        </span>
      </div>

      {loadError ? (
        <div className="p-2 bg-red-50 border border-red-200 rounded-xs text-[11px] text-red-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0 text-red-600" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={handleManualRetry}
            className="text-[#3366cc] hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
          >
            <RefreshCw size={11} /> Retry
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[65px] pt-1">
          <div ref={containerRef} className="turnstile-container" />
          {!isScriptReady && (
            <div className="text-[11px] text-[#72777d] flex items-center gap-1.5 py-2">
              <span className="w-3 h-3 rounded-full border-2 border-[#3366cc]/30 border-t-[#3366cc] animate-spin" />
              <span>Loading anti-bot verification...</span>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-[#72777d] text-center leading-tight">
        Protected against automated scraping and brute-force abuse.
      </p>
    </div>
  );
};
