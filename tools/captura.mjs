// Capturas de página completa con el Chrome instalado (solo desarrollo).
// Uso: node tools/captura.mjs <url> <prefijo-salida> [anchos=1440,390] [--alto=900] [--vista] [--hora=HH:MM]
// Desactiva transiciones, revela lo que aparece al bajar y fija la portada a la altura de la ventana.
import puppeteer from "puppeteer-core";

const args = process.argv.slice(2);
const url = args[0], salida = args[1];
const anchos = (args[2] && !args[2].startsWith("--") ? args[2] : "1440,390").split(",").map(Number);
const alto = Number((args.find(a => a.startsWith("--alto=")) || "--alto=900").split("=")[1]);
const soloVista = args.includes("--vista");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--autoplay-policy=no-user-gesture-required"],
});
for (const w of anchos) {
  const page = await browser.newPage();
  const movil = w < 600;
  const h = movil ? 844 : alto;
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: movil, hasTouch: movil });
  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36");
  page.on("pageerror", e => console.log("ERROR de página:", e.message));
  page.on("console", m => { if (m.type() === "error") console.log("consola:", m.text()); });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise(r => setTimeout(r, 2600));
  await page.addStyleTag({ content: `*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:0s!important;animation-delay:0s!important;scroll-behavior:auto!important} .portada{min-height:${h}px!important}` });
  await page.evaluate(async () => {
    document.documentElement.classList.add("listo");
    document.querySelectorAll("[data-revelar]").forEach(e => e.classList.add("visto"));
    document.querySelectorAll("[data-luz]").forEach(e => e.classList.add("encendida"));
    document.querySelectorAll("img[loading=lazy]").forEach(i => { i.loading = "eager"; });
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += 700) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); }
    window.scrollTo(0, 0);
    await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  });
  await new Promise(r => setTimeout(r, 1200));
  const archivo = `${salida}-${w}.png`;
  await page.screenshot({ path: archivo, fullPage: !soloVista });
  console.log("captura", archivo, await page.evaluate(() => document.documentElement.scrollHeight));
  await page.close();
}
await browser.close();
