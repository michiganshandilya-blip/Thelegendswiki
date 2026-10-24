import fs from 'fs';
import path from 'path';
import { initializeApp, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  Firestore,
} from 'firebase/firestore';
import { VerifiedUser, getServerDb as getAuthServerDb } from './authHelper';
import { handleGetSystemSettings } from './systemSettingsRouter';

let serverDb: Firestore | null = null;

function getServerDb(): Firestore | null {
  if (serverDb) return serverDb;
  const authDb = getAuthServerDb();
  if (authDb) {
    serverDb = authDb;
    return serverDb;
  }

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[articleRouter] firebase-applet-config.json not found on disk.');
      return null;
    }

    const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const appName = 'server-article-router';

    let app;
    try {
      app = getApp(appName);
    } catch {
      app = initializeApp(
        {
          apiKey: rawConfig.apiKey,
          authDomain: rawConfig.authDomain,
          projectId: rawConfig.projectId,
        },
        appName
      );
    }

    serverDb = (rawConfig.firestoreDatabaseId && rawConfig.firestoreDatabaseId !== '(default)')
      ? getFirestore(app, rawConfig.firestoreDatabaseId)
      : getFirestore(app);
    return serverDb;
  } catch (err) {
    console.error('[articleRouter] Failed to initialize server Firestore:', err);
    return null;
  }
}

export async function handleSaveArticle(
  body: any,
  verifiedUser: VerifiedUser
): Promise<{ success: boolean; id?: string; error?: string; message?: string; status?: number }> {
  try {
    const article = body?.article || body;

    if (!article || (!article.id && !article.slug)) {
      return { success: false, status: 400, error: 'Valid article object with id is required.' };
    }

    const settings = await handleGetSystemSettings();
    if (settings.maintenanceMode && !verifiedUser.isSuperAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Platform Maintenance Mode is active. Dossier modifications are frozen and restricted exclusively to Super Admins.',
      };
    }

    const targetId = article.id || `art-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const db = getServerDb();
    if (db) {
      // Check ownership on existing dossier
      try {
        const existingSnap = await getDoc(doc(db, 'articles', targetId));
        if (existingSnap.exists()) {
          const existingData = existingSnap.data();
          if (existingData.authorId && existingData.authorId !== verifiedUser.uid && !verifiedUser.isAdmin) {
            return {
              success: false,
              status: 403,
              error: 'Forbidden: You are not authorized to modify another scholar’s dossier.',
            };
          }
        }
      } catch (checkErr) {
        console.warn('[articleRouter] Pre-save permission check warning:', checkErr);
      }
    }

    // Authenticated identity overrides any client-supplied attribution unless the user is an admin
    const cleanPayload = {
      ...article,
      id: targetId,
      authorId: verifiedUser.isAdmin ? (article.authorId || verifiedUser.uid) : verifiedUser.uid,
      author: verifiedUser.isAdmin ? (article.author || verifiedUser.displayName) : verifiedUser.displayName,
      updatedAt: article.updatedAt || nowIso,
      createdAt: article.createdAt || nowIso,
    };

    // Guard against oversized base64 image fallbacks that would exceed Firestore's 1MB document limit
    const MAX_SAFE_IMAGE_FALLBACK_LEN = 150 * 1024;
    const isImageOversized = (url?: string): boolean => {
      return Boolean(url && typeof url === 'string' && url.startsWith('data:image/') && url.length > MAX_SAFE_IMAGE_FALLBACK_LEN);
    };

    if (isImageOversized(cleanPayload.featuredImage) || isImageOversized(cleanPayload.image)) {
      return {
        success: false,
        status: 400,
        error: 'Article image fallback exceeds the safe document size limit (1MB Firestore limit). Please use a smaller image.',
      };
    }

    if (Array.isArray(cleanPayload.sections)) {
      for (let i = 0; i < cleanPayload.sections.length; i++) {
        if (isImageOversized(cleanPayload.sections[i]?.figure?.url)) {
          return {
            success: false,
            status: 400,
            error: `Section figure image fallback exceeds the safe document size limit. Please use a smaller image.`,
          };
        }
      }
    }

    if (db) {
      const docRef = doc(db, 'articles', targetId);
      await setDoc(docRef, cleanPayload, { merge: true });

      // Secondary revision record
      try {
        const revId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const revRef = doc(db, 'revisions', revId);
        await setDoc(revRef, {
          id: revId,
          articleId: targetId,
          articleTitle: cleanPayload.title || 'Untitled',
          articleSlug: cleanPayload.slug || targetId,
          editorId: verifiedUser.uid,
          editorName: verifiedUser.displayName,
          timestamp: nowIso,
          actionType: cleanPayload.status === 'published' ? 'published' : cleanPayload.status === 'pending_review' ? 'submission' : 'edit',
          changeSummary: cleanPayload.status === 'draft' ? 'Draft saved' : 'Article content updated',
        });
      } catch (rErr) {
        console.warn('[articleRouter] Revision write warning:', rErr);
      }
    }

    return { success: true, id: targetId, message: 'Article saved successfully.' };
  } catch (err: any) {
    console.error('[articleRouter] Error saving article to backend:', err);
    return { success: false, status: 500, error: err?.message || 'Failed to save article to backend.' };
  }
}

export async function handleDeleteArticle(
  body: any,
  verifiedUser: VerifiedUser
): Promise<{ success: boolean; error?: string; message?: string; status?: number }> {
  try {
    const targetId = body?.targetId || body?.articleId;
    const articleId = body?.articleId || targetId;
    const targetSlug = body?.targetSlug || body?.slug;
    const title = body?.title || 'Unknown Dossier';

    if (!targetId && !targetSlug) {
      return { success: false, status: 400, error: 'Article identifier is required for deletion.' };
    }

    const settings = await handleGetSystemSettings();
    if (settings.maintenanceMode && !verifiedUser.isSuperAdmin) {
      return {
        success: false,
        status: 403,
        error: 'Platform Maintenance Mode is active. Article deletion is frozen and restricted exclusively to Super Admins.',
      };
    }

    const db = getServerDb();
    if (db) {
      // Check ownership on existing dossier if targetId exists
      if (targetId) {
        try {
          const existingSnap = await getDoc(doc(db, 'articles', targetId));
          if (existingSnap.exists()) {
            const existingData = existingSnap.data();
            if (!verifiedUser.isAdmin) {
              if (existingData.authorId && existingData.authorId !== verifiedUser.uid) {
                return {
                  success: false,
                  status: 403,
                  error: 'Forbidden: You are not authorized to delete another scholar’s dossier.',
                };
              }
              if (existingData.status === 'published') {
                return {
                  success: false,
                  status: 403,
                  error: 'Forbidden: Published dossiers can only be deleted by Administrators.',
                };
              }
            }
          }
        } catch (checkErr) {
          console.warn('[articleRouter] Pre-delete ownership check warning:', checkErr);
        }
      }

      // 1. Delete main document reference
      if (targetId) {
        try {
          const mainRef = doc(db, 'articles', targetId);
          await deleteDoc(mainRef);
        } catch (mErr) {
          console.warn(`[articleRouter] Could not delete main doc ${targetId}:`, mErr);
        }
      }

      // 2. Delete alternate identifier if different
      if (articleId && articleId !== targetId) {
        try {
          const altRef = doc(db, 'articles', articleId);
          await deleteDoc(altRef);
        } catch {
          // Ignore secondary identifier error
        }
      }

      // 3. Delete by slug if provided
      if (targetSlug) {
        try {
          const slugQuery = query(collection(db, 'articles'), where('slug', '==', targetSlug));
          const slugSnap = await getDocs(slugQuery);
          for (const sDoc of slugSnap.docs) {
            await deleteDoc(sDoc.ref);
          }
        } catch {
          // Ignore slug query cleanup error
        }
      }

      // 4. Record in audit logs using verified credentials
      try {
        const auditRef = doc(db, 'audit_logs', `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
        await setDoc(auditRef, {
          id: auditRef.id,
          actorUid: verifiedUser.uid,
          actorEmail: verifiedUser.email,
          actorRole: verifiedUser.role,
          action: 'Article Deleted',
          targetId: targetId || targetSlug,
          targetTitle: title,
          targetType: 'article',
          details: `Dossier "${title}" permanently deleted by ${verifiedUser.email}.`,
          timestamp: new Date().toISOString(),
          metadata: { articleId: targetId, slug: targetSlug },
        });
      } catch (aErr) {
        console.warn('[articleRouter] Audit log write warning on delete:', aErr);
      }
    }

    return { success: true, message: `Article "${title}" permanently deleted.` };
  } catch (err: any) {
    console.error('[articleRouter] Error deleting article from backend:', err);
    return { success: false, status: 500, error: err?.message || 'Failed to delete article from backend.' };
  }
}
