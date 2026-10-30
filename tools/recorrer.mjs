// Recorre una web con scroll real y guarda capturas de pantalla sucesivas (para estudiar referencias).
// Uso: node tools/recorrer.mjs <url> <carpeta-salida> [ancho=1440] [alto=900] [max=14]
import fs from "node:fs";
import puppeteer from "puppeteer-core";

const [url, out, w = "1440", h = "900", max = "14"] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
  args: ["--hide-scrollbars", "--force-color-profile=srgb", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage();
const movil = Number(w) < 600;
await page.setViewport({ width: Number(w), height: Number(h), deviceScaleFactor: 1, isMobile: movil, hasTouch: movil });
await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 }).catch(e => console.log("goto:", e.message));
await new Promise(r => setTimeout(r, 3500));
const total = await page.evaluate(() => document.documentElement.scrollHeight);
console.log("altura", total);
let i = 0;
for (let y = 0; y < total && i < Number(max); y += Number(h) * 0.9, i++) {
  await page.evaluate(yy => window.scrollTo({ top: yy, behavior: "instant" }), y);
  await page.mouse.wheel({ deltaY: 1 });
  await new Promise(r => setTimeout(r, 1600));
  const f = `${out}/${String(i).padStart(2, "0")}.jpg`;
  await page.screenshot({ path: f, type: "jpeg", quality: 70 });
}
console.log("capturas", i);
await browser.close();
