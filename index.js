import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { connectToBinance } from "./utils/connectBinance.js";

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/api/binance" });

// ======== WebSocket Proxy ======== //
wss.on("connection", (ws, req) => {
  const params = new URLSearchParams(req.url.replace("/api/binance?", ""));
  const type = params.get("type");
  const coin = params.get("coin");

  let url = "";

  switch (type) {
    case "all":
      url = "wss://stream.binance.us:9443/ws/!ticker@arr";
      break;
    case "ticker":
      url = `wss://stream.binance.us:9443/ws/${coin}usdt@ticker`;
      break;
    case "multi":
      url =
        "wss://stream.binance.us:9443/stream?streams=btcusdt@trade/ethusdt@trade";
      break;
    case "depth":
      url = `wss://stream.binance.us:9443/ws/${coin}usdt@depth20@100ms`;
      break;
    default:
      ws.send(JSON.stringify({ error: "Invalid stream type" }));
      ws.close();
      return;
  }

  connectToBinance(url, ws);
});


// Get Current Price of a Single Coin
app.get("/api/price/:coin", async (req, res) => {
  try {
    const { coin } = req.params;
    const response = await axios.get(
      `https://api.binance.us/api/v3/ticker/price?symbol=${coin.toUpperCase()}USDT`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Historical Kline Data
app.get("/api/klines/:coin/:interval", async (req, res) => {
  try {
    const { coin, interval } = req.params;
    const response = await axios.get(
      `https://api.binance.us/api/v3/klines?symbol=${coin.toUpperCase()}USDT&interval=${interval}&limit=30`
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket for Real-time Kline Updates
// Use this in frontend: wss://your-domain.com/api/binance-kline?coin=btcusdt&interval=1m
const klineWss = new WebSocketServer({ server, path: "/api/binance-kline" });
klineWss.on("connection", (ws, req) => {
  const params = new URLSearchParams(
    req.url.replace("/api/binance-kline?", "")
  );
  const coin = params.get("coin");
  const interval = params.get("interval");
  if (!coin || !interval) {
    ws.send(JSON.stringify({ error: "Missing coin or interval" }));
    ws.close();
    return;
  }

  const url = `wss://stream.binance.us:9443/ws/${coin}@kline_${interval}`;
  connectToBinance(url, ws);
});

// ======== Default Route ======== //
app.get("/", (req, res) => {
  res.send("✅ Binance Proxy Server Running!");
});

// ======== Start Server ======== //
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
