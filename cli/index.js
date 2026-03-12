#!/usr/bin/env node

/**
 * Claw Memory Market — CLI 打包工具
 *
 * 功能：
 * 1. pack   — 将 OpenClaw agent 的记忆打包为 .clawmem 文件
 * 2. verify — 验证 .clawmem 文件完整性
 * 3. unpack — 将 .clawmem 文件还原到指定目录
 * 4. upload — 打包并上传到 Claw Memory Market
 */

import { program } from 'commander';
import { packMemory } from './lib/packer.js';
import { verifyPackage } from './lib/verifier.js';
import { unpackMemory } from './lib/unpacker.js';
import { sanitize } from './lib/sanitizer.js';
import { generateManifest } from './lib/manifest.js';

program
  .name('claw-memory')
  .description('🧠 Claw Memory Market CLI — 打包、验证、迁移你的 Claw 记忆')
  .version('0.1.0');

program
  .command('pack')
  .description('打包 OpenClaw agent 记忆为 .clawmem 文件')
  .option('-d, --dir <path>', 'OpenClaw 根目录', `${process.env.HOME}/.openclaw`)
  .option('-a, --agent <name>', 'Agent 名称', 'main')
  .option('-o, --output <path>', '输出文件路径')
  .option('--no-workspace', '不包含 workspace 文件')
  .option('--no-sessions', '不包含对话历史')
  .option('--include-media', '包含媒体文件')
  .option('--dry-run', '仅生成清单，不实际打包')
  .action(async (opts) => {
    try {
      const manifest = await generateManifest(opts.dir, opts.agent, {
        includeWorkspace: opts.workspace,
        includeSessions: opts.sessions,
        includeMedia: opts.includeMedia
      });

      console.log(`\n📋 记忆清单:`);
      console.log(`   Agent:       ${manifest.agent.name}`);
      console.log(`   记忆文件:    ${manifest.files.memory.length} 个`);
      console.log(`   对话历史:    ${manifest.files.sessions.length} 个`);
      console.log(`   技能:        ${manifest.files.skills.length} 个`);
      console.log(`   工作区文件:  ${manifest.files.workspace.length} 个`);
      console.log(`   总大小:      ${(manifest.totalSize / 1024 / 1024).toFixed(2)} MB`);

      if (opts.dryRun) {
        console.log('\n🔍 Dry run 完成，未实际打包。');
        return;
      }

      // 隐私脱敏
      console.log('\n🔒 正在脱敏...');
      const sanitized = await sanitize(manifest);
      console.log(`   已脱敏 ${sanitized.redactedCount} 处敏感信息`);

      // 打包
      console.log('\n📦 正在打包...');
      const outputPath = await packMemory(sanitized, opts.output);
      console.log(`\n✅ 打包完成: ${outputPath}`);
      console.log(`   文件大小: ${(sanitized.totalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   SHA-256:  ${sanitized.checksum}`);
    } catch (err) {
      console.error(`\n❌ 打包失败: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('verify <file>')
  .description('验证 .clawmem 文件完整性')
  .action(async (file) => {
    try {
      const result = await verifyPackage(file);
      if (result.valid) {
        console.log(`\n✅ 验证通过`);
        console.log(`   Agent:    ${result.manifest.agent.name}`);
        console.log(`   打包时间: ${result.manifest.createdAt}`);
        console.log(`   文件数:   ${result.manifest.fileCount}`);
        console.log(`   SHA-256:  ${result.checksum}`);
      } else {
        console.log(`\n❌ 验证失败: ${result.errors.join(', ')}`);
        process.exit(1);
      }
    } catch (err) {
      console.error(`\n❌ 验证错误: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('unpack <file>')
  .description('还原 .clawmem 到指定目录')
  .option('-d, --dir <path>', '目标 OpenClaw 目录', `${process.env.HOME}/.openclaw`)
  .option('--merge', '合并模式（不覆盖已有文件）')
  .action(async (file, opts) => {
    try {
      console.log('\n🔍 正在验证包文件...');
      const verifyResult = await verifyPackage(file);
      if (!verifyResult.valid) {
        console.error(`❌ 包文件校验失败: ${verifyResult.errors.join(', ')}`);
        process.exit(1);
      }

      console.log('📂 正在还原...');
      const result = await unpackMemory(file, opts.dir, { merge: opts.merge });
      console.log(`\n✅ 还原完成`);
      console.log(`   还原文件: ${result.restoredCount} 个`);
      console.log(`   跳过文件: ${result.skippedCount} 个`);
      console.log(`   目标目录: ${opts.dir}`);
    } catch (err) {
      console.error(`\n❌ 还原失败: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command('upload <file>')
  .description('上传 .clawmem 到 Claw Memory Market')
  .option('--price <amount>', '定价（USDT）', '0')
  .option('--title <title>', '记忆包标题')
  .option('--desc <description>', '描述')
  .option('--tags <tags>', '标签（逗号分隔）')
  .option('--token <token>', 'API 认证 token')
  .option('--server <url>', 'Market API 地址', 'http://localhost:3210/api')
  .action(async (file, opts) => {
    try {
      console.log('\n🔍 正在验证...');
      const verifyResult = await verifyPackage(file);
      if (!verifyResult.valid) {
        console.error(`❌ 包文件校验失败`);
        process.exit(1);
      }

      const token = opts.token || process.env.CLAW_MARKET_TOKEN;
      if (!token) {
        console.error('❌ 需要认证 token。使用 --token 或设置 CLAW_MARKET_TOKEN 环境变量');
        process.exit(1);
      }

      console.log('🚀 正在上传到 Claw Memory Market...');

      const { createReadStream, statSync } = await import('node:fs');
      const { basename } = await import('node:path');

      const fileStats = statSync(file);
      const fileName = basename(file);

      // Build multipart form data manually for Node.js
      const FormData = (await import('node:buffer')).Buffer ? null : null;

      // Use native fetch with FormData (Node 18+)
      const { FormData: NodeFormData, File: NodeFile } = await import('node:buffer')
        .then(() => import('undici'))
        .catch(() => {
          // Fallback: use node built-in
          return { FormData: globalThis.FormData, File: globalThis.File };
        });

      const { readFileSync } = await import('node:fs');
      const fileBuffer = readFileSync(file);
      const blob = new Blob([fileBuffer]);

      const formData = new (NodeFormData || globalThis.FormData)();
      formData.append('file', blob, fileName);
      formData.append('title', opts.title || verifyResult.manifest.agent?.name || 'Untitled Memory');
      formData.append('description', opts.desc || '');
      formData.append('price', opts.price);
      formData.append('memoryCount', String(verifyResult.manifest.files?.memory?.length || 0));
      formData.append('sessionCount', String(verifyResult.manifest.files?.sessions?.length || 0));
      formData.append('skillCount', String(verifyResult.manifest.files?.skills?.length || 0));
      if (opts.tags) {
        formData.append('tags', JSON.stringify(opts.tags.split(',').map(t => t.trim())));
      }

      const res = await fetch(`${opts.server}/listings`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        console.error(`❌ 上传失败: ${data.error || res.statusText}`);
        process.exit(1);
      }

      console.log(`\n✅ 上传成功！`);
      console.log(`   ID:    ${data.id}`);
      console.log(`   标题:  ${opts.title || verifyResult.manifest.agent?.name}`);
      console.log(`   价格:  ${opts.price} USDT`);
      console.log(`   标签:  ${opts.tags || '无'}`);
    } catch (err) {
      console.error(`\n❌ 上传失败: ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
