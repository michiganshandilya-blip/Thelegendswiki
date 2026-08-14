import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleSection, ArticleCitation, ArticleInfobox } from '../types';
import { getArticleBySlugOrId, updateArticle, isSlugAvailable } from '../services/articleService';
import { validateArticle } from '../lib/validation';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { LoadingState } from '../components/common/LoadingState';
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
  ShieldAlert,
  FileEdit,
  ArrowLeft,
} from 'lucide-react';

interface EditArticlePageProps {
  slug: string;
}

export const EditArticlePage: React.FC<EditArticlePageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { user, profile, isEditor, isAuthenticated, loading: authLoading } = useAuth();

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [articleId, setArticleId] = useState<string>('');
  const [existingStatus, setExistingStatus] = useState<'draft' | 'pending_review' | 'published' | 'archived'>('draft');
  const [authorId, setAuthorId] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');

  // Form State
  const [title, setTitle] = useState<string>('');
  const [articleSlug, setArticleSlug] = useState<string>(slug);
  const [summary, setSummary] = useState<string>('');
  const [articleType, setArticleType] = useState<string>('general');
  const [category, setCategory] = useState<string>('History & Civilizations');
  const [categorySlug, setCategorySlug] = useState<string>('history');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [infobox, setInfobox] = useState<ArticleInfobox | undefined>(undefined);
  const [citations, setCitations] = useState<ArticleCitation[]>([]);
  const [sections, setSections] = useState<ArticleSection[]>([]);

  // UI & Workflow states
  const [saving, setSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'idle'>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<{ message: string; actionSlug?: string } | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

  // Load article
  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (authLoading) return;

      if (!isAuthenticated) {
        navigate(`/login?redirect=/edit/${encodeURIComponent(slug)}`);
        return;
      }

      try {
        setInitialLoading(true);
        const art = await getArticleBySlugOrId(slug);

        if (!isMounted) return;

        if (!art) {
          setNotFound(true);
          return;
        }

        // Permission check: must be author OR editor/admin
        const isAuthor = user?.uid && art.authorId === user.uid;
        if (!isAuthor && !isEditor) {
          setPermissionDenied(true);
          return;
        }

        // Populate fields
        setArticleId(art.id);
        setExistingStatus(art.status || 'draft');
        setAuthorId(art.authorId || user?.uid || '');
        setAuthorName(art.author || 'Author');
        setTitle(art.title || '');
        setArticleSlug(art.slug || slug);
        setSummary(art.summary || '');
        setArticleType(art.articleType || 'general');
        setCategory(art.category || 'General');
        setCategorySlug(art.categorySlug || 'general');
        setSubCategory(art.subCategory || undefined);
        setTags(art.tags || []);
        setFeaturedImage(art.featuredImage || art.image || '');
        setInfobox(art.infobox || undefined);
        setCitations(art.citations || art.references || []);
        setSections(
          art.sections && art.sections.length > 0
            ? art.sections
            : [
                {
                  id: 'overview',
                  title: 'Overview',
                  content: [art.content || ''],
                  bulletPoints: [],
                },
              ]
        );
      } catch (err) {
        console.error('Error loading article for edit:', err);
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [slug, user?.uid, isEditor, isAuthenticated, authLoading]);

  // Warn on tab close if dirty
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

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
    setSaveStatus('unsaved');
  };

  const buildArticlePayload = (targetStatus: 'draft' | 'pending_review' | 'published' | 'archived'): Partial<Article> => {
    const readingTime = Math.max(
      2,
      Math.ceil(
        (summary.length + sections.reduce((acc, s) => acc + s.content.join(' ').length, 0)) / 1000
      )
    );

    return {
      title: title.trim(),
      slug: articleSlug.trim(),
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
      authorId: authorId || user?.uid,
      author: authorName || profile?.displayName || user?.displayName || 'Contributor',
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      status: targetStatus,
      readingTimeMinutes: readingTime,
    };
  };

  const handleUpdate = async (targetStatus: 'draft' | 'pending_review' | 'published') => {
    setGeneralError(null);
    setValidationErrors({});
    setSaving(true);
    setSaveStatus('saving');

    const payload = buildArticlePayload(targetStatus);

    if (targetStatus === 'pending_review' || targetStatus === 'published') {
      const validation = validateArticle(payload as any);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setGeneralError('Please resolve the highlighted validation errors before submitting.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    } else {
      if (!title.trim()) {
        setValidationErrors({ title: 'Article requires at least a title.' });
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    }

    // Slug check if changed
    if (articleSlug !== slug) {
      const available = await isSlugAvailable(articleSlug, articleId);
      if (!available) {
        setValidationErrors((prev) => ({
          ...prev,
          slug: 'This URL slug is already in use by another article.',
        }));
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    }

    try {
      await updateArticle(articleId, payload);
      setIsDirty(false);
      setSaveStatus('saved');
      setExistingStatus(targetStatus);
      setLastSavedTime(new Date().toLocaleTimeString());

      if (targetStatus === 'pending_review') {
        setSuccessNotice({
          message: 'Changes saved and article submitted for review!',
          actionSlug: articleSlug,
        });
      } else if (targetStatus === 'published') {
        setSuccessNotice({
          message: 'Article successfully updated and published!',
          actionSlug: articleSlug,
        });
      } else {
        setSuccessNotice({
          message: 'Draft revision saved successfully.',
        });
      }
    } catch (err: any) {
      console.error('Error updating article:', err);
      setGeneralError(err.message || 'An error occurred while updating the article.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading || authLoading) {
    return <LoadingState type="article" />;
  }

  if (permissionDenied) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-3 bg-amber-950/80 border border-amber-800/80 rounded-sm text-amber-400 inline-block">
          <ShieldAlert size={32} />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-100">
          Editorial Access Restricted
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          You do not have authorization to edit this article. Only the original contributor or platform editors can revise this document.
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-articles')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-semibold cursor-pointer"
        >
          Return to My Contributions
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-3 bg-slate-800 rounded-sm text-slate-400 inline-block">
          <AlertCircle size={32} />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-100">
          Article Not Found
        </h1>
        <p className="text-xs text-slate-400">
          Could not locate article with identifier "{slug}". It may have been deleted or moved.
        </p>
        <button
          type="button"
          onClick={() => navigate('/my-articles')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-semibold cursor-pointer"
        >
          Go to My Contributions
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      <Breadcrumbs
        items={[
          { label: 'My Contributions', path: '/my-articles' },
          { label: `Edit: ${title || slug}` },
        ]}
      />

      {/* Status Alert for Pending Review */}
      {existingStatus === 'pending_review' && (
        <div className="p-3.5 bg-blue-950/60 border border-blue-500/50 rounded-sm text-blue-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-sky-400 shrink-0" />
            <span>
              This article is currently <strong>Under Editorial Review</strong>. You can make revisions and re-save or convert back to draft.
            </span>
          </div>
          <span className="font-mono text-[10px] bg-blue-900/80 px-2 py-0.5 rounded border border-blue-700">
            Pending Review
          </span>
        </div>
      )}

      {/* Sticky Top Toolbar */}
      <div className="bg-[#090e1a]/95 backdrop-blur border border-slate-800 rounded-sm p-4 sticky top-14 z-30 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-sm text-sky-400 shrink-0">
            <FileEdit size={18} />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 font-display leading-tight">
              Edit Article: {title || slug}
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
              <span className="text-slate-500">Status:</span>
              <span className="uppercase text-sky-400 font-bold">{existingStatus}</span>
              {saveStatus === 'saved' && (
                <span className="text-emerald-400 flex items-center gap-1 ml-2">
                  <CheckCircle size={12} /> Saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                </span>
              )}
              {saveStatus === 'unsaved' && (
                <span className="text-amber-400 flex items-center gap-1 ml-2">
                  <Clock size={12} /> Unsaved changes
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141c2e] hover:bg-[#1a253c] text-slate-300 rounded-sm text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            <Eye size={14} className="text-sky-400" />
            <span>Preview</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdate('draft')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 border border-slate-700 rounded-sm text-xs font-semibold cursor-pointer"
          >
            <Save size={14} />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            onClick={() => handleUpdate('pending_review')}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-md"
          >
            <Send size={14} />
            <span>Submit for Review</span>
          </button>

          {isEditor && (
            <button
              type="button"
              onClick={() => handleUpdate('published')}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-sm ml-1"
            >
              <Sparkles size={14} />
              <span>Publish Changes</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-sm text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-400 shrink-0" />
            <span>{successNotice.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {successNotice.actionSlug && (
              <button
                type="button"
                onClick={() => navigate(`/wiki/${successNotice.actionSlug}`)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-sm text-xs font-semibold cursor-pointer"
              >
                View Live Article &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-articles')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-sm text-xs font-semibold cursor-pointer"
            >
              My Contributions
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {generalError && (
        <div className="p-4 bg-red-950/60 border border-red-500/50 rounded-sm text-red-200 text-xs sm:text-sm flex items-center gap-2.5 shadow-lg">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Metadata Form */}
      <EditorMetadata
        title={title}
        slug={articleSlug}
        summary={summary}
        articleType={articleType}
        category={category}
        categorySlug={categorySlug}
        subCategory={subCategory}
        tags={tags}
        featuredImage={featuredImage}
        currentArticleId={articleId}
        onChange={(fields) => {
          markDirty();
          if (fields.title !== undefined) setTitle(fields.title);
          if (fields.slug !== undefined) setArticleSlug(fields.slug);
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

      {/* Sections List */}
      <EditorSectionList
        sections={sections}
        onChange={(newSections) => {
          markDirty();
          setSections(newSections);
        }}
      />

      {/* Infobox */}
      <EditorInfobox
        infobox={infobox}
        articleTitle={title}
        articleType={articleType as any}
        onChange={(newInfobox) => {
          markDirty();
          setInfobox(newInfobox);
        }}
      />

      {/* References */}
      <EditorReferences
        citations={citations}
        onChange={(newCitations) => {
          markDirty();
          setCitations(newCitations);
        }}
      />

      {/* Live Preview Modal */}
      <EditorPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        article={buildArticlePayload(existingStatus)}
      />

      {/* Unsaved Changes Confirmation */}
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
