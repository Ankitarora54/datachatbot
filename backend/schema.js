const { queryDB } = require("./db");

let cachedSchema = null;
let lastFetch = 0;

async function getSchema() {
  const now = Date.now();

  // cache for 5 mins
  // if (cachedSchema && now - lastFetch < 5 * 60 * 1000) {
  //   return cachedSchema;
  // }
  
  // ✅ Get all tables (PostgreSQL)
  const tables = await queryDB(`
    SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name
  `);
    
  const schema = {};

  const tableDescriptions = {

  investors:
    "Investor master table",

  investor_transactions:
    "Investor cashflows and transactions",

  funds:
    "Fund master data",

  holdings:
    "Fund holdings and assets",

  country_exposure_view:
    "Country-level exposure analytics",

  benchmark_comparison_view:
    "Benchmark return comparisons",

  fund_master_metrics:
    `Contains:
      - cagr
      - risk
      - risk_adjusted_return
      - diversification metrics
    Does NOT contain:
      - sharpe_ratio
      `,
    fund_sharpe_view:
    "Contains: sharpe_ratio"
    };

  for (const row of tables) {
    const table = row.table_name;

    // const cols = await queryDB(`
    //   SELECT column_name, data_type
    //   FROM information_schema.columns
    //   WHERE table_name = '${table}'
    // `);

    // schema[table] = cols;

    const cols = await queryDB(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_name = $1
    `,[table]);

    const enrichedCols = [];

    for (const col of cols) {

      const enriched = {
        name: col.column_name,
        type: col.data_type,
        sample_values: []
      };

      // Add sample values for text columns
      if (
        col.data_type.includes("char") ||
        col.data_type.includes("text")
      ) {

        try {

          const sampleQuery = `
            SELECT DISTINCT "${col.column_name}"
            FROM "${table}"
            WHERE "${col.column_name}" IS NOT NULL
            LIMIT 5
          `;

          const sampleRows =
            await queryDB(sampleQuery);

          enriched.sample_values =
            sampleRows
              .map(r => r[col.column_name])
              .filter(Boolean);

        } catch (err) {

          console.log(
            `⚠️ Sample fetch failed for ${table}.${col.column_name}`
          );
        }
      }

      enrichedCols.push(enriched);
    }

    // schema[table] = enrichedCols;
    schema[table] = {description: tableDescriptions[table] || "",columns: enrichedCols};

  }

  cachedSchema = schema;
  lastFetch = now;

  return schema;
}

module.exports = { getSchema };
