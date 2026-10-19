// «Газрын зураг» хэсгийн харагч: сэдвийн газрын зургийг бүтэн дэлгэцээр нээнэ (Leaflet, интернэт хэрэгтэй).
// Хоёр горим: «Заах» (цэг, шугам, нутгийг нэг нэгээр гаргаж тайлбарлах), «Олох тоглоом» (сурагч газрын зураг дээр дарж олно).
(function () {
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const md = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/==(.+?)==/g, '<mark>$1</mark>');
  const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
  const PLACES = [ESRI + 'Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18 }];

  // Суурь зургууд: нэг суурь хэд хэдэн давхаргаас бүрдэж болно (жишээ нь сансрын зураг + хил, нэр).
  const BASES = {
    sat: { icon: '🛰️', name: 'Сансрын зураг', layers: [
      [ESRI + 'World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 18, attribution: 'Tiles © Esri, Maxar, Earthstar Geographics' }], PLACES] },
    physical: { icon: '⛰️', name: 'Физик газарзүйн', layers: [
      [ESRI + 'World_Physical_Map/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 8, attribution: 'Tiles © Esri, US National Park Service' }], PLACES] },
    topo: { icon: '🗺️', name: 'Байрзүйн', layers: [
      ['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { subdomains: 'abc', maxNativeZoom: 17, attribution: '© OpenStreetMap, SRTM · © OpenTopoMap (CC-BY-SA)' }]] },
    // Засаг захиргааны: OSM (HOT) — улс, аймаг, сумын хил, төв, монгол нэрээр. Esri, CARTO-д аймгийн хил гардаггүй.
    admin: { icon: '🏛️', name: 'Засаг захиргааны', layers: [
      ['https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', { subdomains: 'abc', maxNativeZoom: 19, attribution: '© OpenStreetMap contributors · HOT, OSM France' }]] }
  };
  const ORDER = ['sat', 'physical', 'topo', 'admin'];
  const COLORS = ['#ffd43b', '#ff8c61', '#4dabf7', '#51cf66', '#cc5de8', '#ff6b6b', '#2dd4bf', '#f783ac'];

  let leafP = null;
  const leaflet = () => leafP || (leafP = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    s.onload = () => res(window.L); s.onerror = () => { leafP = null; rej(new Error('Газрын зураг ачаалагдсангүй. Интернэтээ шалгана уу.')); };
    document.head.appendChild(s);
  }));

  // 3D загвар (MapLibre GL): сонгосон суурь зургийг өндөржилтийн өгөгдөл (AWS Terrain Tiles, түлхүүргүй) дээр нөмрүүлнэ.
  // Хулгана: чирэх — хөдөлгөх, дугуй — томруулах/жижигрүүлэх, баруун товч (эсвэл Ctrl) + чирэх — эргүүлэх, хазайлгах.
  const ML = 'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/5.6.0/';
  const DEM = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
  const EXAG = [1.5, 2.5, 4, 1];
  let mlP = null;
  const maplibre = () => mlP || (mlP = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = ML + 'maplibre-gl.css'; document.head.appendChild(css);
    const s = document.createElement('script'); s.src = ML + 'maplibre-gl.js';
    s.onload = () => res(window.maplibregl); s.onerror = () => { mlP = null; rej(new Error('3D загвар ачаалагдсангүй. Интернэтээ шалгана уу.')); };
    document.head.appendChild(s);
  }));
  const tilesOf = ([u, o]) => (u.includes('{s}') ? (o.subdomains || 'abc').split('').map(s => u.replace('{s}', s)) : [u]);
  const ll = p => [p[1], p[0]];
  const bbox = pts => pts.reduce((b, p) => [[Math.min(b[0][0], p[0]), Math.min(b[0][1], p[1])], [Math.max(b[1][0], p[0]), Math.max(b[1][1], p[1])]], [[180, 90], [-180, -90]]);
  const mid = pts => [pts.reduce((s, p) => s + p[0], 0) / pts.length, pts.reduce((s, p) => s + p[1], 0) / pts.length];

  let st = null; // {map, Lf, m, host, lay, base, mode, qi, marks, d3}

  function destroy() { if (st && st.ro) st.ro.disconnect(); if (st && st.d3) { st.d3.spin = false; if (st.d3.map) st.d3.map.remove(); } if (st && st.map) { st.map.remove(); } st = null; }

  function setBase(k) {
    st.base = BASES[k] ? k : k === 'econ' ? 'admin' : 'physical'; // econ: хуучин нэр
    st.host.querySelectorAll('.mv-sw button[data-b]').forEach(b => b.classList.toggle('on', b.dataset.b === st.base));
    if (st.d3 && st.d3.ready) d3Base();
    const { map, Lf } = st; if (!map) return;
    if (st.baseLayers) st.baseLayers.forEach(l => map.removeLayer(l));
    st.baseLayers = BASES[st.base].layers.map(([u, o]) => Lf.tileLayer(u, Object.assign({ maxZoom: 18 }, o)).addTo(map));
  }

  const pin = (n, color) => st.Lf.divIcon({ className: 'mv-pin', html: `<span style="--mc:${color}">${n}</span>`, iconSize: [34, 34], iconAnchor: [17, 17] });
  function home() {
    st.map.invalidateSize(); const v = st.m.view || {}; if (v.bounds) st.map.fitBounds(v.bounds, { padding: [10, 10] }); else st.map.setView(v.center || [46.8, 103], v.zoom || 4);
    if (st.d3 && st.d3.ready) d3Home();
  }

  /* ---------- 3D загвар ---------- */
  function d3Base() {
    const d = st.d3, map = d.map;
    d.baseIds.forEach(id => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); });
    d.baseIds = BASES[st.base].layers.map((l, k) => {
      const id = `b${k}-${st.base}`;
      map.addSource(id, { type: 'raster', tiles: tilesOf(l), tileSize: 256, maxzoom: l[1].maxNativeZoom || 18, attribution: l[1].attribution || '' });
      map.addLayer({ id, type: 'raster', source: id }, 'it-fill');
      return id;
    });
  }
  // Заах горимд гаргасан цэг, шугам, нутгийг 3D дээр давтан зурна.
  function d3Sync() {
    const d = st.d3; if (!d || !d.ready) return;
    const feats = [];
    d.marks.forEach(x => x.remove()); d.marks = [];
    st.m.items.forEach((it, i) => {
      if (!st.lay[i]) return;
      const c = it.color || COLORS[i % COLORS.length], label = esc(it.label || it.title);
      if (it.at) { d.marks.push(d.mk(ll(it.at), `<span class="p" style="--mc:${c}">${i + 1}</span><em>${label}</em>`, 'left', [-17, 0])); return; }
      const pts = (it.line || it.area).map(ll);
      feats.push({ type: 'Feature', properties: { c, dash: it.dash ? 1 : 0, area: it.area ? 1 : 0 }, geometry: it.line ? { type: 'LineString', coordinates: pts } : { type: 'Polygon', coordinates: [pts.concat([pts[0]])] } });
      d.marks.push(d.mk(it.labelAt ? ll(it.labelAt) : it.line ? mid([pts[0], pts[pts.length - 1]]) : mid(pts), `<em>${label}</em>`, 'center', [0, 0]));
    });
    d.map.getSource('items').setData({ type: 'FeatureCollection', features: feats });
  }
  function d3Fly(it) {
    const map = st.d3.map;
    if (it.at) map.flyTo({ center: ll(it.at), zoom: Math.max(map.getZoom(), (it.zoom || st.m.focusZoom || 6) - 1), pitch: 60, duration: 1500 });
    else map.fitBounds(bbox((it.line || it.area).map(ll)), { padding: 80, maxZoom: (it.zoom || 8) - 1, pitch: 55, duration: 1500 });
  }
  function d3Home() {
    const map = st.d3.map, v = st.m.view || {};
    if (v.bounds) map.fitBounds(bbox(v.bounds.map(ll)), { padding: 30, pitch: 55, bearing: -15, duration: 1500 });
    else map.flyTo({ center: ll(v.center || [46.8, 103]), zoom: (v.zoom || 4) - 1, pitch: 55, bearing: -15, duration: 1500 });
  }
  function spinLoop(d) { if (!d.spin || !st || st.d3 !== d) return; d.map.setBearing(d.map.getBearing() + 0.2); requestAnimationFrame(() => spinLoop(d)); }
  function d3Act(a, b) {
    const d = st.d3; if (!d || !d.ready) return;
    if (a === 'spin') { d.spin = !d.spin; b.classList.toggle('on', d.spin); spinLoop(d); }
    else if (a === 'exag') { d.ex = (d.ex + 1) % EXAG.length; d.map.setTerrain({ source: 'dem', exaggeration: EXAG[d.ex] }); b.textContent = '⛰ Өндөр ×' + String(EXAG[d.ex]).replace('.', ','); }
    else if (a === 'globe') d.map.flyTo({ center: [100, 40], zoom: 1.4, pitch: 0, bearing: 0, duration: 2500 });
    else if (a === 'home') d3Home();
  }
  function off3d() {
    const d = st.d3; if (!d) return;
    d.spin = false; if (d.map) d.map.remove(); st.d3 = null;
    const box = st.host.querySelector('.mv-3d'); box.hidden = true; box.innerHTML = '';
    st.host.querySelector('[data-d3]').classList.remove('on');
    if (st.map) st.map.invalidateSize();
  }
  function toggle3d() {
    if (st.d3) return off3d();
    if (st.mode === 'quiz') setMode('teach');
    const box = st.host.querySelector('.mv-3d');
    box.hidden = false; st.host.querySelector('[data-d3]').classList.add('on');
    box.innerHTML = `<div class="mv3-map"></div>
      <div class="mv3-bar"><button data-d3a="spin">↻ Эргүүлэх</button><button data-d3a="exag">⛰ Өндөр ×1,5</button><button data-d3a="globe">🌍 Дэлхий</button><button data-d3a="home" title="Эхний харагдац">⌂</button></div>
      <div class="mv3-hint">🖱 Чирэх — хөдөлгөх · Дугуй — томруулах · Баруун товч + чирэх — эргүүлэх, хазайлгах</div>`;
    const d = st.d3 = { baseIds: [], marks: [], ex: 0, spin: false, ready: false };
    maplibre().then(ml => {
      if (!st || st.d3 !== d) return;
      const c = st.map ? st.map.getCenter() : { lat: 46.8, lng: 103 }, z = st.map ? st.map.getZoom() - 1 : 3;
      try {
        d.map = new ml.Map({
          container: box.querySelector('.mv3-map'), center: [c.lng, c.lat], zoom: z, pitch: 0, maxPitch: 80, attributionControl: { compact: true },
          style: {
            version: 8, projection: { type: 'globe' },
            sources: { dem: { type: 'raster-dem', tiles: [DEM], encoding: 'terrarium', tileSize: 256, maxzoom: 14, attribution: 'Өндөр: AWS Terrain Tiles' } },
            layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0b1030' } }],
            terrain: { source: 'dem', exaggeration: EXAG[0] },
            sky: { 'sky-color': '#0a1633', 'horizon-color': '#7fa7d9', 'sky-horizon-blend': 0.5, 'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 1, 8, 0] }
          }
        });
      } catch (e) { box.innerHTML = '<div class="mv-err">🌐 Энэ компьютер 3D (WebGL) дэмжихгүй байна.</div>'; return; }
      d.mk = (lnglat, html, anchor, offset) => { const el = document.createElement('div'); el.className = 'mv3-pin'; el.innerHTML = html; return new ml.Marker({ element: el, anchor, offset }).setLngLat(lnglat).addTo(d.map); };
      d.map.addControl(new ml.NavigationControl({ visualizePitch: true }), 'top-left');
      d.map.on('load', () => {
        if (!st || st.d3 !== d) return;
        const map = d.map;
        map.addSource('items', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'it-fill', type: 'fill', source: 'items', filter: ['==', ['get', 'area'], 1], paint: { 'fill-color': ['get', 'c'], 'fill-opacity': 0.25 } });
        map.addLayer({ id: 'it-line', type: 'line', source: 'items', filter: ['==', ['get', 'dash'], 0], paint: { 'line-color': ['get', 'c'], 'line-width': 4 } });
        map.addLayer({ id: 'it-dash', type: 'line', source: 'items', filter: ['==', ['get', 'dash'], 1], paint: { 'line-color': ['get', 'c'], 'line-width': 4, 'line-dasharray': [2, 1.5] } });
        d.ready = true; d3Base(); d3Sync();
        map.easeTo({ pitch: 60, bearing: -15, duration: 2000 });
      });
      // Хэрэглэгч хулгана, хуруугаар хөдөлгөвөл автомат эргэлт зогсоно.
      ['mousedown', 'touchstart', 'wheel'].forEach(ev => d.map.getCanvasContainer().addEventListener(ev, () => { if (d.spin) { d.spin = false; const sb = box.querySelector('[data-d3a=spin]'); if (sb) sb.classList.remove('on'); } }, { passive: true }));
    }).catch(e => { if (st && st.d3 === d) box.innerHTML = `<div class="mv-err">🌐 ${esc(e.message)}</div>`; });
  }

  /* ---------- Заах горим ---------- */
  function showItem(i, fly) {
    const { map, Lf, m, host } = st, it = m.items[i]; if (!it) return;
    if (!st.lay[i]) {
      const c = it.color || COLORS[i % COLORS.length];
      let g = null;
      if (it.at) g = Lf.marker(it.at, { icon: pin(i + 1, c) });
      else if (it.line) g = Lf.polyline(it.line, { color: c, weight: 4, dashArray: it.dash ? '10 8' : null });
      else if (it.area) g = Lf.polygon(it.area, { color: c, weight: 2, fillOpacity: .22 });
      if (!g) return;
      const dir = it.dir || (it.at ? 'right' : 'center');
      g.bindTooltip(esc(it.label || it.title), { permanent: true, direction: dir, className: 'mv-tip', offset: it.at ? [dir === 'left' ? -14 : 14, 0] : [0, 0] });
      g.on('click', () => showItem(i, true));
      g.addTo(map); st.lay[i] = g;
      if (it.labelAt && !it.at) g.openTooltip(it.labelAt);
    }
    host.querySelectorAll('.mv-list button').forEach((b, k) => { b.classList.toggle('on', k === i); if (st.lay[k]) b.classList.add('seen'); });
    host.querySelector('.mv-info').innerHTML = `<h3>${i + 1}. ${esc(it.title)}</h3><div>${md(it.text || '')}</div>`;
    if (fly) {
      if (it.at) map.flyTo(it.at, Math.max(map.getZoom(), it.zoom || m.focusZoom || 6), { duration: .8 });
      else map.flyToBounds(st.lay[i].getBounds(), { padding: [40, 40], duration: .8, maxZoom: it.zoom || 8 });
    }
    if (st.d3 && st.d3.ready) { d3Sync(); if (fly) d3Fly(it); }
  }
  function teachSide() {
    const m = st.m;
    return `${m.desc ? `<p class="mv-desc">${md(m.desc)}</p>` : ''}
      <div class="mv-list">${m.items.map((it, i) => `<button data-i="${i}"><b>${i + 1}</b>${esc(it.title)}</button>`).join('')}</div>
      <div class="mv-info"><p class="muted">«Дараагийнх» эсвэл жагсаалтаас сонгоход газрын зураг дээр гарна.</p></div>
      <div class="mv-row"><button class="btn primary" data-mv="next">Дараагийнх ▶</button><button class="btn" data-mv="all">Бүгд</button><button class="btn" data-mv="home" title="Эхний харагдац">⌂</button></div>`;
  }

  /* ---------- Олох тоглоом ---------- */
  function quizView() {
    const { m, host } = st, q = m.quiz[st.qi], tol = q.tol || 150;
    st.marks.forEach(x => x.remove()); st.marks = [];
    host.querySelector('.mv-side').innerHTML = `<p class="mv-count">ДААЛГАВАР ${st.qi + 1} / ${m.quiz.length}</p><p class="mv-q">${md(q.q)}</p>
      <p class="muted">👆 Газрын зураг дээр дарж заана. ${tol} км-ийн дотор бол зөв.</p><div class="mv-res"></div>
      <div class="mv-row"><button class="btn primary" data-mv="qnext">Дараагийнх ▶</button><button class="btn" data-mv="qprev">◀ Өмнөх</button><button class="btn" data-mv="qagain">↺ Дахин</button></div>`;
    home();
  }
  function guess(e) {
    if (st.mode !== 'quiz' || st.marks.length) return;
    const { map, Lf } = st, q = st.m.quiz[st.qi], tol = q.tol || 150, d = map.distance(e.latlng, q.at) / 1000, ok = d <= tol;
    st.marks.push(Lf.marker(e.latlng, { icon: pin('?', ok ? '#3ddc97' : '#ff6b6b') }).addTo(map));
    st.marks.push(Lf.marker(q.at, { icon: pin('✓', '#ffd43b') }).bindTooltip(esc(q.label || 'Зөв байршил'), { permanent: true, direction: 'right', className: 'mv-tip', offset: [14, 0] }).addTo(map));
    st.marks.push(Lf.polyline([e.latlng, q.at], { color: ok ? '#3ddc97' : '#ff6b6b', dashArray: '6 6', weight: 3 }).addTo(map));
    st.host.querySelector('.mv-res').innerHTML = `<div class="mv-fb ${ok ? 'ok' : 'no'}">${ok ? '✔ Зөв!' : '✘ Холдсон.'} Зөрүү ≈ <b>${Math.round(d)} км</b>.${q.e ? ' ' + md(q.e) : ''}</div>`;
  }

  function setMode(mode) {
    st.mode = mode;
    st.host.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', b.dataset.mode === mode));
    if (mode === 'quiz') {
      if (st.d3) off3d(); // тоглоомд газрын зураг дээр дарж хариулдаг тул 2D-д буцна
      st.lay.forEach(l => l && l.remove()); st.lay = [];
      st.qi = 0; quizView();
    } else {
      st.marks.forEach(x => x.remove()); st.marks = [];
      st.host.querySelector('.mv-side').innerHTML = teachSide();
      home();
    }
  }

  function onClick(e) {
    const b = e.target.closest('button'); if (!b || !st) return;
    if (b.dataset.d3 != null) return toggle3d();
    if (b.dataset.d3a) return d3Act(b.dataset.d3a, b);
    if (b.dataset.b) return setBase(b.dataset.b);
    if (b.dataset.mode) return setMode(b.dataset.mode);
    const a = b.dataset.mv, m = st.m;
    if (b.dataset.i != null && b.closest('.mv-list')) return showItem(+b.dataset.i, true);
    if (a === 'next') { const i = m.items.findIndex((_, k) => !st.lay[k]); showItem(i < 0 ? 0 : i, true); }
    else if (a === 'all') {
      st.map.invalidateSize(); m.items.forEach((_, k) => showItem(k, false)); const ls = st.lay.filter(Boolean); if (ls.length) st.map.fitBounds(st.Lf.featureGroup(ls).getBounds(), { padding: [80, 40] }); // хажуу тийш гарах бичээст зай
      if (st.d3 && st.d3.ready && ls.length) { const bb = st.Lf.featureGroup(ls).getBounds(); st.d3.map.fitBounds([[bb.getWest(), bb.getSouth()], [bb.getEast(), bb.getNorth()]], { padding: 60, pitch: 55, duration: 1500 }); }
    }
    else if (a === 'home') home();
    else if (a === 'qnext') { if (st.qi < m.quiz.length - 1) { st.qi++; quizView(); } }
    else if (a === 'qprev') { if (st.qi > 0) { st.qi--; quizView(); } }
    else if (a === 'qagain') quizView();
  }

  // host: #viewer элемент. App нь v-bar-ын «Хаах», «Бүтэн дэлгэц» товчийг өөрөө удирдана.
  function open(m, host) {
    destroy();
    host.innerHTML = `<div class="v-bar"><b>🗺️ ${esc(m.title)}</b><div>
        ${m.quiz && m.quiz.length ? '<button class="btn sm on" data-mode="teach">Заах</button><button class="btn sm" data-mode="quiz">Олох тоглоом</button>' : ''}
        <button class="btn sm" data-act="v-full">Бүтэн дэлгэц</button><button class="btn sm primary" data-act="v-close">Хаах</button></div></div>
      <div class="v-body mv"><div class="mv-map"><div class="mv-l"></div><div class="mv-3d" hidden></div><div class="mv-sw">${ORDER.map(k => `<button data-b="${k}">${BASES[k].icon} ${BASES[k].name}</button>`).join('')}<button class="mv-3dbtn" data-d3 title="Сонгосон зургийг 3 хэмжээсээр харуулна">🌐 3D загвар</button></div></div><aside class="mv-side"></aside></div>`;
    host.hidden = false; document.body.classList.add('noscroll');
    st = { m, host, lay: [], marks: [], mode: 'teach', qi: 0 };
    host.querySelector('.mv-side').innerHTML = teachSide();
    host.querySelector('.v-body').addEventListener('click', onClick);
    host.querySelector('.v-bar').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (b && st) setMode(b.dataset.mode); });
    const box = host.querySelector('.mv-l');
    leaflet().then(Lf => {
      if (!st || st.host !== host) return;
      st.Lf = Lf;
      st.map = Lf.map(box, { keyboard: false, zoomSnap: .25, worldCopyJump: true });
      setBase(m.base || 'physical');
      home();
      st.map.on('click', guess);
      // Цонхны хэмжээ өөрчлөгдвөл (бүтэн дэлгэц, утас эргүүлэх) газрын зургийг дахин тааруулна.
      if (window.ResizeObserver) { st.ro = new ResizeObserver(() => { if (!st) return; if (st.map) st.map.invalidateSize(); if (st.d3 && st.d3.map) st.d3.map.resize(); }); st.ro.observe(box); }
      setTimeout(() => st && st.map && st.map.invalidateSize(), 100);
    }).catch(e => { box.innerHTML = `<div class="mv-err">🗺️ ${esc(e.message)}</div>`; });
  }

  window.LIB_MAPVIEW = { open, destroy, BASES };
})();
