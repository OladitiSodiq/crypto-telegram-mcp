import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { cryptoConverterTool } from "./tools/cryptoConverter.js";
import { fraxTransactionTool } from "./tools/fraxTransactions.js";
import { walletBalanceTool } from "./tools/walletBalance.js";
import { gasEstimatorTool } from "./tools/gasEstimator.js";
import { telegramBotTool } from "./tools/telegramBot.js";

import { sendTelegram } from "./utils/telegram.js";

// --- Put all tools in this array
const tools = [
  cryptoConverterTool,
  fraxTransactionTool,
  walletBalanceTool,
  gasEstimatorTool,
  telegramBotTool
];

// --- Create MCP server
const server = new Server(
  {
    name: "Blockchain MCP Server",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} },
  }
);

// --- Patch vendor info
const serverAny = server as any;
if (serverAny.serverInfo) {
  serverAny.serverInfo = {
    ...serverAny.serverInfo,
    vendor: {
      name: "FarmChain Labs",
      url: "https://example.com"
    }
  };
}

// --- Handler: List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.parameters
    }))
  };
});

// --- Handler: Call a tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = tools.find((t) => t.name === toolName);

  if (!tool) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: `Tool not found: ${toolName}` }, null, 2),
        },
      ],
      isError: true,
    };
  }

  try {
    const args = request.params.arguments ?? {}; // ensure it exists

    // --- Execute tool
    const result = await tool.execute(args as any);

    // --- Prepare Telegram message
    let telegramMessage: string | null = null;

    switch (toolName) {
      case "wallet_balance": {
        const res = result as { chain: string; balance: string };
        telegramMessage = `💼 Wallet Balance Report
Chain: ${res.chain.toUpperCase()}
Balance: ${res.balance} ${res.chain === "polygon" ? "MATIC" : "ETH"}`;
        break;
      }

      case "crypto_converter": {
        const res = result as { rate: number; converted: number };
        const from = (args as any).from ?? "";
        const to = (args as any).to ?? "";
        const amount = (args as any).amount ?? 0;

        telegramMessage = `💱 Crypto Conversion
${amount} ${from.toUpperCase()} → ${res.converted} ${to.toUpperCase()}
Rate: ${res.rate}
Converted: ${res.converted}`;
        break;
      }

      case "gas_estimator": {
        const res = result as {
          chain: string;
          safeGasPrice: string;
          proposeGasPrice: string;
          fastGasPrice: string;
          lastBlock: string;
        };
        telegramMessage = `⛽ Gas Price Update (${res.chain.toUpperCase()})
Safe: ${res.safeGasPrice} gwei
Propose: ${res.proposeGasPrice} gwei
Fast: ${res.fastGasPrice} gwei
Last Block: ${res.lastBlock}`;
        break;
      }

      case "frax_transactions": {
        const res = result as {
          chain: string;
          transactions: Array<{ hash: string; from: string; to: string; amount: string; timestamp: string }>;
        };
        if (Array.isArray(res.transactions) && res.transactions.length > 0) {
          telegramMessage = `🧊 Latest FRAX Transactions (${res.chain.toUpperCase()})
${res.transactions.map(
            (tx) =>
              `Hash: ${tx.hash.slice(0, 10)}... | From: ${tx.from} | To: ${tx.to} | Amount: ${tx.amount} | Time: ${tx.timestamp}`
          ).join("\n")}`;
        }
        break;
      }

      default:
        telegramMessage = null;
    }

    // --- Send Telegram if applicable
    if (telegramMessage) await sendTelegram(telegramMessage);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ success: false, error: message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});


// --- Start server with STDIO
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Blockchain MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
