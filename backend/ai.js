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


async function generateSQL(userQuery, history = [], model = "gpt-4o-mini") {
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

        Generate SQL queries using ONLY the provided schema.

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
        
        IMPORTANT:
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
          ...(Array.isArray(history)
           ? history.map(
            (h) =>
              new HumanMessage(
                typeof h.content === "string"
                  ? h.content
                  : JSON.stringify(h.content)
              )
           )
           : []
        ),
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


    // 🧠 Case 2: Raw SQL response
    // if (cleaned.toLowerCase().startsWith("select")) {
    // return {
    //     sql: cleaned,
    //     explanation: "Generated SQL query based on your request.",
    // };
    // }

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
  model = "gpt-4o-mini"
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


async function fixSQL(badSQL, error, question, model = "gpt-4o-mini") {
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