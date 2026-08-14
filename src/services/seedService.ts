import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { seedArticles } from './articleService';
import { seedCategories } from './categoryService';
import { DEMO_ARTICLES, DEMO_CATEGORIES } from '../data/demoData';

export interface SeedStatus {
  seeded: boolean;
  categoriesCount: number;
  articlesCount: number;
  message: string;
}

/**
 * Checks if Firestore is populated. If empty, seeds default categories and articles.
 */
export async function seedDatabaseIfEmpty(): Promise<SeedStatus> {
  if (!isFirebaseConfigured() || !db) {
    return {
      seeded: false,
      categoriesCount: DEMO_CATEGORIES.length,
      articlesCount: DEMO_ARTICLES.length,
      message: 'Firebase is running in local fallback mode (demo data active).',
    };
  }

  try {
    // 1. Check articles
    const articlesRef = collection(db, 'articles');
    const articlesSnap = await getDocs(query(articlesRef, limit(1)));

    // 2. Check categories
    const categoriesRef = collection(db, 'categories');
    const categoriesSnap = await getDocs(query(categoriesRef, limit(1)));

    let catCount = 0;
    let artCount = 0;

    if (categoriesSnap.empty) {
      catCount = await seedCategories(DEMO_CATEGORIES);
    }

    if (articlesSnap.empty) {
      artCount = await seedArticles(DEMO_ARTICLES);
    }

    if (categoriesSnap.empty || articlesSnap.empty) {
      return {
        seeded: true,
        categoriesCount: catCount || DEMO_CATEGORIES.length,
        articlesCount: artCount || DEMO_ARTICLES.length,
        message: `Successfully seeded Firestore with ${catCount} categories and ${artCount} encyclopedia articles.`,
      };
    }

    return {
      seeded: false,
      categoriesCount: DEMO_CATEGORIES.length,
      articlesCount: DEMO_ARTICLES.length,
      message: 'Firestore database already contains existing data.',
    };
  } catch (error) {
    console.warn('Could not auto-seed Firestore:', error);
    return {
      seeded: false,
      categoriesCount: DEMO_CATEGORIES.length,
      articlesCount: DEMO_ARTICLES.length,
      message: 'Database check finished with local fallback fallback.',
    };
  }
}
