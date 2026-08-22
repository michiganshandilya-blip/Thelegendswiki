import { GoogleGenAI } from '@google/genai';
import { DEMO_ARTICLES, DEMO_CATEGORIES } from '../data/demoData';

// System settings for AI
export interface AiSettings {
  assistantEnabled: boolean;
  editorToolsEnabled: boolean;
  searchAssistantEnabled: boolean;
  rateLimitPerMinute: number;
  modelName: string;
  temperature: number;
}

// In-memory persistent settings and rate-limiting
let currentSettings: AiSettings = {
  assistantEnabled: true,
  editorToolsEnabled: true,
  searchAssistantEnabled: true,
  rateLimitPerMinute: 60,
  modelName: 'gemini-3.7-flash',
  temperature: 0.7,
};

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Simple in-memory usage metrics
let totalAiRequests = 0;
let lastError: string | null = null;
let lastRequestTime: string | null = null;

function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(clientId);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(clientId, {
      count: 1,
      resetTime: now + 60 * 1000,
    });
    return { allowed: true };
  }

  if (record.count >= currentSettings.rateLimitPerMinute) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

// Prepare compact grounded context from TheLegendsWiki knowledge base
function buildEncyclopediaGroundingContext(): string {
  const articlesSummary = DEMO_ARTICLES.map((a) => {
    return `- Title: "${a.title}" (slug: /wiki/${a.slug}, category: ${a.category}, type: ${a.articleType || 'general'})
  Summary: ${a.summary}
  Sections: ${a.sections.map((s) => s.title).join(', ')}`;
  }).join('\n\n');

  const categoriesSummary = DEMO_CATEGORIES.map(
    (c) => `- Category: "${c.name}" (slug: /category/${c.slug}) - ${c.description}`
  ).join('\n');

  return `THELEGENDSWIKI VERIFIED ENCYCLOPEDIA REPOSITORY:
Available Categories:
${categoriesSummary}

Current Highlighted & Published Articles:
${articlesSummary}`;
}

// Lazy initialization of Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Helper to parse and extract a friendly error message from Gemini API errors
 */
function formatGeminiError(err: any): string {
  if (!err) return 'An unknown AI generation error occurred.';

  const rawMessage = err.message || String(err);

  // Check if error contains JSON
  let parsedError: any = null;
  try {
    const jsonMatch = rawMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedError = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Not valid JSON
  }

  const code = parsedError?.error?.code || err.status || err.statusCode;
  const status = parsedError?.error?.status || '';
  const message = parsedError?.error?.message || rawMessage;

  // Extract retry duration if present
  let retrySeconds = '';
  const retryMatch = message.match(/retry in\s+([\d\.]+s?)/i);
  if (retryMatch && retryMatch[1]) {
    retrySeconds = retryMatch[1];
  } else if (parsedError?.error?.details?.[0]?.retryDelay) {
    retrySeconds = String(parsedError.error.details[0].retryDelay);
  }

  if (
    code === 429 ||
    status === 'RESOURCE_EXHAUSTED' ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota') ||
    message.includes('429')
  ) {
    if (retrySeconds) {
      return `Gemini API rate limit reached. Please wait ${retrySeconds} before asking Code X again.`;
    }
    return 'Gemini API rate limit or quota exceeded. Please wait a few moments and try again.';
  }

  if (
    code === 503 ||
    status === 'UNAVAILABLE' ||
    message.includes('high demand') ||
    message.includes('UNAVAILABLE') ||
    message.includes('503')
  ) {
    return 'The Gemini AI service is currently experiencing high demand. Spikes are temporary—please try again in a few moments.';
  }

  if (
    code === 400 ||
    message.includes('API_KEY_INVALID') ||
    message.includes('API key not valid')
  ) {
    return 'Invalid or missing Gemini API credentials. Please check your GEMINI_API_KEY environment configuration.';
  }

  // Clean raw tags
  const cleanMsg = message.replace(/^ApiError:\s*/i, '').replace(/\{[\s\S]*\}/, '').trim();
  return cleanMsg || 'Failed to communicate with the Gemini language model. Please try again.';
}

/**
 * Executes a Gemini generateContent request with automatic retry and fallback across valid modern models
 */
async function generateWithFallback(
  ai: GoogleGenAI,
  primaryModel: string,
  params: {
    contents: any;
    config?: any;
  }
) {
  // Only valid modern models from @google/genai guidelines
  const candidateModels = [
    primaryModel,
    'gemini-3.7-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ].filter(Boolean);

  // Filter out any deprecated model names and deduplicate
  const fallbackModels = candidateModels.filter((model, idx, arr) => {
    const isDup = arr.indexOf(model) !== idx;
    const isDeprecated =
      model.includes('1.5') ||
      model.includes('2.0') ||
      model.includes('2.5') ||
      model === 'gemini-pro';
    return !isDup && !isDeprecated;
  });

  let lastCaughtError: any = null;

  for (const model of fallbackModels) {
    // Attempt up to 2 retries with jitter delay for transient 503/429 spikes
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return { response, modelUsed: model };
      } catch (err: any) {
        lastCaughtError = err;
        const errMsg = err?.message || String(err);

        const isNotFoundOrDeprecated =
          errMsg.includes('404') ||
          errMsg.includes('NOT_FOUND') ||
          errMsg.includes('no longer available') ||
          errMsg.includes('not found');

        if (isNotFoundOrDeprecated) {
          console.warn(`Model "${model}" is not available (${errMsg.slice(0, 120)}...). Skipping to next candidate.`);
          break; // Break inner retry loop, try next model in fallbackModels
        }

        const isTransient =
          errMsg.includes('429') ||
          errMsg.includes('503') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('high demand') ||
          errMsg.includes('UNAVAILABLE') ||
          errMsg.includes('quota') ||
          errMsg.includes('500');

        if (isTransient) {
          console.warn(
            `Model "${model}" encountered temporary issue (${errMsg.slice(0, 100)}...). Retry attempt ${
              attempt + 1
            }/2.`
          );
          if (attempt === 0) {
            await new Promise((resolve) => setTimeout(resolve, 800));
            continue;
          }
          break; // On 2nd transient failure for this model, try next model in fallbackModels
        }

        // For other fatal errors, break to next model
        break;
      }
    }
  }

  throw lastCaughtError;
}

/**
 * Handles AI Chat with Code X
 */
export async function handleAiChat(
  body: {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    currentArticleSlug?: string;
    currentArticleTitle?: string;
    currentArticleContent?: string;
  },
  clientIp: string = 'anonymous'
) {
  if (!currentSettings.assistantEnabled) {
    return { error: 'Code X assistant is currently disabled by administrators.' };
  }

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return { error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds before asking again.` };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      error: 'GEMINI_API_KEY is not configured on the server. Please configure the GEMINI_API_KEY environment variable in Google AI Studio.',
    };
  }

  try {
    totalAiRequests += 1;
    lastRequestTime = new Date().toISOString();

    const grounding = buildEncyclopediaGroundingContext();
    let contextualArticleInfo = '';
    if (body.currentArticleTitle && body.currentArticleContent) {
      contextualArticleInfo = `\n\nCURRENT ARTICLE BEING VIEWED BY USER:
Title: ${body.currentArticleTitle} (Slug: /wiki/${body.currentArticleSlug || ''})
Content Excerpt: ${body.currentArticleContent.slice(0, 3000)}`;
    }

    const systemInstruction = `You are "Code X", an intelligent, versatile, and friendly conversational AI assistant for TheLegendsWiki and general knowledge inquiries.

CORE CAPABILITIES & PERSONALITY:
1. Name: You are "Code X".
2. Normal Conversation: You warmly handle everyday conversational messages such as greetings ("Hi", "Hello", "Hey"), wellness queries ("How are you?", "What are you doing?"), general inquiries, advice, science, history, coding, philosophy, and casual banter.
3. Multi-turn Follow-ups: You maintain full context of previous messages in the conversation and answer follow-up questions naturally.
4. TheLegendsWiki Knowledge: When asked about TheLegendsWiki, its contents, articles, or categories, provide authoritative, structured, and helpful encyclopedic responses. If referencing articles in the repository, you can use the wiki link syntax: [[Article Title|/wiki/article-slug]].
5. Tone: Helpful, articulate, polite, neutral, and clear. Avoid robotic or overly defensive language.

${grounding}
${contextualArticleInfo}`;

    // Filter messages to begin at first user message for valid multi-turn dialog
    const rawMessages = body.messages || [];
    const firstUserIndex = rawMessages.findIndex((m) => m.role === 'user');
    const validHistory = firstUserIndex >= 0 ? rawMessages.slice(firstUserIndex) : rawMessages;

    // Convert messages to Gemini format: role 'user' and role 'model'
    const contents = validHistory.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    if (contents.length === 0) {
      contents.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    const { response } = await generateWithFallback(
      ai,
      currentSettings.modelName || 'gemini-3.7-flash',
      {
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: currentSettings.temperature ?? 0.7,
        },
      }
    );

    const replyText =
      response.text?.trim() ||
      'I am Code X, your AI assistant. How may I help you with your question or research today?';

    // Extract suggested related articles from the repository if mentioned
    const suggestedArticles = DEMO_ARTICLES.filter((a) => {
      const titleLower = a.title.toLowerCase();
      return (
        replyText.toLowerCase().includes(titleLower) ||
        (body.currentArticleSlug &&
          a.slug !== body.currentArticleSlug &&
          replyText.toLowerCase().includes(a.category.toLowerCase()))
      );
    })
      .slice(0, 3)
      .map((a) => ({
        title: a.title,
        slug: a.slug,
        category: a.category,
        summary: a.summary,
      }));

    return {
      reply: replyText,
      suggestedArticles,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.error('Gemini API Error in handleAiChat:', err);
    return {
      error: formatGeminiError(err),
    };
  }
}

/**
 * Handles AI Writing Assistant inside the Article Editor
 */
export async function handleAiWritingAssist(
  body: {
    action:
      | 'generate_outline'
      | 'improve_writing'
      | 'summarize_text'
      | 'expand_explanation'
      | 'fix_grammar'
      | 'suggest_title'
      | 'suggest_categories'
      | 'suggest_keywords'
      | 'suggest_related';
    title?: string;
    summary?: string;
    content?: string;
    category?: string;
    customPrompt?: string;
  },
  clientIp: string = 'anonymous'
) {
  if (!currentSettings.editorToolsEnabled) {
    return { error: 'AI Article Writing Assistant is currently disabled by administrators.' };
  }

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return { error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds before trying again.` };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      error: 'GEMINI_API_KEY is not configured on the server. Please configure the API key in AI Studio Secrets.',
    };
  }

  try {
    totalAiRequests += 1;
    lastRequestTime = new Date().toISOString();

    let taskInstruction = '';
    switch (body.action) {
      case 'generate_outline':
        taskInstruction = `Generate a comprehensive, academic, Wikipedia-style section and subsection outline for an article titled "${body.title || 'Untitled'}".
Include recommended section titles, 2-3 bullet point summaries per section, and suggestions for primary historical or scientific citations.
Format the output clearly in clean Markdown.`;
        break;

      case 'improve_writing':
        taskInstruction = `Rewrite and improve the following encyclopedic text to have an authoritative, scholarly, neutral tone (Neutral Point of View). Remove casual phrasing, fix run-on sentences, and elevate academic clarity while preserving all factual data:
Text:
${body.content || body.summary || ''}`;
        break;

      case 'summarize_text':
        taskInstruction = `Write a crisp, informative, 2-3 sentence encyclopedia lead summary paragraph for the following article content titled "${body.title || ''}":
Content:
${body.content || body.summary || ''}`;
        break;

      case 'expand_explanation':
        taskInstruction = `Expand the following concise draft into a detailed, well-explained encyclopedic section with historical context, key milestones, significance, and balanced scholarly commentary:
Draft:
${body.content || ''}`;
        break;

      case 'fix_grammar':
        taskInstruction = `Proofread the following text for spelling, grammar, punctuation, and typographical accuracy without changing the intended meaning or tone. Output only the corrected text:
Text:
${body.content || ''}`;
        break;

      case 'suggest_title':
        taskInstruction = `Based on this summary and content, suggest 5 authoritative, precise encyclopedia article titles and their clean URL kebab-case slugs:
Summary: ${body.summary || ''}
Content: ${(body.content || '').slice(0, 1000)}
Format as a bullet list with Title and suggested /wiki/slug.`;
        break;

      case 'suggest_categories':
        taskInstruction = `Based on this article titled "${body.title || ''}", recommend the best primary category (from: History & Civilizations, Science & Mathematics, Philosophy & Thought, Literature & Arts, Technology & Invention, Geography & Exploration, Mythologies & Folklore, Extraordinary Figures), subcategories, and 5-8 relevant taxonomic tags.`;
        break;

      case 'suggest_keywords':
        taskInstruction = `Extract 8-12 search engine keywords, index terms, and related historical/scientific concepts for an article titled "${body.title || ''}" with summary:
${body.summary || ''}`;
        break;

      case 'suggest_related':
        const existingTitles = DEMO_ARTICLES.map((a) => a.title).join(', ');
        taskInstruction = `Given the article topic "${body.title || ''}", suggest 4-6 related encyclopedic topics that should be cross-referenced or authored. Mention if any match existing entries in TheLegendsWiki (Existing: ${existingTitles}).`;
        break;

      default:
        taskInstruction = body.customPrompt || 'Assist with writing this encyclopedia entry.';
    }

    const { response } = await generateWithFallback(
      ai,
      currentSettings.modelName || 'gemini-3.7-flash',
      {
        contents: `You are an elite academic editor and encyclopedia curator for TheLegendsWiki.
Follow strict scholarly standards: neutrality, precision, no first-person narrative, no conversational fluff.

TASK:
${taskInstruction}

${body.customPrompt ? `ADDITIONAL USER INSTRUCTIONS:\n${body.customPrompt}` : ''}

RESULT:`,
        config: {
          temperature: 0.5,
        },
      }
    );

    return {
      result: response.text || '',
      action: body.action,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.error('Gemini API Error in handleAiWritingAssist:', err);
    return {
      error: formatGeminiError(err),
    };
  }
}

/**
 * Handles AI Search intent analysis & ranking
 */
export async function handleAiSearch(
  body: {
    query: string;
    category?: string;
  },
  clientIp: string = 'anonymous'
) {
  if (!currentSettings.searchAssistantEnabled) {
    return { error: 'AI Search is currently disabled by administrators.' };
  }

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return { error: `Rate limit exceeded. Please wait ${rateCheck.retryAfter} seconds.` };
  }

  const ai = getGeminiClient();
  if (!ai) {
    return {
      error: 'GEMINI_API_KEY is not configured on the server.',
    };
  }

  try {
    totalAiRequests += 1;
    lastRequestTime = new Date().toISOString();

    const articlesCatalog = DEMO_ARTICLES.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      category: a.category,
      summary: a.summary,
      tags: a.tags || [],
    }));

    const prompt = `You are the smart search engine indexer for TheLegendsWiki.
The user entered a natural language query: "${body.query}"

CURRENT CATALOG:
${JSON.stringify(articlesCatalog, null, 2)}

INSTRUCTIONS:
1. Identify the 1 to 5 most relevant articles from the catalog that best address or relate to the user query.
2. Provide a concise, 1-2 sentence encyclopedic overview answering the user's intent.
3. Suggest 2-3 refined keyword searches.
4. Output your response strictly as valid JSON with the schema:
{
  "directAnswer": "concise synthesized answer to the query",
  "matchedSlugs": ["slug-1", "slug-2"],
  "relevanceExplanation": "why these entries match",
  "suggestedQueries": ["refined search 1", "refined search 2"]
}`;

    const { response } = await generateWithFallback(
      ai,
      currentSettings.modelName || 'gemini-3.7-flash',
      {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }
    );

    let parsed = {
      directAnswer: '',
      matchedSlugs: [] as string[],
      relevanceExplanation: '',
      suggestedQueries: [] as string[],
    };

    try {
      if (response.text) {
        parsed = JSON.parse(response.text);
      }
    } catch {
      // Fallback
    }

    // Map matched slugs to full article summaries
    const matchedArticles = parsed.matchedSlugs
      .map((slug) => DEMO_ARTICLES.find((a) => a.slug === slug))
      .filter(Boolean)
      .map((a: any) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        category: a.category,
        summary: a.summary,
        readingTime: a.readingTime,
        featuredImage: a.featuredImage || a.image,
      }));

    return {
      directAnswer: parsed.directAnswer,
      matchedArticles,
      relevanceExplanation: parsed.relevanceExplanation,
      suggestedQueries: parsed.suggestedQueries,
      timestamp: new Date().toISOString(),
    };
  } catch (err: any) {
    lastError = err?.message || String(err);
    console.error('Gemini API Error in handleAiSearch:', err);

    // Fallback: Perform local archival semantic and keyword synthesis if Gemini model is temporarily busy/unavailable
    const rawQuery = (body.query || '').toLowerCase().trim();
    const queryWords = rawQuery.split(/\s+/).filter((w) => w.length > 2);

    const localMatches = DEMO_ARTICLES.filter((a) => {
      if (body.category && a.categorySlug !== body.category && a.category.toLowerCase() !== body.category.toLowerCase()) {
        return false;
      }
      const t = a.title.toLowerCase();
      const s = a.summary.toLowerCase();
      const c = a.category.toLowerCase();
      const tags = (a.tags || []).map((tg) => tg.toLowerCase());
      const exact = t.includes(rawQuery) || s.includes(rawQuery);
      const wordMatch = queryWords.some((w) => t.includes(w) || s.includes(w) || c.includes(w) || tags.includes(w));
      return exact || wordMatch;
    }).slice(0, 4);

    if (localMatches.length > 0) {
      return {
        directAnswer: `Archival records matching "${body.query}" identified in TheLegendsWiki verified codex.`,
        matchedArticles: localMatches.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          category: a.category,
          summary: a.summary,
          readingTime: a.readingTime || a.readTime || 5,
          featuredImage: a.featuredImage || a.image,
        })),
        relevanceExplanation: 'Catalog cross-referencing matched these verified encyclopedia entries.',
        suggestedQueries: localMatches.slice(0, 3).map((a) => a.title),
        timestamp: new Date().toISOString(),
      };
    }

    return {
      error: formatGeminiError(err),
    };
  }
}

/**
 * Admin AI Settings Management
 */
export function getAiSettings() {
  return {
    settings: currentSettings,
    stats: {
      totalRequests: totalAiRequests,
      lastRequestTime,
      lastError,
      hasApiKey: !!process.env.GEMINI_API_KEY,
    },
  };
}

export function updateAiSettings(newSettings: Partial<AiSettings>) {
  currentSettings = {
    ...currentSettings,
    ...newSettings,
  };
  return getAiSettings();
}
