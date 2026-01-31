import { cryptoConverterTool } from "./cryptoConverter.js";
import { fraxTransactionTool } from "./fraxTransactions.js";
import { walletBalanceTool } from "./walletBalance.js";
import { gasEstimatorTool } from "./gasEstimator.js";
import { telegramBotTool } from "./telegramBot.js";

export {
  cryptoConverterTool,
  fraxTransactionTool,
  walletBalanceTool,
  gasEstimatorTool,
  telegramBotTool,
};

export const tools = [
  cryptoConverterTool,
  fraxTransactionTool,
  walletBalanceTool,
  gasEstimatorTool,
  telegramBotTool,
];
