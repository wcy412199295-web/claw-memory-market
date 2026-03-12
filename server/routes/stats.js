import { Router } from 'express';
import db from '../db.js';

const router = Router();

// ── Market stats ────────────────────────────────────
router.get('/', (_req, res) => {
  const totalListings = db.prepare("SELECT COUNT(*) as count FROM listings WHERE status = 'active'").get().count;
  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  const totalVolume = db.prepare('SELECT COALESCE(SUM(price), 0) as total FROM transactions').get().total;

  const topTags = db.prepare(`
    SELECT tags FROM listings WHERE status = 'active'
  `).all();

  // Count tag frequencies
  const tagCounts = {};
  topTags.forEach(row => {
    const tags = JSON.parse(row.tags || '[]');
    tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  const recentListings = db.prepare(`
    SELECT l.id, l.title, l.price, l.created_at, u.username as seller_name
    FROM listings l JOIN users u ON l.seller_id = u.id
    WHERE l.status = 'active'
    ORDER BY l.created_at DESC
    LIMIT 5
  `).all();

  res.json({
    totalListings,
    totalUsers,
    totalTransactions,
    totalVolume: Math.round(totalVolume * 100) / 100,
    topTags: sortedTags,
    recentListings,
  });
});

export default router;
