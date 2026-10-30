// Genera las WebP de la web a partir de las fotos originales (no se publican).
// Lista de fotos, recortes y anchos en tools/fotos.json. Uso: node tools/imagenes.mjs [id ...]
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..");
const lista = JSON.parse(fs.readFileSync(path.join(RAIZ, "tools/fotos.json"), "utf8"));
const solo = process.argv.slice(2);
const salida = path.join(RAIZ, "assets/img");
fs.mkdirSync(salida, { recursive: true });

for (const f of lista) {
  if (solo.length && !solo.includes(f.id)) continue;
  const src = path.isAbsolute(f.src) ? f.src : path.join(RAIZ, f.src);
  let base = sharp(src).rotate();
  if (f.parches) {
    // tapa detalles que distraen copiando una zona limpia de la misma foto (p. ej. un cartel)
    const orig = await base.toBuffer();
    const capas = [];
    for (const p of f.parches) capas.push({ input: await sharp(orig).extract(p.de).toBuffer(), left: p.a.left, top: p.a.top });
    base = sharp(await sharp(orig).composite(capas).toBuffer());
  }
  if (f.recorte) base = base.extract(f.recorte);
  if (f.espejo) base = base.flop();
  const buf = await base.toBuffer();
  const meta = await sharp(buf).metadata();
  for (const w of f.anchos) {
    if (w > meta.width) { console.log("  aviso:", f.id, w, "> original", meta.width); }
    const ancho = Math.min(w, meta.width);
    let img = sharp(buf).resize({ width: ancho, kernel: "lanczos3" });
    if (f.ajuste) img = img.modulate(f.ajuste);
    const out = path.join(salida, `${f.id}-${w}.webp`);
    await img.webp({ quality: f.calidad ?? 74, effort: 5, smartSubsample: true }).toFile(out);
    const kb = Math.round(fs.statSync(out).size / 1024);
    const m2 = await sharp(out).metadata();
    console.log(`${f.id}-${w}.webp ${m2.width}x${m2.height} ${kb} KB`);
  }
  if (f.jpg) {
    const out = path.join(salida, `${f.id}.jpg`);
    await sharp(buf).resize({ width: f.jpg.ancho, height: f.jpg.alto, fit: "cover" }).jpeg({ quality: 80, mozjpeg: true }).toFile(out);
    console.log(`${f.id}.jpg`);
  }
}
