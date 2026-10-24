import { useState, useEffect, useCallback } from 'react';
import { SystemSettings, UserRole } from '../types';
import {
  DEFAULT_SYSTEM_SETTINGS,
  getCachedSystemSettings,
  subscribeToSystemSettings,
  updateSystemSettings,
} from '../services/settingsService';

export interface UseSystemSettingsReturn {
  settings: SystemSettings;
  loading: boolean;
  error: Error | null;
  updateSettings: (
    newSettings: Partial<SystemSettings>,
    actor: { uid: string; email: string; role: UserRole | string }
  ) => Promise<SystemSettings>;
  updateSystemSettings: (
    newSettings: Partial<SystemSettings>,
    actor: { uid: string; email: string; role: UserRole | string }
  ) => Promise<SystemSettings>;
}

/**
 * Hook to consume live, authoritative system governance settings from Firestore.
 * Automatically stays in sync across reloads and real-time backend updates.
 */
export function useSystemSettings(): UseSystemSettingsReturn {
  const [settings, setSettings] = useState<SystemSettings>(getCachedSystemSettings() || DEFAULT_SYSTEM_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Real-time Firestore listener (supplies cached defaults immediately and listens for live updates)
    const unsubscribe = subscribeToSystemSettings(
      (liveSettings) => {
        if (isMounted) {
          setSettings(liveSettings);
          setLoading(false);
          setError(null);
        }
      },
      (err) => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleUpdate = useCallback(
    async (
      newSettings: Partial<SystemSettings>,
      actor: { uid: string; email: string; role: UserRole | string }
    ): Promise<SystemSettings> => {
      // Direct awaited Firestore write and verification
      const persisted = await updateSystemSettings(newSettings, actor);
      setSettings(persisted);
      return persisted;
    },
    []
  );

  return {
    settings,
    loading,
    error,
    updateSettings: handleUpdate,
    updateSystemSettings: handleUpdate,
  };
}
