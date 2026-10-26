/* Завод ОЛИВКИ: 3D guide. The data (zavod/olivka.json) is written every 6 hours by factory3d.py on the game server;
   x and z in it are relative to a point inside the base, y is the world height. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var load = $('load'), viewer = $('viewer');
  var ROLE = {
    ore: ['Переработка руды', '#f4b860'], fuel: ['Топливо реактора', '#9ad46a'], energy: ['Энергия', '#ee8793'], gas: ['Вода и газы', '#7cc7ff'],
    logistics: ['Сортировка', '#6cd3b6'], store: ['Сундуки', '#a9b6c8'], craft: ['Мастерская', '#c69ae0'], plan: ['Проект', '#7fe3ff']
  };
  var ORDER = ['ore', 'fuel', 'energy', 'gas', 'logistics', 'store', 'craft'];
  var DESC = {
    miner: 'Сам ищет руду в квадрате вокруг себя, вынимает её блок за блоком и отправляет добытое по транспортёру. Ускорители делают его быстрее, энергоулучшения снижают расход энергии.',
    reactor: 'Многоблочный реактор 3 × 4 × 3 из мода Powah. Сжигает уранинит и даёт энергию. Чем холоднее реактор, тем меньше топлива он тратит, поэтому его охлаждают льдом.',
    purifier: 'С кислородом превращает сырую руду в 2 сгустка, а рудный блок в 3. Здесь добыча удваивается.',
    crusher: 'Дробит сгустки в грязную пыль.',
    enricher: 'Очищает грязную пыль до обычной пыли.',
    smelter: 'Плавит пыль в слитки.',
    injector: 'С хлороводородом делает из руды осколки: следующая ступень после очистки.',
    separator: 'Раскладывает воду на кислород и водород. Кислород идёт в очистительную фабрику, водород в газовый генератор.',
    gasgen: 'Сжигает водород от разделителя и возвращает часть энергии в сеть.',
    heatgen: 'Делает энергию из тепла: от лавы рядом или от топлива внутри.',
    cube: 'Аккумулятор. Копит энергию от реактора и солнца и отдаёт её машинам, когда тех не хватает.',
    solar: 'Даёт энергию днём, больше всего в полдень. Ночью не работает.',
    wind: 'Даёт энергию от ветра: чем выше стоит, тем больше.',
    usmelter: 'Переплавляет сырой уранинит в топливо и сразу отдаёт его реактору.',
    sorter: 'Вынимает предметы из сундука у себя за спиной по фильтрам и отправляет их дальше по транспортёру.',
    pump: 'Качает воду из-под себя для разделителя и реактора.',
    infuser: 'Делает сплавы и обогащённые материалы для крафта машин и улучшений.',
    compressor: 'Сжимает материалы с осмием в компоненты для крафта.',
    condenser: 'Переводит газы в жидкости и обратно.',
    prc: 'Проводит реакции под давлением: из жидкости, газа и предмета делает новый материал.',
    orb: 'Заряжает металлы и кристаллы энергией Powah.'
  };
  var STORE_DESC = {
    'Хаб переполнения': 'Общий сундук, куда копатель сгружает всю добычу. Отсюда руда уходит в очистку, уранинит на топливо, а побочная добыча в свои сундуки.',
    'Сундук сгустков': 'Запасной вход дробилки: сгустки, положенные сюда, транспортёр сам заберёт в дробильную фабрику.',
    'Побочная добыча': 'Сюда сортировщик уносит из хаба всё, что не плавится в слитки: уголь, самоцветы, пыль и булыжник.',
    'Снабжение реактора': 'Запас плотного льда, лигнита и уранинита. Транспортёр сам подаёт их в реактор.',
    'Готовые слитки': 'Конец линии: сюда приходят слитки из плавильной фабрики.',
    'Склад': 'Сундуки с припасами над цехом.',
    'Сундуки': 'Отдельные сундуки в цехе.'
  };
  var FLOW = { ore: '#f4b860', o2: '#7cc7ff', h2: '#f1ecff', water: '#4f86e8', energy: '#ff6f61', fuel: '#9ad46a', ice: '#8fe3ff', junk: '#b7aecb' };
  var FLOWNAME = { ore: 'руда и продукция', o2: 'кислород', h2: 'водород', water: 'вода', energy: 'энергия', fuel: 'уранинит', ice: 'лёд и лигнит', junk: 'побочная добыча' };
  var KEY = { miner: 1, reactor: 1, purifier: 1, crusher: 1, enricher: 1, smelter: 1, separator: 1, pump: 1, gasgen: 1, cube: 1, usmelter: 1, sorter: 1 };
  var SLOTS = { basic: 3, advanced: 5, elite: 7, ultimate: 9 };
  var TIER_IN = { basic: 'базовом', advanced: 'продвинутом', elite: 'элитном', ultimate: 'абсолютном' };
  var CY = 58;   // scene y = world y - CY
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  function plural(n, a, b, c) { n = Math.abs(n) % 100; var d = n % 10; return n > 10 && n < 20 ? c : d === 1 ? a : d > 1 && d < 5 ? b : c; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return Math.round(n).toLocaleString('ru-RU'); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function minus(n) { return String(n).replace('-', '−'); }

  if (!window.THREE || !THREE.OrbitControls) { load.textContent = 'Не удалось загрузить 3D. Обнови страницу.'; return; }
  var gl;
  try { gl = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { load.textContent = 'Браузер не поддерживает 3D (WebGL).'; return; }
  gl.setClearColor(0x000000, 0);
  gl.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap; gl.shadowMap.autoUpdate = false;
  var canvas = gl.domElement;
  viewer.insertBefore(canvas, viewer.firstChild);
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('aria-label', '3D-модель завода. Крути мышью, клик по машине показывает её описание.');

  // the fresh scan comes straight from the game server; the copy next to the page is the fallback.
  // The local studio sets window.ZAVOD_SOURCE to its own scan.
  var LIVE = window.ZAVOD_SOURCE || 'https://173-249-26-11.sslip.io:8444/zavod/olivka.json';
  function getJSON(url, ms) {
    var ctl = window.AbortController ? new AbortController() : null, timer = ctl ? setTimeout(function () { ctl.abort(); }, ms) : 0;
    return fetch(url, { cache: 'no-cache', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { clearTimeout(timer); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  getJSON(LIVE, 8000)
    .catch(function (e) { console.warn('live scan unavailable, using the copy', e); return getJSON('zavod/olivka.json', 30000); })
    .then(init)
    .catch(function (e) { console.error(e); if (load) load.textContent = 'Не удалось загрузить модель. Обнови страницу.'; });

  // a 16×16 block face: light pixel noise and a darker rim, so every voxel reads as a separate block
  function blockTexture(rim) {
    var c = document.createElement('canvas'); c.width = c.height = 16;
    var ctx = c.getContext('2d'), img = ctx.createImageData(16, 16), seed = 1234567;
    for (var i = 0; i < 256; i++) {
      var px = i & 15, py = i >> 4;
      seed = (seed * 16807) % 2147483647;
      var v = .9 + (seed / 2147483647) * .1;
      if (px === 0 || py === 0 || px === 15 || py === 15) v *= rim;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.round(255 * v); img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    var t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }

  function init(D) {
    var OX = D.origin[0], OY = D.origin[1], OZ = D.origin[2], st = D.stats || {};
    var hooks = {};   // filled by a plugin (the local studio): cardExtra(t) -> extra card lines, keys[mode](event)

    // ------------------------------------------------ header
    $('updated').textContent = 'Снято ' + new Date(D.updated).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' }) + ' МСК · обновляется каждые 6 часов';
    $('facts').innerHTML = [
      [st.machines, plural(st.machines, 'машина', 'машины', 'машин')], [st.chests, plural(st.chests, 'сундук', 'сундука', 'сундуков')],
      [st.transporters, plural(st.transporters, 'транспортёр', 'транспортёра', 'транспортёров')], [st.cables, plural(st.cables, 'блок кабеля', 'блока кабеля', 'блоков кабеля')],
      [fmt(st.blocks || 0), plural(st.blocks || 0, 'блок', 'блока', 'блоков') + ' в модели']
    ].map(function (f) { return '<span class="fact"><b>' + f[0] + '</b> ' + f[1] + '</span>'; }).join('');
    $('foot1').textContent = 'Модель: область ' + D.size[0] + ' × ' + D.size[2] + ' блоков вокруг базы, высоты ' + OY + '–' + (OY + D.size[1] - 1) + ', показаны только видимые грани. Версия данных ' + D.hash + '.';

    // ------------------------------------------------ scene and blocks
    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x15122a, 170, 360);
    var camera = new THREE.PerspectiveCamera(40, 1.5, .5, 1500);
    scene.add(new THREE.HemisphereLight(0xe2dcff, 0x2c2644, .86));
    var sun = new THREE.DirectionalLight(0xfff1dc, .78);
    sun.position.set(55, 130, 35); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    var sc = sun.shadow.camera; sc.left = -90; sc.right = 90; sc.top = 90; sc.bottom = -90; sc.near = 20; sc.far = 420; sc.updateProjectionMatrix();
    sun.shadow.bias = -.0005; sun.shadow.normalBias = .04;
    scene.add(sun); scene.add(sun.target);

    var SHAPES = [[1, 1, 1, .5], [.5, .55, .5, .275], [1, .5, 1, .25], [.45, .45, .45, .5], [.3, 1, .3, .5], [1, .1, 1, .05], [.18, .6, .18, .3], [1, .5, 1, .75], [1, .88, 1, .44]];
    var cols = D.colours.map(function (c) { return new THREE.Color(c); });
    var box = new THREE.BoxGeometry(1, 1, 1), tex = blockTexture(.7), texClear = blockTexture(.5);
    var MATS = {
      rock: new THREE.MeshLambertMaterial({ map: tex }), solid: new THREE.MeshLambertMaterial({ map: tex }),
      clear: new THREE.MeshLambertMaterial({ map: texClear, transparent: true, opacity: .45, depthWrite: false }), glow: new THREE.MeshBasicMaterial({ map: tex })
    };
    var meshes = [], tmp = new THREE.Color(), m4 = new THREE.Matrix4();
    ['rock', 'solid', 'clear', 'glow'].forEach(function (g) {
      var a = D.groups[g] || [], n = a.length / 6;
      if (!n) return;
      var mesh = new THREE.InstancedMesh(box, MATS[g], n), ys = new Int16Array(n);
      for (var i = 0; i < n; i++) {
        var k = i * 6, s = SHAPES[a[k + 4]] || SHAPES[0];
        m4.makeScale(s[0], s[1], s[2]);
        m4.setPosition(a[k] + OX + .5, a[k + 1] + OY - CY + s[3], a[k + 2] + OZ + .5);
        mesh.setMatrixAt(i, m4);
        tmp.copy(cols[a[k + 3]]); if (g !== 'glow') tmp.multiplyScalar(a[k + 5] / 255);
        mesh.setColorAt(i, tmp);
        ys[i] = a[k + 1] + OY;
      }
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = g === 'rock' || g === 'solid'; mesh.receiveShadow = g !== 'glow';
      mesh.frustumCulled = false; if (g === 'clear') mesh.renderOrder = 2;
      scene.add(mesh); meshes.push({ g: g, mesh: mesh, ys: ys, n: n });
    });

    // ------------------------------------------------ things: machines, chest groups and groups of them
    var things = [];
    function finish(t) {
      var x1 = 1e9, y1 = 1e9, z1 = 1e9, x2 = -1e9, y2 = -1e9, z2 = -1e9;
      t.boxes.forEach(function (q) {
        x1 = Math.min(x1, q.x); y1 = Math.min(y1, q.y); z1 = Math.min(z1, q.z);
        x2 = Math.max(x2, q.x + q.sx); y2 = Math.max(y2, q.y + q.sy); z2 = Math.max(z2, q.z + q.sz);
      });
      t.min = new THREE.Vector3(x1, y1 - CY, z1); t.max = new THREE.Vector3(x2, y2 - CY, z2);
      t.center = t.min.clone().add(t.max).multiplyScalar(.5); t.floor = y1;
      t.color = t.color || (ROLE[t.role] || ROLE.craft)[1];
      t.info = t.info || []; t.d = t.d || {};
      t.i = things.length; things.push(t);
      return t;
    }
    function cell(x, y, z, sx, sy, sz) { return { x: x, y: y, z: z, sx: sx || 1, sy: sy || 1, sz: sz || 1 }; }
    (D.machines || []).forEach(function (m) {
      var s = m.size;
      finish({ kind: m.kind, name: m.name, role: m.role, tier: m.tier, up: m.up, info: m.info, d: m.d,
        boxes: [cell(m.pos[0] - (s[0] - 1) / 2, m.pos[1], m.pos[2] - (s[2] - 1) / 2, s[0], s[1], s[2])] });
    });
    (D.storage || []).forEach(function (s) {
      finish({ kind: 'store', name: s.name, role: 'store', count: s.count, boxes: s.cells.map(function (c) { return cell(c[0], c[1], c[2]); }) });
    });
    function group(list, t) {
      t.members = list; t.boxes = [].concat.apply([], list.map(function (m) { return m.boxes; }));
      list.forEach(function (m) { m.parent = t; });
      return finish(t);
    }
    function byKind(k) { return things.filter(function (t) { return t.kind === k && !t.members; }); }
    function one(k) { return byKind(k)[0] || null; }

    var solars = byKind('solar'), solar = solars[0] || null;
    if (solars.length > 1) {
      var peak = solars.reduce(function (a, t) { return a + (t.boxes[0].sx > 1 ? 240 : 40); }, 0);
      solar = group(solars, { kind: 'solar', role: 'energy', name: 'Солнечные генераторы ×' + solars.length,
        info: [solars.length + ' ' + plural(solars.length, 'генератор', 'генератора', 'генераторов') + ' на лугу над цехом', 'вместе до ' + fmt(peak) + ' FE/t в полдень'] });
    }
    var named = {}, S = {};
    things.filter(function (t) { return t.kind === 'store'; }).forEach(function (t) { (named[t.name] = named[t.name] || []).push(t); });
    Object.keys(named).forEach(function (nm) {
      var l = named[nm];
      S[nm] = l.length > 1 ? group(l, { kind: 'store', role: 'store', name: nm, groups: l.length, count: l.reduce(function (a, t) { return a + t.count; }, 0) }) : l[0];
    });
    var M = {}, sorters = byKind('sorter');
    ['miner', 'reactor', 'purifier', 'crusher', 'enricher', 'smelter', 'separator', 'pump', 'gasgen', 'cube', 'usmelter'].forEach(function (k) { M[k] = one(k); });
    M.uSorter = sorters.filter(function (t) { return t.role === 'fuel'; })[0] || null;
    M.jSorter = sorters.filter(function (t) { return t !== M.uSorter; }).sort(function (a, b) { return (b.d.filters || 0) - (a.d.filters || 0); })[0] || null;
    var hub = S['Хаб переполнения'] || null, clumps = S['Сундук сгустков'] || null, junk = S['Побочная добыча'] || null;
    var supply = S['Снабжение реактора'] || null, ingots = S['Готовые слитки'] || null, stock = S['Склад'] || null;
    var top = things.filter(function (t) { return !t.parent; });
    // numbers follow the path of the ore; the plan, the pins and the lists share them
    var num = 0;
    [M.miner, hub, M.purifier, M.separator, M.pump, clumps, M.crusher, M.enricher, M.smelter, ingots, M.uSorter, M.usmelter, supply, M.reactor, M.cube, solar, M.gasgen, M.jSorter, junk, stock]
      .concat(ORDER.reduce(function (a, role) { return a.concat(top.filter(function (t) { return t.role === role; })); }, []))
      .forEach(function (t) { if (t && !t.n && !t.parent) t.n = ++num; });
    function badge(t) { var tag = t.n || t.badge; return tag ? '<b class="num" style="background:' + t.color + '">' + esc(tag) + '</b>' : '<i style="background:' + t.color + '"></i>'; }

    // invisible hit boxes for hover and click
    var hitMat = new THREE.MeshBasicMaterial({ visible: false }), hits = new THREE.Group();
    function addHits(t) {
      t.hitMeshes = [];
      t.boxes.forEach(function (q) {
        var h = new THREE.Mesh(box, hitMat);
        h.position.set(q.x + q.sx / 2, q.y - CY + q.sy / 2, q.z + q.sz / 2); h.scale.set(q.sx + .1, q.sy + .1, q.sz + .1);
        h.userData = { t: t, y: q.y }; hits.add(h); t.hitMeshes.push(h);
      });
    }
    function dropThing(t) { (t.hitMeshes || []).forEach(function (h) { hits.remove(h); }); t.hitMeshes = []; t.dead = true; }
    things.forEach(function (t) { if (!t.members) addHits(t); });
    scene.add(hits);

    // ------------------------------------------------ miner zone: a dashed square on the miner's floor
    var zone = null, zoneThing = null;
    if (M.miner && M.miner.d.radius) {
      var r = M.miner.d.radius, q0 = M.miner.boxes[0], mx = q0.x + (q0.sx - 1) / 2, mz = q0.z + (q0.sz - 1) / 2, zy = q0.y - CY + .06;
      var zx1 = mx - r, zx2 = mx + r + 1, zz1 = mz - r, zz2 = mz + r + 1, side0 = 2 * r + 1;
      zone = new THREE.Group();
      var zl = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(zx1, zy, zz1), new THREE.Vector3(zx2, zy, zz1), new THREE.Vector3(zx2, zy, zz2), new THREE.Vector3(zx1, zy, zz2), new THREE.Vector3(zx1, zy, zz1)]),
        new THREE.LineDashedMaterial({ color: FLOW.ore, dashSize: 1.4, gapSize: .9, transparent: true, opacity: .9, depthTest: false }));
      zl.computeLineDistances(); zl.renderOrder = 8;
      var zp = new THREE.Mesh(new THREE.PlaneGeometry(zx2 - zx1, zz2 - zz1), new THREE.MeshBasicMaterial({ color: FLOW.ore, transparent: true, opacity: .07, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
      zp.rotation.x = -Math.PI / 2; zp.position.set((zx1 + zx2) / 2, zy, (zz1 + zz2) / 2); zp.renderOrder = 7;
      zone.add(zp); zone.add(zl); zone.visible = false; scene.add(zone);
      zoneThing = { name: 'Зона копателя ' + side0 + ' × ' + side0, color: FLOW.ore, floor: q0.y, boxes: [],
        center: new THREE.Vector3(zx1 + 6, zy, zz1), max: new THREE.Vector3(zx2, zy, zz2), min: new THREE.Vector3(zx1, zy, zz1) };
    }

    // ------------------------------------------------ highlight: outlined boxes drawn through walls, gently pulsing
    var hl = new THREE.Group(), edgeGeo = new THREE.EdgesGeometry(box), hlMats = {}, highlighted = [];
    scene.add(hl);
    function hlMat(color) {
      return hlMats[color] || (hlMats[color] = {
        edge: new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: .95, depthTest: false }),
        ghost: new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: .5, depthTest: false }),
        fill: new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: .3, depthTest: false, depthWrite: false })
      });
    }
    function setHighlight(list) {
      while (hl.children.length) hl.remove(hl.children[0]);
      highlighted = list.filter(function (t) { return t && t.boxes && t.boxes.length; });
      highlighted.forEach(function (t) {
        // things above the cut (cut away from view) keep only a faint outline, so they show where they stand without covering the scene
        var m = hlMat(t.color), ghost = t.floor > cut;
        t.boxes.forEach(function (q) {
          (ghost ? [new THREE.LineSegments(edgeGeo, m.ghost)] : [new THREE.LineSegments(edgeGeo, m.edge), new THREE.Mesh(box, m.fill)]).forEach(function (o) {
            o.position.set(q.x + q.sx / 2, q.y - CY + q.sy / 2, q.z + q.sz / 2); o.scale.set(q.sx + .22, q.sy + .22, q.sz + .22);
            o.renderOrder = 10; hl.add(o);
          });
        });
      });
      dirty = true;
    }
    function pulse(time) {
      var k = .2 + .2 * (.5 + .5 * Math.sin(time * 2.6));
      Object.keys(hlMats).forEach(function (c) { hlMats[c].fill.opacity = k; });
    }

    // ------------------------------------------------ flows: beads running along arcs between things
    var flowGroup = new THREE.Group(), streams = [], bead = new THREE.SphereGeometry(.24, 10, 8), flowMats = {}, lastTime = 0;
    scene.add(flowGroup);
    function flowMat(type) {
      return flowMats[type] || (flowMats[type] = {
        bead: new THREE.MeshBasicMaterial({ color: FLOW[type], depthTest: false, transparent: true }),
        line: new THREE.LineBasicMaterial({ color: FLOW[type], transparent: true, opacity: .5, depthTest: false })
      });
    }
    function setFlows(list) {
      streams.forEach(function (s) { flowGroup.remove(s.mesh); flowGroup.remove(s.line); s.line.geometry.dispose(); if (s.mesh.dispose) s.mesh.dispose(); });
      streams = [];
      var used = [];
      if ($('tFlows').checked) list.forEach(function (f) {
        var a = f[0], b = f[1], type = f[2];
        if (!a || !b || a === b) return;
        var p0 = a.center.clone(), p1 = b.center.clone(), d = p0.distanceTo(p1);
        if (d < .5) return;
        var mid = p0.clone().add(p1).multiplyScalar(.5); mid.y += 1 + d * .15 + (f[3] || 0);
        var curve = new THREE.QuadraticBezierCurve3(p0, mid, p1), len = curve.getLength(), n = Math.max(2, Math.round(len / 1.6)), m = flowMat(type);
        var mesh = new THREE.InstancedMesh(bead, m.bead, n), line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)), m.line);
        mesh.renderOrder = 12; line.renderOrder = 9; mesh.frustumCulled = false;
        flowGroup.add(line); flowGroup.add(mesh);
        streams.push({ curve: curve, mesh: mesh, line: line, n: n, len: len });
        if (used.indexOf(type) < 0) used.push(type);
      });
      $('flowKey').innerHTML = used.map(function (t) { return '<span><i style="background:' + FLOW[t] + '"></i>' + FLOWNAME[t] + '</span>'; }).join('');
      animateFlows(lastTime); dirty = true;
    }
    var bp = new THREE.Vector3(), bm = new THREE.Matrix4();
    function animateFlows(time) {
      streams.forEach(function (s) {
        for (var i = 0; i < s.n; i++) {
          s.curve.getPoint(((time * 2.4 / s.len) + i / s.n) % 1, bp);
          bm.makeTranslation(bp.x, bp.y, bp.z); s.mesh.setMatrixAt(i, bm);
        }
        s.mesh.instanceMatrix.needsUpdate = true;
      });
    }

    // ------------------------------------------------ pins: labels above things, stacked so they never overlap
    var labels = $('labels'), pins = [], pinsFocus = false, pv = new THREE.Vector3(), placed = [];
    function makePins(list, focus) {
      labels.textContent = ''; pins = []; pinsFocus = focus;
      list.forEach(function (t) {
        if (!t) return;
        var el = document.createElement('div');
        var tag = t.n || t.badge, compact = !focus && tag;
        el.className = 'pin' + (focus ? ' focus' : '') + (compact ? ' compact' : '') + (t.kind === 'plan' ? ' ghost' : ''); el.style.setProperty('--c', t.color); el.hidden = true;
        el.innerHTML = (tag ? '<b class="num">' + esc(tag) + '</b>' : '<i></i>') + (compact ? '' : esc(t.name));
        labels.appendChild(el); pins.push({ t: t, el: el, w: 0, h: 0 });
      });
      dirty = true;
    }
    function placePins() {
      var show = $('tPins').checked, list = [];
      pins.forEach(function (p) {
        var t = p.t;
        if (!show || (!pinsFocus && t.floor > cut)) { p.el.hidden = true; return; }
        pv.set(t.center.x, t.max.y + .3, t.center.z).project(camera);
        if (pv.z > 1 || Math.abs(pv.x) > 1.02 || Math.abs(pv.y) > 1.02) { p.el.hidden = true; return; }
        p.el.hidden = false;
        if (!p.w) { p.w = p.el.offsetWidth; p.h = p.el.offsetHeight; }
        p.x = (pv.x + 1) / 2 * W; p.y = (1 - pv.y) / 2 * H; list.push(p);
      });
      list.sort(function (a, b) { return b.y - a.y; });
      placed.length = 0;
      list.forEach(function (p) {
        var lift = 0, x1 = Math.max(4, Math.min(W - p.w - 4, p.x - p.w / 2)), x2 = x1 + p.w;
        for (var guard = 0; guard < 14; guard++) {
          var y2 = p.y - 8 - lift, y1 = y2 - p.h, hit = null;
          for (var j = 0; j < placed.length; j++) {
            var q = placed[j];
            if (x1 < q.x2 + 4 && x2 > q.x1 - 4 && y1 < q.y2 + 3 && y2 > q.y1 - 3) { hit = q; break; }
          }
          if (!hit) break;
          lift = p.y - 8 - hit.y1 + 3;
        }
        placed.push({ x1: x1, x2: x2, y1: p.y - 8 - lift - p.h, y2: p.y - 8 - lift });
        p.el.style.transform = 'translate(' + Math.round(x1) + 'px,' + Math.round(p.y - 8 - lift - p.h) + 'px)';
        p.el.style.setProperty('--stem', (8 + lift) + 'px');
        p.el.style.setProperty('--sx', Math.round(p.x - x1) + 'px');
      });
    }

    // ------------------------------------------------ camera, controls, layers
    var controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.dampingFactor = .08; controls.minDistance = 5; controls.maxDistance = 280; controls.maxPolarAngle = 1.52; controls.autoRotateSpeed = .6;
    var whint = $('whint'), whintTimer = 0;
    canvas.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey) return;
      e.stopImmediatePropagation();
      whint.hidden = false; clearTimeout(whintTimer); whintTimer = setTimeout(function () { whint.hidden = true; }, 1300);
    }, { capture: true });
    var dirty = true, anim = null, W = 1, H = 1;
    controls.addEventListener('change', function () { dirty = true; });
    controls.addEventListener('start', function () { anim = null; if ($('tSpin').checked) { $('tSpin').checked = false; controls.autoRotate = false; } });
    $('tSpin').addEventListener('change', function () { controls.autoRotate = $('tSpin').checked; dirty = true; });
    $('tRock').addEventListener('change', function () { meshes.forEach(function (o) { if (o.g === 'rock') o.mesh.visible = $('tRock').checked; }); gl.shadowMap.needsUpdate = true; dirty = true; });
    $('tPins').addEventListener('change', function () { dirty = true; });
    $('tFlows').addEventListener('change', function () { applyFlows(); });

    var cut = 57, range = $('cutRange'), out = $('cutOut'), layerBtns = [$('lTop'), $('lStore'), $('lFactory')];
    function layerName(c) { return c >= 80 ? 'всё целиком' : c >= 66 ? 'поверхность' : c >= 59 ? 'склад' : 'цех'; }
    function setCut(c) {
      cut = c; range.value = c; out.textContent = 'y ' + c + ' · ' + layerName(c);
      meshes.forEach(function (o) { var lo = 0, hi = o.n; while (lo < hi) { var mid = (lo + hi) >> 1; if (o.ys[mid] <= c) lo = mid + 1; else hi = mid; } o.mesh.count = lo; });
      layerBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.cut === c)); });
      gl.shadowMap.needsUpdate = true; dirty = true;
    }
    range.addEventListener('input', function () { setCut(+range.value); });
    layerBtns.forEach(function (b) { b.addEventListener('click', function () { setCut(+b.dataset.cut); }); });

    function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    var view = null, FDIR = [.75, 2.3, 1];
    function fit(list) {
      var bb = new THREE.Box3();
      list.forEach(function (t) { if (t) { bb.expandByPoint(t.min); bb.expandByPoint(t.max); } });
      if (bb.isEmpty()) return null;
      var half = Math.min(camera.fov, 2 * Math.atan(Math.tan(camera.fov * Math.PI / 360) * camera.aspect) * 180 / Math.PI) * Math.PI / 360;
      return { c: bb.getCenter(new THREE.Vector3()), dist: Math.max(4, bb.getSize(new THREE.Vector3()).length() / 2) / Math.sin(half) };
    }
    function flyCam(c, dist, dir, instant) {
      var p1 = c.clone().add(new THREE.Vector3().fromArray(dir).normalize().multiplyScalar(dist));
      if (instant || reduce) { anim = null; controls.target.copy(c); camera.position.copy(p1); controls.update(); dirty = true; return; }
      anim = { t0: performance.now(), dur: 1000, p0: camera.position.clone(), p1: p1, q0: controls.target.clone(), q1: c.clone() };
    }
    // frame a list of things from a direction
    function flyTo(list, dir, pad, instant) {
      var f = fit(list); if (!f) return;
      view = function (i) { flyTo(list, dir, pad, i); };
      flyCam(f.c, f.dist * (pad || 1), dir || [1, .9, 1.2], instant);
    }
    // the factory steps share one direction: the camera only slides toward the focus, so the viewer keeps their bearings
    var factory = top.filter(function (t) { return t.floor >= 50 && t.floor <= 56 && t.kind !== 'solar'; });
    function factoryView(focus, instant) {
      var F = fit(factory), f = fit(focus.length ? focus : factory); if (!F || !f) return;
      view = function (i) { factoryView(focus, i); };
      flyCam(F.c.clone().lerp(f.c, .45), Math.min(Math.max(f.dist * 1.5, F.dist * .74), F.dist * .95), FDIR, instant);
    }
    $('resetView').addEventListener('click', function () { if (view) view(); });

    // ------------------------------------------------ info card, hover, click
    var card = $('card');
    function openCard(t) {
      $('cardTitle').textContent = t.name;
      var role = ROLE[t.role] || ROLE.craft;
      $('cardRole').innerHTML = '<span class="badge"><i style="background:' + role[1] + '"></i>' + role[0] + '</span>';
      $('cardText').textContent = t.desc || (t.kind === 'store' ? (STORE_DESC[t.name] || STORE_DESC['Сундуки']) : (DESC[t.kind] || ''));
      var f = [];
      if (t.up) f.push('Ускорители: ' + t.up[0] + ' · энергоулучшения: ' + t.up[1]);
      if (t.tier && SLOTS[t.tier] && t.name.indexOf('фабрика') >= 0) f.push(SLOTS[t.tier] + ' ' + plural(SLOTS[t.tier], 'операция', 'операции', 'операций') + ' одновременно');
      t.info.forEach(function (s) { f.push(cap(s)); });
      if (t.kind === 'store') f.push(t.count + ' ' + plural(t.count, 'сундук', 'сундука', 'сундуков') + (t.groups ? ' в ' + t.groups + ' ' + plural(t.groups, 'группе', 'группах', 'группах') : ''));
      if (hooks.cardExtra) f = f.concat(hooks.cardExtra(t) || []);
      $('cardFacts').innerHTML = f.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('');
      card.hidden = false;
    }
    function closeCard() { card.hidden = true; if (mode === 'list') { setHighlight([]); planFocus([], []); } }
    $('cardClose').addEventListener('click', closeCard);
    var ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), tip = $('tip'), downAt = null;
    function pick(e) {
      var rc = canvas.getBoundingClientRect();
      mouse.set((e.clientX - rc.left) / rc.width * 2 - 1, -(e.clientY - rc.top) / rc.height * 2 + 1);
      ray.setFromCamera(mouse, camera);
      var hs = ray.intersectObjects(hits.children, false);
      for (var i = 0; i < hs.length; i++) {
        var u = hs[i].object.userData, t = u.t.parent || u.t;
        if (u.y <= cut || highlighted.indexOf(t) >= 0 || highlighted.indexOf(u.t) >= 0) return { t: t, x: e.clientX - rc.left, y: e.clientY - rc.top };
      }
      return null;
    }
    canvas.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || e.buttons) { tip.hidden = true; return; }
      var p = pick(e);
      canvas.classList.toggle('pointing', !!p);
      if (p) {
        tip.hidden = false; tip.innerHTML = badge(p.t) + esc(p.t.name);
        tip.style.transform = 'translate(' + Math.round(Math.min(p.x + 14, W - tip.offsetWidth - 6)) + 'px,' + Math.round(p.y + 14) + 'px)';
      } else tip.hidden = true;
    });
    canvas.addEventListener('pointerleave', function () { tip.hidden = true; });
    canvas.addEventListener('pointerdown', function (e) { downAt = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', function (e) {
      if (!downAt || Math.abs(e.clientX - downAt[0]) + Math.abs(e.clientY - downAt[1]) > 6) return;
      var p = pick(e);
      if (!p) { if (!card.hidden) closeCard(); return; }
      openCard(p.t);
      if (mode === 'list') { setHighlight([p.t]); planFocus([p.t], []); }
    });

    // ------------------------------------------------ tour
    var rd = M.reactor ? M.reactor.d : {}, md = M.miner ? M.miner.d : {}, cd = M.cube ? M.cube.d : {};
    function B(t, text) { return '<b>' + esc(text || (t ? t.name : '')) + '</b>'; }
    function ups(t) { return t && t.up ? t.up[0] + ' ' + plural(t.up[0], 'ускоритель', 'ускорителя', 'ускорителей') + ' и ' + t.up[1] + ' ' + plural(t.up[1], 'энергоулучшение', 'энергоулучшения', 'энергоулучшений') : ''; }
    function bullets(items) { return '<ul>' + items.filter(Boolean).map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>'; }
    var nSol = solars.length, side = md.radius ? 2 * md.radius + 1 : 0;
    var slots = M.purifier && SLOTS[M.purifier.tier] ? SLOTS[M.purifier.tier] : 0;
    var junkTags = M.jSorter && M.jSorter.d.tags && M.jSorter.d.tags.length ? M.jSorter.d.tags.join(', ') : 'уголь, самоцветы, пыль и булыжник';
    var solarsText = nSol + ' ' + plural(nSol, 'солнечный генератор', 'солнечных генератора', 'солнечных генераторов');
    var STEPS = [
      { t: 'Завод под лугом', cut: 104, focus: [solar], frame: [{ min: new THREE.Vector3(-28, -6, -34), max: new THREE.Vector3(28, 14, 30) }], dir: [1, 1.25, 1.3], pad: .78,
        p: ['Сверху видно только цветочный луг и ' + solarsText + '. Весь завод спрятан в пещере прямо под ними.',
          'Жми «Далее»: снимем слой земли и пройдём путь руды от копателя до готового слитка. Модель можно крутить в любой момент, а клик по машине расскажет, что это.'] },
      { t: 'Добыча руды', cut: 57, focus: [M.miner, hub], pins: [M.miner, hub, zoneThing], frame: [M.miner, hub, zoneThing], zone: true, dir: [.9, 1.3, 1.2], pad: .8,
        flows: [[M.miner, hub, 'ore']],
        p: [B(M.miner) + ' сам находит руду в квадрате ' + side + ' × ' + side + ' блоков вокруг себя (пунктир) и вынимает её на высотах от ' + minus(md.ymin) + ' до ' + minus(md.ymax) + '.' + (md.running === false ? ' Сейчас он остановлен.' : '') + (M.miner && M.miner.up ? ' В нём ' + ups(M.miner) + '.' : ''),
          'Всё добытое транспортёр везёт в ' + B(hub, 'хаб переполнения') + '. Копатель добывает быстрее, чем перерабатывает линия, поэтому запас руды копится в хабе.',
          'Чанки базы и зоны копателя прогружены всегда, поэтому завод работает, даже когда на сервере никого нет.'] },
      { t: 'Хаб и сортировка', cut: 57, focus: [hub, M.uSorter, M.jSorter, junk],
        flows: [[hub, M.purifier, 'ore'], [M.uSorter, M.usmelter, 'fuel'], [M.jSorter, junk, 'junk']],
        p: ['Хаб — это ' + (hub && hub.count > 1 ? hub.count + ' ' + plural(hub.count, 'сундук', 'сундука', 'сундуков') : 'один сундук') + ', через который проходит вся добыча. Из него три выхода:',
          bullets(['транспортёр несёт руду в очистительную фабрику, она берёт только то, что умеет перерабатывать;',
            B(M.uSorter, 'сортировщик урана') + ' отправляет сырой уранинит на топливо для реактора;',
            B(M.jSorter, 'сортировщик побочной добычи') + ' уносит всё, что не плавится в слитки: ' + esc(junkTags) + (M.jSorter && M.jSorter.d.items ? ' и ещё ' + M.jSorter.d.items + ' ' + plural(M.jSorter.d.items, 'предмет', 'предмета', 'предметов') + ' по фильтрам' : '') + '. Так хаб не забивается.'])] },
      { t: 'Очистка: руда ×2', cut: 57, focus: [M.purifier, M.separator, M.pump],
        flows: [[hub, M.purifier, 'ore'], [M.pump, M.separator, 'water'], [M.separator, M.purifier, 'o2'], [M.purifier, M.crusher, 'ore', .8]],
        p: [B(M.purifier) + (slots ? ' обрабатывает ' + slots + ' ' + plural(slots, 'руду', 'руды', 'руд') + ' одновременно.' : '.') + ' С кислородом каждая сырая руда превращается в 2 сгустка: здесь добыча удваивается.',
          'Кислород даёт ' + B(M.separator, 'электролизный разделитель') + ': он раскладывает воду на кислород и водород. Воду качает ' + B(M.pump, 'электронасос') + ' под полом.',
          'Готовые сгустки транспортёр под полом сразу везёт в дробилку.'] },
      { t: 'Дробление и обогащение', cut: 57, focus: [M.crusher, M.enricher, clumps],
        flows: [[M.purifier, M.crusher, 'ore'], [clumps, M.crusher, 'ore'], [M.crusher, M.enricher, 'ore']],
        p: ['Под полом проложена транспортная шина. Она везёт сгустки в ' + B(M.crusher, 'дробильную фабрику') + ', из каждого выходит грязная пыль.',
          B(M.enricher) + ' очищает её до обычной пыли.' + (M.crusher && M.crusher.up ? ' В каждой из двух фабрик ' + ups(M.crusher) + '.' : ''),
          'Если положить сгустки в ' + B(clumps, 'сундук сгустков') + ' рядом, транспортёр сам заберёт их в дробилку.'] },
      { t: 'Плавка и готовые слитки', cut: 57, focus: [M.smelter, ingots],
        flows: [[M.enricher, M.smelter, 'ore'], [M.smelter, ingots, 'ore']],
        p: [B(M.smelter) + ' отливает из пыли слитки. Итог линии: из 1 сырой руды выходит 2 слитка.',
          'Слитки поднимаются в сундук над плавильней и по цепочке транспортёров расходятся по ' + (ingots ? ingots.count + ' ' + plural(ingots.count, 'сундуку', 'сундукам', 'сундукам') : 'сундукам') + ' готовой продукции.'] },
      { t: 'Энергия', cut: 57, focus: [M.reactor, M.cube, solar, M.gasgen],
        flows: [[M.reactor, M.cube, 'energy'], [M.separator, M.gasgen, 'h2']].concat(solars.map(function (s) { return [s, M.cube, 'energy']; })),
        p: [B(M.reactor) + (rd.fe ? ' выдаёт около ' + fmt(rd.fe) + ' FE/t.' : ' — главный источник энергии.') + ' Днём к нему добавляются ' + solarsText + ' на лугу, до 240 FE/t каждый в полдень.',
          'Энергия собирается в ' + B(M.cube, (M.cube && TIER_IN[M.cube.tier] ? TIER_IN[M.cube.tier] + ' ' : '') + 'энергокубе') + (cd.cap ? (cd.fe / cd.cap < .02 ? ' (сейчас почти пуст: машины забирают всё, что приходит)' : ' (сейчас ' + (cd.fe / 1e6).toFixed(1).replace('.', ',') + ' млн FE из ' + Math.round(cd.cap / 1e6) + ' млн)') : '') + ' и по кабелям расходится по машинам.',
          B(M.gasgen) + ' сжигает водород от разделителя и возвращает часть энергии в сеть.'] },
      { t: 'Топливо и охлаждение', cut: 57, focus: [M.uSorter, M.usmelter, supply, M.reactor],
        flows: [[M.uSorter, M.usmelter, 'fuel'], [M.usmelter, M.reactor, 'fuel'], [M.reactor, M.usmelter, 'energy', 1.2], [supply, M.reactor, 'ice'], [M.pump, M.reactor, 'water']],
        p: ['Сырой уранинит из хаба переплавляется в ' + B(M.usmelter, 'энергоплавильне') + ' и сразу уходит в реактор. Питание ей даёт сам реактор по кабелю под полом.',
          'Из ' + B(supply, 'сундука снабжения') + ' транспортёр подаёт ' + (rd.coolant ? esc(rd.coolant[0]) : 'лёд') + (rd.carbon ? ' и ' + esc(rd.carbon[0]) : '') + ', а насос доливает воду в бак реактора.',
          rd.factor > 1 ? 'Лёд делит температуру на ' + rd.factor + ': без него реактор грелся бы до ' + rd.hot + '° и сжигал уранинит в ' + rd.factor + ' раз быстрее.' + (rd.carbon ? ' ' + esc(cap(rd.carbon[0])) + ' добавляет мощности.' : '') : '',
          rd.temp !== undefined ? 'Сейчас в реакторе ' + rd.temp + '°, уранинит ' + rd.fuel + (rd.coolant ? ', ' + esc(rd.coolant[0]) + ' ' + rd.coolant[1] : '') + (rd.carbon ? ', ' + esc(rd.carbon[0]) + ' ' + rd.carbon[1] : '') + '.' : ''] },
      { t: 'Склад и свободный осмотр', cut: 62, focus: [stock], frame: [stock], dir: FDIR, pad: .9,
        p: [stock ? 'Над цехом склад: ' + stock.count + ' ' + plural(stock.count, 'сундук', 'сундука', 'сундуков') + (stock.groups ? ' в ' + stock.groups + ' ' + plural(stock.groups, 'группе', 'группах', 'группах') : '') + '.' : '',
          'Дальше крути модель сам: клик по машине или сундуку покажет, что это. Полный список — во вкладке «Все машины».'] }
    ].filter(function (s) { return s.focus.some(Boolean); });

    var step = 0, mode = 'tour', dots = $('dots');
    STEPS.forEach(function (s, i) {
      var b = document.createElement('button'); b.className = 'dot'; b.type = 'button'; b.setAttribute('aria-label', 'Шаг ' + (i + 1) + ': ' + s.t);
      b.addEventListener('click', function () { go(i); }); dots.appendChild(b);
    });
    function chips(list) {
      return list.filter(Boolean).map(function (t) { return '<button class="chip" type="button" data-i="' + t.i + '">' + badge(t) + esc(t.name) + '</button>'; }).join('');
    }
    function go(i, instant) {
      step = Math.max(0, Math.min(STEPS.length - 1, i));
      var s = STEPS[step], focus = s.focus.filter(Boolean);
      $('stepNum').textContent = 'Шаг ' + (step + 1) + ' из ' + STEPS.length;
      $('stepTitle').textContent = s.t;
      $('stepText').innerHTML = s.p.filter(Boolean).map(function (x) { return x.indexOf('<ul>') === 0 ? x : '<p>' + x + '</p>'; }).join('');
      $('stepChips').innerHTML = chips(focus);
      Array.prototype.forEach.call(dots.children, function (el, k) { if (k === step) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current'); });
      $('prev').disabled = step === 0; $('next').textContent = step === STEPS.length - 1 ? 'Сначала ↺' : 'Далее →';
      if (zone) zone.visible = !!s.zone;
      setCut(s.cut); setHighlight(focus); applyFlows(s.flows || []); card.hidden = true;
      makePins((s.pins || focus).filter(Boolean), true);
      planFocus(focus, s.flows || []);
      if (s.frame) flyTo(s.frame.filter(Boolean), s.dir, s.pad, instant); else factoryView(focus, instant);
    }
    var ALL = [[M.miner, hub, 'ore'], [hub, M.purifier, 'ore'], [M.purifier, M.crusher, 'ore', .8], [M.crusher, M.enricher, 'ore'], [M.enricher, M.smelter, 'ore'], [M.smelter, ingots, 'ore']];
    var curFlows = [];
    function applyFlows(list) { if (list) curFlows = list; setFlows(curFlows); }
    $('prev').addEventListener('click', function () { go(step - 1); });
    $('next').addEventListener('click', function () { go(step === STEPS.length - 1 ? 0 : step + 1); });
    function select(t) {
      if (t.floor > cut) setCut(t.floor >= 66 ? 104 : t.floor >= 59 ? 62 : 57);
      if (mode === 'list') { setHighlight([t]); planFocus([t], []); }
      openCard(t); flyTo([t], FDIR, t.members ? 1 : 1.8);
    }
    $('stepChips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip'); if (b) select(things[+b.dataset.i]);
    });
    document.addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) return;
      if (e.key === 'Escape' && !card.hidden) { closeCard(); return; }
      if (mode !== 'tour') { if (hooks.keys && hooks.keys[mode]) hooks.keys[mode](e); return; }
      if (e.key === 'ArrowRight') { go(step === STEPS.length - 1 ? 0 : step + 1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft' && step > 0) { go(step - 1); e.preventDefault(); }
    });

    // ------------------------------------------------ list of everything
    var html = '';
    ORDER.forEach(function (role) {
      var l = top.filter(function (t) { return t.role === role; });
      if (!l.length) return;
      html += '<div class="mgroup"><h3>' + ROLE[role][0] + '</h3>' + l.map(function (t) {
        var small = t.up ? t.up[0] + ' / ' + t.up[1] : t.kind === 'store' ? t.count + ' ' + plural(t.count, 'сундук', 'сундука', 'сундуков') : '';
        return '<button class="mrow" type="button" data-i="' + t.i + '">' + badge(t) + '<span>' + esc(t.name) + '</span><small>' + small + '</small></button>';
      }).join('') + '</div>';
    });
    $('mlist').innerHTML = html + '<p class="hint">Цифры справа у машин: ускорители / энергоулучшения.</p>';
    $('mlist').addEventListener('click', function (e) {
      var b = e.target.closest('.mrow'); if (b) select(things[+b.dataset.i]);
    });
    var freePins = top.filter(function (t) { return KEY[t.kind] || (t.kind === 'store' && t.name !== 'Сундуки') || t.members; });
    var extraModes = {};
    function setMode(m) {
      var prev = mode; mode = m;
      if (prev !== m && extraModes[prev] && extraModes[prev].leave) extraModes[prev].leave();
      Array.prototype.forEach.call(document.querySelectorAll('.tabs [data-mode]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-mode') === m)); });
      Array.prototype.forEach.call(document.querySelectorAll('.guide .pane[data-mode]'), function (p) { p.hidden = p.getAttribute('data-mode') !== m; });
      card.hidden = true;
      if (m === 'tour') { go(step); return; }
      if (zone) zone.visible = false;
      if (extraModes[m]) { extraModes[m].enter(); return; }
      setHighlight([]); makePins(freePins, false); applyFlows(ALL); planFocus([], []);
      if (cut > 62) setCut(57);
      factoryView([]);
    }
    Array.prototype.forEach.call(document.querySelectorAll('.tabs [data-mode]'), function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });

    // ------------------------------------------------ plan: the factory floor from above, north up, numbered like the pins
    var planEl = $('plan'), planSvg = $('planSvg'), planPos = {}, U = 10, planFrame = null;
    function r1(v) { return Math.round(v * 10) / 10; }
    (function buildPlan() {
      var items = top.filter(function (t) { return t.n && t.floor <= 56 && t.kind !== 'solar'; });
      if (!items.length) { planEl.hidden = true; return; }
      var x0 = 1e9, z0 = 1e9, x1 = -1e9, z1 = -1e9;
      items.forEach(function (t) { t.boxes.forEach(function (q) { x0 = Math.min(x0, q.x); z0 = Math.min(z0, q.z); x1 = Math.max(x1, q.x + q.sx); z1 = Math.max(z1, q.z + q.sz); }); });
      x0 -= 1; z0 -= 1; x1 += 1; z1 += 1;
      var out = [], floor = {}, net = {}, NET = {};
      ['#5fb88d', '#43d6a3', '#d2483f', '#4f7fe0', '#7cb8ec', '#8a90e6'].forEach(function (c) { var k = D.colours.indexOf(c); if (k >= 0) NET[k] = c; });
      ['solid', 'rock', 'clear'].forEach(function (g) {
        var a = D.groups[g] || [];
        for (var i = 0; i < a.length; i += 6) {
          var x = a[i] + OX, y = a[i + 1] + OY, z = a[i + 2] + OZ;
          if (x < x0 || x >= x1 || z < z0 || z >= z1 || y < 52 || y > 56) continue;
          if (y === 52 && a[i + 4] === 0 && !floor[x + ',' + z]) floor[x + ',' + z] = g === 'rock' ? 2 : 1;
          if (NET[a[i + 3]] !== undefined) net[x + ',' + z + ',' + NET[a[i + 3]]] = 1;
        }
      });
      var occ = {};
      items.forEach(function (t) {
        t.boxes.forEach(function (q) {
          for (var x = q.x; x < q.x + q.sx; x++) for (var z = q.z; z < q.z + q.sz; z++) {
            (occ[x + ',' + z] = occ[x + ',' + z] || []).push(t);
            if (!floor[x + ',' + z]) floor[x + ',' + z] = 1;
          }
        });
      });
      Object.keys(floor).forEach(function (k) {
        var c = k.split(','), x = +c[0], z = +c[1];
        out.push('<rect class="pl-floor' + (floor[k] === 2 ? ' rock' : '') + '" x="' + (x - x0) * U + '" y="' + (z - z0) * U + '" width="' + U + '" height="' + U + '"/>');
      });
      Object.keys(net).forEach(function (k) {
        var c = k.split(',');
        out.push('<circle class="pl-net" cx="' + ((+c[0] - x0) * U + U / 2) + '" cy="' + ((+c[1] - z0) * U + U / 2) + '" r="1.5" fill="' + c[2] + '"/>');
      });
      items.forEach(function (t) {
        var g = '<g class="pl-item" data-i="' + t.i + '" tabindex="0" role="button" aria-label="' + esc(t.n + '. ' + t.name) + '"><title>' + esc(t.n + '. ' + t.name) + '</title>', spots = [];
        t.boxes.forEach(function (q) {
          if (q.sx > 1 || q.sz > 1) {
            var bx = 'x="' + ((q.x - x0) * U + .8) + '" y="' + ((q.z - z0) * U + .8) + '" width="' + (q.sx * U - 1.6) + '" height="' + (q.sz * U - 1.6) + '" rx="2.5"';
            g += '<rect class="pl-back" ' + bx + '/><rect class="pc" ' + bx + ' fill="' + t.color + '"/>';
            spots.push([(q.x - x0 + q.sx / 2) * U, (q.z - z0 + q.sz / 2) * U, 1]);
            return;
          }
          var l = occ[q.x + ',' + q.z], k = l.indexOf(t), w = U / l.length;
          var sx = 'x="' + r1((q.x - x0) * U + k * w + .7) + '" y="' + ((q.z - z0) * U + .7) + '" width="' + r1(w - 1.4) + '" height="' + (U - 1.4) + '" rx="1.6"';
          g += '<rect class="pl-back" ' + sx + '/><rect class="pc' + (t.kind === 'store' ? ' chest' : '') + '" ' + sx + ' fill="' + t.color + '"/>';
          spots.push([(q.x - x0) * U + k * w + w / 2, (q.z - z0) * U + U / 2, l.length > 1 ? 2 : 0]);
        });
        var cx = spots.reduce(function (a, p) { return a + p[0]; }, 0) / spots.length, cz = spots.reduce(function (a, p) { return a + p[1]; }, 0) / spots.length;
        var best = spots.slice().sort(function (a, b) { return (a[0] - cx) * (a[0] - cx) + (a[1] - cz) * (a[1] - cz) - (b[0] - cx) * (b[0] - cx) - (b[1] - cz) * (b[1] - cz); })[0];
        planPos[t.i] = [best[0], best[1]];
        g += '<text x="' + r1(best[0]) + '" y="' + r1(best[1]) + '"' + (best[2] === 1 ? ' class="big"' : best[2] === 2 ? ' class="small"' : '') + '>' + t.n + '</text></g>';
        out.push(g);
      });
      var Wp = (x1 - x0) * U, Hp = (z1 - z0) * U;
      planFrame = { x0: x0, z0: z0, w: Wp, h: Hp };
      out.push('<g class="pl-north" transform="translate(' + (Wp - 6) + ' 7)"><path d="M0 -5.5 3 2 0 .6 -3 2Z"/><text y="8.5">С</text></g>');
      var defs = '<defs>' + Object.keys(FLOW).map(function (k) {
        return '<marker id="pa-' + k + '" viewBox="0 0 6 6" refX="4.5" refY="3" markerWidth="3.6" markerHeight="3.6" orient="auto"><path d="M0 0 6 3 0 6Z" fill="' + FLOW[k] + '"/></marker>';
      }).join('') + '</defs>';
      planSvg.setAttribute('viewBox', '-1 -1 ' + (Wp + 2) + ' ' + (Hp + 2));
      planSvg.innerHTML = defs + out.join('') + '<g id="planGhosts"></g><g id="planFlows"></g>';
      $('planKey').innerHTML = top.filter(function (t) { return t.n; }).sort(function (a, b) { return a.n - b.n; }).map(function (t) {
        return '<li><button class="pk" type="button" data-i="' + t.i + '">' + badge(t) + '<span>' + esc(t.name) + '</span>' + (t.floor > 56 ? '<small>над цехом</small>' : '') + '</button></li>';
      }).join('');
    })();
    function planFocus(list, flows) {
      if (planEl.hidden) return;
      var on = {};
      list.forEach(function (t) { if (t) { on[t.i] = 1; (t.members || []).forEach(function (m) { on[m.i] = 1; }); } });
      planEl.classList.toggle('focusing', Object.keys(on).some(function (i) { return planPos[i]; }));
      Array.prototype.forEach.call(planSvg.querySelectorAll('.pl-item'), function (g) { g.classList.toggle('on', !!on[g.getAttribute('data-i')]); });
      Array.prototype.forEach.call($('planKey').querySelectorAll('.pk'), function (b) { b.classList.toggle('on', !!on[b.getAttribute('data-i')]); });
      var html = '';
      flows.forEach(function (f) {
        var a = f[0] && planPos[f[0].i], b = f[1] && planPos[f[1].i];
        if (!a || !b || f[0] === f[1]) return;
        var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy);
        if (len < 4) return;
        var ux = dx / len, uy = dy / len, ax = a[0] + ux * 4, ay = a[1] + uy * 4, bx = b[0] - ux * 5, by = b[1] - uy * 5;
        var bend = Math.min(9, len * .22) * (f[3] ? -1 : 1), mx = (ax + bx) / 2 - uy * bend, my = (ay + by) / 2 + ux * bend;
        html += '<path class="pl-flow" d="M' + r1(ax) + ' ' + r1(ay) + 'Q' + r1(mx) + ' ' + r1(my) + ' ' + r1(bx) + ' ' + r1(by) + '" stroke="' + FLOW[f[2]] + '" marker-end="url(#pa-' + f[2] + ')"/>';
      });
      var fl = $('planFlows'); if (fl) fl.innerHTML = html;
    }
    // planned items on the plan: dashed outlines with their letters; the view grows to fit them
    function planGhosts(list) {
      var g = $('planGhosts'); if (!g || !planFrame) return;
      var f = planFrame, mx = 0, mz = 0, Mx = f.w, Mz = f.h, html = '';
      list.forEach(function (t) {
        var sx = 0, sz = 0;
        t.boxes.forEach(function (q) {
          var x = (q.x - f.x0) * U, y = (q.z - f.z0) * U, w = q.sx * U, h = q.sz * U;
          mx = Math.min(mx, x - U); mz = Math.min(mz, y - U); Mx = Math.max(Mx, x + w + U); Mz = Math.max(Mz, y + h + U);
          html += '<rect class="pl-ghost' + (t.remove ? ' rm' : '') + (t.thin ? ' thin' : '') + '" data-i="' + t.i + '" x="' + r1(x + .9) + '" y="' + r1(y + .9) + '" width="' + r1(w - 1.8) + '" height="' + r1(h - 1.8) + '" rx="1.6" style="stroke:' + t.color + '"/>';
          sx += x + w / 2; sz += y + h / 2;
        });
        var c = [sx / t.boxes.length, sz / t.boxes.length];
        if (!t.thin) planPos[t.i] = c;
        if (t.badge && !t.thin) html += '<text class="pl-gtext" x="' + r1(c[0]) + '" y="' + r1(c[1]) + '" style="fill:' + t.color + '">' + esc(t.badge) + '</text>';
      });
      planSvg.setAttribute('viewBox', (mx - 1) + ' ' + (mz - 1) + ' ' + (Mx - mx + 2) + ' ' + (Mz - mz + 2));
      g.innerHTML = html;
    }
    function planPick(e) {
      var g = e.target.closest && e.target.closest('[data-i]');
      if (g) select(things[+g.getAttribute('data-i')]);
    }
    planSvg.addEventListener('click', planPick);
    planSvg.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { planPick(e); e.preventDefault(); } });
    $('planKey').addEventListener('click', planPick);
    $('planKey').addEventListener('mouseover', function (e) {
      var b = e.target.closest('.pk'), i = b ? b.getAttribute('data-i') : null;
      Array.prototype.forEach.call(planSvg.querySelectorAll('.pl-item'), function (g) { g.classList.toggle('hover', g.getAttribute('data-i') === i); });
    });
    $('planKey').addEventListener('mouseleave', function () {
      Array.prototype.forEach.call(planSvg.querySelectorAll('.pl-item.hover'), function (g) { g.classList.remove('hover'); });
    });

    // ------------------------------------------------ size, compass and the render loop
    var needle = $('needle');
    function resize() {
      var rc = viewer.getBoundingClientRect(); W = Math.max(1, rc.width); H = Math.max(1, rc.height);
      gl.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); dirty = true;
    }
    if (window.ResizeObserver) new ResizeObserver(resize).observe(viewer); else window.addEventListener('resize', resize);
    resize();
    camera.position.set(60, 55, 80); controls.target.set(0, -2, 0);
    go(0, true);
    if (window.ZAVOD_PLUGIN) window.ZAVOD_PLUGIN({
      THREE: THREE, D: D, scene: scene, camera: camera, controls: controls, things: things, top: top, M: M, S: S, CY: CY,
      FLOW: FLOW, FLOWNAME: FLOWNAME, ROLE: ROLE, FDIR: FDIR, box: box, edgeGeo: edgeGeo, hooks: hooks,
      esc: esc, plural: plural, fmt: fmt, badge: badge,
      add: function (t) { var r = finish(t); addHits(r); return r; }, drop: dropThing,
      setCut: setCut, getCut: function () { return cut; }, setHighlight: setHighlight, applyFlows: applyFlows, makePins: makePins,
      flyTo: flyTo, factoryView: factoryView, openCard: openCard, closeCard: function () { card.hidden = true; }, select: select,
      planFocus: planFocus, planGhosts: planGhosts, registerMode: function (m, h) { extraModes[m] = h; }, setMode: setMode,
      getMode: function () { return mode; }, redraw: function () { dirty = true; }
    });
    if (/debug/.test(location.hash)) window.__z = { camera: camera, controls: controls, things: things, go: go, flyTo: flyTo, setCut: setCut, steps: STEPS, redraw: function () { dirty = true; } };
    var last = 0;
    function loop(now) {
      requestAnimationFrame(loop);
      var moving = false;
      if (anim) {
        var k = Math.min(1, (now - anim.t0) / anim.dur), e = ease(k);
        camera.position.lerpVectors(anim.p0, anim.p1, e); controls.target.lerpVectors(anim.q0, anim.q1, e);
        if (k >= 1) anim = null;
        moving = true;
      }
      if (controls.update()) moving = true;
      var animating = !reduce && (streams.length > 0 || highlighted.length > 0);
      if (!moving && !dirty && !(animating && now - last > 33)) return;
      lastTime = now / 1000;
      if (animating) { animateFlows(lastTime); pulse(lastTime); }
      gl.render(scene, camera);
      placePins();
      needle.style.transform = 'rotate(' + controls.getAzimuthalAngle() + 'rad)';
      dirty = false; last = now;
      if (load) { load.remove(); load = null; }
    }
    requestAnimationFrame(loop);
  }
})();
