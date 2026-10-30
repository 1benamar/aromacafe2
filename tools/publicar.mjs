// Sube la web al repositorio 1benamar/aromacafe2:
//   - rama main: el proyecto (web, herramientas y documentación), sin lo privado
//     (_fuentes/ con las fotos y vídeos originales, tools/node_modules/ ni .impeccable/);
//   - rama gh-pages: solo lo que se sirve; GitHub Pages la publica en
//     https://1benamar.github.io/aromacafe2/
// Antes pone una versión nueva (?v=) a styles.css y main.js para saltarse la caché.
// Uso: node tools/publicar.mjs ["mensaje"]
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REMOTO = "https://github.com/1benamar/aromacafe2.git";
const TRABAJO = path.join(RAIZ, ".publicar");
const PUBLICO = ["index.html", "styles.css", "main.js", "favicon.svg", "apple-touch-icon.png", "robots.txt", "sitemap.xml", "assets"];
const sh = (cmd, cwd = RAIZ) => execSync(cmd, { cwd, stdio: ["ignore", "pipe", "inherit"] }).toString().trim();
const ver = (cmd, cwd = RAIZ) => execSync(cmd, { cwd, stdio: "inherit" });
const mensaje = process.argv[2] || "Actualizar la web de Aroma Café";

if (!fs.existsSync(path.join(RAIZ, ".git"))) {
  sh("git init -q -b main");
  sh("git config user.name 1benamar");
  sh("git config user.email benamarsami26@gmail.com");
  sh(`git remote add origin ${REMOTO}`);
}
const remotas = sh("git ls-remote --heads origin");
if (/refs\/heads\/main/.test(remotas)) {
  sh("git fetch -q origin main");
  sh("git reset -q origin/main"); // el índice pasa a ser el de main; los archivos de la carpeta no se tocan
}

const v = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
const html = path.join(RAIZ, "index.html");
fs.writeFileSync(html, fs.readFileSync(html, "utf8").replace(/\?v=\d+/g, "?v=" + v));
if (!fs.existsSync(path.join(RAIZ, ".nojekyll"))) fs.writeFileSync(path.join(RAIZ, ".nojekyll"), "");

// 1. main
sh("git add -A");
if (sh("git status --porcelain")) ver(`git commit -q -m ${JSON.stringify(mensaje)}`);
ver("git push -q -u origin main");

// 2. gh-pages, en una carpeta de trabajo aparte
if (!fs.existsSync(TRABAJO)) {
  if (/refs\/heads\/gh-pages/.test(remotas)) {
    sh("git fetch -q origin gh-pages:gh-pages");
    sh(`git worktree add -q "${TRABAJO}" gh-pages`);
  } else {
    sh(`git worktree add -q --detach "${TRABAJO}"`);
    sh("git checkout -q --orphan gh-pages", TRABAJO);
  }
}
for (const n of fs.readdirSync(TRABAJO)) if (n !== ".git") fs.rmSync(path.join(TRABAJO, n), { recursive: true, force: true });
for (const p of PUBLICO) fs.cpSync(path.join(RAIZ, p), path.join(TRABAJO, p), { recursive: true });
fs.writeFileSync(path.join(TRABAJO, ".nojekyll"), "");
sh("git add -A", TRABAJO);
if (sh("git status --porcelain", TRABAJO)) ver(`git commit -q -m ${JSON.stringify(mensaje)}`, TRABAJO);
ver("git push -q -u origin gh-pages", TRABAJO);
console.log("Enviado a GitHub. La web queda en https://1benamar.github.io/aromacafe2/ (uno o dos minutos).");
