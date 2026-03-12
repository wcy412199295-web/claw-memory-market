import { useRef, useCallback } from 'react';
import { useStore } from '../store';

export default function SearchBar() {
  const searchQuery = useStore(s => s.searchQuery);
  const setSearchQuery = useStore(s => s.setSearchQuery);
  const fetchListings = useStore(s => s.fetchListings);
  const timerRef = useRef(null);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounce API call
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fetchListings();
    }, 300);
  }, [setSearchQuery, fetchListings]);

  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mako-500">🔍</span>
      <input
        type="text"
        value={searchQuery}
        onChange={handleChange}
        placeholder="搜索记忆包... 输入关键词、标签、Agent 名称"
        className="w-full bg-mako-200 border border-mako-300 rounded-xl py-3 pl-12 pr-4
                   text-mako-800 placeholder-mako-500 text-sm
                   focus:outline-none focus:border-claw-primary focus:ring-1 focus:ring-claw-primary/30
                   transition-all"
      />
    </div>
  );
}
