'use server'

import { turso } from './db';
import { revalidatePath } from 'next/cache';

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
    SELECT p.id, pr.name as product_name, p.quantity, p.cost_price, p.total_cost, p.created_at, p.invoice_title, p.supplier 
    FROM purchases p
    JOIN products pr ON p.product_id = pr.id
    ORDER BY p.created_at DESC
    LIMIT 20
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function processBulkPurchase(invoiceTitle: string, supplier: string, items: { productId: number, quantity: number, costPrice: number, sellingPrice: number }[], discount: number = 0) {
  let grandTotal = 0;
  
  for (const item of items) {
    grandTotal += (item.quantity * item.costPrice);
  }

  for (const item of items) {
    const itemSubtotal = item.quantity * item.costPrice;
    
    let itemDiscount = 0;
    if (grandTotal > 0 && discount > 0) {
      itemDiscount = (itemSubtotal / grandTotal) * discount;
    }
    
    const discountedTotalCost = Math.max(0, itemSubtotal - itemDiscount);
    const discountedCostPrice = item.quantity > 0 ? (discountedTotalCost / item.quantity) : 0;
    
    await turso.execute({
      sql: 'INSERT INTO purchases (product_id, quantity, cost_price, total_cost, invoice_title, supplier) VALUES (?, ?, ?, ?, ?, ?)',
      args: [item.productId, item.quantity, discountedCostPrice, discountedTotalCost, invoiceTitle, supplier]
    });

    await turso.execute({
      sql: 'UPDATE products SET stock = stock + ?, cost_price = ?, selling_price = ? WHERE id = ?',
      args: [item.quantity, discountedCostPrice, item.sellingPrice, item.productId]
    });
  }

  // Removed inserting Kulakan into operational_expenses per user request
  // so it does not reduce the daily Net Profit report.

  return { success: true };
}

// ==========================================
// MODUL LAPORAN & ANALISIS (DENGAN PROFIT)
// ==========================================
export async function getDashboardStats(startDate?: string, endDate?: string) {
  let dateFilter = "date(created_at) = date('now')";
  let tDateFilter = "date(t.created_at) = date('now')";
  
  if (startDate && endDate) {
    dateFilter = `date(created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
    tDateFilter = `date(t.created_at) BETWEEN date('${startDate}') AND date('${endDate}')`;
  }

  const stats = await turso.execute(`
    SELECT SUM(total_amount) as total_revenue,
    SUM(CASE WHEN payment_method = 'Tunai' THEN total_amount ELSE 0 END) as total_tunai,
    SUM(CASE WHEN payment_method = 'QRIS' THEN total_amount ELSE 0 END) as total_qris,
    COUNT(id) as total_trx
    FROM transactions WHERE ${dateFilter}
  `);

  const expenses = await turso.execute(`
    SELECT SUM(amount) as total_expense FROM operational_expenses WHERE ${dateFilter}
  `);

  const cogs = await turso.execute(`
    SELECT SUM(ti.quantity * p.cost_price) as total_cogs
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE ${tDateFilter}
  `);

  const bestSellers = await turso.execute(`
    SELECT p.name, SUM(ti.quantity) as total_sold
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE ${tDateFilter}
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

export async function getChartData(startDate: string, endDate: string) {
  const query = `
    WITH RECURSIVE dates(date) AS (
      SELECT date(?)
      UNION ALL
      SELECT date(date, '+1 day')
      FROM dates
      WHERE date < date(?)
    ),
    DailyRevenue AS (
      SELECT date(created_at) as dt, SUM(total_amount) as revenue
      FROM transactions
      WHERE date(created_at) BETWEEN date(?) AND date(?)
      GROUP BY date(created_at)
    ),
    DailyExpense AS (
      SELECT date(created_at) as dt, SUM(amount) as expense
      FROM operational_expenses
      WHERE date(created_at) BETWEEN date(?) AND date(?)
      GROUP BY date(created_at)
    ),
    DailyCOGS AS (
      SELECT date(t.created_at) as dt, SUM(ti.quantity * p.cost_price) as cogs
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE date(t.created_at) BETWEEN date(?) AND date(?)
      GROUP BY date(t.created_at)
    )
    SELECT 
      d.date, 
      COALESCE(r.revenue, 0) as revenue,
      COALESCE(e.expense, 0) as expense,
      COALESCE(c.cogs, 0) as cogs,
      (COALESCE(r.revenue, 0) - COALESCE(e.expense, 0) - COALESCE(c.cogs, 0)) as profit
    FROM dates d
    LEFT JOIN DailyRevenue r ON d.date = r.dt
    LEFT JOIN DailyExpense e ON d.date = e.dt
    LEFT JOIN DailyCOGS c ON d.date = c.dt
    ORDER BY d.date ASC;
  `;

  const { rows } = await turso.execute({
    sql: query,
    args: [startDate, endDate, startDate, endDate, startDate, endDate, startDate, endDate]
  });

  return JSON.parse(JSON.stringify(rows));
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

// --- SHOPPING LIST ACTIONS ---

export async function getShoppingList() {
  const { rows } = await turso.execute(`
    SELECT 
      s.id, s.product_id, s.quantity, s.is_checked, 
      p.name, p.barcode, p.stock, p.cost_price, p.selling_price,
      COALESCE(SUM(ti.quantity), 0) as sold_last_7_days
    FROM shopping_list s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN transaction_items ti ON p.id = ti.product_id 
    LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', '-7 days')
    GROUP BY s.id
    ORDER BY s.id DESC
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function addToShoppingList(productId: number, qty: number) {
  const existing = await turso.execute({
    sql: 'SELECT id, quantity FROM shopping_list WHERE product_id = ?',
    args: [productId]
  });

  if (existing.rows.length > 0) {
    const newQty = (existing.rows[0].quantity as number) + qty;
    await turso.execute({
      sql: 'UPDATE shopping_list SET quantity = ?, is_checked = 0 WHERE id = ?',
      args: [newQty, existing.rows[0].id]
    });
  } else {
    await turso.execute({
      sql: 'INSERT INTO shopping_list (product_id, quantity, is_checked) VALUES (?, ?, 0)',
      args: [productId, qty]
    });
  }
  revalidatePath('/belanja');
  return { success: true };
}

export async function toggleShoppingListItem(id: number, isChecked: boolean) {
  await turso.execute({
    sql: 'UPDATE shopping_list SET is_checked = ? WHERE id = ?',
    args: [isChecked ? 1 : 0, id]
  });
  revalidatePath('/belanja');
  return { success: true };
}

export async function deleteShoppingListItem(id: number) {
  await turso.execute({
    sql: 'DELETE FROM shopping_list WHERE id = ?',
    args: [id]
  });
  revalidatePath('/belanja');
  return { success: true };
}

export async function clearShoppingList() {
  await turso.execute('DELETE FROM shopping_list');
  revalidatePath('/belanja');
  return { success: true };
}

export async function generateShoppingList() {
  const data = await getProductsWithRecommendation();
  
  for (const p of data) {
    const estimasiKebutuhan = (p.sold_last_7_days as number) > 0 ? (p.sold_last_7_days as number) : 5;
    if ((p.stock as number) <= estimasiKebutuhan) {
      const qtyToBuy = estimasiKebutuhan - (p.stock as number) + 10; 
      
      const existing = await turso.execute({
        sql: 'SELECT id FROM shopping_list WHERE product_id = ?',
        args: [p.id]
      });

      if (existing.rows.length === 0) {
        await turso.execute({
          sql: 'INSERT INTO shopping_list (product_id, quantity, is_checked) VALUES (?, ?, 0)',
          args: [p.id, qtyToBuy]
        });
      }
    }
  }
  revalidatePath('/belanja');
  return { success: true };
}

export async function removeCheckedFromShoppingList() {
  await turso.execute('DELETE FROM shopping_list WHERE is_checked = 1');
  revalidatePath('/belanja');
  return { success: true };
}