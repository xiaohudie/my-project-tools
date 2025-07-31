import simpleGit from 'simple-git';
import { Buffer } from 'buffer';
import config from '../ai-cr.config.js';

const git = simpleGit();

// 判断文件是否被 ignore
function isIgnored(file) {
  // 默认增强 ignore 规则（无论用户配置）
  const defaultIgnore = [
    'node_modules', 'dist', 'build', 'coverage', 'out',
    '*.md', '*.lock', '*.log', '*.test.*', '*.spec.*', '*.snap',
    '*.png', '*.jpg', '*.jpeg', '*.gif', '*.svg', '*.ico',
    '*.mp4', '*.mp3', '*.zip', '*.tar', '*.gz', '*.7z',
    '*.exe', '*.dll', '*.so', '*.bin', '*.pdf', '*.docx', '*.xlsx',
    '.git', '.DS_Store', '.env', 'ai-cr.config.js',
  ];
  const allIgnore = (config.ignore || []).concat(defaultIgnore);
  return allIgnore.some(pattern => {
    if (pattern.endsWith('/')) {
      // 忽略目录
      return file.startsWith(pattern.replace(/\/$/, ''));
    } else if (pattern.startsWith('*.')) {
      // 忽略扩展名
      return file.endsWith(pattern.slice(1));
    } else if (pattern.includes('*')) {
      // 通配符简单处理
      const re = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
      return re.test(file);
    } else {
      return file === pattern;
    }
  });
}

// 按最大字节数分块 diff，默认 6000 字节
export async function getStagedDiffChunks(maxBytes = 6000) {
  const git = simpleGit();
  const diff = await git.diff(['--cached', '--unified=0']);
  // 以每个文件为单位分块
  const fileDiffs = diff.split(/^diff --git /m).filter(Boolean);
  let chunks = [];
  for (const fileDiff of fileDiffs) {
    // 检查是否为二进制
    if (/Binary files /.test(fileDiff)) continue;
    // 获取文件名
    const match = fileDiff.match(/^a\/(.*?) b\//);
    const file = match ? match[1] : 'unknown';
    // 过滤 ignore
    if (isIgnored(file)) continue;
    // 按分块大小切分
    if (Buffer.byteLength(fileDiff, 'utf8') > maxBytes) {
      for (let i = 0; i < fileDiff.length; i += maxBytes) {
        chunks.push(fileDiff.slice(i, i + maxBytes));
      }
    } else {
      chunks.push(fileDiff);
    }
  }
  return chunks;
}

async function getStagedDiff() {
  const git = simpleGit();
  try {
    const diff = await git.diff(['--cached']);
    return diff.trim();
  } catch (err) {
    throw new Error('获取 Git 暂存区变更失败: ' + err.message);
  }
}

export { getStagedDiff, getStagedDiffChunks };

