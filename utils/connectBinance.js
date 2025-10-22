import WebSocket from "ws";

export const connectToBinance = (url, clientWs) => {
  const binanceWs = new WebSocket(url);

  binanceWs.on("open", () => {
    console.log("Connected to Binance:", url);
  });

  binanceWs.on("message", (msg) => {
    // Forward Binance data to connected frontend
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(msg);
    }
  });

  binanceWs.on("close", () => console.log("Binance stream closed"));
  binanceWs.on("error", (err) => console.error("Binance error:", err.message));

  // Clean up when frontend disconnects
  clientWs.on("close", () => {
    binanceWs.close();
  });
};
