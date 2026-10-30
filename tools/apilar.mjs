// Apila varias imágenes en vertical con un rótulo encima de cada una.
// Uso: node tools/apilar.mjs salida.jpg img1 img2 ...
import sharp from "sharp";
const [out, ...imgs] = process.argv.slice(2);
const label = 26, parts = [];
let y = 0, w = 0;
for (const f of imgs) {
  const m = await sharp(f).metadata();
  const svg = `<svg width="${Math.max(m.width, 400)}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="8" y="18" font-family="Arial" font-size="15" fill="#fff">${f.split(/[\/]/).pop()}</text></svg>`;
  parts.push({ input: Buffer.from(svg), left: 0, top: y }); y += label;
  parts.push({ input: f, left: 0, top: y }); y += m.height;
  w = Math.max(w, m.width, 400);
}
await sharp({ create: { width: w, height: y, channels: 3, background: "#222" } }).composite(parts).jpeg({ quality: 82 }).toFile(out);
console.log("ok", out, w, y);
