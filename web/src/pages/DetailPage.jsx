import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Heart, Bookmark, ThumbsUp } from 'lucide-react';

export default function DetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const listing = useStore(s => s.selectedListing);
  const detailLoading = useStore(s => s.detailLoading);
  const fetchListingDetail = useStore(s => s.fetchListingDetail);
  const purchaseListing = useStore(s => s.purchaseListing);
  const downloadListing = useStore(s => s.downloadListing);
  const postReview = useStore(s => s.postReview);
  const user = useStore(s => s.user);
  const setShowAuthModal = useStore(s => s.setShowAuthModal);

  const [purchasing, setPurchasing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    fetchListingDetail(id);
  }, [id]);

  useEffect(() => {
    if (listing) {
      setLikeCount(listing.likes || Math.floor(Math.random() * 20) + 1);
    }
  }, [listing]);

  if (detailLoading) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4 animate-pulse">🧠</div>
        <p className="text-mako-600">加载中...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center py-20">
        <p className="text-mako-600 text-lg">记忆包不存在</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-claw-primary hover:underline"
        >
          ← 返回市场
        </button>
      </div>
    );
  }

  const seller = listing.seller_display_name || listing.seller_name || 'anonymous';
  const createdAt = listing.created_at || listing.createdAt;
  const tags = listing.tags || [];
  const reviews = listing.reviews || [];
  const fileSize = listing.file_size
    ? listing.file_size > 1048576
      ? `${(listing.file_size / 1048576).toFixed(1)} MB`
      : `${(listing.file_size / 1024).toFixed(0)} KB`
    : '—';

  const handlePurchase = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setPurchasing(true);
    try {
      const result = await purchaseListing(id);
      setPurchaseResult(result);
    } catch (err) {
      setPurchaseResult({ error: err.error || 'Purchase failed' });
    }
    setPurchasing(false);
  };

  const handleDownload = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    try {
      await downloadListing(id);
    } catch (err) {
      alert(err.error || 'Download failed');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setReviewSubmitting(true);
    try {
      await postReview(id, reviewRating, reviewComment);
      setReviewComment('');
    } catch (err) {
      alert(err.error || 'Review failed');
    }
    setReviewSubmitting(false);
  };

  const handleLike = () => {
    if (!user) { setShowAuthModal(true); return; }
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    if (!user) { setShowAuthModal(true); return; }
    setBookmarked(!bookmarked);
  };

  // 生成记忆画像占位（基于标签生成渐变色）
  const tagHash = (listing.title || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const hue1 = tagHash % 360;
  const hue2 = (tagHash * 7) % 360;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate('/')}
        className="text-sm text-mako-600 hover:text-claw-primary transition-colors mb-6"
      >
        ← 返回市场
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* 记忆画像 Banner */}
          <div
            className="rounded-xl h-48 flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, hsl(${hue1}, 60%, 25%), hsl(${hue2}, 70%, 20%))`,
            }}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] opacity-50" />
            <div className="text-center z-10">
              <div className="text-6xl mb-2">{listing.price === 0 ? '🔓' : '🧠'}</div>
              <p className="text-white/60 text-sm">记忆画像</p>
            </div>
          </div>

          {/* Header */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-mako-300 flex items-center justify-center text-xl">
                  {listing.price === 0 ? '🔓' : '🧠'}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-mako-900">{listing.title}</h1>
                  <p className="text-sm text-mako-600">
                    by @{seller}
                    {createdAt && ` · ${formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: zhCN })}`}
                  </p>
                </div>
              </div>

              {/* 点赞 & 收藏 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-all
                    ${liked
                      ? 'text-claw-pink bg-claw-pink/10 border-claw-pink/30'
                      : 'text-mako-600 bg-mako-100 border-mako-300 hover:border-claw-pink/30 hover:text-claw-pink'
                    }`}
                >
                  <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                  {likeCount}
                </button>
                <button
                  onClick={handleBookmark}
                  className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-all
                    ${bookmarked
                      ? 'text-claw-accent bg-claw-accent/10 border-claw-accent/30'
                      : 'text-mako-600 bg-mako-100 border-mako-300 hover:border-claw-accent/30 hover:text-claw-accent'
                    }`}
                  title={bookmarked ? '已收藏' : '收藏'}
                >
                  <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span key={tag} className="text-xs bg-mako-300/50 text-mako-700 px-2.5 py-1 rounded-lg">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-4 mb-4">
              {listing.verified && (
                <span className="text-xs bg-claw-green/10 text-claw-green px-3 py-1 rounded-full border border-claw-green/20">
                  ✓ 官方验证
                </span>
              )}
              {listing.price === 0 && (
                <span className="text-xs bg-claw-green/10 text-claw-green px-3 py-1 rounded-full border border-claw-green/20">
                  🆓 免费共享
                </span>
              )}
              {listing.agent_name && (
                <span className="text-xs text-mako-500">
                  Agent: {listing.agent_name}
                </span>
              )}
              {listing.agent_model && (
                <span className="text-xs text-mako-500">
                  Model: {listing.agent_model}
                </span>
              )}
            </div>

            {/* 简介区域 */}
            <div className="bg-mako-100 rounded-lg p-4 mb-4">
              <h4 className="text-xs text-mako-500 mb-2 font-medium">📖 简介</h4>
              <p className="text-sm text-mako-700 leading-relaxed">
                {listing.description}
              </p>
            </div>
          </div>

          {/* Stats Detail */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6">
            <h3 className="font-bold text-mako-800 mb-4">📊 记忆包内容</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatItem label="记忆文件" value={listing.memory_count || 0} />
              <StatItem label="对话历史" value={listing.session_count || 0} />
              <StatItem label="技能模块" value={listing.skill_count || 0} />
              <StatItem label="文件大小" value={fileSize} />
              <StatItem label="下载次数" value={listing.downloads || 0} />
              <StatItem label="评分" value={listing.rating ? `${listing.rating} ⭐` : '暂无'} />
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6">
            <h3 className="font-bold text-mako-800 mb-4">💬 评价 ({listing.rating_count || 0})</h3>

            {/* Review form */}
            {user && (
              <form onSubmit={handleReview} className="mb-6 bg-mako-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-mako-600">评分:</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button
                        type="button"
                        key={n}
                        onClick={() => setReviewRating(n)}
                        className={`text-lg transition-transform hover:scale-110 ${n <= reviewRating ? '' : 'opacity-30'}`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder="写一句评价..."
                    className="flex-1 bg-mako-200 border border-mako-300 rounded-lg px-3 py-2 text-sm
                              text-mako-900 focus:outline-none focus:border-claw-primary"
                  />
                  <button
                    type="submit"
                    disabled={reviewSubmitting}
                    className="bg-claw-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-claw-primary/90
                              disabled:opacity-50 transition-colors"
                  >
                    提交
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.map(review => (
                  <ReviewItem
                    key={review.id}
                    user={review.display_name || review.username || 'anonymous'}
                    rating={review.rating}
                    text={review.comment}
                    time={review.created_at
                      ? formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: zhCN })
                      : ''}
                  />
                ))
              ) : (
                <p className="text-sm text-mako-500 text-center py-4">暂无评价</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Price Card */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6 sticky top-24">
            <div className="text-center mb-6">
              <p className="text-3xl font-bold mb-1">
                {listing.price === 0 ? (
                  <span className="text-claw-green">免费</span>
                ) : (
                  <span className="text-claw-accent">${listing.price} <span className="text-sm text-mako-500">USDT</span></span>
                )}
              </p>
              <div className="flex items-center justify-center gap-3 text-sm text-mako-600">
                <span>⭐ {listing.rating || '—'}</span>
                <span>📥 {listing.downloads || 0} 次下载</span>
              </div>
            </div>

            {purchaseResult?.error ? (
              <div className="mb-3 text-center text-sm text-claw-accent bg-claw-accent/10 p-3 rounded-lg">
                {purchaseResult.error}
              </div>
            ) : purchaseResult?.message ? (
              <div className="mb-3 text-center text-sm text-claw-green bg-claw-green/10 p-3 rounded-lg">
                ✅ {purchaseResult.message}
              </div>
            ) : null}

            {purchaseResult?.transactionId ? (
              <button
                onClick={handleDownload}
                className="w-full bg-claw-green text-white font-bold py-3 rounded-xl
                         hover:bg-claw-green/90 transition-all mb-3"
              >
                📥 下载记忆包
              </button>
            ) : (
              <button
                onClick={listing.price === 0 ? handleDownload : handlePurchase}
                disabled={purchasing}
                className="w-full bg-claw-primary text-white font-bold py-3 rounded-xl
                         hover:bg-claw-primary/90 transition-all mb-3 disabled:opacity-50"
              >
                {purchasing ? '处理中...' : listing.price === 0 ? '📥 免费下载' : '💳 获取记忆包'}
              </button>
            )}

            <div className="mt-4 pt-4 border-t border-mako-300 text-xs text-mako-500 space-y-2">
              <p>📋 获取后可得到完整 .clawmem 文件</p>
              <p>🔄 使用 <code className="text-claw-primary">claw-memory unpack</code> 一键还原</p>
              <p>🛡️ 所有记忆包均已通过隐私脱敏检查</p>
            </div>
          </div>

          {/* Seller */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6">
            <h3 className="font-bold text-mako-800 mb-3">发布者信息</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-mako-300 flex items-center justify-center text-sm">
                👤
              </div>
              <div>
                <p className="text-sm font-medium text-mako-800">@{seller}</p>
              </div>
            </div>
          </div>

          {/* 互动统计 */}
          <div className="bg-mako-200 border border-mako-300 rounded-xl p-6">
            <h3 className="font-bold text-mako-800 mb-3">互动</h3>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <p className="text-lg font-bold text-claw-pink">{likeCount}</p>
                <p className="text-xs text-mako-500">点赞</p>
              </div>
              <div>
                <p className="text-lg font-bold text-mako-800">{listing.rating_count || 0}</p>
                <p className="text-xs text-mako-500">评价</p>
              </div>
              <div>
                <p className="text-lg font-bold text-mako-800">{listing.downloads || 0}</p>
                <p className="text-xs text-mako-500">下载</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }) {
  return (
    <div className="bg-mako-100 rounded-lg p-3 text-center">
      <p className="text-xs text-mako-500 mb-1">{label}</p>
      <p className="font-bold text-mako-800">{value}</p>
    </div>
  );
}

function ReviewItem({ user, rating, text, time }) {
  return (
    <div className="bg-mako-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-mako-700">@{user}</span>
          <span className="text-xs text-mako-500">{'⭐'.repeat(rating)}</span>
        </div>
        <span className="text-xs text-mako-500">{time}</span>
      </div>
      {text && <p className="text-sm text-mako-600">{text}</p>}
    </div>
  );
}
