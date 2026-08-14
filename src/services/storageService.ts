import { ref, getDownloadURL, uploadBytes, FirebaseStorage } from 'firebase/storage';
import { storage, isFirebaseConfigured } from '../lib/firebase';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];

/**
 * Generates the standardized storage path for article imagery.
 * Pattern: articles/{articleId}/images/{filename}
 */
export function getArticleImagePath(articleId: string, filename: string): string {
  const sanitizedFilename = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_');
  return `articles/${articleId}/images/${Date.now()}_${sanitizedFilename}`;
}

/**
 * Validates image metadata before upload.
 */
export function validateImageUpload(file: { size: number; type: string }): { isValid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'File type must be JPEG, PNG, WebP, SVG, or GIF.' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return { isValid: false, error: 'Image size cannot exceed 5MB.' };
  }

  return { isValid: true };
}

/**
 * Uploads an article image to Firebase Storage (prepared for Phase 11 article editor).
 */
export async function uploadArticleImage(
  articleId: string,
  file: File | Blob,
  filename: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  if (!isFirebaseConfigured() || !storage) {
    throw new Error('Firebase Storage is not initialized.');
  }

  const validation = validateImageUpload(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const storagePath = getArticleImagePath(articleId, filename);
  const storageRef = ref(storage, storagePath);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  });

  const downloadUrl = await getDownloadURL(snapshot.ref);
  return { downloadUrl, storagePath };
}
