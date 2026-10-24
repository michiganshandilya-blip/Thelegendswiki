import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Revision, RevisionActionType, Article } from '../types';
import { validateRevision } from '../lib/validation';
import { getDbTimestamp } from '../lib/timestamps';
import { stripUndefined } from '../lib/sanitize';

const REVISIONS_COLLECTION = 'revisions';
const LOCAL_REVISIONS_KEY = 'thelegendswiki:revisions_v1';

// Seeded rich snapshots for canonical published articles
let fallbackRevisions: Revision[] = [
  // Harshad Mehta 1992 Securities Scam
  {
    id: 'rev-hm-1',
    articleId: 'art-harshad-mehta-1992',
    articleTitle: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
    articleSlug: 'harshad-mehta-1992-securities-scam',
    editorId: 'system-scholar',
    editorName: 'Chief Scribe',
    versionNumber: 'v1.0',
    previousContent: '',
    newContent: 'Initial authoritative forensic dossier published on the 1992 securities scam.',
    changeSummary: 'Initial scholarly publication with canonical citations and Janakiraman Committee exhibits.',
    actionType: 'approval',
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    snapshot: {
      id: 'art-harshad-mehta-1992',
      slug: 'harshad-mehta-1992-securities-scam',
      title: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
      summary: 'An investigative forensic analysis into how Harshad Mehta exploited structural loopholes in the inter-bank Ready-Forward (RF) market and fake Bank Receipts (BRs) from Bank of Karad and Metropolitan Co-operative Bank to siphon ₹4,000+ crore into the Bombay Stock Exchange.',
      articleType: 'event',
      category: 'Behind Financial Markets',
      categorySlug: 'behind-financial-markets',
      region: 'India',
      tags: ['Harshad Mehta', '1992 Scam', 'Bombay Stock Exchange', 'Bank Receipts', 'Forensic Accounting'],
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'The Bombay Stock Exchange (BSE) ring during the speculative frenzy of 1992.',
      imageCredit: 'Archival Photo Registry / BSE Historical Files',
      sections: [
        {
          id: 'sec-hm-1-1',
          title: 'The Inter-Bank Ready-Forward Conduit',
          content: [
            'In early 1991, Indian commercial banks operated under stringent Statutory Liquidity Ratio (SLR) mandates requiring substantial holdings in government bonds. Ready-Forward deals functioned as short-term liquidity agreements between banks.',
            'Harshad Mehta interposed himself as an informal broker between banks requiring capital and institutions holding excess securities reserves.'
          ],
        },
        {
          id: 'sec-hm-1-2',
          title: 'The Fabricated Bank Receipts (BR) Schema',
          content: [
            'Rather than moving physical bond certificates through the Public Debt Office (PDO), institutions accepted Bank Receipts (BRs) as acknowledgments of held securities.',
            'Small cooperating banks, specifically Bank of Karad and Metropolitan Co-operative Bank, began issuing unsecured BRs without underlying sovereign paper.'
          ],
        }
      ],
      citations: [
        {
          id: 1,
          author: 'Janakiraman Committee',
          title: 'Interim Report on Securities Transactions of Banks and Financial Institutions',
          source: 'Reserve Bank of India Historical Bulletin',
          year: '1992',
        },
        {
          id: 2,
          author: 'Sucheta Dalal',
          title: 'Huge SBI securities hole uncovered',
          source: 'The Times of India (Mumbai)',
          year: '1992',
        }
      ],
      infobox: {
        title: 'Harshad Mehta 1992 Securities Scam',
        subtitle: 'Initial Publication Snapshot',
        details: [
          { label: 'Key Figures', value: 'Harshad Shantilal Mehta, Ashwin Mehta' },
          { label: 'Scam Quantum', value: 'Estimated ₹4,024 Crore (approx $1.3B USD in 1992)' },
          { label: 'Primary Mechanism', value: 'Ready-Forward (RF) arbitrage & Fake Bank Receipts' },
        ],
      }
    }
  },
  {
    id: 'rev-hm-2',
    articleId: 'art-harshad-mehta-1992',
    articleTitle: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
    articleSlug: 'harshad-mehta-1992-securities-scam',
    editorId: 'system-editor-2',
    editorName: 'Senior Curator',
    versionNumber: 'v1.1',
    previousContent: 'Initial authoritative forensic dossier published on the 1992 securities scam.',
    newContent: 'Expanded dossier with detailed financial scandal mechanisms and regulatory aftermath.',
    changeSummary: 'Added Joint Parliamentary Committee findings, regulatory reform outcomes, and SEBI statutory authority expansion.',
    actionType: 'direct_edit',
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    snapshot: {
      id: 'art-harshad-mehta-1992',
      slug: 'harshad-mehta-1992-securities-scam',
      title: 'Behind the Curtains: Harshad Mehta and the 1992 Securities Scam',
      summary: 'An investigative forensic analysis into how Harshad Mehta exploited structural loopholes in the inter-bank Ready-Forward (RF) market and fake Bank Receipts (BRs) from Bank of Karad and Metropolitan Co-operative Bank to siphon ₹4,000+ crore into the Bombay Stock Exchange.',
      articleType: 'event',
      category: 'Behind Financial Markets',
      categorySlug: 'behind-financial-markets',
      region: 'India',
      tags: ['Harshad Mehta', '1992 Scam', 'Bombay Stock Exchange', 'Bank Receipts', 'Forensic Accounting', 'JPC'],
      status: 'published',
      featuredImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      imageCaption: 'The Bombay Stock Exchange (BSE) ring during the speculative frenzy of 1992.',
      imageCredit: 'Archival Photo Registry / BSE Historical Files',
      sections: [
        {
          id: 'sec-hm-1-1',
          title: 'The Inter-Bank Ready-Forward Conduit',
          content: [
            'In early 1991, Indian commercial banks operated under stringent Statutory Liquidity Ratio (SLR) mandates requiring substantial holdings in government bonds. Ready-Forward deals functioned as short-term liquidity agreements between banks.',
            'Harshad Mehta interposed himself as an informal broker between banks requiring capital and institutions holding excess securities reserves.'
          ],
        },
        {
          id: 'sec-hm-1-2',
          title: 'The Fabricated Bank Receipts (BR) Schema',
          content: [
            'Rather than moving physical bond certificates through the Public Debt Office (PDO), institutions accepted Bank Receipts (BRs) as acknowledgments of held securities.',
            'Small cooperating banks, specifically Bank of Karad and Metropolitan Co-operative Bank, began issuing unsecured BRs without underlying sovereign paper.',
            'The proceeds were credited directly into Mehta’s broker accounts, supplying billions in float used to corner public equities like Associated Cement Companies (ACC).'
          ],
        },
        {
          id: 'sec-hm-1-3',
          title: 'Joint Parliamentary Committee Inquiry and Regulatory Reform',
          content: [
            'Following the April 1992 collapse, the Joint Parliamentary Committee (JPC) was convened under Ram Niwas Mirdha to investigate regulatory compliance failures across public sector banks and foreign branch networks.',
            'The inquiry accelerated the enactment of the Securities and Exchange Board of India Act (1992), granting SEBI independent statutory enforcement authority.'
          ],
        }
      ],
      citations: [
        {
          id: 1,
          author: 'Janakiraman Committee',
          title: 'Interim Report on Securities Transactions of Banks and Financial Institutions',
          source: 'Reserve Bank of India Historical Bulletin',
          year: '1992',
        },
        {
          id: 2,
          author: 'Sucheta Dalal',
          title: 'Huge SBI securities hole uncovered',
          source: 'The Times of India (Mumbai)',
          year: '1992',
        },
        {
          id: 3,
          author: 'Joint Parliamentary Committee (JPC)',
          title: 'Report on Irregularities in Securities and Banking Transactions',
          source: 'Parliament of India Digital Records',
          year: '1993',
        }
      ],
      infobox: {
        title: 'Harshad Mehta 1992 Securities Scam',
        subtitle: 'Editorial Update (v1.1)',
        details: [
          { label: 'Key Figures', value: 'Harshad Shantilal Mehta, Ashwin Mehta, Niranjan Shah' },
          { label: 'Scam Quantum', value: 'Estimated ₹4,024 Crore (approx $1.3B USD in 1992)' },
          { label: 'Primary Mechanism', value: 'Ready-Forward (RF) arbitrage & Fake Bank Receipts' },
          { label: 'Inquiry Bodies', value: 'Janakiraman Committee (RBI), Joint Parliamentary Committee (JPC)' },
          { label: 'Legislative Impact', value: 'SEBI Act 1992 statutory empowerment, NSDL depository establishment' },
        ],
      }
    }
  },

  // Library of Alexandria
  {
    id: 'rev-alex-1',
    articleId: 'art-library-of-alexandria',
    articleTitle: 'The Library of Alexandria: Scholarship, Succession, and the Anatomy of Destruction',
    articleSlug: 'library-of-alexandria',
    editorId: 'system-scholar',
    editorName: 'Chief Scribe',
    versionNumber: 'v1.0',
    previousContent: '',
    newContent: 'Historical encyclopedia entry on the Royal Library of Alexandria under the Ptolemaic dynasty.',
    changeSummary: 'Initial scholarly publication with canonical citations.',
    actionType: 'approval',
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    snapshot: {
      id: 'art-library-of-alexandria',
      slug: 'library-of-alexandria',
      title: 'The Library of Alexandria: Scholarship, Succession, and the Anatomy of Destruction',
      summary: 'A definitive historical analysis of the Royal Library of Alexandria: its foundation under the Ptolemaic dynasty, its revolutionary scholarly methods, the myth of a single catastrophic burning, and the gradual institutional decline spanning five centuries.',
      category: 'Behind History',
      categorySlug: 'behind-history',
      status: 'published',
      sections: [
        {
          id: 'sec-alex-1',
          title: 'Foundation and Ptolemaic Royal Patronage',
          content: [
            'Conceived under Ptolemy I Soter and realized under Ptolemy II Philadelphus in the early 3rd century BCE, the Library of Alexandria was planned not merely as a repository but as an active institute of Hellenistic scholarship.',
            'Royal decrees authorized scribes to requisition scrolls from every merchant vessel entering the port of Alexandria, copying the texts and frequently retaining the originals in the royal collection.'
          ]
        },
        {
          id: 'sec-alex-2',
          title: 'The Anatomy of Gradual Destruction',
          content: [
            'Popular legend attributes the destruction of the Library to a single catastrophic inferno set by Julius Caesar in 48 BCE.',
            'Modern historiographical consensus demonstrates that Caesar’s dockside fires destroyed only quayside warehouses, with the Mouseion surviving for centuries before succumbing to Aurelian’s siege (272 CE) and Patriarch Theophilus (391 CE).'
          ]
        }
      ],
      citations: [
        {
          id: 1,
          author: 'Canfora, Luciano',
          title: 'The Vanished Library: A Wonder of the Ancient World',
          source: 'University of California Press',
          year: '1990',
        }
      ]
    }
  },

  // Enron Scandal
  {
    id: 'rev-enron-1',
    articleId: 'art-enron-arthur-andersen',
    articleTitle: 'Behind the Curtains: The Enron Collapse and Arthur Andersen Shredding',
    articleSlug: 'enron-scandal-and-arthur-andersen',
    editorId: 'system-scholar',
    editorName: 'Senior Auditor',
    versionNumber: 'v1.0',
    previousContent: '',
    newContent: 'Forensic audit analysis of Enron Special Purpose Entities (SPEs) and mark-to-market accounting.',
    changeSummary: 'Initial publication: Documented financial analysis of Chewco, LJM, and Arthur Andersen document destruction.',
    actionType: 'approval',
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    snapshot: {
      id: 'art-enron-arthur-andersen',
      slug: 'enron-scandal-and-arthur-andersen',
      title: 'Behind the Curtains: The Enron Collapse and Arthur Andersen Shredding',
      summary: 'A detailed forensic breakdown of how Enron employed off-balance-sheet Special Purpose Entities (SPEs), aggressive mark-to-market accounting, and regulatory arbitrage to conceal multi-billion-dollar liabilities.',
      category: 'Behind Corporations',
      categorySlug: 'behind-corporations',
      status: 'published',
      sections: [
        {
          id: 'sec-enron-1',
          title: 'Mark-to-Market Accounting and Future Value Recognition',
          content: [
            'Under CEO Jeffrey Skilling, Enron transitioned from a pipeline utility to an energy derivatives trading firm, securing SEC approval in 1992 to utilize mark-to-market (MTM) accounting for forward gas contracts.',
            'MTM permitted Enron to book estimated future discounted net present values on the day contracts were executed, disguising failed capital ventures as immediate accounting windfalls.'
          ]
        }
      ],
      citations: [
        {
          id: 1,
          author: 'Powers, William C.',
          title: 'Report of Investigation by the Special Investigative Committee of the Board of Directors of Enron Corp.',
          source: 'United States Bankruptcy Court',
          year: '2002',
        }
      ]
    }
  }
];

function loadLocalRevisions(): Revision[] {
  try {
    const raw = localStorage.getItem(LOCAL_REVISIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Error reading local revisions:', err);
    return [];
  }
}

function saveLocalRevisions(revisions: Revision[]): void {
  try {
    localStorage.setItem(LOCAL_REVISIONS_KEY, JSON.stringify(revisions.slice(0, 200)));
  } catch (err) {
    console.warn('Error saving local revisions:', err);
  }
}

function normalizeRevisionDoc(id: string, data: any): Revision {
  return {
    id: id || data.id,
    articleId: data.articleId || '',
    articleTitle: data.articleTitle || '',
    articleSlug: data.articleSlug || '',
    editorId: data.editorId || '',
    editorName: data.editorName || 'Editor',
    previousContent: data.previousContent || '',
    newContent: data.newContent || '',
    changeSummary: data.changeSummary || '',
    actionType: data.actionType || 'direct_edit',
    moderationNotes: data.moderationNotes || undefined,
    createdAt: data.createdAt || new Date().toISOString(),
    snapshot: data.snapshot || undefined,
    versionNumber: data.versionNumber || undefined,
  };
}

/**
 * Creates a new revision or audit log entry in Firestore and local storage.
 */
export async function createRevision(
  revisionData: Omit<Revision, 'id'>
): Promise<{ id: string; success: boolean; errors?: Record<string, string> }> {
  const preparedData = {
    ...revisionData,
    newContent:
      revisionData.newContent ||
      (typeof revisionData.snapshot?.content === 'string'
        ? revisionData.snapshot.content
        : '') ||
      revisionData.changeSummary ||
      'Snapshot saved',
  };

  const validation = validateRevision(preparedData);
  if (!validation.isValid) {
    return { id: '', success: false, errors: validation.errors };
  }

  const now = getDbTimestamp();
  const generatedId = `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const payload: Revision = {
    ...preparedData,
    id: generatedId,
    createdAt: now,
  };

  // Add to in-memory fallback
  fallbackRevisions.unshift(payload);

  // Add to local storage
  const localList = loadLocalRevisions();
  localList.unshift(payload);
  saveLocalRevisions(localList);

  if (!isFirebaseConfigured() || !db) {
    return { id: generatedId, success: true };
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const newDocRef = doc(revisionsRef, generatedId);
    await setDoc(newDocRef, stripUndefined(payload));
    return { id: generatedId, success: true };
  } catch (error) {
    console.warn('Error saving revision to Firestore, kept in local session:', error);
    return { id: generatedId, success: true };
  }
}

/**
 * Convenience helper to record a structured audit log revision for moderation actions.
 */
export async function recordAuditRevision(params: {
  articleId: string;
  articleTitle?: string;
  articleSlug?: string;
  editorId: string;
  editorName?: string;
  actionType: RevisionActionType;
  changeSummary: string;
  previousContent?: string;
  newContent?: string;
  moderationNotes?: string;
  snapshot?: Partial<Article>;
  versionNumber?: string;
}): Promise<void> {
  try {
    await createRevision({
      articleId: params.articleId,
      articleTitle: params.articleTitle || '',
      articleSlug: params.articleSlug || '',
      editorId: params.editorId,
      editorName: params.editorName || 'Editor',
      previousContent: params.previousContent || '',
      newContent: params.newContent || params.changeSummary,
      changeSummary: params.changeSummary,
      actionType: params.actionType,
      moderationNotes: params.moderationNotes,
      snapshot: params.snapshot,
      versionNumber: params.versionNumber,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('Failed to record audit revision:', err);
  }
}

/**
 * Retrieves the revision history for a given article by its ID or Slug.
 */
export async function getRevisionsByArticleId(
  articleIdentifier: string,
  limitCount: number = 50
): Promise<Revision[]> {
  if (!articleIdentifier) return [];

  const localList = loadLocalRevisions();
  const combinedFallbacks = [...localList, ...fallbackRevisions];

  const matchesIdentifier = (r: Revision) =>
    r.articleId === articleIdentifier ||
    r.articleSlug === articleIdentifier ||
    (r.snapshot && (r.snapshot.id === articleIdentifier || r.snapshot.slug === articleIdentifier));

  if (!isFirebaseConfigured() || !db) {
    const matched = combinedFallbacks.filter(matchesIdentifier);
    // Deduplicate by ID
    const uniqueMap = new Map<string, Revision>();
    matched.forEach((r) => uniqueMap.set(r.id, r));
    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    // Query by articleId
    const q1 = query(
      revisionsRef,
      where('articleId', '==', articleIdentifier),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot1 = await getDocs(q1);
    let list = snapshot1.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));

    // Also query by articleSlug if list is empty or slug differs
    if (list.length === 0) {
      try {
        const q2 = query(
          revisionsRef,
          where('articleSlug', '==', articleIdentifier),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
        const snapshot2 = await getDocs(q2);
        list = snapshot2.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));
      } catch (e) {
        // Index or query error fallback
      }
    }

    // Merge in matching items from local / fallback
    const matchedFallbacks = combinedFallbacks.filter(matchesIdentifier);
    const idMap = new Set(list.map((r) => r.id));
    for (const f of matchedFallbacks) {
      if (!idMap.has(f.id)) {
        list.push(f);
        idMap.add(f.id);
      }
    }

    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.warn(`Error fetching revisions for article "${articleIdentifier}":`, error);
    const matched = combinedFallbacks.filter(matchesIdentifier);
    const uniqueMap = new Map<string, Revision>();
    matched.forEach((r) => uniqueMap.set(r.id, r));
    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }
}

/**
 * Retrieves the full system-wide audit and revision log for editors and administrators.
 */
export async function getAllRevisions(limitCount: number = 50): Promise<Revision[]> {
  const localList = loadLocalRevisions();
  const allFallbacks = [...localList, ...fallbackRevisions];

  if (!isFirebaseConfigured() || !db) {
    const uniqueMap = new Map<string, Revision>();
    allFallbacks.forEach((r) => uniqueMap.set(r.id, r));
    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }

  try {
    const revisionsRef = collection(db, REVISIONS_COLLECTION);
    const q = query(revisionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((d) => normalizeRevisionDoc(d.id, d.data()));

    const idMap = new Set(list.map((r) => r.id));
    for (const f of allFallbacks) {
      if (!idMap.has(f.id)) {
        list.push(f);
        idMap.add(f.id);
      }
    }
    return list
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  } catch (error) {
    console.warn('Error fetching all revisions from Firestore:', error);
    const uniqueMap = new Map<string, Revision>();
    allFallbacks.forEach((r) => uniqueMap.set(r.id, r));
    return Array.from(uniqueMap.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  }
}

/**
 * Retrieves a single revision by its ID.
 */
export async function getRevisionById(id: string): Promise<Revision | null> {
  if (!id) return null;

  const localList = loadLocalRevisions();
  const allFallbacks = [...localList, ...fallbackRevisions];

  if (!isFirebaseConfigured() || !db) {
    return allFallbacks.find((r) => r.id === id) || null;
  }

  try {
    const docRef = doc(db, REVISIONS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return allFallbacks.find((r) => r.id === id) || null;
    }
    return normalizeRevisionDoc(docSnap.id, docSnap.data());
  } catch (error) {
    console.warn(`Error fetching revision "${id}":`, error);
    return allFallbacks.find((r) => r.id === id) || null;
  }
}
