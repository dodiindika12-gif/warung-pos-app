require('dotenv').config({ path: '.env' });
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS shopping_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL,
        is_checked INTEGER DEFAULT 0,
        FOREIGN KEY(product_id) REFERENCES products(id)
      )
    `);
    console.log('Table shopping_list created successfully.');
  } catch (e) {
    console.error(e);
  }
}
run();
