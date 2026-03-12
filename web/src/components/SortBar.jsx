import { useStore } from '../store';

const SORT_OPTIONS = [
  { value: 'newest', label: '最新发布' },
  { value: 'price-asc', label: '价格 ↑' },
  { value: 'price-desc', label: '价格 ↓' },
  { value: 'rating', label: '最高评分' },
  { value: 'downloads', label: '最多下载' },
];

export default function SortBar() {
  const sortBy = useStore(s => s.sortBy);
  const setSortBy = useStore(s => s.setSortBy);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-mako-500">排序:</span>
      {SORT_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => setSortBy(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
            sortBy === opt.value
              ? 'bg-mako-400 text-mako-900'
              : 'text-mako-600 hover:text-mako-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
