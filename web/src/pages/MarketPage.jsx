import { useEffect, useCallback } from 'react';
import { useStore } from '../store';
import ListingCard from '../components/ListingCard';
import SearchBar from '../components/SearchBar';
import TagFilter from '../components/TagFilter';
import SortBar from '../components/SortBar';
import StatsBar from '../components/StatsBar';

export default function MarketPage() {
  const filteredListings = useStore(s => s.filteredListings);
  const loading = useStore(s => s.loading);
  const fetchListings = useStore(s => s.fetchListings);
  const fetchStats = useStore(s => s.fetchStats);
  const pagination = useStore(s => s.pagination);
  const setPage = useStore(s => s.setPage);

  useEffect(() => {
    fetchListings();
    fetchStats();
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-3">
          <span className="gradient-text">Claw 记忆交易市场</span>
        </h2>
        <p className="text-mako-600 max-w-2xl mx-auto">
          打包、交易、迁移你的 AI Agent 记忆。
          让每一段训练过的经验都不被浪费。
        </p>
      </div>

      {/* Stats */}
      <StatsBar />

      {/* Search + Filter */}
      <div className="mb-6 space-y-4">
        <SearchBar />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TagFilter />
          <SortBar />
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 animate-pulse">🧠</div>
          <p className="text-mako-600">加载中...</p>
        </div>
      ) : filteredListings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-mako-600 text-lg">没有找到匹配的记忆包</p>
          <p className="text-mako-500 text-sm mt-2">试试换个关键词？</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors
                    ${p === pagination.page
                      ? 'bg-claw-primary text-white'
                      : 'bg-mako-200 text-mako-600 hover:bg-mako-300'
                    }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
