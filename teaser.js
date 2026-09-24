(() => {
  "use strict";
  // Season 2 teaser on the main page: sky, leaked numbers, the season map, intercepted transmissions, classified files
  // (three of them open on their own on set days), a race picker, boss silhouettes and a couple of easter eggs.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SVG = "http://www.w3.org/2000/svg";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

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
  const plural = (n, one, few, many) => {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
  };
  // base64 of UTF-8, so the texts of files that are not open yet are not lying in the page as plain words
  const decode = (s) => { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ""; } };

  let toastTimer;
  const toast = (text) => {
    let t = $(".s2-toast");
    if (!t) { t = document.createElement("div"); t.className = "s2-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 3400);
  };

  /* ---------- reveal on scroll ---------- */
  const onSeen = (els, fn, threshold = 0.2) => {
    if (reduceMotion || !("IntersectionObserver" in window)) { els.forEach(fn); return; }
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); }
    }), { threshold, rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
  };
  // Blocks that are already on screen stay as they are; only the ones further down are hidden and rise in.
  // The CSS hides nothing until .rv-on is set here, so a script that never arrives leaves the teaser readable.
  const rvs = $$(".rv");
  rvs.forEach((el) => {
    const sibs = Array.from(el.parentElement.children).filter((c) => c.classList.contains("rv"));
    el.style.setProperty("--i", Math.min(8, sibs.indexOf(el)));
  });
  if (!reduceMotion && "IntersectionObserver" in window) {
    const later = rvs.filter((el) => el.getBoundingClientRect().top > window.innerHeight * 0.92);
    rvs.forEach((el) => { if (!later.includes(el)) el.classList.add("in"); });
    document.documentElement.classList.add("rv-on");
    onSeen(later, (el) => el.classList.add("in"), 0.15);
  }

  // The countdown to 1 October lives in a small inline script in index.html, so it ticks even if this file is late.

  /* ---------- sky: an airship with a logbook drifts over the key art ---------- */
  const ship = $(".s2-ship");
  if (ship) {
    ship.appendChild(sprite([
      "......aaaaaaaaaaaa......", "...aaabbbbbbbbbbbbaaa...", ".aabbbbccbbbbbbbbbbbbaa.", "aabbbbccbbbbbbbbbbbbbbaa",
      ".aabbbbbbbbbbbbbbbbbbaa.", "...aaabbbbbbbbbbbbaaa...", "......aaaaaaaaaaaa......", ".........a....a.........",
      "........dddddddd....e...", "........dffdffdd...eee..", "........dddddddd....e...", "........................",
    ], { a: "#2a2446", b: "#3a3356", c: "#574e70", d: "#1e1a36", e: "#b7aecb", f: "#f4b860" }));
    const log = ["Бортовой журнал, день 1: поднялись выше облаков. Под нами — ничего.",
                 "День 3: заметили остров. На нём кто-то стоит и смотрит на нас.",
                 "День 5: ночью луна была красной. Снизу доносился вой.",
                 "День 7: топливо на исходе. Садимся 1 октября."];
    let entry = 0;
    ship.addEventListener("click", () => toast(log[entry++ % log.length]));
  }

  /* ---------- decrypting text: shared by the files and the boss names ---------- */
  const GLYPHS = "█▓▒░#%&@$*+=?/<>";
  const scramble = (el, target, done) => {
    if (reduceMotion) { el.textContent = target; if (done) done(); return; }
    const t0 = performance.now(), dur = 600 + target.length * 14;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), n = Math.floor(k * target.length);
      let out = target.slice(0, n);
      for (let i = n; i < target.length; i++) out += target[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      el.textContent = out;
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    };
    requestAnimationFrame(step);
  };
  const redact = (s) => s.replace(/\S/g, "█");
  const onOpen = (card, fn) => {
    card.tabIndex = 0;
    card.addEventListener("mouseenter", fn);
    card.addEventListener("focus", fn);
    card.addEventListener("click", fn);
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); } });
  };

  /* ---------- classified files: open ones on top, the rest move up on their day ---------- */
  const openFiles = $(".s2-files-open"), lockedFiles = $(".s2-files-locked");
  $$(".s2-file").forEach((card) => {
    const p = card.querySelector("[data-secret]");
    if (!p) return;
    const denied = card.classList.contains("s2-deny");
    let real = p.textContent.trim().replace(/\s+/g, " ");
    const unlock = card.dataset.unlock ? new Date(card.dataset.unlock).getTime() : 0;
    if (unlock) {
      if (Date.now() < unlock) {
        // Not yet: say when, and keep the words out of the page.
        const days = Math.ceil((unlock - Date.now()) / 864e5);
        const date = new Date(unlock).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });
        card.classList.add("s2-locked");
        p.textContent = `Откроется ${date} — ${days === 1 ? "завтра" : `через ${days} ${plural(days, "день", "дня", "дней")}`}.`;
        return;
      }
      real = decode(card.dataset.enc);
      card.classList.add("s2-new");
      if (openFiles && card.parentElement === lockedFiles) openFiles.appendChild(card);
    }
    const target = denied ? "Доступ закрыт до 1 октября." : real;
    const sr = document.createElement("span"); sr.className = "sr"; sr.textContent = denied ? "Засекречено до 1 октября." : real;
    const vis = document.createElement("span"); vis.className = "s2-enc"; vis.setAttribute("aria-hidden", "true"); vis.textContent = redact(real);
    p.textContent = ""; p.append(sr, vis);
    let busy = false, opened = false;
    onOpen(card, () => {
      if (busy || (opened && !denied)) return;
      busy = true; card.classList.add("open");
      scramble(vis, target, () => {
        busy = false; opened = true;
        if (denied) setTimeout(() => { vis.textContent = redact(real); card.classList.remove("open"); opened = false; }, 2400);
      });
    });
  });
  $$(".s2-n").forEach((n) => {
    const list = n.dataset.for === "open" ? openFiles : lockedFiles;
    if (list) n.textContent = list.children.length;
  });

  /* ---------- intercepted transmissions: typed out once they scroll into view ---------- */
  const term = $(".s2-term-body");
  if (term) {
    const lines = $$("p", term).map((p) => ({ p, text: p.textContent }));
    if (!reduceMotion) lines.forEach((l) => { l.p.textContent = ""; l.p.classList.add("waiting"); });
    const cursor = document.createElement("span"); cursor.className = "s2-term-cursor"; cursor.textContent = "▌";
    const type = (i) => {
      if (i >= lines.length) { term.appendChild(cursor); return; }
      const { p, text } = lines[i];
      p.classList.remove("waiting");
      let n = 0;
      const next = () => {
        p.textContent = text.slice(0, ++n);
        if (n < text.length) setTimeout(next, p.classList.contains("s2-head") ? 12 : 22 + Math.random() * 30);
        else setTimeout(() => type(i + 1), p.classList.contains("s2-head") ? 120 : 520);
      };
      next();
    };
    if (!reduceMotion) onSeen([term], () => type(0), 0.3); else term.appendChild(cursor);
  }

  /* ---------- who will you be born as: a race and a class, remembered on this device ---------- */
  const EMBLEMS = {
    sky: [["........", ".a....a.", "aa....aa", "aaa..aaa", ".aaaaaa.", "..aaaa..", "...aa...", "........"], { a: "#b9a6ff" }],
    sea: [["........", "..a.....", ".aaa..a.", "aa.aaaa.", "........", "..a.....", ".aaa..a.", "aa.aaaa."], { a: "#6cd3b6" }],
    web: [["a..a..a.", ".a.a.a..", "..aaa...", "aaaaaaa.", "..aaa...", ".a.a.a..", "a..a..a.", "........"], { a: "#ece6f7" }],
    fire: [["...a....", "...aa...", "..aaa...", "..abaa..", ".aabbaa.", ".abbbba.", ".aabbaa.", "..aaaa.."], { a: "#e05a4a", b: "#f4b860" }],
    scale: [["aa.aa.aa", "a.aa.aa.", "aa.aa.aa", ".aa.aa.a", "aa.aa.aa", "a.aa.aa.", "aa.aa.aa", "........"], { a: "#4ec2b8" }],
    shade: [["..aaaa..", ".aaaaaa.", "aabaabaa", "aaaaaaaa", "aaaaaaaa", "aa.aa.aa", "a..a..a.", "........"], { a: "#554d78", b: "#ee8793" }],
  };
  const picker = $(".s2-origins");
  if (picker) {
    const note = $(".s2-origin-note"), classDesc = $(".s2-class-desc");
    // the six large cards and the full list share race ids, so a choice lights up in both places
    const races = $$(".s2-origin, .s2-race"), classes = $$(".s2-class");
    const listed = $$(".s2-race");
    const nameOf = (el) => el.querySelector("b").textContent;
    const raceEl = (id) => races.find((r) => r.dataset.id === id);
    const classEl = (id) => classes.find((c) => c.dataset.id === id);
    // the first version of the picker kept one of six themes; they map onto these races
    const OLD = { sky: "elytrian", sea: "merling", web: "arachnid", fire: "blazeling", scale: "draconic", shade: "umbral" };
    let hero = {};
    try {
      hero = JSON.parse(localStorage.getItem("s2-hero") || "{}") || {};
      if (!hero.race && OLD[localStorage.getItem("s2-origin")]) hero.race = OLD[localStorage.getItem("s2-origin")];
    } catch (e) { hero = {}; }
    const save = () => { try { localStorage.setItem("s2-hero", JSON.stringify(hero)); } catch (e) { /* private mode: just not remembered */ } };
    const describe = (c) => {
      if (!c || !classDesc) return;
      const t = c.getAttribute("title");
      classDesc.textContent = `${nameOf(c)} — ${t.charAt(0).toLowerCase()}${t.slice(1)}`;
    };
    const show = () => {
      races.forEach((r) => r.setAttribute("aria-pressed", String(r.dataset.id === hero.race)));
      classes.forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === hero.cls)));
      const r = raceEl(hero.race), c = classEl(hero.cls);
      if (r && c) note.textContent = `Твой герой: ${nameOf(r)} · ${nameOf(c)}. Запомнили на этом устройстве. Проверим 1 октября.`;
      else if (r) note.textContent = `Раса — ${nameOf(r)}. Осталось выбрать класс.`;
      else if (c) note.textContent = `Класс — ${nameOf(c)}. Осталось выбрать расу.`;
    };
    $$(".s2-origin", picker).forEach((b) => {
      const e = EMBLEMS[b.dataset.origin];
      if (e) { const em = document.createElement("span"); em.className = "s2-emblem"; em.appendChild(sprite(e[0], e[1])); b.prepend(em); }
    });
    races.forEach((r) => r.addEventListener("click", () => { hero.race = r.dataset.id; save(); show(); }));
    classes.forEach((c) => c.addEventListener("click", () => { hero.cls = c.dataset.id; save(); show(); describe(c); }));
    describe(classEl(hero.cls));
    show();

    // leave it to fate: names flicker for a moment, then a random race and class stay
    const roll = $(".s2-roll");
    if (roll && listed.length && classes.length) roll.addEventListener("click", () => {
      const any = (list) => list[Math.floor(Math.random() * list.length)];
      let left = reduceMotion ? 0 : 14;
      roll.disabled = true;
      const spin = () => {
        const r = any(listed), c = any(classes);
        if (left-- > 0) { note.textContent = `${nameOf(r)} · ${nameOf(c)}`; setTimeout(spin, 70); return; }
        hero = { race: r.dataset.id, cls: c.dataset.id };
        save(); show(); describe(c);
        note.textContent = `Судьба выбрала: ${nameOf(r)} · ${nameOf(c)}. Запомнили на этом устройстве. Не нравится — брось ещё раз.`;
        roll.disabled = false;
      };
      spin();
    });
  }

  /* ---------- they are waiting: boss silhouettes, names decrypt on hover ---------- */
  const DARK = { a: "#221d3b", b: "#2c2650", c: "#e0703a", e: "#ee8793", s: "#f4b860" };
  const SILHOUETTES = {
    valkyrie: ["................", "......aaaa......", "......aeea......", "......aaaa......", ".bb....aa....bb.", ".bbb..aaaa..bbb.",
               "..bbbbaaaabbbb..", "...bbbaaaabbb...", "....bbaaaabb....", "......aaaa......", "......aaaa......", ".....aa..aa.....",
               ".....aa..aa.....", "....aa....aa....", "................", "................"],
    sun: ["................", ".......s........", "...s...s...s....", "....s.....s.....", "......bbbb......", ".....bbbbbb.....",
          "ss..bbebbebb..ss", "....bbbbbbbb....", "....bbbccbbb....", ".....bbbbbb.....", "......bbbb......", "....s.....s.....",
          "...s...s...s....", ".......s........", "................", "................"],
    leviathan: ["................", "..........aaa...", ".........aeeaa..", "........aaaaaa..", ".......aaa..a...", "......aaa.......",
                ".....aaa........", "....aaa.....aa..", "...aaa.....aaaa.", "..aaa.....aa..a.", "..aa.....aa.....", "..aaa...aaa.....",
                "...aaaaaaa......", "....aaaaa.......", "................", "................"],
    ignis: ["...c........c...", "...cc......cc...", "....aaaaaaaa....", "....aeeaaeea....", "....aaaaaaaa....", "...bbbbbbbbbb...",
            "..bbbbbbbbbbbb..", "..bb.bbbbbb.bb..", "..bb.bbbbbb.bb..", "..cc.bbbbbb.cc..", ".....bb..bb.....", ".....bb..bb.....",
            "....bbb..bbb....", "................", "................", "................"],
  };
  $$(".s2-boss").forEach((card) => {
    const rows = SILHOUETTES[card.dataset.boss];
    if (rows) $(".s2-sil", card).appendChild(sprite(rows, DARK));
    const nameEl = $(".s2-bname", card), name = nameEl.textContent.trim();
    nameEl.setAttribute("aria-label", name);
    nameEl.textContent = redact(name);
    let shown = false;
    onOpen(card, () => { if (shown) return; shown = true; card.classList.add("open"); scramble(nameEl, name); });
  });

  /* ---------- the season map: days to the start, then live progress from the server (same data as the map page) ---------- */
  const mapBox = $(".s2-map");
  if (mapBox) {
    const live = $(".s2-map-live", mapBox);
    const start = Date.parse(mapBox.dataset.start), end = Date.parse(mapBox.dataset.end), now = Date.now();
    if (now < start) {
      // whole days, like the countdown in the header
      const d = Math.floor((start - now) / 864e5);
      live.textContent = `До старта ${d ? `${d} ${plural(d, "день", "дня", "дней")}` : "меньше суток"}. Прогресс появится 1 октября, а пока есть демо: так карта будет выглядеть в разгар сезона.`;
    } else {
      onSeen([mapBox], () => {
        Promise.all([
          fetch(mapBox.dataset.json).then((r) => r.json()),
          fetch("https://173-249-26-11.sslip.io:8444/api/roadmap", { cache: "no-store" }).then((r) => r.json()),
        ]).then(([R, P]) => {
          const since = start / 1000, byId = {}, total = {}, got = {};
          R.nodes.forEach((n) => { byId[n.id] = n; total[n.branch] = (total[n.branch] || 0) + 1; });
          let opened = 0, last = null;
          Object.entries(P.done || {}).forEach(([id, who]) => {
            const n = byId[id], season = who.filter((e) => e[1] >= since);
            if (!n || !season.length) return;
            opened++; got[n.branch] = (got[n.branch] || 0) + 1;
            const first = season.reduce((a, e) => (e[1] < a[1] ? e : a));
            if (!last || first[1] > last.ts) last = { title: n.title, nick: first[0], ts: first[1] };
          });
          $$(".s2-map-bar span", mapBox).forEach((s) => s.querySelector("i").style.setProperty("--p", `${(100 * (got[s.dataset.b] || 0)) / (total[s.dataset.b] || 1)}%`));
          const all = R.nodes.length;
          if (Date.now() > end) live.textContent = `Сезон завершён: открыто ${opened} из ${all} вех.`;
          else {
            const day = Math.min(21, Math.floor((Date.now() - start) / 864e5) + 1);
            live.textContent = `День ${day} из 21: открыто ${opened} из ${all} вех.` + (last ? ` Последняя новая — «${last.title}» (${last.nick}).` : "");
          }
        }).catch(() => { /* the server may be off: the static text stays */ });
      }, 0.1);
    }
  }

  /* ---------- arriving by a link to the teaser: land on it even if fonts shifted the layout ---------- */
  if (location.hash === "#season2") {
    const land = () => { const el = document.getElementById("season2"); if (el && window.scrollY < 10) el.scrollIntoView({ block: "start" }); };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(land, 0));
  }
})();
