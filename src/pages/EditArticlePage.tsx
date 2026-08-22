import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleSection, ArticleCitation, ArticleInfobox, ArticleStatus } from '../types';
import { getArticleBySlugOrId, updateArticle } from '../services/articleService';
import { createRevision } from '../services/revisionService';
import { validateArticle, validateImageAlt } from '../lib/validation';
import { mapToStandardDossierSections } from '../lib/dossierStructure';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { EditorMetadata } from '../components/editor/EditorMetadata';
import { EditorSectionList } from '../components/editor/EditorSectionList';
import { EditorInfobox } from '../components/editor/EditorInfobox';
import { EditorReferences } from '../components/editor/EditorReferences';
import { EditorPreviewModal } from '../components/editor/EditorPreviewModal';
import { UnsavedChangesDialog } from '../components/editor/UnsavedChangesDialog';
import { AiWritingToolsModal } from '../components/editor/AiWritingToolsModal';
import {
  Save,
  Send,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  FileEdit,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

interface EditArticlePageProps {
  slug: string;
}

export const EditArticlePage: React.FC<EditArticlePageProps> = ({ slug }) => {
  const { navigate } = useRouter();
  const { user, profile, isEditor, isAdmin, isAuthenticated, loading: authLoading } = useAuth();

  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [articleId, setArticleId] = useState<string>('');
  const [existingStatus, setExistingStatus] = useState<ArticleStatus>('draft');
  const [authorId, setAuthorId] = useState<string>('');
  const [authorName, setAuthorName] = useState<string>('');
  const [moderationNotes, setModerationNotes] = useState<string | undefined>(undefined);
  const [reviewedBy, setReviewedBy] = useState<string | undefined>(undefined);

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
  const [imageCaption, setImageCaption] = useState<string>('');
  const [imageCredit, setImageCredit] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [isSensitive, setIsSensitive] = useState<boolean>(false);
  const [contentSensitivity, setContentSensitivity] = useState<'normal' | 'sensitive'>('normal');
  const [sensitivityRationale, setSensitivityRationale] = useState<string>('');
  const [infobox, setInfobox] = useState<ArticleInfobox | undefined>(undefined);
  const [citations, setCitations] = useState<ArticleCitation[]>([]);
  const [sections, setSections] = useState<ArticleSection[]>([]);
  const [changeSummaryText, setChangeSummaryText] = useState<string>('');

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
  const [aiWritingModalOpen, setAiWritingModalOpen] = useState<boolean>(false);
  const [activeSectionAiIndex, setActiveSectionAiIndex] = useState<number | null>(null);
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
        const currentUserId = user?.uid || profile?.id;
        const isAuthor = currentUserId && art.authorId === currentUserId;
        if (!isAuthor && !isEditor && !isAdmin) {
          setPermissionDenied(true);
          return;
        }

        // Populate fields
        setArticleId(art.id);
        setExistingStatus(art.status || 'draft');
        setAuthorId(art.authorId || currentUserId || '');
        setAuthorName(art.author || 'Author');
        setModerationNotes(art.moderationNotes);
        setReviewedBy(art.reviewedBy);
        setTitle(art.title || '');
        setArticleSlug(art.slug || slug);
        setSummary(art.summary || '');
        setArticleType(art.articleType || 'general');
        setCategory(art.category || 'General');
        setCategorySlug(art.categorySlug || 'general');
        setSubCategory(art.subCategory || undefined);
        setTags(art.tags || []);
        setFeaturedImage(art.featuredImage || art.image || '');
        setImageCaption(art.imageCaption || '');
        setImageCredit(art.imageCredit || '');
        setImageAlt(art.imageAlt || '');
        setIsSensitive(Boolean(art.isSensitive || art.contentSensitivity === 'sensitive'));
        setContentSensitivity(art.isSensitive || art.contentSensitivity === 'sensitive' ? 'sensitive' : 'normal');
        setSensitivityRationale(art.sensitivityRationale || '');
        setInfobox(art.infobox || undefined);
        setCitations(art.citations || art.references || []);
        setSections(mapToStandardDossierSections(art.sections, art.content));
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
  }, [slug, user?.uid, profile?.id, isEditor, isAdmin, isAuthenticated, authLoading]);

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

  const buildArticlePayload = (targetStatus: ArticleStatus): Partial<Article> => {
    const readingTime = Math.max(
      2,
      Math.ceil(
        (summary.length + sections.reduce((acc, s) => acc + (s.content || []).join(' ').length, 0)) / 1000
      )
    );

    return {
      title: title.trim(),
      slug: articleSlug.trim(),
      summary: summary.trim(),
      articleType: articleType as any,
      content: sections.map((s) => (s.content || []).join('\n\n')).join('\n\n'),
      featuredImage: featuredImage.trim() || undefined,
      image: featuredImage.trim() || undefined,
      imageCaption: imageCaption.trim() || undefined,
      imageCredit: imageCredit.trim() || undefined,
      imageAlt: imageAlt.trim() || undefined,
      infobox: infobox || undefined,
      sections,
      references: citations,
      citations,
      categories: [categorySlug],
      category,
      categorySlug,
      subCategory: subCategory || undefined,
      tags,
      authorId: authorId || user?.uid || profile?.id,
      author: authorName || profile?.displayName || user?.displayName || 'Contributor',
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      status: targetStatus,
      isSensitive: Boolean(isSensitive || contentSensitivity === 'sensitive'),
      contentSensitivity: isSensitive || contentSensitivity === 'sensitive' ? 'sensitive' : 'normal',
      sensitivityRationale: sensitivityRationale.trim() || undefined,
      readingTimeMinutes: readingTime,
    };
  };

  const handleUpdate = async (targetStatus: ArticleStatus) => {
    setGeneralError(null);
    setValidationErrors({});
    setSaving(true);
    setSaveStatus('saving');

    const payload = buildArticlePayload(targetStatus);

    if (targetStatus === 'pending_review' || targetStatus === 'published') {
      const validation = validateArticle(payload as any);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setGeneralError('Please resolve the highlighted validation issues before submitting.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }

      // Check hero image alt text if image exists
      if (featuredImage) {
        const altCheck = validateImageAlt(imageAlt);
        if (!altCheck.isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            imageAlt: altCheck.message || 'Descriptive alt text is required for the main image.',
          }));
          setGeneralError(altCheck.message || 'Please provide descriptive alt text for your main image.');
          setSaving(false);
          setSaveStatus('unsaved');
          return;
        }
      }

      // Check section figures alt text
      for (let i = 0; i < sections.length; i++) {
        const fig = sections[i].figure;
        if (fig && fig.url) {
          const figAlt = validateImageAlt(fig.alt);
          if (!figAlt.isValid) {
            setGeneralError(`Section ${i + 1} (${sections[i].title}) figure requires descriptive alternative text.`);
            setSaving(false);
            setSaveStatus('unsaved');
            return;
          }
        }
      }
    }

    try {
      await updateArticle(articleId, payload);

      // Record revision entry in audit history
      const currentUserId = user?.uid || profile?.id || 'editor';
      const currentUserName = profile?.displayName || user?.displayName || profile?.username || 'Editor';

      const changeSummary =
        changeSummaryText.trim() ||
        (targetStatus === 'pending_review'
          ? 'Submitted updated version with citations & figures for review'
          : targetStatus === 'published'
          ? 'Published revised content and media assets'
          : 'Updated article draft');

      await createRevision({
        articleId,
        articleSlug: payload.slug || articleSlug,
        articleTitle: title,
        editorId: currentUserId,
        editorName: currentUserName,
        changeSummary,
        previousContent: '',
        newContent: typeof payload.content === 'string' ? payload.content : '',
        actionType:
          targetStatus === 'published'
            ? 'approval'
            : targetStatus === 'pending_review'
            ? 'submission'
            : 'draft_saved',
        createdAt: new Date().toISOString(),
      });

      setExistingStatus(targetStatus);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
      setSaveStatus('saved');
      setIsDirty(false);

      if (targetStatus === 'published') {
        setSuccessNotice({
          message: 'Changes saved and published live to the encyclopedia!',
          actionSlug: payload.slug || articleSlug,
        });
      } else if (targetStatus === 'pending_review') {
        setSuccessNotice({
          message: 'Changes submitted successfully for editorial moderation review.',
        });
      } else {
        setSuccessNotice({
          message: 'Article draft updated and saved successfully.',
        });
      }
    } catch (err: any) {
      console.error('Error updating article:', err);
      setGeneralError(err.message || 'Failed to update article.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-16 text-center space-y-3 font-mono text-sm text-[#54595d]">
        <div className="w-6 h-6 border-2 border-[#3366cc] border-t-transparent rounded-full animate-spin mx-auto" />
        <p>Loading archival record for editing...</p>
      </div>
    );
  }

  if (permissionDenied) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-800 space-y-2">
          <ShieldAlert size={36} className="mx-auto text-red-600" />
          <h2 className="font-serif text-xl font-bold">Editorial Clearance Required</h2>
          <p className="text-xs text-[#54595d]">
            You do not have permission to edit this article. Only the original author or verified Editors / Administrators can modify this document.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/wiki/${slug}`)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f8f9fa] border border-[#a2a9b1] hover:bg-[#eaecf0] text-xs font-semibold rounded-sm cursor-pointer font-mono"
        >
          <ArrowLeft size={13} /> Return to Article
        </button>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-sm text-amber-900 space-y-2">
          <AlertTriangle size={36} className="mx-auto text-amber-600" />
          <h2 className="font-serif text-xl font-bold">Article Record Not Found</h2>
          <p className="text-xs text-[#54595d]">
            No encyclopedia record matching "{slug}" could be located in our repository.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f8f9fa] border border-[#a2a9b1] hover:bg-[#eaecf0] text-xs font-semibold rounded-sm cursor-pointer font-mono"
        >
          <ArrowLeft size={13} /> Back to Encyclopedia
        </button>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Encyclopedia', path: '/' },
    { label: title || slug, path: `/wiki/${slug}` },
    { label: 'Edit Article Record' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Breadcrumbs */}
      <div className="border-b border-[#eaecf0] pb-2">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <FileEdit size={18} className="text-[#3366cc]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              Edit Article Record: <span className="italic">{title || slug}</span>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#54595d] mt-1 font-mono">
            <span>Status: <strong className="text-[#101418] uppercase">{existingStatus}</strong></span>
            <span>&bull;</span>
            <span>Author: <strong>{authorName}</strong></span>
            {isEditor && <span className="text-[#3366cc] font-semibold">(Editor Authority Active)</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Writing Assistant Button */}
          <button
            type="button"
            onClick={() => {
              setActiveSectionAiIndex(null);
              setAiWritingModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#3366cc] border border-blue-200 hover:border-[#3366cc] rounded-sm text-xs font-semibold font-serif cursor-pointer transition-all shadow-xs"
            title="Open AI Article Writing & Research Tools"
          >
            <Sparkles size={14} className="text-[#3366cc]" />
            <span>AI Writing Tools</span>
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
          >
            <Eye size={14} className="text-[#3366cc]" />
            <span>Preview Draft</span>
          </button>
        </div>
      </div>

      {/* Moderation Notes if changes requested */}
      {existingStatus === 'changes_requested' && moderationNotes && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-sm text-xs text-amber-900 space-y-1.5 shadow-xs">
          <div className="flex items-center gap-2 font-bold font-mono text-amber-950">
            <MessageSquare size={14} className="text-amber-700" />
            <span>Editorial Board Revision Request Notes:</span>
          </div>
          <p className="leading-relaxed pl-6 italic">"{moderationNotes}"</p>
        </div>
      )}

      {/* Success Notification */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-700 shrink-0" />
            <span className="font-medium">{successNotice.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {successNotice.actionSlug && (
              <button
                type="button"
                onClick={() => navigate(`/wiki/${successNotice.actionSlug}`)}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-semibold cursor-pointer"
              >
                View Article &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-articles')}
              className="px-3 py-1 bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer"
            >
              My Contributions
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {generalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Change Summary Input */}
      <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm p-4 space-y-2 shadow-xs">
        <label className="block text-xs font-bold text-[#101418] font-mono uppercase">
          Revision Summary / Edit Note (Recorded in Audit History)
        </label>
        <input
          type="text"
          value={changeSummaryText}
          onChange={(e) => {
            setChangeSummaryText(e.target.value);
            markDirty();
          }}
          placeholder="E.g., Added primary references for the 3rd century chronology, added section illustration..."
          className="w-full bg-[#f8f9fa] border border-[#a2a9b1] focus:border-[#3366cc] rounded-sm px-3 py-1.5 text-xs text-[#202122] placeholder-[#72777d] focus:outline-none font-sans"
        />
      </div>

      {/* Editor Sections */}
      <div className="space-y-6">
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
          imageCaption={imageCaption}
          imageCredit={imageCredit}
          imageAlt={imageAlt}
          isSensitive={isSensitive}
          contentSensitivity={contentSensitivity}
          sensitivityRationale={sensitivityRationale}
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
            if (fields.imageCaption !== undefined) setImageCaption(fields.imageCaption);
            if (fields.imageCredit !== undefined) setImageCredit(fields.imageCredit);
            if (fields.imageAlt !== undefined) setImageAlt(fields.imageAlt);
            if (fields.isSensitive !== undefined) setIsSensitive(fields.isSensitive);
            if (fields.contentSensitivity !== undefined) setContentSensitivity(fields.contentSensitivity);
            if (fields.sensitivityRationale !== undefined) setSensitivityRationale(fields.sensitivityRationale);
          }}
          errors={validationErrors}
        />

        <EditorSectionList
          sections={sections}
          citations={citations}
          categorySlug={categorySlug}
          categoryName={category}
          errors={validationErrors}
          onChange={(newSections) => {
            markDirty();
            setSections(newSections);
          }}
          onOpenAiWritingTools={(secIdx) => {
            setActiveSectionAiIndex(secIdx);
            setAiWritingModalOpen(true);
          }}
        />

        <EditorInfobox
          infobox={infobox}
          articleTitle={title}
          articleType={articleType as any}
          onChange={(newInfobox) => {
            markDirty();
            setInfobox(newInfobox);
          }}
        />

        <EditorReferences
          citations={citations}
          error={validationErrors.citations}
          onChange={(newCitations) => {
            markDirty();
            setCitations(newCitations);
          }}
        />
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="sticky bottom-0 z-30 bg-[#ffffff] border-t border-[#a2a9b1] p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#54595d]">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'saved'
              ? `Saved at ${lastSavedTime}`
              : isDirty
              ? 'Unsaved modifications'
              : 'Synced'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Save Draft */}
          <button
            type="button"
            onClick={() => handleUpdate('draft')}
            disabled={saving}
            className="px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors"
          >
            Save Draft
          </button>

          {/* Submit for Review or Direct Publish */}
          {isEditor ? (
            <button
              type="button"
              onClick={() => handleUpdate('published')}
              disabled={saving || !title.trim() || !summary.trim()}
              className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>{existingStatus === 'published' ? 'Publish Revision Live' : 'Approve & Publish Live'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpdate('pending_review')}
              disabled={saving || !title.trim() || !summary.trim()}
              className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Submit for Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <EditorPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        article={buildArticlePayload(existingStatus)}
      />

      {/* AI Writing Tools Modal */}
      <AiWritingToolsModal
        isOpen={aiWritingModalOpen}
        onClose={() => {
          setAiWritingModalOpen(false);
          setActiveSectionAiIndex(null);
        }}
        title={title}
        summary={summary}
        category={category}
        currentContent={
          activeSectionAiIndex !== null && sections[activeSectionAiIndex]
            ? (sections[activeSectionAiIndex].content || []).join('\n\n')
            : (sections[0]?.content || []).join('\n\n')
        }
        onApplySummary={(newSum) => {
          markDirty();
          setSummary(newSum);
        }}
        onApplyTitle={(newTitle, newSlug) => {
          markDirty();
          setTitle(newTitle);
          if (newSlug) setArticleSlug(newSlug);
        }}
        onApplyContent={(improvedText) => {
          markDirty();
          const targetIdx = activeSectionAiIndex !== null ? activeSectionAiIndex : 0;
          const copy = [...sections];
          const paras = improvedText.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
          if (copy[targetIdx]) {
            copy[targetIdx] = {
              ...copy[targetIdx],
              content: paras.length > 0 ? paras : [improvedText],
            };
            setSections(copy);
          }
        }}
        onAppendSection={(secTitle, paragraphs) => {
          markDirty();
          const newSection: ArticleSection = {
            id: `section-ai-${Date.now()}`,
            title: secTitle,
            content: paragraphs,
            bulletPoints: [],
          };
          setSections([...sections, newSection]);
        }}
      />

      {/* Exit Dialog */}
      <UnsavedChangesDialog
        isOpen={showExitDialog}
        onConfirm={() => {
          setIsDirty(false);
          setShowExitDialog(false);
          if (pendingExitUrl) navigate(pendingExitUrl);
        }}
        onCancel={() => {
          setShowExitDialog(false);
          setPendingExitUrl(null);
        }}
      />
    </div>
  );
};
