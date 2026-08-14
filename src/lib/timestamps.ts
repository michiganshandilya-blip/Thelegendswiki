import { serverTimestamp, Timestamp } from 'firebase/firestore';

/**
 * Returns Firestore serverTimestamp sentinel for writes.
 */
export function getDbTimestamp() {
  return serverTimestamp();
}

/**
 * Formats various timestamp types (Firestore Timestamp, ISO string, Date, or number)
 * to standard display date string (YYYY-MM-DD).
 */
export function formatTimestamp(val: any, fallback: string = '2026-08-14'): string {
  if (!val) return fallback;

  try {
    // 1. Firestore Timestamp instance
    if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
      return val.toDate().toISOString().split('T')[0];
    }

    // 2. Firestore timestamp-like serialized object { seconds, nanoseconds }
    if (typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toISOString().split('T')[0];
    }

    // 3. String (ISO or Date string)
    if (typeof val === 'string') {
      if (val.includes('T')) {
        return val.split('T')[0];
      }
      return val;
    }

    // 4. Number (epoch ms or seconds)
    if (typeof val === 'number') {
      const ms = val > 1e11 ? val : val * 1000;
      return new Date(ms).toISOString().split('T')[0];
    }

    // 5. Date instance
    if (val instanceof Date) {
      return val.toISOString().split('T')[0];
    }
  } catch {
    return fallback;
  }

  return fallback;
}

/**
 * Converts a timestamp to human-friendly format (e.g. Aug 14, 2026).
 */
export function formatDisplayDate(val: any): string {
  const formatted = formatTimestamp(val);
  try {
    const parts = formatted.split('-');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  } catch {
    return formatted;
  }
  return formatted;
}

/**
 * Converts a timestamp to ISO 8601 string.
 */
export function toISOString(val: any): string {
  if (!val) return new Date().toISOString();

  try {
    if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
      return val.toDate().toISOString();
    }
    if (typeof val === 'object' && 'seconds' in val) {
      return new Date(val.seconds * 1000).toISOString();
    }
    if (typeof val === 'string') {
      return new Date(val).toISOString();
    }
    if (typeof val === 'number') {
      const ms = val > 1e11 ? val : val * 1000;
      return new Date(ms).toISOString();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
  } catch {
    return new Date().toISOString();
  }

  return new Date().toISOString();
}
