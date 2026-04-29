const express = require("express");
const router = express.Router();
const { executeWithAutoFix } = require("../utils/autofix");
// const { generateSQL, fixSQL } = require("../ai");
const { safeGenerateSQL,fixSQL  } = require("../ai");
console.log("fixSQL type:", typeof fixSQL);
const { queryDB } = require("../db");
const { isSafeQuery } = require("../utils/validator");
const { getMemory, saveMemory } = require("../memory");
const { normalizeQuery } = require("../utils/normalizer");
// const { normalizeBenchmark } = require("../utils/normalizer");
// const { fixSQLWithParser } = require("../utils/sqlFixer");

function shouldUseParser(sql) {
  const q = sql.toLowerCase();

  return !(
    q.includes("top") || 
    q.includes("join") ||
    q.includes("avg(") ||
    q.includes("group by")
  );
}

// function normalizeQuery(q) {
//   return q
//     .replace(/TOP\s+(\d+)/gi, "LIMIT $1")
//     .replace(/GETDATE\(\)/gi, "NOW()")
//     .replace(/ISNULL\(/gi, "COALESCE(")
//     .replace(/`/g, "")
//     .replace(/\[|\]/g, "");
// }

function validateSQL(sql) {
  let q = sql;
  // Replace unsupported functions
  q = q.trim().replace(/;+$/, "");
  q = q.replace(/STDDEV_P/gi, "STDEV");
  q = q.replace(/AVG\((.*?)\)\s*\/\s*STDEV\((.*?)\)/gi,"AVG($1) / NULLIF(STDEV($2), 0)");
  // auto-fix common mistakes
  if (q.includes("sector_exposure_view")) {
      q = q.replace(/\bweight\b/gi, "sector_weight");
      q = q.replace(/\bexposure_weight\b/gi, "sector_weight");
      q = q.replace(/sector_weight\s*>\s*0\.(\d+)/gi, (match, val) => {
            return `sector_weight > ${parseFloat("0." + val) * 100}`;
            });
    }
  
  
  if (q.includes("from holdings")) {
      q = q.replace(/sector_weight/gi, "weight");
      }
  q = q.replace(/fund_name\s*=\s*'([^']+)'/gi,"fund_name LIKE '%$1%'");
  // convert decimal to percentage
  q = q.replace(/fund_name\s+like\s+'%icici fund%'/gi,"fund_name LIKE '%ICICI%'");
  q = q.replace(/fund_name\s*=\s*'([^']+)'/gi,"fund_name LIKE '%$1%'");
  q = q.replace(/sector\s*=\s*'IT'/gi, "sector LIKE '%Technology%'");
  
  q = q.replace(/=\s*\(\s*select\s+fund_id\s+from\s+funds\s+where/i,
    "IN (SELECT fund_id FROM funds WHERE");
  q = q.replace(/join\s+countries\s+c\s+on\s+a\.country_id\s*=\s*c\.country_id/gi,"");
  // fix wrong column usage
  q = q.replace(/h\.sector_weight/gi, "se.sector_weight");
  // fix wrong join
  q = q.replace(
    /join\s+asset_country_map\s+\w+\s+on\s+h\.fund_id\s*=\s*\w+\.fund_id/gi,
    "JOIN asset_country_map acm ON h.asset_name = acm.asset_name"
  );

  // fix benchmark name
  q = q.replace(
    /benchmark_name\s*=\s*'nifty'/gi,
    "benchmark_name LIKE '%NIFTY%'"
  );

  // fix CROSS JOIN misuse
  q = q.replace(
    /cross join benchmark_comparison_view/gi,
    "JOIN benchmark_comparison_view"
  );

  if (q.toLowerCase().includes("cagr") && !q.toLowerCase().includes("fund_master_metrics")) {
    console.log("🔧 Rewriting query to use fund_master_metrics for CAGR");

    q = q.replace(/from\s+\w+/i, "FROM fund_master_metrics");
    q = q.replace(/join\s+[^\s]+\s+on\s+[^\s]+/gi, "");
    q = q.replace(/\b\w+\.cagr\b/gi, "cagr");
  }

  if (!q.toLowerCase().includes("top") && !q.toLowerCase().includes("fetch")) {
      // q = q.replace(/select/i, "SELECT TOP 100");
      q = q.replace(/select\s+top\s+(\d+)/i, "SELECT");
      // q = q.replace(/order\s+by/i, `ORDER BY LIMIT $1`);
  }


  

  // if (q.toLowerCase().includes("benchmark")) 
  //   {
  //     console.log("🔧 Fixing benchmark column usage");

  //     // force correct column
  //     q = q.replace(/\b\w*sp\w*_?cagr\b/gi, "b.cagr");

  //     // ensure benchmark filter exists
  //     if (!q.toLowerCase().includes("benchmark_name")) {
  //       q += " AND b.benchmark_name = 'S&P 500'";
  //       }
  //  }
  //  q = q.replace(/join\s+benchmark_comparison_view\s+\w+\s+on\s+[^\n]+/gi,
  // "CROSS JOIN benchmark_comparison_view b"
  //   );
    q = q.replace(/s_and_p_500_cagr|sp500_cagr|benchmark_cagr/gi,"b.cagr");
    q = q.replace(/benchmark_name\s*=\s*'NIFTY'/gi,"benchmark_name LIKE '%NIFTY%'");
    // only fix usage in WHERE or SELECT expressions, not aliases
    q = q.replace(/\bb\.benchmark_cagr\b/gi, "b.cagr");
    q = q.replace(/\bbenchmark_cagr\b(?!\s+AS)/gi, "b.cagr");
    q = q.replace(/AS\s+b\.cagr/gi, "AS benchmark_cagr");
    // fix invalid alias patterns
    q = q.replace(/AS\s+\w+\.\w+/gi, "AS benchmark_cagr");
    // Fix wrong column names for holdings
    q = q.replace(/holding_name/gi, "asset_name");
    q = q.replace(/holding_value/gi, "weight");
    q = q.replace(/\bvalue\b/gi, "weight");
    q = q.replace(/\bholding_name\b/gi, "asset_name");
    q = q.replace(/\bholding_value\b/gi, "weight");
    q = q.replace(/\bh\.value\b/gi, "h.weight");
    // q.replace(/TOP\s+(\d+)/gi, "LIMIT");
    q.replace(/GETDATE\(\)/gi, "NOW()");
    q.replace(/ISNULL\(/gi, "COALESCE(");
    q.replace(/`/g, "");
    q.replace(/\[|\]/g, "");
    q = q.replace(/NVARCHAR/gi, "TEXT");
    // fix wrong alias usage
    // q = q.replace(/s\.sharpe_ratio/gi, "m.sharpe_ratio");

    // OR better → redirect to correct view
    if (q.includes("sharpe_ratio") && q.includes("fund_master_metrics")) {
      q = q.replace(
        /fund_master_metrics\s+m/gi,
        "fund_sharpe_view s"
      );
      // q = q.replace(/m\./gi, "s.");
    }
    if (q.includes("concentration_index > 10") || q.includes("concentration_index > 20")
        || q.includes("concentration_index > 0.20")  ) {
        q = q.replace("concentration_index > 10", "concentration_index > 0.10");
        q = q.replace("concentration_index > 20", "concentration_index > 0.10");
        q = q.replace("concentration_index > 0.20", "concentration_index > 0.10");
      }
  // Prevent dangerous queries
  if (!q.trim().toLowerCase().startsWith("select")) {
    throw new Error("Only SELECT queries are allowed");
  }

  // Prevent multiple statements
  // if (q.includes(";")) {
  //   throw new Error("Multiple SQL statements not allowed");
  // }

  // if (q.split(";").filter(s => s.trim().length > 0).length > 1) {
  //     throw new Error("Multiple SQL statements not allowed");
  //     }

  q = q.trim();

  // remove trailing semicolon
  q = q.replace(/;+$/, "");

  // block actual multiple statements
  const statements = q.split(";").filter(s => s.trim().length > 0);
  if (statements.length > 1) {
    throw new Error("Multiple SQL statements not allowed");
  }

  // Basic invalid join check (optional but useful)
  if (q.includes("benchmark_id = h.fund_id")) {
    throw new Error("Invalid join detected");
  }
  if (q.includes("benchmark_comparison_view") && q.includes("LIKE"))
     {
  // already correct → DO NOTHING
  return q;
  }
  const lower = q.toLowerCase();

  // if (/\btop\s+\d+/i.test(q) && !/\blimit\s+\d+/i.test(q)) {
  //   throw new Error("Use LIMIT instead of TOP");
  // }

  if (lower.includes("getdate()")) {
    throw new Error("Use NOW()");
  }

  if (lower.includes("isnull")) {
    throw new Error("Use COALESCE");
  }

  // if (lower.includes("nvarchar")) {
  //   throw new Error("Invalid type");
  // }

  const usesDiversification = q.includes("diversification_score");
  const hasDiversificationView = q.includes("fund_diversification_view");
  const hasMasterView = q.includes("fund_master_metrics");

  if (
    usesDiversification &&
    !hasDiversificationView &&
    !hasMasterView
  ) {
    throw new Error(
      "diversification_score requires fund_diversification_view or fund_master_metrics"
    );
  }

  // if (
  // q.includes("diversification_score") &&
  // q.includes("fund_risk_metrics") &&
  // !q.includes("fund_diversification_view")
  // ) {
  // throw new Error(
  //   "Wrong view: diversification_score must come from fund_diversification_view"
  // );
  // }
  
  return q;
}

function generateInsight(result) {
  if (!result || result.length === 0) return "";

  const row = result[0];

  if (row.sector_weight > 40) {
    return "⚠️ High sector concentration detected.";
  }

  if (row.sharpe_ratio > 1.5) {
    return "✅ Strong risk-adjusted performance.";
  }

  return "Moderate performance.";
}

router.post("/", async (req, res) => {
  try {
    const { question, sessionId } = req.body;

    const history = getMemory(sessionId);

    // const aiRes = await generateSQL(question, history);
    const aiRes = await safeGenerateSQL(question);
    // const sqlQuery = aiRes.sql;
    let sqlQuery = validateSQL(aiRes.sql);
    let result;
    let fix = null;
    try {
        result = await queryDB(sqlQuery);
        } catch (err) {
        console.log("❌ SQL ERROR:", err.message);
        if (err.message.includes("column b.fund_id")) 
        {
          console.log("🔧 Fixing invalid benchmark join");
          q = q.replace(
            /on\s+f\.fund_id\s*=\s*b\.fund_id/gi,
            "ON b.benchmark_name LIKE '%NIFTY%'"
          );
          // ensure benchmark filter exists
              if (!q.toLowerCase().includes("benchmark_name")) {
                q += " AND b.benchmark_name = 'S&P 500'";
                }
        }

        // 🔥 Fix SQL using AI
        fix = await fixSQL(sqlQuery, err.message, question);
        let fixedSQL = validateSQL(fix.fixed_sql);
        console.log("🔧 FIXED SQL:", fix.fixed_sql);

        // retry with fixed query
        result = await queryDB(fix.fixed_sql);
        }
    if (!isSafeQuery(aiRes.sql)) {
      throw new Error("Unsafe query blocked");
    }

    let normalizedSQL = normalizeQuery(fix?.fixed_sql || aiRes.sql);
    // if (!normalizedSQL.toLowerCase().includes("limit")) {normalizedSQL += " LIMIT 50";}
    if (!/limit\s+\d+/i.test(normalizedSQL)) {normalizedSQL += " LIMIT 50";}
    let finalSQL = normalizedSQL;
    // let finalSQL;

    // if (shouldUseParser(normalizedSQL)) {
    //   try {
    //     finalSQL = fixSQLWithParser(normalizedSQL);
    //   } catch {
    //     finalSQL = normalizedSQL;
    //   }
    // } else {
    //   console.log("ℹ️ Skipping parser for complex SQL");
    //   finalSQL = normalizedSQL;
    // }

    result  = await executeWithAutoFix(finalSQL,question,validateSQL);
    
    // const insight =aiRes.insight || generateInsight(result.data || result);
    const insight = `${aiRes.insight || ""}${generateInsight(result.data || result)}`;

    saveMemory(sessionId, [
      ...history,
      { role: "user", content: question },
      { role: "assistant", content: aiRes.sql },
    ]);
    
    // res.json({
    // query: aiRes.sql,
    // explanation: aiRes.explanation,
    // insight: aiRes.insight,
    // result,
    // });

    res.json({
    query: result.sqlQuery,
    explanation: aiRes.explanation,
    insight: insight,
    result: result.data,
    retries: result.retries,
    });

    // res.json({
    //   query: execution.sqlQuery,
    //   explanation: aiRes.explanation,
    //   result: execution.data,
    //   retries: execution.retries,
    // });

  } catch (err) {
    console.error("BACKEND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;