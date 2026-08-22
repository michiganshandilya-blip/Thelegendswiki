import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleSection, ArticleCitation, ArticleInfobox } from '../types';
import { createArticle, isSlugAvailable } from '../services/articleService';
import { validateArticle, validateImageAlt } from '../lib/validation';
import { createDefaultDossierSections } from '../lib/dossierStructure';
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
  Sparkles,
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
  const [category, setCategory] = useState<string>('Behind Financial Markets');
  const [categorySlug, setCategorySlug] = useState<string>('behind-financial-markets');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [behindCurtainsContext, setBehindCurtainsContext] = useState<string>('');
  const [isSensitive, setIsSensitive] = useState<boolean>(false);
  const [contentSensitivity, setContentSensitivity] = useState<'normal' | 'sensitive'>('normal');
  const [sensitivityRationale, setSensitivityRationale] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [featuredImage, setFeaturedImage] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [imageCredit, setImageCredit] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [infobox, setInfobox] = useState<ArticleInfobox | undefined>(undefined);
  const [citations, setCitations] = useState<ArticleCitation[]>([]);
  const [sections, setSections] = useState<ArticleSection[]>(() => createDefaultDossierSections());

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
  const [aiWritingModalOpen, setAiWritingModalOpen] = useState<boolean>(false);
  const [activeSectionAiIndex, setActiveSectionAiIndex] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [showExitDialog, setShowExitDialog] = useState<boolean>(false);
  const [pendingExitUrl, setPendingExitUrl] = useState<string | null>(null);

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
        (summary.length + sections.reduce((acc, s) => acc + (s.content || []).join(' ').length, 0)) / 1000
      )
    );

    const authorDisplayName =
      profile?.displayName || user?.displayName || profile?.username || 'Contributor';

    return {
      title: title.trim(),
      slug: slug.trim(),
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
      isSensitive: Boolean(isSensitive || contentSensitivity === 'sensitive'),
      contentSensitivity: isSensitive || contentSensitivity === 'sensitive' ? 'sensitive' : 'normal',
      sensitivityRationale: sensitivityRationale.trim() || undefined,
      isBehindCurtains: true,
      curtainLayer: 'behind_curtains',
      behindCurtainsContext: behindCurtainsContext.trim() || undefined,
      knowledgeDepth: 'Documented Fact',
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
    setSuccessNotice(null);
    setSaving(true);
    setSaveStatus('saving');

    const payload = buildArticlePayload(targetStatus);

    // Validate payload when publishing or submitting for review
    if (targetStatus === 'pending_review' || targetStatus === 'published') {
      const validation = validateArticle(payload as any);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setGeneralError('Please correct the highlighted validation issues before submission.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }

      // If featured image is provided, validate alt text
      if (featuredImage) {
        const altCheck = validateImageAlt(imageAlt);
        if (!altCheck.isValid) {
          setValidationErrors((prev) => ({
            ...prev,
            imageAlt: altCheck.message || 'Descriptive alternative text is required.',
          }));
          setGeneralError(altCheck.message || 'Please provide descriptive alt text for your main image.');
          setSaving(false);
          setSaveStatus('unsaved');
          return;
        }
      }

      // Check section figures for alt text
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

      // Verify slug availability
      const available = await isSlugAvailable(slug, currentDocIdRef.current || undefined);
      if (!available) {
        setValidationErrors((prev) => ({ ...prev, slug: 'This URL slug is already taken.' }));
        setGeneralError('This URL slug is already registered. Please modify the slug.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }
    }

    try {
      const newId = await createArticle(payload as any);
      currentDocIdRef.current = newId;

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
      setSaveStatus('saved');
      setIsDirty(false);

      if (targetStatus === 'published') {
        setSuccessNotice({
          message: 'Article successfully created and published to the live encyclopedia!',
          actionSlug: payload.slug,
        });
      } else if (targetStatus === 'pending_review') {
        setSuccessNotice({
          message: 'Article submitted successfully! It is now pending editorial review by our verification board.',
        });
      } else {
        setSuccessNotice({
          message: 'Draft saved securely. You can return anytime to continue editing.',
        });
      }
    } catch (err: any) {
      console.error('Error creating article:', err);
      setGeneralError(err.message || 'Failed to save article. Please check your network connection and retry.');
      setSaveStatus('unsaved');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Encyclopedia Desk', path: '/' },
    { label: 'Create Encyclopedia Entry' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <div className="border-b border-[#eaecf0] pb-2">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Editor Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#f8f9fa] border border-[#a2a9b1] rounded-sm p-4 sm:p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#3366cc]" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#101418]">
              Create New Encyclopedia Record
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#54595d] mt-1 font-sans">
            Author clear, academic-standard articles with structured sections, archival illustrations, and verified citations.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
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

          {/* Live Preview Button */}
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
          >
            <Eye size={14} className="text-[#3366cc]" />
            <span>Preview Article</span>
          </button>

          {/* Save Draft Button */}
          <button
            type="button"
            onClick={() => handleSaveArticle('draft')}
            disabled={saving || !title.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] disabled:opacity-40 text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>

          {/* Submit for Review or Direct Publish */}
          {isEditor ? (
            <button
              type="button"
              onClick={() => handleSaveArticle('published')}
              disabled={saving || !title.trim() || !summary.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-all"
            >
              <Send size={14} />
              <span>Publish Live</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveArticle('pending_review')}
              disabled={saving || !title.trim() || !summary.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-all"
            >
              <Send size={14} />
              <span>Submit for Review</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-sm text-emerald-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-700 shrink-0" />
            <span className="font-medium">{successNotice.message}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {successNotice.actionSlug && (
              <button
                type="button"
                onClick={() => navigate(`/wiki/${successNotice.actionSlug}`)}
                className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-sm text-xs font-semibold cursor-pointer transition-colors"
              >
                View Article &rarr;
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/my-articles')}
              className="px-3 py-1 bg-[#f8f9fa] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
            >
              My Contributions
            </button>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {generalError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-sm text-red-700 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* ==================================================
          SECTION 1: CORE ARTICLE METADATA & HERO IMAGE
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
        imageCaption={imageCaption}
        imageCredit={imageCredit}
        imageAlt={imageAlt}
        isSensitive={isSensitive}
        contentSensitivity={contentSensitivity}
        sensitivityRationale={sensitivityRationale}
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
          if (fields.imageCaption !== undefined) setImageCaption(fields.imageCaption);
          if (fields.imageCredit !== undefined) setImageCredit(fields.imageCredit);
          if (fields.imageAlt !== undefined) setImageAlt(fields.imageAlt);
          if (fields.isSensitive !== undefined) setIsSensitive(fields.isSensitive);
          if (fields.contentSensitivity !== undefined) setContentSensitivity(fields.contentSensitivity);
          if (fields.sensitivityRationale !== undefined) setSensitivityRationale(fields.sensitivityRationale);
        }}
        errors={validationErrors}
      />

      {/* ==================================================
          SECTION 2: ARTICLE BODY & SECTION FIGURES
          ================================================== */}
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
        error={validationErrors.citations}
        onChange={(newCitations) => {
          markDirty();
          setCitations(newCitations);
        }}
      />

      {/* Bottom Action Strip */}
      <div className="p-4 bg-[#ffffff] border border-[#a2a9b1] rounded-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#54595d] shadow-xs">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#72777d]">Author Credit:</span>
          <span className="text-[#101418] font-semibold">
            {profile?.displayName || user?.displayName || profile?.username || 'Contributor'}
          </span>
          <span className="text-[#cbd5e1]">&bull;</span>
          <span className="text-[#54595d] uppercase">Role: {profile?.role || 'Registered User'}</span>
          {lastSavedTime && (
            <>
              <span className="text-[#cbd5e1]">&bull;</span>
              <span className="text-emerald-700 flex items-center gap-1">
                <Clock size={11} /> Saved at {lastSavedTime}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Preview Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveArticle(isEditor ? 'published' : 'pending_review')}
            disabled={saving || !title.trim() || !summary.trim()}
            className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            {saving ? 'Processing...' : isEditor ? 'Publish Article Live' : 'Submit for Editorial Review'}
          </button>
        </div>
      </div>

      {/* Article Live Preview Modal */}
      <EditorPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        article={buildArticlePayload('draft')}
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
          if (newSlug) setSlug(newSlug);
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

      {/* Unsaved Changes Confirmation Dialog */}
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
