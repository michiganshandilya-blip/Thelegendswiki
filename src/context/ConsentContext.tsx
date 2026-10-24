import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  ConsentPreferences,
  getStoredConsent,
  saveConsent,
  acceptAllConsent,
  rejectNonEssentialConsent,
  hasUserGivenConsent,
  isCategoryAllowed,
} from '../services/consentService';

interface ConsentContextType {
  consent: ConsentPreferences | null;
  hasGivenConsent: boolean;
  isBannerOpen: boolean;
  isPreferencesModalOpen: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  saveCustomPreferences: (
    prefs: Partial<Omit<ConsentPreferences, 'necessary' | 'timestamp' | 'version'>>
  ) => void;
  openPreferencesModal: () => void;
  closePreferencesModal: () => void;
  isAllowed: (category: 'necessary' | 'preferences' | 'analytics' | 'marketing') => boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => getStoredConsent());
  const [isBannerOpen, setIsBannerOpen] = useState<boolean>(() => !hasUserGivenConsent());
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState<boolean>(false);

  // Sync state if storage updates across windows/tabs
  useEffect(() => {
    const handleConsentEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ConsentPreferences>;
      if (customEvent.detail) {
        setConsent(customEvent.detail);
        setIsBannerOpen(false);
      }
    };

    const handleOpenPreferencesEvent = () => {
      setIsPreferencesModalOpen(true);
    };

    window.addEventListener('thelegendswiki:consent-updated', handleConsentEvent);
    window.addEventListener('thelegendswiki:open-cookie-preferences', handleOpenPreferencesEvent);

    return () => {
      window.removeEventListener('thelegendswiki:consent-updated', handleConsentEvent);
      window.removeEventListener('thelegendswiki:open-cookie-preferences', handleOpenPreferencesEvent);
    };
  }, []);

  const acceptAll = useCallback(() => {
    const record = acceptAllConsent();
    setConsent(record);
    setIsBannerOpen(false);
    setIsPreferencesModalOpen(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const record = rejectNonEssentialConsent();
    setConsent(record);
    setIsBannerOpen(false);
    setIsPreferencesModalOpen(false);
  }, []);

  const saveCustomPreferences = useCallback(
    (prefs: Partial<Omit<ConsentPreferences, 'necessary' | 'timestamp' | 'version'>>) => {
      const record = saveConsent(prefs);
      setConsent(record);
      setIsBannerOpen(false);
      setIsPreferencesModalOpen(false);
    },
    []
  );

  const openPreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(true);
  }, []);

  const closePreferencesModal = useCallback(() => {
    setIsPreferencesModalOpen(false);
  }, []);

  const isAllowed = useCallback(
    (category: 'necessary' | 'preferences' | 'analytics' | 'marketing') => {
      return isCategoryAllowed(category);
    },
    []
  );

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasGivenConsent: consent !== null,
        isBannerOpen,
        isPreferencesModalOpen,
        acceptAll,
        rejectNonEssential,
        saveCustomPreferences,
        openPreferencesModal,
        closePreferencesModal,
        isAllowed,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
