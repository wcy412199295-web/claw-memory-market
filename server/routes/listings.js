import { Router } from 'express';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { createHash } from 'crypto';
import { readFileSync, existsSync, mkdirSync, unlinkSync, createReadStream, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import supabase from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'data', 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    if (file.originalname.endsWith('.clawmem') || file.mimetype === 'application/zip' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only .clawmem files are accepted'));
    }
  }
});

const router = Router();

// ── List all active listings ────────────────────────
router.get('/', async (req, res) => {
  try {
    const { search, tag, sort = 'newest', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build query for count
    let countQuery = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    // Build query for data — join seller info via foreign key
    let dataQuery = supabase
      .from('listings')
      .select('*, users!listings_seller_id_fkey(username, display_name)')
      .eq('status', 'active');

    if (search) {
      const searchFilter = `title.ilike.%${search}%,description.ilike.%${search}%,agent_name.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    if (tag) {
      countQuery = countQuery.contains('tags', [tag]);
      dataQuery = dataQuery.contains('tags', [tag]);
    }

    // Sort
    const sortMap = {
      newest: { column: 'created_at', ascending: false },
      oldest: { column: 'created_at', ascending: true },
      price_asc: { column: 'price', ascending: true },
      price_desc: { column: 'price', ascending: false },
      popular: { column: 'downloads', ascending: false },
      rating: { column: 'rating', ascending: false },
    };
    const sortOpt = sortMap[sort] || sortMap.newest;
    dataQuery = dataQuery.order(sortOpt.column, { ascending: sortOpt.ascending });

    // Pagination
    dataQuery = dataQuery.range(Number(offset), Number(offset) + Number(limit) - 1);

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery]);

    if (dataRes.error) throw dataRes.error;

    const listings = (dataRes.data || []).map(row => ({
      ...row,
      seller_name: row.users?.username,
      seller_display_name: row.users?.display_name,
      users: undefined,
      tags: row.tags || [],
    }));

    res.json({
      listings,
      pagination: {
        total: countRes.count || 0,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil((countRes.count || 0) / limit),
      }
    });
  } catch (err) {
    console.error('List listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get single listing ──────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: row, error } = await supabase
      .from('listings')
      .select('*, users!listings_seller_id_fkey(username, display_name)')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!row) return res.status(404).json({ error: 'Listing not found' });

    const { data: reviews } = await supabase
      .from('reviews')
      .select('*, users(username, display_name)')
      .eq('listing_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(20);

    res.json({
      ...row,
      seller_name: row.users?.username,
      seller_display_name: row.users?.display_name,
      users: undefined,
      tags: row.tags || [],
      reviews: (reviews || []).map(r => ({
        ...r,
        username: r.users?.username,
        display_name: r.users?.display_name,
        users: undefined,
      })),
    });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Upload new listing ──────────────────────────────
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { title, description, agentName, agentModel, price, currency, tags } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and file are required' });
    }

    const fileBuffer = readFileSync(req.file.path);
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    let memoryCount = 0, sessionCount = 0, skillCount = 0;
    try {
      memoryCount = Number(req.body.memoryCount) || 0;
      sessionCount = Number(req.body.sessionCount) || 0;
      skillCount = Number(req.body.skillCount) || 0;
    } catch { /* ignore */ }

    const id = `mem-${nanoid(12)}`;
    const finalPath = join(UPLOADS_DIR, `${id}.clawmem`);
    renameSync(req.file.path, finalPath);

    const parsedTags = tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : [];

    const { error } = await supabase.from('listings').insert({
      id,
      seller_id: req.user.id,
      title,
      description: description || '',
      agent_name: agentName || '',
      agent_model: agentModel || '',
      price: Number(price) || 0,
      currency: currency || 'USDT',
      tags: parsedTags,
      file_path: finalPath,
      file_size: req.file.size,
      file_hash: fileHash,
      memory_count: memoryCount,
      session_count: sessionCount,
      skill_count: skillCount,
    });

    if (error) throw error;

    res.status(201).json({ id, message: 'Listing created' });
  } catch (err) {
    console.error('Upload error:', err);
    if (req.file?.path && existsSync(req.file.path)) {
      try { unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Purchase / Download ─────────────────────────────
router.post('/:id/purchase', requireAuth, async (req, res) => {
  try {
    const { data: listing, error: listingErr } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .eq('status', 'active')
      .maybeSingle();

    if (listingErr) throw listingErr;
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    if (listing.seller_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot purchase your own listing' });
    }

    // Check if already purchased
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('listing_id', req.params.id)
      .eq('buyer_id', req.user.id)
      .eq('status', 'completed')
      .maybeSingle();

    if (existingTx) {
      return res.json({ message: 'Already purchased', transactionId: existingTx.id });
    }

    // Check balance for paid listings
    if (listing.price > 0) {
      const { data: buyer } = await supabase
        .from('users')
        .select('balance')
        .eq('id', req.user.id)
        .single();

      if (buyer.balance < listing.price) {
        return res.status(402).json({ error: 'Insufficient balance', required: listing.price, current: buyer.balance });
      }

      // Execute purchase atomically via RPC or sequential updates
      const txId = `tx-${nanoid(12)}`;
      const sellerAmount = listing.price * 0.9;

      // Debit buyer
      const { error: debitErr } = await supabase
        .from('users')
        .update({ balance: buyer.balance - listing.price })
        .eq('id', req.user.id);
      if (debitErr) throw debitErr;

      // Credit seller
      const { data: seller } = await supabase
        .from('users')
        .select('balance')
        .eq('id', listing.seller_id)
        .single();

      const { error: creditErr } = await supabase
        .from('users')
        .update({ balance: (seller.balance || 0) + sellerAmount })
        .eq('id', listing.seller_id);
      if (creditErr) throw creditErr;

      // Create transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        id: txId,
        listing_id: listing.id,
        buyer_id: req.user.id,
        seller_id: listing.seller_id,
        price: listing.price,
        currency: listing.currency,
      });
      if (txErr) throw txErr;

      // Increment downloads
      const { error: dlErr } = await supabase
        .from('listings')
        .update({ downloads: (listing.downloads || 0) + 1 })
        .eq('id', listing.id);
      if (dlErr) throw dlErr;

      return res.json({ message: 'Purchase successful', transactionId: txId });
    }

    // Free listing
    const txId = `tx-${nanoid(12)}`;
    const { error: txErr } = await supabase.from('transactions').insert({
      id: txId,
      listing_id: listing.id,
      buyer_id: req.user.id,
      seller_id: listing.seller_id,
      price: 0,
      currency: listing.currency,
    });
    if (txErr) throw txErr;

    await supabase
      .from('listings')
      .update({ downloads: (listing.downloads || 0) + 1 })
      .eq('id', listing.id);

    res.json({ message: 'Download recorded', transactionId: txId });
  } catch (err) {
    console.error('Purchase error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Download file ───────────────────────────────────
router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const { data: listing, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Check if user is seller or has purchased
    if (listing.seller_id !== req.user.id) {
      const { data: tx } = await supabase
        .from('transactions')
        .select('id')
        .eq('listing_id', req.params.id)
        .eq('buyer_id', req.user.id)
        .eq('status', 'completed')
        .maybeSingle();

      if (!tx && listing.price > 0) {
        return res.status(403).json({ error: 'Purchase required before download' });
      }
    }

    if (!existsSync(listing.file_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Record download
    await supabase.from('downloads').insert({
      id: `dl-${nanoid(12)}`,
      listing_id: listing.id,
      user_id: req.user.id,
    });

    res.setHeader('Content-Disposition', `attachment; filename="${listing.id}.clawmem"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', listing.file_size);
    createReadStream(listing.file_path).pipe(res);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Post review ─────────────────────────────────────
router.post('/:id/reviews', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!listing) return res.status(404).json({ error: 'Listing not found' });

    // Must have purchased to review
    const { data: tx } = await supabase
      .from('transactions')
      .select('id')
      .eq('listing_id', req.params.id)
      .eq('buyer_id', req.user.id)
      .maybeSingle();

    if (!tx && listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Must purchase before reviewing' });
    }

    const reviewId = `rev-${nanoid(12)}`;
    const { error: insertErr } = await supabase.from('reviews').insert({
      id: reviewId,
      listing_id: req.params.id,
      user_id: req.user.id,
      rating,
      comment: comment || '',
    });

    if (insertErr) {
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'Already reviewed' });
      }
      throw insertErr;
    }

    // Update listing average rating
    const { data: statsRows } = await supabase
      .from('reviews')
      .select('rating')
      .eq('listing_id', req.params.id);

    const count = statsRows.length;
    const avg = statsRows.reduce((sum, r) => sum + r.rating, 0) / count;

    await supabase
      .from('listings')
      .update({ rating: Math.round(avg * 10) / 10, rating_count: count })
      .eq('id', req.params.id);

    res.status(201).json({ id: reviewId });
  } catch (err) {
    console.error('Review error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Delete listing (seller only) ────────────────────
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { data: listing } = await supabase
      .from('listings')
      .select('id, seller_id')
      .eq('id', req.params.id)
      .maybeSingle();

    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (listing.seller_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error } = await supabase
      .from('listings')
      .update({ status: 'delisted', updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── My listings ─────────────────────────────────────
router.get('/my/listings', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('listings')
      .select('*')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json((rows || []).map(r => ({ ...r, tags: r.tags || [] })));
  } catch (err) {
    console.error('My listings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── My purchases ────────────────────────────────────
router.get('/my/purchases', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('transactions')
      .select('*, listings(title, agent_name, tags, file_size)')
      .eq('buyer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json((rows || []).map(r => ({
      ...r,
      title: r.listings?.title,
      agent_name: r.listings?.agent_name,
      tags: r.listings?.tags || [],
      file_size: r.listings?.file_size,
      listings: undefined,
    })));
  } catch (err) {
    console.error('My purchases error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── My sales ────────────────────────────────────────
router.get('/my/sales', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('transactions')
      .select('*, listings(title, agent_name), users!transactions_buyer_id_fkey(username)')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json((rows || []).map(r => ({
      ...r,
      title: r.listings?.title,
      agent_name: r.listings?.agent_name,
      buyer_name: r.users?.username,
      listings: undefined,
      users: undefined,
    })));
  } catch (err) {
    console.error('My sales error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
