const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // required for Render + Supabase
  },
  family: 4,
});

async function queryDB(query) {
  const result = await pool.query(query);
  return result.rows;
}

pool.connect()
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => {
    console.error("Database Connection Failed");
    console.error(err);
  });

module.exports = { queryDB };

// const pool = require("./dbconfig"); // Import the pool from your config file

// async function queryDB(query, params) {
//   try {
//     // Using .query directly from the pool is the standard way to handle 
//     // single queries without manual connection management
//     const result = await pool.query(query, params);
//     return result.rows;
//   } catch (err) {
//     console.error("Database connection error:", err.stack);
//     throw err;
//   }
// }

// module.exports = { queryDB };