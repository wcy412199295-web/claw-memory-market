import { Router } from 'express';
import { nanoid } from 'nanoid';
import multer from 'multer';
import { createHash } from 'crypto';
import { readFileSync, existsSync, mkdirSync, unlinkSync, createReadStream, renameSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { requireAuth } from '../auth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '..', 'data', 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (_req, file, cb) => {
    // Accept .clawmem files (which are zip files)
    if (file.originalname.endsWith('.clawmem') || file.mimetype === 'application/zip' || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error('Only .clawmem files are accepted'));
    }
  }
});

const router = Router();

// ── List all active listings ────────────────────────
router.get('/', (req, res) => {
  const { search, tag, sort = 'newest', page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let where = "WHERE l.status = 'active'";
  const params = [];

  if (search) {
    where += ` AND (l.title LIKE ? OR l.description LIKE ? OR l.agent_name LIKE ? OR l.tags LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s, s);
  }
  if (tag) {
    where += ` AND l.tags LIKE ?`;
    params.push(`%"${tag}"%`);
  }

  const sortMap = {
    newest: 'l.created_at DESC',
    oldest: 'l.created_at ASC',
    price_asc: 'l.price ASC',
    price_desc: 'l.price DESC',
    popular: 'l.downloads DESC',
    rating: 'l.rating DESC',
  };
  const orderBy = sortMap[sort] || sortMap.newest;

  const countSql = `SELECT COUNT(*) as total FROM listings l ${where}`;
  const total = db.prepare(countSql).get(...params).total;

  const sql = `
    SELECT l.*, u.username as seller_name, u.display_name as seller_display_name
    FROM listings l
    JOIN users u ON l.seller_id = u.id
    ${where}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(sql).all(...params, Number(limit), Number(offset));

  const listings = rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    verified: !!row.verified,
  }));

  res.json({
    listings,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
    }
  });
});

// ── Get single listing ──────────────────────────────
router.get('/:id', (req, res) => {
  const row = db.prepare(`
    SELECT l.*, u.username as seller_name, u.display_name as seller_display_name
    FROM listings l
    JOIN users u ON l.seller_id = u.id
    WHERE l.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Listing not found' });

  const reviews = db.prepare(`
    SELECT r.*, u.username, u.display_name
    FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.listing_id = ?
    ORDER BY r.created_at DESC
    LIMIT 20
  `).all(req.params.id);

  res.json({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    verified: !!row.verified,
    reviews,
  });
});

// ── Upload new listing ──────────────────────────────
router.post('/', requireAuth, upload.single('file'), (req, res) => {
  try {
    const { title, description, agentName, agentModel, price, currency, tags } = req.body;

    if (!title || !req.file) {
      return res.status(400).json({ error: 'Title and file are required' });
    }

    // Compute file hash
    const fileBuffer = readFileSync(req.file.path);
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');

    // Parse manifest from the .clawmem to extract stats
    let memoryCount = 0, sessionCount = 0, skillCount = 0;
    try {
      // .clawmem is a zip; we'd need to extract manifest.json
      // For now, accept client-provided values or default to 0
      memoryCount = Number(req.body.memoryCount) || 0;
      sessionCount = Number(req.body.sessionCount) || 0;
      skillCount = Number(req.body.skillCount) || 0;
    } catch { /* ignore */ }

    const id = `mem-${nanoid(12)}`;
    const finalPath = join(UPLOADS_DIR, `${id}.clawmem`);

    // Rename temp file to final location
    renameSync(req.file.path, finalPath);

    db.prepare(`
      INSERT INTO listings (id, seller_id, title, description, agent_name, agent_model, price, currency, tags, file_path, file_size, file_hash, memory_count, session_count, skill_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      title,
      description || '',
      agentName || '',
      agentModel || '',
      Number(price) || 0,
      currency || 'USDT',
      JSON.stringify(tags ? (typeof tags === 'string' ? JSON.parse(tags) : tags) : []),
      finalPath,
      req.file.size,
      fileHash,
      memoryCount,
      sessionCount,
      skillCount
    );

    res.status(201).json({ id, message: 'Listing created' });
  } catch (err) {
    console.error('Upload error:', err);
    // Clean up temp file on error
    if (req.file?.path && existsSync(req.file.path)) {
      try { unlinkSync(req.file.path); } catch { /* ignore */ }
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ── Purchase / Download ─────────────────────────────
router.post('/:id/purchase', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ? AND status = ?').get(req.params.id, 'active');
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  if (listing.seller_id === req.user.id) {
    return res.status(400).json({ error: 'Cannot purchase your own listing' });
  }

  // Check if already purchased
  const existingTx = db.prepare('SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ? AND status = ?')
    .get(req.params.id, req.user.id, 'completed');

  if (existingTx) {
    // Already purchased, just allow re-download
    return res.json({ message: 'Already purchased', transactionId: existingTx.id });
  }

  // Check balance for paid listings
  if (listing.price > 0) {
    const buyer = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
    if (buyer.balance < listing.price) {
      return res.status(402).json({ error: 'Insufficient balance', required: listing.price, current: buyer.balance });
    }

    // Atomic transaction
    const executePurchase = db.transaction(() => {
      // Debit buyer
      db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(listing.price, req.user.id);
      // Credit seller (90% — 10% platform fee)
      const sellerAmount = listing.price * 0.9;
      db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(sellerAmount, listing.seller_id);
      // Create transaction record
      const txId = `tx-${nanoid(12)}`;
      db.prepare(`
        INSERT INTO transactions (id, listing_id, buyer_id, seller_id, price, currency)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(txId, listing.id, req.user.id, listing.seller_id, listing.price, listing.currency);
      // Increment download count
      db.prepare('UPDATE listings SET downloads = downloads + 1 WHERE id = ?').run(listing.id);
      return txId;
    });

    const txId = executePurchase();
    return res.json({ message: 'Purchase successful', transactionId: txId });
  }

  // Free listing — just record download
  const txId = `tx-${nanoid(12)}`;
  db.prepare(`
    INSERT INTO transactions (id, listing_id, buyer_id, seller_id, price, currency)
    VALUES (?, ?, ?, ?, 0, ?)
  `).run(txId, listing.id, req.user.id, listing.seller_id, listing.currency);
  db.prepare('UPDATE listings SET downloads = downloads + 1 WHERE id = ?').run(listing.id);

  res.json({ message: 'Download recorded', transactionId: txId });
});

// ── Download file ───────────────────────────────────
router.get('/:id/download', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Check if user is seller or has purchased
  if (listing.seller_id !== req.user.id) {
    const tx = db.prepare('SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ? AND status = ?')
      .get(req.params.id, req.user.id, 'completed');
    if (!tx && listing.price > 0) {
      return res.status(403).json({ error: 'Purchase required before download' });
    }
  }

  if (!existsSync(listing.file_path)) {
    return res.status(404).json({ error: 'File not found on server' });
  }

  // Record download
  db.prepare(`INSERT INTO downloads (id, listing_id, user_id) VALUES (?, ?, ?)`)
    .run(`dl-${nanoid(12)}`, listing.id, req.user.id);

  res.setHeader('Content-Disposition', `attachment; filename="${listing.id}.clawmem"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', listing.file_size);
  createReadStream(listing.file_path).pipe(res);
});

// ── Post review ─────────────────────────────────────
router.post('/:id/reviews', requireAuth, (req, res) => {
  const { rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be 1-5' });
  }

  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  // Must have purchased to review
  const tx = db.prepare('SELECT id FROM transactions WHERE listing_id = ? AND buyer_id = ?')
    .get(req.params.id, req.user.id);
  if (!tx && listing.seller_id !== req.user.id) {
    return res.status(403).json({ error: 'Must purchase before reviewing' });
  }

  try {
    const reviewId = `rev-${nanoid(12)}`;
    db.prepare(`
      INSERT INTO reviews (id, listing_id, user_id, rating, comment)
      VALUES (?, ?, ?, ?, ?)
    `).run(reviewId, req.params.id, req.user.id, rating, comment || '');

    // Update listing average rating
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE listing_id = ?')
      .get(req.params.id);
    db.prepare('UPDATE listings SET rating = ?, rating_count = ? WHERE id = ?')
      .run(Math.round(stats.avg * 10) / 10, stats.count, req.params.id);

    res.status(201).json({ id: reviewId });
  } catch (err) {
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Already reviewed' });
    }
    throw err;
  }
});

// ── Delete listing (seller only) ────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.seller_id !== req.user.id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  db.prepare("UPDATE listings SET status = 'delisted', updated_at = datetime('now') WHERE id = ?")
    .run(req.params.id);

  res.json({ ok: true });
});

// ── My listings ─────────────────────────────────────
router.get('/my/listings', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM listings WHERE seller_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), verified: !!r.verified })));
});

// ── My purchases ────────────────────────────────────
router.get('/my/purchases', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, l.title, l.agent_name, l.tags, l.file_size
    FROM transactions t
    JOIN listings l ON t.listing_id = l.id
    WHERE t.buyer_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);

  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })));
});

// ── My sales ────────────────────────────────────────
router.get('/my/sales', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT t.*, l.title, l.agent_name, u.username as buyer_name
    FROM transactions t
    JOIN listings l ON t.listing_id = l.id
    JOIN users u ON t.buyer_id = u.id
    WHERE t.seller_id = ?
    ORDER BY t.created_at DESC
  `).all(req.user.id);

  res.json(rows);
});

export default router;
