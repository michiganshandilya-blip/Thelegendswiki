import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleSection, ArticleCitation, ArticleInfobox } from '../types';
import { createArticle, isSlugAvailable } from '../services/articleService';
import { validateArticle } from '../lib/validation';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { EditorMetadata } from '../components/editor/EditorMetadata';
import { EditorSectionList } from '../components/editor/EditorSectionList';
import { EditorInfobox } from '../components/editor/EditorInfobox';
import { EditorReferences } from '../components/editor/EditorReferences';
import { EditorPreviewModal } from '../components/editor/EditorPreviewModal';
import { UnsavedChangesDialog } from '../components/editor/UnsavedChangesDialog';
import {
  Save,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';

export const CreateArticlePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, isEditor, isAuthenticated } = useAuth();

  // Form State
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [articleType, setArticleType] = useState<string>('general');
  const [category, setCategory] = useState<string>('History & Civilizations');
  const [categorySlug, setCategorySlug] = useState<string>('history');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [infobox, setInfobox] = useState<ArticleInfobox | undefined>(undefined);
  const [citations, setCitations] = useState<ArticleCitation[]>([]);
  const [sections, setSections] = useState<ArticleSection[]>([
    {
      id: 'overview',
      title: 'Historical Background',
      content: [''],
      bulletPoints: [],
    },
  ]);

  // UI & Workflow states
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<{
    message: string;
    actionSlug?: string;
  } | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentDocIdRef = useRef<string | null>(null);

  // Redirect if unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/create');
    }
  }, [isAuthenticated, navigate]);

  // Warn on browser tab close/refresh if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Mark dirty whenever form changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
    setSaveStatus('unsaved');
  };

  // Build unified article payload object
  const buildArticlePayload = (targetStatus: 'draft' | 'pending_review' | 'published'): Omit<Article, 'id'> => {
    const readingTime = Math.max(
      2,
      Math.ceil(
        (summary.length + sections.reduce((acc, s) => acc + s.content.join(' ').length, 0)) / 1000
      )
    );

    const authorDisplayName =
      profile?.displayName || user?.displayName || profile?.username || 'Contributor';

    return {
      title: title.trim(),
      slug: slug.trim(),
      summary: summary.trim(),
      articleType: articleType as any,
      content: sections.map((s) => s.content.join('\n\n')).join('\n\n'),
      featuredImage: featuredImage.trim() || undefined,
      image: featuredImage.trim() || undefined,
      infobox: infobox || undefined,
      sections,
      references: citations,
      citations,
      categories: [categorySlug],
      category,
      categorySlug,
      subCategory: subCategory || undefined,
      tags,
      authorId: user?.uid || 'anonymous-contributor',
      author: authorDisplayName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      status: targetStatus,
      views: 0,
      viewCount: 0,
      readingTimeMinutes: readingTime,
      relatedArticleSlugs: [],
    };
  };

  // Save as Draft or Submit for Review
  const handleSaveArticle = async (targetStatus: 'draft' | 'pending_review' | 'published') => {
    setGeneralError(null);
    setValidationErrors({});
    setSaving(true);
    setSaveStatus('saving');

    const payload = buildArticlePayload(targetStatus);

    // Validate if submitting for review
    if (targetStatus === 'pending_review' || targetStatus === 'published') {
      const validation = validateArticle(payload);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setGeneralError('Please resolve the highlighted validation errors before submitting.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }

      // Verify sections have at least some written content
      const hasContent = sections.some((s) => s.content.some((p) => p.trim().length > 0));
      if (!hasContent) {
        setGeneralError('Please add at least one paragraph of content to your article.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    } else {
      // For draft, at least title and slug are required
      if (!title.trim()) {
        setValidationErrors({ title: 'Article draft requires at least a title.' });
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
      if (!slug.trim()) {
        setValidationErrors({ slug: 'Article draft requires a URL slug.' });
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    }

    // Check slug uniqueness
    const slugAvailable = await isSlugAvailable(slug, currentDocIdRef.current || undefined);
    if (!slugAvailable) {
      setValidationErrors((prev) => ({
        ...prev,
        slug: 'An article with this URL slug already exists. Please choose a unique slug.',
      }));
      setSaving(false);
      setSaveStatus('unsaved');
      return;
    }

    try {
      if (currentDocIdRef.current) {
        const { updateArticle } = await import('../services/articleService');
        await updateArticle(currentDocIdRef.current, payload);
      } else {
        const res = await createArticle(payload);
        if (!res.success) {
          setValidationErrors(res.errors || {});
          setGeneralError('Failed to save article. Please check the form fields.');
          setSaving(false);
          setSaveStatus('unsaved');
          return;
        }
        currentDocIdRef.current = res.id;
      }

      setIsDirty(false);
      setSaveStatus('saved');
      setLastSavedTime(new Date().toLocaleTimeString());

      if (targetStatus === 'pending_review') {
        setSuccessNotice({
          message:
            'Your article has been successfully submitted for editorial peer review! You can track its status under My Articles.',
          actionSlug: slug,
        });
      } else if (targetStatus === 'published') {
        setSuccessNotice({
          message: 'Article successfully published to the public encyclopedia!',
          actionSlug: slug,
        });
      } else {
        setSuccessNotice({
          message: 'Draft saved successfully. You can continue writing or return later.',
        });
      }
    } catch (err: any) {
      console.error('Error saving article:', err);
      setGeneralError(err.message || 'An error occurred while saving your article.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  // Safe navigation with unsaved changes prompt
  const handleSafeNavigate = (url: string) => {
    if (isDirty) {
      setPendingExitUrl(url);
      setShowExitDialog(true);
    } else {
      navigate(url);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Contributor Workspace', path: '/my-articles' },
          { label: 'Create New Entry' },
        ]}
      />

      {/* ==================================================
          STICKY TOP TOOLBAR & STATUS BAR
          ================================================== */}
      <div className="bg-[#090e1a]/95 backdrop-blur border border-slate-800 rounded-sm p-4 sticky top-14 z-30 shadow-xl shadow-black/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-sm text-sky-400 shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 font-display leading-tight">
              Article Contribution Workspace
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle size={12} /> All changes saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                </span>
              )}
              {saveStatus === 'saving' && (
                <span className="text-sky-400 animate-pulse flex items-center gap-1">
                  <Clock size={12} /> Saving draft to database...
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock size={12} /> Unsaved changes in buffer
                </span>
              )}
              {saveStatus === 'idle' && <span>New Article Draft</span>}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-[#1a253c] text-slate-300 hover:text-slate-100 border border-slate-700/80 rounded-sm text-xs font-semibold transition-all cursor-pointer"
          >
            <Eye size={14} className="text-sky-400" />
            <span>Preview</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={() => handleSaveArticle('draft')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          {/* Submit for Review Button */}
          <button
            type="button"
            onClick={() => handleSaveArticle('pending_review')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-md shadow-blue-900/30"
          >
            <Send size={14} />
            <span>Submit for Review</span>
          </button>

          {/* Direct Publish for Editors/Admins */}
          {isEditor && (
            <button
              type="button"
              onClick={() => handleSaveArticle('published')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold transition-all cursor-pointer shadow-sm ml-1"
              title="Editor privilege: Directly publish entry to registry"
            >
              <Sparkles size={14} />
              <span>Publish Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-sm text-emerald-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span>{successNotice.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {successNotice.actionSlug && (
              <button
                type="button"
                onClick={() => navigate(`/wiki/${successNotice.actionSlug}`)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold cursor-pointer transition-colors"
              >
                View Article &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-articles')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
            >
              My Contributions
            </button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-sm text-red-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* ==================================================
          SECTION 1: CORE ARTICLE METADATA
          ================================================== */}
      <EditorMetadata
        title={title}
        slug={slug}
        summary={summary}
        articleType={articleType}
        category={category}
        categorySlug={categorySlug}
        subCategory={subCategory}
        tags={tags}
        featuredImage={featuredImage}
        currentArticleId={currentDocIdRef.current || undefined}
        onChange={(fields) => {
          markDirty();
          if (fields.title !== undefined) setTitle(fields.title);
          if (fields.slug !== undefined) setSlug(fields.slug);
          if (fields.summary !== undefined) setSummary(fields.summary);
          if (fields.articleType !== undefined) setArticleType(fields.articleType);
          if (fields.category !== undefined) setCategory(fields.category);
          if (fields.categorySlug !== undefined) setCategorySlug(fields.categorySlug);
          if (fields.subCategory !== undefined) setSubCategory(fields.subCategory);
          if (fields.tags !== undefined) setTags(fields.tags);
          if (fields.featuredImage !== undefined) setFeaturedImage(fields.featuredImage);
        }}
        errors={validationErrors}
      />

      {/* ==================================================
          SECTION 2: ARTICLE BODY & SECTIONS
          ================================================== */}
      <EditorSectionList
        sections={sections}
        onChange={(newSections) => {
          markDirty();
          setSections(newSections);
        }}
      />

      {/* ==================================================
          SECTION 3: FACT SHEET (INFOBOX)
          ================================================== */}
      <EditorInfobox
        infobox={infobox}
        articleTitle={title}
        articleType={articleType as any}
        onChange={(newInfobox) => {
          markDirty();
          setInfobox(newInfobox);
        }}
      />

      {/* ==================================================
          SECTION 4: ACADEMIC REFERENCES & CITATIONS
          ================================================== */}
      <EditorReferences
        citations={citations}
        onChange={(newCitations) => {
          markDirty();
          setCitations(newCitations);
        }}
      />

      {/* Bottom Action Strip */}
      <div className="p-4 bg-[#0a0f1d] border border-slate-800 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500">Author Credit:</span>
          <span className="text-slate-200 font-semibold">
            {profile?.displayName || user?.displayName || profile?.username || 'Contributor'}
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-slate-400 uppercase">Role: {profile?.role || 'Registered User'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSafeNavigate('/my-articles')}
            className="px-3 py-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            Cancel / Return to Contributions
          </button>
          <button
            type="button"
            onClick={() => handleSaveArticle('pending_review')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-md"
          >
            <Send size={14} />
            <span>Submit for Review</span>
          </button>
        </div>
      </div>

      {/* Live Preview Modal */}
      <EditorPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        article={buildArticlePayload('draft')}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesDialog
        isOpen={showExitDialog}
        onCancel={() => setShowExitDialog(false)}
        onConfirm={() => {
          setShowExitDialog(false);
          setIsDirty(false);
          if (pendingExitUrl) navigate(pendingExitUrl);
        }}
      />
    </div>
  );
};
