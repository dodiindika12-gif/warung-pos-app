import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS stock_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      change_amount INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reference_id INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    );
  `);
  console.log("Remote stock_history table created successfully!");
}

main();
