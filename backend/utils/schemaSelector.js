const { classifyEntity} = require("./entityClassifier");

function detectRelevantTables(question) {
  const entityType = classifyEntity(question);
  const q = question.toLowerCase();

  const tables = new Set(["funds"]);
  
  if (entityType === "investor") {
    tables.add("investors");
    tables.add("investor_transactions");
  }

  if (
    q.includes("risk") ||
    q.includes("performance") ||
    q.includes("cagr")
  ) {
    tables.add("fund_master_metrics");
  }

  if (
    q.includes("sector") ||
    q.includes("technology") ||
    q.includes("healthcare")
  ) {
    tables.add("sector_exposure_view");
  }

  if (
    q.includes("holding") ||
    q.includes("asset")
  ) {
    tables.add("holdings");
  }

  if (
    q.includes("country exposure") ||
    q.includes("geographic exposure") ||
    q.includes("country allocation")
    ) {
    tables.add("country_exposure_view");
    tables.add("funds");
    }
  
  if (
  q.includes("risk exposure") ||
  q.includes("country exposure") ||
  q.includes("contributes most")
) {

  tables.add("investors");
  tables.add("investor_transactions");
  tables.add("country_exposure_view");
  tables.add("fund_master_metrics");
  tables.add("funds");
}

if (
  q.includes("disney")
) {

  tables.add("investors");
}

if (
  q.includes("best performing") ||
  q.includes("top performing") ||
  q.includes("highest return") ||
  q.includes("cagr") ||
  q.includes("sharpe") ||
  q.includes("performance")
) {

  tables.add("fund_master_metrics");

  tables.add("fund_sharpe_view");

  tables.add("fund_performance_view");

}

if (entityType === "benchmark") {

  tables.add("benchmarks");

  tables.add("benchmark_performance_view");

  tables.add("fund_master_metrics");

  tables.add("funds");

}

if (
  q.includes("country exposure") ||
  q.includes("country-focused") ||
  q.includes("korea-focused") ||
  q.includes("us-focused") ||
  q.includes("europe-focused") ||
  q.includes("focused funds")
) {

  tables.add("country_exposure_view");

  tables.add("asset_country_map");

  tables.add("holdings");

}

if (
  q.includes("technology") ||
  q.includes("it sector") ||
  q.includes("it exposure") ||
  q.includes("sector exposure") ||
  q.includes("energy") ||
  q.includes("financials")
) {

  tables.add("sector_exposure_view");

  tables.add("holdings");

  tables.add("funds");
}



  return [...tables];
}


module.exports = { detectRelevantTables };
