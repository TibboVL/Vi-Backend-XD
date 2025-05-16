import knex from "knex";
import "../../knexfile";

const db = knex(process.env.NODE_ENV); // or use process.env.NODE_ENV
module.exports = db;
