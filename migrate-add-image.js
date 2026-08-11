import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  try {
    console.log("Menambahkan kolom image pada tabel products...");
    await turso.execute("ALTER TABLE products ADD COLUMN image TEXT;");
    console.log("Berhasil!");
  } catch (error) {
    if (error.message && error.message.includes("duplicate column name")) {
      console.log("Kolom image sudah ada.");
    } else {
      console.error("Gagal menambahkan kolom:", error);
    }
  }
}

main();
