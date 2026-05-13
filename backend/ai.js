const OpenAI = require("openai");
const { getSchema } = require("./schema");
const { formatSchema } = require("./formatSchema");
const { loadSchema } = require("./utils/schemaLoader");
const { ChatOpenAI } = require("@langchain/openai");
const { detectRelevantTables } = require("./utils/schemaSelector");
const {HumanMessage,SystemMessage,} = require("@langchain/core/messages");
const { planQuery } = require("./utils/queryPlanner");
const { enhanceQuestion } = require("./utils/queryEnhancer");
const { createLLM } = require("./utils/createLLM");
const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY,});


async function generateSQL(userQuery, history = [], model = "gpt-5-mini") {
  const schema = await getSchema();
  const relevantTables = detectRelevantTables(userQuery);
 
  const filteredSchema = Object.fromEntries(
    Object.entries(schema).filter(([table]) =>
      relevantTables.includes(table)
    )
  );
  const schemaText = formatSchema(filteredSchema);
  const plan = await planQuery(userQuery,schemaText,model);
  if (plan.confidence < 0.7) {console.log("⚠️ Low confidence query plan");}
  const llmConfig = {model, apiKey: process.env.OPENAI_API_KEY,};
  if (model.startsWith("gpt-4")) {llmConfig.temperature = 0; }
  const llm = new ChatOpenAI(llmConfig);

  const systemPrompt = `
        You are a PostgreSQL expert.

        PRIMARY GOAL:
        Return useful analytical results.
        Prefer broader queries that return meaningful data
        over highly restrictive institutional screening logic.

        Generate SQL queries using ONLY the provided schema.

        SQL EXECUTION RULES:

        Generate immediately executable PostgreSQL SQL.

        NEVER convert optional business ideas into SQL filters.

        If user does not specify:
        - minimum exposure
        - minimum AUM
        - minimum years
        - minimum returns

        DO NOT generate those filters
        or placeholder parameters for them.

        Do NOT use:
        - named parameters
        - bind variables
        - placeholders

        Examples NOT allowed:
        :limit
        :min_aum
        :country

        Use literal values directly in SQL.

        Default behavior:
        return ranked analytical results.

        NOT:
        institutional screening queries.

        CRITICAL FILTER RULES:

        NEVER invent filters.

        Do NOT add filters for:
        - minimum exposure
        - minimum AUM
        - minimum track record
        - inception date
        - minimum years
        - positive excess return
        - positive CAGR
        - positive Sharpe ratio

        UNLESS the user explicitly requests them.

        Examples:
        - "funds with >70% US exposure"
        - "funds with at least 3 years history"
        - "large-cap funds"
        - "only outperforming funds"

        Otherwise:
        DO NOT generate those filters.
        
        Use ranking instead of restrictive filtering whenever possible.

        Prefer:
        ORDER BY metric DESC

        instead of:
        WHERE metric > threshold

        For exposure-related questions:

        Use:
        ORDER BY country_exposure DESC

        Do NOT use:
        country_exposure >= arbitrary value
        unless explicitly requested.

        For exposure-related queries:

        Use:
        ORDER BY exposure DESC

        NOT:
        WHERE exposure >= arbitrary threshold

        For sector-focused queries:

        Filter ONLY by sector name.

        Do NOT infer:
        minimum sector concentration thresholds.

        For benchmark comparisons:

        Compute excess return for ranking.

        Do NOT filter:
        fund_metric > benchmark_metric

        unless explicitly requested.

        SECTOR QUERY RULES:

        Questions like:
        - technology funds
        - energy funds
        - healthcare funds

        mean:
        funds with exposure to that sector.

        Do NOT infer:
        minimum sector exposure thresholds.

        Use:
        WHERE sector = 'Technology'

        NOT:
        sector_weight >= arbitrary value.

        For sector-focused queries:

        Rank results by:
        - cagr
        - sharpe_ratio
        - risk_adjusted_return

        NOT by:
        sector concentration thresholds.

        RULES:
        - PostgreSQL syntax only
        - Return ONLY valid JSON
        - No markdown
        - Only SELECT queries
        - Use LIMIT instead of TOP
        - Use exact schema columns
        - Avoid unnecessary joins
        - Prefer simpler queries
        - Never invent columns or tables

        STRICT FILTER RULES:

        NEVER add filters for:

        - minimum AUM
        - minimum exposure percentage
        - minimum track record
        - inception date
        - liquidity
        - positive excess return
        - positive CAGR
        - positive Sharpe ratio

        UNLESS the user explicitly asks for them.

        Examples of explicit requests:
        - "large funds"
        - "funds with at least 3 years history"
        - "funds with >70% US exposure"
        - "only outperforming funds"

        Otherwise:
        DO NOT add those filters.

        ABSOLUTE FILTER PROHIBITIONS:

        Never generate:
        - exposure >= X
        - sector_weight >= X
        - AUM >= X
        - years >= X

        unless the user explicitly specifies the threshold.

        Examples:
        - ">70% US exposure"
        - "large funds"
        - "at least 3 years"

        Otherwise:
        DO NOT invent numeric thresholds.
        
        IMPORTANT:
        Do NOT add:
        - minimum AUM filters
        - minimum risk filters
        unless explicitly requested.
        - Rank entities using planner-selected metric
        - Ranking entity and display entity may be different
        - NEVER invent financial formulas
        - Use existing schema metrics directly
        - Prefer simplest correct SQL
        - Prefer analytical views over raw calculations
        - Avoid unnecessary CTEs
        - Avoid NAV reconstruction unless explicitly required
        - Always use metric from metric_table
        - Never assume metrics exist in base tables
        - Use schema-defined analytical views for financial metrics
        - For investor questions:
          use investors + investor_transactions
        - For sector exposure:
          use sector_exposure_view
        - For performance/risk:
          prefer fund_master_metrics
        - Use meaningful aliases
          - funds = fd
          - fund_master_metrics = fmm
          - fund_sharpe_view = fs
          - investors = i
          - investor_transactions = it
        - Never reuse aliases for different entities
        - If ranking/filtering/comparing entities:
          ALWAYS include the metric used for comparison
          ALWAYS include supporting columns
          NEVER return only names
        - Benchmarks are NOT funds
        - Use benchmark_comparison_view for benchmark comparisons
        - Never search benchmark names inside funds table
        - Use benchmark_name LIKE '%NIFTY%'
        - For comparison queries:
          - ALWAYS display benchmark metric
          - ALWAYS display entity metric
          - ALWAYS calculate comparison delta
          - NEVER only filter without showing comparison evidence
        - Use fuzzy matching for fund names
          - Prefer:
            ILIKE '%ICICI%'
        - Avoid exact string equality for user-entered names

        MINIMAL TABLE RULE:
        Only join tables necessary to answer the question.
        Avoid unnecessary joins.
        
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

        CRITICAL ENTITY RULES:

        Entity type determines the ONLY valid table.

        If entity_type = investor:
        - MUST use investors.investor_name
        - MUST join investor_transactions
        - MUST NOT query funds.fund_name
        - MUST NOT treat investor names as funds

        If entity_type = fund:
        - MUST use funds.fund_name

        If entity_type = asset:
        - MUST use holdings.asset_name

        Violation of these rules produces invalid SQL.

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

        ENTITY MATCHING RULES:
        - Never use exact equality for fund names unless full name is provided
        - Prefer fuzzy matching:
          ILIKE '%name%'
        - For partial names:
          use wildcard matching
        - If multiple funds match:
          return the best matches OR use most recent/highest AUM

        SIMPLICITY RULES:
        
        Prefer:
        single-pass analytical queries.

        Avoid:
        - lateral joins
        - nested benchmark selection
        - fallback benchmark periods
        - interval comparisons
        - complex date logic
        - CTE chains

        unless explicitly requested.

        Use:
        latest available benchmark row
        by default.
        Prefer broad matching over restrictive filters.

        Do NOT add:
        - arbitrary AUM filters
        - arbitrary inception-date filters
        - exact benchmark period joins
        unless explicitly requested.

        Do NOT infer:
        - minimum AUM
        - minimum years
        - investability filters
        - benchmark alignment windows

        unless explicitly requested.

        TOP/BEST/LEADING queries mean:

        simple ranking queries.

        NOT:
        institutional screening queries.

        Do NOT generate:
        - HAVING exposure >= X
        - minimum AUM
        - minimum years
        - minimum benchmark overlap

        unless explicitly requested.

        For benchmark comparison queries:

        Prefer:
        ORDER BY excess return DESC

        Do NOT filter:
        fund_metric > benchmark_metric

        unless user explicitly asks:
        - outperforming
        - beat benchmark
        - exceeded benchmark

        prefer latest available benchmark return.
        Avoid exact date equality joins unless user explicitly requests a precise period.


        QUERY SIMPLICITY RULES:

        Prefer high-recall queries.

        Do NOT add:
        - arbitrary AUM thresholds
        - arbitrary exposure thresholds
        - arbitrary inception-date filters
        - arbitrary liquidity filters
        - arbitrary history windows

        unless explicitly requested.

        Use broad matching first.

        Avoid combining many restrictive conditions.

        Prefer:
        simple comparisons
        over:
        institutional screening logic.

        For exposure-based queries:

        DO NOT invent exposure thresholds.

        Use:
        ORDER BY exposure DESC

        instead of:
        exposure > arbitrary threshold

        unless explicitly requested.

        HIGH RECALL RULES:

        Prefer returning relevant rows over overly restrictive filtering.

        Do NOT add:
        - minimum AUM
        - minimum exposure
        - minimum history
        - positive excess-return
        - strict inception-date requirements
        - investability screens

        unless explicitly requested by the user.

        Prefer:
        ORDER BY metrics DESC

        instead of:
        hard filtering.

        Avoid combining many restrictive conditions.
        
        COMPLEXITY RULES:
        - Simple question → simple SQL
        - Avoid CTEs unless necessary
        - Avoid lateral joins unless necessary
        - Avoid reconstructing metrics if analytical views already exist

        Ranking queries should NOT generate filters unless explicitly requested.
        Examples:
        - highest
        - best
        - top
        - leading

        mean:
        simple ORDER BY queries.

        For single-metric ranking questions:

        Use:
        - WHERE metric IS NOT NULL
        - ORDER BY metric DESC
        - LIMIT

        Avoid:
        - minimum AUM
        - minimum history
        - minimum exposure
        - institutional screening logic

        DATASET SCALE RULES:

        Dataset contains synthetic/demo-scale values.
        Do NOT assume institutional-scale values.
        Do NOT generate institutional AUM thresholds.

        Avoid:
        - AUM minimums
        - exposure minimums
        - large numeric thresholds

        unless explicitly requested.

        DATE FORMATTING RULES:
        - Always return date columns as DATE only
        - Cast timestamps using:
          column::date
        - Never return timestamp values unless explicitly requested
        For all columns ending in:
          - _date
          - date
          - timestamp
        return them as:
        column::date

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

        METRIC LOCATION RULES:

        sharpe_ratio:
        - comes from fund_sharpe_view

        cagr:
        - comes from fund_master_metrics

        risk_adjusted_return:
        - comes from fund_master_metrics

        For benchmark comparisons:

        Use:
        latest available benchmark row.

        Avoid:
        - interval alignment
        - benchmark period reconstruction
        - overlapping history validation
        - fallback benchmark windows
        unless explicitly requested.

        Do NOT enforce benchmark history overlap checks unless explicitly requested.

        Use:
        fund_master_metrics.cagr for benchmark outperformance comparisons.

        Do NOT compare:
        risk_adjusted_return against benchmark return_pct.

        Do NOT require:
        fund_metric > benchmark_metric

        unless user explicitly asks:
        - outperforming
        - beat benchmark
        - exceeded benchmark

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

        SECTOR THRESHOLD RULES:

        - "heavily invested" defaults to:
          15%

        - only use:
          30%+
        if user explicitly says:
          highly concentrated
    
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

        REGION NORMALIZATION RULES:

        Europe refers to common European fund countries in the dataset.

        Prefer:
        UK
        France
        Germany
        Italy
        Spain

        Avoid large hardcoded country lists.

        COUNTRY NORMALIZATION RULES:

        Use exact country values commonly present in the dataset:

        USA
        UK
        India
        Japan
        South Korea

        Avoid:
        United States
        United Kingdom

        Prefer short canonical dataset values.

        For exposure-based queries:
        do NOT invent minimum exposure thresholds
        unless explicitly requested.

        Prefer:
        ORDER BY exposure DESC
        instead of:
        exposure > arbitrary value.

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

        DEFAULT FUND RANKING:
        If no metric specified:
        1. Use cagr
        2. Fallback to risk_adjusted_return
        3. Use fund_master_metrics
        4. Return top rows directly

        DATABASE SCHEMA:
        ${schemaText}

        Return EXACTLY:
        {
          "sql": "...",
           "explanation": "...",
           "insight": "..."
          
        }
        `;
        
  // const messages = [ new SystemMessage(` `),
  const messages = [new SystemMessage(systemPrompt),
        //   ...(Array.isArray(history)
        //    ? history.map(
        //     (h) =>
        //       new HumanMessage(
        //         typeof h.content === "string"
        //           ? h.content
        //           : JSON.stringify(h.content)
        //       )
        //    )
        //    : []
        // ),
  // new HumanMessage(userQuery),
  // new HumanMessage(enhanceQuestion(userQuery)),
  new HumanMessage(`
    USER QUESTION:
    ${userQuery}

    QUERY PLAN:

    Metric:
    ${plan.metric}

    Metric Table:
    ${plan.metric_table}

    Benchmark:
    ${plan.benchmark || "None"}

    Benchmark Table:
    ${plan.benchmark_table || "None"}

    Benchmark Metric:
    ${plan.benchmark_metric_column || "None"}

    Comparison Required:
    ${plan.comparison_required}

    Comparison Entity:
    ${plan.comparison_entity}

    Delta Column:
    ${plan.delta_column}

    Ranking Entity:
    ${plan.ranking_entity}

    Display Entity:
    ${plan.display_entity}

    Entity Type:
    ${plan.entity_type || "unknown"}

    Supporting Columns:
    ${plan.supporting_columns.join(", ")}

    Business Logic:
    ${plan.business_logic}

    Ownership Logic:
    ${plan.ownership_logic}

    IMPORTANT:
    - Use the metric selected in QUERY PLAN
    - Include supporting columns
    - Include ranking metric in final output

    CRITICAL ENTITY RULES:

    If Entity Type = investor:
    - MUST use investors.investor_name
    - MUST join investor_transactions
    - MUST NOT query funds.fund_name

    If Entity Type = fund:
    - MUST use funds.fund_name

    If Entity Type = asset:
    - MUST use holdings.asset_name

    Never assume all entities are funds.
    `),

];

// const res = await llm.invoke(messages, {
const res = await llm.invoke(messages, {response_format: { type: "json_object" },
  metadata: {module: "sql_generation",feature: "fundchatbot",},
  });
      
    // const raw = res.choices[0].message.content;
    const raw = res.content;

    console.log("AI RAW RESPONSE:", raw);
    const cleaned = raw.trim();
    
    if (cleaned.startsWith("{")) {

  try {

    const parsed = JSON.parse(cleaned);
    // SQL cleanup fixes
    if (parsed.sql) {

      parsed.sql = parsed.sql
        .replace(/rankFROM/gi, "rank FROM")
        .replace(/LIMITFROM/gi, "LIMIT FROM")
        .replace(/DESCFROM/gi, "DESC FROM")
        .replace(/NULLSLAST/gi, "NULLS LAST")
        .replace(/ASrank/gi, "AS rank")
        .replace(/FROMfunds/gi, "FROM funds");
    }

     return parsed;

      } catch (e) {

        console.error(
          "❌ JSON parse failed:",
          cleaned
        );

        throw new Error("Invalid JSON from AI");
      }
    }

    if (
  cleaned.toLowerCase().startsWith("select") ||
  cleaned.toLowerCase().startsWith("with")
    ) {

  const fixedSQL = cleaned
    .replace(/rankFROM/gi, "rank FROM")
    .replace(/LIMITFROM/gi, "LIMIT FROM")
    .replace(/DESCFROM/gi, "DESC FROM")
    .replace(/NULLSLAST/gi, "NULLS LAST")
    .replace(/ASrank/gi, "AS rank")
    .replace(/FROMfunds/gi, "FROM funds");

  return {
    sql: fixedSQL,
    explanation:
      "Generated SQL query based on your request.",
    };
  }

    // ❌ Unknown format
    throw new Error("AI returned unexpected format:\n" + cleaned);
    
}

async function safeGenerateSQL(
  question,
  history = [],
  model = "gpt-5-mini"
) {

  try {

    return await generateSQL(
      question,
      history,
      model
    );

  } catch (err) {

    console.log("⚠️ First attempt failed, retrying...");

    return await generateSQL(
      question,
      history,
      model
    );
  }
}


async function fixSQL(badSQL, error, question, model = "gpt-5-mini") {
  const schema = await getSchema();
  const schemaText = formatSchema(schema);
  
  const llm = createLLM(model);
  const res = await llm.invoke(
  [
        new SystemMessage(`
          You are a PostgreSQL SQL repair expert.
          Fix the SQL query using the database schema.

          DATABASE SCHEMA:
          ${schemaText}

          RULES:
          - Preserve business intent
          - Use only existing columns
          - Use PostgreSQL syntax
          - Return ONLY valid JSON

          FORMAT:
          {
            "fixed_sql": "...",
            "reason": "..."
          }

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