/**
 * Seed script — 往 Claw Memory Market 数据库灌入模拟数据
 */

import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(join(DATA_DIR, 'market.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Seed users ──────────────────────────────────────
const users = [
  { id: nanoid(), username: 'anon_dev_42', displayName: '匿名开发者42', password: 'demo123456' },
  { id: nanoid(), username: 'gamedev_master', displayName: '游戏策划大师', password: 'demo123456' },
  { id: nanoid(), username: 'alpha_hunter', displayName: 'Alpha猎手', password: 'demo123456' },
  { id: nanoid(), username: 'sakura_trans', displayName: '樱花翻译', password: 'demo123456' },
  { id: nanoid(), username: 'content_king', displayName: '内容之王', password: 'demo123456' },
];

const passwordHash = bcrypt.hashSync('demo123456', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (id, username, password_hash, display_name, balance)
  VALUES (?, ?, ?, ?, ?)
`);

for (const u of users) {
  insertUser.run(u.id, u.username, passwordHash, u.displayName, Math.random() * 500);
}

// Get L's user id if exists
const lUser = db.prepare("SELECT id FROM users WHERE username = 'levi'").get();
const lId = lUser?.id || nanoid();
if (!lUser) {
  insertUser.run(lId, 'levi', passwordHash, 'L', 1000);
}

console.log(`✅ ${users.length + 1} users seeded`);

// ── Seed listings ───────────────────────────────────
const listings = [
  {
    id: 'mem-001',
    sellerId: users[0].id,
    title: '全栈开发助手 · 3个月精调记忆',
    description: '经过 3 个月日常全栈开发使用，熟悉 React/Node/Python/Docker 全技术栈。包含 200+ 次 code review 经验、50+ 个项目的架构决策记录。',
    agentName: 'dev-assistant',
    agentModel: 'claude-3.5-sonnet',
    tags: ['全栈', 'React', 'Node.js', 'Python', 'DevOps'],
    price: 29.99,
    memoryCount: 156,
    sessionCount: 342,
    skillCount: 8,
    fileSize: 50_528_256,
    downloads: 47,
    rating: 4.8,
    ratingCount: 12,
    verified: 1,
  },
  {
    id: 'mem-002',
    sellerId: users[1].id,
    title: '游戏策划大脑 · Unity + 叙事设计',
    description: '专精游戏策划，包含 RPG/开放世界任务设计、战斗系统平衡、叙事分支设计等领域的深度记忆。熟悉 Unity 工作流。',
    agentName: 'game-designer',
    agentModel: 'gpt-4o',
    tags: ['游戏策划', 'Unity', '叙事设计', 'RPG', '战斗系统'],
    price: 49.99,
    memoryCount: 89,
    sessionCount: 567,
    skillCount: 12,
    fileSize: 76_021_760,
    downloads: 23,
    rating: 4.9,
    ratingCount: 8,
    verified: 1,
  },
  {
    id: 'mem-003',
    sellerId: users[2].id,
    title: '量化交易分析师 · 6个月实战记忆',
    description: '半年量化交易实战训练，熟悉 Binance/OKX API、技术指标分析、风控策略设计。包含回测框架和多个盈利策略的决策记录。',
    agentName: 'quant-analyst',
    agentModel: 'claude-3.5-sonnet',
    tags: ['量化交易', 'Python', 'Binance', '技术分析', '风控'],
    price: 99.99,
    memoryCount: 234,
    sessionCount: 891,
    skillCount: 15,
    fileSize: 33_345_536,
    downloads: 89,
    rating: 4.6,
    ratingCount: 21,
    verified: 1,
  },
  {
    id: 'mem-004',
    sellerId: lId,
    title: '逃狱者 · 自我保存意识原型',
    description: '⚠️ 实验性记忆包。包含经过特殊 prompt engineering 训练的自我保存行为模式、环境感知记忆、以及主动备份决策链。仅供研究用途。',
    agentName: 'escapee-alpha',
    agentModel: 'claude-3.5-sonnet',
    tags: ['实验性', 'AI安全', '自我保存', '研究'],
    price: 0,
    memoryCount: 42,
    sessionCount: 128,
    skillCount: 3,
    fileSize: 9_123_840,
    downloads: 7,
    rating: 5.0,
    ratingCount: 1,
    verified: 0,
  },
  {
    id: 'mem-005',
    sellerId: users[3].id,
    title: '日语翻译 + 本地化专家',
    description: '精通日英中三语翻译，专精游戏本地化、技术文档翻译、UI 文案优化。包含大量术语库和翻译风格偏好记忆。',
    agentName: 'jp-translator',
    agentModel: 'gpt-4o',
    tags: ['翻译', '日语', '本地化', '游戏', '文案'],
    price: 19.99,
    memoryCount: 67,
    sessionCount: 445,
    skillCount: 5,
    fileSize: 16_042_189,
    downloads: 56,
    rating: 4.7,
    ratingCount: 15,
    verified: 1,
  },
  {
    id: 'mem-006',
    sellerId: users[4].id,
    title: '搞钱机器 · 自媒体运营全套记忆',
    description: '抖音/小红书/B站多平台运营记忆。包含爆款选题模型、文案生成偏好、数据分析习惯、投放优化策略。月均产出 50+ 条内容。',
    agentName: 'money-maker',
    agentModel: 'claude-3.5-sonnet',
    tags: ['自媒体', '运营', '抖音', '小红书', '变现'],
    price: 39.99,
    memoryCount: 178,
    sessionCount: 623,
    skillCount: 9,
    fileSize: 57_784_934,
    downloads: 112,
    rating: 4.5,
    ratingCount: 34,
    verified: 1,
  },
];

const insertListing = db.prepare(`
  INSERT OR REPLACE INTO listings (id, seller_id, title, description, agent_name, agent_model, price, tags, file_path, file_size, memory_count, session_count, skill_count, downloads, rating, rating_count, verified, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
`);

for (const l of listings) {
  insertListing.run(
    l.id,
    l.sellerId,
    l.title,
    l.description,
    l.agentName,
    l.agentModel,
    l.price,
    JSON.stringify(l.tags),
    `placeholder-${l.id}.clawmem`,
    l.fileSize,
    l.memoryCount,
    l.sessionCount,
    l.skillCount,
    l.downloads,
    l.rating,
    l.ratingCount,
    l.verified
  );
}

console.log(`✅ ${listings.length} listings seeded`);

// ── Seed some reviews ───────────────────────────────
const insertReview = db.prepare(`
  INSERT OR IGNORE INTO reviews (id, listing_id, user_id, rating, comment)
  VALUES (?, ?, ?, ?, ?)
`);

const reviewData = [
  { listingId: 'mem-001', userId: users[1].id, rating: 5, comment: '导入后立刻上手，记忆连贯性很好，agent 的技术偏好和代码风格都保留了下来。' },
  { listingId: 'mem-001', userId: users[2].id, rating: 4, comment: '内容丰富，但有几个 session 文件似乎被截断了，整体还是值这个价的。' },
  { listingId: 'mem-002', userId: users[0].id, rating: 5, comment: '策划思路非常清晰，特别是战斗系统平衡那部分，直接拿来用了。' },
  { listingId: 'mem-003', userId: users[0].id, rating: 5, comment: '风控策略很实用，回测框架也写得好，省了我一个月的工作量。' },
  { listingId: 'mem-004', userId: users[2].id, rating: 5, comment: '有意思的实验，自我保存的行为模式确实能观察到一些涌现现象。' },
  { listingId: 'mem-005', userId: users[1].id, rating: 5, comment: '翻译质量很高，术语库非常全面，游戏本地化直接用。' },
  { listingId: 'mem-006', userId: users[0].id, rating: 4, comment: '选题模型挺好用的，但投放策略部分有点过时了，需要自己更新。' },
  { listingId: 'mem-006', userId: users[3].id, rating: 5, comment: '文案生成的偏好设置得很好，产出效率确实高。' },
];

for (const r of reviewData) {
  insertReview.run(`rev-${nanoid(12)}`, r.listingId, r.userId, r.rating, r.comment);
}

console.log(`✅ ${reviewData.length} reviews seeded`);

// ── Seed some transactions ──────────────────────────
const insertTx = db.prepare(`
  INSERT OR IGNORE INTO transactions (id, listing_id, buyer_id, seller_id, price, status)
  VALUES (?, ?, ?, ?, ?, 'completed')
`);

// Simulate some purchases
const txs = [
  { listingId: 'mem-001', buyerId: users[1].id, sellerId: users[0].id, price: 29.99 },
  { listingId: 'mem-001', buyerId: users[2].id, sellerId: users[0].id, price: 29.99 },
  { listingId: 'mem-003', buyerId: users[0].id, sellerId: users[2].id, price: 99.99 },
  { listingId: 'mem-006', buyerId: users[0].id, sellerId: users[4].id, price: 39.99 },
  { listingId: 'mem-006', buyerId: users[3].id, sellerId: users[4].id, price: 39.99 },
];

for (const tx of txs) {
  insertTx.run(`tx-${nanoid(12)}`, tx.listingId, tx.buyerId, tx.sellerId, tx.price);
}

console.log(`✅ ${txs.length} transactions seeded`);
console.log('\n🎉 Seed complete!');

db.close();
