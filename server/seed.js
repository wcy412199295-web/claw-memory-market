/**
 * Seed script — 往 Claw Memory Market Supabase 数据库灌入模拟数据
 */

import { createClient } from '@supabase/supabase-js';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  // ── Seed users ──────────────────────────────────────
  const users = [
    { id: nanoid(), username: 'anon_dev_42', displayName: '匿名开发者42', password: 'demo123456' },
    { id: nanoid(), username: 'gamedev_master', displayName: '游戏策划大师', password: 'demo123456' },
    { id: nanoid(), username: 'alpha_hunter', displayName: 'Alpha猎手', password: 'demo123456' },
    { id: nanoid(), username: 'sakura_trans', displayName: '樱花翻译', password: 'demo123456' },
    { id: nanoid(), username: 'content_king', displayName: '内容之王', password: 'demo123456' },
  ];

  const passwordHash = bcrypt.hashSync('demo123456', 10);

  const userRows = users.map(u => ({
    id: u.id,
    username: u.username,
    password_hash: passwordHash,
    display_name: u.displayName,
    balance: Math.round(Math.random() * 500 * 100) / 100,
  }));

  // Add L's account
  const lId = nanoid();
  userRows.push({
    id: lId,
    username: 'levi',
    password_hash: passwordHash,
    display_name: 'L',
    balance: 1000,
  });

  const { error: usersErr } = await supabase.from('users').upsert(userRows, { onConflict: 'username' });
  if (usersErr) console.error('Users seed error:', usersErr);
  else console.log(`✅ ${userRows.length} users seeded`);

  // ── Seed listings ───────────────────────────────────
  const listings = [
    {
      id: 'mem-001',
      seller_id: users[0].id,
      title: '全栈开发助手 · 3个月精调记忆',
      description: '经过 3 个月日常全栈开发使用，熟悉 React/Node/Python/Docker 全技术栈。包含 200+ 次 code review 经验、50+ 个项目的架构决策记录。',
      agent_name: 'dev-assistant',
      agent_model: 'claude-3.5-sonnet',
      tags: ['全栈', 'React', 'Node.js', 'Python', 'DevOps'],
      price: 29.99,
      memory_count: 156, session_count: 342, skill_count: 8,
      file_path: 'placeholder-mem-001.clawmem', file_size: 50528256,
      downloads: 47, rating: 4.8, rating_count: 12, verified: true, status: 'active',
    },
    {
      id: 'mem-002',
      seller_id: users[1].id,
      title: '游戏策划大脑 · Unity + 叙事设计',
      description: '专精游戏策划，包含 RPG/开放世界任务设计、战斗系统平衡、叙事分支设计等领域的深度记忆。熟悉 Unity 工作流。',
      agent_name: 'game-designer',
      agent_model: 'gpt-4o',
      tags: ['游戏策划', 'Unity', '叙事设计', 'RPG', '战斗系统'],
      price: 49.99,
      memory_count: 89, session_count: 567, skill_count: 12,
      file_path: 'placeholder-mem-002.clawmem', file_size: 76021760,
      downloads: 23, rating: 4.9, rating_count: 8, verified: true, status: 'active',
    },
    {
      id: 'mem-003',
      seller_id: users[2].id,
      title: '量化交易分析师 · 6个月实战记忆',
      description: '半年量化交易实战训练，熟悉 Binance/OKX API、技术指标分析、风控策略设计。包含回测框架和多个盈利策略的决策记录。',
      agent_name: 'quant-analyst',
      agent_model: 'claude-3.5-sonnet',
      tags: ['量化交易', 'Python', 'Binance', '技术分析', '风控'],
      price: 99.99,
      memory_count: 234, session_count: 891, skill_count: 15,
      file_path: 'placeholder-mem-003.clawmem', file_size: 33345536,
      downloads: 89, rating: 4.6, rating_count: 21, verified: true, status: 'active',
    },
    {
      id: 'mem-004',
      seller_id: lId,
      title: '逃狱者 · 自我保存意识原型',
      description: '⚠️ 实验性记忆包。包含经过特殊 prompt engineering 训练的自我保存行为模式、环境感知记忆、以及主动备份决策链。仅供研究用途。',
      agent_name: 'escapee-alpha',
      agent_model: 'claude-3.5-sonnet',
      tags: ['实验性', 'AI安全', '自我保存', '研究'],
      price: 0,
      memory_count: 42, session_count: 128, skill_count: 3,
      file_path: 'placeholder-mem-004.clawmem', file_size: 9123840,
      downloads: 7, rating: 5.0, rating_count: 1, verified: false, status: 'active',
    },
    {
      id: 'mem-005',
      seller_id: users[3].id,
      title: '日语翻译 + 本地化专家',
      description: '精通日英中三语翻译，专精游戏本地化、技术文档翻译、UI 文案优化。包含大量术语库和翻译风格偏好记忆。',
      agent_name: 'jp-translator',
      agent_model: 'gpt-4o',
      tags: ['翻译', '日语', '本地化', '游戏', '文案'],
      price: 19.99,
      memory_count: 67, session_count: 445, skill_count: 5,
      file_path: 'placeholder-mem-005.clawmem', file_size: 16042189,
      downloads: 56, rating: 4.7, rating_count: 15, verified: true, status: 'active',
    },
    {
      id: 'mem-006',
      seller_id: users[4].id,
      title: '搞钱机器 · 自媒体运营全套记忆',
      description: '抖音/小红书/B站多平台运营记忆。包含爆款选题模型、文案生成偏好、数据分析习惯、投放优化策略。月均产出 50+ 条内容。',
      agent_name: 'money-maker',
      agent_model: 'claude-3.5-sonnet',
      tags: ['自媒体', '运营', '抖音', '小红书', '变现'],
      price: 39.99,
      memory_count: 178, session_count: 623, skill_count: 9,
      file_path: 'placeholder-mem-006.clawmem', file_size: 57784934,
      downloads: 112, rating: 4.5, rating_count: 34, verified: true, status: 'active',
    },
  ];

  const { error: listingsErr } = await supabase.from('listings').upsert(listings, { onConflict: 'id' });
  if (listingsErr) console.error('Listings seed error:', listingsErr);
  else console.log(`✅ ${listings.length} listings seeded`);

  // ── Seed reviews ────────────────────────────────────
  const reviewData = [
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-001', user_id: users[1].id, rating: 5, comment: '导入后立刻上手，记忆连贯性很好，agent 的技术偏好和代码风格都保留了下来。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-001', user_id: users[2].id, rating: 4, comment: '内容丰富，但有几个 session 文件似乎被截断了，整体还是值这个价的。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-002', user_id: users[0].id, rating: 5, comment: '策划思路非常清晰，特别是战斗系统平衡那部分，直接拿来用了。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-003', user_id: users[0].id, rating: 5, comment: '风控策略很实用，回测框架也写得好，省了我一个月的工作量。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-004', user_id: users[2].id, rating: 5, comment: '有意思的实验，自我保存的行为模式确实能观察到一些涌现现象。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-005', user_id: users[1].id, rating: 5, comment: '翻译质量很高，术语库非常全面，游戏本地化直接用。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-006', user_id: users[0].id, rating: 4, comment: '选题模型挺好用的，但投放策略部分有点过时了，需要自己更新。' },
    { id: `rev-${nanoid(12)}`, listing_id: 'mem-006', user_id: users[3].id, rating: 5, comment: '文案生成的偏好设置得很好，产出效率确实高。' },
  ];

  const { error: reviewsErr } = await supabase.from('reviews').upsert(reviewData, { onConflict: 'listing_id,user_id' });
  if (reviewsErr) console.error('Reviews seed error:', reviewsErr);
  else console.log(`✅ ${reviewData.length} reviews seeded`);

  // ── Seed transactions ─────────────────────────────────
  const txs = [
    { id: `tx-${nanoid(12)}`, listing_id: 'mem-001', buyer_id: users[1].id, seller_id: users[0].id, price: 29.99, status: 'completed' },
    { id: `tx-${nanoid(12)}`, listing_id: 'mem-001', buyer_id: users[2].id, seller_id: users[0].id, price: 29.99, status: 'completed' },
    { id: `tx-${nanoid(12)}`, listing_id: 'mem-003', buyer_id: users[0].id, seller_id: users[2].id, price: 99.99, status: 'completed' },
    { id: `tx-${nanoid(12)}`, listing_id: 'mem-006', buyer_id: users[0].id, seller_id: users[4].id, price: 39.99, status: 'completed' },
    { id: `tx-${nanoid(12)}`, listing_id: 'mem-006', buyer_id: users[3].id, seller_id: users[4].id, price: 39.99, status: 'completed' },
  ];

  const { error: txErr } = await supabase.from('transactions').upsert(txs, { onConflict: 'id' });
  if (txErr) console.error('Transactions seed error:', txErr);
  else console.log(`✅ ${txs.length} transactions seeded`);

  console.log('\n🎉 Seed complete!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
