'use server'

import { turso } from './db';
import { revalidatePath } from 'next/cache';
import { sendWebhook } from '@/lib/hermes';

// ==========================================
// MODUL PRODUK & INVENTARIS
// ==========================================
export async function getProducts() {
  const { rows } = await turso.execute('SELECT * FROM products ORDER BY name ASC');
  return JSON.parse(JSON.stringify(rows));
}

// UPDATE BARCODE: Menambahkan parameter barcode ke dalam insert database
export async function addProduct(data: { name: string; barcode: string; category: string; cost_price: number; selling_price: number; stock: number }) {
  const result = await turso.execute({
    sql: 'INSERT INTO products (name, barcode, category, cost_price, selling_price, stock) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
    args: [data.name, data.barcode, data.category, data.cost_price, data.selling_price, data.stock]
  });
  
  if (data.stock > 0) {
    const newId = result.rows[0].id;
    await turso.execute({
      sql: 'INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)',
      args: [newId, data.stock, 'Baru']
    });
  }
  
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

export async function bulkUpdateCategory(ids: number[], category: string) {
  if (ids.length === 0) return { success: true };
  const placeholders = ids.map(() => '?').join(',');
  await turso.execute({
    sql: `UPDATE products SET category = ? WHERE id IN (${placeholders})`,
    args: [category, ...ids]
  });
  revalidatePath('/produk');
  revalidatePath('/');
  return { success: true };
}

export async function processOpname(items: {id: number, realStock: number}[]) {
  try {
    const statements: any[] = [];
    
    for (const item of items) {
      const { rows } = await turso.execute({
        sql: 'SELECT stock FROM products WHERE id = ?',
        args: [item.id]
      });
      const oldStock = rows[0]?.stock as number || 0;
      const diff = item.realStock - oldStock;
      
      if (diff !== 0) {
        statements.push({
          sql: 'UPDATE products SET stock = ? WHERE id = ?',
          args: [item.realStock, item.id]
        });
        statements.push({
          sql: 'INSERT INTO stock_history (product_id, change_amount, reason) VALUES (?, ?, ?)',
          args: [item.id, diff, 'Opname']
        });
      }
    }
    
    if (statements.length > 0) {
      await turso.batch(statements, 'write');
    }
    revalidatePath('/produk');
    return { success: true };
  } catch (error) {
    console.error('Opname Error:', error);
    return { success: false, error: 'Gagal memproses Stock Opname' };
  }
}

export async function getProductsWithRecommendation() {
  const { rows } = await turso.execute(`
    SELECT 
      p.*,
      COALESCE(SUM(ti.quantity), 0) as sold_last_7_days
    FROM products p
    LEFT JOIN transaction_items ti ON p.id = ti.product_id 
    LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', '+8 hours', '-7 days')
    GROUP BY p.id
    ORDER BY p.name ASC
  `);
  return JSON.parse(JSON.stringify(rows));
}

// ==========================================
// MODUL KATEGORI
// ==========================================
export async function getCategories() {
  const { rows } = await turso.execute('SELECT * FROM categories ORDER BY name ASC');
  return JSON.parse(JSON.stringify(rows));
}

export async function addCategory(name: string) {
  try {
    await turso.execute({
      sql: 'INSERT INTO categories (name) VALUES (?)',
      args: [name]
    });
    revalidatePath('/produk');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) {
      return { success: false, error: 'Kategori sudah ada!' };
    }
    return { success: false, error: e.message };
  }
}

export async function updateCategory(id: number, name: string) {
  try {
    await turso.execute({
      sql: 'UPDATE categories SET name = ? WHERE id = ?',
      args: [name, id]
    });
    revalidatePath('/produk');
    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    if (e.message.includes('UNIQUE')) {
      return { success: false, error: 'Nama kategori sudah dipakai!' };
    }
    return { success: false, error: e.message };
  }
}

export async function deleteCategory(id: number) {
  await turso.execute({
    sql: 'DELETE FROM categories WHERE id = ?',
    args: [id]
  });
  revalidatePath('/produk');
  revalidatePath('/');
  return { success: true };
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

    await turso.execute({
      sql: 'INSERT INTO stock_history (product_id, change_amount, reason, reference_id) VALUES (?, ?, ?, ?)',
      args: [item.id, -item.quantity, 'Penjualan', transactionId]
    });
  }

  // Notifikasi Webhook dengan Raw JSON
  const webhookPayload = {
    event: 'new_sale',
    transaction_id: transactionId,
    payment_method: paymentMethod,
    total_amount: totalAmount,
    timestamp: new Date().toISOString(),
    items: cart.map(item => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.selling_price,
      subtotal: item.quantity * item.selling_price
    }))
  };
  
  // Mengambil konfigurasi dari DB *sebelum* action selesai agar promise tidak dibunuh
  const [webhookUrl, webhookToken, webhookSecret] = await Promise.all([
    getSetting('webhook_url'),
    getSetting('webhook_token'),
    getSetting('webhook_secret')
  ]);

  // Memanggil webhook
  sendWebhook(webhookPayload, webhookUrl, webhookToken, webhookSecret).catch(console.error);

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
    
    const purResult = await turso.execute({
      sql: 'INSERT INTO purchases (product_id, quantity, cost_price, total_cost, invoice_title, supplier) VALUES (?, ?, ?, ?, ?, ?) RETURNING id',
      args: [item.productId, item.quantity, discountedCostPrice, discountedTotalCost, invoiceTitle, supplier]
    });

    const purchaseId = purResult.rows[0].id;

    await turso.execute({
      sql: 'UPDATE products SET stock = stock + ?, cost_price = ?, selling_price = ? WHERE id = ?',
      args: [item.quantity, discountedCostPrice, item.sellingPrice, item.productId]
    });

    await turso.execute({
      sql: 'INSERT INTO stock_history (product_id, change_amount, reason, reference_id) VALUES (?, ?, ?, ?)',
      args: [item.productId, item.quantity, 'Pembelian', purchaseId]
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
  let dateFilter = "date(created_at, '+8 hours') = date('now', '+8 hours')";
  let tDateFilter = "date(t.created_at, '+8 hours') = date('now', '+8 hours')";
  
  if (startDate && endDate) {
    dateFilter = `date(created_at, '+8 hours') BETWEEN date('${startDate}') AND date('${endDate}')`;
    tDateFilter = `date(t.created_at, '+8 hours') BETWEEN date('${startDate}') AND date('${endDate}')`;
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

  const wholesalePurchases = await turso.execute(`
    SELECT SUM(total_cost) as total_purchases FROM purchases WHERE ${dateFilter}
  `);

  const purchaseInvoices = await turso.execute(`
    SELECT invoice_title, supplier, date(created_at, '+8 hours') as date, SUM(total_cost) as total
    FROM purchases
    WHERE ${dateFilter}
    GROUP BY invoice_title, supplier, date(created_at, '+8 hours')
    ORDER BY date DESC
  `);

  return {
    revenue: Number(stats.rows[0]?.total_revenue || 0),
    tunai: Number(stats.rows[0]?.total_tunai || 0),
    qris: Number(stats.rows[0]?.total_qris || 0),
    totalTrx: Number(stats.rows[0]?.total_trx || 0),
    expense: Number(expenses.rows[0]?.total_expense || 0),
    cogs: Number(cogs.rows[0]?.total_cogs || 0),
    purchases: Number(wholesalePurchases.rows[0]?.total_purchases || 0),
    purchaseInvoices: purchaseInvoices.rows.map(row => ({
      invoice_title: row.invoice_title, supplier: row.supplier, date: row.date, total: Number(row.total)
    })),
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
      SELECT date(created_at, '+8 hours') as dt, SUM(total_amount) as revenue
      FROM transactions
      WHERE date(created_at, '+8 hours') BETWEEN date(?) AND date(?)
      GROUP BY date(created_at, '+8 hours')
    ),
    DailyExpense AS (
      SELECT date(created_at, '+8 hours') as dt, SUM(amount) as expense
      FROM operational_expenses
      WHERE date(created_at, '+8 hours') BETWEEN date(?) AND date(?)
      GROUP BY date(created_at, '+8 hours')
    ),
    DailyCOGS AS (
      SELECT date(t.created_at, '+8 hours') as dt, SUM(ti.quantity * p.cost_price) as cogs
      FROM transaction_items ti
      JOIN products p ON ti.product_id = p.id
      JOIN transactions t ON ti.transaction_id = t.id
      WHERE date(t.created_at, '+8 hours') BETWEEN date(?) AND date(?)
      GROUP BY date(t.created_at, '+8 hours')
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
    query += ` WHERE date(t.created_at, '+8 hours') = ? `;
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

    await turso.execute({
      sql: 'INSERT INTO stock_history (product_id, change_amount, reason, reference_id) VALUES (?, ?, ?, ?)',
      args: [item.product_id, item.quantity, 'Retur Penjualan', transactionId]
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
        SELECT date(t.created_at, '+8 hours') as date, SUM(ti.quantity * p.cost_price) as cogs
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        GROUP BY date(t.created_at, '+8 hours')
    )
    SELECT 
        date(t.created_at, '+8 hours') as date, 
        SUM(t.total_amount) as total_revenue, 
        COUNT(t.id) as total_trx,
        (SUM(t.total_amount) - COALESCE(MAX(dc.cogs), 0)) as total_profit
    FROM transactions t
    LEFT JOIN DailyCOGS dc ON date(t.created_at, '+8 hours') = dc.date
    GROUP BY date(t.created_at, '+8 hours')
    ORDER BY date DESC LIMIT 30
  `);
  return JSON.parse(JSON.stringify(rows));
}

export async function getMonthlySales() {
  const { rows } = await turso.execute(`
    WITH MonthlyCOGS AS (
        SELECT strftime('%Y-%m', t.created_at, '+8 hours') as month, SUM(ti.quantity * p.cost_price) as cogs
        FROM transactions t
        JOIN transaction_items ti ON t.id = ti.transaction_id
        JOIN products p ON ti.product_id = p.id
        GROUP BY strftime('%Y-%m', t.created_at, '+8 hours')
    )
    SELECT 
        strftime('%Y-%m', t.created_at, '+8 hours') as month, 
        SUM(t.total_amount) as total_revenue, 
        COUNT(t.id) as total_trx,
        (SUM(t.total_amount) - COALESCE(MAX(mc.cogs), 0)) as total_profit
    FROM transactions t
    LEFT JOIN MonthlyCOGS mc ON strftime('%Y-%m', t.created_at, '+8 hours') = mc.month
    GROUP BY strftime('%Y-%m', t.created_at, '+8 hours')
    ORDER BY month DESC
  `);
  return JSON.parse(JSON.stringify(rows));
}

// --- SHOPPING LIST ACTIONS ---

export async function getShoppingList() {
  const { rows } = await turso.execute(`
    SELECT 
      s.id, s.product_id, s.quantity, s.is_checked, 
      p.name, p.barcode, p.stock, p.cost_price, p.selling_price, p.category,
      COALESCE(SUM(ti.quantity), 0) as sold_last_7_days
    FROM shopping_list s
    JOIN products p ON s.product_id = p.id
    LEFT JOIN transaction_items ti ON p.id = ti.product_id 
    LEFT JOIN transactions t ON ti.transaction_id = t.id AND t.created_at >= date('now', '+8 hours', '-7 days')
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

export async function getStockHistory(productId: number) {
  const { rows } = await turso.execute({
    sql: 'SELECT * FROM stock_history WHERE product_id = ? ORDER BY created_at DESC',
    args: [productId]
  });
  return JSON.parse(JSON.stringify(rows));
}
// ==========================================
// SETTINGS
// ==========================================
export async function getSetting(key: string) {
  const { rows } = await turso.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key]
  });
  return rows[0]?.value as string | undefined;
}

export async function saveSetting(key: string, value: string) {
  await turso.execute({
    sql: "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    args: [key, value]
  });
}
