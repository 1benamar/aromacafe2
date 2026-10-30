// Junta capturas en una rejilla (cols x filas) con miniaturas de ancho fijo.
// Uso: node tools/rejilla.mjs salida.jpg ancho cols img1 img2 ...
import sharp from "sharp";
const [out, anchoArg, colsArg, ...imgs] = process.argv.slice(2);
const W = Number(anchoArg), cols = Number(colsArg), gap = 6;
const tiles = [];
let alturas = [];
for (const f of imgs) {
  const buf = await sharp(f).resize({ width: W }).toBuffer();
  const m = await sharp(buf).metadata();
  tiles.push({ buf, h: m.height });
}
const rows = Math.ceil(tiles.length / cols);
const rowH = [];
for (let r = 0; r < rows; r++) rowH.push(Math.max(...tiles.slice(r * cols, r * cols + cols).map(t => t.h)));
const comp = [];
let y = 0;
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const t = tiles[r * cols + c]; if (!t) continue;
    comp.push({ input: t.buf, left: c * (W + gap), top: y });
  }
  y += rowH[r] + gap;
}
await sharp({ create: { width: cols * (W + gap) - gap, height: y - gap, channels: 3, background: "#ff00ff" } }).composite(comp).jpeg({ quality: 80 }).toFile(out);
console.log("ok", out);
