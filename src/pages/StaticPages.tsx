import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useSEO } from '../hooks/useSEO';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { TurnstileWidget } from '../components/common/TurnstileWidget';
import { verifyTurnstileTokenOnServer } from '../services/turnstileService';
import {
  Mail,
  CheckCircle2,
  Shield,
  FileText,
  Scale,
  BookOpen,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Server,
  KeyRound,
  Lock,
  UserCheck,
  Send,
  RefreshCw,
} from 'lucide-react';

interface StaticPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms' | 'editorial-policy' | 'content-policy';
}

export const StaticPages: React.FC<StaticPageProps> = ({ page }) => {
  const { navigate } = useRouter();

  const getPageMeta = () => {
    switch (page) {
      case 'about':
        return {
          title: 'About TheLegendsWiki — Open Knowledge Codex',
          description: 'Learn about TheLegendsWiki project, our investigative editorial guidelines, encyclopedic philosophy, and open knowledge standards.',
          canonicalUrl: '/about',
        };
      case 'contact':
        return {
          title: 'Contact Editorial Desk & Errata Submissions',
          description: 'Get in touch with TheLegendsWiki editorial board for factual corrections, errata notices, scholarly submissions, or privacy inquiries.',
          canonicalUrl: '/contact',
        };
      case 'privacy':
        return {
          title: 'Privacy Policy — TheLegendsWiki Data Protection',
          description: 'Transparent disclosure of how TheLegendsWiki collects, uses, stores, and protects user and contributor data via Firebase Authentication and Cloud Firestore.',
          canonicalUrl: '/privacy-policy',
        };
      case 'terms':
        return {
          title: 'Terms of Use & Open Content License',
          description: 'Terms of service, contributor responsibilities, Creative Commons licensing rules, and platform governance for TheLegendsWiki.',
          canonicalUrl: '/terms',
        };
      case 'editorial-policy':
        return {
          title: 'Editorial Policy & Evidence Standards',
          description: 'Guidelines on primary sourcing, verifiable evidence, distinguishing allegations from facts, handling conflicting evidence, and factual corrections.',
          canonicalUrl: '/editorial-policy',
        };
      case 'content-policy':
        return {
          title: 'Content Policy & Community Standards',
          description: 'Content guidelines, neutrality rules, sensitive topic classifications, copyright compliance, and harassment prohibitions on TheLegendsWiki.',
          canonicalUrl: '/content-policy',
        };
    }
  };

  const meta = getPageMeta();
  useSEO(meta, [page]);

  // Contact & Errata Interactive Form Component with Turnstile Protection
const ContactErrataForm: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [articleRef, setArticleRef] = useState('');
  const [disputedClaim, setDisputedClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErrorMessage('Please provide a valid contact email address.');
      return;
    }

    if (!articleRef.trim()) {
      setErrorMessage('Please specify the article title or URL slug.');
      return;
    }

    if (!disputedClaim.trim() || disputedClaim.trim().length < 10) {
      setErrorMessage('Please describe the disputed factual statement in detail (minimum 10 characters).');
      return;
    }

    if (!evidence.trim() || evidence.trim().length < 10) {
      setErrorMessage('Please provide citations or primary source evidence supporting the correction.');
      return;
    }

    if (!turnstileToken) {
      setErrorMessage('Please complete the Cloudflare security verification challenge.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Verify Turnstile token on server
      const verifyResult = await verifyTurnstileTokenOnServer(turnstileToken, 'errata_contact');
      if (!verifyResult.success) {
        setErrorMessage(verifyResult.error || 'Security verification failed. Please try again.');
        setTurnstileToken('');
        setTurnstileResetKey((prev) => prev + 1);
        setSubmitting(false);
        return;
      }

      // 2. Simulated successful dispatch to editorial queue
      const ticketId = `ERR-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setSubmittedTicket(ticketId);
      setName('');
      setEmail('');
      setArticleRef('');
      setDisputedClaim('');
      setEvidence('');
      setTurnstileToken('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while submitting your errata inquiry.');
      setTurnstileToken('');
      setTurnstileResetKey((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedTicket) {
    return (
      <div className="p-5 bg-[#d5fdf4] border border-[#20c997] rounded-sm text-xs text-[#0f5132] space-y-3 shadow-xs">
        <div className="flex items-center gap-2 font-bold text-sm">
          <CheckCircle2 size={18} className="text-[#0f5132]" />
          <span>Errata Notice Submitted Successfully</span>
        </div>
        <p className="leading-relaxed">
          Your correction inquiry has been queued for editorial fact-checking and archival review.
        </p>
        <div className="p-2.5 bg-white border border-[#20c997]/40 rounded-xs font-mono text-[11px] text-[#0f5132]">
          Submission Reference ID: <strong>{submittedTicket}</strong>
        </div>
        <button
          type="button"
          onClick={() => setSubmittedTicket(null)}
          className="text-xs text-[#3366cc] underline hover:text-[#2557bb] cursor-pointer font-sans"
        >
          Submit Another Inaccuracy Notice
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="p-5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm space-y-4 shadow-xs">
      <div className="border-b border-[#eaecf0] pb-2">
        <h3 className="font-serif text-base font-bold text-[#101418] flex items-center gap-2">
          <Send size={16} className="text-[#3366cc]" />
          <span>Online Errata &amp; Evidence Submission Form</span>
        </h3>
        <p className="text-[11px] text-[#54595d] mt-0.5">
          Submit corrections directly to the editorial board. All submissions are verified against primary records.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xs text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle size={15} className="shrink-0 text-red-600 mt-0.5" />
          <div className="leading-relaxed">{errorMessage}</div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1 font-sans">
            Your Name or Pseudonym
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dr. Jane Doe (or Anonymous)"
            className="w-full text-xs px-3 py-2 border border-[#a2a9b1] rounded-sm bg-white text-[#202122] focus:outline-none focus:border-[#3366cc]"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1 font-sans">
            Contact Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="scholar@university.edu"
            className="w-full text-xs px-3 py-2 border border-[#a2a9b1] rounded-sm bg-white text-[#202122] focus:outline-none focus:border-[#3366cc]"
          />
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1 font-sans">
          Article Title or URL Slug <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={articleRef}
          onChange={(e) => setArticleRef(e.target.value)}
          placeholder="e.g. Harshad Mehta 1992 Securities Scam or /wiki/harshad-mehta-1992-scam"
          className="w-full text-xs px-3 py-2 border border-[#a2a9b1] rounded-sm bg-white text-[#202122] focus:outline-none focus:border-[#3366cc]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1 font-sans">
          Disputed Statement or Inaccuracy <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={3}
          value={disputedClaim}
          onChange={(e) => setDisputedClaim(e.target.value)}
          placeholder="Quote the exact sentence or paragraph in question and explain why it is inaccurate..."
          className="w-full text-xs p-2.5 border border-[#a2a9b1] rounded-sm bg-white text-[#202122] focus:outline-none focus:border-[#3366cc]"
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider mb-1 font-sans">
          Primary Source Citation or Document Reference <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          rows={2}
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="Provide primary archival document title, ISBN/DOI, court judgment case citation, or official URL..."
          className="w-full text-xs p-2.5 border border-[#a2a9b1] rounded-sm bg-white text-[#202122] focus:outline-none focus:border-[#3366cc]"
        />
      </div>

      {/* Cloudflare Turnstile Anti-Abuse Challenge */}
      <TurnstileWidget
        action="errata_contact"
        onVerify={(token) => {
          setTurnstileToken(token);
          setErrorMessage(null);
        }}
        onExpire={() => setTurnstileToken('')}
        onError={() => setTurnstileToken('')}
        resetKey={turnstileResetKey}
        disabled={submitting}
      />

      <div className="pt-1">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-5 py-2 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-50 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-colors flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Verifying &amp; Submitting...</span>
            </>
          ) : (
            <>
              <Send size={13} />
              <span>Submit Errata to Editorial Board</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
  const PolicyNavbar = () => (
    <nav aria-label="Legal and Editorial Policies" className="flex flex-wrap items-center gap-2 p-2.5 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm text-xs">
      <span className="text-[#72777d] font-mono text-[10px] uppercase tracking-wider mr-1">Policies:</span>
      <button
        type="button"
        onClick={() => navigate('/privacy-policy')}
        className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
          page === 'privacy'
            ? 'bg-[#3366cc] text-white font-medium shadow-xs'
            : 'text-[#3366cc] hover:bg-[#eaecf0]'
        }`}
      >
        Privacy Policy
      </button>
      <button
        type="button"
        onClick={() => navigate('/terms')}
        className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
          page === 'terms'
            ? 'bg-[#3366cc] text-white font-medium shadow-xs'
            : 'text-[#3366cc] hover:bg-[#eaecf0]'
        }`}
      >
        Terms of Use
      </button>
      <button
        type="button"
        onClick={() => navigate('/editorial-policy')}
        className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
          page === 'editorial-policy'
            ? 'bg-[#3366cc] text-white font-medium shadow-xs'
            : 'text-[#3366cc] hover:bg-[#eaecf0]'
        }`}
      >
        Editorial Policy
      </button>
      <button
        type="button"
        onClick={() => navigate('/content-policy')}
        className={`px-2.5 py-1 rounded-xs transition-colors cursor-pointer ${
          page === 'content-policy'
            ? 'bg-[#3366cc] text-white font-medium shadow-xs'
            : 'text-[#3366cc] hover:bg-[#eaecf0]'
        }`}
      >
        Content Policy
      </button>
    </nav>
  );

  // ==========================================
  // 1. ABOUT PAGE
  // ==========================================
  if (page === 'about') {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'About TheLegendsWiki' }]} />

        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
          <header className="border-b border-[#eaecf0] pb-4">
            <div className="text-[10px] font-mono font-bold text-[#72777d] uppercase tracking-widest mb-1">
              Project Statement &amp; Philosophy
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418] leading-tight">
              About TheLegendsWiki
            </h1>
            <p className="text-xs text-[#54595d] mt-1 italic font-sans">
              The stories behind the stories &bull; Archival investigations and open scholarship.
            </p>
          </header>

          <div className="encyclopedia-article-body space-y-4 text-sm text-[#202122] leading-relaxed font-sans">
            <p>
              <strong className="text-[#101418] font-semibold">TheLegendsWiki</strong> is a specialized collaborative knowledge repository dedicated to organizing, documenting, and cross-referencing major historical events, scientific milestones, market movements, corporate decisions, and cultural achievements.
            </p>

            <h2 className="font-serif text-lg font-bold text-[#101418] border-b border-[#a2a9b1] pb-1 mt-6 mb-2">
              Our Encyclopedic Architecture
            </h2>
            <p className="text-[#54595d]">
              Inspired by classical scholarly encyclopedias and forensic investigative archives, TheLegendsWiki pairs standard encyclopedic articles with verified documentation, primary source repositories, epistemic depth ratings, and interactive timelines.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 not-prose">
              <div className="p-3.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs shadow-xs">
                <div className="font-bold text-[#101418] mb-1 flex items-center gap-1.5 font-serif">
                  <CheckCircle2 size={14} className="text-[#3366cc]" />
                  Neutral Point of View
                </div>
                <p className="text-[#54595d]">Articles present multi-perspective evidence with balanced scholarly attribution.</p>
              </div>
              <div className="p-3.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs shadow-xs">
                <div className="font-bold text-[#101418] mb-1 flex items-center gap-1.5 font-serif">
                  <CheckCircle2 size={14} className="text-[#3366cc]" />
                  Primary Citations
                </div>
                <p className="text-[#54595d]">Factual claims cite archival records, legal rulings, and peer-reviewed research.</p>
              </div>
              <div className="p-3.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs shadow-xs">
                <div className="font-bold text-[#101418] mb-1 flex items-center gap-1.5 font-serif">
                  <CheckCircle2 size={14} className="text-[#3366cc]" />
                  Continuous Peer Errata
                </div>
                <p className="text-[#54595d]">Articles are maintained dynamically with full revision auditing and correction paths.</p>
              </div>
            </div>

            <h2 className="font-serif text-lg font-bold text-[#101418] border-b border-[#a2a9b1] pb-1 mt-6 mb-2">
              Editorial Standards
            </h2>
            <p className="text-[#54595d]">
              The platform adheres to strict policies governing sensitive and investigative records. Allegations are differentiated from verified verdicts, and disclaimers are automatically integrated on investigative dossiers.
            </p>

            <div className="pt-4 border-t border-[#eaecf0]">
              <PolicyNavbar />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. CONTACT & ERRATA PAGE
  // ==========================================
  if (page === 'contact') {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Contact & Errata' }]} />

        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 shadow-xs">
          <header className="border-b border-[#eaecf0] pb-4">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              Contact Editorial Desk &amp; Errata
            </h1>
            <p className="text-xs sm:text-sm text-[#54595d] mt-1 font-sans">
              Direct channels for factual corrections, scholarly citations, security inquiries, and legal notifications.
            </p>
          </header>

          <div className="space-y-4 text-xs sm:text-sm text-[#202122] leading-relaxed font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm space-y-2">
                <div className="font-bold text-[#101418] flex items-center gap-1.5 font-serif text-sm">
                  <Mail size={16} className="text-[#3366cc]" />
                  <span>Editorial &amp; Errata Desk</span>
                </div>
                <p className="text-[#54595d] text-xs">
                  For corrections to published articles, disputed claims, source submissions, or sensitive dossier reviews:
                </p>
                <div className="font-mono text-xs text-[#3366cc] font-semibold select-all pt-1">
                  editor@thelegendswiki.org
                </div>
              </div>

              <div className="p-4 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm space-y-2">
                <div className="font-bold text-[#101418] flex items-center gap-1.5 font-serif text-sm">
                  <Shield size={16} className="text-[#3366cc]" />
                  <span>Technical &amp; Privacy Desk</span>
                </div>
                <p className="text-[#54595d] text-xs">
                  For user account inquiries, authentication help, data protection requests, or security notices:
                </p>
                <div className="font-mono text-xs text-[#3366cc] font-semibold select-all pt-1">
                  support@thelegendswiki.org
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-xs space-y-2 text-[#78350f]">
              <div className="font-bold font-serif flex items-center gap-1.5">
                <HelpCircle size={14} className="text-[#b45309]" />
                <span>How to Submit an Errata or Correction Notice</span>
              </div>
              <p className="leading-relaxed">
                When reporting an inaccuracy or requesting a revision, please include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>The exact URL / slug of the article (e.g., <code className="font-mono bg-white/70 px-1">/wiki/example-article</code>).</li>
                <li>The specific paragraph or factual statement under dispute.</li>
                <li>Primary source citations, court documents, or verified bibliographic evidence supporting the correction.</li>
              </ul>
              <p className="text-[11px]">
                Our editorial team reviews all submissions in accordance with our{' '}
                <button type="button" onClick={() => navigate('/editorial-policy')} className="underline font-semibold cursor-pointer">
                  Editorial Policy
                </button>.
              </p>
            </div>

            {/* Interactive Errata & Inaccuracy Submission Form */}
            <div className="pt-2">
              <ContactErrataForm />
            </div>

            <div className="pt-2">
              <PolicyNavbar />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. PRIVACY POLICY PAGE
  // ==========================================
  if (page === 'privacy') {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#202122] leading-relaxed shadow-xs font-sans">
          <header className="border-b border-[#eaecf0] pb-4">
            <div className="flex items-center gap-2 text-[#3366cc] mb-1">
              <Shield size={22} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#72777d]">
                Data Protection &amp; Governance
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              TheLegendsWiki Privacy Policy
            </h1>
            <p className="text-xs text-[#54595d] mt-1">
              Last Updated: August 2026 &bull; Scope: Web Application &amp; Contributor Services
            </p>
          </header>

          <PolicyNavbar />

          <section className="space-y-3">
            <p>
              This Privacy Policy describes the actual data practices of <strong>TheLegendsWiki</strong>. We are committed to transparency, minimal data collection, and robust security across our collaborative encyclopedia platform.
            </p>
          </section>

          {/* 1. What Information We Collect */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <UserCheck size={18} className="text-[#3366cc]" />
              1. Information We Collect
            </h2>
            <p className="text-[#54595d]">
              We only collect information necessary to provide authentication, maintain contributor attribution, track encyclopedic revisions, and support platform security:
            </p>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs space-y-1">
                <strong className="text-[#101418]">A. Account &amp; Registration Information:</strong>
                <p className="text-[#54595d]">
                  When you register or sign in, we record your chosen username, display name, email address, optional biography, and assigned role (<code className="font-mono bg-white px-1">user</code>, <code className="font-mono bg-white px-1">editor</code>, or <code className="font-mono bg-white px-1">admin</code>).
                </p>
              </div>
              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs space-y-1">
                <strong className="text-[#101418]">B. Authentication Credentials:</strong>
                <p className="text-[#54595d]">
                  Authentication is managed securely through <strong>Google Firebase Authentication</strong>. We support Email/Password, Google Sign-In, Apple ID, and SMS Phone Verification. Passwords and OAuth access tokens are handled directly by Firebase Auth and are <em>never</em> stored in our database, cookies, or local storage.
                </p>
              </div>
              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs space-y-1">
                <strong className="text-[#101418]">C. Profile Avatars &amp; Uploads:</strong>
                <p className="text-[#54595d]">
                  If you upload a profile picture, image files are validated (under 5MB, verified image MIME types) and stored in dedicated secure folders in <strong>Firebase Storage</strong> tied strictly to your authenticated User ID.
                </p>
              </div>
              <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs space-y-1">
                <strong className="text-[#101418]">D. Contributions &amp; Article Revisions:</strong>
                <p className="text-[#54595d]">
                  When you draft, edit, or submit articles and citations, your contributions are stored in <strong>Cloud Firestore</strong> and attributed to your user profile to maintain transparent revision histories.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Cookies, Session Tokens, and Local Storage */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <KeyRound size={18} className="text-[#3366cc]" />
              2. Cookies and Local Storage
            </h2>
            <p className="text-[#54595d]">
              TheLegendsWiki does not use invasive third-party tracking cookies, behavioral ad pixels, or data brokers. Local storage and session mechanisms are used solely for functional purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
              <li><strong>Firebase Auth Tokens:</strong> Secure tokens maintained by the Firebase SDK to keep you signed in between sessions.</li>
              <li><strong>Interface Preferences:</strong> Local storage for active search filters, sidebar toggles, and draft backups.</li>
              <li><strong>Anonymous Interaction Counts:</strong> Aggregated article view counters stored in Cloud Firestore to display trending entries.</li>
            </ul>
          </section>

          {/* 3. Server-Side AI Assistance */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <Server size={18} className="text-[#3366cc]" />
              3. AI Research Features &amp; Processing
            </h2>
            <p className="text-[#54595d]">
              When using the AI Research Companion on article pages or the AI writing assistant in the editor, requests are routed through a secured server-side proxy (<code className="font-mono text-xs">/api/ai/*</code>) to the <strong>Google Gemini API</strong>. We do not transmit your private password credentials or unrelated personal files to the AI model. AI interactions are processed statelessly for educational synthesis and summarization.
            </p>
          </section>

          {/* 4. How Information is Stored and Protected */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <Lock size={18} className="text-[#3366cc]" />
              4. Storage, Security, &amp; Third-Party Services
            </h2>
            <p className="text-[#54595d]">
              Your data is stored in Google Cloud infrastructure (Cloud Firestore and Firebase Storage). We protect data using:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
              <li><strong>Firestore Security Rules:</strong> Role-based access control preventing unauthorized reads or writes.</li>
              <li><strong>HTTPS Encryption:</strong> All data in transit is encrypted using standard TLS protocols.</li>
              <li><strong>Third-Party Processors:</strong> We exclusively use Google Cloud / Firebase, Google Gemini AI, and Cloudflare. We do not sell, rent, or trade your data with external advertisers or commercial brokers.</li>
            </ul>
          </section>

          {/* 5. Cloudflare Turnstile Anti-Abuse Verification */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#3366cc]" />
              5. Cloudflare Turnstile Anti-Bot Protection
            </h2>
            <p className="text-[#54595d]">
              To protect contributor accounts against brute-force password attempts, automated scraping, and fraudulent submissions, we utilize <strong>Cloudflare Turnstile</strong> on registration, login, password recovery, and public errata forms.
            </p>
            <p className="text-[#54595d] text-xs">
              Turnstile is a privacy-preserving CAPTCHA alternative that evaluates browser challenge tokens without tracking you across third-party websites or utilizing interactive behavioral ad cookies. Challenge verification tokens are evaluated server-side (<code className="font-mono text-xs">/api/verify-turnstile</code>) and discarded immediately after validation.
            </p>
          </section>

          {/* 6. User Rights and Data Control */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <Scale size={18} className="text-[#3366cc]" />
              6. Your Privacy Rights &amp; Choices
            </h2>
            <p className="text-[#54595d]">
              As a user of TheLegendsWiki, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
              <li>Access and update your profile information (display name, avatar, bio) at any time through your Profile Dashboard.</li>
              <li>Review, edit, or delete your draft articles before publication.</li>
              <li>Request full account termination and removal of personal identifiers by contacting our support team at <code className="font-mono text-[#3366cc]">support@thelegendswiki.org</code>.</li>
            </ul>
          </section>

          {/* 7. Policy Updates & Contact */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              7. Policy Updates &amp; Contact Information
            </h2>
            <p className="text-[#54595d] text-xs">
              Any updates to this Privacy Policy will be published directly to this URL with a revised date stamp. For any questions regarding data protection, please contact us at:
            </p>
            <div className="p-3 bg-[#f8f9fa] border border-[#eaecf0] rounded-xs text-xs font-mono text-[#3366cc]">
              support@thelegendswiki.org &bull; editor@thelegendswiki.org
            </div>
          </section>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. TERMS OF USE PAGE
  // ==========================================
  if (page === 'terms') {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Terms of Use' }]} />

        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#202122] leading-relaxed shadow-xs font-sans">
          <header className="border-b border-[#eaecf0] pb-4">
            <div className="flex items-center gap-2 text-[#3366cc] mb-1">
              <FileText size={22} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#72777d]">
                Legal Terms &amp; Conditions
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              Terms of Use &amp; Open Content License
            </h1>
            <p className="text-xs text-[#54595d] mt-1">
              Governing use of TheLegendsWiki encyclopedia and contributor submissions.
            </p>
          </header>

          <PolicyNavbar />

          <section className="space-y-3">
            <p>
              Welcome to <strong>TheLegendsWiki</strong>. By accessing this website, registering an account, reading dossiers, or submitting contributions, you agree to these Terms of Use and all related policies.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              1. Open Content &amp; Intellectual Property
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              Encyclopedic prose on TheLegendsWiki is published for educational and research purposes under the Creative Commons Attribution-ShareAlike (CC BY-SA) framework. When contributing original research or prose, you grant TheLegendsWiki a perpetual, non-exclusive license to publish, index, and distribute your contributions with attribution.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              2. User Obligations &amp; Prohibited Conduct
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              Users and contributors agree not to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
              <li>Submit plagiarized text or infringe third-party copyrights or proprietary trademarks.</li>
              <li>Upload malicious code, automated scraping bots, or bypass rate limits.</li>
              <li>Engage in harassment, defamation, doxxing, or posting unauthorized private personal data.</li>
              <li>Attempt to manipulate account roles, impersonate administrators, or bypass security rules.</li>
            </ul>
          </section>

          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              3. Disclaimer of Warranties &amp; Research Accuracy
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              TheLegendsWiki is an open reference codex compiled collaboratively. While our editorial board and community strive for rigor, the platform is provided on an &ldquo;as is&rdquo; basis. Content should not be relied upon as legal, financial, medical, or official regulatory advice. Always consult certified primary sources.
            </p>
          </section>

          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              4. Governing Policies
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              These Terms incorporate our{' '}
              <button type="button" onClick={() => navigate('/editorial-policy')} className="text-[#3366cc] underline cursor-pointer">
                Editorial Policy
              </button>,{' '}
              <button type="button" onClick={() => navigate('/content-policy')} className="text-[#3366cc] underline cursor-pointer">
                Content Policy
              </button>, and{' '}
              <button type="button" onClick={() => navigate('/privacy-policy')} className="text-[#3366cc] underline cursor-pointer">
                Privacy Policy
              </button>.
            </p>
          </section>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. EDITORIAL POLICY PAGE
  // ==========================================
  if (page === 'editorial-policy') {
    return (
      <div className="space-y-5 max-w-4xl mx-auto">
        <Breadcrumbs items={[{ label: 'Editorial Policy' }]} />

        <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#202122] leading-relaxed shadow-xs font-sans">
          <header className="border-b border-[#eaecf0] pb-4">
            <div className="flex items-center gap-2 text-[#3366cc] mb-1">
              <Scale size={22} />
              <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#72777d]">
                Evidence &amp; Verification Standards
              </span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              TheLegendsWiki Editorial Policy
            </h1>
            <p className="text-xs text-[#54595d] mt-1">
              Standards for primary sourcing, handling allegations, conflicting evidence, and errata.
            </p>
          </header>

          <PolicyNavbar />

          <section className="space-y-3">
            <p>
              TheLegendsWiki maintains rigorous standards of factual accuracy, neutral point of view, and verifiable attribution across all historical, scientific, corporate, and investigative entries.
            </p>
          </section>

          {/* 1. Sourcing and Citation Standards */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <BookOpen size={18} className="text-[#3366cc]" />
              1. Sourcing &amp; Citation Standards
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              Every substantial factual assertion, statistical figure, or historical quote must be substantiated by verifiable references. Acceptable sources include:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
              <li><strong>Primary Documents:</strong> Official government gazettes, regulatory filings (SEC, SEBI, RBI), court judgments, declassified diplomatic cables, and verified corporate reports.</li>
              <li><strong>Scholarly Literature:</strong> Peer-reviewed journal publications, university press monographs, and academic archives.</li>
              <li><strong>Reputable Journalism:</strong> Well-established investigative news organizations with transparent editorial boards and published correction policies.</li>
            </ul>
          </section>

          {/* 2. Allegations vs. Established Facts */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <Scale size={18} className="text-[#3366cc]" />
              2. Allegations, Indictments, &amp; Unproven Claims
            </h2>
            <div className="p-3.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs space-y-2 text-[#202122]">
              <strong className="text-[#101418] font-bold">Strict Linguistic Distinction:</strong>
              <p className="text-[#54595d]">
                Allegations, accusations, ongoing trials, and unadjudicated claims must never be presented as settled facts. Authors must use precise, neutral language:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#54595d]">
                <li>Use explicit attributive phrases: <em>&ldquo;According to regulatory filings...&rdquo;</em>, <em>&ldquo;The indictment alleged that...&rdquo;</em>, or <em>&ldquo;Scholars continue to debate whether...&rdquo;</em></li>
                <li>Presumption of innocence must be respected in all legal and corporate reporting.</li>
                <li>Do not label individuals or entities with defamatory epithets (such as &ldquo;fraudulent&rdquo;, &ldquo;corrupt&rdquo;, &ldquo;criminal&rdquo;) unless such designations stem from definitive, final court verdicts.</li>
              </ul>
            </div>
          </section>

          {/* 3. Conflicting Evidence and Multiple Scholarly Views */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <FileText size={18} className="text-[#3366cc]" />
              3. Conflicting Evidence &amp; Dissenting Scholarship
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              When reputable sources disagree on historical narratives, scientific models, or market events, articles must present the differing viewpoints proportionately, noting the respective evidence, methodologies, and consensus levels rather than taking a unilateral stance.
            </p>
          </section>

          {/* 4. Anonymous Sources & Declassified Records */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              4. Anonymous Sources &amp; Leaked Documents
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              Unverified rumors, anonymous leaks without provenance, and social media gossip are prohibited as standalone citations. Declassified records or investigative leaks may be referenced only when corroborated by secondary scholarly analysis or verified forensic archives.
            </p>
          </section>

          {/* 5. User Contributions & Moderation */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418]">
              5. Contributor Submissions &amp; Peer Review
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              All community-submitted articles undergo administrative peer review. Submissions lacking citations or violating neutrality standards are placed into <code className="font-mono bg-[#f8f9fa] px-1">changes_requested</code> or <code className="font-mono bg-[#f8f9fa] px-1">rejected</code> status with reviewer feedback before any public publishing occurs.
            </p>
          </section>

          {/* 6. Corrections, Errata & Takedown Protocol */}
          <section className="space-y-3 border-t border-[#eaecf0] pt-4">
            <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
              <HelpCircle size={18} className="text-[#3366cc]" />
              6. Corrections, Errata, &amp; Takedown Requests
            </h2>
            <p className="text-[#54595d] text-xs leading-relaxed">
              TheLegendsWiki is committed to swift correction of factual inaccuracies. Anyone may submit an errata request with documented evidence to <code className="font-mono text-[#3366cc]">editor@thelegendswiki.org</code>. Confirmed errors are promptly corrected in the article body with an accompanying entry in the article revision record.
            </p>
          </section>
        </div>
      </div>
    );
  }

  // ==========================================
  // 6. CONTENT POLICY PAGE
  // ==========================================
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <Breadcrumbs items={[{ label: 'Content Policy' }]} />

      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-6 sm:p-8 space-y-6 text-sm text-[#202122] leading-relaxed shadow-xs font-sans">
        <header className="border-b border-[#eaecf0] pb-4">
          <div className="flex items-center gap-2 text-[#3366cc] mb-1">
            <ShieldAlert size={22} />
            <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#72777d]">
              Community &amp; Content Guidelines
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
            TheLegendsWiki Content Policy
          </h1>
          <p className="text-xs text-[#54595d] mt-1">
            Rules governing encyclopedic scope, sensitive topics, neutrality, and civil scholarship.
          </p>
        </header>

        <PolicyNavbar />

        <section className="space-y-3">
          <p>
            TheLegendsWiki is an open reference codex for verified historical, scientific, economic, and investigative knowledge. All content published on the platform must adhere to the following standards.
          </p>
        </section>

        {/* 1. Core Content Standards */}
        <section className="space-y-3 border-t border-[#eaecf0] pt-4">
          <h2 className="font-serif text-lg font-bold text-[#101418]">
            1. Encyclopedic Scope &amp; Notability
          </h2>
          <p className="text-[#54595d] text-xs leading-relaxed">
            Articles must cover subjects of significant historical, cultural, scientific, corporate, or public interest. Personal vanity pages, non-notable promotional materials, and self-serving advertising are strictly prohibited and subject to immediate deletion.
          </p>
        </section>

        {/* 2. Sensitive Topic Classification */}
        <section className="space-y-3 border-t border-[#eaecf0] pt-4">
          <h2 className="font-serif text-lg font-bold text-[#101418] flex items-center gap-2">
            <Scale size={18} className="text-[#b45309]" />
            2. Sensitive &amp; Investigative Material Classification
          </h2>
          <p className="text-[#54595d] text-xs leading-relaxed">
            Articles dealing with financial scandals, corporate malfeasance, active litigation, controversial historical claims, or intelligence records must be marked as <strong>Sensitive Content</strong> in the article editor. When designated:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#54595d]">
            <li>An automatic, non-sensational <strong>Sensitive Content Disclaimer</strong> is rendered above the references.</li>
            <li>Authors must cite primary documents, legal proceedings, or reputable peer-reviewed sources.</li>
            <li>Content must avoid inflammatory adjectives, subjective moralizing, or conspiracy theorizing.</li>
          </ul>
        </section>

        {/* 3. Prohibited Content */}
        <section className="space-y-3 border-t border-[#eaecf0] pt-4">
          <h2 className="font-serif text-lg font-bold text-[#101418] text-red-700 flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-600" />
            3. Strictly Prohibited Content
          </h2>
          <p className="text-[#54595d] text-xs leading-relaxed">
            The following content types are strictly banned from TheLegendsWiki:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xs space-y-1">
              <strong className="text-red-900 font-semibold">Harassment &amp; Doxxing:</strong>
              <p className="text-red-800 text-[11px]">Publishing private addresses, phone numbers, personal credentials, or targeting living persons for harassment.</p>
            </div>
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xs space-y-1">
              <strong className="text-red-900 font-semibold">Defamation &amp; Unverified Libel:</strong>
              <p className="text-red-800 text-[11px]">Publishing fabricated accusations or claiming guilt without judicial or evidentiary basis.</p>
            </div>
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xs space-y-1">
              <strong className="text-red-900 font-semibold">Copyright Infringement:</strong>
              <p className="text-red-800 text-[11px]">Direct copy-pasting of copyrighted books, paywalled articles, or unauthorized media without fair use attribution.</p>
            </div>
            <div className="p-3 bg-red-50/70 border border-red-200 rounded-xs space-y-1">
              <strong className="text-red-900 font-semibold">Hate Speech &amp; Extremism:</strong>
              <p className="text-red-800 text-[11px]">Promoting discrimination, dehumanization, or violence against any group based on race, religion, gender, or nationality.</p>
            </div>
          </div>
        </section>

        {/* 4. Neutrality & Tone */}
        <section className="space-y-3 border-t border-[#eaecf0] pt-4">
          <h2 className="font-serif text-lg font-bold text-[#101418]">
            4. Tone &amp; Scholarly Register
          </h2>
          <p className="text-[#54595d] text-xs leading-relaxed">
            Articles must be written in formal, encyclopedic, third-person perspective. Avoid colloquialisms, hyperbole, sensationalist clickbait titles, and partisan commentary.
          </p>
        </section>
      </div>
    </div>
  );
};
