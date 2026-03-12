import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import db from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

// ── Register ────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, displayName } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    if (username.length < 3 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 3-30 characters' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name)
      VALUES (?, ?, ?, ?)
    `).run(id, username, passwordHash, displayName || username);

    const token = signToken({ id, username });
    res.status(201).json({
      token,
      user: { id, username, displayName: displayName || username, balance: 0 }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Login ───────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: user.id, username: user.username });
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.display_name,
        balance: user.balance,
        bio: user.bio,
        avatarUrl: user.avatar_url,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Get current user profile ────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const listingCount = db.prepare('SELECT COUNT(*) as count FROM listings WHERE seller_id = ?').get(user.id).count;
  const salesCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE seller_id = ?').get(user.id).count;
  const purchaseCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE buyer_id = ?').get(user.id).count;

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    bio: user.bio,
    avatarUrl: user.avatar_url,
    balance: user.balance,
    createdAt: user.created_at,
    stats: { listings: listingCount, sales: salesCount, purchases: purchaseCount }
  });
});

// ── Update profile ──────────────────────────────────
router.patch('/me', requireAuth, (req, res) => {
  const { displayName, bio, avatarUrl } = req.body;
  db.prepare(`
    UPDATE users SET display_name = COALESCE(?, display_name),
                     bio = COALESCE(?, bio),
                     avatar_url = COALESCE(?, avatar_url),
                     updated_at = datetime('now')
    WHERE id = ?
  `).run(displayName, bio, avatarUrl, req.user.id);

  res.json({ ok: true });
});

// ── Deposit balance (simulated) ─────────────────────
router.post('/me/deposit', requireAuth, (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  db.prepare('UPDATE users SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(amount, req.user.id);

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ balance: user.balance });
});

export default router;
