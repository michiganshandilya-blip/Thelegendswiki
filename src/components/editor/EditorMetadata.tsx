import React, { useState, useEffect } from 'react';
import { Category, Subcategory } from '../../types';
import { getCategories } from '../../services/categoryService';
import { DEMO_CATEGORIES } from '../../data/demoData';
import { generateSlugFromTitle, sanitizeTag, isValidUrl, validateImageAlt } from '../../lib/validation';
import { isSlugAvailable } from '../../services/articleService';
import { ImageUploaderModal } from '../common/ImageUploaderModal';
import {
  Tag as TagIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Info,
  Sparkles,
  Scale,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface EditorMetadataProps {
  title: string;
  slug: string;
  summary: string;
  articleType: string;
  category: string;
  categorySlug: string;
  subCategory?: string;
  tags: string[];
  featuredImage?: string;
  imageCaption?: string;
  imageCredit?: string;
  imageAlt?: string;
  isSensitive?: boolean;
  contentSensitivity?: 'normal' | 'sensitive';
  sensitivityRationale?: string;
  currentArticleId?: string;
  onChange: (fields: {
    title?: string;
    slug?: string;
    summary?: string;
    articleType?: any;
    category?: string;
    categorySlug?: string;
    subCategory?: string;
    tags?: string[];
    featuredImage?: string;
    image?: string;
    imageCaption?: string;
    imageCredit?: string;
    imageAlt?: string;
    isSensitive?: boolean;
    contentSensitivity?: 'normal' | 'sensitive';
    sensitivityRationale?: string;
  }) => void;
  errors?: Record<string, string | undefined>;
}

const ARTICLE_TYPES = [
  { value: 'general', label: 'General Record' },
  { value: 'person', label: 'Biography / Historical Figure' },
  { value: 'event', label: 'Historical Event / Era' },
  { value: 'place', label: 'Geographic Site / Monument' },
  { value: 'science', label: 'Science & Cosmos' },
  { value: 'technology', label: 'Engineering & Computing' },
  { value: 'organization', label: 'Institution / Organization' },
];

export const EditorMetadata: React.FC<EditorMetadataProps> = ({
  title,
  slug,
  summary,
  articleType,
  category,
  categorySlug,
  subCategory,
  tags,
  featuredImage,
  imageCaption = '',
  imageCredit = '',
  imageAlt = '',
  isSensitive = false,
  contentSensitivity = 'normal',
  sensitivityRationale = '',
  currentArticleId,
  onChange,
  errors = {} as Record<string, string | undefined>,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [tagInput, setTagInput] = useState<string>('');
  const [autoSlugEnabled, setAutoSlugEnabled] = useState<boolean>(!slug);
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false);

  // Fetch registered categories from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      try {
        const list = await getCategories();
        if (isMounted) {
          // Filter out 'all' pseudo-category
          const filtered = list.filter((c) => c.slug !== 'all');
          const catsToUse = filtered.length > 0 && filtered.some((c) => c.slug.startsWith('behind-')) ? filtered : DEMO_CATEGORIES;
          setCategories(catsToUse);

          // If no category selected yet, select first
          if (!categorySlug && catsToUse.length > 0) {
            onChange({
              category: catsToUse[0].name,
              categorySlug: catsToUse[0].slug,
            });
          }
        }
      } catch (err) {
        console.warn('Error loading taxonomy categories, falling back to Behind-the-Curtains presets:', err);
        if (isMounted) {
          setCategories(DEMO_CATEGORIES);
        }
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    }
    loadCats();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Title Change & Auto-Slug
  const handleTitleChange = (newTitle: string) => {
    const updates: any = { title: newTitle };
    if (autoSlugEnabled) {
      const generated = generateSlugFromTitle(newTitle);
      updates.slug = generated;
    }
    onChange(updates);
  };

  // Check Slug Uniqueness debounced
  useEffect(() => {
    if (!slug) {
      setSlugStatus('idle');
      return;
    }

    setSlugStatus('checking');
    const timer = setTimeout(async () => {
      const available = await isSlugAvailable(slug, currentArticleId);
      setSlugStatus(available ? 'available' : 'taken');
    }, 450);

    return () => clearTimeout(timer);
  }, [slug, currentArticleId]);

  // Selected Category's subcategories
  const currentCatObj = categories.find((c) => c.slug === categorySlug);
  const subcategories: Subcategory[] = currentCatObj?.subcategories || [];

  // Handle Category selection
  const handleCategorySelect = (selectedSlug: string) => {
    const selectedCat = categories.find((c) => c.slug === selectedSlug);
    if (selectedCat) {
      onChange({
        category: selectedCat.name,
        categorySlug: selectedCat.slug,
        subCategory: undefined, // Reset subcategory
      });
    }
  };

  // Handle Tag Addition
  const handleAddTag = () => {
    const sanitized = sanitizeTag(tagInput);
    if (!sanitized) return;

    if (tags.length >= 10) return; // Limit 10 tags
    if (!tags.includes(sanitized)) {
      onChange({ tags: [...tags, sanitized] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange({ tags: tags.filter((t) => t !== tagToRemove) });
  };

  // Handle Hero Image selected from modal
  const handleImageSelected = (img: {
    url: string;
    caption: string;
    alt: string;
    credit: string;
  }) => {
    onChange({
      featuredImage: img.url,
      image: img.url,
      imageCaption: img.caption,
      imageAlt: img.alt,
      imageCredit: img.credit,
    });
  };

  const handleRemoveHeroImage = () => {
    onChange({
      featuredImage: '',
      image: '',
      imageCaption: '',
      imageAlt: '',
      imageCredit: '',
    });
  };

  const altCheck = featuredImage ? validateImageAlt(imageAlt) : { isValid: true };

  return (
    <div className="space-y-5 bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 sm:p-6 shadow-xs">
      {/* ==================================================
          1. TITLE & SLUG
          ================================================== */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-[#54595d] mb-1.5 flex items-center justify-between">
            <span>
              Article Title <strong className="text-red-500">*</strong>
            </span>
            <span className="text-[10px] text-[#72777d] font-mono font-normal">
              {title.length}/250 chars
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. The Library of Alexandria"
            maxLength={250}
            className={`w-full bg-[#ffffff] border ${
              errors.title ? 'border-red-500' : 'border-[#a2a9b1] focus:border-[#3366cc]'
            } rounded-sm px-3.5 py-2 text-sm sm:text-base font-serif font-bold text-[#101418] placeholder-[#72777d] focus:outline-none transition-all shadow-xs`}
          />
          {errors.title && (
            <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-sans">
              <AlertCircle size={12} /> {errors.title}
            </p>
          )}
        </div>

        {/* Slug Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d]">
              URL Slug <strong className="text-red-500">*</strong>
            </label>
            <button
              type="button"
              onClick={() => {
                const generated = generateSlugFromTitle(title);
                onChange({ slug: generated });
                setAutoSlugEnabled(true);
              }}
              className="text-[10px] font-mono text-[#3366cc] hover:underline cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={10} /> Auto-Generate
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="bg-[#f8f9fa] border border-r-0 border-[#a2a9b1] px-2.5 py-1.5 text-[#54595d] font-mono text-xs rounded-l-sm select-none">
              /wiki/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => {
                setAutoSlugEnabled(false);
                onChange({ slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9-]/g, '') });
              }}
              placeholder="the-library-of-alexandria"
              className={`flex-1 bg-[#ffffff] border ${
                errors.slug || slugStatus === 'taken'
                  ? 'border-red-500'
                  : slugStatus === 'available'
                  ? 'border-emerald-600'
                  : 'border-[#a2a9b1] focus:border-[#3366cc]'
              } rounded-r-sm px-3 py-1.5 text-xs font-mono text-[#202122] focus:outline-none transition-all`}
            />

            {/* Slug status badge */}
            <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-mono">
              {slugStatus === 'checking' && (
                <span className="text-[#72777d]">Checking slug...</span>
              )}
              {slugStatus === 'available' && (
                <span className="text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Available
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> Slug In Use
                </span>
              )}
            </div>
          </div>
          {errors.slug && (
            <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-sans">
              <AlertCircle size={12} /> {errors.slug}
            </p>
          )}
        </div>
      </div>

      {/* ==================================================
          2. LEAD SUMMARY
          ================================================== */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase text-[#54595d] mb-1.5 flex items-center justify-between">
          <span>
            Short Summary (Lead Paragraph) <strong className="text-red-500">*</strong>
          </span>
          <span
            className={`text-[10px] font-mono ${
              summary.length < 10 ? 'text-amber-700' : 'text-[#72777d]'
            }`}
          >
            {summary.length}/2000 chars (min 10)
          </span>
        </label>
        <textarea
          value={summary}
          onChange={(e) => onChange({ summary: e.target.value })}
          rows={3}
          maxLength={2000}
          placeholder="A concise, high-level summary that introduces the subject for search results, category pages, and the article header..."
          className={`w-full bg-[#ffffff] border ${
            errors.summary ? 'border-red-500' : 'border-[#a2a9b1] focus:border-[#3366cc]'
          } rounded-sm p-3 text-xs sm:text-sm text-[#202122] placeholder-[#72777d] focus:outline-none leading-relaxed transition-all font-sans`}
        />
        {errors.summary && (
          <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1 font-sans">
            <AlertCircle size={12} /> {errors.summary}
          </p>
        )}
      </div>

      {/* ==================================================
          3. TAXONOMY & CLASSIFICATION
          ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#eaecf0]">
        {/* Article Type */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] mb-1">
            Article Type
          </label>
          <select
            value={articleType}
            onChange={(e) => onChange({ articleType: e.target.value })}
            className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none font-sans"
          >
            {ARTICLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Category */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] mb-1 flex items-center justify-between">
            <span>
              Primary Category <strong className="text-red-500">*</strong>
            </span>
            {loadingCategories && <span className="text-[9px] text-[#3366cc]">Loading...</span>}
          </label>
          <select
            value={categorySlug}
            onChange={(e) => handleCategorySelect(e.target.value)}
            disabled={loadingCategories || categories.length === 0}
            className={`w-full bg-[#ffffff] border ${
              errors.categorySlug ? 'border-red-500' : 'border-[#a2a9b1] focus:border-[#3366cc]'
            } rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none font-sans`}
          >
            {categories.map((c) => (
              <option key={c.id || c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] mb-1">
            Subcategory (Optional)
          </label>
          <select
            value={subCategory || ''}
            onChange={(e) => onChange({ subCategory: e.target.value || undefined })}
            disabled={subcategories.length === 0}
            className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none disabled:opacity-50 font-sans"
          >
            <option value="">-- None / General --</option>
            {subcategories.map((sub) => (
              <option key={sub.id || sub.slug} value={sub.name}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ==================================================
          4. TAGS & KEYWORDS
          ================================================== */}
      <div className="pt-3 border-t border-[#eaecf0] space-y-2">
        <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] flex items-center justify-between">
          <span className="flex items-center gap-1">
            <TagIcon size={12} className="text-[#3366cc]" />
            <span>Indexed Tags &amp; Keywords ({tags.length}/10)</span>
          </span>
          <span className="text-[10px] text-[#72777d]">Press Enter or Add</span>
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag (e.g. papyrus, ptolemaic-dynasty)..."
            className="flex-1 bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
            className="px-3 py-1.5 bg-[#f8f9fa] hover:bg-[#eaecf0] disabled:opacity-40 text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors"
          >
            + Add Tag
          </button>
        </div>

        {/* Rendered Tag Badges */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#f8f9fa] text-[#202122] border border-[#cbd5e1] rounded-sm text-xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-[#72777d] hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                  aria-label={`Remove tag ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          5. CONTENT CLASSIFICATION & SENSITIVITY
          ================================================== */}
      <div className="pt-3 border-t border-[#eaecf0] space-y-3">
        <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Scale size={13} className="text-[#b45309]" />
            <span>Content Classification &amp; Editorial Sensitivity</span>
          </span>
          <span className="text-[10px] text-[#72777d] font-normal font-sans">
            Controls automatic disclaimer display
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Normal Content Option */}
          <div
            onClick={() => onChange({ isSensitive: false, contentSensitivity: 'normal' })}
            className={`p-3.5 rounded-sm border cursor-pointer transition-all ${
              !isSensitive && contentSensitivity !== 'sensitive'
                ? 'bg-blue-50/50 border-[#3366cc] ring-1 ring-[#3366cc]'
                : 'bg-[#f8f9fa] border-[#cbd5e1] hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-[#101418] flex items-center gap-1.5">
                <ShieldCheck size={14} className={!isSensitive && contentSensitivity !== 'sensitive' ? 'text-[#3366cc]' : 'text-[#72777d]'} />
                <span>Normal Content</span>
              </span>
              <input
                type="radio"
                name="contentSensitivityRadio"
                checked={!isSensitive && contentSensitivity !== 'sensitive'}
                onChange={() => onChange({ isSensitive: false, contentSensitivity: 'normal' })}
                className="text-[#3366cc] focus:ring-[#3366cc]"
              />
            </div>
            <p className="text-[11px] text-[#54595d] leading-relaxed">
              Standard encyclopedic material across history, science, biographies, technology, and places. No sensitive disclaimer attached.
            </p>
          </div>

          {/* Sensitive Content Option */}
          <div
            onClick={() => onChange({ isSensitive: true, contentSensitivity: 'sensitive' })}
            className={`p-3.5 rounded-sm border cursor-pointer transition-all ${
              isSensitive || contentSensitivity === 'sensitive'
                ? 'bg-amber-50/70 border-[#b45309] ring-1 ring-[#b45309]'
                : 'bg-[#f8f9fa] border-[#cbd5e1] hover:border-slate-400'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-amber-950 flex items-center gap-1.5">
                <AlertTriangle size={14} className={isSensitive || contentSensitivity === 'sensitive' ? 'text-[#b45309]' : 'text-[#72777d]'} />
                <span>Sensitive Content</span>
              </span>
              <input
                type="radio"
                name="contentSensitivityRadio"
                checked={isSensitive || contentSensitivity === 'sensitive'}
                onChange={() => onChange({ isSensitive: true, contentSensitivity: 'sensitive' })}
                className="text-[#b45309] focus:ring-[#b45309]"
              />
            </div>
            <p className="text-[11px] text-[#54595d] leading-relaxed">
              Investigative dossiers, financial scandals, alleged misconduct, corporate malfeasance, or historical controversies.
            </p>
          </div>
        </div>

        {/* Sensitive Content Context Note */}
        {(isSensitive || contentSensitivity === 'sensitive') && (
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-sm space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
              <Scale size={13} />
              <span>Automatic Sensitive Content Disclaimer Enabled</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              The article will automatically render the objective <strong>Sensitive Content Disclaimer</strong> near the end before the references section, emphasizing educational purpose and evidence attribution.
            </p>
            <div>
              <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-1">
                Sensitivity Rationale / Context Note (Optional)
              </label>
              <input
                type="text"
                value={sensitivityRationale}
                onChange={(e) => onChange({ sensitivityRationale: e.target.value })}
                placeholder="e.g. Involves active financial litigation, regulatory findings, and documented forensic accounting."
                className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#b45309] rounded-sm px-2.5 py-1.5 text-xs text-[#202122] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          6. MAIN / HERO ARTICLE IMAGE
          ================================================== */}
      <div className="pt-3 border-t border-[#eaecf0] space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-[11px] font-mono font-bold uppercase text-[#54595d] flex items-center gap-1.5">
            <ImageIcon size={13} className="text-[#3366cc]" />
            <span>Main / Hero Article Illustration</span>
          </label>

          <button
            type="button"
            onClick={() => setImageModalOpen(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#3366cc] border border-blue-300 rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
          >
            {featuredImage ? <Edit2 size={12} /> : <Plus size={12} />}
            <span>{featuredImage ? 'Replace Image' : 'Attach Main Image'}</span>
          </button>
        </div>

        {featuredImage ? (
          <div className="bg-[#f8f9fa] border border-[#eaecf0] rounded-sm p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3.5 items-start">
              {/* Thumbnail preview */}
              <div className="w-32 h-24 bg-[#ffffff] border border-[#cbd5e1] rounded-xs overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={featuredImage}
                  alt={imageAlt || 'Hero preview'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Editable metadata */}
              <div className="flex-1 min-w-0 space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.2 rounded-xs">
                    Main Hero Image Configured
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveHeroImage}
                    className="text-[11px] text-red-600 hover:underline flex items-center gap-1 cursor-pointer font-mono"
                  >
                    <Trash2 size={11} /> Remove
                  </button>
                </div>

                {/* Alt text */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5 flex items-center justify-between">
                    <span>Alternative Text (Alt) <strong className="text-red-500">*</strong></span>
                    {!altCheck.isValid && (
                      <span className="text-amber-700 text-[9px] font-mono">
                        ! Needs descriptive text
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={imageAlt}
                    onChange={(e) => onChange({ imageAlt: e.target.value })}
                    placeholder="Describe image for screen readers and accessibility..."
                    className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none"
                  />
                  {!altCheck.isValid && (
                    <p className="text-[10px] text-amber-700 mt-0.5 flex items-center gap-1 font-sans">
                      <Info size={10} /> {altCheck.message}
                    </p>
                  )}
                </div>

                {/* Caption & Credit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                      Caption
                    </label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => onChange({ imageCaption: e.target.value })}
                      placeholder="Visible caption under image..."
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-[#54595d] font-bold mb-0.5">
                      Attribution / Source Credit
                    </label>
                    <input
                      type="text"
                      value={imageCredit}
                      onChange={(e) => onChange({ imageCredit: e.target.value })}
                      placeholder="e.g. British Museum / CC-BY"
                      className="w-full bg-[#ffffff] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-2.5 py-1 text-xs text-[#202122] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setImageModalOpen(true)}
            className="p-4 bg-[#f8f9fa] border border-dashed border-[#cbd5e1] hover:border-[#3366cc] rounded-sm text-center cursor-pointer transition-colors space-y-1"
          >
            <ImageIcon size={20} className="mx-auto text-[#cbd5e1]" />
            <p className="text-xs text-[#54595d] font-medium">
              No main hero image attached. Click to upload a file or pick an archival preset.
            </p>
          </div>
        )}
      </div>

      {/* Image Uploader Modal for Main Hero Image */}
      <ImageUploaderModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        onSelect={handleImageSelected}
        initialData={{
          url: featuredImage,
          caption: imageCaption,
          alt: imageAlt,
          credit: imageCredit,
        }}
        title="Attach Main Hero Image"
        allowAlignment={false}
      />
    </div>
  );
};
