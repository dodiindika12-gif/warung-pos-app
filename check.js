require('dotenv').config({ path: '.env' });
const { createClient } = require('@libsql/client');

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  try {
    const stats = await turso.execute("SELECT SUM(total_amount) as rev FROM transactions WHERE date(created_at) = date('now')");
    const expenses = await turso.execute("SELECT * FROM operational_expenses WHERE date(created_at) = date('now')");
    const cogs = await turso.execute("SELECT p.name, ti.quantity, p.cost_price, p.selling_price, ti.quantity * p.cost_price as total_cogs FROM transaction_items ti JOIN products p ON ti.product_id = p.id JOIN transactions t ON ti.transaction_id = t.id WHERE date(t.created_at) = date('now')");

    console.log('--- REVENUE ---');
    console.log('Total Rev:', stats.rows[0].rev);
    
    console.log('\n--- EXPENSES ---');
    console.log(expenses.rows);
    
    console.log('\n--- ITEMS SOLD (COGS) ---');
    console.table(cogs.rows);
  } catch (e) {
    console.error(e);
  }
}
run();
