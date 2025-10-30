import { useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';

interface UseDebouncedSearchOptions {
  delay?: number;
  onSearch: (searchValue: string, currentFilters?: any) => void;
  onClear?: (currentFilters?: any) => void;
}

const useDebouncedSearch = ({ 
  delay = 1000, 
  onSearch, 
  onClear 
}: UseDebouncedSearchOptions) => {
  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string, currentFilters?: any) => {
      onSearch(searchValue, currentFilters);
    }, delay),
    [onSearch, delay]
  );

  // Cleanup function
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle search input change
  const handleSearchChange = useCallback((
    value: string, 
    currentFilters?: any,
    setLoading?: (loading: boolean) => void
  ) => {
    // Cancel any pending search
    debouncedSearch.cancel();
    
    if (value.trim() !== '') {
      // Start loading if setter is provided
      if (setLoading) {
        setLoading(true);
      }
      
      // Trigger debounced search
      debouncedSearch(value, currentFilters);
    } else {
      // Handle empty search (clear)
      if (onClear) {
        if (setLoading) {
          setLoading(true);
        }
        onClear(currentFilters);
      }
    }
  }, [debouncedSearch, onClear]);

  return {
    handleSearchChange,
    cancelSearch: debouncedSearch.cancel
  };
};

export default useDebouncedSearch;