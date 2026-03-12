/**
 * 隐私脱敏层
 * 打包前自动检测并脱敏敏感信息：
 * - API keys / tokens
 * - 密码
 * - 私钥
 * - OAuth tokens
 * - webhook URLs
 * - 个人身份信息（可选）
 */

import { readFile, writeFile, mkdtemp, cp } from 'fs/promises';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { createHash } from 'crypto';

// 敏感信息匹配规则
const SENSITIVE_PATTERNS = [
  // API Keys — 通用格式
  { name: 'api_key', pattern: /["']?(?:api[_-]?key|apikey)["']?\s*[:=]\s*["']([a-zA-Z0-9\-_]{16,})["']/gi, group: 1 },

  // Bearer tokens
  { name: 'bearer_token', pattern: /Bearer\s+([a-zA-Z0-9\-_\.]{20,})/gi, group: 1 },

  // OpenAI API keys
  { name: 'openai_key', pattern: /sk-[a-zA-Z0-9]{32,}/g, group: 0 },

  // Anthropic API keys
  { name: 'anthropic_key', pattern: /sk-ant-[a-zA-Z0-9\-]{32,}/g, group: 0 },

  // Generic secret/token/password in JSON
  { name: 'json_secret', pattern: /["'](?:secret|token|password|passwd|api_key|apiKey|access_key|private_key)["']\s*:\s*["']([^"']{8,})["']/gi, group: 1 },

  // Private keys (PEM)
  { name: 'private_key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, group: 0 },

  // Webhook URLs (often contain tokens)
  { name: 'webhook_url', pattern: /https?:\/\/[^\s"']*(?:webhook|hook|notify)[^\s"']*/gi, group: 0 },

  // UUID-like tokens in URLs
  { name: 'url_token', pattern: /["'](?:token|key)["']\s*:\s*["']([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})["']/gi, group: 1 },

  // AWS keys
  { name: 'aws_key', pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g, group: 0 },

  // 通用长密钥字符串 (在 apiKey / token 等字段值中)
  { name: 'generic_key_value', pattern: /["']apiKey["']\s*:\s*["']([a-zA-Z0-9\-_]{20,})["']/gi, group: 1 },
];

// 不应脱敏的目录/文件模式
const SKIP_PATTERNS = [
  /node_modules/,
  /\.git\//,
  /\.sqlite$/,
];

/**
 * 对 manifest 中列出的文件进行脱敏处理
 * 返回新的 manifest（指向脱敏后的临时目录）
 */
export async function sanitize(manifest) {
  const sanitizedManifest = JSON.parse(JSON.stringify(manifest));
  let redactedCount = 0;

  // 创建临时目录存放脱敏后的文件
  const tempDir = await mkdtemp(join(tmpdir(), 'clawmem-'));
  sanitizedManifest._tempDir = tempDir;

  // 遍历所有分类的文件
  for (const category of Object.keys(sanitizedManifest.files)) {
    for (const fileEntry of sanitizedManifest.files[category]) {
      const shouldSkip = SKIP_PATTERNS.some(p => p.test(fileEntry.path));
      if (shouldSkip) continue;

      // 只处理文本文件
      if (isBinaryPath(fileEntry.path)) continue;

      try {
        const fullPath = join(manifest._sourceDir || `${process.env.HOME}/.openclaw`, fileEntry.path);
        let content = await readFile(fullPath, 'utf-8');
        let modified = false;

        for (const rule of SENSITIVE_PATTERNS) {
          const matches = content.matchAll(new RegExp(rule.pattern));
          for (const match of matches) {
            const sensitiveValue = rule.group === 0 ? match[0] : match[rule.group];
            if (sensitiveValue && sensitiveValue.length >= 8) {
              const redacted = redactValue(sensitiveValue, rule.name);
              content = content.replaceAll(sensitiveValue, redacted);
              redactedCount++;
              modified = true;
            }
          }
        }

        if (modified) {
          // 写脱敏后的文件到临时目录
          const targetPath = join(tempDir, fileEntry.path);
          const targetDir = dirname(targetPath);
          await mkdirRecursive(targetDir);
          await writeFile(targetPath, content, 'utf-8');
          fileEntry._sanitized = true;
          fileEntry._tempPath = targetPath;
        }
      } catch {
        // 无法读取的文件跳过
      }
    }
  }

  sanitizedManifest.redactedCount = redactedCount;

  // 生成校验和
  const manifestJson = JSON.stringify(sanitizedManifest, null, 2);
  sanitizedManifest.checksum = createHash('sha256').update(manifestJson).digest('hex').slice(0, 16);

  return sanitizedManifest;
}

/**
 * 脱敏一个敏感值
 * 保留前4位和后4位，中间用 [REDACTED] 替换
 */
function redactValue(value, ruleName) {
  if (value.length <= 12) {
    return `[REDACTED:${ruleName}]`;
  }
  const prefix = value.slice(0, 4);
  const suffix = value.slice(-4);
  return `${prefix}...[REDACTED:${ruleName}]...${suffix}`;
}

function isBinaryPath(filePath) {
  const binaryExtensions = ['.sqlite', '.db', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp3', '.mp4', '.wav', '.zip', '.tar', '.gz'];
  return binaryExtensions.some(ext => filePath.endsWith(ext));
}

async function mkdirRecursive(dir) {
  const { mkdir } = await import('fs/promises');
  await mkdir(dir, { recursive: true });
}
