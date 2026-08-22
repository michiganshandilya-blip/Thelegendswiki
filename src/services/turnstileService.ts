/**
 * Client-Side Turnstile Verification Service
 *
 * Sends the client-generated Turnstile response token to the server endpoint
 * (/api/verify-turnstile) for server-to-server validation with Cloudflare's API.
 */

export interface TurnstileVerificationResult {
  success: boolean;
  error?: string;
  challenge_ts?: string;
}

/**
 * Verifies a Turnstile response token on the backend.
 *
 * @param token - The response token obtained from the Turnstile widget callback.
 * @param action - Optional action descriptor (e.g. 'signup', 'login', 'password_reset', 'contribution', 'contact').
 */
export async function verifyTurnstileTokenOnServer(
  token: string,
  action?: string
): Promise<TurnstileVerificationResult> {
  const cleanToken = (token || '').trim();
  if (!cleanToken) {
    return {
      success: false,
      error: 'Please complete the security verification challenge.',
    };
  }

  try {
    const res = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: cleanToken,
        action,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success !== true) {
      return {
        success: false,
        error:
          data.error ||
          'Security verification failed. Please complete the challenge again.',
      };
    }

    return {
      success: true,
      challenge_ts: data.challenge_ts,
    };
  } catch (err: any) {
    console.error('Turnstile verification request failed:', err);
    return {
      success: false,
      error:
        'Security verification failed due to network connection. Please check your connection and try again.',
    };
  }
}
