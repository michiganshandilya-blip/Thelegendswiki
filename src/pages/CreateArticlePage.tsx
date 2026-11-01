import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Article, ArticleSection, ArticleCitation, ArticleInfobox } from '../types';
import { createArticle, updateArticle, isSlugAvailable, deleteDraft, isArticlePublished, isArticlePublishedAsync } from '../services/articleService';
import { validateArticle, validateImageAlt, generateSlugFromTitle } from '../lib/validation';
import { createDefaultDossierSections } from '../lib/dossierStructure';
import { useSystemSettings } from '../hooks/useSystemSettings';
import { DESIGNATED_SUPER_ADMIN_EMAIL } from '../services/userService';
import {
  saveLocalDraftBackup,
  getLocalDraftBackup,
  clearLocalDraftBackup,
  clearAllDraftBackupsForArticle,
  hasMeaningfulDraftContent,
  recordPublishedArticleIdentity,
  isKnownPublishedIdentity,
  purgeNewDraftRecovery,
} from '../lib/draftStorage';
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
  RefreshCw,
  RotateCcw,
  Trash2,
} from 'lucide-react';

export const CreateArticlePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, profile, isEditor, isAuthenticated, loading: authLoading } = useAuth();
  const { settings: systemSettings } = useSystemSettings();

  const isSuperAdmin =
    (user?.email || '').toLowerCase() === DESIGNATED_SUPER_ADMIN_EMAIL.toLowerCase() ||
    profile?.role === 'super_admin';
  const isPlatformMaintenance = systemSettings.maintenanceMode && !isSuperAdmin;
  const isPublicSubmissionsPaused = !systemSettings.allowPublicSubmissions && !isEditor && !isSuperAdmin;

  // Form State
  const [title, setTitle] = useState<string>('');
  const [slug, setSlug] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [articleType, setArticleType] = useState<string>('general');
  const [category, setCategory] = useState<string>('Behind Financial Markets');
  const [categorySlug, setCategorySlug] = useState<string>('behind-financial-markets');
  const [subCategory, setSubCategory] = useState<string | undefined>(undefined);
  const [region, setRegion] = useState<string>('Global');
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
  const [restoredNotice, setRestoredNotice] = useState<string | null>(null);
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
  const [showDiscardModal, setShowDiscardModal] = useState<boolean>(false);
  const [isDiscarding, setIsDiscarding] = useState<boolean>(false);

  const currentDraftIdRef = useRef<string | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initialRestoreDoneRef = useRef<boolean>(false);
  const isSavingRef = useRef<boolean>(false);
  const isPublishingRef = useRef<boolean>(false);

  const currentUserId = user?.uid || profile?.id || 'anonymous';

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login?redirect=/create');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Restore draft on mount
  useEffect(() => {
    if (authLoading || initialRestoreDoneRef.current) return;
    initialRestoreDoneRef.current = true;

    const restoreDraftOnMount = async () => {
      try {
        const backup = getLocalDraftBackup(currentUserId, 'new');
        if (backup && backup.data && hasMeaningfulDraftContent(backup.data)) {
          // SAFETY GUARD 1: If backup explicitly has status 'published' or 'pending_review', drop it immediately
          if (backup.data.status === 'published' || backup.data.status === 'pending_review') {
            purgeNewDraftRecovery(currentUserId);
            if (backup.docId) clearLocalDraftBackup(currentUserId, backup.docId);
            return;
          }

          // SAFETY GUARD 2: Check if backup belongs to an already published article (synchronous & async)
          const candidateId = backup.docId || backup.data.id;
          const candidateSlug = backup.data.slug;
          if (
            isKnownPublishedIdentity(candidateId) ||
            isKnownPublishedIdentity(candidateSlug) ||
            isArticlePublished(candidateId) ||
            isArticlePublished(candidateSlug) ||
            (await isArticlePublishedAsync(candidateId)) ||
            (await isArticlePublishedAsync(candidateSlug))
          ) {
            purgeNewDraftRecovery(currentUserId);
            if (candidateId) clearLocalDraftBackup(currentUserId, candidateId);
            return;
          }

          const d = backup.data;
          if (d.title !== undefined) setTitle(d.title);
          if (d.slug !== undefined) setSlug(d.slug);
          if (d.summary !== undefined) setSummary(d.summary);
          if (d.articleType !== undefined) setArticleType(d.articleType);
          if (d.category !== undefined) setCategory(d.category);
          if (d.categorySlug !== undefined) setCategorySlug(d.categorySlug);
          if (d.subCategory !== undefined) setSubCategory(d.subCategory);
          if (d.behindCurtainsContext !== undefined) setBehindCurtainsContext(d.behindCurtainsContext);
          if (d.isSensitive !== undefined) setIsSensitive(d.isSensitive);
          if (d.contentSensitivity !== undefined) setContentSensitivity(d.contentSensitivity);
          if (d.sensitivityRationale !== undefined) setSensitivityRationale(d.sensitivityRationale);
          if (d.tags !== undefined) setTags(d.tags);
          if (d.featuredImage !== undefined) setFeaturedImage(d.featuredImage);
          if (d.imageCaption !== undefined) setImageCaption(d.imageCaption);
          if (d.imageCredit !== undefined) setImageCredit(d.imageCredit);
          if (d.imageAlt !== undefined) setImageAlt(d.imageAlt);
          if (d.infobox !== undefined) setInfobox(d.infobox);
          if (d.citations !== undefined) setCitations(d.citations);
          if (d.sections && d.sections.length > 0) setSections(d.sections);

          // Only keep draft ID if it is a dedicated draft ID
          if (backup.docId && backup.docId.startsWith('draft-')) {
            currentDraftIdRef.current = backup.docId;
          } else {
            currentDraftIdRef.current = null;
          }

          const savedDate = backup.savedAt ? new Date(backup.savedAt) : new Date();
          const timeStr = savedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setLastSavedTime(timeStr);
          setSaveStatus('saved');
          setRestoredNotice(`Auto-recovered your previous draft from ${timeStr}.`);
        }
      } catch (err) {
        console.warn('Draft auto-recovery notice:', err);
      }
    };

    restoreDraftOnMount();
  }, [authLoading, currentUserId]);

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

  // Build unified article payload object
  const buildArticlePayload = useCallback(
    (targetStatus: 'draft' | 'pending_review' | 'published'): Omit<Article, 'id'> => {
      const readingTime = Math.max(
        2,
        Math.ceil(
          (summary.length +
            sections.reduce(
              (acc, s) =>
                acc +
                (s.content || []).join(' ').length +
                (s.bulletPoints || []).join(' ').length,
              0
            )) / 1000
        )
      );

      const authorDisplayName =
        profile?.displayName || user?.displayName || profile?.username || 'Contributor';

      const cleanTitle = title.trim() || (targetStatus === 'draft' ? 'Untitled Draft' : '');
      const cleanSlug =
        slug.trim() ||
        generateSlugFromTitle(cleanTitle) ||
        (targetStatus === 'draft' ? `draft-${Date.now()}` : `entry-${Date.now()}`);

      const cleanImage = featuredImage.trim() || undefined;
      const cleanImageAlt = imageAlt.trim() || (cleanTitle ? `Illustration for ${cleanTitle}` : 'Article illustration');

      return {
        title: cleanTitle,
        slug: cleanSlug,
        summary: summary.trim(),
        articleType: articleType as any,
        content: sections.map((s) => (s.content || []).join('\n\n')).join('\n\n'),
        featuredImage: cleanImage,
        image: cleanImage,
        imageCaption: imageCaption.trim() || undefined,
        imageCredit: imageCredit.trim() || undefined,
        imageAlt: cleanImage ? cleanImageAlt : undefined,
        infobox: infobox || undefined,
        sections,
        references: citations,
        citations,
        categories: [categorySlug || 'general'],
        category: category || 'General',
        categorySlug: categorySlug || 'general',
        subCategory: subCategory || undefined,
        region: region || 'Global',
        tags: tags && tags.length > 0 ? tags : [categorySlug || 'general'],
        authorId: user?.uid || profile?.id || 'anonymous-contributor',
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
    },
    [
      title,
      slug,
      summary,
      articleType,
      category,
      categorySlug,
      subCategory,
      behindCurtainsContext,
      isSensitive,
      contentSensitivity,
      sensitivityRationale,
      region,
      tags,
      featuredImage,
      imageCaption,
      imageCredit,
      imageAlt,
      infobox,
      citations,
      sections,
      profile,
      user,
    ]
  );

  // Background Auto-Save execution
  const executeAutoSave = useCallback(async () => {
    if (isSavingRef.current || isPublishingRef.current) return;
    const payload = buildArticlePayload('draft');

    // Only auto-save if there's meaningful content
    if (!hasMeaningfulDraftContent(payload)) return;

    // Ensure draft has a dedicated draft ID
    if (!currentDraftIdRef.current || !currentDraftIdRef.current.startsWith('draft-')) {
      currentDraftIdRef.current = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const draftId = currentDraftIdRef.current;

    // Immediately persist to local recovery storage
    saveLocalDraftBackup(currentUserId, 'new', payload, draftId);

    isSavingRef.current = true;
    setSaveStatus('saving');

    try {
      const actorInfo = { uid: currentUserId, email: user?.email || undefined, role: profile?.role };
      const draftPayload = { ...payload, id: draftId };
      const createRes = await createArticle(draftPayload as any, actorInfo);

      // If publishing was initiated while we were waiting, ABORT immediately!
      if (isPublishingRef.current) return;

      if (createRes.success) {
        saveLocalDraftBackup(currentUserId, 'new', payload, draftId);
      }

      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSavedTime(now);
      setSaveStatus('saved');
      setIsDirty(false);
    } catch (err) {
      console.warn('Background auto-save notice (local copy preserved):', err);
      // Even if network fails, local storage keeps the draft safe
      setSaveStatus('saved');
    } finally {
      isSavingRef.current = false;
    }
  }, [buildArticlePayload, currentUserId]);

  // Mark dirty and schedule debounced auto-save
  const markDirty = () => {
    if (isPublishingRef.current) return;
    setIsDirty(true);
    setSaveStatus('unsaved');

    if (!currentDraftIdRef.current || !currentDraftIdRef.current.startsWith('draft-')) {
      currentDraftIdRef.current = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Instantly save to local storage snapshot for zero data loss on immediate tab switch
    const currentPayload = buildArticlePayload('draft');
    saveLocalDraftBackup(currentUserId, 'new', currentPayload, currentDraftIdRef.current);

    // Debounce cloud auto-save by ~1.5s
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      executeAutoSave();
    }, 1500);
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Save as Draft or Submit for Review
  const handleSaveArticle = async (targetStatus: 'draft' | 'pending_review' | 'published') => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    setGeneralError(null);
    setValidationErrors({});
    setSuccessNotice(null);
    setSaving(true);
    setSaveStatus('saving');

    const effectiveTargetStatus: 'draft' | 'pending_review' | 'published' = targetStatus;

    if (effectiveTargetStatus === 'published' || effectiveTargetStatus === 'pending_review') {
      isPublishingRef.current = true;
    }

    const payload = buildArticlePayload(effectiveTargetStatus);

    // Validate payload when publishing or submitting for review
    if (effectiveTargetStatus === 'pending_review' || effectiveTargetStatus === 'published') {
      const validation = validateArticle(payload as any);
      if (!validation.isValid) {
        isPublishingRef.current = false;
        setValidationErrors(validation.errors);
        setGeneralError('Please correct the highlighted validation issues before submission.');
        setSaving(false);
        setSaveStatus('unsaved');
        return;
      }

      // Ensure imageAlt is populated with sensible default if missing
      if (payload.featuredImage && !payload.imageAlt) {
        payload.imageAlt = payload.title ? `Illustration for ${payload.title}` : 'Article illustration';
      }

      // Check section figures for alt text; auto-default if missing
      for (let i = 0; i < sections.length; i++) {
        const fig = sections[i].figure;
        if (fig && fig.url && (!fig.alt || fig.alt.trim().length === 0)) {
          fig.alt = `Figure illustration for section ${sections[i].title}`;
        }
      }

      // Verify slug availability; if taken, automatically append short random digits so it does not block submission
      const available = await isSlugAvailable(payload.slug);
      if (!available) {
        payload.slug = `${payload.slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    try {
      const existingDraftId = currentDraftIdRef.current;
      const actorInfo = { uid: currentUserId, email: user?.email || undefined, role: profile?.role };

      if (effectiveTargetStatus === 'draft') {
        if (!currentDraftIdRef.current || !currentDraftIdRef.current.startsWith('draft-')) {
          currentDraftIdRef.current = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        }
        const draftId = currentDraftIdRef.current;
        const draftPayload = { ...payload, id: draftId };
        const saveRes = await createArticle(draftPayload as any, actorInfo);
        if (!saveRes.success) {
          throw new Error(saveRes.error || 'Failed to save draft.');
        }

        saveLocalDraftBackup(currentUserId, 'new', payload, draftId);
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSavedTime(now);
        setSaveStatus('saved');
        setIsDirty(false);
        setSuccessNotice({
          message: 'Draft saved securely. You can return anytime to continue editing.',
        });
      } else {
        // PUBLISH OR SUBMIT FOR REVIEW
        // 1. Published article receives a brand new, permanent identity (art-*) completely independent from draft
        const createRes = await createArticle(payload as any, actorInfo);
        if (!createRes.success || !createRes.id) {
          const errorMsg =
            createRes.error ||
            (createRes.errors ? Object.values(createRes.errors).join(', ') : 'Failed to publish article.');
          throw new Error(errorMsg);
        }
        const finalPublishedId = createRes.id;
        const publishedSlug = (payload.slug || '').trim() || finalPublishedId.replace(/^art-/, '');

        // 2. Record published article identity in registry to permanently protect it from any draft operations
        recordPublishedArticleIdentity(finalPublishedId, payload.slug, publishedSlug);

        // 3. Clean up the draft document if one was created
        if (existingDraftId && existingDraftId.startsWith('draft-')) {
          try {
            await deleteDraft(existingDraftId, actorInfo);
          } catch (e) {
            console.warn('Draft cleanup notice after publishing:', e);
          }
        }

        // 4. Completely purge draft recovery caches
        purgeNewDraftRecovery(currentUserId);
        clearAllDraftBackupsForArticle(currentUserId, existingDraftId, payload.slug, 'new');
        currentDraftIdRef.current = null;

        // 5. Cancel any pending debounced auto-save
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
          autoSaveTimerRef.current = null;
        }

        // 6. Reset the editor form state to a completely fresh blank draft
        setTitle('');
        setSlug('');
        setSummary('');
        setArticleType('general');
        setCategory('Behind Financial Markets');
        setCategorySlug('behind-financial-markets');
        setSubCategory(undefined);
        setBehindCurtainsContext('');
        setIsSensitive(false);
        setContentSensitivity('normal');
        setSensitivityRationale('');
        setTags([]);
        setFeaturedImage('');
        setImageCaption('');
        setImageCredit('');
        setImageAlt('');
        setInfobox(undefined);
        setCitations([]);
        setSections(createDefaultDossierSections());
        setIsDirty(false);
        setSaveStatus('idle');
        setLastSavedTime(null);
        setRestoredNotice(null);
        setValidationErrors({});

        if (effectiveTargetStatus === 'published') {
          setSuccessNotice({
            message: 'Article successfully created and published to the live encyclopedia!',
            actionSlug: publishedSlug,
          });
        } else {
          setSuccessNotice({
            message: 'Article submitted successfully! It is now pending editorial review by our verification board.',
          });
        }
      }
    } catch (err: any) {
      console.error('Error saving article draft:', err);
      setGeneralError(err.message || 'Failed to save draft. Please check your network connection and retry.');
      setSaveStatus('unsaved');
    } finally {
      isPublishingRef.current = false;
      setSaving(false);
    }
  };

  // Discard local draft / delete draft and start fresh
  const handleConfirmDiscardDraft = async () => {
    try {
      setIsDiscarding(true);
      setGeneralError(null);
      const draftDocId = currentDraftIdRef.current;
      currentDraftIdRef.current = null;
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }

      // CRITICAL: Only delete if it is an actual draft document (starts with draft-)
      // NEVER delete a published article ID!
      if (draftDocId && draftDocId.startsWith('draft-')) {
        await deleteDraft(draftDocId, {
          uid: currentUserId,
          email: user?.email || undefined,
          role: profile?.role || 'user',
        });
      }

      purgeNewDraftRecovery(currentUserId);
      clearAllDraftBackupsForArticle(currentUserId, draftDocId, slug, 'new');

      setTitle('');
      setSlug('');
      setSummary('');
      setArticleType('general');
      setCategory('Behind Financial Markets');
      setCategorySlug('behind-financial-markets');
      setSubCategory(undefined);
      setBehindCurtainsContext('');
      setIsSensitive(false);
      setContentSensitivity('normal');
      setSensitivityRationale('');
      setTags([]);
      setFeaturedImage('');
      setImageCaption('');
      setImageCredit('');
      setImageAlt('');
      setInfobox(undefined);
      setCitations([]);
      setSections(createDefaultDossierSections());
      setIsDirty(false);
      setSaveStatus('idle');
      setLastSavedTime(null);
      setRestoredNotice(null);
      setGeneralError(null);
      setValidationErrors({});
      setShowDiscardModal(false);
    } catch (err: any) {
      console.error('Error discarding draft:', err);
      setGeneralError(err.message || 'Failed to delete draft.');
      setShowDiscardModal(false);
    } finally {
      setIsDiscarding(false);
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
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#54595d] font-sans">
            <span>Author clear, academic-standard articles with structured sections and verified citations.</span>
            {/* Auto-save status badge */}
            <span className="inline-flex items-center gap-1 font-mono px-2 py-0.5 rounded text-[11px] bg-white border border-[#c8ccd1]">
              {saveStatus === 'saving' ? (
                <>
                  <RefreshCw size={11} className="animate-spin text-[#3366cc]" />
                  <span className="text-[#3366cc] font-medium">Auto-saving...</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <CheckCircle size={11} className="text-emerald-700" />
                  <span className="text-emerald-700 font-medium">
                    Auto-saved {lastSavedTime ? `at ${lastSavedTime}` : ''}
                  </span>
                </>
              ) : isDirty ? (
                <>
                  <Clock size={11} className="text-amber-700" />
                  <span className="text-amber-700">Unsaved changes (saving...)</span>
                </>
              ) : (
                <span className="text-[#54595d]">Auto-save active</span>
              )}
            </span>
          </div>
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

          {/* Delete Draft Button (when draft has content) */}
          {(currentDraftIdRef.current || hasMeaningfulDraftContent({ title, summary, sections, tags, citations })) && (
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              disabled={saving || isDiscarding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-sm text-xs font-semibold font-mono cursor-pointer transition-all shadow-xs"
              title="Delete Draft"
            >
              <Trash2 size={13} />
              <span>Delete Draft</span>
            </button>
          )}

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
            <span>{saving ? 'Saving...' : 'Save Draft'}</span>
          </button>

          {/* Submit for Review or Direct Publish */}
          {isEditor && !systemSettings.requirePeerReview ? (
            <button
              type="button"
              onClick={() => handleSaveArticle('published')}
              disabled={saving || !title.trim() || isPlatformMaintenance}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-all"
            >
              <Send size={14} />
              <span>Publish Live</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSaveArticle('pending_review')}
              disabled={saving || !title.trim() || isPlatformMaintenance || isPublicSubmissionsPaused}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold font-mono cursor-pointer shadow-xs transition-all"
            >
              <Send size={14} />
              <span>{systemSettings.requirePeerReview ? 'Submit for Peer Review' : 'Submit for Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Platform Maintenance Mode Notice Banner */}
      {isPlatformMaintenance && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-sm text-amber-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="text-amber-600 shrink-0" />
          <span>
            <strong>Platform Maintenance Mode Active:</strong> Platform article authoring is frozen and restricted exclusively to Super Admins.
          </span>
        </div>
      )}

      {/* Public Submissions Paused Notice Banner */}
      {isPublicSubmissionsPaused && !isPlatformMaintenance && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-sm text-blue-900 text-xs sm:text-sm flex items-center gap-2.5 shadow-xs">
          <AlertCircle size={18} className="text-blue-600 shrink-0" />
          <span>
            <strong>Public Submissions Paused:</strong> New article submissions by non-editorial users are temporarily suspended.
          </span>
        </div>
      )}

      {/* Auto-Restored Notice Banner */}
      {restoredNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm text-blue-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[#3366cc] shrink-0" />
            <span>{restoredNotice}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setRestoredNotice(null)}
              className="px-2 py-0.5 text-xs text-[#54595d] hover:text-[#101418] cursor-pointer"
            >
              Dismiss
            </button>
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-red-200 hover:border-red-300 text-red-700 rounded-sm text-xs font-medium cursor-pointer transition-colors"
            >
              <RotateCcw size={11} />
              Discard Draft
            </button>
          </div>
        </div>
      )}

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
            <button
              type="button"
              onClick={() => {
                purgeNewDraftRecovery(currentUserId);
                currentDraftIdRef.current = null;
                setTitle('');
                setSlug('');
                setSummary('');
                setArticleType('general');
                setCategory('Behind Financial Markets');
                setCategorySlug('behind-financial-markets');
                setSubCategory(undefined);
                setBehindCurtainsContext('');
                setIsSensitive(false);
                setContentSensitivity('normal');
                setSensitivityRationale('');
                setTags([]);
                setFeaturedImage('');
                setImageCaption('');
                setImageCredit('');
                setImageAlt('');
                setInfobox(undefined);
                setCitations([]);
                setSections(createDefaultDossierSections());
                setIsDirty(false);
                setSaveStatus('idle');
                setLastSavedTime(null);
                setRestoredNotice(null);
                setGeneralError(null);
                setValidationErrors({});
                setSuccessNotice(null);
              }}
              className="px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-sm text-xs font-semibold cursor-pointer transition-colors"
            >
              Start Another Article
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
        region={region}
        tags={tags}
        featuredImage={featuredImage}
        imageCaption={imageCaption}
        imageCredit={imageCredit}
        imageAlt={imageAlt}
        isSensitive={isSensitive}
        contentSensitivity={contentSensitivity}
        sensitivityRationale={sensitivityRationale}
        currentArticleId={currentDraftIdRef.current || undefined}
        onChange={(fields) => {
          markDirty();
          if (fields.title !== undefined) setTitle(fields.title);
          if (fields.slug !== undefined) setSlug(fields.slug);
          if (fields.summary !== undefined) setSummary(fields.summary);
          if (fields.articleType !== undefined) setArticleType(fields.articleType);
          if (fields.category !== undefined) setCategory(fields.category);
          if (fields.categorySlug !== undefined) setCategorySlug(fields.categorySlug);
          if (fields.subCategory !== undefined) setSubCategory(fields.subCategory);
          if (fields.region !== undefined) setRegion(fields.region);
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
        onCitationsChange={(newCitations) => {
          markDirty();
          setCitations(newCitations);
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
          {/* Delete Draft Button (when draft has content) */}
          {(currentDraftIdRef.current || hasMeaningfulDraftContent({ title, summary, sections, tags, citations })) && (
            <button
              type="button"
              onClick={() => setShowDiscardModal(true)}
              disabled={saving || isDiscarding}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-sm text-xs font-semibold font-mono cursor-pointer transition-colors flex items-center gap-1.5"
              title="Delete Draft"
            >
              <Trash2 size={13} />
              <span>Delete Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSaveArticle('draft')}
            disabled={saving || !title.trim() || isDiscarding}
            className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            disabled={isDiscarding}
            className="px-3 py-1.5 bg-[#ffffff] hover:bg-[#eaecf0] text-[#101418] border border-[#a2a9b1] rounded-sm text-xs font-semibold cursor-pointer transition-colors"
          >
            Preview Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveArticle(isEditor && !systemSettings.requirePeerReview ? 'published' : 'pending_review')}
            disabled={saving || !title.trim() || isDiscarding}
            className="px-4 py-1.5 bg-[#3366cc] hover:bg-[#2557bb] disabled:opacity-40 text-white rounded-sm text-xs font-semibold cursor-pointer shadow-xs transition-colors"
          >
            {saving ? 'Processing...' : isEditor && !systemSettings.requirePeerReview ? 'Publish Article Live' : systemSettings.requirePeerReview ? 'Submit for Peer Review' : 'Submit for Editorial Review'}
          </button>
        </div>
      </div>

      {/* Delete Draft Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#ffffff] border border-[#a2a9b1] rounded-sm max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 size={20} />
              </div>
              <h3 className="font-serif font-bold text-base text-[#101418]">
                Delete Draft
              </h3>
            </div>

            <p className="text-xs text-[#54595d] leading-relaxed">
              Delete this draft? This action cannot be undone.
            </p>

            <div className="bg-[#f8f9fa] border border-[#eaecf0] p-2.5 rounded-sm text-xs font-serif text-[#101418] font-bold">
              "{title.trim() || 'Untitled New Draft'}"
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#eaecf0]">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                disabled={isDiscarding}
                className="px-3.5 py-1.5 bg-white border border-[#a2a9b1] hover:bg-[#eaecf0] text-[#101418] rounded-sm text-xs font-semibold font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDiscarding}
                onClick={handleConfirmDiscardDraft}
                className="px-4 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white rounded-sm text-xs font-semibold font-mono shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isDiscarding ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

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
