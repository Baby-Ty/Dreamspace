import { useState, useEffect, useMemo, useCallback } from 'react';
import { mockDreams } from '../../constants/dreamInspiration';

/**
 * Hook for dream inspiration modal functionality
 * Handles inspiration loading, filtering, and category selection
 */
export function useDreamInspiration(isOpen) {
  const [inspirationCategory, setInspirationCategory] = useState('All');
  const [inspirationItems, setInspirationItems] = useState(mockDreams);
  const [loadingInspiration, setLoadingInspiration] = useState(false);
  const [inspirationError, setInspirationError] = useState('');

  // Inspiration loading (disabled remote fetching for demo reliability)
  const fetchUnsplashForTitle = useCallback(async () => '', []);
  
  const loadInspirationImages = useCallback(async () => {
    setLoadingInspiration(true);
    setInspirationError('');
    try {
      const updated = await Promise.all(mockDreams.map(async (d) => {
        if (d.image) {
          return d;
        }
        const image = await fetchUnsplashForTitle(d.title, d.category);
        return { ...d, image };
      }));
      setInspirationItems(updated);
    } catch (err) {
      console.error('Failed to load inspiration images:', err);
      setInspirationError('Failed to load inspiration images.');
      setInspirationItems(mockDreams);
    } finally {
      setLoadingInspiration(false);
    }
  }, [fetchUnsplashForTitle]);

  // Load inspiration when modal opens
  useEffect(() => {
    if (isOpen) {
      setInspirationCategory('All');
      loadInspirationImages();
    }
  }, [isOpen, loadInspirationImages]);

  const filteredInspiration = useMemo(
    () => inspirationItems.filter((d) => inspirationCategory === 'All' || d.category === inspirationCategory),
    [inspirationItems, inspirationCategory]
  );

  return {
    inspirationCategory,
    setInspirationCategory,
    filteredInspiration,
    loadingInspiration,
    inspirationError
  };
}
