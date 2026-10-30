// Corta una captura larga en trozos de alto fijo y los junta de dos en dos (para revisarla por partes).
// Uso: node tools/trozos.mjs captura.png prefijo [alto=1100] [escala=0.62]
import sharp from "sharp";
const [src, pre, altoArg = "1100", escArg = "0.62"] = process.argv.slice(2);
const meta = await sharp(src).metadata();
const alto = Number(altoArg), esc = Number(escArg);
const n = Math.ceil(meta.height / alto);
const trozos = [];
for (let i = 0; i < n; i++) {
  const top = i * alto, h = Math.min(alto, meta.height - top);
  trozos.push(await sharp(src).extract({ left: 0, top, width: meta.width, height: h }).resize({ width: Math.round(meta.width * esc) }).png().toBuffer());
}
for (let i = 0; i < n; i += 2) {
  const a = trozos[i], b = trozos[i + 1];
  const ma = await sharp(a).metadata(), mb = b ? await sharp(b).metadata() : { width: 0, height: 0 };
  const W = ma.width + (b ? mb.width + 12 : 0), H = Math.max(ma.height, mb.height);
  const comp = [{ input: a, left: 0, top: 0 }];
  if (b) comp.push({ input: b, left: ma.width + 12, top: 0 });
  await sharp({ create: { width: W, height: H, channels: 3, background: "#ff00ff" } }).composite(comp).jpeg({ quality: 82 }).toFile(`${pre}-${String(i / 2 + 1).padStart(2, "0")}.jpg`);
}
console.log("trozos", n, "->", Math.ceil(n / 2), "hojas");
