const { businessRules } = require("./businessRules");

function enhanceQuestion(question) {

  const q = question.toLowerCase();

  for (const [key, rule] of Object.entries(businessRules)) {

    if (q.includes(key)) {

      return `
User Question:
${question}

ANALYTICAL CONTEXT:
- Best performance metric = ${rule.metric}
- Use table = ${rule.table}
- Include supporting columns = ${rule.supportingColumns.join(", ")}
- Ranking order = ${rule.order}

IMPORTANT:
Always include:
- investor_name
- fund_name
- ranking metric
- supporting metrics
      `;
    }
  }

  return question;
}

module.exports = { enhanceQuestion };