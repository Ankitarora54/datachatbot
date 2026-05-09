const businessRules = {
  "best performing portfolio": {
    metric: "cagr",
    table: "fund_master_metrics",
    order: "DESC",
    supportingColumns: [
      "cagr",
      "risk_adjusted_return"
    ]
  },

  "safest fund": {
    metric: "risk",
    table: "fund_master_metrics",
    order: "ASC",
    supportingColumns: [
      "risk",
      "diversification_score"
    ]
  },

  "most diversified": {
    metric: "diversification_score",
    table: "fund_master_metrics",
    order: "DESC",
    supportingColumns: [
      "diversification_score",
      "concentration_index"
    ]
  }
};

module.exports = { businessRules };