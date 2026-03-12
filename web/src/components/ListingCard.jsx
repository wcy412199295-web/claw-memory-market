import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function ListingCard({ listing }) {
  const navigate = useNavigate();

  const seller = listing.seller_display_name || listing.seller_name || listing.seller || 'anonymous';
  const createdAt = listing.created_at || listing.createdAt;
  const memoryCount = listing.memory_count ?? listing.stats?.memoryFiles ?? 0;
  const sessionCount = listing.session_count ?? listing.stats?.sessions ?? 0;
  const skillCount = listing.skill_count ?? listing.stats?.skills ?? 0;
  const fileSize = listing.file_size
    ? listing.file_size > 1048576
      ? `${(listing.file_size / 1048576).toFixed(1)} MB`
      : `${(listing.file_size / 1024).toFixed(0)} KB`
    : listing.stats?.totalSize || '—';
  const tags = listing.tags || [];
  const ratingCount = listing.rating_count ?? listing.reviews ?? 0;

  return (
    <div
      onClick={() => navigate(`/listing/${listing.id}`)}
      className="bg-mako-200 border border-mako-300 rounded-xl p-5 cursor-pointer
                 card-hover glow-border group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-mako-300 flex items-center justify-center text-lg">
            {listing.price === 0 ? '🔓' : '🧠'}
          </div>
          <div>
            <p className="text-xs text-mako-600">@{seller}</p>
            {createdAt && (
              <p className="text-xs text-mako-500">
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: zhCN })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {listing.price === 0 && (
            <span className="text-xs bg-claw-green/10 text-claw-green px-2 py-0.5 rounded-full border border-claw-green/20">
              🆓 免费
            </span>
          )}
          {listing.verified && (
            <span className="text-xs bg-claw-green/10 text-claw-green px-2 py-0.5 rounded-full border border-claw-green/20">
              ✓ 已验证
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-bold text-mako-900 mb-2 group-hover:text-claw-primary transition-colors">
        {listing.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-mako-600 mb-4 line-clamp-2">
        {listing.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-center">
        <div className="bg-mako-100 rounded-lg py-2 px-1">
          <p className="text-xs text-mako-500">记忆</p>
          <p className="text-sm font-bold text-mako-800">{memoryCount}</p>
        </div>
        <div className="bg-mako-100 rounded-lg py-2 px-1">
          <p className="text-xs text-mako-500">对话</p>
          <p className="text-sm font-bold text-mako-800">{sessionCount}</p>
        </div>
        <div className="bg-mako-100 rounded-lg py-2 px-1">
          <p className="text-xs text-mako-500">技能</p>
          <p className="text-sm font-bold text-mako-800">{skillCount}</p>
        </div>
        <div className="bg-mako-100 rounded-lg py-2 px-1">
          <p className="text-xs text-mako-500">大小</p>
          <p className="text-sm font-bold text-mako-800">{fileSize}</p>
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 4).map(tag => (
            <span
              key={tag}
              className="text-xs bg-mako-300/50 text-mako-700 px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="text-xs text-mako-500">+{tags.length - 4}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-mako-300">
        <div className="flex items-center gap-3 text-xs text-mako-600">
          <span>⭐ {listing.rating || '—'}</span>
          <span>💬 {ratingCount}</span>
          <span>📥 {listing.downloads || 0}</span>
          <span>❤️ {listing.likes || 0}</span>
        </div>
        <div className="font-bold text-lg">
          {listing.price === 0 ? (
            <span className="text-claw-green">免费</span>
          ) : (
            <span className="text-claw-accent">${listing.price}</span>
          )}
        </div>
      </div>
    </div>
  );
}
