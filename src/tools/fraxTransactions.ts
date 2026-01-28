// src/tools/fraxTransactions.ts
import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";
import { rateLimit } from "../utils/rateLimiter.js";
import { formatUnits } from "ethers";

type FraxArgs = {
  address: string;
  chain?: "ethereum" | "fraxtal";
};

const FRAX_TOKEN = {
  ethereum: "0x853d955acef822db058eb8505911ed77f175b99e",
  fraxtal: "0xfc00000000000000000000000000000000000001",
};

export const fraxTransactionTool = {
  name: "frax_transactions",
  description: "Fetch latest 5 FRAX token transactions",
  parameters: {
    type: "object",
    properties: {
      address: { type: "string" },
      chain: { type: "string", enum: ["ethereum", "fraxtal"] },
    },
    required: ["address"],
  },

  execute: async ({ address, chain = "ethereum" }: FraxArgs) => {
    const cacheKey = `frax-tx-${chain}-${address}`;
    if (!rateLimit(cacheKey, 5, 60_000)) throw new Error("Rate limit exceeded");

    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get("https://api.etherscan.io/v2/api", {
        params: {
          chainid: chain === "fraxtal" ? 252 : 1,
          module: "account",
          action: "tokentx",
          contractaddress: FRAX_TOKEN[chain],
          address,
          page: 1,
          offset: 5,
          sort: "desc",
          apikey: process.env.ETHERSCAN_KEY,
        },
      });

      // 🔎 Normalize response shape
      let items: any[] = [];

      if (Array.isArray(res.data?.result)) {
        items = res.data.result;
      } else if (Array.isArray(res.data?.data?.items)) {
        items = res.data.data.items;
      } else {
        console.error("Etherscan raw response:", res.data);
        throw new Error("Unexpected API response format");
      }

      const txs = items.slice(0, 5).map((tx: any) => {
        const decimals = Number(tx.tokenDecimal ?? 18);
        const value = BigInt(tx.value || "0");

        return {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          amount: formatUnits(value, decimals),
          timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        };
      });

      const result = { chain, address, transactions: txs };
      setCache(cacheKey, result, 60);

      return result;
    } catch (err: any) {
      throw new Error(
        "FRAX transactions fetch failed: " +
          (err?.response?.data?.message ||
            err?.response?.data ||
            err.message ||
            err)
      );
    }
  },
};
