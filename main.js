// Aroma Café Blanes: estado de hoy, carta por pestañas, menú y apariciones.
(function () {
  "use strict";

  // Horario (hora de Blanes). Minutos desde medianoche: [abre, cierra]. null = cerrado.
  // 0 domingo, 1 lunes ... 6 sábado. Para el verano, cambiar aquí y en la tabla de index.html.
  var HORARIO = {
    0: [540, 1080],
    1: [540, 1080],
    2: [540, 1080],
    3: null,
    4: [540, 1080],
    5: [540, 1080],
    6: [540, 1380]
  };
  // Cierre por temporada, si lo hay: { desde: "2026-12-20", hasta: "2027-02-14", vuelta: "el 15 de febrero" }
  var CIERRE_TEMPORADA = null;
  var FIN_DESAYUNOS = 720; // 12:00

  var raiz = document.documentElement;
  var reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var movil = window.matchMedia("(max-width: 767px)");
  var DIAS = ["el domingo", "el lunes", "el martes", "el miércoles", "el jueves", "el viernes", "el sábado"];

  function ahora() {
    var partes = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid", weekday: "short", year: "numeric", month: "2-digit",
      day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date());
    var v = function (t) { for (var i = 0; i < partes.length; i++) if (partes[i].type === t) return partes[i].value; return ""; };
    var dias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var t = { dia: dias[v("weekday")], min: (+v("hour") % 24) * 60 + +v("minute"), fecha: v("year") + "-" + v("month") + "-" + v("day") };
    // Para enseñar la web a otra hora: ?hora=10:30&dia=5 (0 domingo ... 6 sábado)
    var q = new URLSearchParams(location.search), h = /^([0-9]{1,2}):([0-9]{2})$/.exec(q.get("hora") || "");
    if (h) t.min = +h[1] * 60 + +h[2];
    if (/^[0-6]$/.test(q.get("dia") || "")) t.dia = +q.get("dia");
    return t;
  }

  function hora(m) { return Math.floor(m / 60) + ":" + String(m % 60).padStart(2, "0"); }

  function estado(t) {
    if (CIERRE_TEMPORADA && t.fecha >= CIERRE_TEMPORADA.desde && t.fecha <= CIERRE_TEMPORADA.hasta) {
      return { abierto: false, texto: "Cerrado por temporada", detalle: "volvemos " + CIERRE_TEMPORADA.vuelta };
    }
    var hoy = HORARIO[t.dia];
    if (hoy && t.min >= hoy[0] && t.min < hoy[1]) {
      return { abierto: true, texto: "Abierto ahora", detalle: "hasta las " + hora(hoy[1]) };
    }
    if (hoy && t.min < hoy[0]) return { abierto: false, texto: "Cerrado ahora", detalle: "abrimos hoy a las " + hora(hoy[0]) };
    for (var i = 1; i <= 7; i++) {
      var d = (t.dia + i) % 7, h = HORARIO[d];
      if (h) return { abierto: false, texto: "Cerrado ahora", detalle: "abrimos " + (i === 1 ? "mañana" : DIAS[d]) + " a las " + hora(h[0]) };
    }
    return { abierto: false, texto: "Cerrado ahora", detalle: "" };
  }

  var elEstado = document.querySelector("[data-hoy-estado]");
  var elDetalle = document.querySelector("[data-hoy-detalle]");
  function pintarEstado() {
    var t = ahora(), e = estado(t);
    raiz.classList.toggle("abierto", e.abierto);
    if (elEstado) elEstado.textContent = e.texto;
    if (elDetalle) elDetalle.textContent = e.detalle ? ", " + e.detalle : "";
    var filas = document.querySelectorAll("[data-horario] tr");
    for (var i = 0; i < filas.length; i++) {
      var es = +filas[i].getAttribute("data-dia") === t.dia;
      filas[i].classList.toggle("hoy-fila", es);
      if (es) filas[i].setAttribute("aria-current", "date"); else filas[i].removeAttribute("aria-current");
    }
    return t;
  }
  var t0 = pintarEstado();
  setInterval(pintarEstado, 60000);

  // Entrada de la portada y luz de la barra
  ["portada-titulo", "portada-frase", "portada-botones"].forEach(function (c) {
    var el = document.querySelector("." + c);
    if (el) el.classList.add("entra");
  });
  function listo() { setTimeout(function () { raiz.classList.add("listo"); }, 60); }
  if (document.readyState === "complete") listo(); else window.addEventListener("load", listo);

  // Carta por pestañas
  var lista = document.querySelector(".pestanas");
  var paneles = document.querySelector("[data-paneles]");
  if (lista && paneles) {
    var pestanas = Array.prototype.slice.call(lista.querySelectorAll("[role=tab]"));
    var marca = lista.querySelector(".pestanas-marca");
    var colocarMarca = function () {
      var activa = lista.querySelector("[aria-selected=true]");
      if (!activa || !marca) return;
      marca.style.setProperty("--x", activa.offsetLeft + "px");
      marca.style.setProperty("--w", (activa.offsetWidth / 100).toFixed(4));
    };
    var elegir = function (pestana, enfocar) {
      var id = pestana.getAttribute("data-grupo");
      pestanas.forEach(function (p) {
        var si = p === pestana;
        p.setAttribute("aria-selected", si ? "true" : "false");
        p.tabIndex = si ? 0 : -1;
      });
      var todos = paneles.querySelectorAll("[data-panel]");
      paneles.classList.toggle("toda", id === "toda");
      for (var i = 0; i < todos.length; i++) {
        var ver = id === "toda" || todos[i].getAttribute("data-panel") === id;
        todos[i].classList.toggle("activo", ver);
      }
      if (enfocar) pestana.focus();
      colocarMarca();
      if (movil.matches && pestana.scrollIntoView) pestana.scrollIntoView({ block: "nearest", inline: "center", behavior: reducir ? "auto" : "smooth" });
    };
    pestanas.forEach(function (p, i) {
      p.addEventListener("click", function () {
        elegir(p, false);
        var arriba = lista.getBoundingClientRect().top;
        if (arriba < 0) lista.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
      });
      p.addEventListener("keydown", function (e) {
        var n = pestanas.length, j = null;
        if (e.key === "ArrowRight") j = (i + 1) % n;
        else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
        else if (e.key === "Home") j = 0;
        else if (e.key === "End") j = n - 1;
        if (j !== null) { e.preventDefault(); elegir(pestanas[j], true); }
      });
    });
    // Por la mañana se abre por los desayunos; después, por las tapas
    var inicial = (HORARIO[t0.dia] && t0.min < FIN_DESAYUNOS) ? "desayunos" : "tapas";
    var p0 = lista.querySelector('[data-grupo="' + inicial + '"]') || pestanas[0];
    elegir(p0, false);
    window.addEventListener("resize", colocarMarca);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(colocarMarca);
  }

  // Cabecera sólida al salir de la portada y barra de acciones en el móvil
  var cabecera = document.querySelector("[data-cabecera]");
  var portada = document.querySelector(".portada");
  var barra = document.querySelector(".barra-movil");
  var botones = document.querySelector(".portada-botones");
  if ("IntersectionObserver" in window) {
    if (cabecera && portada) {
      new IntersectionObserver(function (entradas) {
        cabecera.classList.toggle("solida", !entradas[0].isIntersecting);
      }, { rootMargin: "-76px 0px 0px 0px", threshold: 0 }).observe(portada.querySelector(".hoy") || portada);
    }
    if (barra && botones) {
      new IntersectionObserver(function (entradas) {
        var e = entradas[0];
        barra.classList.toggle("visible", !e.isIntersecting && e.boundingClientRect.top < 0);
      }, { threshold: 0 }).observe(botones);
    }

    // Apariciones al bajar, una sola vez
    var revelar = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("visto"); revelar.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    document.querySelectorAll("[data-revelar]").forEach(function (el) { revelar.observe(el); });

    // El relieve de la barra se enciende al llegar a El local
    var luz = document.querySelector("[data-luz]");
    if (luz) {
      new IntersectionObserver(function (entradas, obs) {
        if (entradas[0].isIntersecting) { luz.classList.add("encendida"); obs.disconnect(); }
      }, { threshold: 0.45 }).observe(luz);
    }

  } else {
    document.querySelectorAll("[data-revelar]").forEach(function (el) { el.classList.add("visto"); });
    var lz = document.querySelector("[data-luz]");
    if (lz) lz.classList.add("encendida");
  }

  // Menú del móvil
  var menu = document.querySelector("[data-menu]");
  var abrir = document.querySelector("[data-menu-abrir]");
  if (menu && abrir && typeof menu.showModal === "function") {
    abrir.addEventListener("click", function () {
      menu.showModal();
      raiz.classList.add("menu-abierto");
      abrir.setAttribute("aria-expanded", "true");
    });
    // se limpia al cerrar por cualquier vía (botón, enlace o Escape) sin depender del evento close
    var limpiar = function () {
      raiz.classList.remove("menu-abierto");
      abrir.setAttribute("aria-expanded", "false");
    };
    var cerrarMenu = function () { if (menu.open) menu.close(); limpiar(); };
    menu.querySelector("[data-menu-cerrar]").addEventListener("click", cerrarMenu);
    menu.querySelectorAll("[data-menu-ir]").forEach(function (a) { a.addEventListener("click", cerrarMenu); });
    menu.addEventListener("cancel", limpiar);
    menu.addEventListener("close", limpiar);
  }
})();
