import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'market.db'));

// WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Schema ──────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name  TEXT,
    avatar_url    TEXT,
    bio           TEXT DEFAULT '',
    balance       REAL DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS listings (
    id            TEXT PRIMARY KEY,
    seller_id     TEXT NOT NULL REFERENCES users(id),
    title         TEXT NOT NULL,
    description   TEXT DEFAULT '',
    agent_name    TEXT DEFAULT '',
    agent_model   TEXT DEFAULT '',
    price         REAL DEFAULT 0,
    currency      TEXT DEFAULT 'USDT',
    tags          TEXT DEFAULT '[]',
    file_path     TEXT NOT NULL,
    file_size     INTEGER DEFAULT 0,
    file_hash     TEXT DEFAULT '',
    memory_count  INTEGER DEFAULT 0,
    session_count INTEGER DEFAULT 0,
    skill_count   INTEGER DEFAULT 0,
    status        TEXT DEFAULT 'active' CHECK(status IN ('active','sold','delisted','pending')),
    verified      INTEGER DEFAULT 0,
    downloads     INTEGER DEFAULT 0,
    rating        REAL DEFAULT 0,
    rating_count  INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES listings(id),
    buyer_id    TEXT NOT NULL REFERENCES users(id),
    seller_id   TEXT NOT NULL REFERENCES users(id),
    price       REAL NOT NULL,
    currency    TEXT DEFAULT 'USDT',
    status      TEXT DEFAULT 'completed' CHECK(status IN ('pending','completed','refunded','disputed')),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id          TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES listings(id),
    user_id     TEXT NOT NULL REFERENCES users(id),
    rating      INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment     TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(listing_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS downloads (
    id          TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES listings(id),
    user_id     TEXT NOT NULL REFERENCES users(id),
    created_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_listings_seller ON listings(seller_id);
  CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
  CREATE INDEX IF NOT EXISTS idx_listings_tags ON listings(tags);
  CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_seller ON transactions(seller_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_listing ON reviews(listing_id);
`);

export default db;
