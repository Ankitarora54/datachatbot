function formatSchema(schema) {

  const relationships = [
    "fund_aum.fund_id -> funds.fund_id",
    "nav_history.fund_id -> funds.fund_id",
    "transactions.fund_id -> funds.fund_id",
    "investor_transactions.fund_id -> funds.fund_id",
    "investor_transactions.investor_id -> investors.investor_id",
    "holdings.fund_id -> funds.fund_id"
  ];

  let output = "";

  output += `DATABASE SCHEMA\n\n`;

 
  for (const [tableName, tableData] of Object.entries(schema)) {

  output += `TABLE OR VIEW: ${tableName}\n`;

  output += `DESCRIPTION:\n`;
  output += `${tableData.description || "N/A"}\n\n`;

  output += `COLUMNS:\n`;

  for (const col of tableData.columns) {

    output += `- ${col.name} (${col.type})\n`;

    // include sample values
    if (
      col.sample_values &&
      col.sample_values.length
    ) {

      output += `  sample values: ${col.sample_values.join(", ")}\n`;
    }
  }

  output += `\n`;
  }

  output += `RELATIONSHIPS:\n`;

  for (const rel of relationships) {
    output += `- ${rel}\n`;
  }

  return output;
}

module.exports = { formatSchema };
