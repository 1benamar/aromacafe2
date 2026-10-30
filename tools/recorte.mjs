// Recorta una zona de una foto y la amplía (para leer textos pequeños).
// Uso: node tools/recorte.mjs foto.jpg salida.jpg left top width height [escala=2]
import sharp from "sharp";
const [src, out, l, t, w, h, s = "2"] = process.argv.slice(2);
const img = sharp(src).rotate().extract({ left: +l, top: +t, width: +w, height: +h });
await img.resize({ width: Math.round(+w * +s), kernel: "lanczos3" }).sharpen().jpeg({ quality: 90 }).toFile(out);
console.log("ok", out);
