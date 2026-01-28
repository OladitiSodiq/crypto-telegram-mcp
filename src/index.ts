import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

import { cryptoConverterTool } from "./tools/cryptoConverter.js";
import { fraxTransactionTool } from "./tools/fraxTransactions.js";
import { walletBalanceTool } from "./tools/walletBalance.js";
import { gasEstimatorTool } from "./tools/gasEstimator.js";
import { telegramBotTool } from "./tools/telegramBot.js";

// --- Put all tools in this array
const tools = [
  cryptoConverterTool,
  fraxTransactionTool,
  walletBalanceTool,
  gasEstimatorTool,
  telegramBotTool
];

// --- Create MCP server (working pattern)
const server = new Server(
  {
    name: "Blockchain MCP Server",
    version: "1.0.0"
  },
  {
    capabilities: { tools: {} }, // required by SDK
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
// Call tool handler
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
    // Only pass request.params.arguments
    // Remove the second argument ({} as any)
    const result = await tool.execute(request.params.arguments as any);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: unknown) {
    // 'error' is unknown by default in TypeScript 4.4+
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
