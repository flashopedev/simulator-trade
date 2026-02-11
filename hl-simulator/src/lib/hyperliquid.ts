const API_URL = "https://api.hyperliquid.xyz";
const WS_URL = "wss://api.hyperliquid.xyz/ws";

export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface L2Level {
  px: string;
  sz: string;
  n: number;
}

export interface L2Book {
  levels: [L2Level[], L2Level[]];
}

export interface Trade {
  coin: string;
  side: "A" | "B";
  px: string;
  sz: string;
  time: number;
}

// Fallback prices when API is unavailable (approximate, updated Feb 2026)
export const FALLBACK_PRICES: Record<string, number> = {
  HYPE: 31, BTC: 97000, ETH: 2700, SOL: 87, DOGE: 0.26, AVAX: 38,
  LINK: 19, ARB: 0.82, OP: 1.85, SUI: 3.5, WIF: 1.2, PEPE: 0.00001234,
  JUP: 0.87, TIA: 4.5, SEI: 0.34, INJ: 24, RENDER: 7.2, FET: 1.5,
  ONDO: 1.2, STX: 1.8, NEAR: 5.2, BONK: 0.00002345,
  "xyz:TSLA": 423, "xyz:NVDA": 192, "xyz:AAPL": 279, "xyz:MSFT": 403,
  "xyz:GOOGL": 311, "xyz:AMZN": 204, "xyz:META": 661, "xyz:HOOD": 75,
  "xyz:PLTR": 134, "xyz:COIN": 149, "xyz:INTC": 48, "xyz:AMD": 211,
  "xyz:MU": 403, "xyz:SNDK": 598, "xyz:MSTR": 125, "xyz:CRCL": 56,
  "xyz:NFLX": 80, "xyz:ORCL": 156, "xyz:TSM": 377, "xyz:BABA": 164,
  "xyz:RIVN": 14, "xyz:CRWV": 93, "xyz:USAR": 21, "xyz:URNM": 71,
  "xyz:XYZ100": 25162, "xyz:GOLD": 5089, "xyz:SILVER": 84,
  "xyz:CL": 65, "xyz:COPPER": 6, "xyz:NATGAS": 3, "xyz:PLATINUM": 2142,
  "xyz:JPY": 153, "xyz:EUR": 1.19,
};

const INTERVAL_MS: Record<string, number> = {
  "1m": 60000,
  "5m": 300000,
  "15m": 900000,
  "1h": 3600000,
  "4h": 14400000,
  "1d": 86400000,
};

async function apiPost<T>(body: unknown, timeout = 8000): Promise<T> {
  const controller = new AbortController();
  const tm = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(`${API_URL}/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(tm);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(tm);
    throw error;
  }
}

export async function fetchCandles(
  coin: string,
  interval: string,
  count = 200
): Promise<Candle[]> {
  const ms = INTERVAL_MS[interval] || 900000;
  const now = Date.now();
  const startTime = now - ms * count;

  try {
    const data = await apiPost<
      Array<{ t: number; o: string; h: string; l: string; c: string; v: string }>
    >({
      type: "candleSnapshot",
      req: { coin, interval, startTime, endTime: now },
    });

    return data.map((c) => ({
      t: c.t,
      o: parseFloat(c.o),
      h: parseFloat(c.h),
      l: parseFloat(c.l),
      c: parseFloat(c.c),
      v: parseFloat(c.v),
    }));
  } catch (error) {
    console.warn("Candle API failed:", error);
    return generateFakeCandles(coin, count);
  }
}

export async function fetchL2Book(coin: string): Promise<L2Book | null> {
  try {
    return await apiPost<L2Book>({ type: "l2Book", coin });
  } catch {
    return null;
  }
}

// Fetch all mid-market prices via REST (polling fallback)
export async function fetchAllMids(): Promise<Record<string, string> | null> {
  try {
    return await apiPost<Record<string, string>>({ type: "allMids" }, 5000);
  } catch {
    return null;
  }
}

// Fetch market context including funding rates, mark prices, oracle prices
export interface AssetCtx {
  funding: string;
  openInterest: string;
  prevDayPx: string;
  dayNtlVlm: string;
  premium: string;
  oraclePx: string;
  markPx: string;
  midPx: string;
  impactPxs: [string, string];
}

export async function fetchMetaAndAssetCtxs(): Promise<{ universe: Array<{ name: string }>; assetCtxs: AssetCtx[] } | null> {
  try {
    const [meta, ctxs] = await apiPost<[{ universe: Array<{ name: string }> }, AssetCtx[]]>({ type: "metaAndAssetCtxs" }, 8000);
    return { universe: meta.universe, assetCtxs: ctxs };
  } catch {
    return null;
  }
}

function generateFakeCandles(coin: string, count: number): Candle[] {
  const base = FALLBACK_PRICES[coin] || 20;
  const candles: Candle[] = [];
  let price = base;

  for (let i = 0; i < count; i++) {
    const open = price;
    const change = (Math.random() - 0.48) * base * 0.008;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * base * 0.003;
    const low = Math.min(open, close) - Math.random() * base * 0.003;

    candles.push({
      t: Date.now() - (count - i) * 900000,
      o: open,
      h: high,
      l: low,
      c: close,
      v: Math.random() * 1000,
    });

    price = close;
  }

  return candles;
}

export function generateFakeOrderBook(price: number, decimals: number) {
  const asks: Array<{ price: number; size: number; total: number }> = [];
  const bids: Array<{ price: number; size: number; total: number }> = [];
  let askTotal = 0;
  let bidTotal = 0;

  for (let i = 8; i >= 1; i--) {
    const px = price + i * price * 0.001 + Math.random() * price * 0.0005;
    const sz = Math.random() * 200 + 10;
    askTotal += sz;
    asks.push({
      price: parseFloat(px.toFixed(decimals)),
      size: parseFloat(sz.toFixed(0)),
      total: askTotal,
    });
  }

  for (let i = 1; i <= 8; i++) {
    const px = price - i * price * 0.001 - Math.random() * price * 0.0005;
    const sz = Math.random() * 200 + 10;
    bidTotal += sz;
    bids.push({
      price: parseFloat(px.toFixed(decimals)),
      size: parseFloat(sz.toFixed(0)),
      total: bidTotal,
    });
  }

  return { asks: asks.reverse(), bids };
}

// WebSocket with exponential backoff reconnection + heartbeat
type WsCallback = (data: unknown) => void;

const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;
const HEARTBEAT_INTERVAL = 30000;

export class HyperliquidWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Map<string, WsCallback[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private subscriptions: Set<string> = new Set();
  private reconnectAttempts = 0;
  private intentionalClose = false;

  connect() {
    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(WS_URL);

      this.ws.onopen = () => {
        console.log("[WS] Connected");
        this.reconnectAttempts = 0;
        this.resubscribe();
        this.startHeartbeat();
        this.emit("connected", true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.channel) {
            this.emit(data.channel, data);
          }
        } catch {
          // Ignore parse errors
        }
      };

      this.ws.onclose = () => {
        console.log("[WS] Disconnected");
        this.stopHeartbeat();
        this.emit("connected", false);
        if (!this.intentionalClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log("[WS] Max reconnect attempts reached — switching to polling");
      this.emit("maxReconnectFailed", true);
      return;
    }

    const delay = BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ method: "ping" });
      }
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribe() {
    this.subscriptions.forEach((sub) => {
      const subscription = JSON.parse(sub);
      this.send({ method: "subscribe", subscription });
    });
  }

  subscribe(subscription: unknown) {
    const msg = { method: "subscribe", subscription };
    const key = JSON.stringify(subscription);
    this.subscriptions.add(key);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(msg);
    }
  }

  unsubscribe(subscription: unknown) {
    const msg = { method: "unsubscribe", subscription };
    const key = JSON.stringify(subscription);
    this.subscriptions.delete(key);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send(msg);
    }
  }

  private send(msg: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(channel: string, callback: WsCallback) {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, []);
    }
    this.callbacks.get(channel)!.push(callback);
  }

  off(channel: string, callback: WsCallback) {
    const cbs = this.callbacks.get(channel);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx !== -1) cbs.splice(idx, 1);
    }
  }

  private emit(channel: string, data: unknown) {
    this.callbacks.get(channel)?.forEach((cb) => cb(data));
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  resetReconnect() {
    this.reconnectAttempts = 0;
  }

  disconnect() {
    this.intentionalClose = true;
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }
}

// Singleton
let wsInstance: HyperliquidWebSocket | null = null;

export function getWebSocket(): HyperliquidWebSocket {
  if (!wsInstance) {
    wsInstance = new HyperliquidWebSocket();
  }
  return wsInstance;
}

// Fetch deployer (HIP-3) perp meta and asset contexts
// dex: "xyz", "flx", "vntl", "km", "cash"
export async function fetchDeployerMetaAndAssetCtxs(dex: string): Promise<{
  universe: Array<{ name: string; maxLeverage: number; szDecimals: number; isDelisted?: boolean }>;
  assetCtxs: AssetCtx[];
} | null> {
  try {
    const [meta, ctxs] = await apiPost<[
      { universe: Array<{ name: string; maxLeverage: number; szDecimals: number; isDelisted?: boolean }> },
      AssetCtx[]
    ]>({ type: "metaAndAssetCtxs", dex }, 10000);
    return { universe: meta.universe, assetCtxs: ctxs };
  } catch {
    return null;
  }
}
