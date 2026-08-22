/**
 * Client service for AI Wiki Assistant, Writing Tools, and Natural Language Search.
 * Calls secure server-side proxy routes (/api/ai/*).
 */

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AiChatResponse {
  reply?: string;
  suggestedArticles?: Array<{
    title: string;
    slug: string;
    category: string;
    summary: string;
  }>;
  error?: string;
  timestamp?: string;
}

export interface AiWritingAssistResponse {
  result?: string;
  action?: string;
  error?: string;
  timestamp?: string;
}

export interface AiSearchResponse {
  directAnswer?: string;
  matchedArticles?: Array<{
    id: string;
    title: string;
    slug: string;
    category: string;
    summary: string;
    readingTime?: number;
    featuredImage?: string;
  }>;
  relevanceExplanation?: string;
  suggestedQueries?: string[];
  error?: string;
  timestamp?: string;
}

export interface AiAdminSettings {
  settings: {
    assistantEnabled: boolean;
    editorToolsEnabled: boolean;
    searchAssistantEnabled: boolean;
    rateLimitPerMinute: number;
    modelName: string;
    temperature: number;
  };
  stats: {
    totalRequests: number;
    lastRequestTime: string | null;
    lastError: string | null;
    hasApiKey: boolean;
  };
}

/**
 * Ask the AI Wiki Assistant
 */
export async function askAiAssistant(params: {
  messages: AiChatMessage[];
  currentArticleSlug?: string;
  currentArticleTitle?: string;
  currentArticleContent?: string;
}): Promise<AiChatResponse> {
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'Failed to receive response from AI Assistant.' };
    }
    return data;
  } catch (err: any) {
    return {
      error:
        err?.message ||
        'Unable to connect to the AI Assistant service. Please check your network or server status.',
    };
  }
}

/**
 * Request AI Writing Assistance (Outline, tone improvement, summarization, etc.)
 */
export async function requestWritingAssist(params: {
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
}): Promise<AiWritingAssistResponse> {
  try {
    const res = await fetch('/api/ai/writing-assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'AI Writing Assistant encountered an error.' };
    }
    return data;
  } catch (err: any) {
    return {
      error:
        err?.message ||
        'Unable to connect to the AI Writing Assistant. Please verify server connectivity.',
    };
  }
}

/**
 * Perform Natural Language Semantic AI Search
 */
export async function performAiSearch(params: {
  query: string;
  category?: string;
}): Promise<AiSearchResponse> {
  try {
    const res = await fetch('/api/ai/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      return { error: data.error || 'AI Search could not process your query.' };
    }
    return data;
  } catch (err: any) {
    return {
      error: err?.message || 'AI Search request failed due to a network or server issue.',
    };
  }
}

/**
 * Fetch Admin AI Settings and Metrics
 */
export async function fetchAiAdminSettings(): Promise<AiAdminSettings | null> {
  try {
    const res = await fetch('/api/ai/settings');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Update Admin AI Settings
 */
export async function updateAiAdminSettings(
  settings: Partial<AiAdminSettings['settings']>
): Promise<AiAdminSettings | null> {
  try {
    const res = await fetch('/api/ai/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
