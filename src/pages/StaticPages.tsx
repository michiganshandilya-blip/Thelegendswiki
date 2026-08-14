import React from 'react';
import { useRouter } from '../context/RouterContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Mail, CheckCircle2, Shield, FileText } from 'lucide-react';

interface StaticPageProps {
  page: 'about' | 'contact' | 'privacy' | 'terms';
}

export const StaticPages: React.FC<StaticPageProps> = ({ page }) => {
  const { navigate } = useRouter();

  if (page === 'about') {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'About TheLegendsWiki' }]} />

        <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40">
          <header className="border-b border-slate-800 pb-4">
            <div className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest mb-1">
              Project Statement & Philosophy
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100 leading-tight">
              About TheLegendsWiki
            </h1>
            <p className="text-xs text-slate-400 mt-1 italic font-mono">
              Tagline: Explore. Learn. Discover.
            </p>
          </header>

          <div className="encyclopedia-article-body space-y-4 text-sm text-slate-300 leading-relaxed">
            <p>
              <strong className="text-slate-100 font-semibold">TheLegendsWiki</strong> is a high-performance digital knowledge archive created to organize, document, and preserve human achievements, historical milestones, scientific breakthroughs, cultural artifacts, and significant figures.
            </p>

            <h2 className="font-display text-lg font-bold text-slate-100 border-b border-slate-800 pb-1 mt-6 mb-2">
              Editorial Principles
            </h2>
            <p className="text-slate-300">
              Inspired by the depth of classical encyclopedias and the precision of modern archival systems, our design eliminates distracting marketing noise, autoplay media, and bloated visual elements in favor of dark ergonomics, crisp monospace telemetry, and verifiable references.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4 not-prose">
              <div className="p-3.5 bg-[#141c2e] border border-slate-700/60 rounded-sm text-xs">
                <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5 font-display">
                  <CheckCircle2 size={14} className="text-sky-400" />
                  Neutral Point of View
                </div>
                <p className="text-slate-400">Articles strive for verifiable factuality and scholarly balance.</p>
              </div>
              <div className="p-3.5 bg-[#141c2e] border border-slate-700/60 rounded-sm text-xs">
                <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5 font-display">
                  <CheckCircle2 size={14} className="text-sky-400" />
                  Open Accessibility
                </div>
                <p className="text-slate-400">Knowledge formatted for speed, readability, and all screen sizes.</p>
              </div>
              <div className="p-3.5 bg-[#141c2e] border border-slate-700/60 rounded-sm text-xs">
                <div className="font-bold text-slate-100 mb-1 flex items-center gap-1.5 font-display">
                  <CheckCircle2 size={14} className="text-sky-400" />
                  Structured Citations
                </div>
                <p className="text-slate-400">Every factual assertion is backed by scholarly attribution.</p>
              </div>
            </div>

            <h2 className="font-display text-lg font-bold text-slate-100 border-b border-slate-800 pb-1 mt-6 mb-2">
              Architecture & Vision
            </h2>
            <p className="text-slate-300">
              The platform is architected systematically in phases, presenting a clean dark tech encyclopedia interface with desktop navigation sidebar, quick query suggestion pills, structured category browsing, and scholarly citations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'contact') {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Contact Editorial Desk' }]} />

        <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 sm:p-8 space-y-6 shadow-xl shadow-black/40">
          <header className="border-b border-slate-800 pb-4">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
              Contact & Inquiries
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Reach the editorial coordination team and archive maintainers.
            </p>
          </header>

          <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <div className="p-4 bg-[#141c2e] border border-slate-700/60 rounded-sm space-y-2">
              <div className="font-bold text-slate-100 flex items-center gap-1.5 font-display">
                <Mail size={14} className="text-sky-400" />
                <span>Editorial Desk</span>
              </div>
              <p className="text-slate-400">
                For editorial inquiries, errata corrections, or citation submissions:
                <br />
                <span className="font-mono text-sky-400">editor@thelegendswiki.org</span>
              </p>
            </div>

            <div className="p-4 bg-[#141c2e] border border-slate-700/60 rounded-sm space-y-2">
              <div className="font-bold text-slate-100 font-display">Community Support</div>
              <p className="text-slate-400">
                For technical issues, bug reports, and navigation questions:
                <br />
                <span className="font-mono text-sky-400">support@thelegendswiki.org</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === 'privacy') {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />

        <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 sm:p-8 space-y-4 text-sm text-slate-300 leading-relaxed shadow-xl shadow-black/40">
          <header className="border-b border-slate-800 pb-3 flex items-center gap-2">
            <Shield size={20} className="text-sky-400" />
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
              Privacy Policy
            </h1>
          </header>
          <p>
            TheLegendsWiki respects user privacy. As an open knowledge repository, we collect minimal data necessary to deliver educational content and manage revision tracking.
          </p>
          <h2 className="font-display text-base font-bold text-slate-100 pt-2">1. Information We Collect</h2>
          <p className="text-slate-400">
            We do not sell personal data or track browsing across third-party networks. Client interactions and read counts are aggregated to compile reading recommendations and popular entry listings.
          </p>
          <h2 className="font-display text-base font-bold text-slate-100 pt-2">2. Local State Storage</h2>
          <p className="text-slate-400">
            Preferences such as search histories or article reading configurations are stored locally on your device where applicable.
          </p>
        </div>
      </div>
    );
  }

  // Terms of Use
  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: 'Terms of Use' }]} />

      <div className="bg-[#0e1422] border border-slate-800 rounded-sm p-6 sm:p-8 space-y-4 text-sm text-slate-300 leading-relaxed shadow-xl shadow-black/40">
        <header className="border-b border-slate-800 pb-3 flex items-center gap-2">
          <FileText size={20} className="text-sky-400" />
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-100">
            Terms of Use
          </h1>
        </header>
        <p>
          Welcome to TheLegendsWiki. By accessing or using this encyclopedia platform, you agree to comply with our community and editorial standards.
        </p>
        <h2 className="font-display text-base font-bold text-slate-100 pt-2">1. Open Content License</h2>
        <p className="text-slate-400">
          All text and curated knowledge records are provided for educational and non-commercial research purposes under the Open Documentation Framework.
        </p>
        <h2 className="font-display text-base font-bold text-slate-100 pt-2">2. Attribution & Accuracy</h2>
        <p className="text-slate-400">
          While contributors strive for accuracy, users are encouraged to cross-reference primary citations provided at the bottom of each article.
        </p>
      </div>
    </div>
  );
};
