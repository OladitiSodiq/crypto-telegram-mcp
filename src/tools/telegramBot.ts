// src/tools/telegramBot.ts
import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";
import { rateLimit } from "../utils/rateLimiter.js";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const telegramBotTool = {
  name: "telegram_bot",
  description: "Send message to Telegram chat/channel",
  parameters: {
    type: "object",
    properties: { message: { type: "string" } },
    required: ["message"]
  },
  execute: async (args: { message: string }) => {
    const key = `telegram-${args.message}`;
    if (!rateLimit(key, 5, 10_000)) throw new Error("Rate limit exceeded");

    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      const res = await axios.post(url, {
        chat_id: TELEGRAM_CHAT_ID,
        text: args.message
      });

      return { success: res.data.ok, result: res.data.result };
    } catch (err: any) {
      throw new Error("Telegram message failed: " + err.message);
    }
  }
};
