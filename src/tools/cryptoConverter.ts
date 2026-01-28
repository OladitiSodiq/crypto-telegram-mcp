// src/tools/cryptoConverter.ts
import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";
import { rateLimit } from "../utils/rateLimiter.js";

type CryptoConverterArgs = {
  from: string; // symbol or id (e.g., BTC, ETH, bitcoin)
  to: string;   // symbol or fiat (e.g., USD, EUR, ETH)
  amount: number;
};

// Map common symbols to CoinGecko IDs
const coinMap: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDC: "usd-coin",
  BNB: "binancecoin",
  DAI: "dai",
  // Add more coins as needed
};

export const cryptoConverterTool = {
  name: "crypto_converter",
  description: "Convert cryptocurrency to another coin or fiat using real-time rates",
  parameters: {
    type: "object",
    properties: {
      from: { type: "string" },
      to: { type: "string" },
      amount: { type: "number" },
    },
    required: ["from", "to", "amount"],
  },
  execute: async (args: CryptoConverterArgs) => {
    const { from, to, amount } = args;

    const cacheKey = `crypto-${from.toUpperCase()}-${to.toUpperCase()}`;

    // Rate limit: max 10 calls per minute per pair
    if (!rateLimit(cacheKey, 10, 60_000)) throw new Error("Rate limit exceeded");

    // Check cache
    const cached = getCache<number>(cacheKey);
    if (cached) return { rate: cached, converted: cached * amount };

    // Convert symbols to CoinGecko IDs
    const fromId = coinMap[from.toUpperCase()] || from.toLowerCase();
    const toId = to.toLowerCase();

    try {
      const res = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: fromId,
            vs_currencies: toId,
          },
        }
      );

      const rate = res.data[fromId]?.[toId];
      if (!rate) throw new Error(`Conversion not available from ${from} to ${to}`);

      // Cache for 60 seconds
      setCache(cacheKey, rate, 60);

      return {
        rate,
        converted: rate * amount,
      };
    } catch (err: any) {
      throw new Error("Crypto conversion failed: " + (err.message || err));
    }
  },
};
