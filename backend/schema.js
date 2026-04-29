const { queryDB } = require("./db");

let cachedSchema = null;
let lastFetch = 0;

async function getSchema() {
  const now = Date.now();

  // cache for 5 mins
  if (cachedSchema && now - lastFetch < 5 * 60 * 1000) {
    return cachedSchema;
  }

  // ✅ Get all tables (PostgreSQL)
  const tables = await queryDB(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  `);

  const schema = {};

  for (const row of tables) {
    const table = row.table_name;

    const cols = await queryDB(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = '${table}'
    `);

    schema[table] = cols;
  }

  cachedSchema = schema;
  lastFetch = now;

  return schema;
}

module.exports = { getSchema };

// // const sql = require("mssql");
// const { queryDB } = require("../db");
// const pool = require("./dbConfig");

// let cachedSchema = null;
// let lastFetch = 0;

// async function getSchema() {
//   const now = Date.now();

//   if (cachedSchema && now - lastFetch < 5 * 60 * 1000) {
//     return cachedSchema;
//   }

//   await sql.connect(pool);

//   const tables = await sql.query(`
//     SELECT TABLE_NAME
//     FROM INFORMATION_SCHEMA.TABLES
//     WHERE TABLE_TYPE = 'BASE TABLE'
//   `);

//   const schema = {};

//   for (const row of tables.recordset) {
//     const table = row.TABLE_NAME;

//     const cols = await sql.query(`
//       SELECT COLUMN_NAME, DATA_TYPE
//       FROM INFORMATION_SCHEMA.COLUMNS
//       WHERE TABLE_NAME = '${table}'
//     `);

//     schema[table] = cols.recordset;
//   }

//   cachedSchema = schema;
//   lastFetch = now;

//   return schema;
// }

// module.exports = { getSchema };