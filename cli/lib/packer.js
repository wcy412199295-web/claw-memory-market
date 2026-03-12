/**
 * 记忆打包器
 * 将脱敏后的文件打包为 .clawmem 格式（本质是带 manifest 的 zip）
 */

import archiver from 'archiver';
import { createWriteStream, createReadStream } from 'fs';
import { readFile, stat } from 'fs/promises';
import { join, basename } from 'path';
import { createHash } from 'crypto';

/**
 * @param {object} manifest — 脱敏后的 manifest
 * @param {string} outputPath — 输出路径（可选）
 * @returns {Promise<string>} — 输出文件路径
 */
export async function packMemory(manifest, outputPath) {
  const sourceDir = manifest._sourceDir || `${process.env.HOME}/.openclaw`;
  const tempDir = manifest._tempDir;

  // 默认输出文件名
  if (!outputPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    outputPath = `${manifest.agent.name}_${timestamp}.clawmem`;
  }

  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve(outputPath));
    archive.on('error', reject);
    archive.pipe(output);

    // 1. 写入 manifest.json（不含临时路径）
    const cleanManifest = cleanManifestForExport(manifest);
    archive.append(JSON.stringify(cleanManifest, null, 2), { name: 'manifest.json' });

    // 2. 打包所有文件
    for (const category of Object.keys(manifest.files)) {
      for (const fileEntry of manifest.files[category]) {
        // 使用脱敏后的文件（如果有）
        const filePath = fileEntry._sanitized && fileEntry._tempPath
          ? fileEntry._tempPath
          : join(sourceDir, fileEntry.path);

        archive.file(filePath, { name: `data/${fileEntry.path}` });
      }
    }

    archive.finalize();
  });
}

/**
 * 清理 manifest 中的临时信息
 */
function cleanManifestForExport(manifest) {
  const clean = JSON.parse(JSON.stringify(manifest));
  delete clean._tempDir;
  delete clean._sourceDir;

  for (const category of Object.keys(clean.files)) {
    for (const fileEntry of clean.files[category]) {
      delete fileEntry._sanitized;
      delete fileEntry._tempPath;
    }
  }

  return clean;
}
