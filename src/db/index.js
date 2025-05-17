import knex from "knex";
import config from "../../knexfile.js"; // Import config object

const environment = process.env.NODE_ENV || "development";
/**
 * @type {import('knex').Knex}
 */
const db = knex(config[environment]);

async function checkDbConnection() {
  console.log(`Starting app with DB environment: ${environment}`);
  console.log(`Connecting to host: ${config[environment].connection.host}`);
  try {
    await db.raw("SELECT 1+1 AS result");
    console.log("✅ Database connection OK");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    process.exit(1); // Optional: exit if DB is critical and connection fails
  }
}

checkDbConnection();

export default db;
