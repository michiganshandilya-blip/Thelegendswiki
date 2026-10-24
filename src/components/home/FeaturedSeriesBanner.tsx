import React, { useState, useRef } from 'react';
import { useRouter } from '../../context/RouterContext';
import { useSystemSettings } from '../../hooks/useSystemSettings';
import { useAuth } from '../../context/AuthContext';
import { FeaturedSeriesConfig } from '../../types';
import { validateImageUpload, compressImageToDataUrl, uploadArticleImage } from '../../services/storageService';
import { Sparkles, ArrowRight, Upload, Settings, X, Check, Image as ImageIcon, Loader2 } from 'lucide-react';

export const FeaturedSeriesBanner: React.FC = () => {
  const { navigate } = useRouter();
  const { settings, updateSettings } = useSystemSettings();
  const { user, profile, isAdmin, isSuperAdmin } = useAuth();

  const canManage = Boolean(
    isSuperAdmin ||
    isAdmin ||
    profile?.role === 'super_admin' ||
    profile?.role === 'admin' ||
    profile?.role === 'editor' ||
    (user?.email && (
      user.email.toLowerCase() === 'michiganshandilya@gmail.com' ||
      user.email.toLowerCase().endsWith('@thelegendswiki.org')
    ))
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active configuration with defaults
  const seriesConfig: FeaturedSeriesConfig = settings.featuredSeries || {
    id: 'series-who-taught-us-to-want-this',
    title: 'Who Taught Us to Want This?',
    slug: 'who-taught-us-to-want-this',
    subtitle: 'Behind manufactured desires, advertising psychology & algorithmic conditioning',
    tagline: 'Featured Investigation Series',
    description: 'An authoritative forensic deep-dive into the engineers, psychologists, and boardroom strategists who constructed modern consumer desire, engineered social status, and shaped what society craves behind closed doors.',
    bannerImageUrl: '',
    bannerImageAlt: 'Featured Series: Who Taught Us to Want This?',
    active: true,
    targetPath: '/series/who-taught-us-to-want-this',
  };

  // Form states for the customization modal
  const [formTitle, setFormTitle] = useState(seriesConfig.title);
  const [formSlug, setFormSlug] = useState(seriesConfig.slug);
  const [formSubtitle, setFormSubtitle] = useState(seriesConfig.subtitle || '');
  const [formImageUrl, setFormImageUrl] = useState(seriesConfig.bannerImageUrl || '');
  const [formActive, setFormActive] = useState(seriesConfig.active !== false);

  if (seriesConfig.active === false && !modalOpen) {
    return null;
  }

  const destinationPath = seriesConfig.targetPath || `/series/${seriesConfig.slug || 'who-taught-us-to-want-this'}`;

  const handleBannerClick = () => {
    navigate(destinationPath);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canManage) return;
    setFormTitle(seriesConfig.title || 'Who Taught Us to Want This?');
    setFormSlug(seriesConfig.slug || 'who-taught-us-to-want-this');
    setFormSubtitle(seriesConfig.subtitle || '');
    setFormImageUrl(seriesConfig.bannerImageUrl || '');
    setFormActive(seriesConfig.active !== false);
    setUploadError(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageUpload(file);
    if (!validation.isValid) {
      setUploadError(validation.error || 'Invalid image file.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // 1. Attempt upload via existing storage service
      let finalUrl = '';
      try {
        const uploadResult = await uploadArticleImage('featured-series', file, file.name);
        if (uploadResult?.downloadUrl) {
          finalUrl = uploadResult.downloadUrl;
        }
      } catch {
        // Fallback to high-efficiency client-side compressed data URL
        finalUrl = await compressImageToDataUrl(file, 1200, 360, 0.85);
      }

      if (!finalUrl) {
        finalUrl = await compressImageToDataUrl(file, 1200, 360, 0.85);
      }

      setFormImageUrl(finalUrl);
      setSuccessMsg('Promotional image loaded successfully. Click "Save Banner" to apply.');
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process promotional image.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setUploadError('Administrative authorization is required to modify the featured series banner.');
      return;
    }

    setSaving(true);
    setUploadError(null);

    const cleanTitle = formTitle.trim() || 'Who Taught Us to Want This?';
    const cleanSlug = formSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'who-taught-us-to-want-this';

    const updatedConfig: FeaturedSeriesConfig = {
      ...seriesConfig,
      title: cleanTitle,
      slug: cleanSlug,
      subtitle: formSubtitle.trim() || undefined,
      bannerImageUrl: formImageUrl.trim(),
      bannerImageAlt: `Featured Series: ${cleanTitle}`,
      active: formActive,
      targetPath: `/series/${cleanSlug}`,
    };

    try {
      const actorRole = isSuperAdmin || (user?.email && user.email.toLowerCase() === 'michiganshandilya@gmail.com')
        ? 'super_admin'
        : (profile?.role || (isAdmin ? 'admin' : 'editor'));

      const actor = {
        uid: user?.uid || (isSuperAdmin ? 'super-admin-root-01' : 'system-admin'),
        email: user?.email || profile?.email || 'michiganshandilya@gmail.com',
        role: actorRole,
      };

      await updateSettings(
        {
          featuredSeries: updatedConfig,
        },
        actor
      );

      // Save local backup in localStorage to ensure instantaneous persistence
      try {
        localStorage.setItem('thelegendswiki:featured_series_config', JSON.stringify(updatedConfig));
      } catch {
        // Ignore storage errors
      }

      setSuccessMsg('Featured Series banner updated successfully!');
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg(null);
      }, 700);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to save series banner configuration.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* ==================================================
          COMPACT HORIZONTAL PROMOTIONAL RECTANGLE (AMAZON-STYLE)
          ================================================== */}
      <aside
        id="featured-series-promotional-banner"
        aria-label={`Featured Series: ${seriesConfig.title}`}
        onClick={handleBannerClick}
        className="w-full relative group cursor-pointer select-none rounded-xs overflow-hidden border border-[#cbd5e1] dark:border-slate-800 bg-[#f8fafc] dark:bg-slate-900 shadow-xs transition-all duration-200 hover:border-amber-500/80 hover:shadow-xs active:scale-[0.998]"
      >
        {/* Subtle Archival Identification Tag */}
        <div className="absolute top-2 left-2.5 z-20 pointer-events-none flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold bg-slate-950/85 text-amber-300 border border-amber-500/40 rounded-xs shadow-xs backdrop-blur-xs flex items-center gap-1">
            <Sparkles size={10} className="text-amber-400" />
            <span>Featured Series</span>
          </span>
        </div>

        {/* Unobtrusive Customization Trigger (visible on hover for authorized editors/admins) */}
        {canManage && (
          <button
            type="button"
            onClick={handleOpenModal}
            title="Configure Series Banner &amp; Image"
            aria-label="Configure Featured Series"
            className="absolute top-2 right-2 z-30 opacity-70 group-hover:opacity-100 hover:!opacity-100 p-1 sm:px-2 sm:py-0.5 bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-400 text-slate-300 hover:text-amber-200 text-[10px] font-mono rounded-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Settings size={11} />
            <span className="hidden sm:inline">Customize</span>
          </button>
        )}

        {/* CONTENT RENDERING: Custom Image vs. Elegant Archival Fallback */}
        {seriesConfig.bannerImageUrl ? (
          /* Custom Promotional Image Container - Compact Horizontal Rectangle */
          <div className="relative w-full h-20 sm:h-24 md:h-28 overflow-hidden bg-slate-950 flex items-center justify-center">
            <img
              src={seriesConfig.bannerImageUrl}
              alt={seriesConfig.bannerImageAlt || seriesConfig.title}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.01]"
            />
            {/* Very subtle protective archival dark overlay on the edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30 pointer-events-none" />
            
            {/* Subtle bottom-right directional arrow indicator */}
            <div className="absolute bottom-2 right-2.5 z-20 pointer-events-none flex items-center gap-1 text-[11px] font-mono text-amber-200/90 bg-black/60 px-2 py-0.5 rounded-xs border border-amber-500/30">
              <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider">Explore Series</span>
              <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ) : (
          /* Default Archival Text & Graphical Presentation (Zero custom image uploaded yet) */
          <div className="relative w-full h-20 sm:h-24 md:h-28 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-slate-100">
            {/* Subtle background aesthetic watermark */}
            <div className="absolute right-12 top-0 bottom-0 w-48 bg-amber-500/5 blur-2xl pointer-events-none" />

            <div className="space-y-1 max-w-2xl pl-24 sm:pl-28">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm sm:text-base md:text-lg font-bold text-amber-100 group-hover:text-amber-300 transition-colors tracking-tight line-clamp-1">
                  {seriesConfig.title || 'Who Taught Us to Want This?'}
                </h3>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-sans line-clamp-1 text-ellipsis font-light">
                {seriesConfig.subtitle || 'An investigative inquiry into manufactured desire, behavioral architecture & societal consensus.'}
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 pr-1">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2.5 py-1 rounded-xs">
                <span>Open Dossiers</span>
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="sm:hidden text-amber-300 p-1">
                <ArrowRight size={15} />
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* ==================================================
          CUSTOMIZATION & IMAGE UPLOAD MODAL
          ================================================== */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="series-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-[#a2a9b1] dark:border-slate-700 rounded-sm max-w-lg w-full p-6 shadow-2xl space-y-4 text-slate-900 dark:text-slate-100 text-xs sm:text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon size={17} className="text-amber-600 dark:text-amber-400" />
                <h2 id="series-modal-title" className="font-serif text-base sm:text-lg font-bold">
                  Configure Featured Series Banner
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xs cursor-pointer"
                aria-label="Close modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* Image Upload Input */}
              <div className="space-y-2">
                <label className="block font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                  Custom Promotional Image
                </label>
                <p className="text-[11px] text-slate-500 font-sans">
                  Upload your custom graphic/artwork (compact horizontal rectangle recommended, e.g. 1200&times;280px). The artwork itself can include your titles and typography.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    id="series-banner-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-3.5 py-2 bg-amber-800 hover:bg-amber-700 text-white font-mono text-xs rounded-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {uploading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Processing Artwork...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={13} />
                        <span>Upload Custom Image</span>
                      </>
                    )}
                  </button>

                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="px-2.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-mono text-xs rounded-xs border border-slate-300 dark:border-slate-700 cursor-pointer"
                    >
                      Clear Image
                    </button>
                  )}
                </div>

                {/* Direct Image URL input as alternative */}
                <div className="pt-1">
                  <span className="text-[10px] font-mono text-slate-400">Or enter image URL:</span>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://example.com/promotional-banner.jpg"
                    className="w-full mt-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xs text-xs font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>

                {/* Real-time Preview */}
                {formImageUrl && (
                  <div className="space-y-1 pt-1">
                    <span className="font-mono text-[10px] text-slate-500 uppercase">Banner Preview:</span>
                    <div className="w-full h-20 rounded-xs overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-950">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Series Title */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                  Series Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Who Taught Us to Want This?"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xs font-serif text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Series Subtitle */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                  Subtitle / Teaser Line
                </label>
                <input
                  type="text"
                  value={formSubtitle}
                  onChange={(e) => setFormSubtitle(e.target.value)}
                  placeholder="Behind manufactured desires, advertising psychology & algorithmic conditioning"
                  className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xs text-xs font-sans text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Series Slug */}
              <div className="space-y-1">
                <label className="block font-mono text-[11px] uppercase tracking-wider font-bold text-slate-700 dark:text-slate-300">
                  Series URL Slug
                </label>
                <div className="flex items-center gap-1 text-slate-400 font-mono text-xs">
                  <span>/series/</span>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="who-taught-us-to-want-this"
                    className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xs font-mono text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="rounded-xs text-amber-600 focus:ring-amber-500"
                />
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                  Display Featured Series Banner on Homepage
                </span>
              </label>

              {/* Error & Success Feedback */}
              {uploadError && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xs">
                  {uploadError}
                </div>
              )}
              {successMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xs flex items-center gap-1.5 font-mono">
                  <Check size={13} />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xs font-mono text-xs cursor-pointer hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="px-4 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xs font-mono text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={13} />
                      <span>Save Banner</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
