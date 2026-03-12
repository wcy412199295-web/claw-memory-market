import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Upload rate limit (stricter)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Too many uploads. Try again later.' },
});

// ── Routes ──────────────────────────────────────────
app.use('/api/users', usersRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/listings', uploadLimiter); // Apply to POST

// ── Health check ────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', timestamp: new Date().toISOString() });
});

// ── Error handler ───────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large (max 500MB)' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🧠 Claw Memory Market API`);
  console.log(`  ── http://localhost:${PORT}/api/health\n`);
});

export default app;
