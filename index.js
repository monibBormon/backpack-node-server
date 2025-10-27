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

app.get("/", (req, res) => {
  res.send("✅ Binance Proxy Server Running!");
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
