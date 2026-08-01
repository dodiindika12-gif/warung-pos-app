import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  const defaultCategories = ['Umum', 'Sembako', 'Minuman', 'Makanan Ringan', 'Bumbu Dapur', 'Sabun & Pembersih', 'Obat & Vitamin', 'Lainnya'];
  
  for (const cat of defaultCategories) {
    try {
      await turso.execute({
        sql: 'INSERT INTO categories (name) VALUES (?)',
        args: [cat]
      });
    } catch(e) {
      if (!e.message.includes('UNIQUE')) {
        console.error("Error inserting", cat, e);
      }
    }
  }

  console.log("Remote categories table created and seeded!");
}

main();
