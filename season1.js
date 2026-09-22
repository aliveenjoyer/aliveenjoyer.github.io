(() => {
  "use strict";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) document.documentElement.classList.add("no-motion");
  const SVG = "http://www.w3.org/2000/svg";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- ceiling lamps, same as the main page ---------- */
  const canvas = $(".ceiling");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const colors = ["#ddf5f0", "#f4b860", "#f7a8c8", "#b9a6ff", "#ddf5f0"];
    let dots = [], w = 0, h = 0, running = true, raf = 0;
    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = Array.from({ length: Math.round((w * h) / 6000) }, () => {
        const y = Math.pow(Math.random(), 2.2) * h * 0.9;
        return { x: Math.random() * w, y, s: Math.random() < 0.15 ? 3 : 2, c: colors[(Math.random() * colors.length) | 0],
                 p: Math.random() * Math.PI * 2, v: 0.25 + Math.random() * 0.6, base: 0.25 + 0.55 * (1 - y / h) };
      });
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        ctx.globalAlpha = Math.max(0, reduceMotion ? d.base : d.base * (0.55 + 0.45 * Math.sin(d.p + t * 0.001 * d.v)));
        ctx.fillStyle = d.c;
        ctx.fillRect(Math.round(d.x), Math.round(d.y), d.s, d.s);
      }
      ctx.globalAlpha = 1;
      if (!reduceMotion && running) raf = requestAnimationFrame(draw);
    };
    seed(); draw(0);
    let rt;
    window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { seed(); if (reduceMotion) draw(0); }, 150); });
    if (!reduceMotion && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(draw); }
        if (!e.isIntersecting) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
  }

  /* ---------- pixel faces from the nick: the same algorithm as the main page's roster ---------- */
  const avatar = (nick) => {
    let h = 2166136261;
    for (const ch of nick.toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    let s = h >>> 0;
    const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const skins = [["#3a3356", "#4b4270", "#2a2446"], ["#2f4550", "#3d5a66", "#223540"], ["#4a3448", "#5e4460", "#352436"],
                   ["#3c4633", "#4d5a41", "#2b3325"], ["#4a3c30", "#5f4d3d", "#352a21"], ["#343a58", "#444c72", "#262a42"]];
    const eyes = ["#6cd3b6", "#f4b860", "#ee8793", "#b9a6ff", "#ddf5f0"];
    const [base, light, dark] = skins[Math.floor(rnd() * skins.length)];
    const eye = eyes[Math.floor(rnd() * eyes.length)];
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", "0 0 8 8"); svg.setAttribute("class", "ava"); svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("shape-rendering", "crispEdges");
    const px = (x, y, c, o) => {
      const r = document.createElementNS(SVG, "rect");
      r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", 1); r.setAttribute("height", 1); r.setAttribute("fill", c);
      if (o) r.setAttribute("opacity", o);
      svg.appendChild(r);
    };
    const hood = rnd() < 0.5;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        if (hood && y === 0 && x === 0) continue;
        const v = rnd();
        const c = y < 2 ? (v < 0.6 ? dark : base) : v < 0.2 ? light : v < 0.32 ? dark : base;
        px(x, y, c); px(7 - x, y, c);
      }
    }
    const ey = 3 + (rnd() < 0.5 ? 0 : 1), ex = rnd() < 0.65 ? 2 : 1;
    px(ex, ey, eye); px(7 - ex, ey, eye);
    px(ex, ey + 1, eye, 0.35); px(7 - ex, ey + 1, eye, 0.35);
    if (rnd() < 0.55) { px(3, ey + 3 > 7 ? 7 : ey + 3, dark); px(4, ey + 3 > 7 ? 7 : ey + 3, dark); }
    return svg;
  };
  $$("[data-ava]").forEach((el) => el.prepend(avatar(el.dataset.ava)));
  $$("[data-ava-big]").forEach((el) => el.appendChild(avatar(el.dataset.avaBig)));
  $$("[data-face]").forEach((el) => el.appendChild(avatar(el.dataset.face)));

  /* ---------- pixel sprites: rows of characters, one colour per character ---------- */
  const sprite = (rows, pal) => {
    const svg = document.createElementNS(SVG, "svg");
    svg.setAttribute("viewBox", `0 0 ${rows[0].length} ${rows.length}`);
    svg.setAttribute("aria-hidden", "true"); svg.setAttribute("shape-rendering", "crispEdges");
    rows.forEach((row, y) => [...row].forEach((ch, x) => {
      if (!pal[ch]) return;
      const r = document.createElementNS(SVG, "rect");
      r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", 1); r.setAttribute("height", 1); r.setAttribute("fill", pal[ch]);
      svg.appendChild(r);
    }));
    return svg;
  };
  const L = "#f4b860", C = "#6cd3b6", B = "#ee8793", P = "#ece6f7", V = "#b9a6ff", S = "#574e70", W = "#b98a4c", VOID = "#15122a";
  const ICONS = {
    player: [["..aaaa..", "..abba..", "..aaaa..", "..aaaa..", ".cccccc.", ".cccccc.", "..c..c..", "..c..c.."], { a: "#d9b08c", b: VOID, c: C }],
    clock: [["..aaaa..", ".a....a.", "a...b..a", "a...b..a", "a...bb.a", "a......a", ".a....a.", "..aaaa.."], { a: L, b: P }],
    sword: [["......aa", ".....aaa", "....aaa.", ".b.aaa..", "..baa...", "..bb....", ".b..b...", "b......."], { a: P, b: L }],
    skull: [[".aaaaaa.", "aaaaaaaa", "a..aa..a", "a..aa..a", "aaaaaaaa", ".aa..aa.", ".a.aa.a.", "........"], { a: P }],
    boot: [["..aaa...", "..aaa...", "..aaa...", "..aaa...", "..aaaaa.", "..aaaaaa", "..aaaaaa", "..bbbbbb"], { a: W, b: S }],
    pick: [["..aaaa..", ".a.bb.a.", "a..b...a", "...b....", "...b....", "...b....", "...b....", "...b...."], { a: C, b: W }],
    craft: [["aaaaaaaa", "abbabbaa", "abbabbaa", "aaaaaaaa", "abbabbaa", "abbabbaa", "aaaaaaaa", "........"], { a: W, b: "#6b4a2b" }],
    jump: [["...aa...", "..aaaa..", ".aaaaaa.", "...aa...", "...aa...", "...aa...", ".bbbbbb.", "........"], { a: C, b: S }],
    peak: [["........", "......a.", ".....aa.", "..a.aa..", ".aaaa...", "aa......", "........", "bbbbbbbb"], { a: V, b: S }],
    chat: [["aaaaaaaa", "a......a", "a.b.b.ba", "a......a", "aaaaaaaa", ".aa.....", ".a......", "........"], { a: P, b: L }],
    power: [["...a....", ".a.a.a..", "a..a..a.", "a.....a.", "a.....a.", ".a...a..", "..aaa...", "........"], { a: B }],
    fish: [["........", "b..aaa..", "bbaaaaa.", ".baaaeaa", ".baaaaaa", "bbaaaaa.", "b..aaa..", "........"], { a: "#8fd3ff", b: C, e: VOID }],
  };
  $$("[data-icon]").forEach((el) => { const i = ICONS[el.dataset.icon]; if (i) el.appendChild(sprite(i[0], i[1])); });
  const crown = $(".s1-crown");
  if (crown) crown.appendChild(sprite(["a..a..a.", "a..a..a.", "aa.aa.aa", "aaaaaaaa", "abaacaab", "aaaaaaaa", "........", "........"], { a: L, b: B, c: C }));
  const moth = { a: "#8a86aa", b: B, c: "#b7aecb", d: "#4b4270" };
  const MOTH_UP = ["................", ".aa..........aa.", "aaaa..c..c..aaaa", "aaaaa.cddc.aaaaa", "aabaaaddddaaabaa", "aaaaaaddddaaaaaa",
                   ".aaaaaddddaaaaa.", "..aaa.dddd.aaa..", "...a..dddd..a...", "......dddd......", ".......dd.......", "................"];
  const MOTH_DOWN = ["....a......a....", "...aaa....aaa...", "..aaaa.cc.aaaa..", "..aaaacddcaaaa..", "..abaaddddaaba..", "...aaaddddaaa...",
                     "....aaddddaa....", "......dddd......", "......dddd......", "......dddd......", ".......dd.......", "................"];
  [[".s1-moth-a", MOTH_UP], [".s1-moth-b", MOTH_DOWN]].forEach(([sel, rows]) => {
    const old = $(sel);
    if (!old) return;
    const svg = sprite(rows, moth);
    svg.setAttribute("class", sel.slice(1));
    old.replaceWith(svg);
  });

  /* ---------- counters ---------- */
  const fmt = (v, dec) => v.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const count = (el) => {
    const to = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec || "0", 10), plus = el.dataset.plus ? "+" : "";
    if (reduceMotion) { el.textContent = fmt(to, dec) + plus; return; }
    const t0 = performance.now(), dur = 1400 + Math.min(900, Math.log10(to + 1) * 180);
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(dec ? Math.round(to * e * 10 ** dec) / 10 ** dec : Math.round(to * e), dec) + (k === 1 ? plus : "");
      if (k < 1) requestAnimationFrame(step);
    };
    el.textContent = fmt(0, dec);
    requestAnimationFrame(step);
  };

  /* ---------- reveal on scroll ---------- */
  $$(".reveal").forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--i", Math.min(8, sibs.indexOf(el)));
  });
  const onSeen = (els, fn, threshold = 0.2) => {
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(fn); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
    }), { threshold, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  onSeen($$(".reveal"), (el) => el.classList.add("in"), 0.15);
  onSeen($$("[data-count]"), count, 0.6);
  onSeen($$(".s1-boss"), (el) => el.classList.add("dead"), 0.55);

  /* ---------- hero: the stamp lands, the save bar fills ---------- */
  const hero = $(".s1-hero"), stamp = $(".s1-stamp");
  const thud = () => { if (reduceMotion) return; hero.classList.remove("thud"); void hero.offsetWidth; hero.classList.add("thud"); };
  if (!reduceMotion) setTimeout(thud, 1450);
  const save = $(".s1-save");
  const saved = () => { save.classList.add("done"); $(".s1-save-text", save).textContent = "Мир сохранён · 4,1 ГБ"; };
  if (reduceMotion) saved(); else setTimeout(saved, 3000);

  /* ---------- sortable table ---------- */
  const COLS = ["n", "h", "d", "x", "m", "km", "b", "dia", "a"];
  const ROWS = [
    ["voV4ick_XXL", 41.2, 8, 113, 2101, 191.9, 25713, 34, 184], ["aliveenjoyer", 39.1, 8, 40, 405, 204.3, 6918, 1, 107],
    ["ivycraft", 37.9, 7, 74, 3199, 440.7, 9151, 37, 193], ["ramzBOSS", 15.4, 4, 93, 132, 58.3, 10493, 19, 62],
    ["anstlixx", 12.0, 4, 19, 222, 74.9, 4100, 0, 75], ["dsy", 11.7, 6, 67, 313, 83.3, 1100, 5, 104],
    ["Dodge", 9.1, 2, 30, 284, 68.6, 2763, 7, 90], ["aiihosh1no", 7.9, 3, 17, 33, 47.4, 1030, 4, 57],
    ["Yaivei", 7.0, 2, 6, 104, 44.1, 2860, 0, 49], ["QissMe", 6.5, 4, 4, 19, 35.0, 2324, 0, 27],
    ["rt1na1n", 4.2, 3, 24, 94, 26.1, 1118, 0, 57], ["Blarian_dk", 0.7, 1, 3, 21, 4.0, 102, 0, 26],
    ["0ttak", 0.5, 2, 2, 2, 3.5, 219, 0, 15], ["StevenXUX", 0.4, 1, 0, 8, 2.3, 134, 0, 17],
  ];
  const table = $(".s1-table");
  if (table) {
    const body = $("tbody", table), heads = $$("th", table);
    const best = COLS.map((_, i) => (i ? Math.max(...ROWS.map((r) => r[i])) : null));
    const maxH = best[1];
    let key = 1, dir = -1;
    const render = () => {
      const rows = ROWS.slice().sort((a, b) => (key ? (a[key] - b[key]) * dir || b[1] - a[1] : a[0].localeCompare(b[0], "ru") * dir));
      body.textContent = "";
      for (const r of rows) {
        const tr = document.createElement("tr");
        r.forEach((v, i) => {
          const td = document.createElement("td");
          if (i === 0) { const s = document.createElement("span"); s.dataset.ava = v; s.textContent = v; s.prepend(avatar(v)); td.appendChild(s); }
          else {
            if (i === 1) { const bar = document.createElement("span"); bar.className = "s1-hbar"; bar.style.width = (v / maxH) * 4 + "rem"; td.appendChild(bar); }
            td.appendChild(document.createTextNode(fmt(v, i === 1 || i === 5 ? 1 : 0)));
            if (v === best[i] && v > 0) td.classList.add("best");
          }
          tr.appendChild(td);
        });
        body.appendChild(tr);
      }
      heads.forEach((th, i) => {
        if (i === key) th.setAttribute("aria-sort", dir > 0 ? "ascending" : "descending"); else th.removeAttribute("aria-sort");
      });
    };
    heads.forEach((th, i) => {
      th.tabIndex = 0;
      const pick = () => { if (key === i) dir = -dir; else { key = i; dir = i ? -1 : 1; } render(); };
      th.addEventListener("click", pick);
      th.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
    });
    render();
  }

  /* ---------- toast ---------- */
  let toastTimer;
  const toast = (text) => {
    let t = $(".s1-toast");
    if (!t) { t = document.createElement("div"); t.className = "s1-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  };

  /* ---------- the fish that nobody caught ---------- */
  const FISH = [["............", "b....aaaa...", "bb.aaaaaaa..", ".baaaaaaeaa.", ".baaaaaaaaaa", "bb.aaaaaaa..", "b....aaaa...", "............"],
                { a: "#8fd3ff", b: C, e: VOID }];
  const lines = ["Рыба уплыла. Поймано: 0", "Опять мимо. Поймано: всё ещё 0", "Рыба передаёт привет ivycraft",
                 "Вакансия рыбака по-прежнему открыта", "Может, во втором сезоне"];
  let tries = 0;
  const fishBtn = $(".s1-fish-btn"), pond = $(".s1-fishes");
  if (fishBtn && pond) fishBtn.addEventListener("click", () => {
    toast(lines[Math.min(tries++, lines.length - 1)]);
    if (reduceMotion) return;
    for (let i = 0; i < 6; i++) {
      const f = document.createElement("div");
      f.className = "s1-swim";
      f.style.top = 10 + Math.random() * 75 + "vh";
      f.style.setProperty("--d", 2.6 + Math.random() * 2.6 + "s");
      f.style.animationDelay = Math.random() * 0.8 + "s";
      f.appendChild(sprite(FISH[0], FISH[1]));
      f.addEventListener("animationend", () => f.remove());
      pond.appendChild(f);
    }
  });

  /* ---------- respawn: the countdown to season 2, and the button that leads there ---------- */
  const timer = $(".s1-respawn span");
  if (timer) {
    const to = new Date(timer.dataset.to).getTime();
    const pad = (n) => String(n).padStart(2, "0");
    const tick = () => {
      const left = to - Date.now();
      if (left <= 0) { timer.textContent = "0 — сезон 2 уже идёт"; return; }
      timer.textContent = `${Math.floor(left / 864e5)} дн ${pad(Math.floor(left / 36e5) % 24)}:${pad(Math.floor(left / 6e4) % 60)}:${pad(Math.floor(left / 1e3) % 60)}`;
      setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
  }
  const respawn = $("#respawn");
  if (respawn && !reduceMotion) respawn.addEventListener("click", (e) => {
    e.preventDefault();
    toast("Возрождение…");
    setTimeout(() => { window.location.href = respawn.href; }, 900);
  });
})();
