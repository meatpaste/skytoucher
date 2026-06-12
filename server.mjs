import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number.parseInt(process.env.PORT || "8765", 10);
const host = process.env.HOST || "0.0.0.0";
const peers = new Map();
const streams = new Set();
const validMaps = new Set(["airfield", "fairground"]);
let currentMap = process.env.FPV_MAP === "fairground" ? "fairground" : "airfield";

const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml; charset=utf-8"]
]);

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/fpv-meta") {
    sendJson(res, 200, {
      multiplayer: true,
      transport: "sse-post",
      peers: peers.size,
      map: currentMap,
      localUrl: `http://127.0.0.1:${port}/fpv/`,
      lanUrls: getLanShareUrls(),
      requestUrl: `${url.origin}/fpv/`
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/fpv-events") {
    openEventStream(req, res, url);
    return;
  }

  if (req.method === "POST" && url.pathname === "/fpv-state") {
    await receiveState(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/fpv-map") {
    await receiveMap(req, res);
    return;
  }

  if (req.method === "POST" && url.pathname === "/fpv-leave") {
    await receiveLeave(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    await serveStatic(req, res, url);
    return;
  }

  res.writeHead(405, { Allow: "GET, HEAD, POST" });
  res.end("Method not allowed");
});

server.listen(port, host, () => {
  console.log(`FPV simulator server listening on port ${port}`);
  console.log(`Local: http://127.0.0.1:${port}/fpv/`);
  for (const shareUrl of getLanShareUrls()) {
    console.log(`LAN:   ${shareUrl}`);
  }
});

setInterval(() => {
  prunePeers();
  broadcastPeers();
  for (const stream of streams) {
    stream.res.write(": keepalive\n\n");
  }
}, 5000).unref();

async function serveStatic(req, res, url) {
  if (url.pathname === "/") {
    redirect(res, "/fpv/");
    return;
  }
  if (url.pathname === "/fpv") {
    redirect(res, "/fpv/");
    return;
  }
  if (!url.pathname.startsWith("/fpv/")) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const relativePath = decodeURIComponent(url.pathname.slice("/fpv/".length)) || "index.html";
  let filePath = path.resolve(rootDir, relativePath);
  if (!filePath.startsWith(`${rootDir}${path.sep}`) && filePath !== rootDir) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  try {
    let fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = path.join(filePath, "index.html");
      fileStat = await stat(filePath);
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mimeTypes.get(ext) || "application/octet-stream";
    const noStore = [".html", ".css", ".js", ".mjs"].includes(ext) && !filePath.includes(`${path.sep}vendor${path.sep}`);
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": fileStat.size,
      "Cache-Control": noStore ? "no-store" : "public, max-age=3600"
    });
    if (req.method === "HEAD") {
      res.end();
    } else {
      createReadStream(filePath).pipe(res);
    }
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

function openEventStream(req, res, url) {
  const id = cleanId(url.searchParams.get("id"));
  if (!id) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Missing id");
    return;
  }

  const name = cleanText(url.searchParams.get("name"), 32) || `Pilot ${id.slice(0, 4).toUpperCase()}`;
  const color = cleanColor(url.searchParams.get("color")) || "58d7ff";
  peers.set(id, {
    ...(peers.get(id) || {}),
    id,
    name,
    color,
    updatedAt: Date.now()
  });

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });
  res.write(": connected\n\n");

  const stream = { id, res };
  streams.add(stream);
  writeEvent(res, "map", getMapState());
  writeEvent(res, "peers", getPeerList());
  broadcastPeers();

  req.on("close", () => {
    streams.delete(stream);
    if (![...streams].some((openStream) => openStream.id === id)) {
      peers.delete(id);
      broadcastPeers();
    }
  });
}

async function receiveState(req, res) {
  const body = await readJson(req);
  const frame = sanitizeFrame(body);
  if (!frame) {
    sendJson(res, 400, { error: "Invalid state frame" });
    return;
  }

  peers.set(frame.id, {
    ...(peers.get(frame.id) || {}),
    ...frame,
    updatedAt: Date.now()
  });
  broadcastEvent("state", frame);
  res.writeHead(204);
  res.end();
}

async function receiveMap(req, res) {
  const body = await readJson(req);
  const map = cleanMap(body?.map);
  if (!map) {
    sendJson(res, 400, { error: "Invalid map" });
    return;
  }

  currentMap = map;
  const state = getMapState(cleanId(body?.id));
  broadcastEvent("map", state);
  sendJson(res, 200, state);
}

async function receiveLeave(req, res) {
  const body = await readJson(req);
  const id = cleanId(body?.id);
  if (id) {
    peers.delete(id);
    broadcastPeers();
  }
  res.writeHead(204);
  res.end();
}

function broadcastPeers() {
  broadcastEvent("peers", getPeerList());
}

function broadcastEvent(event, data) {
  for (const stream of [...streams]) {
    try {
      writeEvent(stream.res, event, data);
    } catch {
      streams.delete(stream);
    }
  }
}

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function getPeerList() {
  const now = Date.now();
  return [...peers.values()]
    .filter((peer) => now - peer.updatedAt < 6000)
    .map((peer) => ({
      id: peer.id,
      name: peer.name,
      color: peer.color,
      updatedAt: peer.updatedAt
    }));
}

function getMapState(changedBy = "") {
  return {
    map: currentMap,
    changedBy,
    updatedAt: Date.now()
  };
}

function prunePeers() {
  const now = Date.now();
  for (const [id, peer] of peers) {
    if (now - peer.updatedAt > 9000) {
      peers.delete(id);
    }
  }
}

function sanitizeFrame(input) {
  if (!input || typeof input !== "object") return null;
  const id = cleanId(input.id);
  const position = cleanVector(input.position, 3, 1000);
  const velocity = cleanVector(input.velocity, 3, 160);
  const quaternion = cleanVector(input.quaternion, 4, 1);
  if (!id || !position || !velocity || !quaternion) return null;
  return {
    id,
    name: cleanText(input.name, 32) || `Pilot ${id.slice(0, 4).toUpperCase()}`,
    color: cleanColor(input.color) || "58d7ff",
    armed: Boolean(input.armed),
    throttle: clamp(Number(input.throttle), 0, 1),
    position,
    velocity,
    quaternion
  };
}

function cleanId(value) {
  if (typeof value !== "string") return "";
  const cleaned = value.replace(/[^a-zA-Z0-9._:-]/g, "").slice(0, 80);
  return cleaned.length >= 3 ? cleaned : "";
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.replace(/[^\w .-]/g, "").trim().slice(0, maxLength);
}

function cleanColor(value) {
  if (typeof value !== "string") return "";
  const color = value.replace(/^#/, "").toLowerCase();
  return /^[0-9a-f]{6}$/.test(color) ? color : "";
}

function cleanMap(value) {
  if (typeof value !== "string") return "";
  return validMaps.has(value) ? value : "";
}

function cleanVector(value, length, limit) {
  if (!Array.isArray(value) || value.length !== length) return null;
  const vector = value.map((entry) => Number(entry));
  if (!vector.every(Number.isFinite)) return null;
  return vector.map((entry) => clamp(entry, -limit, limit));
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function readJson(req, maxBytes = 65536) {
  return new Promise((resolve) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) {
        req.destroy();
        resolve(null);
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });
    req.on("error", () => resolve(null));
  });
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function getLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal && !entry.address.endsWith(".0"))
    .map((entry) => entry.address);
}

function getLanShareUrls() {
  return getLanAddresses().map((address) => `http://${address}:${port}/fpv/`);
}
