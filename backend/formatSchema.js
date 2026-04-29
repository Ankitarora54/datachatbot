function formatSchema(schema) {
  return Object.entries(schema)
    .map(([table, cols]) => `${table}: ${cols.join(", ")}`)
    .join("\n");
}

// function formatSchema(schema) {
//   let text = "Database Schema:\n";

//   for (const table in schema) {
//     text += `\nTable: ${table}\n`;

//     schema[table].forEach(col => {
//       text += `- ${col.COLUMN_NAME} (${col.DATA_TYPE})\n`;
//     });
//   }

//   return text;
// }

module.exports = { formatSchema };