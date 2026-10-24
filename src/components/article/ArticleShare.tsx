import React, { useState, useRef, useEffect } from 'react';
import {
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Send,
  MessageCircle,
  Copy,
  Check,
  Link2,
  ExternalLink,
  X,
  Globe,
} from 'lucide-react';
import { Button } from '../common/Button';

export interface ArticleShareProps {
  articleTitle: string;
  articleSlug: string;
  category?: string;
  summary?: string;
  className?: string;
  variant?: 'popover' | 'inline' | 'button-only';
  align?: 'left' | 'right';
  onShareComplete?: () => void;
}

interface SocialChannel {
  name: string;
  icon: React.ElementType;
  url: string;
  colorClass: string;
  hoverBgClass: string;
  textColorClass: string;
  badge?: string;
}

export const ArticleShare: React.FC<ArticleShareProps> = ({
  articleTitle,
  articleSlug,
  category,
  summary,
  className = '',
  variant = 'popover',
  align = 'right',
  onShareComplete,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const copyTimeoutRef = useRef<any>(null);

  // Compute canonical URL and shareable text
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://thelegendswiki.org';
  const canonicalUrl = `${currentOrigin}/wiki/${articleSlug}`;
  const shareHeading = `${articleTitle} — TheLegendsWiki Dossier`;
  const shareSummary = summary
    ? `${summary.slice(0, 160)}...`
    : `Investigative archival record and declassified dossier on ${articleTitle}.`;

  // Social sharing links definitions
  const socialChannels: SocialChannel[] = [
    {
      name: 'X (Twitter)',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Read "${articleTitle}" on @TheLegendsWiki:`
      )}&url=${encodeURIComponent(canonicalUrl)}${
        category ? `&hashtags=${encodeURIComponent(category.replace(/\s+/g, ''))},BehindTheCurtains` : ''
      }`,
      colorClass: 'text-neutral-900',
      hoverBgClass: 'hover:bg-neutral-100',
      textColorClass: 'hover:text-black',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        canonicalUrl
      )}`,
      colorClass: 'text-[#0A66C2]',
      hoverBgClass: 'hover:bg-[#e8f3fc]',
      textColorClass: 'hover:text-[#0A66C2]',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        canonicalUrl
      )}&quote=${encodeURIComponent(shareHeading)}`,
      colorClass: 'text-[#1877F2]',
      hoverBgClass: 'hover:bg-[#e7f0fd]',
      textColorClass: 'hover:text-[#1877F2]',
    },
    {
      name: 'Reddit',
      icon: Globe,
      url: `https://reddit.com/submit?url=${encodeURIComponent(
        canonicalUrl
      )}&title=${encodeURIComponent(shareHeading)}`,
      colorClass: 'text-[#FF4500]',
      hoverBgClass: 'hover:bg-[#fff0eb]',
      textColorClass: 'hover:text-[#FF4500]',
      badge: 'Reddit',
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
        `${shareHeading}\n${canonicalUrl}`
      )}`,
      colorClass: 'text-[#25D366]',
      hoverBgClass: 'hover:bg-[#eafaf1]',
      textColorClass: 'hover:text-[#1e9e4d]',
    },
    {
      name: 'Telegram',
      icon: Send,
      url: `https://t.me/share/url?url=${encodeURIComponent(
        canonicalUrl
      )}&text=${encodeURIComponent(shareHeading)}`,
      colorClass: 'text-[#229ED9]',
      hoverBgClass: 'hover:bg-[#e9f6fc]',
      textColorClass: 'hover:text-[#229ED9]',
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(
        `Dossier: ${articleTitle}`
      )}&body=${encodeURIComponent(
        `I thought you would find this investigation on TheLegendsWiki interesting:\n\n${articleTitle}\n${shareSummary}\n\nRead the full declassified record here: ${canonicalUrl}`
      )}`,
      colorClass: 'text-[#54595d]',
      hoverBgClass: 'hover:bg-[#f8f9fa]',
      textColorClass: 'hover:text-[#101418]',
    },
  ];

  // Copy Link function
  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(canonicalUrl);
      } else {
        // Fallback for older browsers
        const tempInput = document.createElement('input');
        tempInput.value = canonicalUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      setCopied(true);
      setCopyNotification('Permalink copied to clipboard');

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        setCopyNotification(null);
      }, 2500);

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
      setCopyNotification('Failed to copy link');
      setTimeout(() => setCopyNotification(null), 2000);
    }
  };

  // Web Share API fallback for mobile devices
  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareHeading,
          text: shareSummary,
          url: canonicalUrl,
        });
        if (onShareComplete) onShareComplete();
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Open the fallback popover if native share failed
          setIsOpen(true);
        }
      }
    } else {
      setIsOpen((prev) => !prev);
    }
  };

  // Handle outside click & escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerButtonRef.current?.focus();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, [isOpen]);

  // Social link click handler
  const handleSocialClick = (url: string) => {
    if (url.startsWith('mailto:')) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
    }
    if (onShareComplete) onShareComplete();
  };

  // Render Inline Variant (e.g. for footer of article or embedded strip)
  if (variant === 'inline') {
    return (
      <div
        id={`article-share-inline-${articleSlug}`}
        className={`p-4 bg-[#f8f9fa] border border-[#eaecf0] rounded-sm space-y-3 ${className}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#202122]">
            <Share2 size={14} className="text-[#3366cc]" />
            <span>Share this Archival Record</span>
          </div>
          <span className="text-[11px] font-mono text-[#72777d]">
            RECORD: /wiki/{articleSlug}
          </span>
        </div>

        {/* Copy Link Input Bar */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              id={`share-permalink-input-${articleSlug}`}
              type="text"
              readOnly
              value={canonicalUrl}
              className="w-full bg-[#ffffff] border border-[#cbd5e1] text-[#202122] text-xs font-mono px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#3366cc]"
            />
          </div>
          <Button
            id={`share-copy-btn-${articleSlug}`}
            type="button"
            variant={copied ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleCopyLink}
            icon={copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            className="shrink-0 font-sans text-xs"
          >
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </Button>
        </div>

        {/* Social Grid */}
        <div className="pt-1">
          <div className="text-[11px] text-[#72777d] uppercase tracking-wider font-semibold mb-2">
            Broadcast to Scholar & Media Networks
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {socialChannels.map((channel) => {
              const IconComp = channel.icon;
              return (
                <button
                  key={channel.name}
                  id={`share-social-inline-${channel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  type="button"
                  onClick={() => handleSocialClick(channel.url)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#cbd5e1] bg-white rounded-sm ${channel.hoverBgClass} transition-colors cursor-pointer text-[#54595d] font-sans`}
                  title={`Share on ${channel.name}`}
                >
                  <IconComp size={13} className={channel.colorClass} />
                  <span>{channel.badge || channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Render Popover Trigger and Dropdown Menu
  return (
    <div
      ref={containerRef}
      id={`article-share-popover-${articleSlug}`}
      className={`relative inline-block text-left no-print ${className}`}
    >
      {/* Trigger Button */}
      <button
        ref={triggerButtonRef}
        id={`article-share-trigger-${articleSlug}`}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Share article via social media or link"
        className={`px-2.5 py-1.5 text-xs text-[#54595d] hover:text-[#3366cc] hover:bg-[#f1f5f9] active:bg-[#eaecf0] rounded-sm border transition-colors cursor-pointer inline-flex items-center gap-1.5 font-sans ${
          isOpen
            ? 'bg-[#f1f5f9] border-[#3366cc] text-[#3366cc] shadow-2xs'
            : 'bg-white border-[#cbd5e1]'
        }`}
        title="Share article with colleagues and networks"
      >
        <Share2 size={13} className={isOpen ? 'text-[#3366cc]' : ''} />
        <span className="font-medium">Share</span>
      </button>

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label={`Share ${articleTitle}`}
          className={`absolute z-40 mt-1.5 w-80 sm:w-88 bg-white border border-[#a2a9b1] rounded-sm shadow-lg p-3.5 space-y-3.5 animate-in fade-in zoom-in-95 duration-100 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[#eaecf0] pb-2">
            <div>
              <div className="font-serif font-bold text-sm text-[#101418] leading-tight line-clamp-1">
                Share Archival Record
              </div>
              <div className="text-[11px] text-[#72777d] font-sans">
                TheLegendsWiki &bull; Investigative Codex
              </div>
            </div>
            <button
              id={`share-close-btn-${articleSlug}`}
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-[#72777d] hover:text-[#101418] hover:bg-[#f1f5f9] rounded-sm transition-colors cursor-pointer"
              title="Close share menu"
              aria-label="Close share menu"
            >
              <X size={14} />
            </button>
          </div>

          {/* Direct Copy Link Bar */}
          <div className="space-y-1.5">
            <label
              htmlFor={`share-url-input-${articleSlug}`}
              className="block text-[11px] font-semibold text-[#54595d] uppercase tracking-wider"
            >
              Canonical Permalink
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1 min-w-0">
                <input
                  id={`share-url-input-${articleSlug}`}
                  type="text"
                  readOnly
                  value={canonicalUrl}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-[#f8f9fa] border border-[#cbd5e1] text-[#202122] text-xs font-mono px-2.5 py-1.5 rounded-sm focus:outline-none focus:border-[#3366cc] truncate"
                />
              </div>
              <Button
                id={`share-modal-copy-btn-${articleSlug}`}
                type="button"
                variant={copied ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleCopyLink}
                icon={
                  copied ? (
                    <Check size={13} className="text-emerald-600" />
                  ) : (
                    <Copy size={13} />
                  )
                }
                className="shrink-0 text-xs font-sans"
                title="Copy canonical URL to clipboard"
              >
                <span>{copied ? 'Copied' : 'Copy Link'}</span>
              </Button>
            </div>
            {copyNotification && (
              <p
                role="status"
                className="text-[11px] text-emerald-700 flex items-center gap-1 pt-0.5 font-medium animate-in fade-in"
              >
                <Check size={12} className="text-emerald-600" />
                <span>{copyNotification}</span>
              </p>
            )}
          </div>

          {/* Social Media Channels Grid */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-[#54595d] uppercase tracking-wider">
              Share to Network
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {socialChannels.map((channel) => {
                const Icon = channel.icon;
                return (
                  <button
                    key={channel.name}
                    id={`share-channel-${channel.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, '-')}`}
                    type="button"
                    onClick={() => handleSocialClick(channel.url)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 bg-[#ffffff] hover:bg-[#f8f9fa] border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-sm text-xs text-[#202122] ${channel.textColorClass} transition-colors cursor-pointer text-left font-sans group`}
                    title={`Share on ${channel.name}`}
                  >
                    <Icon
                      size={14}
                      className={`${channel.colorClass} group-hover:scale-110 transition-transform shrink-0`}
                    />
                    <span className="truncate">{channel.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mobile Web Share Button (if supported) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <div className="pt-1 border-t border-[#eaecf0]">
              <button
                id={`share-native-device-btn-${articleSlug}`}
                type="button"
                onClick={handleNativeShare}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-[#3366cc] hover:bg-[#f1f5f9] rounded-sm font-medium transition-colors cursor-pointer"
              >
                <Share2 size={13} />
                <span>Open Device Share Menu</span>
              </button>
            </div>
          )}

          {/* Archival Attribution Footer */}
          <div className="pt-2 border-t border-[#eaecf0] text-[10.5px] text-[#72777d] flex items-center justify-between font-mono">
            <span>TheLegendsWiki Archive</span>
            <span className="text-amber-800 font-sans font-semibold">
              Public Record
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
