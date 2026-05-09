const metricDictionary = {

  sharpe_ratio: {
    table: "fund_sharpe_view",
    supporting_columns: [
      "sharpe_ratio",
      "cagr",
      "risk"
    ]
  },

  cagr: {
    table: "fund_master_metrics",
    supporting_columns: [
      "cagr",
      "risk_adjusted_return"
    ]
  },

  risk_adjusted_return: {
    table: "fund_master_metrics",
    supporting_columns: [
      "risk_adjusted_return",
      "risk"
    ]
  },

  diversification_score: {
    table: "fund_master_metrics",
    supporting_columns: [
      "diversification_score",
      "concentration_index"
    ]
  },

  risk: {
    table: "fund_master_metrics",
    supporting_columns: [
      "risk"
    ]
  }
};

module.exports = { metricDictionary };