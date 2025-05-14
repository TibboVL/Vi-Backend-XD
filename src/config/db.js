// src/config/db.js
import pgPromise from "pg-promise";
import dotenv from "dotenv";
dotenv.config();
const pgp = pgPromise(); // ← This is the fix

const cn = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_IDENTIFIER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 30, // use up to 30 connections
};
const db = pgp(cn);

// tests connection and returns Postgres server version,
// if successful; or else rejects with connection error:
export async function testConnection() {
  const c = await db.connect(); // try to connect
  c.done(); // success, release connection
  return c.client.serverVersion; // return server version
}
