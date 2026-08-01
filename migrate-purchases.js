const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    await turso.execute('ALTER TABLE purchases ADD COLUMN invoice_title TEXT');
    console.log("Added invoice_title");
  } catch(e) { console.log(e.message) }
  
  try {
    await turso.execute('ALTER TABLE purchases ADD COLUMN supplier TEXT');
    console.log("Added supplier");
  } catch(e) { console.log(e.message) }
}
run();
