// Logo de Aroma Café: el nombre en capitales romanas (Cinzel, como el rótulo de la fachada),
// debajo la onda dorada del relieve de la barra y «BAR CAFETERÍA», como en la tapa de la carta.
// El monograma es la «A» dentro del marco de esquinas cóncavas de la carta.
// Las letras se pasan a trazos con opentype.js, así el logo no depende de ninguna fuente.
// Uso: node tools/logo.mjs   (escribe assets/logo/*.svg, favicon.svg, apple-touch-icon.png
//       y el bloque <!-- logo:inicio --> ... <!-- logo:fin --> de index.html)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import opentype from "opentype.js";
import sharp from "sharp";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const f600 = opentype.loadSync(path.join(RAIZ, "_fuentes/fonts/cinzel-600.ttf"));
const f500 = opentype.loadSync(path.join(RAIZ, "_fuentes/fonts/cinzel-500.ttf"));
const OSCURO = "#10221B", ORO = "#C9973F", CLARO = "#EEF0EA", VERDE = "#173B2F";
const r1 = n => Math.round(n * 100) / 100;

// Texto con espaciado entre letras, centrado en x = 0; devuelve el trazo y su ancho
function texto(fuente, cadena, tam, espacio, y) {
  const glifos = fuente.stringToGlyphs(cadena);
  const esc = tam / fuente.unitsPerEm;
  let ancho = 0;
  glifos.forEach((g, i) => { ancho += g.advanceWidth * esc + (i < glifos.length - 1 ? espacio * tam : 0); });
  let x = -ancho / 2, d = "";
  for (const g of glifos) {
    d += g.getPath(x, y, tam).toPathData(2);
    x += g.advanceWidth * esc + espacio * tam;
  }
  return { d, ancho };
}

// Onda: dos trazos que se cruzan, como las aristas del relieve dorado de la barra
function onda(ancho, y, alto) {
  const a = ancho / 2, h = alto / 2;
  const t1 = `M${r1(-a)} ${r1(y)}C${r1(-a / 2)} ${r1(y - h)} ${r1(-a / 4)} ${r1(y - h)} 0 ${r1(y)}S${r1(a / 2)} ${r1(y + h)} ${r1(a)} ${r1(y)}`;
  const t2 = `M${r1(-a * 0.72)} ${r1(y)}C${r1(-a * 0.36)} ${r1(y + h * 0.8)} ${r1(-a * 0.18)} ${r1(y + h * 0.8)} 0 ${r1(y)}S${r1(a * 0.36)} ${r1(y - h * 0.8)} ${r1(a * 0.72)} ${r1(y)}`;
  return [t1, t2];
}

// Marco de esquinas cóncavas (el de la tapa de la carta)
function marco(w, h, r) {
  const x0 = -w / 2, y0 = -h / 2, x1 = w / 2, y1 = h / 2;
  return `M${r1(x0 + r)} ${r1(y0)}H${r1(x1 - r)}A${r} ${r} 0 0 0 ${r1(x1)} ${r1(y0 + r)}V${r1(y1 - r)}A${r} ${r} 0 0 0 ${r1(x1 - r)} ${r1(y1)}H${r1(x0 + r)}A${r} ${r} 0 0 0 ${r1(x0)} ${r1(y1 - r)}V${r1(y0 + r)}A${r} ${r} 0 0 0 ${r1(x0 + r)} ${r1(y0)}Z`;
}

// ---- Logo completo ----
const nombre = texto(f600, "AROMA CAFÉ", 64, 0.1, 0);
const sub = texto(f500, "BAR CAFETERÍA", 17, 0.42, 66);
const [o1, o2] = onda(150, 28, 17);
const W = Math.ceil(nombre.ancho + 8), top = -64, H = 76 + 64;
const vbLogo = `${r1(-W / 2)} ${top} ${W} ${H}`;
const cuerpoLogo = (texto, oro) =>
  `<path d="${nombre.d}" fill="${texto}"/><path d="${o1}" fill="none" stroke="${oro}" stroke-width="1.9" stroke-linecap="round"/><path d="${o2}" fill="none" stroke="${oro}" stroke-width="1.2" stroke-linecap="round" opacity=".75"/><path d="${sub.d}" fill="${texto}"/>`;

// ---- Monograma ----
const A = texto(f600, "A", 54, 0, 19);
const [m1, m2] = onda(30, 31, 5);
const cuerpoMono = (texto, oro) =>
  `<path d="${marco(92, 92, 14)}" fill="none" stroke="${oro}" stroke-width="2"/><path d="${marco(80, 80, 10)}" fill="none" stroke="${oro}" stroke-width=".9"/><path d="${A.d}" fill="${texto}"/><path d="${m1}" fill="none" stroke="${oro}" stroke-width="1.6" stroke-linecap="round"/><path d="${m2}" fill="none" stroke="${oro}" stroke-width="1" stroke-linecap="round" opacity=".75"/>`;

const svg = (vb, cuerpo, fondo) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${fondo || ""}${cuerpo}</svg>\n`;
fs.mkdirSync(path.join(RAIZ, "assets/logo"), { recursive: true });
fs.writeFileSync(path.join(RAIZ, "assets/logo/aroma-cafe.svg"), svg(vbLogo, cuerpoLogo(OSCURO, ORO)));
fs.writeFileSync(path.join(RAIZ, "assets/logo/aroma-cafe-claro.svg"), svg(vbLogo, cuerpoLogo(CLARO, "#D9A54A")));
fs.writeFileSync(path.join(RAIZ, "assets/logo/monograma.svg"), svg("-50 -50 100 100", cuerpoMono(OSCURO, ORO)));
const favicon = svg("-50 -50 100 100", cuerpoMono(CLARO, "#D9A54A"), `<rect x="-50" y="-50" width="100" height="100" fill="${VERDE}"/>`);
fs.writeFileSync(path.join(RAIZ, "favicon.svg"), favicon);
await sharp(Buffer.from(favicon)).resize(180, 180).png().toFile(path.join(RAIZ, "apple-touch-icon.png"));
// Para revisar el logo sobre mármol y sobre verde
await sharp(Buffer.from(svg(vbLogo, cuerpoLogo(OSCURO, ORO), `<rect x="${-W / 2}" y="${top}" width="${W}" height="${H}" fill="#F2F2EF"/>`))).resize(1200).png().toFile(path.join(RAIZ, "_fuentes/hojas/logo-claro.png"));
await sharp(Buffer.from(svg(vbLogo, cuerpoLogo(CLARO, "#D9A54A"), `<rect x="${-W / 2}" y="${top}" width="${W}" height="${H}" fill="${VERDE}"/>`))).resize(1200).png().toFile(path.join(RAIZ, "_fuentes/hojas/logo-verde.png"));
await sharp(Buffer.from(favicon)).resize(256).png().toFile(path.join(RAIZ, "_fuentes/hojas/logo-mono.png"));

// Símbolos para usar en la página con <use>: el texto toma currentColor y la onda var(--logo-onda)
const simbolos = `<!-- logo:inicio -->
  <symbol id="logo" viewBox="${vbLogo}">${cuerpoLogo("currentColor", "var(--logo-onda, #C9973F)")}</symbol>
  <symbol id="monograma" viewBox="-50 -50 100 100">${cuerpoMono("currentColor", "var(--logo-onda, #C9973F)")}</symbol>
  <symbol id="onda" viewBox="-78 -12 156 24">${onda(150, 0, 17).map((t, i) => `<path d="${t}" fill="none" stroke="currentColor" stroke-width="${i ? 1.2 : 1.9}" stroke-linecap="round"${i ? ' opacity=".7"' : ""} pathLength="1"/>`).join("")}</symbol>
  <!-- logo:fin -->`;
const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
if (!html.includes("<!-- logo:inicio -->")) throw new Error("index.html no tiene las marcas del logo");
fs.writeFileSync(path.join(RAIZ, "index.html"), html.replace(/<!-- logo:inicio -->[\s\S]*?<!-- logo:fin -->/, simbolos));
console.log(`logo ${W}x${H}, proporción ${(W / H).toFixed(2)}`);
