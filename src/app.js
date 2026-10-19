// Хичээлийн сан: нэвтрэх, хичээлийн сан (анги → бүлэг → сэдэв), хичээлийн хуудас, миний хуваарь, админ.
(function () {
  'use strict';
  const C = window.LIB_CLOUD;
  const CAT = window.LIB_CATALOG;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const S = { session: null, member: null, lessons: [], files: [], schedule: [], members: null, grade: 7, uploadBusy: false };
  try { const g = Number(localStorage.getItem('lib-grade')); if (CAT.some(x => x.grade === g)) S.grade = g; } catch (e) {}

  const KINDS = [
    { id: 'screen', name: 'Дэлгэцийн хичээл', hint: 'Ангид дэлгэцээр харуулах хичээл (HTML, PowerPoint, PDF)' },
    { id: 'handout', name: 'Тараах материал', hint: 'Дасгал, ажлын хуудас, сорил (Word, PDF, зураг)' },
    { id: 'plan', name: 'Хичээлийн төлөвлөгөө', hint: 'Арга зүй бүрээр тусдаа төлөвлөгөө' },
    { id: 'video', name: 'Кино', hint: 'Сэдвийн тайлбар, тойм кино (HTML, MP4)' }
  ];
  const isAdmin = () => !!S.member && S.member.status === 'approved' && ['admin', 'owner'].includes(S.member.role);
  const isOwner = () => !!S.member && S.member.role === 'owner';

  /* ---------- Туслах ---------- */
  const ICON = {
    screen: '<path d="M3 5h18v11H3z M8 20h8 M12 16v4"/>',
    handout: '<path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h7"/>',
    plan: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z M9 8h6 M9 12h6 M9 16h3"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z M4 19V5 M8 7h7"/>',
    cal: '<path d="M4 6h16v14H4z M4 10h16 M8 3v5 M16 3v5"/>',
    users: '<path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21c0-4 3-6 7-6s7 2 7 6 M17 11a3 3 0 1 0 0-6 M22 21c0-3-2-5-5-5.5"/>',
    game: '<path d="M7 8h10a5 5 0 0 1 4.6 6.9l-.5 1.2a2.6 2.6 0 0 1-4.3.7L15 15H9l-1.8 1.8a2.6 2.6 0 0 1-4.3-.7l-.5-1.2A5 5 0 0 1 7 8z M8 10.5v3 M6.5 12h3 M15.5 11h.01 M17.5 13h.01"/>',
    link: '<path d="M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6"/>',
    map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z M9 4v14 M15 6v14"/>',
    video: '<path d="M3 6h13v12H3z M16 10l5-3v10l-5-3z"/>'
  };
  const icon = (k, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k]}</svg>`;
  const ext = f => ((f.name || f.path || '').match(/\.([a-z0-9]{1,8})$/i) || ['', ''])[1].toLowerCase();
  const TYPE = { html: 'HTML', htm: 'HTML', pdf: 'PDF', doc: 'Word', docx: 'Word', ppt: 'PowerPoint', pptx: 'PowerPoint', xls: 'Excel', xlsx: 'Excel', png: 'Зураг', jpg: 'Зураг', jpeg: 'Зураг', gif: 'Зураг', webp: 'Зураг', svg: 'Зураг', txt: 'Текст', mp4: 'Видео' };
  const MIME = { html: 'text/html', htm: 'text/html', pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', txt: 'text/plain', mp4: 'video/mp4' };
  // Word (.docx) файлыг хөтөч дотор хуудас болгон харуулна (docx-preview номын сан, файл өөр газар илгээгдэхгүй).
  const isDocx = f => ext(f) === 'docx';
  const viewable = f => !!MIME[ext(f)] || isDocx(f);
  const scripts = {};
  const loadScript = src => scripts[src] || (scripts[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { delete scripts[src]; rej(new Error('Failed to fetch ' + src)); };
    document.head.appendChild(s);
  }));
  const loadDocx = () => loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js')
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/docx-preview@0.4.1/dist/docx-preview.min.js'));
  const size = n => (!n ? '0 КБ' : n >= 1048576 ? (n / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(n / 1024)) + ' КБ');
  const WD = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];
  const dayName = iso => { const d = new Date(iso + 'T00:00:00'); return `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${WD[d.getDay()]}`; };
  const today = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  const chapterOf = (grade, n) => ((CAT.find(g => g.grade === grade) || { chapters: [] }).chapters.find(c => c.n === n)) || null;
  const chapterLabel = (grade, ch) => { const c = chapterOf(grade, ch); return c ? `${c.n} бүлэг · ${c.title}` : ch; };
  const lessonByCode = (grade, code) => S.lessons.find(l => l.grade === grade && l.code === code);
  const filesOf = id => S.files.filter(f => f.lesson_id === id);
  // Сэдвийн «Газрын зураг» (src/maps.js): кодонд хадгалагдана, файл оруулах шаардлагагүй.
  const mapsOf = (grade, code) => ((window.LIB_MAPS || {})[grade + '/' + code]) || [];
  const toast = (msg, bad) => { const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => { t.className = 'toast'; }, 3500); };
  const errText = e => {
    const m = String((e && (e.message || e.error_description)) || e || '');
    if (/rate limit|too many/i.test(m)) return 'Хэт олон удаа оролдлоо. Хэдэн минут хүлээгээд дахин оролдоно уу.';
    if (/expired|invalid/i.test(m)) return 'Код буруу эсвэл хугацаа нь дууссан байна. Шинэ код аваарай.';
    if (/row-level|policy|permission|42501/i.test(m)) return 'Энэ үйлдлийг хийх эрх алга байна.';
    if (/payload too large|exceeded|maximum allowed size/i.test(m)) return 'Файл хэт том байна (50 МБ хүртэл).';
    if (m === 'offline-missing') return 'Энэ файлыг интернэтгүй хадгалаагүй байна. Интернэттэй үед нэг удаа нээгээрэй.';
    if (/failed to fetch|network/i.test(m)) return 'Интернэт холболтоо шалгаад дахин оролдоно уу.';
    return 'Алдаа гарлаа: ' + m.slice(0, 140);
  };

  /* ---------- Интернэтгүй ---------- */
  // Нээсэн (эсвэл «Хадгалах» дарсан) файлыг хөтчийн «lib-files» санд хадгална. Интернэт тасарвал жагсаалтыг
  // сүүлийн хуулбараас (localStorage), файлыг эндээс нээнэ. «Гарах» дарахад хоёуланг нь арилгана (олон хүний компьютер).
  const OFF = 'lib-files', SNAP = 'lib-snap', OFF_MAX = 30 * 1048576;
  S.saved = new Set();
  const offReq = id => new Request(location.origin + '/__offline/' + id);
  async function scanSaved() { try { const c = await caches.open(OFF); (await c.keys()).forEach(r => S.saved.add(r.url.split('/__offline/')[1])); } catch (e) {} }
  async function saveBlob(f, blob) {
    try { const c = await caches.open(OFF); await c.put(offReq(f.id), new Response(blob, { headers: { 'Content-Type': blob.type || 'application/octet-stream' } })); S.saved.add(f.id); } catch (e) {}
  }
  async function savedBlob(f) { try { const r = await (await caches.open(OFF)).match(offReq(f.id)); return r ? await r.blob() : null; } catch (e) { return null; } }
  async function getBlob(f) {
    const b = await savedBlob(f);
    if (b) return b;
    if (S.offlineMode || !C) throw new Error('offline-missing');
    const raw = await C.blob(f);
    if (raw.size <= OFF_MAX) saveBlob(f, raw);
    return raw;
  }
  const saveSnap = () => { try { localStorage.setItem(SNAP, JSON.stringify({ member: S.member, lessons: S.lessons, files: S.files, schedule: S.schedule, at: Date.now() })); } catch (e) {} };
  const readSnap = () => { try { const s = JSON.parse(localStorage.getItem(SNAP)); return s && s.member && s.lessons ? s : null; } catch (e) { return null; } };
  async function forgetOffline() { try { localStorage.removeItem(SNAP); await caches.delete(OFF); } catch (e) {} }
  // Олон файлыг интернэтгүй хадгална (товч дээр явц харуулна).
  async function saveMany(list, btn) {
    const todo = list.filter(f => !S.saved.has(f.id) && (f.size || 0) <= OFF_MAX);
    if (!todo.length) return toast('Бүгд аль хэдийн хадгалагдсан байна.');
    btn.disabled = true;
    let n = 0, bad = 0;
    for (const f of todo) {
      btn.textContent = `📥 Хадгалж байна… ${n + bad + 1}/${todo.length}`;
      try { await saveBlob(f, await C.blob(f)); n++; } catch (e) { bad++; }
    }
    toast(`${n} файл интернэтгүй хадгалагдлаа.${bad ? ` ${bad} файл алдаатай.` : ''}`, !!bad);
    route();
  }
  function offlineBoot(snap) {
    S.offlineMode = true;
    S.member = snap.member; S.lessons = snap.lessons || []; S.files = snap.files || []; S.schedule = snap.schedule || [];
    window.addEventListener('hashchange', route);
    window.addEventListener('online', () => toast('Интернэт холбогдлоо. Хуудсыг дахин ачаалбал бүрэн горимд орно.'));
    route();
  }

  /* ---------- Эхлэх ---------- */
  async function boot() {
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
    await scanSaved();
    const snap = readSnap();
    if (snap && (!C || navigator.onLine === false)) return offlineBoot(snap);
    if (!C) return screen(`<div class="card narrow center"><h1>Хичээлийн сан</h1><p class="muted">Supabase-ийн тохиргоо алга байна. README-д заасны дагуу config.public.json-ийг бөглөөд дахин build хийнэ үү.</p></div>`);
    try {
      S.session = await C.session();
      if (!S.session) return renderLogin();
      S.member = await C.member(S.session);
      if (S.member.status !== 'approved') return renderPending();
      await load();
      saveSnap();
      window.addEventListener('hashchange', route);
      route();
    } catch (e) {
      // Сүлжээ тасарсан бол сүүлийн хуулбараар интернэтгүй горимд орно.
      if (snap && /failed to fetch|network|load failed/i.test(String((e && e.message) || e))) return offlineBoot(snap);
      screen(`<div class="card narrow center"><h1>Хичээлийн сан</h1><p class="err">${esc(errText(e))}</p><button class="btn" onclick="location.reload()">Дахин оролдох</button> <button class="btn ghost" data-act="logout">Гарах</button></div>`);
    }
  }
  async function load() {
    [S.lessons, S.files, S.schedule] = await Promise.all([C.lessons(), C.files(), C.schedule()]);
  }
  function screen(html) { $('#app').innerHTML = `<main class="solo">${html}</main>`; }

  /* ---------- Нэвтрэх ---------- */
  let loginEmail = '';
  function renderLogin(step) {
    screen(`<div class="card narrow">
      <img class="brand-mark" src="logo.svg" alt="" width="36" height="60">
      <h1>Хичээлийн сан</h1>
      <p class="muted">Газар зүйн хичээл, тараах материал, хичээлийн төлөвлөгөө. Зөвхөн багш нарт.</p>
      ${step === 'code' ? `
        <p>Код <b>${esc(loginEmail)}</b> хаяг руу илгээгдлээ. Имэйлээ шалгаад кодоо оруулна уу.</p>
        <label class="lbl" for="lg-code">Нэвтрэх код</label>
        <input id="lg-code" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="123456">
        <button class="btn primary wide" data-act="verify">Нэвтрэх</button>
        <button class="btn ghost wide" data-act="relogin">Өөр имэйл ашиглах</button>` : `
        <label class="lbl" for="lg-email">Имэйл хаяг</label>
        <input id="lg-email" type="email" autocomplete="email" placeholder="bagsh@surguuli.mn" value="${esc(loginEmail)}">
        <button class="btn primary wide" data-act="send">Код авах</button>`}
      <p class="err" id="lg-err" hidden></p>
    </div>`);
    const i = $(step === 'code' ? '#lg-code' : '#lg-email');
    i.focus();
    i.addEventListener('keydown', e => { if (e.key === 'Enter') document.querySelector(step === 'code' ? '[data-act="verify"]' : '[data-act="send"]').click(); });
  }
  const lgErr = m => { const e = $('#lg-err'); e.textContent = m; e.hidden = !m; };
  async function sendCode(btn) {
    const email = $('#lg-email').value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return lgErr('Имэйл хаягаа зөв бичнэ үү.');
    btn.disabled = true; lgErr('');
    try { await C.sendCode(email); loginEmail = email; renderLogin('code'); } catch (e) { lgErr(errText(e)); btn.disabled = false; }
  }
  async function verify(btn) {
    const code = $('#lg-code').value.replace(/\D/g, '');
    if (code.length < 6) return lgErr('Имэйлд ирсэн кодыг бүтнээр нь оруулна уу.');
    btn.disabled = true; lgErr('');
    try { await C.verify(loginEmail, code); location.hash = ''; location.reload(); } catch (e) { lgErr(errText(e)); btn.disabled = false; }
  }

  function renderPending() {
    const blocked = S.member.status === 'blocked';
    screen(`<div class="card narrow center">
      <img class="brand-mark" src="logo.svg" alt="" width="36" height="60">
      <h1>${blocked ? 'Хандах эрх хаагдсан' : 'Зөвшөөрөл хүлээж байна'}</h1>
      <p class="muted">${blocked ? 'Таны эрхийг эзэмшигч хаасан байна.' : 'Таны хүсэлт эзэмшигчид очлоо. Зөвшөөрсний дараа хичээлийн санг үзэх боломжтой.'}</p>
      <p><b>${esc(S.member.email)}</b></p>
      ${blocked ? '' : '<button class="btn primary" onclick="location.reload()">Дахин шалгах</button> '}<button class="btn ghost" data-act="logout">Гарах</button>
    </div>`);
  }

  /* ---------- Үндсэн хүрээ ---------- */
  function shell(active, body) {
    const nav = [['#/', 'Хичээлүүд', 'book', 'lib'], ['#/schedule', 'Миний хуваарь', 'cal', 'schedule'], ['#/game', 'Тоглоом', 'game', 'game']].concat(isAdmin() ? [['#/admin', 'Админ', 'users', 'admin']] : []);
    $('#app').innerHTML = `<header class="top">
        <a class="brand" href="#/"><img src="logo.svg" alt="" width="17" height="28"><span>Хичээлийн сан</span></a>
        <nav class="nav">${nav.map(([h, t, ic, id]) => `<a href="${h}" class="${active === id ? 'on' : ''}">${icon(ic)}<span>${t}</span></a>`).join('')}</nav>
        <div class="who"><span title="${esc(S.member.email)}">${esc(S.member.email)}</span><button class="btn ghost sm" data-act="logout">Гарах</button></div>
      </header>${S.offlineMode ? '<div class="offline-bar">📴 Интернэтгүй горим · зөвхөн хадгалсан хичээлүүд нээгдэнэ</div>' : ''}<main class="page">${body}</main>
      <footer class="foot">Хичээлийн сан · V.__VERSION__</footer>`;
  }
  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    closeViewer();
    if (h[0] === 'l') return renderLesson(S.lessons.find(l => l.id === h[1]));
    if (h[0] === 't') {
      const grade = Number(h[1]), code = decodeURIComponent(h[2] || ''), l = lessonByCode(grade, code);
      if (l) { location.replace('#/l/' + l.id); return; }
      return renderLesson(null, grade, code);
    }
    if (h[0] === 'schedule') return renderSchedule();
    if (h[0] === 'game') return renderGame();
    if (h[0] === 'admin' && isAdmin()) return renderAdmin();
    renderLibrary();
  }

  /* ---------- Хичээлийн сан ---------- */
  // Бүлгийн дүрс, өнгө: гарчгийн түлхүүр үгээр (дарааллаар нь шалгана).
  const CH_STYLE = [
    [/гео.?орон зай/i, '🗺️', '#38d9a9'], [/хөдөө аж ахуй/i, '🌾', '#fab005'], [/аж үйлдвэр/i, '🏭', '#b197fc'], [/дэд бүтэц/i, '🚆', '#a5d8ff'],
    [/дэлхий( гараг| —| бидний)/i, '🌍', '#4dabf7'], [/гадарга|геолог/i, '⛰️', '#ff8c61'], [/уур амьсгал/i, '🌤️', '#ffd43b'],
    [/(^|\s)ус/i, '💧', '#74c0fc'], [/нөхцөл|нөөц/i, '🏞️', '#94d82d'], [/байгаль - нийгм|нийгмийн хамаарал/i, '♻️', '#20c997'],
    [/байгал|амьдрал/i, '🌿', '#69db7c'], [/хүн ам|хүмүүс|суурьшил/i, '👥', '#f783ac'], [/бүс нутаг/i, '🧭', '#e599f7'], [/монгол/i, '🏔️', '#ffa94d']
  ];
  const chStyle = title => (CH_STYLE.find(([re]) => re.test(title)) || [0, '📘', '#adb5bd']).slice(1);
  const isHtml = f => /^html?$/.test(ext(f));
  // Сэдвийн гол дэлгэцийн хичээл: шинэ интерактив хичээлийг түрүүлж, «(хуучин)»-ыг сүүлд.
  const screenRank = f => (/интерактив хичээл/.test(f.title) && !/хуучин/.test(f.title) ? 0 : /хуучин/.test(f.title) ? 2 : 1);
  const mainScreen = l => {
    const r = screenRank;
    // Ижил зэрэгтэй бол богино нэртэйг (жишээ нь «Нарны аймаг · интерактив хичээл») гол гэж үзнэ.
    return filesOf(l.id).filter(f => f.kind === 'screen' && isHtml(f)).sort((a, b) => r(a) - r(b) || a.title.length - b.title.length)[0] || filesOf(l.id).find(f => f.kind === 'screen' && viewable(f)) || null;
  };
  const thumbOf = (grade, code) => (window.LIB_THUMBS || {})[grade + '/' + code] || '';
  // Өнөөдрийн (эсвэл дараагийн) товлосон хичээл
  function todayCard() {
    const t = today(), up = S.schedule.filter(s => s.day >= t).sort((a, b) => (a.day + (a.time || '')).localeCompare(b.day + (b.time || '')));
    const s = up.find(x => x.day === t) || up[0];
    if (!s) return `<a class="today empty" href="#/schedule"><span class="tday-ic">📅</span><span><b>Хичээлээ товлоорой</b><span class="muted">«Миний хуваарь»-т өнөөдрийн хичээлээ нэмбэл энд гарч, нэг товчоор эхэлнэ.</span></span></a>`;
    const l = S.lessons.find(x => x.id === s.lesson_id), f = l && mainScreen(l), th = l && thumbOf(l.grade, l.code);
    const when = s.day === t ? `Өнөөдрийн хичээл${s.time ? ' · ' + esc(s.time) : ''}` : `Дараагийн хичээл · ${dayName(s.day)}${s.time ? ' ' + esc(s.time) : ''}`;
    return `<div class="today">${th ? `<img class="tday-th" src="${th}" alt="" loading="lazy">` : '<span class="tday-ic">☀️</span>'}
      <div class="tday-t"><span class="muted">${when}${s.class_name ? ' · ' + esc(s.class_name) : ''}</span>
      <b>${l ? `${l.grade}-р анги · ${esc((/^\d/.test(l.code) ? l.code + ' ' : '') + l.title)}` : 'Хичээл сонгоогүй'}</b>${s.note ? `<span class="muted">${esc(s.note)}</span>` : ''}</div>
      <div class="tday-b">${f ? `<button class="btn primary" data-act="play" data-id="${f.id}">▶ Эхлэх</button>` : ''}${l ? `<a class="btn" href="#/l/${l.id}">Хичээлийн хуудас</a>` : ''}</div></div>`;
  }
  // Интернэтгүй хадгалсан дэлгэцийн хичээлийн тоо ба «Бүгдийг хадгалах»
  function offRow() {
    const all = S.files.filter(f => f.kind === 'screen'), n = all.filter(f => S.saved.has(f.id)).length;
    if (!all.length) return '';
    return `<div class="off-row"><span>📴 <b>${n}/${all.length}</b> дэлгэцийн хичээл интернэтгүй нээгдэнэ</span>` +
      (S.offlineMode || n === all.length ? '' : '<button class="btn sm" data-act="save-all">📥 Бүгдийг хадгалах</button>') + '</div>';
  }
  let filter = '';
  function renderLibrary() {
    const gr = CAT.find(g => g.grade === S.grade) || CAT[0];
    const counts = id => KINDS.map(k => filesOf(id).filter(f => f.kind === k.id).length);
    const lessonsOf = g => S.lessons.filter(l => l.grade === g);
    // Сурах бичгийн бүлгүүд + админы нэмсэн бүлгүүд
    const custom = [...new Set(lessonsOf(gr.grade).map(l => l.chapter).filter(ch => !chapterOf(gr.grade, ch)))];
    const chapters = gr.chapters.map(c => ({ key: c.n, title: c.title, label: `${c.n} бүлэг · ${c.title}`, topics: c.topics.map(([code, title]) => ({ code, title })) }))
      .concat(custom.map(ch => ({ key: ch, title: ch, label: ch, topics: [] })));
    chapters.forEach(c => {
      lessonsOf(gr.grade).filter(l => l.chapter === c.key && !c.topics.some(t => t.code === l.code)).forEach(l => c.topics.push({ code: l.code, title: l.title, extra: true }));
      const [emo, col] = chStyle(c.title); c.emo = emo; c.col = col;
      c.ready = c.topics.filter(t => { const l = lessonByCode(gr.grade, t.code); return l && filesOf(l.id).some(f => f.kind === 'screen'); }).length;
    });
    const q = filter.trim().toLowerCase();
    // Сэдвийн карт: нүүр зураг (байхгүй бол бүлгийн өнгө, дүрс), ▶ товч, материалын тоо
    const card = (t, c) => {
      const l = lessonByCode(gr.grade, t.code), n = l ? counts(l.id) : [0, 0, 0, 0], nm = mapsOf(gr.grade, t.code).length, total = n.reduce((a, b) => a + b, 0) + nm;
      const title = l ? l.title : t.title;
      if (q && !(`${t.code} ${title}`.toLowerCase().includes(q))) return '';
      const href = l ? '#/l/' + l.id : `#/t/${gr.grade}/${encodeURIComponent(t.code)}`, f = l && mainScreen(l), th = thumbOf(gr.grade, t.code);
      const code = /^\d/.test(t.code) ? t.code : '•';
      return `<div class="tcard${total ? '' : ' empty'}" style="--cc:${c.col}"><a class="tc-th" href="${href}" aria-label="${esc(title)}">` +
        (th && f ? `<img src="${th}" alt="" loading="lazy">` : `<span class="tc-ph"><i>${c.emo}</i>${/^d/.test(t.code) ? `<b>${esc(t.code)}</b>` : ""}</span>`) + '</a>' +
        (f && S.saved.has(f.id) ? '<span class="tc-saved" title="Интернэтгүй нээгдэнэ">📴</span>' : '') +
        (f ? `<button class="tc-play" data-act="play" data-id="${f.id}" title="Бүтэн дэлгэцээр эхлэх" aria-label="${esc(title)}: эхлэх">▶</button>` : '') +
        `<a class="tc-b" href="${href}"><span class="tc-t"><span class="code">${esc(code)}</span>${esc(title)}</span>` +
        (total ? `<span class="counts">${KINDS.map((k, i) => n[i] ? `<span class="cnt ${k.id}" title="${k.name}">${icon(k.id)}${n[i]}</span>` : '').join('')}${nm ? `<span class="cnt map" title="Газрын зураг">${icon('map')}${nm}</span>` : ''}</span>` : '<span class="counts muted">Материал алга</span>') + '</a></div>';
    };
    const body = chapters.map(c => {
      const cards = c.topics.map(t => card(t, c)).join('');
      if (q && !cards) return '';
      const pct = c.topics.length ? Math.round(c.ready / c.topics.length * 100) : 0;
      return `<section class="chapter" id="ch-${esc(c.key)}" style="--cc:${c.col}"><div class="ch-h"><span class="ch-ic">${c.emo}</span><h2>${esc(c.label)}</h2>` +
        (c.topics.length ? `<span class="ch-prog" title="Дэлгэцийн хичээлтэй сэдэв"><i style="width:${pct}%"></i></span><small>${c.ready}/${c.topics.length} бэлэн</small>` : '') + `</div><div class="shelf">${cards}</div>` +
        (isAdmin() && !q ? `<button class="add-link" data-act="add-lesson" data-ch="${esc(c.key)}">+ Нэмэлт хичээл</button>` : '') + '</section>';
    }).join('');
    const withMat = g => lessonsOf(g).filter(l => filesOf(l.id).length).length;
    // Нийт тоо: бүх ангийн дэлгэцийн HTML хичээл, төлөвлөгөө, кино, газрын зураг
    const nScreen = S.files.filter(f => f.kind === 'screen' && isHtml(f)).length, nPlan = S.files.filter(f => f.kind === 'plan').length;
    const nVideo = S.files.filter(f => f.kind === 'video').length, nMap = Object.values(window.LIB_MAPS || {}).reduce((s, a) => s + a.length, 0);
    const d = new Date(), dateStr = `${d.getMonth() + 1}-р сарын ${d.getDate()}, ${WD[d.getDay()]} гараг`;
    shell('lib', `<section class="hero"><div><p class="eyebrow">Газар зүй · ${dateStr}</p><h1>Сайн байна уу, багшаа 👋</h1></div>
        <input class="search" id="lib-q" type="search" placeholder="🔍 Сэдэв хайх" value="${esc(filter)}" aria-label="Сэдэв хайх"></section>
      ${q ? '' : todayCard()}
      ${q ? '' : `<div class="stats"><span><b>${nScreen}</b>дэлгэцийн хичээл</span><span><b>${nPlan}</b>төлөвлөгөө</span><span><b>${nVideo}</b>кино</span><span><b>${nMap}</b>газрын зураг</span></div>`}
      ${q ? '' : offRow()}
      <div class="grades" role="tablist">${CAT.map(g => `<button role="tab" class="grade${g.grade === S.grade ? ' on' : ''}" data-act="grade" data-g="${g.grade}" aria-selected="${g.grade === S.grade}"><b>${g.grade}</b><span>-р анги</span>${withMat(g.grade) ? `<small>${withMat(g.grade)} хичээл</small>` : ''}</button>`).join('')}</div>
      ${q || !chapters.length ? '' : `<nav class="ch-tiles" aria-label="Бүлгүүд">${chapters.map(c => `<a href="#/" data-act="to-ch" data-ch="${esc(c.key)}" style="--cc:${c.col}"><span class="ch-ic">${c.emo}</span><span class="ch-n">${esc(/^[IVX]+$/.test(c.key) ? c.key + ' бүлэг' : 'Нэмэлт')}</span><span class="ch-tt">${esc(c.title)}</span>` +
        (c.topics.length ? `<span class="ch-prog"><i style="width:${Math.round(c.ready / c.topics.length * 100)}%"></i></span>` : '') + '</a>').join('')}</nav>`}
      ${body || (q ? '<p class="muted">Хайлтад тохирох сэдэв олдсонгүй.</p>' : '<div class="card"><p class="muted">Энэ ангид бүлэг бүртгэгдээгүй байна.</p></div>')}
      ${isAdmin() && !q ? `<div class="card add-chapter" id="add-chapter"><h3>Шинэ бүлэг ба хичээл нэмэх</h3><p class="muted">Сурах бичгийн жагсаалтад байхгүй бүлэг эсвэл ${S.grade}-р ангийн шинэ бүлэг.</p>
        <div class="form-row"><input id="nc-ch" placeholder="Бүлэг, жишээ нь I бүлэг · Дэлхийн бүтэц"><input id="nc-title" placeholder="Хичээлийн нэр"><button class="btn" data-act="new-chapter">Нэмэх</button></div></div>` : ''}`);
    const s = $('#lib-q');
    s.addEventListener('input', () => { filter = s.value; const pos = s.selectionStart; renderLibrary(); const n = $('#lib-q'); n.focus(); n.setSelectionRange(pos, pos); });
  }
  async function addLesson(chapter, title, code) {
    title = String(title || '').trim();
    if (!title) return toast('Хичээлийн нэрийг бичнэ үү.', true);
    const n = S.lessons.filter(l => l.grade === S.grade && l.chapter === chapter).length + 1;
    try {
      const l = await C.saveLesson({ grade: S.grade, chapter, code: code || `${chapter}-${Date.now().toString(36)}`, title, sort: 100 + n });
      S.lessons.push(l);
      location.hash = '#/l/' + l.id;
    } catch (e) { toast(errText(e), true); }
  }

  /* ---------- Хичээлийн хуудас ---------- */
  let planFilter = '';
  function renderLesson(l, grade, code) {
    let topicTitle = '', chapter = '';
    if (l) { grade = l.grade; code = l.code; chapter = l.chapter; topicTitle = l.title; }
    else {
      const g = CAT.find(x => x.grade === grade), c = g && g.chapters.find(ch => ch.topics.some(t => t[0] === code));
      if (!c) { location.replace('#/'); return; }
      chapter = c.n; topicTitle = c.topics.find(t => t[0] === code)[1];
    }
    const files = l ? filesOf(l.id) : [];
    const methods = [...new Set(files.filter(f => f.kind === 'plan').map(f => f.method).filter(Boolean))];
    if (planFilter && !methods.includes(planFilter)) planFilter = '';
    // Файлын мөр: файлын урт нэрийг нууж (хулгана аваачихад харагдана), HTML хичээлд «▶ Эхлэх» (бүтэн дэлгэц).
    const fileRow = f => {
      const t = TYPE[ext(f)] || ext(f).toUpperCase() || 'Файл';
      return `<li class="file" title="${esc(f.name)}"><span class="ftype t-${esc(ext(f))}">${esc(t)}</span><div class="fmeta"><b>${esc(f.title)}</b>` +
        `<span>${f.method ? `<span class="chip sm">${esc(f.method)}</span> ` : ''}${size(f.size)}${S.saved.has(f.id) ? ' · <span class="saved-tag">📴 интернэтгүй нээгдэнэ</span>' : ''}</span></div><div class="facts">` +
        (f.kind === 'screen' && isHtml(f) ? `<button class="btn sm${main && f.id === main.id ? ' primary' : ''}" data-act="play" data-id="${f.id}">▶ Эхлэх</button><button class="btn sm" data-act="view" data-id="${f.id}">Харах</button>`
          : viewable(f) ? `<button class="btn sm primary" data-act="view" data-id="${f.id}">Харах</button>` : '') +
        `<button class="btn sm" data-act="download" data-id="${f.id}">Татах</button>` +
        (isAdmin() ? `<button class="btn sm ghost" data-act="edit-file" data-id="${f.id}">Засах</button><button class="btn sm ghost danger" data-act="del-file" data-id="${f.id}">Устгах</button>` : '') + '</div></li>';
    };
    // Хэсэг: материалгүй хэсэг багшид нуугдана, админд «+ Файл нэмэх»-тэй жижиг харагдана.
    const section = k => {
      let list = files.filter(f => f.kind === k.id);
      if (!list.length && !isAdmin()) return '';
      const chips = k.id === 'plan' && methods.length > 1 ? `<div class="chips"><button class="chip${planFilter ? '' : ' on'}" data-act="plan-filter" data-m="">Бүгд</button>${methods.map(m => `<button class="chip${planFilter === m ? ' on' : ''}" data-act="plan-filter" data-m="${esc(m)}">${esc(m)}</button>`).join('')}</div>` : '';
      if (k.id === 'plan' && planFilter) list = list.filter(f => f.method === planFilter);
      // Дэлгэцийн хичээл: гол интерактив хичээл эхэнд, «(хуучин)» сүүлд
      if (k.id === 'screen') list = list.slice().sort((a, b) => screenRank(a) - screenRank(b) || a.title.length - b.title.length);
      return `<section class="kind card${list.length ? '' : ' empty'}" id="k-${k.id}"><div class="kind-h">${icon(k.id, 'big')}<div><h2>${k.name}</h2><p class="muted">${k.hint}</p></div></div>${chips}` +
        (list.length ? `<ul class="files">${list.map(fileRow).join('')}</ul>` : '<p class="muted empty-note">Одоогоор материал алга.</p>') +
        (isAdmin() ? `<details class="up-d"><summary>+ Файл нэмэх</summary>${uploadForm(k)}</details>` : '') + '</section>';
    };
    const ch = chapterLabel(grade, chapter), chc = chapterOf(grade, chapter), [emo, col] = chStyle(chc ? chc.title : String(chapter));
    const main = l && mainScreen(l), th = main && thumbOf(grade, code), isCode = /^\d/.test(code);
    const nk = KINDS.map(k => files.filter(f => f.kind === k.id).length), nm = mapsOf(grade, code).length;
    const sum = KINDS.map((k, i) => nk[i] ? `<a class="cnt ${k.id}" href="#/" data-act="to-sec" data-sec="k-${k.id}">${icon(k.id)}${nk[i]} ${k.name.toLowerCase()}</a>` : '').join('') +
      (nm ? `<a class="cnt map" href="#/" data-act="to-sec" data-sec="k-map">${icon('map')}${nm} газрын зураг</a>` : '');
    const cover = th ? `<img src="${th}" alt="">` : `<span class="tc-ph"><i>${emo}</i>${isCode ? `<b>${esc(code)}</b>` : ''}</span>`;
    shell('lib', `<p class="crumbs"><a href="#/">Хичээлүүд</a> › ${grade}-р анги › ${esc(ch)}</p>
      <section class="t-hero" style="--cc:${col}">
        ${main ? `<button class="t-cover" data-act="play" data-id="${main.id}" aria-label="Хичээл эхлэх">${cover}<span class="t-play">▶</span></button>` : `<div class="t-cover">${cover}</div>`}
        <div class="t-info"><span class="t-ch">${emo} ${esc(ch)}</span>
          <h1>${isCode ? `<span class="code-big">${esc(code)}</span> ` : ''}${esc(topicTitle)}</h1>
          ${sum ? `<div class="t-sum counts">${sum}</div>` : '<p class="muted">Энэ сэдэвт материал хараахан алга.</p>'}
          <div class="t-btns">${main ? `<button class="btn primary big" data-act="play" data-id="${main.id}">▶ Хичээл эхлэх</button>` : ''}
          ${files.length && !S.offlineMode ? (files.every(f => S.saved.has(f.id) || (f.size || 0) > OFF_MAX) ? '<span class="saved-tag">📴 Бүгд интернэтгүй нээгдэнэ</span>' : '<button class="btn" data-act="save-topic">📥 Интернэтгүй хадгалах</button>') : ''}
          ${isAdmin() && l ? `<button class="btn sm ghost" data-act="rename-lesson">Нэр засах</button><button class="btn sm ghost danger" data-act="del-lesson">Хичээл устгах</button>` : ''}</div>
        </div></section>
      <div class="kinds">${KINDS.map(section).join('')}${nm || isAdmin() ? mapSection(grade, code) : ''}</div>`);
    S.current = { lesson: l, grade, code, chapter, title: topicTitle };
    const dl = $('#methods-list');
    if (dl) dl.innerHTML = methods.map(m => `<option value="${esc(m)}">`).join('');
  }
  // «Газрын зураг» хэсэг: сансрын, физик, байрзүйн, засаг захиргааны суурь зургаар харуулна.
  const mapSection = (grade, code) => {
    const maps = mapsOf(grade, code);
    return `<section class="kind card kind-map" id="k-map"><div class="kind-h">${icon('map', 'big')}<div><h2>Газрын зураг</h2><p class="muted">Сэдэвтэй холбоотой зүйлсийг газрын зураг дээр заана: сансрын, физик газарзүйн, байрзүйн, засаг захиргааны зураг</p></div></div>` +
      (maps.length ? `<ul class="files">${maps.map((m, i) => `<li class="file"><span class="ftype t-map">Зураг</span><div class="fmeta"><b>${esc(m.title)}</b><span>${esc(m.desc || '')}${m.quiz && m.quiz.length ? ' · олох тоглоомтой' : ''}</span></div><div class="facts"><button class="btn sm primary" data-act="map-open" data-mi="${i}">Харах</button></div></li>`).join('')}</ul>` : '<p class="muted empty-note">Энэ сэдэвт газрын зураг хараахан бэлдээгүй.</p>') + '</section>';
  };
  const uploadForm = k => `<form class="upload" data-kind="${k.id}">
    <input type="file" name="file" multiple required>
    <div class="form-row"><input name="title" placeholder="Нэр (хоосон бол файлын нэр)">` +
    (k.id === 'plan' ? '<input name="method" list="methods-list" placeholder="Арга зүй, жишээ нь Уламжлалт" required><datalist id="methods-list"></datalist>' : '') +
    `<button class="btn primary" type="submit">Оруулах</button></div><p class="muted up-msg" aria-live="polite"></p></form>`;

  // Хичээлийн дараалал: бүлгийн дугаар × 100 + сэдвийн дугаар (нэмэлт хичээл бүлгийн төгсгөлд).
  const lessonSort = (grade, chapter, code) => {
    const g = CAT.find(x => x.grade === grade), ci = g ? g.chapters.findIndex(ch => ch.n === chapter) : -1;
    return Math.max(0, ci) * 100 + (Number(String(code).split('.')[1]) || 90);
  };
  const topicTitle = (grade, code) => { const g = CAT.find(x => x.grade === grade); const t = g && g.chapters.flatMap(c => c.topics).find(x => x[0] === code); return t ? t[1] : ''; };
  async function ensureLesson() {
    const c = S.current;
    if (c.lesson) return c.lesson;
    const l = await C.saveLesson({ grade: c.grade, chapter: c.chapter, code: c.code, title: c.title, sort: lessonSort(c.grade, c.chapter, c.code) });
    S.lessons.push(l); c.lesson = l;
    return l;
  }
  async function upload(form) {
    if (S.uploadBusy) return;
    const el = form.elements, kind = form.dataset.kind, files = [...el.file.files], msg = form.querySelector('.up-msg');
    if (!files.length) return;
    const big = files.find(f => f.size > 50 * 1048576);
    if (big) { msg.textContent = `«${big.name}» 50 МБ-аас том байна.`; return; }
    const method = el.method ? el.method.value.trim() : '';
    if (kind === 'plan' && !method) { msg.textContent = 'Төлөвлөгөөний арга зүйг бичнэ үү.'; return; }
    S.uploadBusy = true; form.querySelector('button[type=submit]').disabled = true;
    try {
      const l = await ensureLesson();
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        msg.textContent = `Оруулж байна… ${i + 1}/${files.length}: ${f.name}`;
        const title = (files.length === 1 && el.title.value.trim()) || f.name.replace(/\.[^.]+$/, '');
        S.files.push(await C.upload(l.id, kind, f, { title, method }));
      }
      S.uploadBusy = false;
      toast(`${files.length} файл нэмэгдлээ.`);
      if (location.hash !== '#/l/' + l.id) location.replace('#/l/' + l.id); else renderLesson(l);
    } catch (e) { S.uploadBusy = false; msg.textContent = errText(e); form.querySelector('button[type=submit]').disabled = false; }
  }

  /* ---------- Файл үзэх ---------- */
  let viewerUrl = '';
  // full: нээгдмэгц бүтэн дэлгэц болгоно (дарснаас хойш хэдэн секундийн дотор хөтөч зөвшөөрдөг).
  async function openFile(f, download, full) {
    try {
      toast(download ? 'Татаж байна…' : 'Нээж байна…');
      const raw = await getBlob(f), e = ext(f);
      const blob = MIME[e] ? new Blob([raw], { type: MIME[e] }) : raw;
      const url = URL.createObjectURL(blob);
      if (download) {
        const a = document.createElement('a'); a.href = url; a.download = f.name || f.title; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        return;
      }
      closeViewer(); viewerUrl = url;
      const v = $('#viewer');
      if (isDocx(f)) {
        v.innerHTML = `<div class="v-bar"><b>${esc(f.title)}</b><div><button class="btn sm" data-act="v-full">Бүтэн дэлгэц</button><button class="btn sm" data-act="download" data-id="${f.id}">Татах</button><button class="btn sm primary" data-act="v-close">Хаах</button></div></div><div class="v-body docx-body"><p class="docx-wait">Word файлыг бэлдэж байна…</p></div>`;
        v.hidden = false; document.body.classList.add('noscroll'); $('#toast').className = 'toast';
        await loadDocx();
        const box = v.querySelector('.docx-body');
        if (!box) return;
        box.innerHTML = '';
        const narrow = window.innerWidth < 860;
        await window.docx.renderAsync(raw, box, null, { inWrapper: true, ignoreWidth: narrow, ignoreHeight: narrow, breakPages: !narrow, useBase64URL: true, renderHeaders: true, renderFooters: true });
        return;
      }
      // HTML хичээлийг тусгаарласан цонхонд ажиллуулна (сайтын нэвтрэлтэд хандах боломжгүй).
      const inner = /^image\//.test(blob.type) ? `<img src="${url}" alt="${esc(f.title)}">`
        : blob.type === 'text/html' ? `<iframe sandbox="allow-scripts allow-popups allow-forms allow-modals allow-downloads" allow="fullscreen" title="${esc(f.title)}"></iframe>`
        : `<iframe src="${url}" title="${esc(f.title)}"></iframe>`;
      v.innerHTML = `<div class="v-bar"><b>${esc(f.title)}</b><div><button class="btn sm" data-act="v-full">Бүтэн дэлгэц</button><button class="btn sm" data-act="download" data-id="${f.id}">Татах</button><button class="btn sm primary" data-act="v-close">Хаах</button></div></div><div class="v-body">${inner}</div>`;
      // HTML-ийг srcdoc-оор оруулна: тусгаарласан цонх blob холбоос нээж чаддаггүй.
      if (blob.type === 'text/html') v.querySelector('iframe').srcdoc = await blob.text();
      v.hidden = false; document.body.classList.add('noscroll'); $('#toast').className = 'toast';
      if (full) { const el = v.querySelector('.v-body'); if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); }
    } catch (err) { closeViewer(); toast(errText(err), true); }
  }
  function closeViewer() {
    const v = $('#viewer');
    if (!v || v.hidden) return;
    if (window.LIB_MAPVIEW) window.LIB_MAPVIEW.destroy();
    v.hidden = true; v.innerHTML = ''; document.body.classList.remove('noscroll');
    if (viewerUrl) { URL.revokeObjectURL(viewerUrl); viewerUrl = ''; }
  }

  /* ---------- Миний хуваарь ---------- */
  function renderSchedule() {
    const t = today();
    const opts = CAT.map(g => {
      const ls = S.lessons.filter(l => l.grade === g.grade);
      return ls.length ? `<optgroup label="${g.grade}-р анги">${ls.map(l => `<option value="${l.id}">${esc((/^\d/.test(l.code) ? l.code + ' ' : '') + l.title)}</option>`).join('')}</optgroup>` : '';
    }).join('');
    const item = s => {
      const l = S.lessons.find(x => x.id === s.lesson_id);
      return `<li class="sch${s.day < t ? ' past' : ''}"><span class="time">${esc(s.time || '—')}</span><div class="sch-main"><b>${esc(s.class_name || 'Анги')}</b>` +
        `${l ? `<a href="#/l/${l.id}">${l.grade}-р анги · ${esc((/^\d/.test(l.code) ? l.code + ' ' : '') + l.title)}</a>` : '<span class="muted">Хичээл сонгоогүй</span>'}` +
        `${s.note ? `<span class="muted">${esc(s.note)}</span>` : ''}</div><button class="btn sm ghost danger" data-act="del-sch" data-id="${s.id}" aria-label="Устгах">Устгах</button></li>`;
    };
    const group = list => {
      const days = [...new Set(list.map(s => s.day))];
      return days.map(d => `<h3 class="day">${dayName(d)}${d === t ? ' <span class="chip sm on">Өнөөдөр</span>' : ''}</h3><ul class="schs">${list.filter(s => s.day === d).map(item).join('')}</ul>`).join('');
    };
    const up = S.schedule.filter(s => s.day >= t), past = S.schedule.filter(s => s.day < t).reverse();
    shell('schedule', `<p class="eyebrow">Дадлага</p><h1>Миний хуваарь</h1>
      <form class="card sch-form" id="sch-form"><h3>Хичээл товлох</h3>
        <div class="form-grid">
          <label>Огноо<input type="date" name="day" value="${t}" required></label>
          <label>Цаг<input type="time" name="time"></label>
          <label>Анги<input name="class_name" placeholder="7а"></label>
          <label class="span2">Хичээл<select name="lesson_id"><option value="">Сонгоогүй</option>${opts}</select></label>
          <label class="span3">Тэмдэглэл<input name="note" placeholder="Жишээ нь проектор авчрах, 2-р төлөвлөгөөгөөр"></label>
        </div><button class="btn primary" type="submit">Нэмэх</button></form>
      ${up.length ? group(up) : '<p class="muted">Товлосон хичээл алга. Дээрх хэсгээс нэмээрэй.</p>'}
      ${past.length ? `<details class="past-list"><summary>Өнгөрсөн хичээлүүд (${past.length})</summary>${group(past)}</details>` : ''}`);
  }
  /* ---------- Тоглоом ---------- */
  // «Дэлхийн гадарга» бол тусдаа сайт. Сурагчдын нэвтрэлтийг хамгаалахын тулд (X-Frame-Options) бусад сайтын
  // цонх дотор нээгдэхийг хориглодог, тиймээс шинэ цонхонд нээнэ.
  // «Газарзүйч аялагч» бол нэвтрэлтгүй 3D тоглоом (gazarzui/togloom → GitHub Pages).
  const GAME_URL = (window.LIB_CONFIG || {}).gameUrl || 'https://game-game1-ef49.vercel.app';
  const AYLAGCH_URL = (window.LIB_CONFIG || {}).aylagchUrl || 'https://irmuun2.github.io/aylagch-/';
  const hostOf = u => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
  function renderGame() {
    const host = hostOf(GAME_URL);
    shell('game', `<p class="eyebrow">Ангид тоглуулах</p><h1>Тоглоом</h1>
      <section class="card game">
        <div class="game-h"><img src="logo.svg" alt="" width="30" height="50"><div><h2>Дэлхийн гадарга</h2>
          <p class="muted">Сурах бичгийн бүлэг бүрээр түвшин ахих асуулт, хариултын тоглоом. Сурагч өөрийн бүртгэлээр нэвтэрч тоглоно.</p></div></div>
        <ul class="game-list">
          <li><b>7-р анги</b><span>7 бүлэг</span></li>
          <li><b>8-р анги</b><span>5 бүлэг</span></li>
          <li><b>Нэмэлт тоглоом</b><span>Нарны аймгийн аялал (II бүлэг) · Чулуулгийн газрын зураг (III бүлэг) · Хос карт (7-р анги)</span></li>
        </ul>
        <div class="game-url"><span class="muted">Сурагчдад өгөх хаяг</span><code>${esc(host)}</code></div>
        <div class="game-act"><a class="btn primary" href="${esc(GAME_URL)}" target="_blank" rel="noopener">${icon('link')}Тоглоом нээх</a><button class="btn" data-act="copy-game" data-url="${esc(GAME_URL)}">Хаяг хуулах</button></div>
        <p class="muted small">Тоглоом шинэ цонхонд нээгдэнэ. Самбар дээр харуулахдаа тэр цонхонд F11 дарж бүтэн дэлгэц болгоно.</p>
      </section>
      <section class="card game">
        <div class="game-h"><div><h2>Газарзүйч аялагч</h2>
          <p class="muted">3D даалгаврын тоглоом. Монгол орны гурван нутаг болон Улаанбаатар хотоор аялж, хүмүүсийн даалгаврыг биелүүлнэ. Олсон одоороо хэрэгсэл, хувцас авч дүрээ хөгжүүлнэ. Нэвтрэх шаардлагагүй, явц нь тухайн компьютерийн хөтөчид хадгалагдана.</p></div></div>
        <ul class="game-list">
          <li><b>Хангайн хөндий</b><span>Зүг чиг · 1.4 Масштаб · 5.3 Гол · 3.2 Гадаргын өндөр · 3.3 Гадаргын хэлбэр · 1.3 Хаялбар</span></li>
          <li><b>Говь</b><span>4.1 Цаг агаар · 3.4 Эрдэс чулуулаг · 6.2–6.3 Цөлийн ургамал, амьтан</span></li>
          <li><b>Хөвсгөлийн тайга</b><span>6.2 Шилмүүст ой · 6.3 Ойн амьтад · 4.1, 6.4 Өндрийн бүслүүр</span></li>
          <li><b>Улаанбаатар хот</b><span>7.4 Хотжилт · 7.3 Хүн амын нягтшил · 7.7 Тээвэр · 4.1 Өндөр ба температур (Богд хан уул)</span></li>
          <li><b>Удирдлага</b><span>Компьютер дээр гар (W A S D), хулганаар; утас, планшет дээр хуруугаар (жойстик, товчнууд). Утсыг хэвтээ барина.</span></li>
        </ul>
        <div class="game-url"><span class="muted">Сурагчдад өгөх хаяг</span><code>${esc(hostOf(AYLAGCH_URL))}</code></div>
        <div class="game-act"><a class="btn primary" href="${esc(AYLAGCH_URL)}" target="_blank" rel="noopener">${icon('link')}Тоглоом нээх</a><button class="btn" data-act="copy-game" data-url="${esc(AYLAGCH_URL)}">Хаяг хуулах</button></div>
      </section>`);
  }

  async function saveSchedule(form) {
    const d = Object.fromEntries(new FormData(form).entries());
    if (!d.day) return toast('Огноогоо сонгоно уу.', true);
    try {
      const s = await C.saveSchedule(d);
      S.schedule.push(s);
      S.schedule.sort((a, b) => (a.day + a.time).localeCompare(b.day + b.time));
      toast('Хуваарьт нэмэгдлээ.'); renderSchedule();
    } catch (e) { toast(errText(e), true); }
  }

  /* ---------- Админ ---------- */
  async function renderAdmin() {
    shell('admin', '<p class="eyebrow">Зөвхөн эзэмшигч ба админ</p><h1>Админ</h1><p class="muted">Ачаалж байна…</p>');
    try { S.members = await C.members(); } catch (e) { return toast(errText(e), true); }
    const role = { owner: 'Эзэмшигч', admin: 'Админ', teacher: 'Багш' };
    const btn = (act, uid, label, cls) => `<button class="btn sm ${cls || 'ghost'}" data-act="${act}" data-uid="${uid}">${label}</button>`;
    const rowOf = m => {
      const me = m.user_id === S.member.user_id;
      let acts = '';
      if (!me && m.role !== 'owner') {
        if (m.status === 'pending') acts = btn('approve', m.user_id, 'Зөвшөөрөх', 'primary') + btn('block', m.user_id, 'Татгалзах', 'ghost danger');
        else if (m.status === 'approved') acts = (isOwner() ? (m.role === 'admin' ? btn('make-teacher', m.user_id, 'Багш болгох') : btn('make-admin', m.user_id, 'Админ болгох')) : '') + btn('block', m.user_id, 'Эрх хаах', 'ghost danger');
        else acts = btn('approve', m.user_id, 'Буцааж зөвшөөрөх') + btn('remove', m.user_id, 'Жагсаалтаас хасах', 'ghost danger');
      }
      return `<li class="mem"><div><b>${esc(m.email)}${me ? ' (та)' : ''}</b><span class="muted">${role[m.role] || m.role} · ${m.status === 'approved' ? 'зөвшөөрсөн' : m.status === 'pending' ? 'хүлээгдэж буй' : 'хаасан'} · ${esc(String(m.created_at || '').slice(0, 10))}</span></div><div class="facts">${acts}</div></li>`;
    };
    const pend = S.members.filter(m => m.status === 'pending'), rest = S.members.filter(m => m.status !== 'pending');
    const bytes = S.files.reduce((s, f) => s + (Number(f.size) || 0), 0);
    shell('admin', `<p class="eyebrow">Зөвхөн эзэмшигч ба админ</p><h1>Админ</h1>
      <div class="stats"><div><b>${S.lessons.length}</b><span>хичээл</span></div><div><b>${S.files.length}</b><span>файл</span></div><div><b>${size(bytes)}</b><span>нийт хэмжээ (1 ГБ хүртэл үнэгүй)</span></div><div><b>${S.members.filter(m => m.status === 'approved').length}</b><span>багш</span></div></div>
      <section class="card"><h2>Шинэ хүсэлт (${pend.length})</h2>${pend.length ? `<ul class="mems">${pend.map(rowOf).join('')}</ul>` : '<p class="muted">Шинэ хүсэлт алга.</p>'}</section>
      <section class="card"><h2>Багш нар</h2><ul class="mems">${rest.map(rowOf).join('')}</ul></section>
      <section class="card"><h2>Материал олноор оруулах</h2><p class="muted">Компьютер дээрх <b>hicheeliin-san\\import</b> хавтсыг сонгоно (manifest.json-той). Хичээлүүд автоматаар үүсч, файл бүр зөв анги, сэдэв, хэсэгт орно. Аль хэдийн орсон файлыг давхар оруулахгүй, харин өөрчлөгдсөн бол шинэ хувилбараар солино.</p>
        <input type="file" id="imp-dir" webkitdirectory multiple aria-label="Импортын хавтас"><div class="form-row"><button class="btn primary" data-act="import-go">Оруулах</button></div><p class="muted" id="imp-msg" aria-live="polite"></p></section>
      <section class="card"><h2>Материал нэмэх</h2><p class="muted">Хичээлүүд цэснээс анги, сэдвээ сонгоод хичээлийн хуудасны «Файл нэмэх» хэсгээс оруулна. Сурах бичигт байхгүй хичээлийг бүлгийн доорх «+ Нэмэлт хичээл»-ээр нэмнэ.</p></section>`);
  }
  async function importDir(btn) {
    const files = [...$('#imp-dir').files], msg = t => { $('#imp-msg').textContent = t; };
    const mf = files.find(f => f.name === 'manifest.json');
    if (!mf) return msg('manifest.json олдсонгүй. hicheeliin-san доторх import хавтсыг сонгоно уу.');
    let man;
    try { man = JSON.parse(await mf.text()); } catch (e) { return msg('manifest.json уншигдсангүй.'); }
    btn.disabled = true;
    let done = 0, skipped = 0, replaced = 0;
    const failed = [];
    for (const it of man.items || []) {
      msg(`Оруулж байна… ${done + replaced + skipped + failed.length + 1}/${man.items.length}: ${it.title}`);
      try {
        const f = files.find(x => x.name === it.file);
        if (!f) throw new Error('файл алга');
        let l = lessonByCode(it.grade, it.code);
        if (!l) {
          l = await C.saveLesson({ grade: it.grade, chapter: it.chapter, code: it.code, title: it.lessonTitle || topicTitle(it.grade, it.code) || it.code, sort: lessonSort(it.grade, it.chapter, it.code) });
          S.lessons.push(l);
        }
        // Ижил нэртэй файл байвал: хэмжээ нь ижил, сайтад орсноос хойш засагдаагүй бол алгасна; бусад үед шинэ хувилбараар солино.
        // (Слайдын байр солиход хэмжээ өөрчлөгдөхгүй тул засварласан огноог (mtime) бас харьцуулна.)
        const old = S.files.find(x => x.lesson_id === l.id && x.name === it.name);
        const newer = old && it.mtime && old.created_at && it.mtime > Date.parse(old.created_at);
        if (old && !newer && (!it.size || Number(old.size) === Number(it.size))) { skipped++; continue; }
        const named = new File([f], it.name, { type: f.type || MIME[ext({ name: it.name })] || 'application/octet-stream' });
        S.files.push(await C.upload(l.id, it.kind, named, { title: it.title, method: it.method }));
        if (old) { await C.removeFile(old); S.files = S.files.filter(x => x.id !== old.id); replaced++; } else done++;
      } catch (e) { failed.push(`${it.title}: ${errText(e)}`); }
    }
    btn.disabled = false;
    msg(`Дууслаа: ${done} файл нэмэгдлээ` + (replaced ? `, ${replaced} файл шинэчлэгдлээ` : '') + (skipped ? `, ${skipped} файл өмнө нь орсон байсан` : '') + (failed.length ? `. Алдаа (${failed.length}): ${failed.join(' · ')}` : '.'));
  }
  async function memberAct(act, uid) {
    const patch = { approve: { status: 'approved' }, block: { status: 'blocked' }, 'make-admin': { role: 'admin' }, 'make-teacher': { role: 'teacher' } }[act];
    try {
      if (act === 'remove') await C.removeMember(uid); else await C.setMember(uid, patch);
      renderAdmin();
    } catch (e) { toast(errText(e), true); }
  }

  /* ---------- Үйлдлүүд ---------- */
  const armed = {};
  const confirm2 = (btn, key, label) => {
    if (armed[key] && Date.now() - armed[key] < 4000) { delete armed[key]; return true; }
    armed[key] = Date.now(); btn.textContent = label; return false;
  };
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act, f = S.files.find(x => x.id === b.dataset.id);
    if (act === 'send') return sendCode(b);
    if (act === 'verify') return verify(b);
    if (act === 'relogin') return renderLogin();
    if (act === 'logout') { await forgetOffline(); if (C) await C.signOut().catch(() => {}); location.hash = ''; location.reload(); return; }
    if (act === 'grade') { S.grade = Number(b.dataset.g); try { localStorage.setItem('lib-grade', S.grade); } catch (err) {} return renderLibrary(); }
    if (act === 'add-lesson') {
      const sec = b.closest('.chapter');
      if (sec.querySelector('.inline-add')) return;
      b.insertAdjacentHTML('beforebegin', `<div class="form-row inline-add"><input placeholder="Нэмэлт хичээлийн нэр"><button class="btn primary" data-act="add-lesson-go" data-ch="${esc(b.dataset.ch)}">Нэмэх</button></div>`);
      sec.querySelector('.inline-add input').focus();
      return;
    }
    if (act === 'add-lesson-go') return addLesson(b.dataset.ch, b.previousElementSibling.value);
    if (act === 'new-chapter') return addLesson($('#nc-ch').value.trim() || 'Нэмэлт', $('#nc-title').value);
    if (act === 'view' && f) return openFile(f, false);
    if (act === 'play' && f) { e.preventDefault(); return openFile(f, false, true); }
    if (act === 'to-ch') { e.preventDefault(); const sec = document.getElementById('ch-' + b.dataset.ch); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (act === 'save-all') return saveMany(S.files.filter(x => x.kind === 'screen'), b);
    if (act === 'save-topic') return saveMany(S.current && S.current.lesson ? filesOf(S.current.lesson.id) : [], b);
    if (act === 'to-sec') { e.preventDefault(); const sec = document.getElementById(b.dataset.sec); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (act === 'download' && f) return openFile(f, true);
    if (act === 'v-close') return closeViewer();
    if (act === 'copy-game') { const u = b.dataset.url || GAME_URL; try { await navigator.clipboard.writeText(u); toast('Хаяг хуулагдлаа: ' + u); } catch (err) { toast(u); } return; }
    if (act === 'map-open') { const m = mapsOf(S.current.grade, S.current.code)[+b.dataset.mi]; if (m && window.LIB_MAPVIEW) { closeViewer(); window.LIB_MAPVIEW.open(m, $('#viewer')); } return; }
    if (act === 'v-full') { const el = $('#viewer .v-body'); if (el.requestFullscreen) el.requestFullscreen().catch(() => {}); return; }
    if (act === 'plan-filter') { planFilter = b.dataset.m; return renderLesson(S.current.lesson); }
    if (act === 'del-file' && f) {
      if (!confirm2(b, 'f' + f.id, 'Дахин дарж устгана')) return;
      try { await C.removeFile(f); S.files = S.files.filter(x => x.id !== f.id); toast('Файл устгагдлаа.'); renderLesson(S.current.lesson); } catch (err) { toast(errText(err), true); }
      return;
    }
    if (act === 'edit-file' && f) {
      const li = b.closest('.file');
      li.outerHTML = `<li class="file editing"><div class="form-row"><input id="ef-title" value="${esc(f.title)}" aria-label="Нэр">${f.kind === 'plan' ? `<input id="ef-method" value="${esc(f.method)}" list="methods-list" aria-label="Арга зүй">` : ''}<button class="btn sm primary" data-act="save-file" data-id="${f.id}">Хадгалах</button><button class="btn sm ghost" data-act="cancel-edit">Болих</button></div></li>`;
      return;
    }
    if (act === 'cancel-edit') return renderLesson(S.current.lesson);
    if (act === 'save-file' && f) {
      const patch = { title: $('#ef-title').value.trim() || f.title };
      if ($('#ef-method')) patch.method = $('#ef-method').value.trim();
      try { Object.assign(f, await C.updateFile(f.id, patch)); renderLesson(S.current.lesson); } catch (err) { toast(errText(err), true); }
      return;
    }
    if (act === 'rename-lesson') {
      const l = S.current.lesson, h1 = $('.head-row h1');
      h1.outerHTML = `<div class="form-row"><input id="rl-title" value="${esc(l.title)}" aria-label="Хичээлийн нэр"><button class="btn sm primary" data-act="save-lesson">Хадгалах</button><button class="btn sm ghost" data-act="cancel-edit">Болих</button></div>`;
      return;
    }
    if (act === 'save-lesson') {
      const l = S.current.lesson, title = $('#rl-title').value.trim();
      if (!title) return;
      try { Object.assign(l, await C.saveLesson(Object.assign({}, l, { title }))); renderLesson(l); } catch (err) { toast(errText(err), true); }
      return;
    }
    if (act === 'del-lesson') {
      const l = S.current.lesson;
      if (!confirm2(b, 'l' + l.id, 'Бүх файлын хамт устгах уу? Дахин дар')) return;
      try { await C.deleteLesson(l.id, S.files); S.files = S.files.filter(x => x.lesson_id !== l.id); S.lessons = S.lessons.filter(x => x.id !== l.id); toast('Хичээл устгагдлаа.'); location.hash = '#/'; } catch (err) { toast(errText(err), true); }
      return;
    }
    if (act === 'del-sch') {
      if (!confirm2(b, 's' + b.dataset.id, 'Дахин дар')) return;
      try { await C.deleteSchedule(b.dataset.id); S.schedule = S.schedule.filter(x => x.id !== b.dataset.id); renderSchedule(); } catch (err) { toast(errText(err), true); }
      return;
    }
    if (act === 'import-go') return importDir(b);
    if (['approve', 'block', 'make-admin', 'make-teacher', 'remove'].includes(act)) return memberAct(act, b.dataset.uid);
  });
  document.addEventListener('submit', e => {
    const form = e.target;
    if (form.classList.contains('upload')) { e.preventDefault(); upload(form); }
    if (form.id === 'sch-form') { e.preventDefault(); saveSchedule(form); }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeViewer(); });

  boot();
})();
