(() => {
  const API = "https://173-249-26-11.sslip.io:8444/api";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- ceiling lamps: the only ambient motion ---------- */
  const canvas = document.querySelector(".ceiling");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const colors = ["#ddf5f0", "#f4b860", "#f7a8c8", "#b9a6ff", "#ddf5f0"];
    let dots = [], w = 0, h = 0, running = true, raf = 0;
    const seed = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 7000);
      dots = Array.from({ length: count }, () => {
        const y = Math.pow(Math.random(), 2.2) * h * 0.9;
        return { x: Math.random() * w, y, s: Math.random() < 0.15 ? 3 : 2, c: colors[(Math.random() * colors.length) | 0],
                 p: Math.random() * Math.PI * 2, v: 0.25 + Math.random() * 0.6, base: 0.25 + 0.55 * (1 - y / h) };
      });
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        const a = reduceMotion ? d.base : d.base * (0.55 + 0.45 * Math.sin(d.p + t * 0.001 * d.v));
        ctx.globalAlpha = Math.max(0, a);
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
        const vis = e.isIntersecting;
        if (vis && !running) { running = true; raf = requestAnimationFrame(draw); }
        if (!vis) { running = false; cancelAnimationFrame(raf); }
      }).observe(canvas);
    }
  }

  /* ---------- live status ---------- */
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  const live = document.querySelector(".live");
  withTimeout(fetch(API + "/status", { cache: "no-store" }), 5000)
    .then((r) => (r.ok ? r.json() : Promise.reject()))
    .then((s) => {
      if (s.up === true && !s.stale) {
        live.querySelector(".live-text").textContent = `Сейчас на сервере ${s.online} из ${s.max}`;
        live.hidden = false;
      } else if (s.up === false) {
        live.classList.add("off");
        live.querySelector(".live-text").textContent = "Сервер сейчас выключен";
        live.hidden = false;
      }
    })
    .catch(() => {});

  /* ---------- image viewer ---------- */
  const viewer = document.querySelector(".viewer");
  const vImg = viewer && viewer.querySelector("img");
  document.querySelectorAll(".zoom").forEach((b) => {
    b.addEventListener("click", () => {
      if (!viewer || typeof viewer.showModal !== "function") { window.open(b.dataset.full, "_blank"); return; }
      vImg.src = b.dataset.full;
      vImg.alt = b.querySelector("img").alt;
      viewer.showModal();
    });
  });
  if (viewer) viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });

  /* ---------- carousel ---------- */
  const car = document.querySelector(".carousel");
  if (car) {
    const track = car.querySelector(".track");
    const slides = [...track.querySelectorAll(".slide")];
    const prev = car.querySelector(".prev"), next = car.querySelector(".next"), count = car.querySelector(".car-count");
    const thumbList = car.querySelector(".thumbs");
    const thumbs = [...car.querySelectorAll(".thumb")];
    let cur = 0;
    const warm = (i) => [i - 1, i + 1].forEach((k) => { const im = slides[k] && slides[k].querySelector("img"); if (im) im.loading = "eager"; });
    const mark = (i) => {
      if (i === cur && count.textContent.startsWith(String(i + 1) + " ")) return;
      cur = i;
      count.textContent = `${i + 1} / ${slides.length}`;
      prev.disabled = i === 0; next.disabled = i === slides.length - 1;
      thumbs.forEach((t, k) => t.setAttribute("aria-current", k === i ? "true" : "false"));
      const t = thumbs[i];
      if (t) thumbList.scrollTo({ left: t.parentElement.offsetLeft - thumbList.clientWidth / 2 + t.clientWidth / 2, behavior: reduceMotion ? "auto" : "smooth" });
      warm(i);
    };
    const go = (i) => {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
      mark(i);
    };
    prev.addEventListener("click", () => go(cur - 1));
    next.addEventListener("click", () => go(cur + 1));
    thumbs.forEach((t) => t.addEventListener("click", () => go(Number(t.dataset.i))));
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1); }
    });
    let st;
    track.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => mark(Math.round(track.scrollLeft / track.clientWidth)), 60); }, { passive: true });
    window.addEventListener("resize", () => track.scrollTo({ left: cur * track.clientWidth }));
    count.textContent = "";
    mark(0);
  }

  /* ---------- whitelist form ---------- */
  const form = document.getElementById("wl-form");
  if (!form) return;
  const result = form.querySelector(".result");
  const submit = form.querySelector('button[type="submit"]');
  const NICK = /^[A-Za-z0-9_]{3,16}$/;

  const setErr = (name, msg) => {
    const p = form.querySelector(`.err[data-for="${name}"]`);
    const field = p && p.closest(".field");
    if (p) p.textContent = msg || "";
    if (field) field.classList.toggle("invalid", !!msg);
    const input = form.elements[name];
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (input && p) { p.id = p.id || `err-${name}`; input.setAttribute("aria-describedby", p.id); }
  };
  const collect = () => ({
    nick: form.nick.value.trim(),
    age: form.age.value.trim(),
    contact: form.contact.value.trim(),
    twitch: form.twitch.value.trim(),
    source: form.source.value.trim(),
    about: form.about.value.trim(),
    rules: form.rules.checked,
    website: form.website.value,
  });
  const validate = (d) => {
    const e = {};
    if (!NICK.test(d.nick)) e.nick = "Ник: от 3 до 16 символов, только латиница, цифры и подчёркивание.";
    const age = Number(d.age);
    if (!d.age || !Number.isInteger(age) || age < 8 || age > 99) e.age = "Укажи возраст числом.";
    if (d.contact.length < 3) e.contact = "Оставь Discord, Telegram или Twitch, чтобы мы могли ответить.";
    if (d.about.length < 10) e.about = "Напиши о себе хотя бы пару предложений.";
    if (!d.rules) e.rules = "Без согласия с правилами заявку не примем.";
    return e;
  };
  const showErrors = (errors) => {
    ["nick", "age", "contact", "about", "rules"].forEach((n) => setErr(n, errors[n]));
    const first = ["nick", "age", "contact", "about", "rules"].find((n) => errors[n]);
    if (first) form.elements[first].focus();
  };
  const plainText = (d) =>
    `Заявка в вайтлист Whispers in the Void\nНик: ${d.nick}\nВозраст: ${d.age}\nКонтакт: ${d.contact}\nTwitch: ${d.twitch || "—"}\nОткуда знаю о сервере: ${d.source || "—"}\nО себе: ${d.about}`;
  const show = (html, bad) => {
    result.innerHTML = html;
    result.classList.toggle("bad", !!bad);
    result.hidden = false;
  };
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  form.addEventListener("input", (ev) => {
    const n = ev.target.name;
    if (n && form.querySelector(`.err[data-for="${n}"]`)?.textContent) {
      const e = validate(collect());
      setErr(n, e[n]);
    }
  });

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    result.hidden = true;
    const d = collect();
    const errors = validate(d);
    showErrors(errors);
    if (Object.keys(errors).length) return;

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = "Отправляем…";
    try {
      const r = await withTimeout(fetch(API + "/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, age: Number(d.age) }),
      }), 12000);
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.ok) {
        show(`<p><b>Заявка отправлена.</b> Мы ответим в «${esc(d.contact)}», обычно в течение дня.</p>`);
        form.reset();
      } else if (r.status === 422 && data.fields) {
        showErrors(data.fields);
        show("<p>Проверь поля, отмеченные красным.</p>", true);
      } else if (r.status === 429) {
        show(`<p>${esc(data.message || "Слишком много заявок подряд. Попробуй через час.")}</p>`, true);
      } else {
        throw new Error("bad status " + r.status);
      }
    } catch (e) {
      show(`<p>Заявка не ушла: сервер заявок сейчас не отвечает. Скопируй текст заявки и отправь его AliveEnjoyer в <a href="https://discord.gg/sashawaify" target="_blank" rel="noopener">Discord</a>.</p>
            <button type="button" class="btn copy">Скопировать заявку</button>`, true);
      const btn = result.querySelector(".copy");
      btn.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(plainText(d)); btn.textContent = "Заявка скопирована"; }
        catch { btn.textContent = "Не удалось скопировать"; }
      });
    } finally {
      submit.disabled = false;
      submit.textContent = label;
    }
  });
})();
