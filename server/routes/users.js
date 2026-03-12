import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import supabase from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

// ── GitHub OAuth Config ─────────────────────────────
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://claw-memory-market-0vl2aypjvv.edgeone.cool';

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

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = nanoid();
    const passwordHash = await bcrypt.hash(password, 10);

    const { error } = await supabase.from('users').insert({
      id,
      username,
      password_hash: passwordHash,
      display_name: displayName || username,
    });

    if (error) throw error;

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

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error) throw error;
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
router.get('/me', requireAuth, async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) throw error;
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [listingsRes, salesRes, purchasesRes] = await Promise.all([
      supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', user.id),
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('seller_id', user.id),
      supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('buyer_id', user.id),
    ]);

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      bio: user.bio,
      avatarUrl: user.avatar_url,
      balance: user.balance,
      createdAt: user.created_at,
      stats: {
        listings: listingsRes.count || 0,
        sales: salesRes.count || 0,
        purchases: purchasesRes.count || 0,
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Update profile ──────────────────────────────────
router.patch('/me', requireAuth, async (req, res) => {
  try {
    const updates = {};
    if (req.body.displayName !== undefined) updates.display_name = req.body.displayName;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.avatarUrl !== undefined) updates.avatar_url = req.body.avatarUrl;
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id);

    if (error) throw error;
    res.json({ ok: true });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Deposit balance (simulated) ─────────────────────
router.post('/me/deposit', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get current balance then update (RLS-safe approach)
    const { data: current, error: fetchErr } = await supabase
      .from('users')
      .select('balance')
      .eq('id', req.user.id)
      .single();

    if (fetchErr) throw fetchErr;

    const newBalance = (current.balance || 0) + amount;

    const { error: updateErr } = await supabase
      .from('users')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', req.user.id);

    if (updateErr) throw updateErr;

    res.json({ balance: newBalance });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GitHub OAuth: Redirect to GitHub ────────────────
router.get('/github/login', (req, res) => {
  if (!GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: 'GitHub OAuth not configured' });
  }
  const state = nanoid();
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/api/users/github/callback`,
    scope: 'read:user user:email',
    state,
  });
  res.json({ url: `https://github.com/login/oauth/authorize?${params}` });
});

// ── GitHub OAuth: Callback ─────────────────────────
router.get('/github/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.redirect(`${FRONTEND_URL}?auth_error=no_code`);
    }

    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('GitHub token error:', tokenData);
      return res.redirect(`${FRONTEND_URL}?auth_error=token_failed`);
    }

    // Get GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const ghUser = await userRes.json();

    if (!ghUser.id) {
      return res.redirect(`${FRONTEND_URL}?auth_error=user_fetch_failed`);
    }

    const githubId = String(ghUser.id);

    // Check if user with this github_id already exists
    let { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('github_id', githubId)
      .maybeSingle();

    let user;

    if (existing) {
      // Existing GitHub user — update avatar if changed
      user = existing;
      if (ghUser.avatar_url && ghUser.avatar_url !== existing.avatar_url) {
        await supabase
          .from('users')
          .update({ avatar_url: ghUser.avatar_url, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      }
    } else {
      // Check if username is taken, add suffix if needed
      let username = ghUser.login;
      const { data: nameTaken } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .maybeSingle();
      if (nameTaken) {
        username = `${ghUser.login}_gh`;
      }

      const id = nanoid();
      const { error: insertErr } = await supabase.from('users').insert({
        id,
        username,
        password_hash: null,
        display_name: ghUser.name || ghUser.login,
        avatar_url: ghUser.avatar_url || null,
        github_id: githubId,
        bio: ghUser.bio || '',
      });

      if (insertErr) {
        console.error('GitHub user insert error:', insertErr);
        return res.redirect(`${FRONTEND_URL}?auth_error=db_error`);
      }

      user = { id, username, display_name: ghUser.name || ghUser.login, balance: 0, avatar_url: ghUser.avatar_url };
    }

    // Sign JWT and redirect to frontend with token
    const token = signToken({ id: user.id, username: user.username });
    res.redirect(`${FRONTEND_URL}?github_token=${token}`);
  } catch (err) {
    console.error('GitHub callback error:', err);
    res.redirect(`${FRONTEND_URL}?auth_error=server_error`);
  }
});

export default router;
