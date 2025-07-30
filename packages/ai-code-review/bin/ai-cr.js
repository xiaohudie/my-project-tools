#!/usr/bin/env node

import 'dotenv/config';
import { reviewStagedFiles } from '../lib/ty-ai.js';

// 确保脚本可执行：chmod +x bin/ai-cr.js

async function main() {
  if (process.env.AI_CR_SKIP === '1' || process.argv.includes('--no-verify')) {
    console.log('⚠️ 跳过 AI 代码审查（检测到跳过参数）');
    process.exit(0);
  }
  console.log('🔍 正在检查暂存区代码变更...');
  try {
    const issues = await reviewStagedFiles();
    if (!Array.isArray(issues)) {
      console.error('❌ AI 返回内容非数组，实际为：', typeof issues, issues);
      process.exit(1);
    }
    if (issues.length === 0) {
      console.log('✅ 没有发现严重问题，提交通过！');
      process.exit(0);
    } else {
      console.log(`🚨 AI 审查发现 ${issues.length} 个问题：\n`);
      // 使用 output.js 的 formatAndPrintIssues 输出
      const { formatAndPrintIssues } = await import('../lib/output.js');
      formatAndPrintIssues(issues);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ 审查失败:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}


main();