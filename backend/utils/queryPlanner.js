const { classifyEntity } = require("./entityClassifier");
const { metricDictionary } = require("./metricDictionary");
const { benchmarkDictionary } = require("./benchmarkDictionary");
const { createLLM } = require("./createLLM");
const { ChatOpenAI } = require("@langchain/openai");
const {HumanMessage,SystemMessage,} = require("@langchain/core/messages");
const {getDataProfile} = require("./dataProfiler");

async function planQuery(question, schemaText,model = "gpt-5-mini") {
  const entityType = classifyEntity(question);
  const profile =  await getDataProfile();
  const lowerQuestion =  question.toLowerCase();

  let suggestedThreshold = null;

  if (
    lowerQuestion.includes("technology") ||
    lowerQuestion.includes("it")
  ) {

    const tech =
      profile.sectorStats.find(
        s =>
          s.sector.toLowerCase() ===
          "technology"
      );

    if (tech) {

      suggestedThreshold =
        Math.round(tech.avg_weight);

    }
  }

  const maxAUM = profile.maxAUM;
  const disableAUMFilters = maxAUM < 1000;
  if (maxAUM < 1000) { disableAUMFilters = true;}

  const llm = createLLM(model);
  const res = await llm.invoke([
    new SystemMessage(`
You are a financial analytics planner.

Your job is to determine:

1. Which metric best answers the question
2. Which supporting columns should be shown
3. Which tables are required
4. What business logic should be applied

RULES:
- Prefer business metrics over raw transaction sums
- For performance:
  prefer cagr, sharpe_ratio, risk_adjusted_return
- For risk:
  prefer risk
- For diversification:
  prefer diversification_score

Return ONLY valid JSON.

CONFIDENCE RULES:
- 0.9 to 1.0 = very clear analytical intent
- 0.7 to 0.89 = likely correct metric
- below 0.7 = ambiguous query, may require follow-up questions

COUNTRY-FOCUSED RULES:

Questions like:
- Korea-focused
- US-focused
- Europe-focused

refer to:
portfolio exposure

NOT:
fund domicile country.

Prefer:
country_exposure_view
over:
funds.country

ENTITY RULES:

- "best performing portfolio/fund"
  means ranking should happen on fund performance metrics

- investor may be the display entity
  while fund is the ranking entity

- NEVER invent custom financial ratios
  unless explicitly requested

- Use existing metrics from schema:
  cagr
  sharpe_ratio
  risk_adjusted_return

- Do NOT calculate risk-adjusted return manually

HIGH RECALL RULES:

Prefer returning relevant rows
over institutional screening.

TOP/BEST/HIGHEST queries mean:
simple ranking queries.

Do NOT infer:
- minimum AUM
- minimum history
- minimum exposure
- institutional investability
- benchmark overlap validation

unless explicitly requested.

Use:
WHERE metric IS NOT NULL
instead of restrictive filters.

Avoid:
- HAVING exposure >= X
- inception date filters
- interval alignment
- complex benchmark period logic
- nested benchmark reconstruction

Suggested sector exposure threshold:
${suggestedThreshold || "none"}

Only use thresholds
when explicitly requested
or absolutely necessary.

DATASET SCALE:

Maximum AUM in dataset:
${maxAUM}

If dataset values are small/demo-scale:

Do NOT generate:
- institutional thresholds
- large numeric filters
- AUM minimums

Benchmark comparison rules:

Use:
latest available benchmark row.

Compare:
fund cagr
vs
benchmark return_pct.

Avoid:
- benchmark window reconstruction
- overlapping history checks
- interval validation
- fallback benchmark periods

unless explicitly requested.

Return ONLY valid JSON.
No markdown.
No SQL.
No comments.
No explanations outside JSON.

FORMAT:
{
  "metric": "...",
  "reason": "...",

  "ranking_entity": "...",
  "display_entity": "...",

  "supporting_columns": [],
  "required_tables": [],

  "ownership_logic": "...",
  "business_logic": "...",

  "confidence": 0.0,

  "comparison_required": false,
  "comparison_metric": "...",
  "comparison_entity": "...",
  "comparison_display_columns": [],
  "delta_column": "..."
}
    `),

    // new HumanMessage(question)
    new HumanMessage(`USER QUESTION:${question} ENTITY TYPE: ${entityType}`)

  ],
  {
    response_format: {
      type: "json_object"
    }
  }
);

// SUGGESTED THRESHOLD:
// ${suggestedThreshold || "none"}

// Use realistic thresholds based on actual data distributions.
// Avoid impossible filters.

//   return JSON.parse(res.content);
const raw =
  typeof res.content === "string"
    ? res.content
    : JSON.stringify(res.content);

const cleaned = raw.trim();
const plan =  JSON.parse(cleaned);

// const plan = JSON.parse(res.content);
plan.entity_type = classifyEntity(question);

// const lowerQuestion = question.toLowerCase();

for (const [key, benchmark] of Object.entries(benchmarkDictionary)) {

  if (lowerQuestion.includes(key)) {

    plan.benchmark = benchmark.benchmark_name;

    plan.benchmark_table = benchmark.table;

    plan.benchmark_metric_column =
      benchmark.metric_column;

    if (!plan.required_tables.includes(benchmark.table)) {
      plan.required_tables.push(benchmark.table);
    }

    break;
  }
}

if (metricDictionary[plan.metric]) {

  const metricInfo = metricDictionary[plan.metric];

  plan.metric_table = metricInfo.table;

  plan.supporting_columns = [
    ...new Set([
      ...(plan.supporting_columns || []),
      ...metricInfo.supporting_columns
    ])
  ];

  if (!plan.required_tables.includes(metricInfo.table)) {
    plan.required_tables.push(metricInfo.table);
  }
}

if (plan.benchmark) {

  plan.comparison_required = true;

  plan.comparison_metric =
    plan.metric;

  plan.comparison_entity =
    plan.benchmark;

  plan.comparison_display_columns = [
    "fund_metric",
    "benchmark_metric",
    "excess_return"
  ];

  plan.delta_column = "excess_return";
}
plan.disable_aum_filters = disableAUMFilters;
plan.max_aum = maxAUM;
plan.simple_ranking_query = /(top|best|highest|leading)/i.test(question);
plan.benchmark_query = !!plan.benchmark;

return plan;
}

module.exports = { planQuery };