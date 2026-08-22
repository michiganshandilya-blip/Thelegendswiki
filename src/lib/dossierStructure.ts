import { ArticleSection, ArticleCitation } from '../types';

/**
 * Standardized Investigative Dossier Structure for TheLegendsWiki
 * 
 * Every dossier across all five categories follows this exact 9-part editorial structure:
 * 1. Case / Event Overview
 * 2. The Official Story
 * 3. What Happened Behind the Curtains
 * 4. Evidence & Documentation
 * 5. The Turning Point
 * 6. The Consequences
 * 7. What Remains Unresolved
 * 8. Dossier Conclusion
 * 9. Sources / References (Mandatory Citations Collection)
 */

export interface DossierSectionDefinition {
  id: string;
  order: number;
  title: string;
  helperText: string;
  placeholder: string;
  categoryGuidance?: Record<string, string>;
}

export const MANDATORY_DOSSIER_SECTIONS: DossierSectionDefinition[] = [
  {
    id: 'case-overview',
    order: 1,
    title: 'Case / Event Overview',
    helperText: 'Explain what the dossier is about, what happened or what is being investigated, the relevant entities, and why the subject matters.',
    placeholder: 'Introduce the core case, key entities, timeline scope, and why this subject is historically or systemically consequential...',
    categoryGuidance: {
      'behind-financial-markets': 'Summarize the financial market event, asset class, institutions involved, and the scale of economic impact.',
      'behind-corporations': 'Introduce the corporation, key executives, market position, and the nature of the corporate investigation.',
      'behind-history': 'Establish the historical event, geopolitical actors, era, and historical significance.',
      'behind-the-evidence': 'Introduce the specific document, ledger, leaked archive, or physical evidence being examined.',
      'behind-the-mysteries': 'Introduce the unexplained disappearance, anomaly, or historical case and why it warrants investigation.',
    },
  },
  {
    id: 'official-story',
    order: 2,
    title: 'The Official Story',
    helperText: 'Explain the publicly accepted, officially reported, or commonly documented version of events.',
    placeholder: 'Document the mainstream consensus, press releases, government statements, standard textbooks, or official committee findings...',
    categoryGuidance: {
      'behind-financial-markets': 'Present the standard market explanation, official regulatory releases, and mainstream financial news consensus.',
      'behind-corporations': 'Present the public corporate relations narrative, annual report disclosures, and official executive statements.',
      'behind-history': 'Present the standard historiographical account and officially sanctioned narrative of the era.',
      'behind-the-evidence': 'Present the official interpretation, original classification, or initial public explanation of the record.',
      'behind-the-mysteries': 'Present the known public accounts, initial police/investigative reports, and popular explanations.',
    },
  },
  {
    id: 'behind-the-curtains',
    order: 3,
    title: 'What Happened Behind the Curtains',
    helperText: 'Present the important decisions, relationships, circumstances, mechanisms, overlooked details, or developments that are not obvious from the standard public narrative. Do NOT present speculation as established fact.',
    placeholder: 'Expose the verified internal decisions, opaque transactions, backroom communications, hidden incentives, or overlooked developments...',
    categoryGuidance: {
      'behind-financial-markets': 'Expose the underlying liquidity mechanisms, off-balance-sheet vehicles, synthetic derivatives, or private collusion.',
      'behind-corporations': 'Expose private boardroom deliberations, concealed conflicts of interest, internal memos, or backroom dealings.',
      'behind-history': 'Detail the undisclosed diplomatic cables, unpublicized pacts, private motivations, or overlooked circumstances.',
      'behind-the-evidence': 'Detail what the underlying document reveals when analyzed against suppressed context and internal logs.',
      'behind-the-mysteries': 'Present verified overlooked circumstances, hidden witness accounts, anomalous data, and timeline discrepancies.',
    },
  },
  {
    id: 'evidence-documentation',
    order: 4,
    title: 'Evidence & Documentation',
    helperText: 'Present the evidence supporting the claims made in the dossier. Sources must be connected to the relevant claims wherever practical. Use credible and identifiable sources. Distinguish primary evidence from secondary reporting when possible.',
    placeholder: 'Catalogue verified primary sources, audit records, judicial filings, regulatory depositions, declassified cables, or data forensics...',
    categoryGuidance: {
      'behind-financial-markets': 'Cite regulatory filings (SEC/FINRA/CFTC), settlement decrees, trading logs, and accounting audits.',
      'behind-corporations': 'Cite internal whistleblower memos, court depositions, forensic accounting audits, and FOIA releases.',
      'behind-history': 'Cite declassified state archives, diplomatic dispatches, contemporaneous journals, and treaty transcripts.',
      'behind-the-evidence': 'Examine chain of custody, authentication records, metadata analysis, and corroborating archives.',
      'behind-the-mysteries': 'Cite authenticated case files, physical evidence logs, forensic pathology reports, and radar/telemetry data.',
    },
  },
  {
    id: 'turning-point',
    order: 5,
    title: 'The Turning Point',
    helperText: 'Explain the specific event, discovery, document, decision, revelation, or development that significantly changed the course or understanding of the case.',
    placeholder: 'Identify the exact catalyst—a pivotal leak, critical audit failure, sudden default, unexpected confession, or archival discovery...',
    categoryGuidance: {
      'behind-financial-markets': 'Highlight the sudden margin call, bank run, liquidity freeze, or whistleblower alert that broke the scheme.',
      'behind-corporations': 'Highlight the internal leak, subpoena, investigative series, or executive resignation that triggered exposure.',
      'behind-history': 'Highlight the pivotal intelligence intercept, battle turn, treaty breach, or leadership shift that altered the outcome.',
      'behind-the-evidence': 'Highlight the breakthrough decryption, forensic discovery, or unsealing order that proved the document’s veracity.',
      'behind-the-mysteries': 'Highlight the crucial physical discovery, unsealed archive, or breakthrough lead that reshaped the investigation.',
    },
  },
  {
    id: 'consequences',
    order: 6,
    title: 'The Consequences',
    helperText: 'Explain what happened afterward and the resulting financial, corporate, historical, legal, institutional, or other relevant consequences.',
    placeholder: 'Detail the concrete aftermath: bankruptcies, regulatory reforms, geopolitical treaties, legal convictions, or institutional shifts...',
    categoryGuidance: {
      'behind-financial-markets': 'Detail market collapses, wealth redistribution, criminal indictments, and new financial regulations.',
      'behind-corporations': 'Detail corporate restructuring, civil penalties, loss of market value, and board overhauls.',
      'behind-history': 'Detail territorial changes, geopolitical alignments, societal impact, and long-term historical legacy.',
      'behind-the-evidence': 'Detail how the revelation forced policy revisions, historical reassessments, or legal reforms.',
      'behind-the-mysteries': 'Detail subsequent institutional actions, protocol changes, closed investigations, or ongoing public debates.',
    },
  },
  {
    id: 'unresolved-questions',
    order: 7,
    title: 'What Remains Unresolved',
    helperText: 'Clearly identify unanswered questions, disputed claims, missing evidence, conflicting accounts, or facts that cannot currently be independently verified.',
    placeholder: 'List unverified claims, sealed records, missing ledgers, disputed testimonies, or questions that current evidence cannot answer...',
    categoryGuidance: {
      'behind-financial-markets': 'Identify missing trading archives, unrecovered offshore funds, and unprosecuted intermediaries.',
      'behind-corporations': 'Identify sealed settlements, destroyed records, unaddressed shareholder claims, and unanswered executive roles.',
      'behind-history': 'Identify withheld archival tranches, contradictory eyewitness testimonies, and unresolved historical debates.',
      'behind-the-evidence': 'Identify missing corroborating pages, contested provenance points, and unverified secondary assertions.',
      'behind-the-mysteries': 'Identify missing physical remains/artifacts, unverified sightings, and hypotheses that lack definitive proof.',
    },
  },
  {
    id: 'dossier-conclusion',
    order: 8,
    title: 'Dossier Conclusion',
    helperText: 'Provide a concise, evidence-based conclusion that summarizes the significance of the dossier without sensationalism or unsupported speculation.',
    placeholder: 'Provide an objective, evidence-based assessment summarizing the dossier’s core significance and lasting institutional lessons...',
    categoryGuidance: {
      'behind-financial-markets': 'Summarize the structural vulnerabilities exposed in modern financial architecture.',
      'behind-corporations': 'Summarize the ethical, governance, and oversight lessons from the corporate investigation.',
      'behind-history': 'Summarize the enduring historical lesson grounded in verifiable documentation.',
      'behind-the-evidence': 'Summarize why this evidentiary record remains critical to historical accuracy.',
      'behind-the-mysteries': 'Summarize the most credible facts of the case while maintaining rigorous epistemic humility.',
    },
  },
];

/**
 * Creates a fresh, standardized 8-section template for a new article.
 */
export function createDefaultDossierSections(): ArticleSection[] {
  return MANDATORY_DOSSIER_SECTIONS.map((def) => ({
    id: def.id,
    title: def.title,
    content: [''],
    bulletPoints: [],
  }));
}

/**
 * Normalizes and maps any existing article sections into the mandatory 8-section structure.
 * Preserves all existing content, bullet points, figures, and subsections without discarding data.
 */
export function mapToStandardDossierSections(
  existingSections?: ArticleSection[],
  rawContent?: string | string[]
): ArticleSection[] {
  const result: ArticleSection[] = createDefaultDossierSections();

  if (!existingSections || existingSections.length === 0) {
    // If there is only raw content, put it into section 1 (Case Overview) or split into sections
    if (rawContent) {
      const text = typeof rawContent === 'string' ? rawContent : rawContent.join('\n\n');
      if (text.trim()) {
        result[0].content = text.split(/\n\n+/).filter(Boolean);
      }
    }
    return result;
  }

  // Keep track of which existing sections got mapped
  const mappedIndices = new Set<number>();

  // 1. Try exact or fuzzy title matching against mandatory sections
  MANDATORY_DOSSIER_SECTIONS.forEach((def, targetIdx) => {
    const cleanDefTitle = def.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanDefId = def.id.toLowerCase().replace(/[^a-z0-9]/g, '');

    const foundIdx = existingSections.findIndex((sec, sIdx) => {
      if (mappedIndices.has(sIdx)) return false;
      const cleanSecTitle = (sec.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanSecId = (sec.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      return (
        cleanSecTitle === cleanDefTitle ||
        cleanSecId === cleanDefId ||
        cleanSecTitle.includes(cleanDefTitle) ||
        cleanDefTitle.includes(cleanSecTitle) ||
        (def.id === 'case-overview' && (cleanSecTitle.includes('overview') || cleanSecTitle.includes('introduction') || cleanSecTitle.includes('background'))) ||
        (def.id === 'official-story' && (cleanSecTitle.includes('official') || cleanSecTitle.includes('narrative') || cleanSecTitle.includes('accepted'))) ||
        (def.id === 'behind-the-curtains' && (cleanSecTitle.includes('behind') || cleanSecTitle.includes('curtain') || cleanSecTitle.includes('mechanism') || cleanSecTitle.includes('hidden'))) ||
        (def.id === 'evidence-documentation' && (cleanSecTitle.includes('evidence') || cleanSecTitle.includes('document') || cleanSecTitle.includes('records') || cleanSecTitle.includes('proof'))) ||
        (def.id === 'turning-point' && (cleanSecTitle.includes('turning') || cleanSecTitle.includes('point') || cleanSecTitle.includes('catalyst') || cleanSecTitle.includes('discovery'))) ||
        (def.id === 'consequences' && (cleanSecTitle.includes('consequence') || cleanSecTitle.includes('aftermath') || cleanSecTitle.includes('impact') || cleanSecTitle.includes('result'))) ||
        (def.id === 'unresolved-questions' && (cleanSecTitle.includes('unresolved') || cleanSecTitle.includes('mystery') || cleanSecTitle.includes('question') || cleanSecTitle.includes('open'))) ||
        (def.id === 'dossier-conclusion' && (cleanSecTitle.includes('conclusion') || cleanSecTitle.includes('summary') || cleanSecTitle.includes('assessment') || cleanSecTitle.includes('closing')))
      );
    });

    if (foundIdx >= 0) {
      const match = existingSections[foundIdx];
      mappedIndices.add(foundIdx);
      result[targetIdx] = {
        id: def.id,
        title: def.title,
        content: match.content && match.content.length > 0 && match.content.some((p) => p.trim()) ? match.content : [''],
        bulletPoints: match.bulletPoints || [],
        orderedPoints: match.orderedPoints,
        figure: match.figure,
        subsections: match.subsections,
      };
    }
  });

  // 2. If there are existing sections that weren't matched, preserve them by appending their content to the most relevant section or Case Overview
  existingSections.forEach((sec, sIdx) => {
    if (!mappedIndices.has(sIdx)) {
      const secText = (sec.content || []).join('\n\n').trim();
      if (secText) {
        // Append to Case Overview or Behind the Curtains
        const target = result[2].content[0] ? result[2] : result[0];
        const existingText = target.content.join('\n\n').trim();
        target.content = existingText 
          ? [existingText, `### ${sec.title}`, ...sec.content] 
          : sec.content;

        if (sec.bulletPoints && sec.bulletPoints.length > 0) {
          target.bulletPoints = [...(target.bulletPoints || []), ...sec.bulletPoints];
        }
        if (!target.figure && sec.figure) {
          target.figure = sec.figure;
        }
      }
    }
  });

  return result;
}

/**
 * Validates that all 8 mandatory sections contain meaningful text and at least 1 citation exists.
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

  MANDATORY_DOSSIER_SECTIONS.forEach((def, index) => {
    const sec = sections[index] || sections.find((s) => s.id === def.id || s.title === def.title);
    const content = sec?.content ? sec.content.join(' ').trim() : '';

    if (!content || content.length < 15) {
      sectionErrors[def.id] = `Section §${def.order} "${def.title}" is required and must contain meaningful content (minimum 15 characters).`;
      missingSectionTitles.push(`§${def.order} ${def.title}`);
    }
  });

  let citationError: string | undefined = undefined;
  const validCitations = citations.filter(
    (c) => c && (c.title?.trim().length > 0 || c.url?.trim().length > 0)
  );

  if (validCitations.length === 0) {
    citationError = 'Section §9 Sources / References is mandatory. At least one verifiable source or reference must be provided before submission.';
  }

  return {
    isValid: Object.keys(sectionErrors).length === 0 && !citationError,
    sectionErrors,
    citationError,
    missingSectionTitles,
  };
}
