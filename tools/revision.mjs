// Capturas para la revisión final (solo desarrollo). Las deja en .impeccable/review/.
// Uso: node tools/revision.mjs [url=http://localhost:8885/?hora=10:30&dia=5]
//   desktop.png y mobile.png: página entera con el mapa cargado (sin la barra fija del móvil)
//   mobile-barra.png: pantalla del móvil pasada la portada, con la barra fija abajo
//   desktop-cabecera.png: pantalla de escritorio con la cabecera sólida al bajar
//   carta-toda-1440.png y carta-toda-390.png: la carta con «Toda la carta»
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const url = process.argv[2] || "http://localhost:8885/?hora=10:30&dia=5";
const dir = ".impeccable/review";
fs.mkdirSync(dir, { recursive: true });
const espera = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

async function abrir(w, h) {
  const page = await browser.newPage();
  const movil = w < 600;
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: movil, hasTouch: movil });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
  page.on("pageerror", e => console.log("ERROR de página:", e.message));
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await espera(2400);
  await page.addStyleTag({ content: `*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;scroll-behavior:auto!important} .portada{min-height:${h}px!important}` });
  await page.evaluate(() => {
    document.documentElement.classList.add("listo");
    document.querySelectorAll("[data-revelar]").forEach(e => e.classList.add("visto"));
    document.querySelectorAll("[data-luz]").forEach(e => e.classList.add("encendida"));
    document.querySelectorAll("img[loading=lazy]").forEach(i => { i.loading = "eager"; });
  });
  return page;
}

async function cargarTodo(page) {
  await page.evaluate(async () => {
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); }
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await espera(900);
}

// Página entera, escritorio y móvil
for (const [w, h, nombre] of [[1440, 900, "desktop"], [390, 844, "mobile"]]) {
  const page = await abrir(w, h);
  await cargarTodo(page);
  await page.addStyleTag({ content: ".barra-movil{display:none!important}" });
  await page.screenshot({ path: `${dir}/${nombre}.png`, fullPage: true });
  console.log("captura", nombre);

  // La carta con «Toda la carta»
  await page.evaluate(() => document.querySelector("#pestana-toda").click());
  await espera(500);
  const carta = await page.$("#carta");
  await carta.screenshot({ path: `${dir}/carta-toda-${w}.png` });
  console.log("captura carta-toda", w);
  await page.close();
}

// Cabecera sólida al bajar (escritorio)
{
  const page = await abrir(1440, 900);
  await page.evaluate(() => window.scrollTo(0, 1150));
  await espera(900);
  await page.screenshot({ path: `${dir}/desktop-cabecera.png` });
  console.log("captura desktop-cabecera");
  await page.close();
}

// Barra fija del móvil, pasada la portada
{
  const page = await abrir(390, 844);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await espera(900);
  await page.screenshot({ path: `${dir}/mobile-barra.png` });
  console.log("captura mobile-barra");
  await page.close();
}

await browser.close();
