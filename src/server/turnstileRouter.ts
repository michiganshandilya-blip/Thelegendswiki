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
 * - Sanitized user-facing error reporting without internal leakage
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

// Clean up expired tokens periodically every 2 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, timestamp] of verifiedTokensCache.entries()) {
    if (now - timestamp > 5 * 60 * 1000) {
      verifiedTokensCache.delete(token);
    }
  }
}, 2 * 60 * 1000);

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

  // 3. Replay attack prevention: Token must not have been already verified
  if (verifiedTokensCache.has(token)) {
    return {
      success: false,
      error: 'This security verification token has already been used. Please complete a new challenge.',
    };
  }

  // 4. Retrieve secret key from server environment
  // Cloudflare provides a public test secret '1x00000000000000000000000000000000AA' that always passes for development
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY ||
    '1x00000000000000000000000000000000AA';

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (clientIp && clientIp !== 'local' && clientIp !== '127.0.0.1') {
      formData.append('remoteip', clientIp);
    }

    const cfResponse = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      }
    );

    if (!cfResponse.ok) {
      console.error(
        `[Turnstile] Cloudflare endpoint returned status ${cfResponse.status}`
      );
      return {
        success: false,
        error: 'Security verification service is temporarily unavailable. Please try again.',
      };
    }

    const data: any = await cfResponse.json();

    if (data.success === true) {
      // Mark token as consumed to prevent replay attacks
      verifiedTokensCache.set(token, Date.now());

      return {
        success: true,
        challenge_ts: data.challenge_ts,
        hostname: data.hostname,
      };
    }

    // Verification failed on Cloudflare's end
    const errorCodes = Array.isArray(data['error-codes'])
      ? data['error-codes'].join(', ')
      : 'invalid-token';
    console.warn(`[Turnstile] Verification failed with codes: ${errorCodes}`);

    return {
      success: false,
      error: 'Security verification failed. Please complete the challenge again.',
    };
  } catch (err: any) {
    console.error('[Turnstile] Server exception during verification:', err);
    return {
      success: false,
      error: 'Security verification failed due to a network error. Please try again.',
    };
  }
}
