import axios from "axios";
import { rateLimit } from "./rateLimiter.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.warn("⚠️ Telegram bot token or chat ID not set in environment variables.");
}

/**
 * Send a message to your Telegram channel safely.
 * Rate-limited to avoid spamming.
 * @param message The text message to send
 */
export async function sendTelegram(message: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) return;

  const key = `telegram-${message.slice(0, 50)}`; // first 50 chars for rate-limiting
  if (!rateLimit(key, 5, 10_000)) { // max 5 messages per 10s per unique message
    console.warn("⚠️ Telegram rate limit exceeded, skipping message");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    });

    if (!res.data.ok) {
      console.error("Telegram API error:", res.data);
    }

    return res.data;
  } catch (err: any) {
    console.error("Failed to send Telegram message:", err.message || err);
  }
}
