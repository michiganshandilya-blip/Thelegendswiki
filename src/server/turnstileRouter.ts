/**
 * Server-Side Cloudflare Turnstile Verification Handler
 *
 * Validates Turnstile challenge tokens with Cloudflare's official verification API:
 * https://challenges.cloudflare.com/turnstile/v0/siteverify
 *
 * Enforces:
 * - Single-use token validation & short-lived replay protection
 * - Server-side secret key protection (never exposed to client)
 * - In-memory IP rate limiting
 * - Fail-closed error handling (no bypass on error, timeout, or invalid token)
 * - Strict environment isolation (no test/dummy token bypass in production)
 */

interface TurnstileVerifyRequest {
  token: string;
  action?: string;
  cdata?: string;
}

interface TurnstileVerifyResponse {
  success: boolean;
  error?: string;
  challenge_ts?: string;
  hostname?: string;
}

// In-memory replay prevention cache: stores token hashes / values for 5 minutes
const verifiedTokensCache = new Map<string, number>();

// Clean up expired tokens periodically every 2 minutes (unreferenced so it does not hold the Node process open during build)
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of verifiedTokensCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      verifiedTokensCache.delete(token);
    }
  }
}, 2 * 60 * 1000);
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

// In-memory rate limiting per client IP (max 60 verification requests / minute)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 60;

  const current = rateLimitMap.get(clientIp);
  if (!current || now > current.resetTime) {
    rateLimitMap.set(clientIp, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count += 1;
  return true;
}

const CF_TEST_SECRET = '1x0000000000000000000000000000000AA';

/**
 * Validates a Turnstile token server-side.
 */
export async function handleTurnstileVerification(
  body: TurnstileVerifyRequest,
  clientIp: string
): Promise<TurnstileVerifyResponse> {
  // 1. Check IP rate limit
  if (!checkRateLimit(clientIp)) {
    return {
      success: false,
      error: 'Too many verification attempts. Please wait a moment and try again.',
    };
  }

  const token = (body?.token || '').trim();

  // 2. Validate token presence
  if (!token) {
    return {
      success: false,
      error: 'Security verification token is required. Please complete the security challenge.',
    };
  }

  // 3. Environment & Secret Resolution
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredSecret = (process.env.TURNSTILE_SECRET_KEY || '').trim();

  // In production, enforce that a real, valid production secret is configured.
  // Never silently fall back to test secrets in production.
  const isInvalidProdSecret =
    !configuredSecret ||
    configuredSecret === CF_TEST_SECRET ||
    configuredSecret.startsWith('1x00000000000000000000') ||
    configuredSecret === 'MY_TURNSTILE_SECRET_KEY' ||
    configuredSecret === 'YOUR_TURNSTILE_SECRET_KEY';

  if (isProduction && isInvalidProdSecret) {
    console.error('[Turnstile] Production configuration error: TURNSTILE_SECRET_KEY is missing or invalid.');
    return {
      success: false,
      error: 'Security verification service is not properly configured. Please contact support.',
    };
  }

  // 4. Test Environment Mock Token Handling (Strictly isolated from Production)
  // NEVER allow test or dummy tokens in production under any circumstances.
  // In non-production, only accept an explicit mock token if explicitly enabled for testing.
  const isExplicitTestMode =
    !isProduction &&
    (process.env.NODE_ENV === 'test' || process.env.ALLOW_TURNSTILE_TEST_TOKENS === 'true');
  if (isExplicitTestMode && token === 'XXXX.DUMMY.TOKEN.XXXX') {
    return {
      success: true,
      challenge_ts: new Date().toISOString(),
      hostname: 'test-environment',
    };
  }

  // 5. Replay Attack Prevention: Token must not have been already verified
  if (verifiedTokensCache.has(token)) {
    return {
      success: false,
      error: 'This security verification token has already been used. Please complete a new challenge.',
    };
  }

  // Determine secret to use for Cloudflare API call
  // In production: must use the configured secret.
  // In development: use configured secret if present, or official Cloudflare test secret for local testing.
  const secretKey = isProduction ? configuredSecret : (configuredSecret || CF_TEST_SECRET);

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp && clientIp !== 'local' && clientIp !== '127.0.0.1' && clientIp !== '::1') {
      formData.append('remoteip', clientIp);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let cfRes: Response;
    try {
      cfRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    let parsed: any;
    try {
      parsed = await cfRes.json();
    } catch (parseErr: any) {
      console.error('[Turnstile] Upstream returned non-JSON response:', parseErr?.message);
      return {
        success: false,
        error: 'Security verification service returned an invalid response. Please retry.',
      };
    }

    // Fail closed: reject if HTTP call failed or Cloudflare indicates success: false
    if (!cfRes.ok || parsed?.success !== true) {
      const errorCodes: string[] = Array.isArray(parsed?.['error-codes'])
        ? parsed['error-codes']
        : [];

      // If Cloudflare explicitly indicates token was already consumed or expired
      if (errorCodes.includes('timeout-or-duplicate')) {
        verifiedTokensCache.set(token, Date.now());
        return {
          success: false,
          error: 'This security verification token has expired or already been used. Please complete a new challenge.',
        };
      }

      return {
        success: false,
        error: 'Security verification failed. Please complete the challenge again.',
      };
    }

    // Verification succeeded: record token in replay cache
    verifiedTokensCache.set(token, Date.now());
    return {
      success: true,
      challenge_ts: parsed.challenge_ts || new Date().toISOString(),
      hostname: parsed.hostname,
    };
  } catch (err: any) {
    // Fail closed on upstream network errors, timeouts, or aborts
    console.error(
      '[Turnstile] Upstream verification request failed:',
      err?.name === 'AbortError' ? 'Timeout' : err?.message || 'Network error'
    );
    return {
      success: false,
      error: 'Security verification service is temporarily unavailable. Please wait a moment and retry.',
    };
  }
}

/**
 * Convenience helper for validating a Turnstile token.
 */
export async function validateTurnstileToken(
  token: string,
  clientIp: string = 'local'
): Promise<TurnstileVerifyResponse> {
  return handleTurnstileVerification({ token }, clientIp);
}
