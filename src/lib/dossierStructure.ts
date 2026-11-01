import { ArticleSection, ArticleCitation } from '../types';

/**
 * Standardized 4-Section Article Writing Workflow for TheLegendsWiki
 * 
 * Exactly 4 original writing sections:
 * 1. Case Overview
 * 2. Investigation & Evidence
 * 3. Impact & Unresolved Questions
 * 4. Dossier Conclusion
 */

export interface DossierSectionDefinition {
  id: string;
  order: number;
  title: string;
  helperText: string;
  placeholder: string;
  categoryGuidance?: Record<string, string>;
}

export const ORIGINAL_FOUR_SECTIONS: DossierSectionDefinition[] = [
  {
    id: 'case-overview',
    order: 1,
    title: 'Case Overview',
    helperText: 'Introduce the core case, key entities, timeline scope, the publicly accepted official narrative, and why this subject is historically or systemically consequential.',
    placeholder: 'Write or paste the complete Case Overview here. Cover the background, relevant entities, scope of the event, and the official public version of events...',
    categoryGuidance: {
      'behind-financial-markets': 'Summarize the financial market event, asset class, institutions involved, and the standard market explanation.',
      'behind-corporations': 'Introduce the corporation, key executives, market position, and the public corporate relations narrative.',
      'behind-history': 'Establish the historical event, geopolitical actors, era, and the standard historical account.',
      'behind-the-evidence': 'Introduce the specific document, ledger, or archive examined and its official interpretation.',
      'behind-the-mysteries': 'Introduce the unexplained case, timeline, and known public accounts.',
    },
  },
  {
    id: 'investigation-evidence',
    order: 2,
    title: 'Investigation & Evidence',
    helperText: 'Present the verified investigative discoveries, backroom transactions and decisions, hidden incentives, overlooked mechanisms, and documented primary or secondary evidence.',
    placeholder: 'Write or paste the complete Investigation & Evidence here. Detail what happened behind the curtains, verified transactions, documents, and evidentiary findings...',
    categoryGuidance: {
      'behind-financial-markets': 'Expose the underlying liquidity mechanisms, off-balance-sheet vehicles, synthetic derivatives, and regulatory findings.',
      'behind-corporations': 'Expose private boardroom deliberations, internal whistleblower memos, court depositions, and forensic audits.',
      'behind-history': 'Detail the undisclosed diplomatic cables, unpublicized pacts, declassified archives, and contemporaneous records.',
      'behind-the-evidence': 'Examine chain of custody, authentication records, metadata analysis, and corroborating archives.',
      'behind-the-mysteries': 'Detail verified overlooked circumstances, physical evidence logs, forensic pathology reports, and radar data.',
    },
  },
  {
    id: 'impact-unresolved',
    order: 3,
    title: 'Impact & Unresolved Questions',
    helperText: 'Detail the turning point, consequences, institutional or legal aftermath, and questions that remain unanswered, disputed, or missing in the evidentiary record.',
    placeholder: 'Write or paste the complete Impact & Unresolved Questions here. Detail the catalysts, consequences, regulatory aftermath, and open questions...',
    categoryGuidance: {
      'behind-financial-markets': 'Highlight the catalyst, market collapses, regulatory reforms, missing archives, and unrecovered funds.',
      'behind-corporations': 'Highlight pivotal leaks, restructuring, civil penalties, sealed settlements, and unanswered executive roles.',
      'behind-history': 'Highlight key intercepts, geopolitical alignments, societal impact, withheld archives, and unresolved debates.',
      'behind-the-evidence': 'Highlight breakthrough discoveries, policy revisions, missing corroborating pages, and contested points.',
      'behind-the-mysteries': 'Highlight breakthrough discoveries, institutional protocol changes, missing artifacts, and unverified hypotheses.',
    },
  },
  {
    id: 'dossier-conclusion',
    order: 4,
    title: 'Dossier Conclusion',
    helperText: 'Provide a concise, objective, evidence-based conclusion summarizing the dossier’s core significance and lasting historical or structural lessons.',
    placeholder: 'Write or paste the Dossier Conclusion here. Summarize key findings, lessons learned, and the enduring significance of the dossier...',
    categoryGuidance: {
      'behind-financial-markets': 'Summarize the structural vulnerabilities exposed in modern financial architecture.',
      'behind-corporations': 'Summarize the ethical, governance, and oversight lessons from the corporate investigation.',
      'behind-history': 'Summarize the enduring historical lesson grounded in verifiable documentation.',
      'behind-the-evidence': 'Summarize why this evidentiary record remains critical to historical accuracy.',
      'behind-the-mysteries': 'Summarize the most credible facts of the case while maintaining rigorous epistemic humility.',
    },
  },
];

// Alias for backwards compatibility with any modules expecting MANDATORY_DOSSIER_SECTIONS
export const MANDATORY_DOSSIER_SECTIONS: DossierSectionDefinition[] = ORIGINAL_FOUR_SECTIONS;

export interface WorkflowSectionDefinition {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  fieldIds: string[];
}

export const ARTICLE_WORKFLOW_SECTIONS: WorkflowSectionDefinition[] = [
  {
    id: 'case-overview',
    order: 1,
    title: 'Case Overview',
    subtitle: 'Background, scope, entities & official narrative',
    fieldIds: ['case-overview'],
  },
  {
    id: 'investigation-evidence',
    order: 2,
    title: 'Investigation & Evidence',
    subtitle: 'Behind the curtains analysis & documented evidence',
    fieldIds: ['investigation-evidence'],
  },
  {
    id: 'impact-unresolved',
    order: 3,
    title: 'Impact & Unresolved Questions',
    subtitle: 'Turning point, consequences & open questions',
    fieldIds: ['impact-unresolved'],
  },
  {
    id: 'dossier-conclusion',
    order: 4,
    title: 'Dossier Conclusion',
    subtitle: 'Objective assessment & enduring lessons',
    fieldIds: ['dossier-conclusion'],
  },
];

/**
 * Creates a fresh, standardized 4-section template for a new article.
 */
export function createDefaultDossierSections(): ArticleSection[] {
  return ORIGINAL_FOUR_SECTIONS.map((def) => ({
    id: def.id,
    title: def.title,
    content: [''],
    bulletPoints: [],
    claims: [],
  }));
}

/**
 * Normalizes and maps any existing article sections into the exactly 4 original sections.
 * Safely preserves all existing user content without data loss.
 */
export function mapToStandardDossierSections(
  existingSections?: ArticleSection[],
  rawContent?: string | string[]
): ArticleSection[] {
  const result: ArticleSection[] = createDefaultDossierSections();

  if (!existingSections || existingSections.length === 0) {
    if (rawContent) {
      const text = typeof rawContent === 'string' ? rawContent : rawContent.join('\n\n');
      if (text.trim()) {
        result[0].content = text.split(/\n\n+/).filter(Boolean);
      }
    }
    return result;
  }

  // If already exactly 4 sections matching our 4 original IDs or titles
  if (existingSections.length === 4) {
    const isDirectMatch = existingSections.every((sec, i) => {
      const def = ORIGINAL_FOUR_SECTIONS[i];
      const secId = (sec.id || '').toLowerCase();
      const secTitle = (sec.title || '').toLowerCase();
      return secId === def.id || secTitle === def.title.toLowerCase();
    });
    if (isDirectMatch) {
      return existingSections.map((sec, i) => ({
        ...sec,
        id: ORIGINAL_FOUR_SECTIONS[i].id,
        title: ORIGINAL_FOUR_SECTIONS[i].title,
        content: sec.content && sec.content.length > 0 ? sec.content : [''],
      }));
    }
  }

  // Accumulate content into the 4 target section buckets
  const sectionBuckets: Array<{
    paragraphs: string[];
    bulletPoints: string[];
    figure?: any;
    claims: any[];
  }> = [
    { paragraphs: [], bulletPoints: [], claims: [] },
    { paragraphs: [], bulletPoints: [], claims: [] },
    { paragraphs: [], bulletPoints: [], claims: [] },
    { paragraphs: [], bulletPoints: [], claims: [] },
  ];

  existingSections.forEach((sec, sIdx) => {
    const titleLower = (sec.title || '').toLowerCase().trim();
    const idLower = (sec.id || '').toLowerCase().trim();

    let targetIndex = 0;

    if (
      idLower === 'dossier-conclusion' ||
      titleLower.includes('conclusion') ||
      titleLower.includes('closing') ||
      titleLower.includes('epilogue') ||
      (existingSections.length === 8 && sIdx === 7) ||
      (existingSections.length === 4 && sIdx === 3)
    ) {
      targetIndex = 3;
    } else if (
      idLower === 'impact-unresolved' ||
      idLower === 'turning-point' ||
      idLower === 'consequences' ||
      idLower === 'unresolved-questions' ||
      titleLower.includes('turning point') ||
      titleLower.includes('consequence') ||
      titleLower.includes('unresolved') ||
      titleLower.includes('impact') ||
      titleLower.includes('aftermath') ||
      (existingSections.length === 8 && (sIdx === 4 || sIdx === 5 || sIdx === 6)) ||
      (existingSections.length === 4 && sIdx === 2)
    ) {
      targetIndex = 2;
    } else if (
      idLower === 'investigation-evidence' ||
      idLower === 'behind-the-curtains' ||
      idLower === 'evidence-documentation' ||
      titleLower.includes('behind the curtains') ||
      titleLower.includes('behind the curtain') ||
      titleLower.includes('investigation') ||
      titleLower.includes('evidence') ||
      titleLower.includes('documentation') ||
      titleLower.includes('records') ||
      (existingSections.length === 8 && (sIdx === 2 || sIdx === 3)) ||
      (existingSections.length === 4 && sIdx === 1)
    ) {
      targetIndex = 1;
    } else {
      // Default to section 0 (Case Overview)
      targetIndex = 0;
    }

    const bucket = sectionBuckets[targetIndex];
    const secParas = (sec.content || [])
      .flatMap((c) => (typeof c === 'string' ? c.split(/\n\n+/) : [c]))
      .filter((p) => (typeof p === 'string' ? p.trim().length > 0 : Boolean(p)));

    // If bucket already has content and this is another distinct section being merged, include a clean markdown subtitle
    if (
      bucket.paragraphs.length > 0 &&
      secParas.length > 0 &&
      sec.title &&
      !sec.title.toLowerCase().includes(ORIGINAL_FOUR_SECTIONS[targetIndex].title.toLowerCase())
    ) {
      bucket.paragraphs.push(`### ${sec.title}`);
    }
    bucket.paragraphs.push(...secParas);

    if (sec.bulletPoints && sec.bulletPoints.length > 0) {
      bucket.bulletPoints.push(...sec.bulletPoints);
    }
    if (!bucket.figure && sec.figure) {
      bucket.figure = sec.figure;
    }
    if (sec.claims && sec.claims.length > 0) {
      bucket.claims.push(...sec.claims);
    }
  });

  return ORIGINAL_FOUR_SECTIONS.map((def, idx) => {
    const bucket = sectionBuckets[idx];
    return {
      id: def.id,
      title: def.title,
      content: bucket.paragraphs.length > 0 ? bucket.paragraphs : [''],
      bulletPoints: bucket.bulletPoints,
      figure: bucket.figure,
      claims: bucket.claims,
    };
  });
}

/**
 * Validates that all 4 original sections contain meaningful text and at least 1 citation exists.
 */
export function validateDossierSubmission(
  sections: ArticleSection[],
  citations: ArticleCitation[]
): {
  isValid: boolean;
  sectionErrors: Record<string, string>;
  citationError?: string;
  missingSectionTitles: string[];
} {
  const sectionErrors: Record<string, string> = {};
  const missingSectionTitles: string[] = [];

  ORIGINAL_FOUR_SECTIONS.forEach((def, index) => {
    const sec = sections[index] || sections.find((s) => s.id === def.id || s.title?.toLowerCase().includes(def.title.toLowerCase()));
    const content = sec?.content
      ? (Array.isArray(sec.content) ? sec.content.join(' ').trim() : String(sec.content).trim())
      : '';

    if (!content || content.length < 15) {
      sectionErrors[def.id] = `Section ${index + 1} ("${def.title}") requires meaningful content (minimum 15 characters).`;
      missingSectionTitles.push(`Section ${index + 1} (${def.title})`);
    }
  });

  let citationError: string | undefined = undefined;
  const validCitations = citations.filter(
    (c) => c && (c.title?.trim().length > 0 || c.url?.trim().length > 0)
  );

  if (validCitations.length === 0) {
    citationError = 'Section §5 Sources / References is mandatory. At least one verifiable source or reference must be provided before submission.';
  }

  return {
    isValid: Object.keys(sectionErrors).length === 0 && !citationError,
    sectionErrors,
    citationError,
    missingSectionTitles,
  };
}
