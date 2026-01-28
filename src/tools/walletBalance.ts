// src/tools/walletBalance.ts
import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";
import { rateLimit } from "../utils/rateLimiter.js";
import { formatEther } from "ethers";
import { sendTelegram } from "../utils/telegram.js";

type WalletBalanceArgs = {
  address: string;
  chain?: "ethereum" | "polygon" | "arbitrum";
};

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
};

const BASE_URL = "https://api.etherscan.io/v2/api";

export const walletBalanceTool = {
  name: "wallet_balance",
  description: "Get wallet balance across Ethereum, Polygon, or Arbitrum",
  parameters: {
    type: "object",
    properties: {
      address: { type: "string" },
      chain: { type: "string", enum: ["ethereum", "polygon", "arbitrum"] },
    },
    required: ["address"],
  },

  execute: async ({ address, chain = "ethereum" }: WalletBalanceArgs) => {
    const cacheKey = `balance-${chain}-${address}`;
    if (!rateLimit(cacheKey, 5, 60_000)) throw new Error("Rate limit exceeded");

    const cached = getCache<string>(cacheKey);
    if (cached) return { chain, balance: cached };

    try {
      const res = await axios.get(BASE_URL, {
        params: {
          chainid: CHAIN_IDS[chain],
          module: "account",
          action: "balance",
          address,
          tag: "latest",
          apikey: process.env.ETHERSCAN_KEY,
        },
      });

      console.log("ETHERSCAN RAW:", res.data);

      if (res.data.status !== "1") {
        throw new Error(res.data.result || res.data.message);
      }

      const balanceETH = formatEther(res.data.result);
      setCache(cacheKey, balanceETH, 60);

      return { chain, balance: balanceETH };
    } catch (err: any) {
      throw new Error("Wallet balance fetch failed: " + (err.message || err));
    }
  },
};
