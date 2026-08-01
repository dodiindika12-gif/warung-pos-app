const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  const res = await turso.execute(`SELECT sql FROM sqlite_master WHERE type='table' AND name='purchases'`);
  console.log(res.rows[0]);
}
run();
