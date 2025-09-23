import express from "express";
import expressWs from "express-ws";
import { WebSocket } from "ws";

const app = express();
expressWs(app); // enable ws() on express

app.get("/", (req, res) => res.send("WebSocket proxy running"));

app.ws("/ws/:symbol", (ws, req) => {
  const { symbol } = req.params;

  // Connect to Binance
  const binanceWS = new WebSocket(
    `wss://stream.binance.com:9443/ws/${symbol}usdt@ticker`
  );

  binanceWS.on("message", (msg) => {
    ws.send(msg.toString()); // forward Binance message to client
  });

  binanceWS.on("close", () => ws.close());
  binanceWS.on("error", () => ws.close());

  ws.on("close", () => binanceWS.close());
});

app.listen(4000, () => console.log("Proxy running on ws://localhost:4000"));
