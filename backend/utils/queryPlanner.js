const { classifyEntity } = require("./entityClassifier");
const { metricDictionary } = require("./metricDictionary");
const { benchmarkDictionary } = require("./benchmarkDictionary");
const { createLLM } = require("./createLLM");
const { ChatOpenAI } = require("@langchain/openai");
const {HumanMessage,SystemMessage,} = require("@langchain/core/messages");
const {getDataProfile} = require("./dataProfiler");

async function planQuery(question, schemaText,model = "gpt-4o-mini") {
  const entityType = classifyEntity(question);
  const profile =  await getDataProfile();
  const sectorContext =  profile.sectorStats
    .map(s =>
      `${s.sector}:
       max=${s.max_weight}%,
       avg=${s.avg_weight}%`

    )
    .join("\n");

  const llm = createLLM(model);
  const res = await llm.invoke([
    new SystemMessage(`
You are a financial analytics planner.

Your job is to determine:

1. Which metric best answers the question
2. Which supporting columns should be shown
3. Which tables are required
4. What business logic should be applied

DATABASE SCHEMA:
${schemaText}

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

MINIMAL TABLE RULE:
Only join tables necessary to answer the question.
Avoid unnecessary joins.

EXAMPLES:

Question:
Compare Disney Limited buy vs sell transactions

ENTITY TYPE:
investor

Correct SQL pattern:

SELECT
  it.txn_type,
  SUM(it.amount)
FROM investors i
JOIN investor_transactions it
  ON i.investor_id = it.investor_id
WHERE i.investor_name ILIKE '%Disney Limited%'
GROUP BY it.txn_type

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


COUNTRY NORMALIZATION RULES:

Use exact country values from database.

Example:
- USA
NOT:
- United States
- US

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

ENTITY MATCHING RULES:
- Never use exact equality for fund names unless full name is provided
- Prefer fuzzy matching:
  ILIKE '%name%'
- For partial names:
  use wildcard matching
- If multiple funds match:
  return the best matches OR use most recent/highest AUM

ENTITY RESOLUTION RULES:

If entity_type = investor:
- use investors
- use investor_transactions

If entity_type = fund:
- use funds
- use holdings
- use fund metrics

If entity_type = benchmark:
- use benchmarks
- use benchmark_performance_view

Asset names must use:
- holdings
- asset_country_map

- investors.investor_name = investor entities
- funds.fund_name = fund entities
- holdings.asset_name = asset/security entities
- benchmark_comparison_view.benchmark_name = benchmarks

Never search investor names in funds.fund_name.
Never search investor names in holdings.asset_name.
Never assume named entities are funds.

STRICT ENTITY ENFORCEMENT:

If ENTITY TYPE = investor:
- NEVER filter using:
  funds.fund_name
  holdings.asset_name

- ALWAYS filter using:
  investors.investor_name

- NEVER join funds unless explicitly required by question

Examples:
Question:
"Disney Limited buy vs sell transactions"

CORRECT:
WHERE investors.investor_name ILIKE '%Disney Limited%'

WRONG:
WHERE funds.fund_name ILIKE '%Disney Limited%'

AMBIGUITY RULES:

If the user says:
- top funds
- best funds
- leading funds

WITHOUT specifying a metric:

THEN:
- prefer simple ranking
- use existing analytical views
- avoid complex calculations
- avoid restrictive filters
- prefer:
  fund_master_metrics.cagr

Do NOT:
- reconstruct returns from nav_history
- require long history windows
- require benchmark comparisons
unless explicitly requested

DEFAULT FUND RANKING:
If no metric specified:
1. Use cagr
2. Fallback to risk_adjusted_return
3. Use fund_master_metrics
4. Return top rows directly

COMPLEXITY RULES:
- Simple question → simple SQL
- Avoid CTEs unless necessary
- Avoid lateral joins unless necessary
- Avoid reconstructing metrics if analytical views already exist

DATA PROFILE:
${sectorContext}

Use realistic thresholds based on actual data distributions.
Avoid impossible filters.

METRIC LOCATION RULES:

sharpe_ratio:
- comes from fund_sharpe_view

cagr:
- comes from fund_master_metrics

risk_adjusted_return:
- comes from fund_master_metrics

EXPOSURE RULES:

- Market exposure, country exposure, sector exposure, and geographic exposure
- MUST be calculated from:
  - holdings
  - asset_country_map
  - sector_exposure_view
  - country_exposure_view
- Never use funds.country for portfolio exposure analysis.
- funds.country represents fund domicile only.

SECTOR EXPOSURE RULES:

Questions about:
- IT exposure
- Technology exposure
- Energy exposure
- Financial exposure
- sector allocation
- market exposure

MUST use:
- sector_exposure_view
- holdings.sector

Never use:
- diversification_score
- concentration_index

Technology sector is equivalent to IT sector.

EXPOSURE THRESHOLD RULES:

Do NOT assume arbitrary thresholds like:
- 50%
- 70%
- 80%

for sector exposure queries.

Typical realistic sector exposure ranges:
- 10% to 30%

For queries like:
- heavily invested
- technology-focused
- concentrated in
- high exposure

prefer:
ORDER BY exposure DESC
LIMIT 10

instead of hardcoded thresholds.

PERFORMANCE QUERY RULES:

Questions containing:
- best performing
- top performing
- highest return
- strongest performance

MUST rank using:
- cagr
- risk_adjusted_return
- sharpe_ratio

NOT:
- exposure
- diversification
- concentration

TRANSACTION RULES:

- Use actual txn_type values from schema examples
- Do not invent transaction types
- If txn_type vocabulary is unknown:
  calculate:
    SUM(amount)
  directly
  instead of filtering by txn_type

SECTOR MATCHING RULES:

- Never use:
  ILIKE '%it%'

- "IT" sector should map to:
  - Information Technology
  - Technology
  - Tech
  - IT Services
  - Software

- Prefer exact semantic sector mapping
- Avoid ambiguous short keyword matching

SECTOR THRESHOLD RULES:

- "heavily invested" defaults to:
  15%

- only use:
  30%+
if user explicitly says:
  highly concentrated

COMPARISON RULES:

If query compares against:
- benchmark
- index
- sector average
- another fund

THEN ALWAYS:
- include comparison metric in output
- include benchmark metric in output
- include delta/excess return column
- expose WHY entity outperformed

When comparing two entities:
- never compare an entity against itself
- use one entity as baseline
- delta metrics should compare across entities

Incorrect:
fund.cagr - same_fund.cagr

Correct:
fund_a.cagr - fund_b.cagr

RISK EXPOSURE RULES:

For investor exposure/risk questions:
- use investors
- use investor_transactions
- use country_exposure_view
- aggregate exposure by country

BENCHMARK RULES:

Benchmarks come from:
- benchmarks
- benchmark_performance_view

Never search benchmarks inside:
- funds
- fund_master_metrics

BENCHMARK PERFORMANCE RULES:

Benchmark returns MUST come from:
- benchmark_performance_view.return_pct

Never assume benchmark metric = 0.
Never derive benchmark return from fund tables.


METRIC NORMALIZATION RULES:
- CAGR values are percentages
- Exposure values are percentages
- Excess return values are percentages
- Do not mix decimal returns with percentage returns

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

  "confidence": 0.0

  "comparison_required": false,
  "comparison_metric": "...",
  "comparison_entity": "...",
  "comparison_display_columns": [],
  "delta_column": "..."
}
    `),

    // new HumanMessage(question)
    new HumanMessage(`USER QUESTION:${question} ENTITY TYPE: ${entityType}`)

  ]);

//   return JSON.parse(res.content);
const plan = JSON.parse(res.content);
plan.entity_type = classifyEntity(question);

const lowerQuestion = question.toLowerCase();

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

return plan;
}

module.exports = { planQuery };