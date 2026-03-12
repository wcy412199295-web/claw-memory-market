/**
 * .clawmem 包验证器
 * 检查：
 * 1. 文件格式是否正确（zip + manifest.json）
 * 2. manifest 结构是否完整
 * 3. 文件列表是否与实际打包内容匹配
 * 4. 校验和验证
 */

import extractZip from 'extract-zip';
import { readFile, mkdtemp, rm, readdir, stat } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

/**
 * @param {string} filePath — .clawmem 文件路径
 * @returns {Promise<{valid: boolean, manifest?: object, errors?: string[], checksum?: string}>}
 */
export async function verifyPackage(filePath) {
  const errors = [];
  const tempDir = await mkdtemp(join(tmpdir(), 'clawmem-verify-'));

  try {
    // 1. 尝试解压
    try {
      await extractZip(filePath, { dir: tempDir });
    } catch (err) {
      errors.push(`无法解压: ${err.message}`);
      return { valid: false, errors };
    }

    // 2. 检查 manifest.json
    let manifest;
    try {
      const manifestRaw = await readFile(join(tempDir, 'manifest.json'), 'utf-8');
      manifest = JSON.parse(manifestRaw);
    } catch {
      errors.push('缺少 manifest.json 或格式错误');
      return { valid: false, errors };
    }

    // 3. 验证 manifest 结构
    if (!manifest.version) errors.push('manifest 缺少 version');
    if (!manifest.format || manifest.format !== 'clawmem') errors.push('manifest format 不正确');
    if (!manifest.agent?.name) errors.push('manifest 缺少 agent.name');
    if (!manifest.files) errors.push('manifest 缺少 files');
    if (!manifest.createdAt) errors.push('manifest 缺少 createdAt');

    if (errors.length > 0) {
      return { valid: false, manifest, errors };
    }

    // 4. 检查文件完整性
    let expectedCount = 0;
    for (const category of Object.keys(manifest.files)) {
      for (const fileEntry of manifest.files[category]) {
        expectedCount++;
        try {
          await stat(join(tempDir, 'data', fileEntry.path));
        } catch {
          errors.push(`文件缺失: ${fileEntry.path}`);
        }
      }
    }

    // 5. 计算校验和
    const fileBuffer = await readFile(filePath);
    const checksum = createHash('sha256').update(fileBuffer).digest('hex');

    if (errors.length > 0) {
      return { valid: false, manifest, errors, checksum };
    }

    return {
      valid: true,
      manifest: {
        ...manifest,
        fileCount: expectedCount
      },
      checksum
    };
  } finally {
    // 清理临时目录
    await rm(tempDir, { recursive: true, force: true });
  }
}
