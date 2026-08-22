import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  writeBatch
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Category, Subcategory } from '../types';
import { validateCategory } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { stripUndefined } from '../lib/sanitize';
import { DEMO_CATEGORIES } from '../data/demoData';

const CATEGORIES_COLLECTION = 'categories';

/**
 * Normalizes Firestore category doc into Category object.
 */
function normalizeCategoryDoc(id: string, data: any): Category {
  return {
    id: id || data.id,
    name: data.name || '',
    slug: data.slug || '',
    description: data.description || '',
    iconName: data.iconName || 'Compass',
    parentCategoryId: data.parentCategoryId || null,
    articleCount: typeof data.articleCount === 'number' ? data.articleCount : 0,
    featuredArticleSlug: data.featuredArticleSlug || undefined,
    featuredArticles: data.featuredArticles || (data.featuredArticleSlug ? [data.featuredArticleSlug] : []),
    subcategories: data.subcategories || [],
    parentCategorySlug: data.parentCategorySlug || undefined,
    image: data.image || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
  };
}

/**
 * Retrieves all top-level categories.
 */
export async function getCategories(): Promise<Category[]> {
  if (!isFirebaseConfigured() || !db) {
    return DEMO_CATEGORIES;
  }

  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const snapshot = await getDocs(categoriesRef);

    if (snapshot.empty) {
      return DEMO_CATEGORIES;
    }

    return snapshot.docs.map((docSnap) => normalizeCategoryDoc(docSnap.id, docSnap.data()));
  } catch (error) {
    console.warn('Error fetching categories from Firestore, using fallback:', error);
    return DEMO_CATEGORIES;
  }
}

/**
 * Retrieves a single category by its slug.
 */
export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!slug) return null;

  if (slug === 'all') {
    return {
      id: 'cat-all',
      slug: 'all',
      name: 'All Disciplines & Categories',
      description: 'Comprehensive overview of all core knowledge domains and specialist sub-disciplines.',
      iconName: 'Compass',
      articleCount: 13,
    };
  }

  if (!isFirebaseConfigured() || !db) {
    const demo = DEMO_CATEGORIES.find((c) => c.slug === slug);
    return demo || null;
  }

  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const q = query(categoriesRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      const demo = DEMO_CATEGORIES.find((c) => c.slug === slug);
      return demo || null;
    }

    const docSnap = snapshot.docs[0];
    return normalizeCategoryDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error querying category by slug "${slug}":`, error);
    const demo = DEMO_CATEGORIES.find((c) => c.slug === slug);
    return demo || null;
  }
}

/**
 * Retrieves subcategories for a given parent category.
 */
export async function getSubcategories(parentCategoryId: string): Promise<Subcategory[]> {
  const cat = await getCategoryBySlug(parentCategoryId);
  if (cat && cat.subcategories) {
    return cat.subcategories;
  }
  return [];
}

/**
 * Creates a new category with validation.
 */
export async function createCategory(
  categoryData: Omit<Category, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const validation = validateCategory(categoryData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not initialized.');
  }

  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const newDocRef = doc(categoriesRef);
  const now = getDbTimestamp();

  const payload = {
    ...categoryData,
    id: newDocRef.id,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(newDocRef, stripUndefined(payload));
  return { id: newDocRef.id, success: true };
}

/**
 * Updates an existing category.
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<Category>
): Promise<{ success: boolean; errors?: Record<string, string> }> {
  if (!id) throw new Error('Category ID is required for update.');

  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not initialized.');
  }

  const docRef = doc(db, CATEGORIES_COLLECTION, id);
  await updateDoc(
    docRef,
    stripUndefined({
      ...categoryData,
      updatedAt: getDbTimestamp(),
    })
  );

  return { success: true };
}

/**
 * Seeds initial demo categories into Firestore.
 */
export async function seedCategories(categories: Category[] = DEMO_CATEGORIES): Promise<number> {
  if (!isFirebaseConfigured() || !db) {
    throw new Error('Firestore is not configured.');
  }

  const batch = writeBatch(db);
  let count = 0;

  for (const cat of categories) {
    const docRef = doc(db, CATEGORIES_COLLECTION, cat.id);
    const now = getDbTimestamp();

    batch.set(
      docRef,
      stripUndefined({
        ...cat,
        createdAt: now,
        updatedAt: now,
      }),
      { merge: true }
    );

    count++;
  }

  await batch.commit();
  return count;
}
