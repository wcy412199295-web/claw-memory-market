import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import supabase from './db.js';
import { authMiddleware } from './auth.js';
import usersRouter from './routes/users.js';
import listingsRouter from './routes/listings.js';
import statsRouter from './routes/stats.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3210;

const app = express();

// ── Middleware ───────────────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(authMiddleware);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Upload rate limit (stricter)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads. Try again later.' },
});

// ── Routes ──────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/listings', uploadLimiter);

// ── Health check ────────────────────────────────────
app.get('/api/health', async (_req, res) => {
  try {
    // Quick DB connectivity check
    const { error } = await supabase.from('users').select('id', { count: 'exact', head: true });
    res.json({
      status: error ? 'degraded' : 'ok',
      version: '0.2.0',
      database: 'supabase-postgresql',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.json({ status: 'degraded', version: '0.2.0', timestamp: new Date().toISOString() });
  }
});

// ── Error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 500MB)' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ── Auto-seed if DB is empty ────────────────────────
async function startServer() {
  try {
    const { count } = await supabase.from('users').select('id', { count: 'exact', head: true });
    if (count === 0) {
      console.log('📦 Database empty, running seed...');
      const { execSync } = await import('child_process');
      execSync('node seed.js', { cwd: __dirname, stdio: 'inherit' });
    }
  } catch (err) {
    console.warn('⚠️ Could not check/seed DB:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`\n  🧠 Claw Memory Market API (Supabase)`);
    console.log(`  ── http://localhost:${PORT}/api/health\n`);
  });
}

startServer();

export default app;
