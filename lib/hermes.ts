export async function sendWebhook(data: any) {
  const url = process.env.HERMES_WEBHOOK_URL;
  const token = process.env.HERMES_API_TOKEN;

  // Jika URL tidak di-set, skip pengiriman webhook
  if (!url) {
    console.warn("Webhook URL belum dikonfigurasi. Silakan set HERMES_WEBHOOK_URL di .env");
    return;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
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
