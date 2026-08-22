import { useEffect } from 'react';
import { SEOMetadata, updateSEO } from '../lib/seo';

/**
 * Custom React Hook for dynamically updating SEO metadata and JSON-LD structured data.
 */
export function useSEO(metadata: SEOMetadata, deps: any[] = []) {
  useEffect(() => {
    updateSEO(metadata);
  }, [
    metadata.title,
    metadata.description,
    metadata.canonicalUrl,
    metadata.ogImage,
    metadata.ogType,
    metadata.noindex,
    ...deps,
  ]);
}
