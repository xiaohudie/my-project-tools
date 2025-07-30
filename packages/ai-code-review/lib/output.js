// 输出 AI 审查问题列表，支持分色高亮、字段容错
function formatAndPrintIssues(issues) {
  if (!Array.isArray(issues) || issues.length === 0) {
    console.log('✅ 没有发现严重问题，提交通过！');
    return;
  }
  console.log(`🚨 AI 审查发现 ${issues.length} 个问题：\n`);
  issues.forEach((issue, i) => {
    const file = issue.file ?? 'unknown';
    const line = issue.line ?? '-';
    const severity = issue.severity ?? 'info';
    const description = issue.issue ?? JSON.stringify(issue);
    const suggestion = issue.suggestion ?? '-';
    let colorStart = '';
    let colorEnd = '\x1b[0m';
    if (severity === 'high') colorStart = '\x1b[31m'; // 红
    else if (severity === 'medium') colorStart = '\x1b[33m'; // 黄
    else if (severity === 'low') colorStart = '\x1b[90m'; // 灰
    else colorStart = '';
    console.log(`${colorStart}${i+1}. [${severity}] ${file}:${line}${colorEnd}`);
    console.log(`${colorStart}   ${description}${colorEnd}`);
    console.log(`${colorStart}   💡 建议: ${suggestion}\n${colorEnd}`);
  });
  console.log('❌ 建议修复问题后再提交。');
}

export { formatAndPrintIssues };
