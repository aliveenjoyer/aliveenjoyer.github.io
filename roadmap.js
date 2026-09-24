/* Season 2 map: milestones, bosses and the quest book from roadmap.json; progress from the server (or a demo with ?demo=1). */
(() => {
  "use strict";
  const API = "https://173-249-26-11.sslip.io:8444/api/roadmap";
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(location.search);
  const DEMO = params.has("demo");
  const DEMO_NOW = Date.parse("2026-10-09T21:30:00+03:00");

  const MODS = {
    minecraft: "Minecraft", aether: "The Aether", deep_aether: "Deep Aether", aeronautics: "Create: Aeronautics", simulated: "Create: Aeronautics",
    create: "Create", mekanism: "Mekanism", mekanismgenerators: "Mekanism", ae2: "Applied Energistics 2", irons_spellbooks: "Iron's Spells",
    ars_nouveau: "Ars Nouveau", occultism: "Occultism", neovitae: "Neo Vitae", twilightforest: "Сумеречный лес", cataclysm: "Cataclysm",
    bosses_of_mass_destruction: "Bosses of Mass Destruction", apotheosis: "Apotheosis", l2hostility: "L2 Hostility",
    lightmanscurrency: "Lightman's Currency", eternal_starlight: "Eternal Starlight", the_bumblezone: "The Bumblezone",
    lootr: "Lootr", betterdungeons: "YUNG's Better Dungeons", betterdeserttemples: "YUNG's Better Desert Temples",
    yungscavebiomes: "YUNG's Cave Biomes", dungeons_arise: "When Dungeons Arise", spectrum: "Spectrum",
    modern_industrialization: "Modern Industrialization", pneumaticcraft: "PneumaticCraft", farmersdelight: "Farmer's Delight",
    brewery: "Let's Do Brewery", vinery: "Let's Do Vinery", farm_and_charm: "Farm & Charm",
  };
  const BOSS_COLORS = { twilight: "#7bd37a", cataclysm: "#ee7a8e", aether: "#8fd3ff", starlight: "#c9b8ff", bomd: "#f0975a", magic: "#b28cff", vanilla: "#e6d77a" };
  // Russian plural forms; a fractional number (29,2) takes the "few" form: 29,2 часа
  const plural = (n, one, few, many) => { if (Math.round(n * 10) % 10) return few; n = Math.abs(Math.round(n)); const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
  const fmtDate = (ts) => new Date(ts * 1000).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" }).replace(",", "");
  const fmtNum = (n) => (Math.round(n * 10) / 10).toLocaleString("ru-RU");
  const icon = (file, size) => { const img = el("img"); img.src = "img/rm/" + file; img.alt = ""; if (size) { img.width = size; img.height = size; } img.loading = "lazy"; return img; };

  // same deterministic pixel faces as on the main page
  const SVGNS = "http://www.w3.org/2000/svg";
  const avatar = (nick) => {
    let h = 2166136261;
    for (const ch of nick.toLowerCase()) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    let s = h >>> 0;
    const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const skins = [["#3a3356", "#4b4270", "#2a2446"], ["#2f4550", "#3d5a66", "#223540"], ["#4a3448", "#5e4460", "#352436"], ["#3c4633", "#4d5a41", "#2b3325"], ["#4a3c30", "#5f4d3d", "#352a21"], ["#343a58", "#444c72", "#262a42"]];
    const eyes = ["#6cd3b6", "#f4b860", "#ee8793", "#b9a6ff", "#ddf5f0"];
    const [base, light, dark] = skins[Math.floor(rnd() * skins.length)];
    const eye = eyes[Math.floor(rnd() * eyes.length)];
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 8 8"); svg.setAttribute("aria-hidden", "true");
    const px = (x, y, c, o) => { const r = document.createElementNS(SVGNS, "rect"); r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", 1); r.setAttribute("height", 1); r.setAttribute("fill", c); if (o) r.setAttribute("opacity", o); svg.appendChild(r); };
    const hood = rnd() < 0.5;
    for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
      if (hood && y === 0 && x === 0) continue;
      const v = rnd(), c = y < 2 ? (v < 0.6 ? dark : base) : v < 0.2 ? light : v < 0.32 ? dark : base;
      px(x, y, c); px(7 - x, y, c);
    }
    const ey = 3 + (rnd() < 0.5 ? 0 : 1), ex = rnd() < 0.65 ? 2 : 1;
    px(ex, ey, eye); px(7 - ex, ey, eye); px(ex, ey + 1, eye, 0.35); px(7 - ex, ey + 1, eye, 0.35);
    return svg;
  };

  /* ---------- server totals, the same way the server counts them ---------- */
  function summarize(people) {
    const keys = people.length ? Object.keys(people[0]).filter((k) => k !== "name") : [];
    const totals = {}, leaders = {};
    keys.forEach((k) => {
      totals[k] = Math.round(people.reduce((s, p) => s + p[k], 0) * 10) / 10;
      const best = people.reduce((a, p) => (!a || p[k] > a[k] ? p : a), null);
      if (best && best[k] > 0) leaders[k] = [best.name, best[k]];
    });
    return { totals, leaders };
  }

  /* ---------- a believable mid-season, for previews before 1 October ---------- */
  function demoProgress(R, now) {
    const players = ["aliveenjoyer", "ivycraft", "dsy", "voV4ick_XXL", "aiihosh1no", "anstlixx", "QissMe"];
    let s = 20261009;
    const rnd = () => { s = (s * 1103515245 + 12345) >>> 0; return s / 4294967296; };
    const start = Date.parse(R.season.start) / 1000;
    const done = {};
    const order = R.nodes.slice().sort((a, b) => a.col - b.col);
    for (const p of players) {
      const skill = 0.35 + rnd() * 0.6, got = {};
      for (const n of order) {
        if (!n.deps.every((d) => got[d] !== undefined)) continue;
        const chance = { 1: 0.95, 2: 0.55, 3: 0.12, 4: 0.02 }[n.col] * skill * (n.tier >= 4 ? 0.5 : 1);
        if (rnd() > chance) continue;
        const after = Math.max(0, ...n.deps.map((d) => got[d]));
        const base = (n.col - 1) * 4.2 * 86400 + rnd() * 4 * 86400;  // spread over the first nine days by week
        const t = Math.round(Math.max(after + 1800 + rnd() * 5400, base));
        if (start + t > now) continue;
        got[n.id] = t;
        (done[n.id] = done[n.id] || []).push([p, start + t]);
      }
    }
    // pull the latest few openings into the last day, so the preview shows fresh ones too
    const all = []; for (const k in done) done[k].forEach((e) => all.push(e));
    all.sort((a, b) => b[1] - a[1]).slice(0, 6).forEach((e, i) => { e[1] = Math.max(e[1], now - 3600 * (2 + i * 3)); });
    for (const k in done) done[k].sort((a, b) => a[1] - b[1]);

    // bosses: whoever reached the boss's milestone beat it; a few bosses without one get random hunters
    const bosses = {};
    R.bosses.forEach((b) => {
      const first = new Map();
      ((b.node && done[b.node]) || []).forEach(([p, ts]) => first.set(p, ts));
      if (!b.node && rnd() < 0.35) for (let i = 0; i < 1 + Math.floor(rnd() * 2); i++) {
        const p = players[Math.floor(rnd() * players.length)], ts = start + Math.round(86400 * 3 + rnd() * (now - start - 86400 * 3));
        if (!first.has(p) || first.get(p) > ts) first.set(p, ts);
      }
      if (!first.size) return;
      const by = [...first].map(([p, ts]) => [p, 1 + Math.floor(rnd() * 4), ts]).sort((x, y) => x[2] - y[2]);
      bosses[b.id] = { kills: by.reduce((n, e) => n + e[1], 0), by };
    });

    // FTB teams working through the quest book
    const teams = [["Орден Бездны", "#b28cff", ["aliveenjoyer", "aiihosh1no"]], ["Ламповые", "#f4b860", ["ivycraft", "dsy"]],
      ["Северный ветер", "#8fd3ff", ["voV4ick_XXL", "anstlixx"]], ["QissMe", "#ee8793", ["QissMe"]]].map(([name, color, members], ti) => {
      const skill = [0.5, 0.36, 0.27, 0.16][ti], chapters = {};
      let total = 0;
      R.chapters.forEach((c) => {
        const f = c.group === "" && c.order === 0 ? 0.95 : rnd() < 0.3 ? 0 : skill * (0.25 + rnd());
        const n = Math.min(c.quests, Math.round(c.quests * f));
        if (n > 0) { chapters[c.id] = n; total += n; }
      });
      return { name, color, members, party: members.length > 1, total, chapters, last: now - Math.round(rnd() * 9000) };
    }).sort((a, b) => b.total - a.total);

    // what each team reached first, and the events counted the way the server counts them
    teams.forEach((t) => {
      t.nodes = {}; t.bossFirst = {};
      for (const k in done) { const ts = done[k].filter((e) => t.members.includes(e[0])).map((e) => e[1]); if (ts.length) t.nodes[k] = Math.min(...ts); }
      for (const k in bosses) { const ts = bosses[k].by.filter((e) => t.members.includes(e[0])).map((e) => e[2]); if (ts.length) t.bossFirst[k] = Math.min(...ts); }
    });
    const events = {};
    R.events.forEach((e) => {
      const a = Date.parse(e.start) / 1000, b = Math.min(Date.parse(e.end) / 1000, now), rows = [];
      if (e.kind === "auto" && e.metric !== "quests") teams.forEach((t) => {
        const hits = Object.values(e.metric === "milestones" ? t.nodes : t.bossFirst).filter((x) => x >= a && x <= b);
        if (hits.length) rows.push([t.name, hits.length, Math.max(...hits)]);
      });
      if (e.kind === "race") teams.forEach((t) => { const ts = t.nodes[e.node]; if (ts && ts >= a && ts <= b) rows.push([t.name, 1, ts]); });
      rows.sort(e.kind === "race" ? (x, y) => x[2] - y[2] : (x, y) => y[1] - x[1] || x[2] - y[2]);
      events[e.id] = rows;
    });

    // levelling: skill trees, race and class, world tier
    const races = Object.keys(R.origins).filter((k) => !k.includes(":class_")), classes = Object.keys(R.origins).filter((k) => k.includes(":class_"));
    const heroes = players.map((p) => {
      const got = (id) => (done[id] || []).some((e) => e[0] === p);
      const skills = { "adventurer_skills:adventurer_skills": 4 + Math.floor(rnd() * 26), "puffish_skills:mining": 2 + Math.floor(rnd() * 17), "irons_skills:magic1": Math.floor(rnd() * 12) };
      if (rnd() < 0.5) skills["irons_skills:school1"] = 1 + Math.floor(rnd() * 9);
      return { name: p, xp: 8 + Math.floor(rnd() * 52), origin: races[Math.floor(rnd() * races.length)], cls: classes[Math.floor(rnd() * classes.length)],
        tier: got("p_pinnacle") ? "pinnacle" : got("p_summit") ? "summit" : got("p_ascent") ? "ascent" : got("p_frontier") ? "frontier" : "haven",
        threat: 3 + Math.floor(rnd() * 55), foods: 6 + Math.floor(rnd() * 70), shards: Math.floor(rnd() * 5), mana: 100 + Math.floor(rnd() * 6) * 50, skills };
    }).sort((a, b) => Object.values(b.skills).reduce((s, v) => s + v, 0) - Object.values(a.skills).reduce((s, v) => s + v, 0) || b.xp - a.xp);

    // server counters
    const people = players.map((p) => {
      const k = 0.5 + rnd();
      return { name: p, hours: +(16 + rnd() * 52).toFixed(1), deaths: Math.round(4 + rnd() * 34), mobs: Math.round(k * (500 + rnd() * 2600)),
        pvp: Math.round(rnd() * 4), walk: +(k * (24 + rnd() * 90)).toFixed(1), fly: +(rnd() * 75).toFixed(1), ride: +(rnd() * 28).toFixed(1),
        mined: Math.round(k * (7000 + rnd() * 52000)), crafted: Math.round(k * (1500 + rnd() * 16000)), fish: Math.round(rnd() * 26),
        bred: Math.round(rnd() * 90), trades: Math.round(rnd() * 64), jumps: Math.round(3000 + rnd() * 12000),
        hearts: Math.round(k * (900 + rnd() * 6000)), hurt: Math.round(400 + rnd() * 3200),
        bosses: Object.values(bosses).reduce((n, b) => n + b.by.filter((e) => e[0] === p).reduce((m, e) => m + e[1], 0), 0),
        creeper: Math.round(rnd() * 6), fall: Math.round(300 + rnd() * 2800), sleeps: Math.round(rnd() * 9), awake: +(rnd() * 30).toFixed(1),
        sneak: Math.round(rnd() * 90), chests: Math.round(40 + rnd() * 400), cake: Math.round(rnd() * 12), pig: rnd() < 0.3 ? Math.round(rnd() * 600) : 0,
        bells: Math.round(rnd() * 15), records: Math.round(rnd() * 6), drops: Math.round(50 + rnd() * 900) };
    });
    const stats = { players: people.length, ...summarize(people), people: people.sort((a, b) => b.hours - a.hours),
      hunted: [["Зомби", 4211], ["Скелет", 3187], ["Паук", 1904], ["Крипер", 1640], ["Утопленник", 918], ["Эндермен", 562]],
      dangerous: [["Скелет", 41], ["Крипер", 27], ["Зомби", 19], ["Визер-скелет", 11], ["Гаст", 8], ["Лич", 5]],
      shame: [["dsy", "Зомбифицированный пиглин", 3, "minecraft:zombified_piglin"], ["ivycraft", "Пчела", 2, "minecraft:bee"],
        ["QissMe", "Коза", 1, "minecraft:goat"], ["anstlixx", "Иглобрюх", 1, "minecraft:pufferfish"], ["aiihosh1no", "Лама", 1, "minecraft:llama"]] };

    // joke achievements: a few players each, over the season so far
    const fun = {};
    R.fun.forEach((f) => {
      if (rnd() < 0.45) return;
      const who = players.filter(() => rnd() < 0.3);
      if (!who.length) who.push(players[Math.floor(rnd() * players.length)]);
      fun[f.id] = who.map((p) => [p, start + Math.round(86400 + rnd() * (now - start - 86400))]).sort((x, y) => x[1] - y[1]);
    });
    return { updated: now, done, fun, bosses, teams, events, heroes, stats };
  }

  /* ---------- load ---------- */
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  async function loadProgress(R) {
    if (DEMO) return demoProgress(R, DEMO_NOW / 1000);
    try {
      const r = await withTimeout(fetch(API, { cache: "no-store" }), 5000);
      if (r.ok) {
        const p = await r.json();
        // the test world before 1 October is not the season; ?test=1 shows it anyway
        if (!params.has("test")) {
          const since = Date.parse(R.season.start) / 1000;
          for (const map of [p.done, p.fun || {}]) for (const k in map) { map[k] = map[k].filter((e) => e[1] >= since); if (!map[k].length) delete map[k]; }
          for (const k in p.bosses || {}) { const b = p.bosses[k]; b.by = b.by.filter((e) => e[2] >= since); b.kills = b.by.reduce((n, e) => n + e[1], 0); if (!b.by.length) delete p.bosses[k]; }
          if (Date.now() < since * 1000) { p.teams = []; p.stats = null; p.heroes = []; p.events = {}; }
        }
        return p;
      }
    } catch (e) { /* the server may be off: show the map without progress */ }
    return { updated: 0, done: {}, fun: {}, bosses: {}, teams: [], events: {}, heroes: [], stats: null };
  }

  fetch("roadmap.json?v=20260924d").then((r) => r.json()).then(async (R) => {
    const nodes = R.nodes, byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
    const branches = Object.fromEntries(R.branches.map((b) => [b.id, b]));
    const bossGroups = Object.fromEntries(R.bossGroups.map((g) => [g.id, g]));
    const chapterGroups = Object.fromEntries(R.chapterGroups.map((g) => [g.id, g]));
    const kids = {};
    nodes.forEach((n) => n.deps.forEach((d) => (kids[d] = kids[d] || []).push(n.id)));
    const start = Date.parse(R.season.start), end = Date.parse(R.season.end);
    const now = () => (DEMO ? DEMO_NOW : Date.now());
    const questsTotal = R.chapters.reduce((n, c) => n + c.quests, 0);
    if (DEMO) $(".rm-demo-note").hidden = false;
    else if (Date.now() < start) $(".rm-pre-note").hidden = false;

    const lede = $(".lede");
    lede.textContent = `${nodes.length} ${plural(nodes.length, "веха", "вехи", "вех")} в ${R.branches.length} путях, командный зачёт и ${R.events.length} ${plural(R.events.length, "ивент", "ивента", "ивентов")}, ${R.bosses.length} ${plural(R.bosses.length, "босс", "босса", "боссов")} и книга из ${questsTotal} квестов на 21 день. Каждая веха — достижение в игре, поэтому сервер сам отмечает, кто и когда её открыл.`;

    let P = await loadProgress(R);
    const state = {};
    function computeState() {
      nodes.forEach((n) => {
        const who = (P.done && P.done[n.id]) || [];
        const doneNow = who.length > 0;
        const depsDone = n.deps.every((d) => ((P.done && P.done[d]) || []).length > 0);
        state[n.id] = { who, done: doneNow, open: !doneNow && depsDone };
      });
    }
    computeState();

    /* ---------- hero status ---------- */
    function renderStatus() {
      const t = now();
      const day = $(".rm-day");
      if (t < start) {
        const left = start - t, d = Math.floor(left / 864e5), h = Math.floor(left / 36e5) % 24, m = Math.floor(left / 6e4) % 60;
        day.textContent = `Старт через ${d} ${plural(d, "день", "дня", "дней")} ${h} ч ${m} мин`;
      } else if (t <= end) {
        const n = Math.floor((t - start) / 864e5) + 1;
        day.textContent = `День ${n} из 21`;
      } else day.textContent = "Сезон завершён";
      const bar = $(".rm-bar");
      bar.textContent = "";
      let total = 0, opened = 0;
      R.branches.forEach((b) => {
        const list = nodes.filter((n) => n.branch === b.id), got = list.filter((n) => state[n.id].done).length;
        total += list.length; opened += got;
        const seg = el("span"); seg.style.setProperty("--n", list.length); seg.style.setProperty("--c", b.color); seg.title = `${b.name}: ${got} из ${list.length}`;
        const fill = el("i"); fill.style.setProperty("--p", (100 * got / list.length).toFixed(1) + "%"); seg.appendChild(fill); bar.appendChild(seg);
      });
      bar.setAttribute("aria-label", `Открыто ${opened} из ${total} вех`);
      const people = new Set(); Object.values(P.done || {}).forEach((w) => w.forEach(([p]) => people.add(p)));
      $(".rm-sum").textContent = opened
        ? `Открыто ${opened} из ${total} ${plural(total, "вехи", "вех", "вех")} · игроков на карте: ${people.size}`
        : `${total} ${plural(total, "веха ждёт", "вехи ждут", "вех ждут")} первых героев. Откроются 1 октября.`;
      const glance = $(".rm-glance");
      glance.textContent = "";
      const beaten = R.bosses.filter((b) => bossWin(b)).length;
      [[nodes.length, plural(nodes.length, "веха", "вехи", "вех")], [R.branches.length, "путей"],
        [beaten ? `${beaten}/${R.bosses.length}` : R.bosses.length, beaten ? "боссов повержено" : plural(R.bosses.length, "босс", "босса", "боссов")],
        [questsTotal, "квестов"], [R.chapters.length, "глав"]].forEach(([n, label]) => {
        const li = el("li"); li.appendChild(el("b", null, String(n))); li.appendChild(el("span", null, label)); glance.appendChild(li);
      });
    }

    /* ---------- tiles ---------- */
    function tile(n) {
      const b = branches[n.branch], st = state[n.id];
      const btn = el("button", `rm-node t${n.tier} ${st.done ? "done" : st.open ? "open" : "locked"}`);
      btn.type = "button"; btn.dataset.id = n.id; btn.style.setProperty("--c", b.color);
      if (st.done && now() / 1000 - st.who[0][1] < 86400) btn.classList.add("fresh");  // opened within the last day
      const status = st.done ? `открыта, ${st.who.length} ${plural(st.who.length, "игрок", "игрока", "игроков")}` : st.open ? "можно открыть" : "пока рано";
      btn.setAttribute("aria-label", `${n.title}: ${b.name}, ${R.season.columns[n.col - 1].title}, ${status}`);
      btn.title = n.title;
      btn.appendChild(icon(n.iconFile, 32));
      btn.addEventListener("click", () => openCard(n.id));
      btn.addEventListener("mouseenter", () => highlight(n.id));
      btn.addEventListener("mouseleave", () => highlight(null));
      btn.addEventListener("focus", () => highlight(n.id));
      btn.addEventListener("blur", () => highlight(null));
      return btn;
    }

    /* ---------- the board ---------- */
    const grid = $(".rm-grid"), svg = $(".rm-links");
    let filter = null;
    function renderBoard() {
      grid.textContent = "";
      grid.appendChild(el("div"));
      R.season.columns.forEach((c) => {
        const h = el("div", "rm-colh" + (c.id === 4 ? " final" : ""));
        h.dataset.col = c.id;
        h.appendChild(el("b", null, c.title)); h.appendChild(el("span", null, c.dates));
        grid.appendChild(h);
      });
      R.branches.forEach((b) => {
        const list = nodes.filter((n) => n.branch === b.id);
        const lh = el("div", "rm-laneh"); lh.style.setProperty("--c", b.color); lh.dataset.branch = b.id;
        lh.appendChild(el("b", null, b.name));
        lh.appendChild(el("span", null, `${list.filter((n) => state[n.id].done).length} из ${list.length}`));
        lh.title = b.desc;
        grid.appendChild(lh);
        R.season.columns.forEach((c) => {
          const cell = el("div", "rm-cell"); cell.style.setProperty("--c", b.color); cell.dataset.branch = b.id; cell.dataset.col = c.id;
          list.filter((n) => n.col === c.id).forEach((n) => cell.appendChild(tile(n)));
          grid.appendChild(cell);
        });
      });
      markToday();
      applyFilter();
      requestAnimationFrame(drawLinks);
    }
    function markToday() {
      grid.querySelectorAll(".rm-today").forEach((e) => e.remove());
      grid.querySelectorAll(".rm-colh.now").forEach((e) => e.classList.remove("now"));
      const t = now();
      if (t < start || t > end) return;
      const day = Math.floor((t - start) / 864e5);  // 0-based
      const col = Math.min(3, Math.floor(day / 7) + 1), frac = ((day % 7) + (t - start) % 864e5 / 864e5) / 7;
      const head = grid.querySelector(`.rm-colh[data-col="${col}"]`);
      if (!head) return;
      head.classList.add("now");
      if (day >= 16 && day <= 17) grid.querySelector('.rm-colh[data-col="4"]').classList.add("now");
      const line = el("div", "rm-today");
      line.appendChild(el("span", null, "сегодня"));
      line.style.left = head.offsetLeft + frac * head.offsetWidth + "px";
      grid.appendChild(line);
    }
    function center(e, side) {
      const g = grid.getBoundingClientRect(), r = e.getBoundingClientRect();
      return { x: (side === "r" ? r.right : side === "l" ? r.left : r.left + r.width / 2) - g.left, y: r.top + r.height / 2 - g.top };
    }
    function drawLinks() {
      svg.textContent = "";
      svg.setAttribute("width", grid.scrollWidth); svg.setAttribute("height", grid.scrollHeight);
      svg.style.width = grid.scrollWidth + "px"; svg.style.height = grid.scrollHeight + "px";
      nodes.forEach((n) => n.deps.forEach((d) => {
        const a = grid.querySelector(`.rm-node[data-id="${d}"]`), b = grid.querySelector(`.rm-node[data-id="${n.id}"]`);
        if (!a || !b) return;
        const same = byId[d].branch === n.branch;
        const p1 = byId[d].col < n.col ? center(a, "r") : center(a, "c"), p2 = byId[d].col < n.col ? center(b, "l") : center(b, "c");
        const dx = Math.max(24, Math.abs(p2.x - p1.x) / 2);
        const path = document.createElementNS(SVGNS, "path");
        path.setAttribute("d", `M${p1.x},${p1.y} C${p1.x + dx},${p1.y} ${p2.x - dx},${p2.y} ${p2.x},${p2.y}`);
        path.setAttribute("stroke", same ? branches[n.branch].color : "#8a82aa");
        path.setAttribute("class", (same ? "" : "x ") + (state[d].done ? "" : "dim"));
        path.dataset.from = d; path.dataset.to = n.id;
        svg.appendChild(path);
      }));
    }
    function highlight(id) {
      const rel = new Set(id ? [id, ...byId[id].deps, ...(kids[id] || [])] : []);
      grid.querySelectorAll(".rm-node").forEach((e) => e.classList.toggle("hl", !!id && e.dataset.id !== id && rel.has(e.dataset.id)));
      svg.querySelectorAll("path").forEach((p) => {
        const hot = !!id && (p.dataset.from === id || p.dataset.to === id);
        p.classList.toggle("hot", hot);
        p.style.opacity = id ? (hot ? "1" : ".08") : "";
      });
    }
    function applyFilter() {
      grid.querySelectorAll(".rm-laneh, .rm-cell").forEach((e) => {
        const dim = filter && e.dataset.branch !== filter;
        e.classList.toggle("rm-lane-dim", !!dim);
        if (e.classList.contains("rm-cell")) e.style.opacity = dim ? ".28" : "";
      });
    }
    function chips(box, items, current, onPick) {
      box.textContent = "";
      items.forEach(([id, name, color, count]) => {
        const c = el("button", "rm-chip", name); c.type = "button";
        if (color) c.style.setProperty("--c", color);
        if (count != null) c.appendChild(el("small", null, count));
        c.setAttribute("aria-pressed", String(current === id));
        c.addEventListener("click", () => onPick(current === id || id === null ? null : id));
        box.appendChild(c);
      });
    }
    function renderFilters() {
      chips($("#map .rm-filters"), [[null, "Все пути"], ...R.branches.map((b) => [b.id, b.name, b.color, nodes.filter((n) => n.branch === b.id).length])],
        filter, (id) => { filter = id; renderFilters(); applyFilter(); renderList(); });
    }

    /* ---------- phones: by week ---------- */
    let list = $(".rm-list");
    if (!list) { list = el("div", "rm-list"); $(".rm-board").after(list); }
    function renderList() {
      list.textContent = "";
      R.season.columns.forEach((c) => {
        const w = el("div", "rm-week");
        const h = el("h3", null, c.title); h.appendChild(el("span", null, c.dates)); w.appendChild(h);
        R.branches.forEach((b) => {
          if (filter && filter !== b.id) return;
          const ns = nodes.filter((n) => n.branch === b.id && n.col === c.id);
          if (!ns.length) return;
          const row = el("div", "rm-wlane"); row.style.setProperty("--c", b.color);
          row.appendChild(el("b", null, b.name));
          const box = el("div"); ns.forEach((n) => box.appendChild(tile(n))); row.appendChild(box);
          w.appendChild(row);
        });
        list.appendChild(w);
      });
    }

    /* ---------- what to do now ---------- */
    function renderNext() {
      const ul = $(".rm-next");
      ul.textContent = "";
      const open = nodes.filter((n) => state[n.id].open);
      const soon = new Set();
      if (open.length < 6) nodes.forEach((n) => { if (!state[n.id].done && !state[n.id].open && n.deps.every((d) => state[d].done || state[d].open)) soon.add(n.id); });
      // a spread over the paths: the earliest open milestone of each path first, then the rest
      const ranked = [...open.map((n) => [n, false]), ...[...soon].map((id) => [byId[id], true])]
        .sort((a, b) => a[1] - b[1] || a[0].col - b[0].col || a[0].tier - b[0].tier);
      const firstOfPath = [], rest = [], used = new Set();
      ranked.forEach((e) => (used.has(e[0].branch) ? rest : (used.add(e[0].branch), firstOfPath)).push(e));
      [...firstOfPath, ...rest].slice(0, 12).forEach(([n, later]) => {
        const b = branches[n.branch];
        const li = el("li", later ? "soon" : ""); li.style.setProperty("--c", b.color); li.tabIndex = 0;
        li.appendChild(icon(n.iconFile));
        const t = el("b", null, n.title); t.appendChild(el("small", null, later ? "следом" : b.name)); li.appendChild(t);
        li.appendChild(el("span", null, n.desc));
        li.addEventListener("click", () => openCard(n.id));
        li.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openCard(n.id); } });
        ul.appendChild(li);
      });
    }

    /* ---------- bosses ---------- */
    const bossWin = (b) => { const k = (P.bosses || {})[b.id]; return k && k.by && k.by.length ? k : null; };
    let bossFilter = null;
    function renderBosses() {
      const wins = R.bosses.map(bossWin), beaten = wins.filter(Boolean).length, kills = wins.reduce((n, k) => n + (k ? k.kills : 0), 0);
      $(".rm-bosses-sum").textContent = beaten
        ? `Повержено ${beaten} из ${R.bosses.length} · всего побед над боссами: ${fmtNum(kills)}. Нажми на босса: где искать, что падает и кто уже победил.`
        : `${R.bosses.length} ${plural(R.bosses.length, "босс", "босса", "боссов")} из семи миров ждут первых смельчаков. Нажми на босса: где искать и что с него падает.`;
      chips($(".rm-boss-filters"), [[null, "Все", null, `${beaten}/${R.bosses.length}`],
        ...R.bossGroups.map((g) => { const list = R.bosses.filter((b) => b.group === g.id); return [g.id, g.name, BOSS_COLORS[g.id], `${list.filter(bossWin).length}/${list.length}`]; })],
        bossFilter, (id) => { bossFilter = id; renderBosses(); clampAll(); });
      const ul = $(".rm-bosses");
      ul.textContent = "";
      R.bosses.filter((b) => !bossFilter || b.group === bossFilter).forEach((b) => {
        const k = bossWin(b), li = el("li");
        const btn = el("button", "rm-boss" + (k ? " done" : "")); btn.type = "button"; btn.style.setProperty("--c", BOSS_COLORS[b.group]);
        const ic = el("span", "rm-boss-ic"); if (b.icon) ic.appendChild(icon(b.icon, 32)); btn.appendChild(ic);
        const tx = el("span", "rm-boss-tx");
        tx.appendChild(el("b", null, b.name));
        tx.appendChild(el("small", null, bossGroups[b.group].name + (b.mini ? " · мини-босс" : "")));
        tx.appendChild(el("span", "rm-boss-st", k ? `Побед: ${fmtNum(k.kills)} · первая: ${k.by[0][0]}` : "Пока без побед"));
        btn.appendChild(tx);
        const drops = el("span", "rm-boss-drops");
        b.drops.slice(0, 4).forEach((d) => { const img = icon(d.icon, 20); img.title = d.name; drops.appendChild(img); });
        btn.appendChild(drops);
        btn.setAttribute("aria-label", `${b.name}: ${k ? `побед ${k.kills}` : "пока без побед"}`);
        btn.addEventListener("click", () => openBoss(b));
        li.appendChild(btn);
        ul.appendChild(li);
      });
    }

    /* ---------- quest book ---------- */
    const liveNow = () => DEMO || params.has("test") || Date.now() >= start;
    function chapterBest(c) {
      let best = null;
      (P.teams || []).forEach((t) => { const n = (t.chapters || {})[c.id] || 0; if (n && (!best || n > best[1])) best = [t, n]; });
      return best;
    }
    function renderQuests() {
      const teams = (liveNow() && P.teams) || [];
      const leader = teams.find((t) => t.total > 0);
      $(".rm-quests-sum").textContent = leader
        ? `${R.chapters.length} глав и ${fmtNum(questsTotal)} квестов на русском. Больше всех прошла команда «${leader.name}»: ${fmtNum(leader.total)} ${plural(leader.total, "квест", "квеста", "квестов")}. Нажми на главу, чтобы сравнить команды.`
        : `${R.chapters.length} глав и ${fmtNum(questsTotal)} квестов — от первых шагов до вечности, всё переведено на русский. Прогресс команд появится здесь 1 октября.`;
      const box = $(".rm-chapters");
      box.textContent = "";
      const groups = [["", "Общие"], ...R.chapterGroups.map((g) => [g.id, g.name])];
      groups.forEach(([gid, gname]) => {
        const list = R.chapters.filter((c) => (c.group || "") === gid || (gid === "" && !chapterGroups[c.group]));
        if (!list.length) return;
        box.appendChild(el("h3", "rm-cgroup", gname));
        const ul = el("ul", "rm-chlist");
        list.forEach((c) => {
          const best = chapterBest(c), pct = best ? best[1] / c.quests : 0;
          const li = el("li"), btn = el("button", "rm-ch" + (pct >= 1 ? " full" : "")); btn.type = "button";
          if (best) btn.style.setProperty("--c", best[0].color || "#f4b860");
          const ic = el("span", "rm-ch-ic"); if (c.icon) ic.appendChild(icon(c.icon, 32)); btn.appendChild(ic);
          const tx = el("span", "rm-ch-tx");
          tx.appendChild(el("b", null, c.title));
          tx.appendChild(el("small", null, `${c.quests} ${plural(c.quests, "квест", "квеста", "квестов")}`));
          const bar = el("i", "rm-ch-bar"); const fill = el("i"); fill.style.width = (100 * pct).toFixed(1) + "%"; bar.appendChild(fill); tx.appendChild(bar);
          tx.appendChild(el("span", "rm-ch-best", best ? `${best[0].name}: ${best[1]} из ${c.quests}` : "пока никто"));
          btn.appendChild(tx);
          btn.addEventListener("click", () => openChapter(c));
          li.appendChild(btn);
          ul.appendChild(li);
        });
        box.appendChild(ul);
      });
      const ol = $(".rm-teams");
      ol.textContent = "";
      if (!teams.length) ol.appendChild(el("li", "rm-empty", "Команды появятся вместе с сезоном."));
      teams.slice(0, 12).forEach((t, i) => {
        const li = el("li"); li.style.setProperty("--c", t.color || "#b7aecb");
        li.appendChild(el("span", "rk", String(i + 1)));
        const nm = el("span", "nm"); nm.appendChild(el("b", null, t.name));
        const who = el("span", "who"); t.members.slice(0, 6).forEach((m) => { const a = avatar(m); a.setAttribute("aria-label", m); who.appendChild(a); });
        nm.appendChild(who);
        nm.appendChild(el("small", null, t.members.join(", ")));
        li.appendChild(nm);
        const pt = el("span", "pt", fmtNum(t.total)); pt.appendChild(el("small", null, `${(100 * t.total / questsTotal).toFixed(1).replace(".", ",")}%`)); li.appendChild(pt);
        ol.appendChild(li);
      });
    }

    /* ---------- feed and score ---------- */
    function renderFeedScore() {
      const events = [];
      nodes.forEach((n) => state[n.id].who.forEach(([p, ts], i) => events.push({ n, p, ts, first: i === 0 })));
      const feedEvents = events.slice();
      // bosses with a milestone already show up as that milestone; the rest get their own line
      R.bosses.forEach((b) => { const k = !b.node && bossWin(b); if (k) k.by.forEach(([p, , ts]) => feedEvents.push({ boss: b, p, ts })); });
      feedEvents.sort((a, b) => b.ts - a.ts);
      events.sort((a, b) => b.ts - a.ts);
      const feed = $(".rm-feed");
      feed.textContent = "";
      if (!feedEvents.length) feed.appendChild(el("li", "rm-empty", "Здесь появятся открытия сезона — сразу, как только кто-то дойдёт до вехи или одолеет босса."));
      feedEvents.slice(0, 16).forEach((e) => {
        const li = el("li" , e.boss ? "boss" : "");
        li.style.setProperty("--c", e.boss ? BOSS_COLORS[e.boss.group] : branches[e.n.branch].color);
        li.appendChild(el("time", null, fmtDate(e.ts)));
        li.appendChild(icon(e.boss ? e.boss.icon : e.n.iconFile));
        const txt = el("span"); txt.append(e.p + " · ");
        txt.appendChild(el("em", null, e.boss ? e.boss.name : e.n.title));
        li.appendChild(txt);
        li.appendChild(el("span", "pts", e.boss ? "босс" : e.first ? `+${Math.round(e.n.points * 1.5)} ★` : `+${e.n.points}`));
        li.addEventListener("click", () => (e.boss ? openBoss(e.boss) : openCard(e.n.id)));
        feed.appendChild(li);
      });
      const score = {};
      events.forEach((e) => { const s = (score[e.p] = score[e.p] || { pts: 0, n: 0, firsts: 0 }); s.pts += e.first ? Math.round(e.n.points * 1.5) : e.n.points; s.n++; if (e.first) s.firsts++; });
      const ol = $(".rm-score");
      ol.textContent = "";
      const rows = Object.entries(score).sort((a, b) => b[1].pts - a[1].pts);
      if (!rows.length) ol.appendChild(el("li", "rm-empty", "Зачёт откроется вместе с сезоном."));
      rows.slice(0, 10).forEach(([p, s], i) => {
        const li = el("li");
        li.appendChild(el("span", "rk", String(i + 1)));
        li.appendChild(avatar(p));
        const nm = el("span", "nm", p);
        nm.appendChild(el("small", null, `${s.n} ${plural(s.n, "веха", "вехи", "вех")}${s.firsts ? ` · ${s.firsts} ${plural(s.firsts, "первое открытие", "первых открытия", "первых открытий")}` : ""}`));
        li.appendChild(nm);
        li.appendChild(el("span", "pt", String(s.pts)));
        ol.appendChild(li);
      });
    }

    /* ---------- team standings ---------- */
    const rules = R.teamRules;
    const eventOver = (e) => now() > Date.parse(e.end);
    function teamScores() {
      const teams = (liveNow() && P.teams) || [];
      const firstTeam = {};  // milestone -> the team that reached it first
      teams.forEach((t) => Object.entries(t.nodes || {}).forEach(([n, ts]) => { if (!firstTeam[n] || ts < firstTeam[n][1]) firstTeam[n] = [t.name, ts]; }));
      return teams.map((t) => {
        let ms = 0, msN = 0, firsts = 0, ev = 0;
        Object.keys(t.nodes || {}).forEach((n) => {
          const node = byId[n]; if (!node) return;
          const lead = firstTeam[n][0] === t.name;
          ms += lead ? Math.round(node.points * 1.5) : node.points; msN++; if (lead) firsts++;
        });
        const chaptersDone = R.chapters.filter((c) => ((t.chapters || {})[c.id] || 0) >= c.quests).length;
        const qs = t.total * rules.questPoints + chaptersDone * rules.chapterBonus;
        const evList = [];
        R.events.forEach((e) => {
          if (!eventOver(e)) return;
          const i = ((P.events || {})[e.id] || []).findIndex((r) => r[0] === t.name);
          if (i < 0) return;
          const pts = i < rules.eventPoints.length ? rules.eventPoints[i] : rules.eventParticipation;
          ev += pts; evList.push([e, i + 1, pts]);
        });
        return { t, ms, msN, firsts, qs, qN: t.total, chaptersDone, ev, evList, total: ms + qs + ev };
      }).sort((a, b) => b.total - a.total);
    }
    function renderTeams() {
      $(".rm-teams-rule").textContent = `Веха засчитывается команде один раз, а первой команде на сервере — в полтора раза больше. Квест книги — ${rules.questPoints} очка, закрытая глава — ещё ${rules.chapterBonus}. Ивенты — ${rules.eventPoints.join(" / ")} очков за первые три места и ${rules.eventParticipation} за участие.`;
      const ol = $(".rm-standings");
      ol.textContent = "";
      const rows = teamScores();
      if (!rows.length) { ol.appendChild(el("li", "rm-empty", "Командный зачёт откроется 1 октября. Соберите команду заранее — в одиночку тоже можно.")); return; }
      const max = Math.max(1, ...rows.map((r) => r.total));
      rows.forEach((r, i) => {
        const li = el("li"); li.style.setProperty("--c", r.t.color || "#b7aecb");
        li.appendChild(el("span", "rk", String(i + 1)));
        const tm = el("div", "tm"); tm.appendChild(el("b", null, r.t.name));
        const who = el("div", "who");
        r.t.members.forEach((m) => { const s = el("span"); s.appendChild(avatar(m)); s.append(m); who.appendChild(s); });
        tm.appendChild(who); li.appendChild(tm);
        const parts = el("div", "parts"), split = el("div", "split");
        split.style.width = (100 * r.total / max).toFixed(1) + "%";
        [["ms", r.ms], ["qs", r.qs], ["ev", r.ev]].forEach(([c, v]) => { if (v) { const x = el("i", c); x.style.width = (100 * v / r.total).toFixed(2) + "%"; split.appendChild(x); } });
        parts.appendChild(split);
        const lg = el("div", "legend");
        const add = (cls, label, v, note) => { const s = el("span", cls); s.append(label + " "); s.appendChild(el("b", null, fmtNum(v))); if (note) s.append(` (${note})`); lg.appendChild(s); };
        add("ms", "Вехи", r.ms, `${r.msN}${r.firsts ? `, первыми — ${r.firsts}` : ""}`);
        add("qs", "Квесты", r.qs, `${r.qN}${r.chaptersDone ? ` и ${r.chaptersDone} ${plural(r.chaptersDone, "глава", "главы", "глав")}` : ""}`);
        add("ev", "Ивенты", r.ev, r.evList.map(([e, place]) => `${e.title} — ${place}`).join(", "));
        parts.appendChild(lg); li.appendChild(parts);
        const pt = el("span", "pt", fmtNum(r.total)); pt.appendChild(el("small", null, plural(r.total, "очко", "очка", "очков"))); li.appendChild(pt);
        ol.appendChild(li);
      });
    }

    /* ---------- team events ---------- */
    const KIND = { auto: ["Считает сервер", "#8fd3ff"], race: ["Гонка", "#ee7a8e"], live: ["Живой ивент", "#f4b860"] };
    const METRIC = { milestones: ["веха", "вехи", "вех"], bosses: ["босс", "босса", "боссов"], quests: ["квест", "квеста", "квестов"] };
    const day = (iso) => new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "Europe/Moscow" });
    function eventWhen(e) {
      if (e.kind === "live") return `${day(e.start)}, ${new Date(e.start).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" })} МСК`;
      if (e.kind === "race") return "весь сезон";
      return `${day(e.start).split(" ")[0]}–${day(e.end)}`;
    }
    function renderEvents() {
      $(".rm-events-rule").textContent = `Три недели — три командных испытания, которые сервер считает сам, гонка к дракону на весь сезон и два живых ивента в финальные выходные. Места приносят ${rules.eventPoints.join(" / ")} очков в командный зачёт, участие — ${rules.eventParticipation}.`;
      const ol = $(".rm-events");
      ol.textContent = "";
      const teamsByName = Object.fromEntries(((liveNow() && P.teams) || []).map((t) => [t.name, t]));
      R.events.forEach((e) => {
        const [kind, color] = KIND[e.kind], t = now(), a = Date.parse(e.start), b = Date.parse(e.end);
        const st = t < a ? "soon" : t <= b ? "live" : "done";
        const li = el("li", "rm-ev is-" + st); li.style.setProperty("--c", color);
        const top = el("div", "rm-ev-top"); top.appendChild(el("span", "rm-ev-when", eventWhen(e))); top.appendChild(el("span", "rm-ev-kind", kind)); li.appendChild(top);
        li.appendChild(el("h3", null, e.title));
        li.appendChild(el("p", null, e.desc));
        const left = (ms) => { const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24; return d ? `${d} ${plural(d, "день", "дня", "дней")}` : `${h} ч`; };
        li.appendChild(el("span", "rm-ev-state", st === "soon" ? `Начнётся через ${left(a - t)}` : st === "live" ? (e.kind === "live" ? "Идёт прямо сейчас" : `Идёт · осталось ${left(b - t)}`) : "Итоги"));
        const rows = ((P.events || {})[e.id] || []).slice(0, 3);
        if (rows.length) {
          const list = el("ol");
          rows.forEach((r, i) => {
            const item = el("li"); item.style.setProperty("--tc", (teamsByName[r[0]] || {}).color || "#b7aecb");
            item.appendChild(el("span", "rm-ev-place", String(i + 1)));
            item.appendChild(el("span", null, r[0]));
            item.appendChild(el("span", "rm-ev-val", e.kind === "auto" ? `${r[1]} ${plural(r[1], ...METRIC[e.metric])}` : e.kind === "race" ? fmtDate(r[2]) : `${r[1]} место`));
            list.appendChild(item);
          });
          li.appendChild(list);
        } else if (st !== "soon") li.appendChild(el("p", null, e.kind === "live" ? "Итоги появятся после ивента." : "Пока ни одной команды."));
        li.appendChild(el("span", "rm-ev-prize", `Места: ${rules.eventPoints.join(" / ")} · участие: ${rules.eventParticipation}`));
        ol.appendChild(li);
      });
    }

    /* ---------- heroes: levelling ---------- */
    const SKILL_COLORS = ["#7bd37a", "#f4c35f", "#b28cff", "#c9b8ff", "#8fd3ff", "#6cd3b6"];
    const skillName = Object.fromEntries(R.skillCats.map((c) => [c.id, c.name]));
    function renderHeroes() {
      const H = (liveNow() && P.heroes) || [];
      $(".rm-heroes-note").textContent = H.length
        ? "Уровень опыта, деревья навыков Pufferfish (приключения, добыча, магия Iron's Spells), раса и класс NeoOrigins, уровень мира Apotheosis и угроза L2 Hostility. Обновляется раз в минуту."
        : "С 1 октября здесь появятся герои сезона: уровень, деревья навыков, раса и класс, уровень мира Apotheosis и угроза L2 Hostility.";
      const lead = $(".rm-hero-leaders");
      lead.textContent = "";
      const skillSum = (h) => Object.values(h.skills || {}).reduce((s, v) => s + v, 0);
      if (H.length > 1) [["Опыт", (h) => h.xp, "ур."], ["Навыки", skillSum, "ур."], ["Угроза", (h) => h.threat, ""], ["Гурман", (h) => h.foods, "блюд"]].forEach(([label, f, unit]) => {
        const best = H.reduce((a, h) => (f(h) > f(a) ? h : a), H[0]);
        if (!f(best)) return;
        const li = el("li"); li.append(label + ": "); li.appendChild(avatar(best.name)); li.appendChild(el("b", null, best.name)); li.append(` · ${f(best)}${unit ? " " + unit : ""}`);
        lead.appendChild(li);
      });
      const ul = $(".rm-heroes");
      ul.textContent = "";
      if (!H.length) { ul.appendChild(el("li", "rm-empty", "Пока никого.")); return; }
      const caps = {};
      H.forEach((h) => Object.entries(h.skills || {}).forEach(([k, v]) => (caps[k] = Math.max(caps[k] || 10, v))));
      H.forEach((h) => {
        const li = el("li"); li.style.setProperty("--c", SKILL_COLORS[h.name.length % SKILL_COLORS.length]);
        const head = el("div", "rm-hero-head"); head.appendChild(avatar(h.name));
        const nm = el("div"); nm.appendChild(el("b", null, h.name));
        nm.appendChild(el("small", null, [R.origins[h.origin], R.origins[h.cls]].filter(Boolean).join(" · ") || "раса не выбрана"));
        head.appendChild(nm);
        const lvl = el("span", "rm-hero-lvl", `ур. ${h.xp}`); lvl.appendChild(el("small", null, "опыт")); head.appendChild(lvl);
        li.appendChild(head);
        const sk = el("ul", "rm-skills");
        R.skillCats.forEach((c, i) => {
          if (!(c.id in (h.skills || {}))) return;
          const v = h.skills[c.id], row = el("li"); row.style.setProperty("--sc", SKILL_COLORS[i % SKILL_COLORS.length]);
          row.appendChild(el("span", null, skillName[c.id]));
          const bar = el("i"), fill = el("i"); fill.style.width = (100 * v / caps[c.id]).toFixed(1) + "%"; bar.appendChild(fill); row.appendChild(bar);
          row.appendChild(el("b", null, String(v)));
          sk.appendChild(row);
        });
        li.appendChild(sk);
        const tags = el("div", "rm-hero-tags");
        tags.appendChild(el("span", "tier", `Мир: ${R.worldTiers[h.tier] || h.tier}`));
        if (h.threat) tags.appendChild(el("span", null, `Угроза ${h.threat}`));
        if (h.foods) tags.appendChild(el("span", null, `${h.foods} ${plural(h.foods, "блюдо", "блюда", "блюд")}`));
        if (h.shards) tags.appendChild(el("span", null, `${h.shards} ${plural(h.shards, "осколок", "осколка", "осколков")} жизни`));
        if (h.mana > 100) tags.appendChild(el("span", null, `Мана ${h.mana}`));
        li.appendChild(tags);
        ul.appendChild(li);
      });
    }

    /* ---------- server in numbers ---------- */
    const NUMS = [
      ["hours", ["час в игре", "часа в игре", "часов в игре"]], ["mobs", ["моб повержен", "моба повержено", "мобов повержено"]],
      ["bosses", ["победа над боссом", "победы над боссами", "побед над боссами"]], ["deaths", ["смерть", "смерти", "смертей"]],
      ["walk", ["км пешком", "км пешком", "км пешком"]], ["fly", ["км по воздуху", "км по воздуху", "км по воздуху"]],
      ["ride", ["км верхом и на колёсах", "км верхом и на колёсах", "км верхом и на колёсах"]], ["mined", ["блок добыт", "блока добыто", "блоков добыто"]],
      ["crafted", ["предмет создан", "предмета создано", "предметов создано"]], ["fish", ["рыба поймана", "рыбы поймано", "рыб поймано"]],
      ["bred", ["зверь выведен", "зверя выведено", "зверей выведено"]], ["trades", ["сделка с жителями", "сделки с жителями", "сделок с жителями"]],
      ["hearts", ["сердце урона нанесено", "сердца урона нанесено", "сердец урона нанесено"]], ["jumps", ["прыжок", "прыжка", "прыжков"]],
    ];
    const COLS = [["name", "Игрок"], ["hours", "Часы"], ["mobs", "Мобы"], ["bosses", "Боссы"], ["deaths", "Смерти"], ["walk", "Км пешком"], ["fly", "Км по воздуху"], ["mined", "Блоки"], ["crafted", "Создано"]];
    let peopleSort = "hours";
    function renderStats() {
      const S = liveNow() ? P.stats : null;
      $(".rm-stats-note").textContent = S
        ? `Жителей на счётчиках: ${S.players}. Числа обновляются раз в минуту.`
        : "Счётчики запустятся 1 октября вместе с новым миром: часы, смерти, пройденные километры и главные чудовища сезона.";
      const ul = $(".rm-nums");
      ul.textContent = "";
      NUMS.forEach(([k, forms]) => {
        const v = S ? (k === "hours" ? Math.round(S.totals[k] || 0) : S.totals[k] || 0) : null, li = el("li");
        li.appendChild(el("b", null, S ? fmtNum(v) : "—"));
        li.appendChild(el("span", null, S ? plural(v, ...forms) : forms[2]));
        const lead = S && S.leaders[k];
        if (lead && S.players > 1) li.appendChild(el("small", null, `больше всех: ${lead[0]} · ${fmtNum(lead[1])}`));
        ul.appendChild(li);
      });
      const toplist = (sel, rows, empty) => {
        const ol = $(sel);
        ol.textContent = "";
        if (!rows || !rows.length) { ol.appendChild(el("li", "rm-empty", empty)); return; }
        const max = rows[0][1];
        rows.forEach(([name, n]) => {
          const li = el("li"); li.appendChild(el("span", "nm", name)); li.appendChild(el("span", "n", fmtNum(n)));
          const bar = el("i"); bar.style.width = (100 * n / max).toFixed(1) + "%"; li.appendChild(bar);
          ol.appendChild(li);
        });
      };
      toplist(".rm-hunted", S && S.hunted, "Пока никого.");
      toplist(".rm-dangerous", S && S.dangerous, "Пока никто никого.");
      const table = $(".rm-people"), head = $("thead tr", table), body = $("tbody", table);
      head.textContent = ""; body.textContent = "";
      COLS.forEach(([k, label]) => {
        const th = el("th"); th.scope = "col";
        if (k === "name") th.textContent = label;
        else {
          const b = el("button", null, label); b.type = "button";
          b.setAttribute("aria-pressed", String(peopleSort === k));
          b.addEventListener("click", () => { peopleSort = k; renderStats(); });
          th.appendChild(b);
          if (peopleSort === k) th.setAttribute("aria-sort", "descending");
        }
        head.appendChild(th);
      });
      const people = S ? S.people.slice().sort((a, b) => b[peopleSort] - a[peopleSort]) : [];
      if (!people.length) { const tr = el("tr"); const td = el("td", "rm-empty", "Таблица появится с первыми жителями сезона."); td.colSpan = COLS.length; tr.appendChild(td); body.appendChild(tr); }
      people.forEach((p) => {
        const tr = el("tr");
        COLS.forEach(([k]) => {
          if (k === "name") { const th = el("th"); th.scope = "row"; th.appendChild(avatar(p.name)); th.append(p.name); tr.appendChild(th); }
          else tr.appendChild(el("td", k === peopleSort ? "on" : "", fmtNum(p[k] || 0)));
        });
        body.appendChild(tr);
      });
    }

    function renderTiers() {
      const dl = $(".rm-tiers");
      dl.textContent = "";
      Object.entries(R.tiers).forEach(([k, t]) => {
        const d = el("div");
        d.appendChild(el("dt", null, `${t.name[0].toUpperCase()}${t.name.slice(1)} веха`));
        const dd = el("dd", null, String(t.points)); dd.appendChild(el("small", null, `за первое открытие: ${Math.round(t.points * 1.5)}`)); d.appendChild(dd);
        const cnt = nodes.filter((n) => String(n.tier) === k).length;
        d.appendChild(el("p", null, `${cnt} ${plural(cnt, "веха", "вехи", "вех")} на карте`));
        dl.appendChild(d);
      });
    }

    /* ---------- the card: a milestone, a boss or a chapter ---------- */
    const card = $(".rm-card");
    function chip(id) {
      const n = byId[id], b = branches[n.branch];
      const li = el("li"), btn = el("button", state[id].done ? "ok" : ""); btn.type = "button"; btn.style.setProperty("--c", b.color);
      btn.appendChild(icon(n.iconFile));
      btn.append(n.title);
      btn.addEventListener("click", () => openCard(id));
      li.appendChild(btn);
      return li;
    }
    function fillCard({ color, iconFile, kicker, title, game, desc }) {
      card.style.setProperty("--c", color);
      const ic = $(".rm-card-icon", card); ic.textContent = ""; if (iconFile) ic.appendChild(icon(iconFile));
      $(".rm-card-branch", card).textContent = kicker;
      $("#rm-card-title").textContent = title;
      $(".rm-card-game", card).textContent = game;
      $(".rm-card-desc", card).textContent = desc;
      ["meta", "deps", "who"].forEach((k) => ($(".rm-card-" + k, card).textContent = ""));
    }
    function showCard() {
      if (!card.open) { if (typeof card.showModal === "function") card.showModal(); else card.setAttribute("open", ""); }
      card.scrollTop = 0;
    }
    function openCard(id) {
      const n = byId[id], b = branches[n.branch], st = state[id];
      fillCard({ color: b.color, iconFile: n.iconFile, kicker: `${b.name} · ${R.season.columns[n.col - 1].title} · ${R.tiers[n.tier].name} веха`,
        title: n.title, game: `Достижение в игре: «${n.game}» (${MODS[n.mod] || n.mod})`, desc: n.desc });
      const meta = $(".rm-card-meta", card);
      meta.append("Очки: "); meta.appendChild(el("b", null, String(n.points)));
      meta.append(" · за первое открытие на сервере: "); meta.appendChild(el("b", null, String(Math.round(n.points * 1.5))));
      const deps = $(".rm-card-deps", card);
      if (n.deps.length) { deps.appendChild(el("p", null, "Сначала")); const ul = el("ul"); n.deps.forEach((d) => ul.appendChild(chip(d))); deps.appendChild(ul); }
      if ((kids[id] || []).length) { deps.appendChild(el("p", null, "Откроет путь к")); const ul = el("ul"); kids[id].forEach((d) => ul.appendChild(chip(d))); deps.appendChild(ul); }
      const boss = R.bosses.find((x) => x.node === id);
      if (boss) {
        deps.appendChild(el("p", null, "Бестиарий"));
        const ul = el("ul"), li = el("li"), btn = el("button"); btn.type = "button"; btn.style.setProperty("--c", BOSS_COLORS[boss.group]);
        btn.appendChild(icon(boss.icon)); btn.append(boss.name); btn.addEventListener("click", () => openBoss(boss));
        li.appendChild(btn); ul.appendChild(li); deps.appendChild(ul);
      }
      const who = $(".rm-card-who", card);
      who.appendChild(el("p", null, st.done ? `Открыли: ${st.who.length}` : "Кто открыл"));
      if (st.done) {
        const ul = el("ul", "rm-who");
        st.who.slice(0, 24).forEach(([p, ts], i) => {
          const li = el("li", i === 0 ? "first" : ""); li.appendChild(avatar(p)); li.append(p + " "); li.appendChild(el("time", null, fmtDate(ts)));
          ul.appendChild(li);
        });
        who.appendChild(ul);
      } else who.appendChild(el("span", "rm-card-meta", st.open ? "Пока никто. Первое открытие на сервере приносит в полтора раза больше очков." : "Пока никто: сначала нужные вехи."));
      showCard();
    }
    function openBoss(b) {
      const k = bossWin(b), g = bossGroups[b.group];
      fillCard({ color: BOSS_COLORS[b.group], iconFile: b.icon, kicker: `${g.name} · ${b.mini ? "мини-босс" : "босс"}`, title: b.name,
        game: `Мод: ${MODS[b.mod] || b.mod}`, desc: b.where ? `Где искать: ${b.where}` : "" });
      const meta = $(".rm-card-meta", card);
      if (k) { meta.append("Побед: "); meta.appendChild(el("b", null, fmtNum(k.kills))); meta.append(" · победителей: "); meta.appendChild(el("b", null, String(k.by.length))); }
      else meta.textContent = "Пока без побед. Первая победа над боссом попадёт в ленту сезона.";
      const deps = $(".rm-card-deps", card);
      if (b.drops.length) {
        deps.appendChild(el("p", null, "Добыча"));
        const ul = el("ul", "rm-drops");
        b.drops.forEach((d) => { const li = el("li"); li.appendChild(icon(d.icon)); li.append(d.name); if (d.chance) li.appendChild(el("small", null, d.chance)); ul.appendChild(li); });
        deps.appendChild(ul);
      }
      if (b.node && byId[b.node]) { deps.appendChild(el("p", null, "Веха на карте")); const ul = el("ul"); ul.appendChild(chip(b.node)); deps.appendChild(ul); }
      const who = $(".rm-card-who", card);
      who.appendChild(el("p", null, "Победители"));
      if (k) {
        const ul = el("ul", "rm-who");
        k.by.slice(0, 24).forEach(([p, n, ts], i) => {
          const li = el("li", i === 0 ? "first" : ""); li.appendChild(avatar(p)); li.append(`${p} ×${n} `); li.appendChild(el("time", null, fmtDate(ts)));
          ul.appendChild(li);
        });
        who.appendChild(ul);
      } else who.appendChild(el("span", "rm-card-meta", "Пока никто."));
      showCard();
    }
    function openChapter(c) {
      const g = chapterGroups[c.group];
      fillCard({ color: "#f4b860", iconFile: c.icon, kicker: `Книга квестов${g ? " · " + g.name : ""}`, title: c.title,
        game: `${c.quests} ${plural(c.quests, "квест", "квеста", "квестов")} в главе`, desc: "Книга квестов открывается кнопкой с книгой в инвентаре. Прогресс у команды общий — собери команду через FTB Teams." });
      const who = $(".rm-card-who", card);
      const teams = ((liveNow() && P.teams) || []).map((t) => [t, (t.chapters || {})[c.id] || 0]).filter((e) => e[1] > 0).sort((a, b) => b[1] - a[1]);
      who.appendChild(el("p", null, "Команды в этой главе"));
      if (!teams.length) { who.appendChild(el("span", "rm-card-meta", "Пока никто не начал.")); showCard(); return; }
      const ul = el("ul", "rm-chteams");
      teams.forEach(([t, n]) => {
        const li = el("li"); li.style.setProperty("--c", t.color || "#b7aecb");
        li.appendChild(el("b", null, t.name)); li.appendChild(el("span", null, `${n} из ${c.quests}`));
        const bar = el("i"); const fill = el("i"); fill.style.width = (100 * n / c.quests).toFixed(1) + "%"; bar.appendChild(fill); li.appendChild(bar);
        ul.appendChild(li);
      });
      who.appendChild(ul);
      showCard();
    }
    card.addEventListener("click", (e) => { if (e.target === card) card.close(); });

    /* ---------- the fun part: nominations, joke achievements, embarrassing deaths ---------- */
    const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
    function renderFun() {
      const S = liveNow() ? P.stats : null, people = (S && S.people) || [], funDone = P.fun || {};
      const aw = $(".rm-awards");
      aw.textContent = "";
      R.awards.forEach((a) => {
        let best = null;
        people.forEach((p) => { const v = p[a.key] || 0; if (v > 0 && (!best || v > best[1])) best = [p.name, v]; });
        const li = el("li", "rm-award" + (best ? " won" : ""));
        li.appendChild(icon(a.iconFile, 40));
        li.appendChild(el("b", null, a.title));
        li.appendChild(el("small", null, a.desc));
        const who = el("div", "who");
        if (best) { who.appendChild(avatar(best[0])); who.append(best[0]); who.appendChild(el("em", null, `${fmtNum(best[1])} ${plural(best[1], ...a.units)}`)); }
        else who.appendChild(el("span", "vacant", "Вакансия открыта"));
        li.appendChild(who);
        aw.appendChild(li);
      });
      const jokes = $(".rm-jokes");
      jokes.textContent = "";
      R.fun.slice().sort((a, b) => ((funDone[b.id] || []).length > 0) - ((funDone[a.id] || []).length > 0)).forEach((f) => {
        const who = funDone[f.id] || [];
        const li = el("li", "rm-joke" + (who.length ? " got" : ""));
        li.appendChild(icon(f.iconFile, 32));
        li.appendChild(el("b", null, `«${f.game}»`));
        li.appendChild(el("p", null, f.desc));
        li.appendChild(el("span", "who", who.length ? `раньше всех — ${who[0][0]}${who.length > 1 ? ` · всего ${who.length}` : ""}` : "пока никто"));
        jokes.appendChild(li);
      });
      const count = {};
      Object.values(funDone).forEach((w) => w.forEach(([p]) => (count[p] = (count[p] || 0) + 1)));
      const top = $(".rm-fun-top");
      top.textContent = "";
      const rows = Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 5);
      if (!rows.length) top.appendChild(el("li", "rm-empty", "Угарать пока некому: ачивки с приколом ждут."));
      rows.forEach(([p, n]) => { const li = el("li"); li.appendChild(avatar(p)); li.appendChild(el("span", null, p)); li.appendChild(el("b", null, `${n} ${plural(n, "ачивка", "ачивки", "ачивок")}`)); top.appendChild(li); });
      const sh = $(".rm-shame");
      sh.textContent = "";
      const list = (S && S.shame) || [];
      if (!list.length) sh.appendChild(el("li", "rm-empty", "Пока все умирают прилично."));
      list.slice(0, 6).forEach(([p, mob, n, id]) => {
        const li = el("li"); li.appendChild(avatar(p));
        const t = el("span"); t.append(`${p} — ${mob}${n > 1 ? ` ×${n}` : ""}`); if (R.shame[id]) t.appendChild(el("em", null, R.shame[id]));
        li.appendChild(t); sh.appendChild(li);
      });
    }

    /* ---------- a joke line in the header, one after another ---------- */
    const STATIC_FACTS = [
      "За весь первый сезон на сервере не поймали ни одной рыбы. Удочки теперь выдают с надеждой.",
      "Зомбифицированные пиглины помнят всё. Даже если «просто задеть».",
      "Пчёлы Жужжилища не злые. Они просто помнят, кто трогал улей.",
      `В книге ${questsTotal} квестов. По одному в минуту — и всего ${Math.round(questsTotal / 60)} часов без перерыва.`,
      "Крипер — это не монстр. Это внезапная перепланировка.",
      "«мыш (кродеться)» — настоящее название достижения в русской версии игры. Подробности — в «Приколах».",
      "Если мимо проплыл дирижабль без экипажа — это не баг, это Гран-при.",
      "За разнообразную еду здесь дают сердца. Гурманы живут дольше.",
      "Эндер-дракон уже нервничает.",
    ];
    function facts() {
      const out = STATIC_FACTS.slice(), S = liveNow() ? P.stats : null;
      if (S && S.totals) {
        const t = S.totals;
        if (t.fall > 100) out.push(`Все вместе мы пролетели вниз ${fmtNum(t.fall)} м. Ньютон гордится.`);
        if (t.deaths) out.push(`Смертей на сервере: ${fmtNum(t.deaths)}. Кладбище расширяется.`);
        if (t.jumps) out.push(`Прыжков на сервере: ${fmtNum(t.jumps)}. Кролики завидуют.`);
        if (t.cake) out.push(`Съедено кусков торта: ${fmtNum(t.cake)}. Торт — не ложь.`);
        const s0 = (S.shame || [])[0];
        if (s0) out.push(`${s0[0]}: смерть от «${s0[1]}»${s0[2] > 1 ? ` ×${s0[2]}` : ""}.${R.shame[s0[3]] ? " " + cap(R.shame[s0[3]]) + "." : ""}`);
      }
      return out;
    }
    let factI = Math.floor(Math.random() * 1000);
    function showFact() {
      const list = facts(), t = $(".rm-fact-t");
      factI = (factI + 1) % list.length;
      t.classList.remove("in");
      setTimeout(() => { t.textContent = list[factI]; t.classList.add("in"); }, reduceMotion ? 0 : 280);
    }

    /* ---------- long lists fold, and open smoothly ---------- */
    const expanded = new Set();
    function clampList(box, key, limit, label) {
      let btn = box.nextElementSibling;
      if (!btn || !btn.classList.contains("rm-more")) {
        btn = el("button", "rm-more"); btn.type = "button"; box.after(btn); box.classList.add("rm-clampable");
        btn.addEventListener("click", () => { if (expanded.has(key)) expanded.delete(key); else expanded.add(key); btn.apply(true); });
      }
      btn.apply = (animate) => {
        const open = expanded.has(key), was = box.style.maxHeight;
        box.style.transition = "none"; box.style.maxHeight = "none";
        const full = box.scrollHeight;
        box.style.maxHeight = was; box.offsetHeight; box.style.transition = "";
        if (full <= limit + 140) { box.classList.remove("rm-clamped"); box.style.maxHeight = ""; btn.hidden = true; return; }
        btn.hidden = false;
        btn.textContent = open ? "Свернуть" : label;
        btn.setAttribute("aria-expanded", String(open));
        if (!animate || reduceMotion) { box.style.maxHeight = open ? "none" : limit + "px"; box.classList.toggle("rm-clamped", !open); return; }
        if (open) {
          box.classList.remove("rm-clamped"); box.style.maxHeight = full + "px";
          box.addEventListener("transitionend", () => { if (expanded.has(key)) box.style.maxHeight = "none"; }, { once: true });
        } else {
          box.style.maxHeight = full + "px"; box.offsetHeight;
          box.classList.add("rm-clamped"); box.style.maxHeight = limit + "px";
          const top = box.getBoundingClientRect().top;
          if (top < 0) scrollTo({ top: scrollY + top - 120, behavior: "smooth" });
        }
      };
      btn.apply(false);
    }
    function clampAll() {
      clampList($(".rm-bosses"), "bosses", 430, `Показать всех боссов (${$(".rm-bosses").children.length})`);
      clampList($(".rm-chapters"), "chapters", 640, `Показать все главы (${R.chapters.length})`);
      clampList($(".rm-awards"), "awards", 620, `Показать все номинации (${R.awards.length})`);
      clampList($(".rm-jokes"), "jokes", 470, `Показать все ачивки с приколом (${R.fun.length})`);
      clampList($(".rm-heroes"), "heroes", 620, `Показать всех героев (${$(".rm-heroes").children.length})`);
    }
    // a turned phone or a resized window changes what is long enough to fold
    let clampW = innerWidth, clampT = 0;
    addEventListener("resize", () => {
      if (innerWidth === clampW) return;
      clampW = innerWidth; clearTimeout(clampT); clampT = setTimeout(clampAll, 250);
    });

    /* ---------- section nav: the part and section in view, and how far down the page ---------- */
    const nav = $(".rm-nav"), navLinks = [...nav.querySelectorAll("a")], progress = $(".rm-nav-progress");
    const spyTargets = navLinks.map((a) => document.querySelector(a.getAttribute("href")));
    let spyId, spyRaf = 0;
    function spy() {
      spyRaf = 0;
      const line = nav.getBoundingClientRect().bottom + 90, max = document.documentElement.scrollHeight - innerHeight;
      let cur = null;
      spyTargets.forEach((s) => { if (s && s.getBoundingClientRect().top <= line) cur = s; });
      if (max > 0 && scrollY >= max - 4) cur = spyTargets[spyTargets.length - 1];
      progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0})`;
      const id = cur ? cur.id : null;
      if (id === spyId) return;
      spyId = id;
      if (!id) delete nav.dataset.g;
      navLinks.forEach((a) => {
        const on = a.getAttribute("href") === "#" + id;
        if (!on) { a.removeAttribute("aria-current"); return; }
        a.setAttribute("aria-current", "true");
        nav.dataset.g = a.parentElement.dataset.g;
        const ul = a.closest("ul"), lr = a.getBoundingClientRect(), ur = ul.getBoundingClientRect();
        if (lr.left < ur.left + 12 || lr.right > ur.right - 12) ul.scrollTo({ left: ul.scrollLeft + (lr.left - ur.left) - (ur.width - lr.width) / 2, behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
    const spyLater = () => { if (!spyRaf) spyRaf = requestAnimationFrame(spy); };
    addEventListener("scroll", spyLater, { passive: true });
    addEventListener("resize", spyLater);

    /* ---------- first visit: a short guided tour ---------- */
    const TOUR = [
      { sel: [".rm-status"], title: "Прогресс сезона", text: "Полоса собрана из десяти путей: чем больше вех открыто на сервере, тем она ярче. Сверху — сколько осталось до старта или какой сейчас день." },
      { sel: [".rm-nav ul"], stick: true, pad: 4, title: "Разделы", text: "Меню всегда под рукой. Подсвечен раздел, где ты сейчас, а тонкая полоска снизу показывает, сколько страницы уже позади." },
      { sel: [".rm-grid .rm-node.open", ".rm-grid .rm-node", ".rm-list .rm-node.open", ".rm-list .rm-node"], pad: 10, title: "Это веха", text: "Одна плитка — одно достижение в игре. Нажми на неё: что сделать, кто уже открыл и что откроется дальше." },
      { sel: [".rm-next"], limit: 240, title: "С чего начать", text: "Не знаешь, куда идти? Здесь вехи, которые можно открыть прямо сейчас, по одной из каждого пути." },
      { sel: [".rm-standings", "#teams"], limit: 280, title: "Команды и ивенты", text: "Играешь с друзьями — соберите команду в FTB Teams. Вехи, квесты и ивенты сезона пойдут в общий зачёт." },
      { sel: [".rm-awards", "#fun"], limit: 260, title: "Приколы", text: "Номинации и ачивки с приколом. Очков не дают, зато слава навсегда." },
      { sel: [".rm-tour-btn"], pad: 8, title: "Вот и всё", text: "Этой кнопкой тур можно повторить. Удачного сезона!" },
    ];
    const store = {
      get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
      set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private window: the tour just shows again */ } },
    };
    let tour = null;
    // a long block is lit only down to its last whole row, so the frame never cuts a card in half
    function spotHeight(step, target, r) {
      if (!step.limit || r.height <= step.limit) return r.height;
      let best = 0;
      for (const c of target.children) {
        const b = c.getBoundingClientRect().bottom - r.top;
        if (b <= step.limit + 1 && b > best) best = b;
      }
      if (!best && target.firstElementChild) best = target.firstElementChild.getBoundingClientRect().bottom - r.top;
      return Math.min(r.height, best || step.limit);
    }
    function tourPlace() {
      if (!tour || !tour.target) return;
      tour.raf = 0;
      const step = TOUR[tour.i], pad = step.pad == null ? 8 : step.pad, r = tour.target.getBoundingClientRect();
      const h = spotHeight(step, tour.target, r);
      Object.assign(tour.spot.style, { top: r.top - pad + "px", left: r.left - pad + "px", width: r.width + pad * 2 + "px", height: h + pad * 2 + "px" });
      const tip = tour.tip, tw = Math.min(360, innerWidth - 24);
      tip.style.width = tw + "px";
      const th = tip.offsetHeight;
      let top = r.top + h + pad + 14;
      if (top + th > innerHeight - 12) top = r.top - pad - 14 - th;
      if (top < 12) top = Math.max(12, Math.min(innerHeight - th - 12, r.top + 24));
      tip.style.top = top + "px";
      tip.style.left = Math.min(Math.max(12, r.left + r.width / 2 - tw / 2), innerWidth - tw - 12) + "px";
    }
    const tourLater = () => { if (tour && !tour.raf) tour.raf = requestAnimationFrame(tourPlace); };
    // waits until smooth scrolling has brought the node to rest (timers, not frames: frames stop in background tabs)
    const settle = (node) => new Promise((done) => {
      let last = null, still = 0;
      const t0 = Date.now();
      const check = () => {
        const y = node.getBoundingClientRect().top;
        still = last !== null && Math.abs(y - last) < 0.5 ? still + 1 : 0;
        last = y;
        if (still > 2 || Date.now() - t0 > 1500) done(); else setTimeout(check, 50);
      };
      setTimeout(check, 50);
    });
    const soon = (fn) => setTimeout(fn, 30);
    async function tourShow(i) {
      if (!tour) return;
      if (i >= TOUR.length) { tourEnd(); return; }
      if (i < 0) return;
      const step = TOUR[i];
      const target = step.sel.map((s) => document.querySelector(s)).find((n) => n && n.getClientRects().length);
      if (!target) { tourShow(i > tour.i ? i + 1 : i - 1); return; }
      const dir = i - tour.i;
      tour.i = i; tour.target = target;
      tour.tip.classList.remove("in");
      const navB = nav.getBoundingClientRect().bottom, r = target.getBoundingClientRect(), h = spotHeight(step, target, r);
      if (step.stick) {
        if (nav.getBoundingClientRect().top > 1) { scrollTo({ top: scrollY + nav.getBoundingClientRect().top, behavior: reduceMotion ? "auto" : "smooth" }); await settle(nav); }
      } else if (r.top < navB + 16 || r.top + h > innerHeight - 220) {
        scrollTo({ top: Math.max(0, scrollY + r.top - Math.max(navB + 40, (innerHeight - h) / 3)), behavior: reduceMotion ? "auto" : "smooth" });
        await settle(target);
      }
      if (!tour || tour.i !== i) return;
      const tip = tour.tip;
      tip.querySelector(".rm-tour-step").textContent = `${i + 1} из ${TOUR.length}`;
      tip.querySelector("h3").textContent = step.title;
      tip.querySelector(".rm-tour-text").textContent = step.text;
      const dots = tip.querySelector(".rm-tour-dots");
      dots.textContent = "";
      TOUR.forEach((_, k) => dots.appendChild(el("i", k === i ? "on" : k < i ? "past" : "")));
      tip.querySelector(".rm-back").hidden = i === 0;
      tip.querySelector(".rm-next").textContent = i === TOUR.length - 1 ? "Готово" : "Дальше";
      tip.dataset.dir = dir < 0 ? "back" : "fwd";
      tourPlace();
      soon(() => tip.classList.add("in"));
      tip.querySelector(".rm-next").focus({ preventScroll: true });
    }
    function tourKeys(e) {
      if (!tour) return;
      if (e.key === "Escape") { e.preventDefault(); tourEnd(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); tourShow(tour.i + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); tourShow(tour.i - 1); }
    }
    function tourStart() {
      if (tour) return;
      if (card.open) card.close();
      const block = el("div", "rm-tour-block"), spot = el("div", "rm-tour-spot"), tip = el("div", "rm-tour-tip");
      tip.setAttribute("role", "dialog"); tip.setAttribute("aria-labelledby", "rm-tour-title"); tip.setAttribute("aria-live", "polite");
      tip.innerHTML = '<p class="rm-tour-step"></p><h3 id="rm-tour-title"></h3><p class="rm-tour-text"></p><div class="rm-tour-dots" aria-hidden="true"></div>'
        + '<div class="rm-tour-btns"><button type="button" class="rm-skip">Пропустить</button><button type="button" class="rm-back">Назад</button><button type="button" class="rm-next">Дальше</button></div>';
      tip.querySelector(".rm-skip").addEventListener("click", () => tourEnd());
      tip.querySelector(".rm-back").addEventListener("click", () => tourShow(tour.i - 1));
      tip.querySelector(".rm-next").addEventListener("click", () => tourShow(tour.i + 1));
      document.body.append(block, spot, tip);
      document.body.classList.add("rm-touring");
      tour = { i: 0, block, spot, tip, target: null, raf: 0 };
      addEventListener("scroll", tourLater, { passive: true });
      addEventListener("resize", tourLater);
      document.addEventListener("keydown", tourKeys);
      tourShow(0);
    }
    function tourEnd() {
      if (!tour) return;
      const t = tour;
      tour = null;
      store.set("rm-tour", "done");
      removeEventListener("scroll", tourLater); removeEventListener("resize", tourLater);
      document.removeEventListener("keydown", tourKeys);
      [t.block, t.spot, t.tip].forEach((n) => n.classList.add("out"));
      setTimeout(() => { [t.block, t.spot, t.tip].forEach((n) => n.remove()); document.body.classList.remove("rm-touring"); }, reduceMotion ? 0 : 350);
      $(".rm-tour-btn").focus({ preventScroll: true });
    }
    const welcome = $(".rm-welcome");
    function welcomeShow() { if (tour) return; welcome.hidden = false; soon(() => welcome.classList.add("in")); }
    function welcomeHide() { welcome.classList.remove("in"); setTimeout(() => { welcome.hidden = true; }, reduceMotion ? 0 : 500); }
    welcome.querySelector(".rm-go").addEventListener("click", () => { welcomeHide(); tourStart(); });
    welcome.querySelector(".rm-skip").addEventListener("click", () => { welcomeHide(); store.set("rm-tour", "skipped"); });
    $(".rm-tour-btn").addEventListener("click", () => { welcomeHide(); tourStart(); });

    /* ---------- render all ---------- */
    function renderAll() {
      computeState(); renderStatus(); renderFilters(); renderBoard(); renderList(); renderNext(); renderTeams(); renderEvents();
      renderBosses(); renderQuests(); renderHeroes(); renderFeedScore(); renderStats(); renderFun(); clampAll(); spy();
    }
    renderTiers();
    renderAll();
    showFact();
    setInterval(() => { if (!document.hidden) showFact(); }, 9000);
    if (params.has("tour") || !store.get("rm-tour")) setTimeout(welcomeShow, 1400);
    new ResizeObserver(() => { markToday(); drawLinks(); }).observe(grid);
    document.fonts && document.fonts.ready.then(() => { markToday(); drawLinks(); });
    setInterval(renderStatus, 30000);
    if (!DEMO) setInterval(async () => {
      if (Date.now() < start || document.hidden || card.open) return;
      P = await loadProgress(R); renderAll();
    }, 60000);
  });

  /* ---------- the creeper in the footer: better not touch ---------- */
  const creeper = $(".rm-creeper"), toast = $(".rm-toast");
  function say(text) {
    toast.textContent = text; toast.hidden = false;
    setTimeout(() => toast.classList.add("in"), 30);
    clearTimeout(say.t);
    say.t = setTimeout(() => { toast.classList.remove("in"); setTimeout(() => { toast.hidden = true; }, 400); }, 3800);
  }
  if (creeper) {
    const face = ["gGggGgGg", "GgGggGgG", "gKKggKKg", "gKKGgKKg", "GgGKKgGg", "gGKKKKgG", "GgKKKKgg", "gGKgGKGg"];
    const colors = { g: "#5cb84c", G: "#7dd35f", K: "#16210f" };
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 8 8"); svg.setAttribute("aria-hidden", "true");
    face.forEach((row, y) => [...row].forEach((c, x) => {
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("x", x); r.setAttribute("y", y); r.setAttribute("width", 1); r.setAttribute("height", 1); r.setAttribute("fill", colors[c]);
      svg.appendChild(r);
    }));
    creeper.appendChild(svg);
    creeper.addEventListener("click", () => {
      if (creeper.classList.contains("hiss") || creeper.classList.contains("boom")) return;
      creeper.classList.add("hiss");
      setTimeout(() => {
        creeper.classList.remove("hiss"); creeper.classList.add("boom");
        let n = 1;
        try { n = Number(localStorage.getItem("rm-boom") || 0) + 1; localStorage.setItem("rm-boom", String(n)); } catch (e) { /* no storage: count from one */ }
        say(n === 1 ? "Ссссс… БУМ. Ну и зачем было его трогать?" : `Ссссс… БУМ. Взорвано криперов: ${n}. Может, хватит?`);
        setTimeout(() => creeper.classList.remove("boom"), reduceMotion ? 0 : 1700);
      }, reduceMotion ? 0 : 1100);
    });
  }

  /* ---------- starry sky ---------- */
  const cv = $(".rm-stars");
  if (cv) {
    const ctx = cv.getContext("2d");
    let stars = [], w = 0, h = 0, raf = 0;
    const colors = ["#ece6f7", "#8fd3ff", "#b28cff", "#f4b860"];
    const size = () => {
      w = cv.width = cv.offsetWidth; h = cv.height = cv.offsetHeight;
      stars = Array.from({ length: Math.round(w * h / 9000) }, () => ({ x: Math.random() * w, y: Math.random() * h, s: Math.random() < 0.15 ? 3 : 2, c: colors[Math.floor(Math.random() * colors.length)], p: Math.random() * 6.28, v: 0.4 + Math.random() }));
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      stars.forEach((st) => {
        ctx.globalAlpha = reduceMotion ? 0.6 : 0.25 + 0.75 * Math.abs(Math.sin(st.p + t / 1000 * st.v * 0.6));
        ctx.fillStyle = st.c; ctx.fillRect(Math.round(st.x), Math.round(st.y), st.s, st.s);
      });
      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };
    size(); raf = requestAnimationFrame(draw);
    addEventListener("resize", () => { cancelAnimationFrame(raf); size(); raf = requestAnimationFrame(draw); });
  }
})();
