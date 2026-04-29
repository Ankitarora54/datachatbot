const { fixSQL } = require("../ai");
const { queryDB } = require("../db");

async function executeWithAutoFix(sqlQuery, question, validateSQL) {
  let currentSQL = validateSQL(sqlQuery);
  // if (
  //   currentSQL.includes("fund_sharpe_view") &&
  //   currentSQL.includes("s.sharpe_ratio") &&
  //   currentSQL.includes("ORDER BY s.sharpe_ratio")
  // ) {
  //   console.log("✅ Query already correct, skipping ALL fixes");
  //   const result = await queryDB(currentSQL);
  //   return result;
  // }
  for (let i = 0; i < 3; i++) {
    currentSQL = currentSQL.replace(/`/g, "");
    try {
        const data = await queryDB(currentSQL);
        return {data,sqlQuery: currentSQL,retries: i,};

    //   return await queryDB(currentSQL);
    } catch (err) {
      console.log(`❌ Attempt ${i + 1} failed:`, err.message);
      if (!err) return currentSQL;
      if (currentSQL.includes("fund_sharpe_view") && currentSQL.includes("s.sharpe_ratio")
        && currentSQL.includes("LIMIT")) {
        console.log("🛑 Query already correct, skipping auto-fix");
        throw err;
      }
      if (err.message.includes("Invalid column name 'sector_weight'")) {
          console.log("🛑 Stopping bad auto-fix loop (sector_weight not valid)");
          throw err;
        }
      if (err.message.includes("benchmark")) {
          console.log("🛑 Stopping retry loop for benchmark issue");
          throw err;
        }

      if (err.message.includes("missing FROM-clause entry")) {
           console.log("🛑 Stopping bad alias auto-fix loop");
          throw err;
        }
      const fix = await fixSQL(currentSQL, err.message, question);

      currentSQL = validateSQL(fix.fixed_sql);
      currentSQL = currentSQL.replace(/`/g, "");
      currentSQL = fixQuery(currentSQL, err);
      console.log("🔧 RETRY SQL:", currentSQL);
    }
  }

  throw new Error("Failed after retries");
}
module.exports = { executeWithAutoFix };