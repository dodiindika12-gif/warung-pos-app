import crypto from 'crypto';

function formatRupiah(angka: number) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function formatWaktu(timestamp: string) {
  return new Date(timestamp).toLocaleString('id-ID', {
    timeZone: 'Asia/Makassar',
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) + ' WITA';
}

import { turso } from '@/app/db';

async function getSetting(key: string) {
  const { rows } = await turso.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [key]
  });
  return rows[0]?.value as string | undefined;
}

export async function sendWebhook(transaction: any) {
  const url = await getSetting('webhook_url') || process.env.HERMES_WEBHOOK_URL;
  const token = await getSetting('webhook_token') || process.env.HERMES_API_TOKEN;
  const secret = await getSetting('webhook_secret') || process.env.HERMES_WEBHOOK_SECRET;

  // Jika URL tidak di-set, skip pengiriman webhook
  if (!url) {
    console.warn("Webhook URL belum dikonfigurasi. Silakan set di pengaturan.");
    return;
  }

  try {
    let message = `✅ *Penjualan Baru!*\n`;
    message += `🆔 #${transaction.transaction_id}\n`;
    message += `💳 ${transaction.payment_method}\n`;
    message += `🕐 ${formatWaktu(transaction.timestamp)}\n\n`;
    message += `*Barang terjual:*\n`;
    message += `\`\`\`\n`;
    message += `Item                Qty    Harga\n`;
    message += `─────────────────── ────── ──────────\n`;
    
    transaction.items.forEach((item: any) => {
      // Membatasi panjang nama item agar tabel tidak berantakan
      const safeName = item.name.length > 19 ? item.name.substring(0, 16) + '...' : item.name;
      message += `${safeName.padEnd(20)} ${(item.quantity+'x').padEnd(6)} ${formatRupiah(item.subtotal)}\n`;
    });
    
    message += `\`\`\`\n\n`;
    message += `💰 *Total: ${formatRupiah(transaction.total_amount)}*`;

    // Gabungkan pesan yang diformat ke dalam payload asli
    const payload = { ...transaction, message };
    const bodyString = JSON.stringify(payload);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (secret) {
      const signature = crypto
        .createHmac('sha256', secret)
        .update(bodyString)
        .digest('hex');
      headers['X-Hub-Signature-256'] = `sha256=${signature}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: bodyString
    });

    if (!response.ok) {
      console.error("Gagal mengirim webhook:", await response.text());
    } else {
      console.log("Webhook JSON berhasil dikirim.");
    }
  } catch (error) {
    console.error("Error saat memanggil Webhook:", error);
  }
}
