/**
 * TheLegendsWiki - Legal & Cookie Consent Management Service
 * 
 * Provides privacy-first, GDPR/CCPA-compliant consent categorization,
 * version tracking, persistence, and event broadcasting.
 */

export const CURRENT_CONSENT_VERSION = 1;
export const CONSENT_STORAGE_KEY = 'thelegendswiki:legal_consent';

export interface ConsentPreferences {
  necessary: true; // Always active (Firebase Auth, Security, CSRF)
  preferences: boolean; // Dark mode, layout prefs, font scale
  analytics: boolean; // Anonymous readership metrics, performance
  marketing: boolean; // Third-party archival embeds & external media
  timestamp: string;
  version: number;
}

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  preferences: false,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
  version: CURRENT_CONSENT_VERSION,
};

/**
 * Retrieves the currently saved consent preferences from localStorage.
 * Returns null if no valid consent record exists or if the version is outdated.
 */
export function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as ConsentPreferences;

    // Validate structure and version
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      parsed.necessary === true &&
      typeof parsed.preferences === 'boolean' &&
      typeof parsed.analytics === 'boolean' &&
      typeof parsed.marketing === 'boolean' &&
      parsed.version === CURRENT_CONSENT_VERSION
    ) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Saves consent choices to localStorage and broadcasts a global event.
 */
export function saveConsent(
  choices: Partial<Omit<ConsentPreferences, 'necessary' | 'timestamp' | 'version'>>
): ConsentPreferences {
  const record: ConsentPreferences = {
    necessary: true,
    preferences: choices.preferences ?? false,
    analytics: choices.analytics ?? false,
    marketing: choices.marketing ?? false,
    timestamp: new Date().toISOString(),
    version: CURRENT_CONSENT_VERSION,
  };

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
      window.dispatchEvent(
        new CustomEvent('thelegendswiki:consent-updated', { detail: record })
      );
    } catch (e) {
      console.warn('[ConsentService] Failed to persist consent to localStorage:', e);
    }
  }

  return record;
}

/**
 * Accepts all cookies and categories.
 */
export function acceptAllConsent(): ConsentPreferences {
  return saveConsent({
    preferences: true,
    analytics: true,
    marketing: true,
  });
}

/**
 * Rejects all non-essential cookies (only strictly necessary remains active).
 */
export function rejectNonEssentialConsent(): ConsentPreferences {
  return saveConsent({
    preferences: false,
    analytics: false,
    marketing: false,
  });
}

/**
 * Checks whether user has already made an explicit consent choice.
 */
export function hasUserGivenConsent(): boolean {
  return getStoredConsent() !== null;
}

/**
 * Checks if a specific consent category is currently authorized.
 */
export function isCategoryAllowed(
  category: 'necessary' | 'preferences' | 'analytics' | 'marketing'
): boolean {
  if (category === 'necessary') return true;
  const stored = getStoredConsent();
  if (!stored) return false;
  return Boolean(stored[category]);
}
