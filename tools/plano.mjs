// Dibuja el plano de «Dónde estamos» (SVG en línea dentro de index.html) con los datos de
// OpenStreetMap de _fuentes/osm/blanes.json (© colaboradores de OpenStreetMap, ODbL).
// Uso: node tools/plano.mjs   (reescribe lo que hay entre <!-- plano:inicio --> y <!-- plano:fin -->)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const datos = JSON.parse(fs.readFileSync(path.join(RAIZ, "_fuentes/osm/blanes.json"), "utf8"));

// Metros con el café en el origen y el norte arriba. Ventana de 900 x 300 m.
const CAFE = { lat: 41.6731067, lon: 2.7910103 };
const KX = 111320 * Math.cos((CAFE.lat * Math.PI) / 180), KY = 110540;
const P = p => [(p.lon - CAFE.lon) * KX, (CAFE.lat - p.lat) * KY];
const VB = { x: -450, y: -150, w: 900, h: 300 };
const r1 = n => Math.round(n * 10) / 10;
const d = (pts, cerrar) => "M" + pts.map(([x, y]) => r1(x) + " " + r1(y)).join("L") + (cerrar ? "Z" : "");
const cerca = pts => pts.some(([x, y]) => x > VB.x - 200 && x < VB.x + VB.w + 200 && y > VB.y - 200 && y < VB.y + VB.h + 200);

function simplificar(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const dist = Math.abs((b[1] - a[1]) * x - (b[0] - a[0]) * y + b[0] * a[1] - b[1] * a[0]) / (Math.hypot(b[0] - a[0], b[1] - a[1]) || 1);
    if (dist > max) { max = dist; idx = i; }
  }
  if (max <= tol) return [a, b];
  return simplificar(pts.slice(0, idx + 1), tol).slice(0, -1).concat(simplificar(pts.slice(idx), tol));
}

// Costa: se unen los tramos y se cierra la tierra por el noroeste (el mar queda al sureste)
const clave = p => p.lat.toFixed(7) + "," + p.lon.toFixed(7);
let tramos = datos.elements.filter(e => e.tags && e.tags.natural === "coastline").map(e => e.geometry.slice());
const cadenas = [];
while (tramos.length) {
  let c = tramos.shift(), crece = true;
  while (crece) {
    crece = false;
    for (let i = 0; i < tramos.length; i++) {
      const t = tramos[i];
      if (clave(t[0]) === clave(c[c.length - 1])) { c = c.concat(t.slice(1)); tramos.splice(i, 1); crece = true; break; }
      if (clave(t[t.length - 1]) === clave(c[0])) { c = t.concat(c.slice(1)); tramos.splice(i, 1); crece = true; break; }
    }
  }
  cadenas.push(c);
}
const costa = simplificar(cadenas.reduce((a, b) => (b.length > a.length ? b : a)).map(P), 0.6);
const [ini, fin] = [costa[0], costa[costa.length - 1]];
const tierra = costa.concat([[fin[0] + 5000, fin[1]], [fin[0] + 5000, -5000], [ini[0] - 5000, -5000], [ini[0] - 5000, ini[1]]]);

const playas = datos.elements.filter(e => e.tags && e.tags.natural === "beach" && e.geometry)
  .map(e => simplificar(e.geometry.map(P), 0.6)).filter(cerca);

// Calles por tipo; el Passeig de Dintre aparte, para resaltarlo
const capas = { mayor: [], menor: [], peatonal: [], senda: [], dintre: [] };
for (const e of datos.elements) {
  const t = e.tags || {};
  if (!t.highway || !e.geometry) continue;
  const crudo = e.geometry.map(P);
  const anillo = clave(e.geometry[0]) === clave(e.geometry[e.geometry.length - 1]);
  const pts = anillo ? crudo : simplificar(crudo, 0.8); // los anillos (áreas peatonales) no se simplifican
  if (!cerca(pts)) continue;
  if (t.name === "Passeig de Dintre") capas.dintre.push(pts);
  else if (/primary|secondary|tertiary/.test(t.highway)) capas.mayor.push(pts);
  else if (t.highway === "footway") capas.senda.push(pts);
  else if (/pedestrian|living_street/.test(t.highway)) capas.peatonal.push(pts);
  else capas.menor.push(pts);
}

// El Passeig de Dintre está dibujado en OSM como un área peatonal: se rellena, y su rótulo
// sigue el eje principal del área, desplazado hacia tierra
const dintre = capas.dintre.flat();
const mx = dintre.reduce((a, p) => a + p[0], 0) / dintre.length, my = dintre.reduce((a, p) => a + p[1], 0) / dintre.length;
let sxx = 0, syy = 0, sxy = 0;
for (const [x, y] of dintre) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
const rad = 0.5 * Math.atan2(2 * sxy, sxx - syy);
const ang = (rad * 180) / Math.PI;
const nx = Math.sin(rad), ny = -Math.cos(rad); // normal hacia el noroeste (tierra)
const lx = mx + 40 * Math.cos(rad), ly = my + 40 * Math.sin(rad);

// Distancia al mar en línea recta, desde los datos (para el dato bajo el plano)
let alMar = Infinity;
for (let i = 1; i < costa.length; i++) {
  const [a, b] = [costa[i - 1], costa[i]];
  const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1;
  const t = Math.max(0, Math.min(1, -(a[0] * vx + a[1] * vy) / l2));
  alMar = Math.min(alMar, Math.hypot(a[0] + t * vx, a[1] + t * vy));
}

const grupo = (lista, clase) => lista.length ? `<path class="${clase}" d="${lista.map(p => d(p)).join("")}"/>` : "";
const svg = `<svg class="plano" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" preserveAspectRatio="xMidYMid slice" role="img" aria-labelledby="plano-titulo">
<title id="plano-titulo">Plano del centro de Blanes con Aroma Café en el Passeig de Dintre, a una calle del paseo marítimo</title>
<rect class="plano-mar" x="${VB.x - 50}" y="${VB.y - 50}" width="${VB.w + 100}" height="${VB.h + 100}"/>
<path class="plano-tierra" d="${d(tierra, true)}"/>
${playas.map(p => `<path class="plano-playa" d="${d(p, true)}"/>`).join("")}
${grupo(capas.senda, "plano-senda")}${grupo(capas.menor, "plano-calle")}${grupo(capas.peatonal, "plano-peatonal")}${grupo(capas.mayor, "plano-mayor")}${capas.dintre.map(p => `<path class="plano-dintre" d="${d(p, true)}"/>`).join("")}
<text class="plano-rotulo" transform="translate(${r1(lx + nx * 20)} ${r1(ly + ny * 20)}) rotate(${r1(ang)})" text-anchor="middle">Passeig de Dintre</text>
<text class="plano-agua" x="118" y="128" text-anchor="middle">Platja de Blanes</text>
<g class="plano-cafe"><circle class="plano-halo" r="15"/><circle class="plano-punto" r="7.5"/></g>
<text class="plano-nombre" x="-22" y="-14" text-anchor="end">Aroma Café</text>
</svg>`;

const html = fs.readFileSync(path.join(RAIZ, "index.html"), "utf8");
if (!html.includes("<!-- plano:inicio -->")) throw new Error("index.html no tiene las marcas del plano");
fs.writeFileSync(path.join(RAIZ, "index.html"), html.replace(/<!-- plano:inicio -->[\s\S]*?<!-- plano:fin -->/, `<!-- plano:inicio -->\n${svg}\n<!-- plano:fin -->`));
console.log(`plano: ${(svg.length / 1024).toFixed(1)} KB, ángulo del Passeig ${ang.toFixed(1)}°, al mar ${Math.round(alMar)} m`);
