// Genera la carta (pestañas y paneles) dentro de index.html a partir de tools/carta.json.
// Uso: node tools/build.mjs   (reescribe solo lo que hay entre <!-- carta:inicio --> y <!-- carta:fin -->)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const carta = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/carta.json"), "utf8"));
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const euro = p => (p ? `${p} €` : "");

// Cada apartado se convierte en una lista de piezas con peso (cabecera, platos, pie)
// para repartirlas en dos columnas de altura parecida.
function piezas(grupo) {
  const out = [];
  grupo.secciones.forEach((s, si) => {
    out.push({ tipo: "cab", si, peso: 2.2 + (s.nota || s.tamanos ? 0.5 : 0) });
    s.platos.forEach(p => out.push({ tipo: "plato", si, p, peso: 1 + (p.d ? 0.75 : 0) }));
    if (s.pie) out.push({ tipo: "pie", si, peso: 0.8 });
  });
  return out;
}

function repartir(lista) {
  const total = lista.reduce((a, x) => a + x.peso, 0);
  const cortes = [];
  let acum = 0;
  lista.forEach((x, i) => {
    acum += x.peso;
    const sig = lista[i + 1];
    // nunca dejar una cabecera sola al final de la columna ni separar el pie de su apartado
    if (!sig || x.tipo === "cab" || sig.tipo === "pie") return;
    cortes.push({ i: i + 1, dif: Math.abs(total - 2 * acum), limpio: sig.tipo === "cab" });
  });
  const limpios = cortes.filter(c => c.limpio).sort((a, b) => a.dif - b.dif);
  const todos = [...cortes].sort((a, b) => a.dif - b.dif);
  // se prefiere cortar entre apartados si el desequilibrio no pasa del 25 %
  const elegido = limpios.length && limpios[0].dif <= total * 0.25 ? limpios[0] : todos[0];
  return elegido ? [lista.slice(0, elegido.i), lista.slice(elegido.i)] : [lista, []];
}

function columna(grupo, trozo) {
  let out = "", abierta = null;
  const cerrar = () => { if (abierta !== null) { out += "</ul></section>"; abierta = null; } };
  trozo.forEach((x, k) => {
    const s = grupo.secciones[x.si];
    if (x.tipo === "cab" || (k === 0 && x.tipo !== "cab")) {
      cerrar();
      const sigue = x.tipo !== "cab";
      out += `<section class="seccion${sigue ? " seccion-sigue" : ""}"${sigue ? ` aria-label="${esc(s.titulo)}, continuación"` : ""}>`;
      if (!sigue) {
        out += `<h4 class="seccion-titulo">${esc(s.titulo)}</h4>`;
        if (s.nota) out += `<p class="seccion-nota">${esc(s.nota)}</p>`;
      }
      if (s.tamanos) out += `<p class="tamanos" aria-hidden="true"><span>${esc(s.tamanos[0])}</span><span>${esc(s.tamanos[1])}</span></p>`;
      out += `<ul class="platos${s.tamanos ? " platos-dos" : ""}">`;
      abierta = x.si;
      if (sigue) out += plato(s, x);
      return;
    }
    if (x.tipo === "pie") { out += `</ul><p class="seccion-pie">${esc(s.pie)}</p><ul class="platos" hidden>`; return; }
    out += plato(s, x);
  });
  cerrar();
  return out.replace(/<ul class="platos" hidden><\/ul>/g, "");
}

function plato(s, x) {
  const p = x.p;
  const precios = s.tamanos
    ? `<span class="plato-p"><span class="sr">${esc(s.tamanos[0])}: </span>${euro(p.p)}</span><span class="plato-p plato-p2">${p.p2 ? `<span class="sr">${esc(s.tamanos[1])}: </span>${euro(p.p2)}` : ""}</span>`
    : `<span class="plato-p">${euro(p.p)}</span>`;
  return `<li class="plato"><div class="plato-fila"><span class="plato-n">${esc(p.n)}</span><span class="plato-puntos" aria-hidden="true"></span>${precios}</div>${p.d ? `<p class="plato-d">${esc(p.d)}</p>` : ""}</li>`;
}

function foto(f) {
  const anchos = f.id === "desayuno" ? [600, 1000] : [600, 900];
  const srcset = anchos.map(w => `assets/img/${f.id}-${w}.webp ${w}w`).join(", ");
  return `<figure class="panel-foto" data-revelar><div class="marco-oro"><img src="assets/img/${f.id}-600.webp" srcset="${srcset}" sizes="(min-width: 1024px) 300px, (min-width: 768px) 30vw, 80vw" width="600" height="${f.id === "desayuno" ? 570 : 800}" loading="lazy" decoding="async" alt="${esc(f.alt)}"></div><figcaption>${esc(f.pie)}</figcaption></figure>`;
}

let pestanas = `<div class="pestanas" role="tablist" aria-label="Apartados de la carta">`;
let paneles = "";
carta.grupos.forEach((g, i) => {
  pestanas += `<button class="pestana" type="button" role="tab" id="pestana-${g.id}" aria-controls="panel-${g.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-grupo="${g.id}">${esc(g.nombre)}</button>`;
  const [izq, der] = repartir(piezas(g));
  paneles += `<div class="panel${i === 0 ? " activo" : ""}${g.foto ? "" : " sin-foto"}" id="panel-${g.id}" role="tabpanel" aria-labelledby="pestana-${g.id}" tabindex="0" data-panel="${g.id}">`
    + `<h3 class="panel-titulo">${esc(g.nombre)}</h3>`
    + `<div class="panel-cuerpo"><div class="columna">${columna(g, izq)}</div>`
    + (g.foto ? foto(g.foto) : "")
    + `<div class="columna">${columna(g, der)}</div></div></div>`;
});
pestanas += `<button class="pestana pestana-toda" type="button" role="tab" id="pestana-toda" aria-controls="${carta.grupos.map(g => "panel-" + g.id).join(" ")}" aria-selected="false" tabindex="-1" data-grupo="toda">Toda la carta</button>`;
pestanas += `<span class="pestanas-marca" aria-hidden="true"></span></div>`;

const bloque = `<!-- carta:inicio -->\n${pestanas}\n<div class="paneles" data-paneles>${paneles}</div>\n<!-- carta:fin -->`;
const nuevo = html.replace(/<!-- carta:inicio -->[\s\S]*?<!-- carta:fin -->/, bloque);
if (nuevo === html && !html.includes("<!-- carta:inicio -->")) throw new Error("index.html no tiene las marcas de la carta");
fs.writeFileSync(path.join(ROOT, "index.html"), nuevo);
const n = carta.grupos.reduce((a, g) => a + g.secciones.reduce((b, s) => b + s.platos.length, 0), 0);
console.log(`carta: ${carta.grupos.length} apartados, ${n} platos`);
