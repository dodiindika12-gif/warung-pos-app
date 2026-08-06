import crypto from 'crypto';

export async function sendWebhook(data: any) {
  const url = process.env.HERMES_WEBHOOK_URL;
  const token = process.env.HERMES_API_TOKEN;
  const secret = process.env.HERMES_WEBHOOK_SECRET;

  // Jika URL tidak di-set, skip pengiriman webhook
  if (!url) {
    console.warn("Webhook URL belum dikonfigurasi. Silakan set HERMES_WEBHOOK_URL di .env");
    return;
  }

  try {
    const bodyString = JSON.stringify(data);
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
