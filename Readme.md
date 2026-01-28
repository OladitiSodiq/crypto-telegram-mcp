#  MCP Blockchain Toolkit

A **Model Context Protocol (MCP) server** that provides blockchain
utilities for Ethereum-compatible chains using **Etherscan API V2**, caching, and Telegram notifications.

##  Features

-   FRAX Transactions
-   Wallet Balance (Etherscan V2)
-   Gas Estimator
-   Telegram Bot Messaging
-   Crypto Converter 
-   Caching and Rate Limiting

##  Environment Variables

COINGECKO_API=your_key
ETHERSCAN_API_KEY=your_key
TELEGRAM_CHAT_ID=your_token
TELEGRAM_BOT_TOKEN=your_chat_id

##  Run

npm install\
npm run build\
npm start


##  Tools Included

###  FRAX Transactions Tool (`frax_transactions`)
Fetches the latest 5 transactions related to FRAX.

**Example Request**
```json
{
  "name": "frax_transactions",
  "arguments": {
    "address": "0x...",
     "chain": "like ethereum, polygon"
  }
}
```

**Response**
```json
{
  "success": true,
  "transactions": [
    {
      "hash": "0xabc...",
      "from": "0x...",
      "to": "0x...",
      "amount": "12.4",
      "timestamp": "2026-01-27T18:00:00Z"
    }
  ]
}
```

---

###  Wallet Balance Tool (`wallet_balance`)
Fetches ETH, Polygon, or Arbitrum wallet balance using **Etherscan API V2**.

```json
{
  "name": "wallet_balance",
  "arguments": {
    "address": "0x...",
    "chain": "polygon"
  }
}
```

---

###  Gas Estimator Tool (`gas_estimator`)
Gets current gas price for Ethereum, Polygon, or Arbitrum.

```json
{
  "name": "gas_estimator",
  "arguments": {
    "chain": "ethereum"
  }
}
```

---

###  Telegram Bot Tool (`telegram_bot`)
Send updates to a Telegram channel.

```json
{
  "name": "telegram_bot",
  "arguments": {
    "message": "New FRAX transaction detected"
  }
}
```

---


### Crypto Converter (`crypto_converter`)
Send updates to a Telegram channel.

```json
{
  "name": "crypto_converter",
  "arguments": {
    "from": "BTC",
    "to": "USD",
    "amount": 2
  }
}
```

---

##  Caching

Caching reduces API calls and improves performance.

- Uses in‑memory cache
- TTL based expiration
- Prevents repeated calls to Etherscan
- Improves speed & reduces rate‑limit risk

---

##  Rate Limiting

Rate limiter protects APIs and your server.

- Per tool request limits
- Prevents abuse
- Blocks repeated spam calls
- Configurable window & max hits

---




##  Contributing

Pull requests are welcome.

---

##  Contact

Oladiti Sodiq  
LinkedIn: https://www.linkedin.com/in/oladitisodiq/  
Email: Oladitisodiq@gmail.com  

---

##  Resources

- https://docs.etherscan.io  
- https://modelcontextprotocol.io  
- https://github.com/modelcontextprotocol/sdk  