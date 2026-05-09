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


function normalizeQuery(sql) {
  const topMatch = sql.match(/select\s+top\s+(\d+)/i);
  if (topMatch) {
    const limit = topMatch[1];

    sql = sql.replace(/select\s+top\s+\d+/i, "SELECT");
    sql += ` LIMIT ${limit}`;
  }

  let updatedSQL = sql;
    // updatedSQL = updatedSQL.replace(/top\s+(\d+)/i, "LIMIT $1")  // 🔥 key fix
    updatedSQL = updatedSQL.replace(/`/g, "")
    updatedSQL = updatedSQL.replace(/\[|\]/g, "");
    
  Object.entries(sectorMap).forEach(([key, value]) => {
    const regex = new RegExp(`sector\\s*=\\s*'${key}'`, "gi");
    updatedSQL = updatedSQL.replace(
      regex,
      `sector LIKE '%${value}%'`
    );
  });

    // 🔥 benchmark normalization (ADD THIS)
  Object.entries(benchmarkMap).forEach(([key, value]) => {
    const regex = new RegExp(`benchmark_name\\s*=\\s*'${key}'`, "gi");
    updatedSQL = updatedSQL.replace(
      regex,
      `benchmark_name LIKE '%${value}%'`
    );
  });

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