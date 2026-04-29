const { queryDB } = require("../db");

async function loadSchema() {
  const tables = await queryDB(`
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
  `);

  const schema = {};

  for (let t of tables) {
    const tableName = t.TABLE_NAME;

    const columns = await queryDB(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${tableName}'
    `);

    schema[tableName] = columns.map(c => c.COLUMN_NAME);
  }

  return schema;
}

// async function loadSchema() {
//   // Get tables & views
//   const tables = await queryDB(`
//     SELECT TABLE_NAME 
//     FROM INFORMATION_SCHEMA.TABLES
//     WHERE TABLE_TYPE IN ('BASE TABLE', 'VIEW')
//   `);

//   let schemaText = "";

//   for (let t of tables) {
//     const tableName = t.TABLE_NAME;

//     const columns = await queryDB(`
//       SELECT COLUMN_NAME, DATA_TYPE
//       FROM INFORMATION_SCHEMA.COLUMNS
//       WHERE TABLE_NAME = '${tableName}'
//     `);

//     const colText = columns
//       .map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`)
//       .join(", ");

//     schemaText += `\n${tableName}: ${colText}\n`;
//   }

//   return schemaText;
// }

// module.exports = { loadSchema };