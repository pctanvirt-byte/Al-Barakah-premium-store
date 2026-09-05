import { Order } from '../types';

/**
 * Format an order into a clean, legible HTML message for Telegram
 */
export function formatOrderForTelegram(order: Order): string {
  const orderId = order.trackingCode || order.id;
  const customerName = order.customerName || order.customer?.fullName || 'সম্মানিত গ্রাহক';
  const customerPhone = order.customerPhone || order.customer?.phone || 'N/A';
  const address = order.deliveryAddress || order.customer?.address || 'N/A';
  const city = order.cityDistrict || order.customer?.city ? ` (${order.cityDistrict || order.customer?.city})` : '';
  const total = Number(order.totalAmount ?? order.total ?? 0).toLocaleString();
  const paymentMethod = order.paymentMethod || 'Cash On Delivery';
  const paymentStatus = order.deliveryPaymentStatus || order.paymentStatus || 'Pending';
  const notes = order.notes ? `\n📝 <b>নোট:</b> <i>"${order.notes}"</i>` : '';

  // Format Items
  let itemsText = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsText = order.items
      .map((it: any, index: number) => {
        const name = it.name || it.productNameSnapshot || 'Product';
        const qty = it.quantity || 1;
        const price = Number(it.price || it.unitPrice || 0).toLocaleString();
        const variant = it.selectedColor || it.selectedSize ? ` [${[it.selectedColor, it.selectedSize].filter(Boolean).join(', ')}]` : '';
        return `  ${index + 1}. <b>${name}</b>${variant} x ${qty} = ৳${price}`;
      })
      .join('\n');
  } else {
    itemsText = '  • পণ্য বিবরণ সংরক্ষিত';
  }

  return `🎉 <b>নতুন অর্ডার এসেছে! [AL BARAKAH PREMIUM]</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>অর্ডার আইডি:</b> #${orderId}
👤 <b>গ্রাহকের নাম:</b> ${customerName}
📞 <b>মোবাইল নম্বর:</b> <code>${customerPhone}</code>
📍 <b>ঠিকানা:</b> ${address}${city}
💰 <b>মোট বিল:</b> ৳${total} (${paymentMethod})
💳 <b>পেমেন্ট স্ট্যাটাস:</b> ${paymentStatus}${notes}

🛍️ <b>অর্ডারকৃত পণ্যসমূহ:</b>
${itemsText}
━━━━━━━━━━━━━━━━━━━━
⏰ <i>${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</i>
👉 <i>অর্ডার প্রসেস করতে অ্যাডমিন ড্যাশবোর্ডে লগইন করুন</i>`;
}

/**
 * Dispatch an order alert to Telegram
 */
export async function dispatchTelegramOrderNotification(
  order: Order,
  telegramConfig?: { enabled: boolean; botToken: string; chatId: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!telegramConfig || !telegramConfig.enabled || !telegramConfig.botToken || !telegramConfig.chatId) {
    return { success: false, message: 'Telegram configuration is not active' };
  }

  const messageText = formatOrderForTelegram(order);

  // Try server endpoint first
  try {
    const res = await fetch('/api/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: telegramConfig.botToken,
        chatId: telegramConfig.chatId,
        message: messageText,
        orderId: order.id,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, message: 'Delivered via server' };
      }
    }
  } catch (serverErr) {
    console.warn('Server telegram relay notice, falling back to direct API:', serverErr);
  }

  // Direct Telegram Bot API fallback
  try {
    const url = `https://api.telegram.org/bot${telegramConfig.botToken.trim()}/sendMessage`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramConfig.chatId.trim(),
        text: messageText,
        parse_mode: 'HTML',
      }),
    });

    const data = await resp.json();
    if (data.ok) {
      return { success: true, message: 'Delivered directly to Telegram' };
    } else {
      return { success: false, error: data.description || 'Telegram API rejected message' };
    }
  } catch (err: any) {
    console.error('Telegram dispatch error:', err);
    return { success: false, error: err.message || 'Network error sending to Telegram' };
  }
}

/**
 * Test Telegram bot connection and chat ID
 */
export async function testTelegramBotConnection(
  botToken: string,
  chatId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  if (!botToken || !chatId) {
    return { success: false, error: 'বট টোকেন এবং চ্যাট আইডি দুটোই পূরণ করতে হবে!' };
  }

  const testMessage = `🔔 <b>[AL BARAKAH PREMIUM] টেস্ট অ্যালার্ট</b>
━━━━━━━━━━━━━━━━━━━━
অভিনন্দন! আপনার টেলিগ্রাম নোটিফিকেশন সফলভাবে কানেক্ট হয়েছে। 🚀

এখন থেকে ওয়েবসাইটে যেকোনো নতুন কাস্টমার অর্ডার করা মাত্রই আপনার এই চ্যাটে সাথে সাথে বিস্তারিত মেসেজ ও অ্যালার্ট চলে আসবে।

⏰ <i>${new Date().toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka' })}</i>`;

  try {
    const res = await fetch('/api/notify-telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        botToken: botToken.trim(),
        chatId: chatId.trim(),
        message: testMessage,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return { success: true, message: 'টেলিগ্রামে টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!' };
      }
    }
  } catch (e) {
    // fallback
  }

  try {
    const url = `https://api.telegram.org/bot${botToken.trim()}/sendMessage`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: testMessage,
        parse_mode: 'HTML',
      }),
    });

    const data = await resp.json();
    if (data.ok) {
      return { success: true, message: 'টেলিগ্রামে টেস্ট মেসেজ সফলভাবে পাঠানো হয়েছে!' };
    } else {
      return { success: false, error: data.description || 'টেলিগ্রাম বটের টোকেন বা চ্যাট আইডি সঠিক নয়।' };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'টেলিগ্রাম সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি।' };
  }
}
