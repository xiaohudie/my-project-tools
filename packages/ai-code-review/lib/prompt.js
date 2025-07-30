import config from '../ai-cr.config.js';
const MAX_DIFF_LENGTH = 5000;

function buildReviewPrompt(diff) {
  // diff 超长时截断
  let safeDiff = diff;
  if (diff.length > MAX_DIFF_LENGTH) {
    safeDiff = diff.slice(0, MAX_DIFF_LENGTH) + '\n...（已截断，diff 过长）';
  }
  // 优先使用自定义模板
  if (config.promptTemplate && typeof config.promptTemplate === 'string' && config.promptTemplate.trim()) {
    return config.promptTemplate.replace('${diff}', safeDiff);
  }
  // 根据 strictness 配置调整要求
  let strictText = '';
  if (config.strictness === 'high') {
    strictText = '请严格审查所有潜在问题，包括安全、性能、边界条件、风格一致性等，任何疑点都要提示。';
  } else if (config.strictness === 'low') {
    strictText = '只需关注明显 bug 或高危问题，风格和小问题可忽略。';
  } else {
    strictText = '请兼顾安全、性能、可读性、最佳实践和风格一致性。';
  }
  return `你是一位资深前端工程师，正在审查代码提交。${strictText}请只分析以下 Git diff 变更部分，指出潜在问题，并严格以 JSON 数组输出：\n\n输出要求：\n- 以 JSON 数组格式返回，每个对象包含：\n  - "file": 文件名\n  - "line": 行号（或范围）\n  - "issue": 问题描述\n  - "severity": 严重性（"high"/"medium"/"low"）\n  - "suggestion": 改进建议\n- 如果没有发现明显问题，返回空数组 []。\n- 不要添加额外解释。\n\n代码变更：\n\n\`\`\`diff\n${safeDiff}\n\`\`\``;
}

export { buildReviewPrompt };