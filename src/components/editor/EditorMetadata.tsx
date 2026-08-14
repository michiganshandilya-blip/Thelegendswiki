import React, { useState, useEffect } from 'react';
import { Category, Subcategory } from '../../types';
import { getCategories } from '../../services/categoryService';
import { generateSlugFromTitle, sanitizeTag, isValidUrl } from '../../lib/validation';
import { isSlugAvailable } from '../../services/articleService';
import {
  FolderTree,
  Tag as TagIcon,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HelpCircle,
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
  }) => void;
  errors?: Record<string, string | undefined>;
}

const ARTICLE_TYPES = [
  { value: 'general', label: 'General Codex Record' },
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
  currentArticleId,
  onChange,
  errors = {} as Record<string, string | undefined>,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [slugStatus, setSlugStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [tagInput, setTagInput] = useState<string>('');
  const [autoSlugEnabled, setAutoSlugEnabled] = useState<boolean>(!slug);

  // Fetch registered categories from Firestore
  useEffect(() => {
    let isMounted = true;
    async function loadCats() {
      try {
        const list = await getCategories();
        if (isMounted) {
          // Filter out 'all' pseudo-category
          const filtered = list.filter((c) => c.slug !== 'all');
          setCategories(filtered);

          // If no category selected yet, select first
          if (!categorySlug && filtered.length > 0) {
            onChange({
              category: filtered[0].name,
              categorySlug: filtered[0].slug,
            });
          }
        }
      } catch (err) {
        console.warn('Error loading taxonomy categories:', err);
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

  return (
    <div className="space-y-5 bg-[#0a0f1d] border border-slate-800 rounded-sm p-4 sm:p-6 shadow-sm">
      {/* ==================================================
          1. TITLE & SLUG
          ================================================== */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5 flex items-center justify-between">
            <span>Article Title <strong className="text-red-400">*</strong></span>
            <span className="text-[10px] text-slate-500 font-mono font-normal">
              {title.length}/250 chars
            </span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="e.g. The Library of Alexandria"
            maxLength={250}
            className={`w-full bg-[#080c14] border ${
              errors.title ? 'border-red-500/80' : 'border-slate-800 focus:border-blue-500'
            } rounded-sm px-3.5 py-2 text-sm sm:text-base font-display font-semibold text-slate-100 placeholder-slate-600 focus:outline-none transition-all shadow-inner`}
          />
          {errors.title && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.title}
            </p>
          )}
        </div>

        {/* Slug Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-mono font-bold uppercase text-slate-400">
              URL Identifier (Slug) <strong className="text-red-400">*</strong>
            </label>
            <button
              type="button"
              onClick={() => {
                const generated = generateSlugFromTitle(title);
                onChange({ slug: generated });
                setAutoSlugEnabled(true);
              }}
              className="text-[10px] font-mono text-blue-400 hover:text-blue-300 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw size={10} /> Auto-Generate
            </button>
          </div>

          <div className="relative flex items-center">
            <span className="bg-[#141c2e] border border-r-0 border-slate-800 px-2.5 py-1.5 text-slate-500 font-mono text-xs rounded-l-sm select-none">
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
              className={`flex-1 bg-[#080c14] border ${
                errors.slug || slugStatus === 'taken'
                  ? 'border-red-500/80'
                  : slugStatus === 'available'
                  ? 'border-emerald-500/60'
                  : 'border-slate-800 focus:border-blue-500'
              } rounded-r-sm px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none transition-all`}
            />

            {/* Slug status badge */}
            <div className="absolute right-2.5 flex items-center gap-1 text-[10px] font-mono">
              {slugStatus === 'checking' && (
                <span className="text-slate-500 animate-pulse">Checking slug...</span>
              )}
              {slugStatus === 'available' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Available
                </span>
              )}
              {slugStatus === 'taken' && (
                <span className="text-red-400 flex items-center gap-1">
                  <AlertCircle size={12} /> Slug Already in Use
                </span>
              )}
            </div>
          </div>
          {errors.slug && (
            <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> {errors.slug}
            </p>
          )}
        </div>
      </div>

      {/* ==================================================
          2. LEAD SUMMARY
          ================================================== */}
      <div>
        <label className="block text-xs font-mono font-bold uppercase text-slate-300 mb-1.5 flex items-center justify-between">
          <span>Short Summary (Lead Paragraph) <strong className="text-red-400">*</strong></span>
          <span
            className={`text-[10px] font-mono ${
              summary.length < 10 ? 'text-amber-400' : 'text-slate-500'
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
          className={`w-full bg-[#080c14] border ${
            errors.summary ? 'border-red-500/80' : 'border-slate-800 focus:border-blue-500'
          } rounded-sm p-3 text-xs sm:text-sm text-slate-200 placeholder-slate-600 focus:outline-none leading-relaxed transition-all`}
        />
        {errors.summary && (
          <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
            <AlertCircle size={12} /> {errors.summary}
          </p>
        )}
      </div>

      {/* ==================================================
          3. TAXONOMY & CLASSIFICATION
          ================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
        {/* Article Type */}
        <div>
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
            Article Type
          </label>
          <select
            value={articleType}
            onChange={(e) => onChange({ articleType: e.target.value })}
            className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
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
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1 flex items-center justify-between">
            <span>Primary Category <strong className="text-red-400">*</strong></span>
            {loadingCategories && <span className="text-[9px] text-blue-400">Loading...</span>}
          </label>
          <select
            value={categorySlug}
            onChange={(e) => handleCategorySelect(e.target.value)}
            disabled={loadingCategories || categories.length === 0}
            className={`w-full bg-[#080c14] border ${
              errors.categorySlug ? 'border-red-500/80' : 'border-slate-800 focus:border-blue-500'
            } rounded-sm px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none`}
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
          <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 mb-1">
            Subcategory (Optional)
          </label>
          <select
            value={subCategory || ''}
            onChange={(e) => onChange({ subCategory: e.target.value || undefined })}
            disabled={subcategories.length === 0}
            className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none disabled:opacity-50"
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
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <TagIcon size={12} className="text-sky-400" />
            <span>Indexed Tags &amp; Keywords ({tags.length}/10)</span>
          </span>
          <span className="text-[10px] text-slate-500">Press Enter or Add</span>
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
            className="flex-1 bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddTag}
            disabled={!tagInput.trim() || tags.length >= 10}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors"
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
                className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#0e1424] text-slate-300 border border-slate-700/80 rounded-sm text-xs"
              >
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
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
          5. FEATURED IMAGE PLACEHOLDER
          ================================================== */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <label className="block text-[11px] font-mono font-bold uppercase text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <ImageIcon size={12} className="text-sky-400" />
            <span>Featured Image (URL Reference)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Phase 8 Ready</span>
        </label>

        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <div className="flex-1 w-full">
            <input
              type="url"
              value={featuredImage || ''}
              onChange={(e) => onChange({ featuredImage: e.target.value })}
              placeholder="https://images.unsplash.com/... or public image URL"
              className="w-full bg-[#080c14] border border-slate-800 focus:border-blue-500 rounded-sm px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Provide a valid direct image URL. Dedicated cloud storage file upload will be integrated in future media management phases.
            </p>
          </div>

          {/* Image Thumbnail Preview */}
          <div className="w-24 h-16 bg-[#080c14] border border-slate-800 rounded-sm overflow-hidden flex items-center justify-center shrink-0">
            {featuredImage && isValidUrl(featuredImage) ? (
              <img
                src={featuredImage}
                alt="Preview"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[9px] font-mono text-slate-600 text-center px-1">
                No Preview
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
