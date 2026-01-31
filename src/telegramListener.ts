import { walletBalanceTool } from "./tools/walletBalance.js";
import { cryptoConverterTool } from "./tools/cryptoConverter.js";
import { gasEstimatorTool } from "./tools/gasEstimator.js";
import { fraxTransactionTool } from "./tools/fraxTransactions.js";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE_URL = `https://api.telegram.org/bot${TOKEN}`;

let offset = 0;

const SUPPORTED_CHAINS = ["ethereum", "polygon", "arbitrum"] as const;
type SupportedChain = typeof SUPPORTED_CHAINS[number];

// ---- Start polling Telegram ----
export function startTelegramListener() {
  console.error("🤖 Telegram listener started");

  setInterval(async () => {
    try {
      const res = await fetch(`${BASE_URL}/getUpdates?timeout=30&offset=${offset}`);
      const data = (await res.json()) as any;

      for (const update of data.result) {
        offset = update.update_id + 1;

       const msg = update.message || update.channel_post;
          if (!msg?.text) continue;

          const chatId = msg.chat.id;
          const text = msg.text;


        console.error("📩 Telegram:", text);

        await routeTelegram(text, chatId);
      }
    } catch (err) {
      console.error("Telegram polling error:", err);
    }
  }, 1500);
}

// ---- Handle user input ----
async function routeTelegram(text: string, chatId: number) {
  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase();

  try {
    // ---------------- BALANCE ----------------
    if (command === "/balance") {
      const tool = walletBalanceTool;
      const address = parts[1];
      if (!address) return send(chatId, "Usage: /balance <address> [chain]");

      const chain = (SUPPORTED_CHAINS.includes(parts[2] as SupportedChain)
        ? (parts[2] as SupportedChain)
        : "ethereum") as SupportedChain;

      const result = await tool.execute({ address, chain });
      return send(
        chatId,
        `💼 Wallet Balance\n\nChain: ${result.chain.toUpperCase()}\nBalance: ${result.balance} ${
          result.chain === "polygon" ? "MATIC" : "ETH"
        }`
      );
    }

    // ---------------- CONVERT ----------------
    if (command === "/convert") {
      const tool = cryptoConverterTool;
      const [_, from, to, amountRaw] = parts;
      if (!from || !to || !amountRaw) return send(chatId, "Usage: /convert <from> <to> <amount>");

      const amount = Number(amountRaw);
      if (isNaN(amount)) return send(chatId, "❌ Amount must be a number");

      const result = await tool.execute({ from, to, amount });
      return send(
        chatId,
        `💱 Crypto Conversion\n${amount} ${from.toUpperCase()} → ${result.converted} ${to.toUpperCase()}\nRate: ${result.rate}`
      );
    }

    // ---------------- GAS ----------------
    if (command === "/gas") {
  const tool = gasEstimatorTool;

  const chain = (SUPPORTED_CHAINS.includes(parts[1] as SupportedChain)
    ? (parts[1] as SupportedChain)
    : "ethereum") as SupportedChain;

  const result = (await tool.execute({ chain })) as {
    chain: string;
    safeGasPrice: string;
    proposeGasPrice: string;
    fastGasPrice: string;
    lastBlock: string;
  };

  return send(
    chatId,
    `⛽ Gas Price Update (${result.chain.toUpperCase()})\n` +
      `Safe: ${result.safeGasPrice} gwei\n` +
      `Propose: ${result.proposeGasPrice} gwei\n` +
      `Fast: ${result.fastGasPrice} gwei\n` +
      `Last Block: ${result.lastBlock}`
  );
}

    // ---------------- FRAX ----------------
    if (command === "/frax") {
  const tool = fraxTransactionTool;

  const address = parts[1] ?? "";
  const chain = parts[2] === "fraxtal" ? "fraxtal" : "ethereum";

  const result = (await tool.execute({
    address,
    chain,
  })) as {
    chain: string;
    transactions: {
      hash: string;
      from: string;
      to: string;
      amount: string;
      timestamp: string;
    }[];
  };

  if (!result.transactions || result.transactions.length === 0) {
    return send(chatId, "No FRAX transactions found");
  }

  const message =
    `🧊 Latest FRAX Transactions (${result.chain.toUpperCase()})\n\n` +
    result.transactions
      .map(
        (tx) =>
          `• ${tx.hash.slice(0, 10)}...  
From: ${tx.from}  
To: ${tx.to}  
Amount: ${tx.amount}  
Time: ${tx.timestamp}\n`
      )
      .join("\n");

  return send(chatId, message);
}

    // ---------------- HELP ----------------
    return send(
      chatId,
      `🤖 Available Commands:

/balance <address> [chain]
/convert <from> <to> <amount>
/gas [chain]
/frax <address?> [chain]

Example:
/balance 0xabc... polygon
/convert BTC USD 2
/gas ethereum
/frax 0xabc...
`
    );
  } catch (err: any) {
    console.error("Telegram route error:", err);
    return send(chatId, `⚠️ Error: ${err.message || err}`);
  }
}

// ---- Reply helper ----
async function send(chatId: number, text: string) {
  await fetch(`${BASE_URL}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
  });
}
