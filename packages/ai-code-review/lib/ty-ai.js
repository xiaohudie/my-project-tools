import { getStagedDiff, getStagedDiffChunks } from './git.js';
import { buildReviewPrompt } from './prompt.js';
import OpenAI from "openai";
import dotenv from 'dotenv';
import config from '../ai-cr.config.js';
dotenv.config();

// 动态选择 provider 和 apiKey
const provider = config.provider || process.env.AI_CR_PROVIDER || 'qwen';
const apiKey = config.apiKey || process.env.QWEN_API_KEY || '';

const baseURL = provider === 'qwen' ? 'https://dashscope.aliyuncs.com/compatible-mode/v1' : 'https://api.openai.com/v1';
const openai = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL
});

// AI 调用重试机制，指数退避
async function callQwenWithRetry(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await callQwen(prompt);
    } catch (e) {
      console.warn(`AI 调用失败，第${i+1}次重试...`, e.message);
      await new Promise(res => setTimeout(res, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('AI 服务多次调用失败');
}

// AI 单次调用并解析 JSON
async function callQwen(prompt) {
  const completion = await openai.chat.completions.create({
    model: "qwen-plus",
    messages: [
      { role: 'user', content: prompt }
    ],
  });
  let text = completion.choices[0].message.content;
  text = text.replace(/^\s*```json\s*/i, '').replace(/^\s*```/, '').replace(/```$/, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('AI 返回非 JSON:', text, e);
    return [{ file: 'unknown', line: 0, issue: 'AI 返回格式异常', severity: 'low', suggestion: text }];
  }
}

// 合并分块 diff 的 AI 审查结果，校验结构
async function reviewStagedFiles() {
  // 跳过机制
  if (process.env.AI_CR_SKIP === '1' || process.argv.includes('--no-verify')) {
    console.log('⚠️ 跳过 AI 代码审查（检测到跳过参数）');
    return [];
  }
  const diffChunks = await getStagedDiffChunks();
  if (!diffChunks.length) {
    console.log('📦 没有暂存的代码变更。');
    return [];
  }
  let allIssues = [];
  for (const diff of diffChunks) {
    const prompt = buildReviewPrompt(diff);
    try {
      const issues = await callQwenWithRetry(prompt);
      if (Array.isArray(issues)) {
        // 校验每个对象结构
        issues.forEach(issue => {
          if (!issue.file || typeof issue.line === 'undefined' || !issue.issue) {
            console.warn('AI 返回内容字段缺失:', issue);
          }
        });
        allIssues = allIssues.concat(issues);
      } else {
        console.warn('AI 返回内容非数组:', issues);
      }
    } catch (e) {
      console.error('AI 审查失败:', e);
      allIssues.push({ file: 'unknown', line: 0, issue: 'AI 服务调用失败', severity: 'high', suggestion: e.message });
    }
  }
  return allIssues;
}

export { reviewStagedFiles };