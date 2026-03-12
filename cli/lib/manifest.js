/**
 * 生成记忆打包清单
 * 扫描 OpenClaw 目录，列出所有需要打包的文件
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { glob } from 'glob';
import { createHash } from 'crypto';

/**
 * @param {string} openclawDir — OpenClaw 根目录
 * @param {string} agentName — Agent 名称
 * @param {object} options — 打包选项
 */
export async function generateManifest(openclawDir, agentName, options = {}) {
  const {
    includeWorkspace = true,
    includeSessions = true,
    includeMedia = false
  } = options;

  const manifest = {
    version: '1.0.0',
    format: 'clawmem',
    createdAt: new Date().toISOString(),
    agent: {
      name: agentName,
      openclawVersion: null
    },
    files: {
      config: [],
      memory: [],
      sessions: [],
      skills: [],
      workspace: [],
      media: [],
      cron: [],
      identity: []
    },
    totalSize: 0,
    fileCount: 0
  };

  // 读取 OpenClaw 版本
  try {
    const configRaw = await readFile(join(openclawDir, 'openclaw.json'), 'utf-8');
    const config = JSON.parse(configRaw);
    manifest.agent.openclawVersion = config.meta?.lastTouchedVersion || 'unknown';
  } catch {
    manifest.agent.openclawVersion = 'unknown';
  }

  // === 1. 配置文件 ===
  const configFiles = [
    'openclaw.json',
    'exec-approvals.json',
    'node.json'
  ];
  for (const f of configFiles) {
    await addFileIfExists(manifest, 'config', openclawDir, f);
  }

  // Agent 配置
  const agentDir = join(openclawDir, 'agents', agentName, 'agent');
  const agentFiles = await safeGlob(join(agentDir, '**/*'));
  for (const f of agentFiles) {
    await addFile(manifest, 'config', openclawDir, relative(openclawDir, f));
  }

  // === 2. 记忆文件 ===
  const memoryDir = join(openclawDir, 'memory');
  const memoryFiles = await safeGlob(join(memoryDir, '**/*'));
  for (const f of memoryFiles) {
    await addFile(manifest, 'memory', openclawDir, relative(openclawDir, f));
  }

  // Workspace 内的记忆
  const wsMemoryDir = join(openclawDir, 'workspace', 'memory');
  const wsMemoryFiles = await safeGlob(join(wsMemoryDir, '**/*.md'));
  for (const f of wsMemoryFiles) {
    await addFile(manifest, 'memory', openclawDir, relative(openclawDir, f));
  }

  // === 3. 对话历史 ===
  if (includeSessions) {
    const sessionsDir = join(openclawDir, 'agents', agentName, 'sessions');
    const sessionFiles = await safeGlob(join(sessionsDir, '*.jsonl'));
    for (const f of sessionFiles) {
      await addFile(manifest, 'sessions', openclawDir, relative(openclawDir, f));
    }
  }

  // === 4. 技能 ===
  const skillsDir = join(openclawDir, 'skills');
  const skillFiles = await safeGlob(join(skillsDir, '**/*'));
  for (const f of skillFiles) {
    await addFile(manifest, 'skills', openclawDir, relative(openclawDir, f));
  }

  // === 5. 工作区 ===
  if (includeWorkspace) {
    const workspaceDir = join(openclawDir, 'workspace');
    const wsFiles = await safeGlob(join(workspaceDir, '**/*'), {
      ignore: [
        '**/node_modules/**',
        '**/.git/**',
        '**/memory/**' // 已单独处理
      ]
    });
    for (const f of wsFiles) {
      await addFile(manifest, 'workspace', openclawDir, relative(openclawDir, f));
    }
  }

  // === 6. 媒体 ===
  if (includeMedia) {
    const mediaDir = join(openclawDir, 'media');
    const mediaFiles = await safeGlob(join(mediaDir, '**/*'));
    for (const f of mediaFiles) {
      await addFile(manifest, 'media', openclawDir, relative(openclawDir, f));
    }
  }

  // === 7. Cron 任务 ===
  const cronFiles = await safeGlob(join(openclawDir, 'cron', '*.json'));
  for (const f of cronFiles) {
    await addFile(manifest, 'cron', openclawDir, relative(openclawDir, f));
  }

  // === 8. 身份信息 ===
  const identityFiles = await safeGlob(join(openclawDir, 'identity', '**/*'));
  for (const f of identityFiles) {
    await addFile(manifest, 'identity', openclawDir, relative(openclawDir, f));
  }

  return manifest;
}

async function addFileIfExists(manifest, category, baseDir, relativePath) {
  const fullPath = join(baseDir, relativePath);
  try {
    const s = await stat(fullPath);
    if (s.isFile()) {
      manifest.files[category].push({
        path: relativePath,
        size: s.size,
        mtime: s.mtime.toISOString()
      });
      manifest.totalSize += s.size;
      manifest.fileCount++;
    }
  } catch {
    // 文件不存在，跳过
  }
}

async function addFile(manifest, category, baseDir, relativePath) {
  return addFileIfExists(manifest, category, baseDir, relativePath);
}

async function safeGlob(pattern, options = {}) {
  try {
    return await glob(pattern, { nodir: true, ...options });
  } catch {
    return [];
  }
}
