const express = require("express");
const router = express.Router();
const { executeWithAutoFix } = require("../utils/autofix");
const { safeGenerateSQL,fixSQL  } = require("../ai");
const { queryDB } = require("../db");
const { isSafeQuery } = require("../utils/validator");
const { getMemory, saveMemory } = require("../memory");
const { normalizeQuery } = require("../utils/normalizer");

function shouldUseParser(sql) {
  const q = sql.toLowerCase();

  return !(
    q.includes("top") || 
    q.includes("join") ||
    q.includes("avg(") ||
    q.includes("group by")
  );
}

function validateSQL(q) {

  if (!q) {
    throw new Error("Empty SQL");
  }

  // remove markdown formatting

  q = q
    .replace(/```sql/gi, "")
    .replace(/```/g, "")
    .trim();

  // remove trailing semicolons ONLY

  q = q.replace(/;+$/g, "").trim();

  const lower = q.toLowerCase();

  // only allow SELECT/WITH

  if (
    !lower.startsWith("select") &&
    !lower.startsWith("with")
  ) {
    throw new Error(
      "Only SELECT queries allowed"
    );
  }

  // block destructive SQL

  const forbidden = [

    "insert ",
    "update ",
    "delete ",
    "drop ",
    "alter ",
    "truncate ",
    "grant ",
    "revoke "

  ];

  for (const word of forbidden) {

    if (lower.includes(word)) {

      throw new Error(
        `Forbidden SQL keyword: ${word}`
      );

    }

  }

  // detect REAL multi-statements
  // after trailing semicolons removed
  
  if (q.includes(";")) {

    throw new Error(
      "Multiple SQL statements not allowed"
    );

  }

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
    const { question, sessionId, model="gpt-4o-mini", } = req.body;

    const history = getMemory(sessionId);

    // const aiRes = await generateSQL(question, history);
    const aiRes = await safeGenerateSQL(question, history, model);
    // const sqlQuery = aiRes.sql;
    let sqlQuery = validateSQL(aiRes.sql);
    let result;
    let fix = null;
    try {
          if (!isSafeQuery(aiRes.sql)) {
            throw new Error("Unsafe query blocked");
          }

        result = await queryDB(sqlQuery);
        } catch (err) {
        console.log("❌ SQL ERROR:", err.message);
        if (err.message.includes("column b.fund_id")) 
        {
          console.log("🔧 Fixing invalid benchmark join");
          sqlQuery = sqlQuery.replace(
            /on\s+f\.fund_id\s*=\s*b\.fund_id/gi,
            "ON b.benchmark_name LIKE '%NIFTY%'"
          );
          // ensure benchmark filter exists
              if (!sqlQuery.toLowerCase().includes("benchmark_name")) {
                sqlQuery += " AND b.benchmark_name = 'S&P 500'";
                }
        }

        // 🔥 Fix SQL using AI
        fix = await fixSQL(sqlQuery, err.message, question,model);
        let fixedSQL = validateSQL(fix.fixed_sql);
        console.log("🔧 FIXED SQL:", fix.fixed_sql);

        // retry with fixed query
        result = await queryDB(fixedSQL);
        }

    let normalizedSQL = normalizeQuery(fix?.fixed_sql || aiRes.sql);

    if (!/limit\s+\d+/i.test(normalizedSQL)) {normalizedSQL += " LIMIT 50";}
    let finalSQL = normalizedSQL;

    result  = await executeWithAutoFix(finalSQL,question,validateSQL);
        
    //     if (result.data) {

    //   result.data = result.data.map(row => {

    //     const cleaned = {};

    //     for (const key in row) {

    //       const value = row[key];

    //       // if (value instanceof Date) 
    //       if (value instanceof Date || (typeof value === "string" &&value.includes("T") &&
    //         !isNaN(Date.parse(value))
    //           )
    //         )
    //         {
    //         cleaned[key] =
    //           value.toISOString().split("T")[0];

    //       } else {

    //         cleaned[key] = value;
    //       }
    //     }

    //     return cleaned;
    //   });
    // }

    if (result.data) {

  result.data = result.data.map(row => {

    const cleaned = {};

    for (const key in row) {

      const value = row[key];

      // REAL Date objects
      if (value instanceof Date) {

        cleaned[key] =
          value.toISOString().split("T")[0];

      }

      // ISO date strings
      else if (
        typeof value === "string" &&
        value.includes("T") &&
        !isNaN(Date.parse(value))
      ) {

        cleaned[key] =
          new Date(value)
            .toISOString()
            .split("T")[0];

      }

      // numeric formatting
      else if (
        value !== null &&
        !isNaN(value) &&
        value !== ""
      ) {

        const num = Number(value);

        cleaned[key] =
          Number.isInteger(num)
            ? num
            : Number(num.toFixed(2));

      }

      // arrays
      else if (Array.isArray(value)) {

        cleaned[key] =
          value.join(", ");

      }

      // everything else
      else {

        cleaned[key] = value;

      }

    }

    return cleaned;

  });

}

    const insight = `${aiRes.insight || ""}${generateInsight(result.data || result)}`;

    saveMemory(sessionId, [
      ...history,
      { role: "user", content: question },
      { role: "assistant", content: aiRes.sql },
    ]);

    res.json({
    query: result.sqlQuery,
    explanation: aiRes.explanation,
    insight: insight,
    result: result.data,
    retries: result.retries,
    });


  } catch (err) {
    console.error("BACKEND ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;