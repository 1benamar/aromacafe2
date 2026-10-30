# Web de Aroma Café Blanes (versión 2, «La barra dorada»)

Web estática de una sola página (HTML, CSS y JavaScript, sin dependencias ni
compilación). Sustituye a la versión de la carta náutica, que sigue guardada en
`webs/aroma-cafe-blanes` y en el historial del repositorio.

## Ver la web en local

    node tools/dev-server.mjs 8885

y abrir http://localhost:8885 (en Claude Code: servidor `aroma-v2`).

Para enseñarla a otra hora del día: `?hora=10:30&dia=5` (0 domingo ... 6 sábado).
Así se ve la placa de «Abierto ahora», la luz de la puerta y el punto dorado del plano
aunque sea de noche.

## Cambiar precios o platos de la carta

1. Editar `tools/carta.json` (cada plato: `n` nombre, `d` descripción opcional,
   `p` precio y `p2` el precio del bocadillo pequeño).
2. Ejecutar `node tools/build.mjs`: reescribe solo el bloque de la carta en
   `index.html` y reparte cada apartado en dos columnas equilibradas.

La carta sale de las fotos de la carta impresa del 29-10-2026 (`_fuentes/`).

## Cambiar el horario (por ejemplo, el de verano)

- `main.js`: objeto `HORARIO` al principio (minutos desde medianoche) y, si cierra
  por temporada, `CIERRE_TEMPORADA`.
- `index.html`: la tabla del horario (sección «Dónde estamos»), el pie y el
  bloque `openingHoursSpecification` del JSON-LD de la cabecera.

## Fotos y vídeos

- Originales en `_fuentes/` (no se publican): zip de WhatsApp del 29-10-2026 y
  fotos de la ficha de Google y de Instagram.
- Fotos: lista de recortes y anchos en `tools/fotos.json`, y `node tools/imagenes.mjs`
  para regenerar las WebP. La foto del interior (`sala-ancha`, en el collage) lleva tapado el cartel del
  extintor con un parche de la propia foto.
- Vídeos: la web no lleva ninguno (el usuario los quitó porque perdían calidad). Los
  bucles que se llegaron a hacer están en `_fuentes/video-sin-usar/` y se regeneran con
  `tools/videos.json` y `node tools/videos.mjs` (ffmpeg de CapCut).
- La portada (`portada`, y `portada-cuadrada` en el móvil) y la banda de croissants
  entre la carta y El local (`banda`) son fotos libres de Unsplash: el capuchino de
  «nameless 3791» y los croissants de Liu Hong (licencia de Unsplash; datos en
  `_fuentes/stock/procedencia.json` y crédito en el pie). El resto son fotos reales del local.
- Cada imagen publicada lleva al lado su procedencia (`*.webp.json`, escrita con
  `impeccable embed-prompt`).

## El plano de «Dónde estamos»

SVG propio dentro de `index.html`, dibujado con los datos de OpenStreetMap de
`_fuentes/osm/blanes.json`: `node tools/plano.mjs` lo regenera. El punto del café se
pone dorado cuando está abierto.

## Capturas para revisar

    node tools/captura.mjs "http://localhost:8885/?hora=10:30&dia=5" salida 1440,390
    node tools/revision.mjs     (juego completo para la revisión, en .impeccable/review/)

## Pendiente del negocio

- Archivo original del logotipo (el nombre se compone con Cinzel, como el rótulo).
- Confirmar si el móvil 617 800 358 tiene WhatsApp (ahora solo «Llamar»).
- Horario de verano y, si lo hay, cierre de invierno.
- Dominio propio y datos del titular para el aviso legal.
