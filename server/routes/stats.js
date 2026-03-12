import { Router } from 'express';
import supabase from '../db.js';

const router = Router();

// ── Market stats ────────────────────────────────────
router.get('/', async (_req, res) => {
  try {
    const [listingsRes, usersRes, txRes, volumeRes, tagsRes, recentRes] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('transactions').select('price'),
      supabase.from('listings').select('tags').eq('status', 'active'),
      supabase
        .from('listings')
        .select('id, title, price, created_at, users!listings_seller_id_fkey(username)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const totalVolume = (volumeRes.data || []).reduce((sum, r) => sum + (r.price || 0), 0);

    // Count tag frequencies
    const tagCounts = {};
    (tagsRes.data || []).forEach(row => {
      const tags = row.tags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    const recentListings = (recentRes.data || []).map(r => ({
      id: r.id,
      title: r.title,
      price: r.price,
      created_at: r.created_at,
      seller_name: r.users?.username,
    }));

    res.json({
      totalListings: listingsRes.count || 0,
      totalUsers: usersRes.count || 0,
      totalTransactions: txRes.count || 0,
      totalVolume: Math.round(totalVolume * 100) / 100,
      topTags: sortedTags,
      recentListings,
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
