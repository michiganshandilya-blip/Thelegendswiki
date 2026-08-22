import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { useSEO } from '../hooks/useSEO';
import { getSitemapEntries, generateSitemapXml, SitemapEntry } from '../services/sitemapService';
import {
  FileCode,
  Globe,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';

export const SitemapPage: React.FC = () => {
  const { navigate } = useRouter();
  const [entries, setEntries] = useState<SitemapEntry[]>([]);
  const [xmlContent, setXmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'visual' | 'xml'>('visual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useSEO({
    title: 'XML Sitemap & Index Registry',
    description: 'Complete XML sitemap and search engine directory for TheLegendsWiki. Explore indexed encyclopedia articles, disciplines, and pages.',
    canonicalUrl: '/sitemap.xml',
    ogType: 'website',
  });

  const loadSitemap = async () => {
    setLoading(true);
    try {
      const [allEntries, xml] = await Promise.all([
        getSitemapEntries(),
        generateSitemapXml(),
      ]);
      setEntries(allEntries);
      setXmlContent(xml);
    } catch (err) {
      console.error('Failed to load sitemap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSitemap();
  }, []);

  const handleCopyXml = () => {
    if (!xmlContent) return;
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadXml = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.loc.toLowerCase().includes(q) ||
      (entry.title && entry.title.toLowerCase().includes(q)) ||
      (entry.category && entry.category.toLowerCase().includes(q))
    );
  });

  const articleCount = entries.filter((e) => e.loc.includes('/wiki/')).length;
  const categoryCount = entries.filter((e) => e.loc.includes('/category/')).length;

  return (
    <div id="sitemap-page" className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* 1. BREADCRUMBS */}
      <Breadcrumbs items={[{ label: 'System & Index' }, { label: 'Sitemap Index' }]} />

      {/* 2. HEADER */}
      <header className="border-b border-[#a2a9b1] pb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#f0f6ff] text-[#3366cc] border border-blue-200 rounded-sm flex items-center justify-center">
              <Globe size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#101418]">
                Search Engine Sitemap &amp; Index
              </h1>
              <p className="text-xs text-[#54595d] font-sans mt-0.5">
                Standardized sitemap protocol (sitemaps.org 0.9) with automated image discovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyXml}
              icon={copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            >
              {copied ? 'Copied XML' : 'Copy XML'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadXml}
              icon={<Download size={13} />}
            >
              Download sitemap.xml
            </Button>
          </div>
        </div>

        {/* Sitemap Metrics Strip */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[#54595d] pt-2 font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f8f9fa] border border-[#cbd5e1] rounded-xs text-[#202122]">
            <ShieldCheck size={12} className="text-emerald-600" />
            <span>Public Crawl Allowed</span>
          </span>
          <span>&bull;</span>
          <span>Total URLs: <strong className="text-[#101418]">{entries.length}</strong></span>
          <span>&bull;</span>
          <span>Articles: <strong className="text-[#3366cc]">{articleCount}</strong></span>
          <span>&bull;</span>
          <span>Categories: <strong className="text-[#3366cc]">{categoryCount}</strong></span>
        </div>
      </header>

      {/* 3. TABS & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f8f9fa] p-3 border border-[#cbd5e1] rounded-sm">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-[#ffffff] p-0.5 border border-[#cbd5e1] rounded-sm text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1 font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'bg-[#3366cc] text-white font-semibold'
                : 'text-[#54595d] hover:text-[#101418]'
            }`}
          >
            <Layers size={13} />
            <span>Visual Registry ({filteredEntries.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('xml')}
            className={`px-3 py-1 font-medium rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'xml'
                ? 'bg-[#3366cc] text-white font-semibold'
                : 'text-[#54595d] hover:text-[#101418]'
            }`}
          >
            <FileCode size={13} />
            <span>Raw XML Source</span>
          </button>
        </div>

        {/* Filter Input */}
        {activeTab === 'visual' && (
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#72777d]" />
            <input
              type="text"
              placeholder="Search indexed URLs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#ffffff] border border-[#a2a9b1] rounded-sm text-[#202122] focus:outline-none focus:border-[#3366cc]"
            />
          </div>
        )}
      </div>

      {/* 4. CONTENT DISPLAY */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#54595d] space-y-2">
          <RefreshCw size={20} className="animate-spin mx-auto text-[#3366cc]" />
          <p>Compiling live search engine sitemap...</p>
        </div>
      ) : activeTab === 'visual' ? (
        <div className="border border-[#cbd5e1] rounded-sm overflow-hidden bg-[#ffffff] shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-[#cbd5e1] text-[#54595d] font-mono text-[11px]">
                  <th className="py-2.5 px-4 font-semibold">Indexed URL &amp; Page Title</th>
                  <th className="py-2.5 px-3 font-semibold">Type / Category</th>
                  <th className="py-2.5 px-3 font-semibold">Change Freq</th>
                  <th className="py-2.5 px-3 font-semibold">Priority</th>
                  <th className="py-2.5 px-3 font-semibold">Last Modified</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaecf0]">
                {filteredEntries.map((entry, index) => {
                  const isWiki = entry.loc.includes('/wiki/');
                  const isCat = entry.loc.includes('/category/');
                  const path = entry.loc.replace(/^https?:\/\/[^/]+/, '') || '/';

                  return (
                    <tr key={index} className="hover:bg-[#f8f9fa] transition-colors">
                      <td className="py-2.5 px-4 max-w-sm">
                        <div className="font-medium text-[#101418] truncate font-serif text-sm">
                          {entry.title || path}
                        </div>
                        <div className="text-[11px] font-mono text-[#3366cc] truncate">
                          {entry.loc}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-[#54595d]">
                        {isWiki ? (
                          <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-[#3366cc] rounded-xs border border-blue-200 text-[10px] uppercase font-bold">
                            {entry.category || 'Article'}
                          </span>
                        ) : isCat ? (
                          <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded-xs border border-amber-200 text-[10px] uppercase font-bold">
                            Discipline
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-xs border border-slate-200 text-[10px] uppercase font-bold">
                            System
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#54595d]">
                        {entry.changefreq}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#202122] font-semibold">
                        {entry.priority.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#72777d]">
                        {entry.lastmod || 'Live'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate(path)}
                          className="text-[#3366cc] hover:underline inline-flex items-center gap-1 font-medium cursor-pointer"
                        >
                          <span>Visit</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Raw XML Code View */
        <div className="relative bg-[#1e293b] text-slate-100 rounded-sm p-4 font-mono text-xs overflow-x-auto max-h-[600px] border border-[#0f172a]">
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyXml}
              className="bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded-xs text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="text-emerald-400 font-mono select-all whitespace-pre-wrap">{xmlContent}</pre>
        </div>
      )}

      {/* 5. ROBOTS.TXT DIRECT LINK CALLOUT */}
      <div className="p-4 bg-[#f8f9fa] border border-[#cbd5e1] rounded-sm text-xs text-[#54595d] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <strong className="text-[#101418]">Robots Exclusion Standard:</strong>
          <p className="text-[11px]">
            Public bot crawling directives are active at <code className="font-mono text-[#3366cc]">/robots.txt</code>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/robots.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#3366cc] hover:underline font-mono inline-flex items-center gap-1"
          >
            <span>View /robots.txt</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
