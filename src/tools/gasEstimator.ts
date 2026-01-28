// src/tools/gasEstimator.ts
import axios from "axios";
import { getCache, setCache } from "../utils/cache.js";
import { rateLimit } from "../utils/rateLimiter.js";

type GasArgs = {
  chain?: "ethereum" | "polygon" | "arbitrum";
};

const CHAIN_IDS: Record<string, number> = {
  ethereum: 1,
  polygon: 137,
  arbitrum: 42161,
};

export const gasEstimatorTool = {
  name: "gas_estimator",
  description: "Fetch current gas prices using Etherscan Gas Oracle (V2)",
  parameters: {
    type: "object",
    properties: {
      chain: { type: "string", enum: ["ethereum", "polygon", "arbitrum"] },
    },
    required: [],
  },

  execute: async ({ chain = "ethereum" }: GasArgs) => {
    const cacheKey = `gas-${chain}`;
    if (!rateLimit(cacheKey, 10, 60_000)) throw new Error("Rate limit exceeded");

    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.get("https://api.etherscan.io/v2/api", {
        params: {
          chainid: CHAIN_IDS[chain],
          module: "gastracker",
          action: "gasoracle",
          apikey: process.env.ETHERSCAN_KEY,
        },
      });

      if (!res.data?.result) {
        throw new Error("Invalid gas oracle response");
      }

      const result = {
        chain,
        safeGasPrice: res.data.result.SafeGasPrice,
        proposeGasPrice: res.data.result.ProposeGasPrice,
        fastGasPrice: res.data.result.FastGasPrice,
        lastBlock: res.data.result.LastBlock,
      };

      setCache(cacheKey, result, 60);
      return result;
    } catch (err: any) {
      throw new Error(
        "Gas estimator failed: " +
          (err?.response?.data?.message ||
            err?.response?.data ||
            err.message ||
            err)
      );
    }
  },
};
