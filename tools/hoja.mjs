// Hoja de contactos para elegir fotos: miniaturas numeradas con nombre y tamaño.
// Uso: node tools/hoja.mjs carpeta salida.jpg [columnas] [lado] [desde] [cuantas]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const [dir, out, colsArg = "5", sizeArg = "320", fromArg = "0", countArg = "999"] = process.argv.slice(2);
const cols = Number(colsArg), size = Number(sizeArg), label = 24;
const all = fs.readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const files = all.slice(Number(fromArg), Number(fromArg) + Number(countArg));
const rows = Math.ceil(files.length / cols);
const tiles = [];
for (const [i, f] of files.entries()) {
  const img = sharp(path.join(dir, f)).rotate();
  const meta = await img.metadata();
  const buf = await img.resize(size, size, { fit: "contain", background: "#222" }).toBuffer();
  const x = (i % cols) * size, y = Math.floor(i / cols) * (size + label);
  tiles.push({ input: buf, left: x, top: y });
  const n = Number(fromArg) + i + 1;
  const short = f.replace("WhatsApp Image 2026-10-29 at ", "").replace(".jpeg", "");
  const txt = `${n}. ${short} ${meta.autoOrient?.width ?? meta.width}x${meta.autoOrient?.height ?? meta.height}`;
  const svg = `<svg width="${size}" height="${label}"><rect width="100%" height="100%" fill="#111"/><text x="6" y="17" font-family="Arial" font-size="14" fill="#fff">${txt}</text></svg>`;
  tiles.push({ input: Buffer.from(svg), left: x, top: y + size });
}
await sharp({ create: { width: cols * size, height: rows * (size + label), channels: 3, background: "#222" } })
  .composite(tiles).jpeg({ quality: 84 }).toFile(out);
console.log("ok", files.length, "fotos ->", out);
