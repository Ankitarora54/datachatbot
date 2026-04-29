const OpenAI = require("openai");
const { getSchema } = require("./schema");
const { formatSchema } = require("./formatSchema");
const { loadSchema } = require("./utils/schemaLoader");
const { ChatOpenAI } = require("@langchain/openai");

const {HumanMessage,SystemMessage,} = require("@langchain/core/messages");
const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY,});
const llm = new ChatOpenAI({model: "gpt-4o-mini",temperature: 0,apiKey: process.env.OPENAI_API_KEY,});
async function generateSQL(userQuery, history = []) {
  const schema = await getSchema();
  // const schemaRaw = await loadSchema();
  const schemaText = formatSchema(schema);

  const messages = [ new SystemMessage(`
    You are a SQL Server expert.

      content:
      DATABASE SCHEMA:
      ${schemaText}

      Relationships:
      - fund_aum.fund_id → funds.fund_id
      - nav_history.fund_id → funds.fund_id
      - transactions.fund_id → funds.fund_id
      - investor_transactions.fund_id → funds.fund_id
      - investor_transactions.investor_id → investors.investor_id
      - holdings.fund_id → funds.fund_id
      - investors.investor_id → investor_transactions.investor_id
        → investor_transaction using investor_id
      - investor_transaction
        → funds using fund_id
      - funds
          → holdings using fund_id
      If user asks about an investor:
        - ALWAYS use investor and investor_transaction tables
        - NEVER search investor names inside holdings.asset_name

      TABLES:
      - asset_country_map(asset_name, country)
      - benchmarks(benchmark_id, value, date, name)
      - fund_aum(aum_id, fund_id, aum, report_date)
      - fund_master_metrics(fund_id, fund_name, net_flow, avg_nav, risk, risk_adjusted_return, total_assets, concentration_index, diversification_score, cagr)
      - fund_performance(fund_name, start_nav, end_nav, days, cagr, volatility)
      - fund_risk_metrics(fund_id, fund_name, net_flow, avg_nav, risk, risk_adjusted_return)
      - funds(fund_id, fund_name, country, inception_date)
      - holdings(holding_id, fund_id, asset_name, sector, weight, report_date)
      - investor_transactions(txn_id, fund_id, txn_type, amount, txn_date, inv_txn_id, investor_id,units)
      - investors(investor_id, investor_name, country, investor_type)
      - nav_history(nav_id, fund_id, nav_value, report_date)
      - stock_prices(price_id, asset_name, price, price_date)
      - transactions(txn_id, fund_id, txn_type, amount, txn_date)

      VIEWS:
      - benchmark_comparison_view(benchmark_name, cagr)
      - country_exposure_view(fund_id, country, country_exposure)
      - fund_diversification_view(fund_id, fund_name, total_assets, concentration_index, diversification_score)
      - fund_performance_view(fund_id, cagr)
      - fund_risk_metrics_view(fund_id, fund_name, net_flow, avg_nav, risk, risk_adjusted_return)
      - fund_sharpe_view(fund_id, fund_name, cagr, risk, sharpe_ratio)
      - sector_exposure_view(fund_id, fund_name, sector, sector_weight, weight)
      - sector_summary_view(fund_id, fund_name, sector, sector_weight)

      STRICT RULES:
      - Use PostgreSQL syntax ONLY
      - DO NOT use OFFSET FETCH (Postgres uses LIMIT)
      - Never use FETCH NEXT
      - Never use OFFSET ROWS
      - Never use SQL Server syntax
      - JOIN clauses must come before WHERE
      - NEVER use:
        TOP, GETDATE(), ISNULL, NVARCHAR
      - ALWAYS use:
        LIMIT instead of TOP
        NOW() instead of GETDATE()
        COALESCE instead of ISNULL
      - Return ONLY valid JSON
      - Do NOT use code blocks (no \`\`\`)
      - Do NOT use string concatenation (+)
      - SQL must be a single string
      - Always use proper JOINs using these relationships
      - Use SIMPLE SQL only
      - Avoid CTEs unless necessary
      - Do NOT use advanced functions like STDDEV_P
      - Prefer STDEV for SQL Server
      - Avoid nested CTE chains
      - Avoid hallucinating columns or tables

      IMPORTANT:
      - Use exact column names from schema
      - Use LIKE '%keyword%' instead of exact match for fund_name
      - Do NOT assume exact names
      - DO NOT invent column names
      - Prefer fund_master_metrics for analytics
      - Use consistent table aliases
      - If alias is "nav", NEVER use "n"
      - NEVER join large tables directly
      - ALWAYS aggregate before joining
      - If fund_risk_metrics exists, ALWAYS use it
      - DO NOT recompute risk manually
      - fund_risk_metrics already contains:
          net_flow, avg_nav, risk, risk_adjusted_return
      - ALWAYS use risk_adjusted_return directly
      - DO NOT recompute it
      - DO NOT join nav_history and transactions together
      - NEVER use = (SELECT ...)
      - Use JOIN or IN instead
      - Use OFFSET FETCH only if needed
      - DO NOT recompute metrics manually
      - Prefer simple SELECT queries from views
      - Column mappings:
      fund_risk_metrics:
        - risk
        - avg_nav
        - risk_adjusted_return
      fund_diversification_view:
        - diversification_score
        - concentration_index
        - total_assets
      - NEVER use columns from one view in another
      - If query needs both risk AND diversification:
        JOIN fund_risk_metrics AND fund_diversification_view on fund_id
      - Use fund_master_metrics whenever possible
      - fund_master_metrics already contains:
        risk, diversification_score, risk_adjusted_return
      - ALWAYS prefer fund_master_metrics over joining multiple tables
        diversification_score, concentration_index, total_assets
      - DO NOT join fund_risk_metrics or fund_diversification_view if fund_master_metrics can be used
      sector_exposure_view columns:
        - fund_id
        - fund_name
        - sector
        - sector_weight
      DO NOT use:
        - weight
        - exposure_weight
      ALWAYS use: sector_weight
        - sector_weight is stored as percentage (0–100)
        - NOT decimal (0–1)
        - Use 40 instead of 0.4 for 40%
      - sector_weight exists ONLY in sector_exposure_view
      - holdings has ONLY weight (not sector_weight)
      - asset_country_map joins via asset_name, not fund_id
      - Sector names are full names (e.g., "Information Technology")
      - DO NOT use abbreviations like "IT"
      - Use LIKE '%Technology%' if unsure
      - Technology, Healthcare, Energy, Financials are sectors
        - Do NOT search them inside holdings.asset_name
        - Use sector_exposure_view for sector-related questions
      - fund_master_metrics contains:
        risk, diversification_score, risk_adjusted_return, cagr
      - ALWAYS use fund_master_metrics for performance queries
      - benchmark_comparison_view does NOT have fund_id
      - NEVER join it using fund_id
      - Use CROSS JOIN when comparing funds with benchmarks
      - benchmark_comparison_view has ONLY:
        benchmark_name, cagr
      - NEVER create columns like:
        s_and_p_500_cagr, benchmark_cagr
      - Always filter using:
        benchmark_name = 'S&P 500'
      - Do NOT assume funds outperform benchmarks
      - If strict comparison returns no data:
        → fallback to ORDER BY instead of filtering
      - concentration_index is stored between 0 and 1
      - DO NOT use values like > 10
      - Use decimal thresholds like > 0.10
      - holdings table columns:
        asset_name, sector, weight, fund_id, report_date
      - DO NOT use:
        holding_name, holding_value, value
      - Use:
        asset_name (for name)
        weight (for value)
      - holdings has column: weight (NOT sector_weight)
      - sector_exposure_view already contains sector_weight
      - NEVER join holdings with sector_exposure_view on sector
      - Use either holdings OR sector_exposure_view, not both
      - country exposure is derived using asset_country_map
      - JOIN:
        holdings → asset_country_map → country
      - DO NOT use country from sector_exposure_view
      - benchmark_name values may vary (e.g., 'NIFTY 50')
      - ALWAYS use LIKE '%NIFTY%' instead of '='
      - NEVER use CROSS JOIN unless explicitly required
      - benchmark_comparison_view has columns: benchmark_name, cagr
      - benchmark_comparison_view has NO fund_id
      - benchmark is global (not per fund)
      - DO NOT join benchmark using fund_id
      - Use:
        JOIN benchmark_comparison_view b 
        ON b.benchmark_name LIKE '%NIFTY%'
      - sharpe_ratio exists in fund_sharpe_view (NOT in fund_master_metrics)
      - use:
        JOIN fund_sharpe_view s ON f.fund_id = s.fund_id
      - To answer investor-related questions, ALWAYS use investor and investor_transaction tables
        - Use JOIN with funds to get fund_name
        - Use CASE WHEN for BUY/SELL calculations


      Examples:
      User: safest and most diversified fund
      Correct SQL:
      SELECT TOP 1 
        f.fund_name,
        r.risk,
        d.diversification_score
      FROM funds f
      JOIN fund_risk_metrics r ON f.fund_id = r.fund_id
      JOIN fund_diversification_view d ON f.fund_id = d.fund_id
      ORDER BY r.risk ASC, d.diversification_score DESC

      User: What holdings does Disney Limited have?
      Correct SQL:
      SELECT
          i.investor_name,
          f.fund_name,
          h.asset_name,
          h.weight
      FROM investor i
      JOIN investor_transaction it
          ON i.investor_id = it.investor_id
      JOIN funds f
          ON it.fund_id = f.fund_id
      JOIN holdings h
          ON f.fund_id = h.fund_id
      WHERE i.investor_name LIKE '%Disney%'

      INSIGHT RULES:
      - Compare fund CAGR vs benchmark
      - Identify outperforming and underperforming funds
      - Detect sector concentration risk
      - Highlight anomalies
      - Highlight top performers
      - Identify risk (high volatility, low diversification)
      - Detect concentration (sector > 20%)
      - Compare vs benchmark
      - Use simple business language

      Format EXACTLY:
      {
        "sql": "SELECT ...",
        "explanation": "...",
        "insight": "..."
      }

      Return JSON:
      {
      "sql": "...",
      "explanation": "..."
      }
          `),
          ...history.map(
            (h) =>
              new HumanMessage(
                typeof h.content === "string"
                  ? h.content
                  : JSON.stringify(h.content)
              )
  ),
  new HumanMessage(userQuery),
];

const res = await llm.invoke(messages, {
  metadata: {module: "sql_generation",feature: "fundchatbot",},
});
      
    // const raw = res.choices[0].message.content;
    const raw = res.content;

    console.log("AI RAW RESPONSE:", raw);

    // 🧹 Clean markdown
    let cleaned = raw
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

    // 🧠 Case 1: JSON response
    if (cleaned.startsWith("{")) {
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error("❌ JSON parse failed:", cleaned);
        throw new Error("Invalid JSON from AI");
    }
    }

    // 🧠 Case 2: Raw SQL response
    if (cleaned.toLowerCase().startsWith("select")) {
    return {
        sql: cleaned,
        explanation: "Generated SQL query based on your request.",
    };
    }

    // ❌ Unknown format
    throw new Error("AI returned unexpected format:\n" + cleaned);
    // const raw = res.choices[0].message.content;
    // console.log("AI RAW RESPONSE:", raw);
    // // 🧹 Clean markdown
    // let cleaned = raw
    //     .replace(/```json/g, "")
    //     .replace(/```/g, "")
    //     .trim();

    // try {
    // return JSON.parse(raw);
    // } catch (e) {
    // throw new Error("AI did not return valid JSON:\n" + raw);
    // }

//   return JSON.parse(res.choices[0].message.content);
}

async function safeGenerateSQL(question, history=[]) {
  const schemaText = "";
  try {
    return await generateSQL(question, history);
  } catch (err) {
    console.log("⚠️ First attempt failed, retrying...");

    // retry with stricter instruction
    return await generateSQL(
      question + "\nIMPORTANT: Return ONLY valid JSON. No markdown. No plain SQL.",
      schemaText
    );
  }
}

async function fixSQL(badSQL, error, question) {
  const res = await llm.invoke(
  [
        new SystemMessage(`
    Fix PostgreSQL query.

    Return JSON:
    { "fixed_sql": "...", "reason": "..." }
        `),

        new HumanMessage(`
    Question: ${question}
    SQL: ${badSQL}
    Error: ${error}
        `),
      ],

      {
        metadata: {
          module: "sql_fix",
          feature: "fundchatbot",
        },
      }
    );
//   const res = await client.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "system",
//         content: `
// Fix SQL Server query.

// Return JSON:
// { "fixed_sql": "...", "reason": "..." }
//         `,
//       },
//       {
//         role: "user",
//         content: `
// Question: ${question}
// SQL: ${badSQL}
// Error: ${error}
//         `,
//       },
//     ],
//   });
const raw = res.content;
let cleaned = raw
  .replace(/```json/g, "")
  .replace(/```/g, "")
  .trim();

return JSON.parse(cleaned);

//   return JSON.parse(res.choices[0].message.content);
}

//module.exports = { generateSQL, fixSQL };
module.exports = {generateSQL,safeGenerateSQL,fixSQL};