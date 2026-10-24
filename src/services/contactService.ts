export interface ContactErrataSubmissionData {
  name?: string;
  email: string;
  articleRef: string;
  disputedClaim: string;
  evidence: string;
  submissionType?: string;
  turnstileToken: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  ticketId?: string;
  message?: string;
  error?: string;
}

/**
 * Submits the Contact & Errata / Correction / Evidence report to the backend server,
 * which verifies Cloudflare Turnstile anti-abuse protection and dispatches the complete
 * report directly to michiganshandilya@gmail.com.
 */
export async function submitContactErrataForm(
  data: ContactErrataSubmissionData
): Promise<ContactSubmissionResponse> {
  try {
    const response = await fetch('/api/contact/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.success !== true) {
      return {
        success: false,
        error:
          result.error ||
          'Failed to submit errata notice to the editorial desk. Please try again.',
      };
    }

    return {
      success: true,
      ticketId: result.ticketId,
      message: result.message,
    };
  } catch (err: any) {
    return {
      success: false,
      error:
        err?.message ||
        'Network error while submitting errata notice. Please check your connection.',
    };
  }
}
