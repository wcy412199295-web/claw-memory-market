/**
 * 记忆还原器
 * 将 .clawmem 文件还原到 OpenClaw 目录
 */

import extractZip from 'extract-zip';
import { readFile, writeFile, mkdir, mkdtemp, rm, stat, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

/**
 * @param {string} filePath — .clawmem 文件路径
 * @param {string} targetDir — 目标 OpenClaw 目录
 * @param {object} options — { merge: boolean }
 * @returns {Promise<{restoredCount: number, skippedCount: number}>}
 */
export async function unpackMemory(filePath, targetDir, options = {}) {
  const { merge = false } = options;
  const tempDir = await mkdtemp(join(tmpdir(), 'clawmem-unpack-'));
  let restoredCount = 0;
  let skippedCount = 0;

  try {
    // 解压到临时目录
    await extractZip(filePath, { dir: tempDir });

    // 读取 manifest
    const manifestRaw = await readFile(join(tempDir, 'manifest.json'), 'utf-8');
    const manifest = JSON.parse(manifestRaw);

    // 遍历所有文件
    for (const category of Object.keys(manifest.files)) {
      for (const fileEntry of manifest.files[category]) {
        const sourcePath = join(tempDir, 'data', fileEntry.path);
        const destPath = join(targetDir, fileEntry.path);

        // 合并模式：文件已存在则跳过
        if (merge) {
          try {
            await stat(destPath);
            skippedCount++;
            continue;
          } catch {
            // 文件不存在，继续还原
          }
        }

        // 确保目录存在
        await mkdir(dirname(destPath), { recursive: true });

        // 复制文件
        await copyFile(sourcePath, destPath);
        restoredCount++;
      }
    }

    // 写入还原记录
    const restoreLog = {
      restoredAt: new Date().toISOString(),
      sourceFile: filePath,
      sourceAgent: manifest.agent.name,
      sourceVersion: manifest.agent.openclawVersion,
      restoredCount,
      skippedCount,
      merge
    };

    await mkdir(join(targetDir, 'backups'), { recursive: true });
    await writeFile(
      join(targetDir, 'backups', `restore-${Date.now()}.json`),
      JSON.stringify(restoreLog, null, 2)
    );

    return { restoredCount, skippedCount };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
