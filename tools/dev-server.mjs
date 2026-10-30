// Servidor local de desarrollo (no se sube al hosting).
// Sirve la carpeta del proyecto y acepta PUT /__save?path=assets/... para
// guardar recursos generados desde el navegador (conversión a WebP, pósters).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT || process.argv[2] || 8870);
const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json",
  ".svg": "image/svg+xml", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".mp4": "video/mp4",
  ".woff2": "font/woff2", ".ico": "image/x-icon", ".txt": "text/plain",
};

function inside(p) {
  const abs = path.resolve(ROOT, p);
  return abs.startsWith(ROOT + path.sep) ? abs : null;
}

http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "PUT" && url.pathname === "/__save") {
    const rel = url.searchParams.get("path") || "";
    const abs = inside(rel);
    if (!abs || !rel.startsWith("assets/")) { res.writeHead(400); return res.end("bad path"); }
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.concat(chunks));
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("saved " + rel + " " + Buffer.concat(chunks).length);
    });
    return;
  }
  if (req.method === "POST" && url.pathname === "/__fetch") {
    // descarga en el servidor un recurso remoto (solo herramienta de desarrollo)
    const remote = url.searchParams.get("url") || "";
    const rel = url.searchParams.get("path") || "";
    const abs = inside(rel);
    if (!abs || !rel.startsWith("assets/") || !/^https:\/\//.test(remote)) { res.writeHead(400); return res.end("bad"); }
    fetch(remote).then(r => r.arrayBuffer()).then(buf => {
      fs.mkdirSync(path.dirname(abs), { recursive: true });
      fs.writeFileSync(abs, Buffer.from(buf));
      res.writeHead(200); res.end("fetched " + rel + " " + buf.byteLength);
    }).catch(e => { res.writeHead(500); res.end(String(e)); });
    return;
  }
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith("/")) rel += "index.html";
  const abs = inside(rel.replace(/^\//, ""));
  if (!abs || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
    res.writeHead(404); return res.end("not found");
  }
  const stat = fs.statSync(abs);
  const type = TYPES[path.extname(abs).toLowerCase()] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace("bytes=", "").split("-");
    const start = Number(s), end = e ? Number(e) : stat.size - 1;
    res.writeHead(206, {
      "Content-Type": type, "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1,
    });
    return fs.createReadStream(abs, { start, end }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
  fs.createReadStream(abs).pipe(res);
}).listen(PORT, () => console.log("Aroma Café v2 dev server on http://localhost:" + PORT));
