import dotenv from "dotenv";
dotenv.config();

export default {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_IDENTIFIER,
    },
    migrations: {
      directory: "./src/db/migrations",
    },
    seeds: {
      directory: "./src/db/seeds",
    },
  },
};
