const sectorMap = {
  IT: "Technology",
  Tech: "Technology",
  Technology: "Technology",
  Pharma: "Healthcare",
  Banking: "Financials",
  Finance: "Financials",
  Energy: "Energy",
  FMCG: "Consumer Goods"
};

const benchmarkMap = {
  NIFTY: "NIFTY 50",
  "S&P 500": "S&P 500",
  SP500: "S&P 500"
};

const regionMap = {

  Europe: [
    "UK",
    "France",
    "Germany",
    "Italy",
    "Spain"
  ],

  Asia: [
    "Japan",
    "India",
    "South Korea"
  ],

  US: [
    "USA",
    "US"
  ]

};


function normalizeQuery(sql) {
  
  const topMatch = sql.match(/select\s+top\s+(\d+)/i);
  if (topMatch) {
    const limit = topMatch[1];

    sql = sql.replace(/select\s+top\s+\d+/i, "SELECT");
    sql += ` LIMIT ${limit}`;
  }

  let updatedSQL = sql;
    // updatedSQL = updatedSQL.replace(/top\s+(\d+)/i, "LIMIT $1")  // 🔥 key fix
    updatedSQL = updatedSQL.replace(/::/g,"__PG_CAST__");
    updatedSQL = updatedSQL.replace(/`/g, "")
    updatedSQL = updatedSQL.replace(/\[|\]/g, "");
    // updatedSQL = updatedSQL.replace(/sector_weight\s*>=\s*\d+(\.\d+)?/gi,"1=1");
    // updatedSQL = updatedSQL.replace(/country_exposure\s*>=\s*\d+(\.\d+)?/gi,"1=1");
    // updatedSQL = updatedSQL.replace(/total_assets\s*>=\s*[0-9.]+/gi,"1=1");
    updatedSQL = updatedSQL.replace(/\s+AND\s+fmm\.total_assets\s*>=\s*[0-9.]+/gi, "");
    updatedSQL = updatedSQL.replace(/\s+AND\s+sev\.sector_weight\s*>=\s*[0-9.]+/gi, "" );
    updatedSQL = updatedSQL.replace(/\s+AND\s+cev\.country_exposure\s*>=\s*[0-9.]+/gi, "");
    
  Object.entries(sectorMap).forEach(([key, value]) => {
    const regex = new RegExp(`sector\\s*=\\s*'${key}'`, "gi");
    updatedSQL = updatedSQL.replace(
      regex,
      `sector LIKE '%${value}%'`
    );
  });

    // benchmark normalization
  Object.entries(benchmarkMap).forEach(([key, value]) => {
    const regex = new RegExp(`benchmark_name\\s*=\\s*'${key}'`, "gi");
    updatedSQL = updatedSQL.replace(
      regex,
      `benchmark_name LIKE '%${value}%'`
    );
  });

  Object.entries(regionMap).forEach(
  ([region, countries]) => {

    const regex = new RegExp(
      `country\\s*=\\s*'${region}'`,
      "gi"
    );

    const inClause =
      countries
        .map(c => `'${c}'`)
        .join(",");

    updatedSQL =
      updatedSQL.replace(
        regex,
        `country IN (${inClause})`
      );

      }
    );

    Object.entries(regionMap).forEach(
  ([region, countries]) => {

    const regex = new RegExp(
      `country\\s+ILIKE\\s+'%${region}%'`,
      "gi"
    );

    const inClause =
      countries
        .map(c => `'${c}'`)
        .join(",");

    updatedSQL =
      updatedSQL.replace(
        regex,
        `country IN (${inClause})`
      );

      }
    );
    // Fix nav alias mismatch
  // updatedSQL = updatedSQL.replace(/nav\.max_gap_days([^A-Za-z_])/g,
  //   "nav.max_gap_days AS max_nav_gap_days$1"  );
  updatedSQL = updatedSQL.replace(
  /\bnav\.max_gap_days\b(?!\s+AS\s+max_nav_gap_days)/gi,
  "nav.max_gap_days AS max_nav_gap_days");
  updatedSQL = updatedSQL.replace( /__PG_CAST__/g, "::");

  return updatedSQL;

}

module.exports = { normalizeQuery };

// function normalizeBenchmark(sql) {
//   let updated = sql;

//   Object.entries(benchmarkMap).forEach(([key, value]) => {
//     const regex = new RegExp(`benchmark_name\\s*=\\s*'${key}'`, "gi");
//     updated = updated.replace(
//       regex,
//       `benchmark_name LIKE '%${value}%'`
//     );
//   });

//   return updated;
// }
// module.exports = { normalizeBenchmark };