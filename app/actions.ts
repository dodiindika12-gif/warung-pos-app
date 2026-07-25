'use server'

import { turso } from './db';

// ==========================================
// MODUL PRODUK & INVENTARIS
// ==========================================
export async function getProducts() {
  const { rows } = await turso.execute('SELECT * FROM products ORDER BY name ASC');
  return JSON.parse(JSON.stringify(rows));
}

// UPDATE BARCODE: Menambahkan parameter barcode ke dalam insert database
export async function addProduct(data: { name: string; barcode: string; category: string; cost_price: number; selling_price: number; stock: number }) {
  await turso.execute({
    sql: 'INSERT INTO products (name, barcode, category, cost_price, selling_price, stock) VALUES (?, ?, ?, ?, ?, ?)',
    args: [data.name, data.barcode, data.category, data.cost_price, data.selling_price, data.stock]
  });
  return { success: true };
}

export async function updateProduct(id: number, data: { name: string; barcode: string; category: string; cost_price: number; selling_price: number; stock: number }) {
  await turso.execute({
    sql: 'UPDATE products SET name = ?, barcode = ?, category = ?, cost_price = ?, selling_price = ?, stock = ? WHERE id = ?',
    args: [data.name, data.barcode, data.category, data.cost_price, data.selling_price, data.stock, id]
  });
  return { success: true };
}

export async function deleteProduct(id: number) {
  await turso.execute({
    sql: 'DELETE FROM products WHERE id = ?',
    args: [id]
  });
  return { success: true };
}

export async function getProductsWithRecommendation() {
  const { rows } = await turso.execute(`
    SELECT 
      p.*,
      COALESCE(SUM(ti.quantity), 0) as sold_last_7_days
    FROM products p
    LEFT JOIN transaction_items ti ON p.id = ti.product_id 
    LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', '-7 days')
    GROUP BY p.id
    ORDER BY p.name ASC
  `);
  return JSON.parse(JSON.stringify(rows));
}

// ==========================================
// MODUL TRANSAKSI (KASIR)
// ==========================================
export async function processCheckout(cart: any[], paymentMethod: string, totalAmount: number) {
  const trxResult = await turso.execute({
    sql: 'INSERT INTO transactions (payment_method, total_amount) VALUES (?, ?) RETURNING id',
    args: [paymentMethod, totalAmount]
  });
  
  const transactionId = trxResult.rows[0].id;

  for (const item of cart) {
    await turso.execute({
      sql: 'INSERT INTO transaction_items (transaction_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      args: [transactionId, item.id, item.quantity, item.selling_price]
    });
    
    await turso.execute({
      sql: 'UPDATE products SET stock = stock - ? WHERE id = ?',
      args: [item.quantity, item.id]
    });
  }

  return { success: true };
}

export async function addExpense(description: string, amount: number) {
  await turso.execute({
    sql: 'INSERT INTO operational_expenses (description, amount) VALUES (?, ?)',
    args: [description, amount]
  });
  return { success: true };
}

// ==========================================
// MODUL PEMBELIAN (RESTOCK / KULAKAN)
// ==========================================
export async function getRecentPurchases() {
  const { rows } = await turso.execute(`
    SELECT p.id, pr.name as product_name, p.quantity, p.cost_price, p.total_cost, p.created_at 
    FROM purchases p
    JOIN products pr ON p.product_id = pr.id
    ORDER BY p.created_at DESC
    LIMIT 10
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function addPurchase(productId: number, quantity: number, costPrice: number) {
  const totalCost = quantity * costPrice;
  
  await turso.execute({
    sql: 'INSERT INTO purchases (product_id, quantity, cost_price, total_cost) VALUES (?, ?, ?, ?)',
    args: [productId, quantity, costPrice, totalCost]
  });

  await turso.execute({
    sql: 'UPDATE products SET stock = stock + ?, cost_price = ? WHERE id = ?',
    args: [quantity, costPrice, productId]
  });

  await turso.execute({
    sql: 'INSERT INTO operational_expenses (description, amount) VALUES (?, ?)',
    args: [`Kulakan - ID Barang: ${productId}`, totalCost]
  });

  return { success: true };
}

// ==========================================
// MODUL LAPORAN & ANALISIS (DENGAN PROFIT)
// ==========================================
export async function getDashboardStats() {
  const stats = await turso.execute(`
    SELECT SUM(total_amount) as total_revenue,
    SUM(CASE WHEN payment_method = 'Tunai' THEN total_amount ELSE 0 END) as total_tunai,
    SUM(CASE WHEN payment_method = 'QRIS' THEN total_amount ELSE 0 END) as total_qris,
    COUNT(id) as total_trx
    FROM transactions WHERE date(created_at) = date('now')
  `);

  const expenses = await turso.execute(`
    SELECT SUM(amount) as total_expense FROM operational_expenses WHERE date(created_at) = date('now')
  `);

  const cogs = await turso.execute(`
    SELECT SUM(ti.quantity * p.cost_price) as total_cogs
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE date(t.created_at) = date('now')
  `);

  const bestSellers = await turso.execute(`
    SELECT p.name, SUM(ti.quantity) as total_sold
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE date(t.created_at) = date('now')
    GROUP BY p.id ORDER BY total_sold DESC LIMIT 10
  `);

  const lowStock = await turso.execute(`
    SELECT name, stock, barcode FROM products WHERE stock <= 5 ORDER BY stock ASC LIMIT 10
  `);

  return {
    revenue: Number(stats.rows[0]?.total_revenue || 0),
    tunai: Number(stats.rows[0]?.total_tunai || 0),
    qris: Number(stats.rows[0]?.total_qris || 0),
    totalTrx: Number(stats.rows[0]?.total_trx || 0),
    expense: Number(expenses.rows[0]?.total_expense || 0),
    cogs: Number(cogs.rows[0]?.total_cogs || 0),
    bestSellers: bestSellers.rows.map(row => ({
      name: row.name, total_sold: Number(row.total_sold)
    })),
    lowStock: lowStock.rows.map(row => ({
      name: row.name, stock: Number(row.stock), barcode: row.barcode
    }))
  };
}

export async function getTransactionHistory(dateStr?: string) {
  let query = `
    WITH TrxCOGS AS (
        SELECT ti.transaction_id, SUM(ti.quantity * p.cost_price) as cogs
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        GROUP BY ti.transaction_id
    )
    SELECT 
        t.id, t.payment_method, t.total_amount, t.created_at,
        (t.total_amount - COALESCE(tc.cogs, 0)) as profit
    FROM transactions t
    LEFT JOIN TrxCOGS tc ON t.id = tc.transaction_id
  `;
  
  let args: any[] = [];
  if (dateStr) {
    query += ` WHERE date(t.created_at) = ? `;
    args.push(dateStr);
  }
  
  query += ` ORDER BY t.created_at DESC LIMIT 500 `;
  
  const { rows } = await turso.execute({ sql: query, args });
  return JSON.parse(JSON.stringify(rows));
}

export async function getTransactionDetails(transactionId: number) {
  const { rows } = await turso.execute({
    sql: `
      SELECT ti.quantity, ti.price, p.name 
      FROM transaction_items ti 
      JOIN products p ON ti.product_id = p.id 
      WHERE ti.transaction_id = ?
    `,
    args: [transactionId]
  });
  return JSON.parse(JSON.stringify(rows));
}

export async function refundTransaction(transactionId: number) {
  // 1. Get all items to restore stock
  const { rows: items } = await turso.execute({
    sql: 'SELECT product_id, quantity FROM transaction_items WHERE transaction_id = ?',
    args: [transactionId]
  });

  // 2. Restore stock for each item
  for (const item of items) {
    await turso.execute({
      sql: 'UPDATE products SET stock = stock + ? WHERE id = ?',
      args: [item.quantity, item.product_id]
    });
  }

  // 3. Delete transaction items
  await turso.execute({
    sql: 'DELETE FROM transaction_items WHERE transaction_id = ?',
    args: [transactionId]
  });

  // 4. Delete the main transaction
  await turso.execute({
    sql: 'DELETE FROM transactions WHERE id = ?',
    args: [transactionId]
  });

  return { success: true };
}

export async function getDailySales() {
  const { rows } = await turso.execute(`
    WITH DailyCOGS AS (
        SELECT date(t.created_at) as date, SUM(ti.quantity * p.cost_price) as cogs
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        GROUP BY date(t.created_at)
    )
    SELECT 
        date(t.created_at) as date, 
        SUM(t.total_amount) as total_revenue, 
        COUNT(t.id) as total_trx,
        (SUM(t.total_amount) - COALESCE(MAX(dc.cogs), 0)) as total_profit
    FROM transactions t
    LEFT JOIN DailyCOGS dc ON date(t.created_at) = dc.date
    GROUP BY date(t.created_at)
    ORDER BY date DESC LIMIT 30
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function getMonthlySales() {
  const { rows } = await turso.execute(`
    WITH MonthlyCOGS AS (
        SELECT strftime('%Y-%m', t.created_at) as month, SUM(ti.quantity * p.cost_price) as cogs
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        GROUP BY strftime('%Y-%m', t.created_at)
    )
    SELECT 
        strftime('%Y-%m', t.created_at) as month, 
        SUM(t.total_amount) as total_revenue, 
        COUNT(t.id) as total_trx,
        (SUM(t.total_amount) - COALESCE(MAX(mc.cogs), 0)) as total_profit
    FROM transactions t
    LEFT JOIN MonthlyCOGS mc ON strftime('%Y-%m', t.created_at) = mc.month
    GROUP BY strftime('%Y-%m', t.created_at)
    ORDER BY month DESC
  `);
  return JSON.parse(JSON.stringify(rows));
}