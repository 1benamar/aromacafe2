// Bucles de vídeo sin sonido para la web (solo desarrollo).
// Uso: node tools/videos.mjs [nombre ...]   Lista en tools/videos.json:
// [{n, src, t:[desde,hasta], modo:"fundido"|"vaiven", fundido?, ancho?, kbps?}]
// - "fundido": el final se funde con el principio, así el bucle no salta.
// - "vaiven": adelante y atrás (para barridos de cámara cortos).
// Sale assets/video/<n>.mp4 (H.264, faststart) y <n>.webp (primer fotograma, para el póster).
// Usa el ffmpeg de CapCut (codificador h264_mf); no hay otro en este equipo.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FF = "C:/Users/Usuario/AppData/Local/CapCut/Apps/4.8.0.1820/ffmpeg.exe";
const solo = process.argv.slice(2);
const lista = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/videos.json"), "utf8")).filter(v => !solo.length || solo.includes(v.n));
const dir = path.join(ROOT, "assets/video");
fs.mkdirSync(dir, { recursive: true });

for (const v of lista) {
  const src = path.join(ROOT, "_fuentes/whatsapp", v.src);
  const out = path.join(dir, v.n + ".mp4");
  const [a, b] = v.t, L = +(b - a).toFixed(3), d = v.fundido || 0.8;
  const base = `[0:v]trim=${a}:${b},setpts=PTS-STARTPTS,fps=30,scale=${v.ancho || 464}:-2,format=yuv420p`;
  const grafo = v.modo === "vaiven"
    ? `${base},split[x][y];[y]reverse,trim=start_frame=1,setpts=PTS-STARTPTS[r];[x][r]concat=n=2:v=1:a=0[v]`
    : `${base},split[x][y];[x]trim=start=${d},setpts=PTS-STARTPTS,fps=30[p];[y]trim=0:${d},setpts=PTS-STARTPTS,fps=30[q];[p][q]xfade=transition=fade:duration=${d}:offset=${(L - 2 * d).toFixed(3)}[v]`;
  execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-filter_complex", grafo, "-map", "[v]", "-an",
    "-c:v", "h264_mf", "-b:v", (v.kbps || 1400) + "k", "-g", "60", "-movflags", "+faststart", out]);
  const png = path.join(dir, v.n + ".tmp.png");
  execFileSync(FF, ["-hide_banner", "-loglevel", "error", "-y", "-i", out, "-frames:v", "1", png]);
  await sharp(png).webp({ quality: 74 }).toFile(path.join(dir, v.n + ".webp"));
  fs.unlinkSync(png);
  const m = await sharp(path.join(dir, v.n + ".webp")).metadata();
  console.log(`${v.n}.mp4 ${(fs.statSync(out).size / 1024).toFixed(0)} KB ${m.width}x${m.height}`);
}
