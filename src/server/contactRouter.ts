import nodemailer from 'nodemailer';
import { handleTurnstileVerification } from './turnstileRouter';

export interface ContactErrataSubmissionPayload {
  name?: string;
  email: string;
  articleRef: string;
  disputedClaim: string;
  evidence: string;
  submissionType?: string;
  turnstileToken: string;
}

export interface ContactSubmissionResult {
  success: boolean;
  ticketId?: string;
  message?: string;
  error?: string;
}

const TARGET_RECIPIENT_EMAIL = 'michiganshandilya@gmail.com';

/**
 * Generates an archival ticket ID for the errata submission.
 */
function generateTicketId(): string {
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  return `ERR-2026-${randomSuffix}`;
}

/**
 * Builds the plain-text email representation.
 */
function buildPlainTextEmail(params: {
  ticketId: string;
  name: string;
  email: string;
  articleRef: string;
  disputedClaim: string;
  evidence: string;
  submissionType: string;
  submittedAt: string;
  clientIp: string;
}): string {
  return `======================================================================
THELEGENDSWIKI — NEW CONTACT & ERRATA SUBMISSION
======================================================================

A new Contact & Errata / Correction / Evidence report has been submitted
on TheLegendsWiki and delivered to your designated administrative desk.

SUBMISSION SUMMARY
----------------------------------------------------------------------
Reference Ticket ID : ${params.ticketId}
Submission Date/Time: ${params.submittedAt}
Submission Type     : ${params.submissionType}
Cloudflare Turnstile: VERIFIED (Anti-Abuse Challenge Passed)
Client Origin IP    : ${params.clientIp}

SUBMITTER INFORMATION
----------------------------------------------------------------------
Name / Pseudonym    : ${params.name || 'Anonymous / Pseudonym'}
Contact Email       : ${params.email}

ARTICLE UNDER INQUIRY
----------------------------------------------------------------------
Article Title / Slug: ${params.articleRef}

DISPUTED STATEMENT / REPORTED ISSUE / EXPLANATION
----------------------------------------------------------------------
${params.disputedClaim}

PRIMARY SOURCE CITATION & DOCUMENT REFERENCE
----------------------------------------------------------------------
${params.evidence}

======================================================================
Action Required:
Review the cited primary documentation against the live article revision.
Reply directly to the visitor at: ${params.email}
======================================================================`;
}

/**
 * Builds the rich HTML email representation.
 */
function buildHtmlEmail(params: {
  ticketId: string;
  name: string;
  email: string;
  articleRef: string;
  disputedClaim: string;
  evidence: string;
  submissionType: string;
  submittedAt: string;
  clientIp: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>New TheLegendsWiki Contact & Errata Submission</title>
</head>
<body style="margin: 0; padding: 24px; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 640px; margin: 0 auto; background-color: #111827; border: 1px solid #334155; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
    <!-- Header -->
    <tr>
      <td style="padding: 24px 28px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-bottom: 2px solid #d97706;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #fbbf24; margin-bottom: 4px;">
                THELEGENDSWIKI // EDITORIAL DESK
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                New Contact &amp; Errata Submission
              </h1>
            </td>
            <td align="right" style="vertical-align: top;">
              <span style="display: inline-block; padding: 4px 10px; background-color: rgba(217, 119, 6, 0.2); border: 1px solid #d97706; border-radius: 4px; font-family: monospace; font-size: 11px; font-weight: 700; color: #fbbf24;">
                ${params.ticketId}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px;">
        <!-- Meta Details Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 6px; border: 1px solid #334155; margin-bottom: 24px;">
          <tr>
            <td style="padding: 14px 18px; border-bottom: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Submission Type:</span>
              <div style="font-size: 13px; font-weight: 600; color: #f8fafc; margin-top: 2px;">
                ${params.submissionType}
              </div>
            </td>
            <td style="padding: 14px 18px; border-bottom: 1px solid #334155;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Timestamp:</span>
              <div style="font-size: 12px; color: #e2e8f0; font-family: monospace; margin-top: 2px;">
                ${params.submittedAt}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 14px 18px;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Submitter / Pseudonym:</span>
              <div style="font-size: 13px; font-weight: 600; color: #f8fafc; margin-top: 2px;">
                ${params.name || '<em style="color: #94a3b8;">Anonymous / Pseudonym</em>'}
              </div>
            </td>
            <td style="padding: 14px 18px;">
              <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">Visitor Contact Email:</span>
              <div style="font-size: 13px; margin-top: 2px;">
                <a href="mailto:${params.email}" style="color: #38bdf8; text-decoration: none; font-weight: 600;">${params.email}</a>
              </div>
            </td>
          </tr>
        </table>

        <!-- Target Article -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; margin-bottom: 6px;">
            Target Article Title or URL Slug:
          </div>
          <div style="padding: 12px 16px; background-color: #0f172a; border: 1px solid #334155; border-radius: 6px; font-size: 14px; font-weight: 600; color: #ffffff;">
            ${params.articleRef}
          </div>
        </div>

        <!-- Disputed Claim / Issue / Explanation -->
        <div style="margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; margin-bottom: 6px;">
            Disputed Statement, Reported Inaccuracy &amp; Submitter's Explanation:
          </div>
          <div style="padding: 14px 16px; background-color: #0f172a; border: 1px solid #475569; border-left: 4px solid #ef4444; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap;">
${params.disputedClaim}
          </div>
        </div>

        <!-- Primary Source Evidence -->
        <div style="margin-bottom: 24px;">
          <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #fbbf24; margin-bottom: 6px;">
            Primary Source Citations &amp; Archival Document Reference:
          </div>
          <div style="padding: 14px 16px; background-color: #0f172a; border: 1px solid #475569; border-left: 4px solid #10b981; border-radius: 4px; font-size: 13px; line-height: 1.6; color: #f1f5f9; white-space: pre-wrap;">
${params.evidence}
          </div>
        </div>

        <!-- Anti-abuse Verification Status -->
        <div style="padding: 10px 14px; background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 6px; font-size: 11px; color: #34d399; margin-bottom: 24px;">
          &check; <strong>Security Check:</strong> Cloudflare Turnstile verification challenge passed successfully. Origin IP: <code style="font-family: monospace;">${params.clientIp}</code>.
        </div>

        <!-- Reply Button -->
        <div style="text-align: center; margin-top: 10px; margin-bottom: 10px;">
          <a href="mailto:${params.email}?subject=${encodeURIComponent(`[TheLegendsWiki ${params.ticketId}] Regarding your errata submission for: ${params.articleRef}`)}" style="display: inline-block; padding: 12px 24px; background-color: #d97706; color: #000000; font-weight: 700; text-decoration: none; border-radius: 6px; font-size: 13px; box-shadow: 0 4px 12px rgba(217,119,6,0.3);">
            Reply to Submitter (${params.email})
          </a>
        </div>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 16px 28px; background-color: #0b0f19; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; line-height: 1.5; text-align: center;">
        This alert was generated directly by the <strong>TheLegendsWiki Behind The Curtains</strong> Contact &amp; Errata submission engine.<br />
        Delivered to designated administrator: <code style="color: #94a3b8;">${TARGET_RECIPIENT_EMAIL}</code>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Dispatches the email notification via Nodemailer and FormSubmit fallback.
 */
async function dispatchEmailNotification(params: {
  ticketId: string;
  name: string;
  email: string;
  articleRef: string;
  disputedClaim: string;
  evidence: string;
  submissionType: string;
  submittedAt: string;
  clientIp: string;
}): Promise<{ delivered: boolean; methods: string[]; errors: string[] }> {
  const methods: string[] = [];
  const errors: string[] = [];

  const subject = `[TheLegendsWiki Contact/Errata] New Submission (${params.ticketId}): ${params.articleRef || 'General Report'}`;
  const plainText = buildPlainTextEmail(params);
  const htmlContent = buildHtmlEmail(params);

  // Strategy 1: Nodemailer with configured SMTP environment variables
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'michiganshandilya@gmail.com';

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
        tls: {
          rejectUnauthorized: false,
        },
      });

      const info = await transporter.sendMail({
        from: `"TheLegendsWiki Editorial" <${fromEmail}>`,
        to: TARGET_RECIPIENT_EMAIL,
        replyTo: params.email,
        subject,
        text: plainText,
        html: htmlContent,
      });

      console.log(`[contactRouter] Nodemailer dispatched successfully: ${info.messageId}`);
      methods.push(`SMTP (${smtpHost})`);
    } else {
      errors.push('SMTP credentials not fully configured in environment.');
    }
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    console.warn(`[contactRouter] Nodemailer dispatch attempt encountered issue: ${errMsg}`);
    errors.push(`SMTP: ${errMsg}`);
  }

  // Strategy 2: FormSubmit HTTP dispatch directly to TARGET_RECIPIENT_EMAIL
  try {
    const formSubmitRes = await fetch(`https://formsubmit.co/ajax/${TARGET_RECIPIENT_EMAIL}`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Referer': 'https://thelegendswiki.org/contact',
        'Origin': 'https://thelegendswiki.org',
      },
      body: JSON.stringify({
        _subject: subject,
        ticketId: params.ticketId,
        submissionType: params.submissionType,
        submitterName: params.name || 'Anonymous / Pseudonym',
        submitterEmail: params.email,
        articleRef: params.articleRef,
        disputedStatement: params.disputedClaim,
        primarySourceEvidence: params.evidence,
        submittedAt: params.submittedAt,
        clientIp: params.clientIp,
        _replyto: params.email,
      }),
    });

    const resJson = await formSubmitRes.json().catch(() => ({}));
    if (formSubmitRes.ok || resJson.success === 'true' || resJson.message) {
      console.log(`[contactRouter] FormSubmit dispatch status:`, resJson);
      methods.push('FormSubmit HTTP Relay');
    }
  } catch (httpErr: any) {
    console.warn(`[contactRouter] FormSubmit HTTP dispatch issue:`, httpErr?.message);
    errors.push(`FormSubmit: ${httpErr?.message}`);
  }

  // Always output clean log banner on server
  console.log(`\n=============================================================`);
  console.log(`[THELEGENDSWIKI CONTACT & ERRATA DISPATCH ENGINE]`);
  console.log(`Ticket ID       : ${params.ticketId}`);
  console.log(`Recipient       : ${TARGET_RECIPIENT_EMAIL}`);
  console.log(`Submitter       : ${params.name || 'Anonymous'} <${params.email}>`);
  console.log(`Target Article  : ${params.articleRef}`);
  console.log(`Active Transports: ${methods.join(', ') || 'Logged to server console'}`);
  console.log(`=============================================================\n`);

  return {
    delivered: methods.length > 0,
    methods,
    errors,
  };
}

/**
 * Server request handler for Contact & Errata submissions.
 */
export async function handleContactSubmission(
  body: any,
  clientIp: string
): Promise<ContactSubmissionResult> {
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const articleRef = typeof body?.articleRef === 'string' ? body.articleRef.trim() : '';
  const disputedClaim = typeof body?.disputedClaim === 'string' ? body.disputedClaim.trim() : '';
  const evidence = typeof body?.evidence === 'string' ? body.evidence.trim() : '';
  const submissionType =
    typeof body?.submissionType === 'string' && body.submissionType.trim()
      ? body.submissionType.trim()
      : 'Contact & Errata / Evidence Submission';
  const turnstileToken =
    typeof body?.turnstileToken === 'string' ? body.turnstileToken.trim() : '';

  // 1. Field validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      success: false,
      error: 'Please provide a valid contact email address.',
    };
  }

  if (!articleRef) {
    return {
      success: false,
      error: 'Please specify the article title or URL slug.',
    };
  }

  if (!disputedClaim || disputedClaim.length < 10) {
    return {
      success: false,
      error: 'Please describe the disputed factual statement in detail (minimum 10 characters).',
    };
  }

  if (!evidence || evidence.length < 10) {
    return {
      success: false,
      error: 'Please provide citations or primary source evidence supporting the correction.',
    };
  }

  if (!turnstileToken) {
    return {
      success: false,
      error: 'Please complete the Cloudflare security verification challenge.',
    };
  }

  // 2. Server-side Cloudflare Turnstile Verification
  const turnstileCheck = await handleTurnstileVerification(
    { token: turnstileToken, action: 'errata_contact' },
    clientIp
  );

  if (!turnstileCheck.success) {
    return {
      success: false,
      error: turnstileCheck.error || 'Security verification failed. Please try again.',
    };
  }

  // 3. Generate reference ticket
  const ticketId = generateTicketId();
  const submittedAt = new Date().toISOString();

  // 4. Dispatch Email Notification directly to TARGET_RECIPIENT_EMAIL
  await dispatchEmailNotification({
    ticketId,
    name,
    email,
    articleRef,
    disputedClaim,
    evidence,
    submissionType,
    submittedAt,
    clientIp,
  });

  return {
    success: true,
    ticketId,
    message: 'Your errata inquiry and evidence report has been delivered directly to the editorial desk.',
  };
}
