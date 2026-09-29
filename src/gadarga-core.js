// Үндсэн төлөв: тоглогч, хадгалалт (db эсвэл энэ хөтөч), багшийн зөвшөөрөл ба ангийн код, цэс солих.
(function () {
  'use strict';
  const G = window.GAME;
  const { LEVELS } = window.GADARGA;
  const AV = window.GADARGA_AVATAR;
  const $ = G.$;

  Object.assign(G, {
    LINK: 'https://claude.ai/artifact/WktREHcTyj8nHbEAd6Bf4Q',
    screen: 'loading', mode: 'local', uid: null, isOwner: false, isAdmin: false,
    db: null, user: null, me: null, players: {}, approvals: {}, classHash: '', classCode: '', localNote: ''
  });

  const SCREENS = ['loading', 'blocked', 'login', 'create', 'wait', 'home', 'games', 'levels', 'map', 'rooms', 'room', 'board', 'profiles', 'teacher', 'play', 'result'];
  const NAV_SCREENS = { home: 'home', games: 'games', levels: 'games', map: 'games', rooms: 'games', room: 'games', board: 'board', profiles: 'profiles', teacher: 'teacher' };
  G.show = function (name) {
    G.screen = name;
    document.body.dataset.screen = name;
    SCREENS.forEach(n => { const el = $('#' + n); if (el) el.hidden = n !== name; });
    const tab = NAV_SCREENS[name];
    $('#nav').hidden = !tab;
    document.querySelectorAll('.nav-btn').forEach(b => {
      if (b.dataset.nav === tab) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    if (tab) G.renderNav();
    window.scrollTo(0, 0);
  };
  const RENDER = { home: 'renderHome', games: 'renderGames', levels: 'renderLevels', map: 'renderMap', rooms: 'renderRooms', room: 'renderRoom', board: 'renderBoard', profiles: 'renderProfiles', teacher: 'renderTeacher' };
  G.nav = function (name) {
    if (G.inRound()) return;
    const r = RENDER[name];
    if (!r || (name === 'teacher' && !G.isAdmin)) return;
    if (!G.me && name !== 'profiles' && name !== 'board') return G.route();
    if (['games', 'board', 'rooms', 'room'].includes(name)) G.syncPull();
    G[r]();
    G.show(name);
  };
  // Одоогийн дэлгэцийг гүйлгэлтийг нь хөндөхгүйгээр дахин зурна.
  G.refresh = function () {
    const r = RENDER[G.screen];
    if (r && G.screen !== 'map') G[r]();
    if (NAV_SCREENS[G.screen]) G.renderNav();
  };
  G.goHome = () => G.nav('home');

  const now = () => new Date().toISOString();
  const ITEM_IDS = AV.ITEMS.filter(i => i.price).map(i => i.id);
  G.newPlayer = (nick, avatar) => ({ nick, avatar: AV.normalize(avatar), total: 0, spent: 0, owned: [], levels: {}, reward: false, rounds: 0, mapSeen: [], joinHash: '', rooms: [], roomsMade: 0, created: now(), updated: now() });
  G.normalizePlayer = function (p) {
    p = p && typeof p === 'object' ? p : {};
    const siteIds = window.GADARGA_ROCKS.SITES.map(s => s.id);
    return {
      nick: typeof p.nick === 'string' ? p.nick.slice(0, 20) : '',
      avatar: AV.normalize(p.avatar),
      total: Math.max(0, Math.floor(Number(p.total) || 0)),
      spent: Math.max(0, Math.floor(Number(p.spent) || 0)),
      owned: Array.isArray(p.owned) ? p.owned.filter(id => ITEM_IDS.includes(id)) : [],
      levels: p.levels && typeof p.levels === 'object' ? JSON.parse(JSON.stringify(p.levels)) : {},
      reward: !!p.reward, rounds: Number(p.rounds) || 0,
      mapSeen: Array.isArray(p.mapSeen) ? p.mapSeen.filter(id => siteIds.includes(id)) : [],
      joinHash: typeof p.joinHash === 'string' ? p.joinHash : '',
      email: typeof p.email === 'string' ? p.email.slice(0, 254) : '',
      rooms: Array.isArray(p.rooms) ? [...new Set(p.rooms.filter(c => /^[A-Z0-9]{6}$/.test(c)))].slice(0, 12) : [],
      roomsMade: Math.max(0, Math.floor(Number(p.roomsMade) || 0)),
      created: String(p.created || ''), updated: String(p.updated || '')
    };
  };
  G.balance = p => Math.max(0, (p.total || 0) - (p.spent || 0));

  /* ---------- Цол: нийт оноогоор тал нутгаас дэлхийн мастер хүртэл ахина ---------- */
  G.TITLES = [
    { need: 0, name: 'Шинэхэн' },
    { need: 20, name: 'Аялагч' },
    { need: 50, name: 'Судлаач' },
    { need: 100, name: 'Мэдлэгтэн' },
    { need: 150, name: 'Шинжээч' },
    { need: 200, name: 'Эрдэмтэн' },
    { need: 300, name: 'Мастер' },
    { need: 400, name: 'Их мастер' },
    { need: 500, name: 'Домог' }
  ];
  G.titleOf = function (total) {
    let i = 0;
    G.TITLES.forEach((t, j) => { if ((total || 0) >= t.need) i = j; });
    return { i, name: G.TITLES[i].name, next: G.TITLES[i + 1] || null };
  };
  G.PLACE_TITLES = ['Алт', 'Мөнгө', 'Хүрэл'];
  G.levelOpen = function (n) {
    if (n === 1) return true;
    const prev = G.me && G.me.levels[String(n - 1)];
    return !!(prev && prev.passed);
  };
  G.passedCount = p => (typeof p.passedN === 'number' ? p.passedN
    : LEVELS.filter(l => !l.free && p.levels && p.levels[l.n] && p.levels[l.n].passed).length);

  /* ---------- Тэргүүлэгчдийн самбар: бусдад харагдах цорын ганц мэдээлэл ---------- */
  G.board = {};
  // Бусдад харагдах амжилтын үзүүлэлтүүд.
  G.pubStats = p => p.pub || {
    items: (p.owned || []).length, seen: (p.mapSeen || []).length, rounds: p.rounds || 0,
    bestFree: (p.levels && p.levels['6'] && p.levels['6'].best) || 0,
    bestMap: (p.levels && p.levels.map && p.levels.map.best) || 0
  };
  G.boardDoc = me => Object.assign({
    nick: me.nick, avatar: AV.normalize(me.avatar), total: me.total, passed: G.passedCount(me),
    reward: !!me.reward, joinHash: me.joinHash || '', rooms: (me.rooms || []).slice(0, 12), updated: me.updated || now()
  }, G.pubStats(me));
  const num = (v, max) => Math.max(0, Math.min(max, Math.floor(Number(v) || 0)));
  G.fromBoard = d => {
    const p = G.normalizePlayer(d);
    p.passedN = num(d && d.passed, 5);
    p.pub = { items: num(d.items, 99), seen: num(d.seen, 99), rounds: num(d.rounds, 1e6), bestFree: num(d.bestFree, 999), bestMap: num(d.bestMap, 999) };
    return p;
  };

  /* ---------- Зөвшөөрөл ---------- */
  const joinOf = id => (id === G.uid && G.me ? G.me.joinHash
    : (G.players[id] && G.players[id].joinHash) || (G.board[id] && G.board[id].joinHash) || '');
  const codeOk = id => !!G.classHash && joinOf(id) === G.classHash;
  // Админууд (үүсгэгч ба Editor эрхтэй хүмүүс) staff/ жагсаалтад өөрсдийгөө бүртгэнэ.
  G.staff = {};
  const isStaff = id => !!G.staff[id];
  // Багшийн (админы) үүсгэсэн «Анги» өрөөний кодоор нэгдсэн сурагч шууд зөвшөөрөгдөнө.
  G.rooms = {};
  const roomsOf = id => (id === G.uid && G.me ? G.me.rooms
    : (G.players[id] && G.players[id].rooms) || (G.board[id] && G.board[id].rooms) || []);
  const inStaffRoom = id => (Array.isArray(roomsOf(id)) ? roomsOf(id) : []).some(c => G.rooms[c] && isStaff(G.rooms[c].owner));
  G.approved = id => (id === G.uid && G.isAdmin) || isStaff(id) || !!(G.approvals[id] && G.approvals[id].ok === true) ||
    (!(G.approvals[id] && G.approvals[id].ok === false) && (codeOk(id) || inStaffRoom(id)));
  G.declined = id => !!(G.approvals[id] && G.approvals[id].ok === false);
  G.pendingIds = () => Object.keys(G.players).filter(id => !G.approvals[id] && !(id === G.uid && G.isAdmin) && !isStaff(id) && !codeOk(id) && !inStaffRoom(id));
  G.autoJoinOk = id => codeOk(id) || inStaffRoom(id);
  G.isStaffRoom = code => !!(G.rooms[code] && isStaff(G.rooms[code].owner));

  /* ---------- Энэ төхөөрөмж дээрх олон тоглогч (файл апп, интернэтгүй горим) ---------- */
  const LKEY = 'gadarga3-local';
  let local = { cur: null, list: {} };
  const newId = () => 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function loadLocal() {
    try {
      const v = JSON.parse(localStorage.getItem(LKEY) || 'null');
      if (v && v.list && typeof v.list === 'object') local = { cur: v.cur || null, list: v.list };
    } catch (e) {}
    if (!Object.keys(local.list).length) {
      try {
        const old = JSON.parse(localStorage.getItem('gadarga2-me') || 'null');
        if (old) { const id = newId(); local.list[id] = old; local.cur = id; }
      } catch (e) {}
    }
  }
  function storeLocal() { try { localStorage.setItem(LKEY, JSON.stringify(local)); } catch (e) {} }
  G.localProfiles = () => Object.keys(local.list).map(id => ({ id, p: id === local.cur && G.me ? G.me : G.normalizePlayer(local.list[id]), me: id === local.cur }));
  G.switchProfile = function (id) {
    if (!local.list[id]) return;
    if (G.loginOn() && !G.auth[id]) { G.loginPrefill = local.list[id].email || ''; return G.openLogin(); }
    local.cur = id; storeLocal();
    G.me = G.normalizePlayer(local.list[id]);
    G.nav('home');
  };
  G.deleteProfile = function (id) {
    delete local.list[id];
    if (G.auth[id]) G.logout(id);
    if (local.cur === id) { local.cur = null; G.me = null; }
    storeLocal();
  };
  G.newLocalProfile = function () { local.cur = null; G.me = null; storeLocal(); if (G.loginOn()) G.openLogin(); else G.openEditor(true); };

  /* ---------- Ангийн нэгдсэн самбар (Google Sheets) ----------
     Апп файлд (Claude-аас гадуур) өөр төхөөрөмжийн тоглогчдыг өрсөлдөгчдийн самбарт нэмнэ.
     Claude-ийн хуудас гадагш хандахыг хаадаг тул тэнд ашиглахгүй. */
  const SYNC_KEY = 'gadarga';
  G.remote = {}; G.syncState = 'off';
  G.syncAllowed = () => G.mode === 'local' && !window.claude;
  G.validSyncUrl = u => /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(String(u || '').trim()) ||
    // Зөвхөн туршилтын серверт (localhost) хуурамч хүснэгтийг зөвшөөрнө.
    (/^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /^http:\/\/localhost:\d+\/mock-sheet$/.test(String(u || '').trim()));
  G.syncUrl = () => {
    let u = '';
    try { u = localStorage.getItem('gadarga-sync-url') || ''; } catch (e) {}
    u = u || window.GADARGA_SYNC_URL || '';
    return G.validSyncUrl(u) ? u.trim() : '';
  };
  G.setSyncUrl = u => {
    try { localStorage.setItem('gadarga-sync-url', u ? u.trim() : ''); } catch (e) {}
    G.remote = {}; G.syncState = 'off';
    G.syncPush(); G.syncPull(true);
  };
  let pushTimer = 0, pulling = false, lastPull = 0, pendingPush = false, pendingRooms = [];
  const post = (url, obj) => fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(obj) });
  // Нэвтэрсэн тоглогчийн ахиц (хувийн) ба самбарын мэдээлэл (нийтийн)-ийг серверт хадгална.
  G.syncPush = function () {
    const url = G.syncUrl(), a = G.auth[local.cur];
    if (!G.syncAllowed() || !url || !G.me || !local.cur || !a) return;
    pendingPush = true;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const body = { action: 'save', email: a.email, token: a.token, profile: G.me, board: G.boardDoc(G.me) };
      api(body).then(res => {
        if (res && res.error === 'auth') { G.logout(); G.loginMsg = 'Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.'; if (!G.inRound()) G.route(); return; }
        if (res && res.ok) { pendingPush = false; setTimeout(() => G.syncPull(true), 1500); } else G.syncState = 'error';
      });
    }, 800);
  };

  /* ---------- Имэйлээр нэвтрэх: багшийн Google скрипт имэйл рүү 6 оронтой код илгээнэ ---------- */
  const AUTH = 'gadarga-auth';
  G.auth = {};
  try {
    const a = JSON.parse(localStorage.getItem(AUTH) || '{}') || {};
    Object.keys(a).forEach(id => { if (a[id] && a[id].email && a[id].token) G.auth[id] = { email: String(a[id].email), token: String(a[id].token) }; });
  } catch (e) {}
  const storeAuth = () => { try { localStorage.setItem(AUTH, JSON.stringify(G.auth)); } catch (e) {} };
  const api = obj => fetch(G.syncUrl(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ key: SYNC_KEY }, obj)) })
    .then(r => r.json()).catch(() => ({ ok: false, error: 'network' }));
  G.loginOn = () => G.syncAllowed() && !!G.syncUrl();
  G.isLoggedIn = () => !!(local.cur && G.auth[local.cur]);
  G.cleanEmail = e => String(e || '').trim().toLowerCase().slice(0, 254);
  G.validEmail = e => /^[a-z0-9][a-z0-9._%+-]{0,63}@[a-z0-9.-]{1,190}\.[a-z]{2,}$/.test(G.cleanEmail(e));
  G.sendLoginCode = email => api({ action: 'sendCode', email: G.cleanEmail(email) });
  G.verifyLogin = async function (email, code) {
    const e = G.cleanEmail(email);
    const res = await api({ action: 'verify', email: e, code: String(code || '').replace(/\D/g, '') });
    if (!res || !res.ok || typeof res.id !== 'string' || typeof res.token !== 'string') return { ok: false, error: (res && res.error) || 'network' };
    const id = res.id.slice(0, 40);
    G.auth[id] = { email: e, token: res.token }; storeAuth();
    local.cur = id; storeLocal();
    const sp = res.profile && typeof res.profile === 'object' ? G.normalizePlayer(res.profile) : null;
    const lp = local.list[id] ? G.normalizePlayer(local.list[id]) : null;
    const p = sp && (!lp || sp.updated >= lp.updated) ? sp : lp;
    if (p) { p.email = e; local.list[id] = p; storeLocal(); G.me = p; } else G.me = null;
    return { ok: true, id, hasProfile: !!p };
  };
  // Нэвтрээгүй үедээ энэ төхөөрөмж дээр тоглосон ахицыг шинэ бүртгэлд шилжүүлэх боломж.
  G.unlinkedProfiles = () => Object.keys(local.list)
    .filter(id => !G.auth[id] && !(local.list[id] && local.list[id].email))
    .map(id => ({ id, p: G.normalizePlayer(local.list[id]) }));
  G.adoptProfile = function (fromId) {
    const id = local.cur, a = G.auth[id];
    if (!a || !local.list[fromId]) return false;
    const p = G.normalizePlayer(local.list[fromId]);
    p.email = a.email;
    delete local.list[fromId];
    local.list[id] = p; storeLocal();
    G.me = p; G.save();
    return true;
  };
  G.logout = function (id) {
    id = id || local.cur;
    const a = G.auth[id];
    if (a && G.syncUrl()) api({ action: 'logout', email: a.email, token: a.token });
    delete G.auth[id]; storeAuth();
    if (id === local.cur) { G.me = null; local.cur = null; storeLocal(); }
  };
  // Серверт илүү шинэ ахиц байвал (өөр төхөөрөмж дээр тоглосон) татаж авна.
  G.accountLoad = async function () {
    const a = G.auth[local.cur];
    if (!G.loginOn() || !a) return;
    const res = await api({ action: 'load', email: a.email, token: a.token });
    if (res && res.error === 'auth') { G.logout(); G.loginMsg = 'Нэвтрэх хугацаа дууссан. Дахин нэвтэрнэ үү.'; if (!G.inRound()) G.route(); return; }
    if (res && res.ok && res.profile && typeof res.profile === 'object' && !G.inRound()) {
      const sp = G.normalizePlayer(res.profile);
      if (!G.me || sp.updated > G.me.updated) { sp.email = a.email; G.me = sp; local.list[local.cur] = sp; storeLocal(); G.refresh(); G.renderNav && G.renderNav(); }
    }
  };
  // Шинэ өрөөг хүснэгтэд бүртгэнэ. Интернэтгүй бол дараа илгээнэ.
  G.syncRoom = function (room) {
    const url = G.syncUrl();
    if (!G.syncAllowed() || !url) return;
    post(url, { key: SYNC_KEY, action: 'room', room }).then(() => {}, () => { pendingRooms.push(room); });
  };
  function flushPending() {
    const url = G.syncUrl();
    if (!url) return;
    if (pendingPush) G.syncPush();
    const rs = pendingRooms.splice(0);
    rs.forEach(r => G.syncRoom(r));
  }
  window.addEventListener('online', () => { flushPending(); G.syncPull(true); });

  // Интернэтгүй үед сүүлд татсан самбарыг харуулахын тулд хадгална.
  const CACHE = 'gadarga-remote-cache';
  G.syncCachedAt = '';
  function loadCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (c && c.url === G.syncUrl()) { G.remote = c.list || {}; G.remoteRooms = c.rooms || {}; G.syncCachedAt = c.at || ''; }
    } catch (e) {}
  }
  function saveCache() {
    try { localStorage.setItem(CACHE, JSON.stringify({ url: G.syncUrl(), at: now(), list: G.remote, rooms: G.remoteRooms })); } catch (e) {}
    G.syncCachedAt = now();
  }
  G.remoteRooms = {};
  G.syncPull = function (force) {
    const url = G.syncUrl();
    if (!G.syncAllowed() || !url) { G.syncState = 'off'; return Promise.resolve(); }
    if (pulling || (!force && Date.now() - lastPull < 10000)) return Promise.resolve();
    pulling = true; lastPull = Date.now();
    if (G.syncState !== 'ok') G.syncState = 'loading';
    return fetch(url + '?t=' + Date.now())
      .then(r => r.json())
      .then(j => {
        const m = {};
        (Array.isArray(j && j.list) ? j.list : []).slice(0, 300).forEach(row => {
          if (row && row.id && typeof row.id === 'string') {
            if (typeof row.rooms === 'string') row.rooms = row.rooms.split(',');
            m[row.id.slice(0, 40)] = row;
          }
        });
        const rm = {};
        (Array.isArray(j && j.rooms) ? j.rooms : []).slice(0, 500).forEach(r => { const v = G.cleanRoom(r); if (v) rm[v.code] = v; });
        G.remote = m; G.remoteRooms = rm; G.syncState = 'ok';
        saveCache(); G.mergeRooms(); flushPending();
      }, () => { G.syncState = 'error'; })
      .then(() => { pulling = false; if (G.mode === 'local' && !G.inRound()) G.refresh(); });
  };

  G.rankedPlayers = function () {
    if (G.mode === 'local') {
      const locals = G.localProfiles(), mine = new Set(locals.map(r => r.id));
      // Хүснэгтээс ирсэн болон кодоор нэмсэн тоглогчид. Нэг хүн хоёуланд байвал шинэ нь үлдэнэ.
      const pool = {};
      [G.remote, G.cards].forEach(src => Object.keys(src).forEach(id => {
        if (mine.has(id)) return;
        const d = src[id];
        if (!pool[id] || String(d.updated || '') > String(pool[id].updated || '')) pool[id] = d;
      }));
      const others = Object.keys(pool).map(id => ({ id, p: G.fromBoard(pool[id]), me: false, remote: true, viaCode: !!pool[id].viaCode, at: pool[id].updated }));
      return locals.concat(others).sort((a, b) => b.p.total - a.p.total);
    }
    // Нийтийн самбар (board) дээрх зөвшөөрөгдсөн сурагчид. Багш өөрөө жагсаалтад орохгүй.
    return Object.keys(G.board).filter(id => G.approved(id) && !(id === G.uid && G.isAdmin) && !isStaff(id))
      .map(id => ({ id, p: id === G.uid && G.me ? G.me : G.fromBoard(G.board[id]), me: id === G.uid }))
      .sort((a, b) => b.p.total - a.p.total);
  };
  // room өгвөл зөвхөн тухайн өрөөний гишүүдийн дундах байр.
  G.myRank = function (room) {
    let list = G.rankedPlayers();
    if (room) list = list.filter(r => Array.isArray(r.p.rooms) && r.p.rooms.includes(room));
    const i = list.findIndex(r => r.me);
    return { list, rank: i >= 0 ? i + 1 : 0 };
  };

  /* ---------- Өрөөнүүд: Анги ба Найзууд ---------- */
  const ROOM_RE = /^[A-Z0-9]{6}$/;
  G.ROOM_TYPES = { class: 'Анги', friends: 'Найзууд' };
  G.cleanRoom = r => {
    if (!r || !ROOM_RE.test(String(r.code || ''))) return null;
    return {
      code: String(r.code), name: String(r.name || '').replace(/^'/, '').slice(0, 24) || 'Өрөө',
      type: r.type === 'friends' ? 'friends' : 'class', owner: String(r.owner || '').slice(0, 40),
      ownerNick: String(r.ownerNick || '').replace(/^'/, '').slice(0, 20), created: String(r.created || '')
    };
  };
  const LROOMS = 'gadarga-rooms';
  G.localRooms = {};
  try { const v = JSON.parse(localStorage.getItem(LROOMS) || '{}'); Object.keys(v || {}).forEach(k => { const r = G.cleanRoom(v[k]); if (r) G.localRooms[r.code] = r; }); } catch (e) {}
  G.onlineRooms = {};
  G.mergeRooms = () => { G.rooms = Object.assign({}, G.cardRooms, G.localRooms, G.remoteRooms, G.onlineRooms); };

  /* ---------- Интернэтгүй солилцоо: онооны код ба хадгалах код ----------
     Онооны код (GDG1): нэр, аватар, оноо, өрөөнүүд. Найз руугаа чатаар явуулна.
     Хадгалах код (GDGS): бүх ахиц. Хадгалалт алдагдвал эсвэл өөр төхөөрөмжид шилжихэд сэргээнэ. */
  const CARDS = 'gadarga-cards', CROOMS = 'gadarga-card-rooms';
  G.cards = {}; G.cardRooms = {};
  try {
    const c = JSON.parse(localStorage.getItem(CARDS) || '{}') || {};
    Object.keys(c).forEach(id => { if (c[id] && typeof c[id].nick === 'string') G.cards[id] = c[id]; });
    const r = JSON.parse(localStorage.getItem(CROOMS) || '{}') || {};
    Object.keys(r).forEach(k => { const v = G.cleanRoom(r[k]); if (v) G.cardRooms[v.code] = v; });
  } catch (e) {}
  const storeCards = () => { try { localStorage.setItem(CARDS, JSON.stringify(G.cards)); localStorage.setItem(CROOMS, JSON.stringify(G.cardRooms)); } catch (e) {} };

  const b64e = s => { let bin = ''; new TextEncoder().encode(s).forEach(x => { bin += String.fromCharCode(x); }); return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
  const b64d = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)));
  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  const encode = (pre, obj) => { const j = JSON.stringify(obj); return pre + '.' + b64e(j) + '.' + fnv(j); };
  const decode = (pre, code) => {
    const m = String(code || '').replace(/\s+/g, '').match(new RegExp('^' + pre + '\\.([A-Za-z0-9_-]+)\\.([a-z0-9]+)$'));
    if (!m) return null;
    try { const j = b64d(m[1]); return fnv(j) === m[2] ? JSON.parse(j) : null; } catch (e) { return null; }
  };
  const roomTuples = codes => codes.map(c => { const r = G.roomOf(c); return [c, r.name, r.type === 'friends' ? 1 : 0, r.ownerNick || '']; });
  const fromTuples = list => (Array.isArray(list) ? list : []).slice(0, 12)
    .map(x => (Array.isArray(x) ? G.cleanRoom({ code: x[0], name: x[1], type: x[2] ? 'friends' : 'class', ownerNick: x[3] }) : null)).filter(Boolean);

  G.myCard = function () {
    const me = G.me, pub = G.boardDoc(me);
    return encode('GDG1', { v: 1, id: local.cur, n: me.nick, av: pub.avatar, s: me.total, p: pub.passed, rw: pub.reward ? 1 : 0,
      st: [pub.items, pub.seen, pub.rounds, pub.bestFree, pub.bestMap], rm: roomTuples(me.rooms), at: now() });
  };
  G.importCard = function (code) {
    const d = decode('GDG1', code);
    if (!d || typeof d.id !== 'string' || typeof d.n !== 'string') return { error: 'Код буруу эсвэл дутуу хуулагдсан байна. Кодыг бүтнээр нь хуулна уу.' };
    const id = d.id.slice(0, 40);
    if (local.list[id]) return { error: 'Энэ бол энэ төхөөрөмж дээрх тоглогчийн өөрийнх нь код байна.' };
    const at = String(d.at || '');
    if (G.cards[id] && String(G.cards[id].updated || '') > at) return { error: 'Энэ тоглогчийн илүү шинэ код аль хэдийн орсон байна.' };
    const rooms = fromTuples(d.rm);
    rooms.forEach(r => { if (!G.localRooms[r.code] && !G.remoteRooms[r.code]) G.cardRooms[r.code] = r; });
    const st = Array.isArray(d.st) ? d.st : [];
    G.cards[id] = { id, nick: d.n.slice(0, 20), avatar: AV.normalize(d.av), total: d.s, passed: d.p, reward: !!d.rw,
      items: st[0], seen: st[1], rounds: st[2], bestFree: st[3], bestMap: st[4], rooms: rooms.map(r => r.code), updated: at, viaCode: true };
    storeCards(); G.mergeRooms();
    return { nick: G.cards[id].nick, total: Math.floor(Number(d.s) || 0), shared: rooms.filter(r => G.me && G.me.rooms.includes(r.code)).map(r => r.name) };
  };
  G.removeCard = id => { delete G.cards[id]; storeCards(); };

  // Энэ хөтөч ахицыг хадгалж чадах эсэх. Боломжтой бол хөтчөөс устгахгүй байхыг хүснэ.
  G.storageOk = (() => {
    try { const k = '__gadarga_test'; localStorage.setItem(k, '1'); const ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k); return ok; } catch (e) { return false; }
  })();
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {}); } catch (e) {}
  G.mergeRooms();
  G.roomOf = code => G.rooms[code] || { code, name: 'Өрөө ' + G.formatCode(code), type: 'class', owner: '', ownerNick: '' };
  G.cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Өрөө үүсгэх эрх: эхэндээ 1, нийт оноо 100 хүрэх бүрд +1. Багш хязгааргүй.
  G.roomTokens = p => (G.mode === 'shared' && G.isAdmin ? Infinity : Math.max(0, 1 + Math.floor((p.total || 0) / 100) - (p.roomsMade || 0)));
  G.nextTokenAt = p => (Math.floor((p.total || 0) / 100) + 1) * 100;

  G.createRoom = async function (name, type) {
    const me = G.me;
    if (!me || G.roomTokens(me) < 1) return { error: 'Өрөө үүсгэх эрх алга байна.' };
    const nm = String(name || '').trim().slice(0, 24);
    if (!nm) return { error: 'Өрөөний нэрээ бичнэ үү.' };
    const ALPHA_R = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    do {
      const r = (window.crypto && crypto.getRandomValues) ? crypto.getRandomValues(new Uint32Array(6)) : Array.from({ length: 6 }, () => Math.random() * 1e9);
      code = [...r].map(v => ALPHA_R[Math.floor(v) % ALPHA_R.length]).join('');
    } while (G.rooms[code]);
    const owner = G.mode === 'shared' ? G.uid : (local.cur || '');
    const room = { code, name: nm, type: type === 'friends' ? 'friends' : 'class', owner, ownerNick: me.nick, created: now() };
    if (G.mode === 'shared') {
      const mine = Object.values(G.onlineRooms).filter(r => r.owner === G.uid).concat([room]);
      try { await G.db.doc('roomsby/' + G.uid).set({ rooms: mine }); } catch (e) { return { error: 'Өрөө хадгалж чадсангүй. Дахин оролдоно уу.' }; }
      G.onlineRooms[code] = room;
    } else {
      G.localRooms[code] = room;
      try { localStorage.setItem(LROOMS, JSON.stringify(G.localRooms)); } catch (e) {}
      G.syncRoom(room);
    }
    G.mergeRooms();
    me.roomsMade = (me.roomsMade || 0) + 1;
    if (!me.rooms.includes(code)) me.rooms.push(code);
    await G.save();
    return { room };
  };
  G.joinRoom = async function (raw) {
    const code = G.cleanCode(raw), me = G.me;
    if (!ROOM_RE.test(code)) return { error: 'Код 6 тэмдэгттэй байх ёстой (жишээ нь ABC-123).' };
    if (me.rooms.includes(code)) return { room: G.roomOf(code), already: true };
    if (G.mode === 'shared' && !G.rooms[code]) return { error: 'Ийм кодтой өрөө олдсонгүй.' };
    if (me.rooms.length >= 12) return { error: 'Нэг хүн 12-оос олон өрөөнд нэгдэх боломжгүй.' };
    me.rooms.push(code);
    await G.save();
    return { room: G.roomOf(code) };
  };
  G.leaveRoom = function (code) {
    G.me.rooms = G.me.rooms.filter(c => c !== code);
    G.save();
  };

  /* ---------- Хадгалалт ---------- */
  let chain = Promise.resolve(), retried = false;
  G.save = function () {
    G.me.updated = now();
    if (G.mode === 'local') {
      if (!local.cur) local.cur = newId();
      if (G.auth[local.cur] && !G.me.email) G.me.email = G.auth[local.cur].email;
      local.list[local.cur] = JSON.parse(JSON.stringify(G.me));
      storeLocal();
      G.syncPush();
      return Promise.resolve(true);
    }
    // Вэб сайт (Supabase): багш тайлан дээр сурагчийг таних имэйлийг хувийн мэдээлэлд хадгална.
    if (window.GADARGA_CLOUD && !G.me.email) G.me.email = window.GADARGA_CLOUD.email();
    const data = JSON.parse(JSON.stringify(G.me));
    const pub = G.boardDoc(G.me);
    // Хувийн бүрэн мэдээлэл players/, бусдад харагдах товч мэдээлэл board/ руу.
    const p = chain.then(() => G.db.doc('players/' + G.uid).set(data))
      .then(() => (G.isAdmin ? null : G.db.doc('board/' + G.uid).set(pub)))
      .then(() => { retried = false; return true; }, err => { onWriteError(err); return false; });
    chain = p;
    return p;
  };
  function onWriteError(err) {
    const code = err && err.code;
    if (code === 'invalid_argument' || code === 'not_granted') {
      blocked('Хадгалах эрх алга', window.GADARGA_CLOUD
        ? 'Таны оноог хадгалж чадсангүй. Гараад дахин нэвтэрч үзнэ үү. Дахин гарвал багшдаа хэлнэ үү.'
        : 'Тоглохын тулд багш танд энэ хуудсыг Share цэснээс Contributor эрхтэйгээр хуваалцах хэрэгтэй.');
    } else if (code === 'quota_exceeded') {
      blocked('Хадгалах зай дүүрсэн', 'Тоглогчдын мэдээлэл хадгалах зай дүүрсэн байна. Багшдаа хэлнэ үү.');
    } else if (code === 'unavailable' && !retried) {
      retried = true;
      setTimeout(() => G.save(), 1200 + Math.random() * 1200);
    }
  }
  G.setApproval = function (id, ok) {
    if (!G.db || !G.isAdmin) return Promise.resolve(false);
    return G.db.doc('approvals/' + id).set({ ok: !!ok, at: now() }).then(() => true, () => false);
  };

  /* ---------- Ангийн код ---------- */
  const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cleanCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  async function sha(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  G.codeSupported = () => !!(window.crypto && crypto.subtle && window.TextEncoder);
  G.formatCode = c => (c.length === 6 ? c.slice(0, 3) + '-' + c.slice(3) : c);
  G.makeCode = async function () {
    if (!G.isAdmin || !G.codeSupported()) return false;
    const r = crypto.getRandomValues(new Uint32Array(6));
    const code = [...r].map(v => ALPHA[v % ALPHA.length]).join('');
    const hash = await sha('gadarga:' + code);
    try {
      await G.db.doc('admin/class').set({ code, at: now() });
      await G.db.doc('settings/class').set({ hash, at: now() });
      return true;
    } catch (e) { return false; }
  };
  G.closeCode = async function () {
    if (!G.isAdmin) return false;
    try {
      await G.db.doc('settings/class').set({ hash: '', at: now() });
      await G.db.doc('admin/class').set({ code: '', at: now() });
      return true;
    } catch (e) { return false; }
  };
  // Кодыг шалгана. Зөв бол тоглогчийн мэдээлэлд тэмдэглэнэ.
  G.checkCode = async function (raw) {
    const code = cleanCode(raw);
    if (!code || !G.classHash || !G.codeSupported()) return '';
    const hash = await sha('gadarga:' + code);
    return hash === G.classHash ? hash : '';
  };

  /* ---------- Тоглогчийн үйлдэл ---------- */
  G.saveProfile = async function (nick, avatar, joinHash) {
    if (!G.me) G.me = G.newPlayer(nick, avatar);
    else { G.me.nick = nick; G.me.avatar = AV.normalize(Object.assign({}, G.me.avatar, avatar)); }
    if (joinHash) G.me.joinHash = joinHash;
    const ok = await G.save();
    if (ok && G.mode === 'shared' && G.isAdmin && !G.approvals[G.uid]) G.setApproval(G.uid, true);
    return ok;
  };
  G.buy = function (item) {
    const me = G.me;
    if (!item || !item.price || me.owned.includes(item.id) || G.balance(me) < item.price) return false;
    me.owned.push(item.id);
    me.spent += item.price;
    me.avatar[item.slot] = item.id;
    G.save();
    return true;
  };
  G.wear = function (slot, id) {
    const item = AV.item(slot, id);
    if (!AV.unlocked(item, G.me)) return false;
    G.me.avatar[slot] = item.id;
    G.save();
    return true;
  };
  // Стилийн үүр бүрд: өмссөн зүйл тохирвол түүнийг, эс бөгөөс эзэмшсэн эхний зүйлийг сонгоно.
  // Эзэмшээгүй үүрт хамгийн хямд зүйлийг худалдаж авахаар санал болгоно.
  G.styleChoice = function (sid, p) {
    p = p || G.me;
    return AV.styleSlots(sid).map(slot => {
      const opts = AV.styleItems(sid).filter(i => i.slot === slot);
      const have = opts.find(i => p.avatar[slot] === i.id && AV.unlocked(i, p)) || opts.find(i => AV.unlocked(i, p)) || null;
      return { slot, have, buy: opts.slice().sort((a, b) => a.price - b.price)[0] };
    });
  };
  G.wearStyle = function (sid) {
    const ch = G.styleChoice(sid);
    if (ch.some(c => !c.have)) return false;
    ch.forEach(c => { G.me.avatar[c.slot] = c.have.id; });
    G.save();
    return true;
  };
  G.markSeen = function (id) {
    if (!G.me || G.me.mapSeen.includes(id)) return;
    G.me.mapSeen.push(id);
    G.save();
  };

  /* ---------- Тайлан: тоглолт бүрийн дүн ба алдаа (зөвхөн багш уншина) ---------- */
  const MAX_ROUNDS = 40;
  G.results = {}; G.myResults = null;
  let resultsReady = Promise.resolve(), rchain = Promise.resolve();
  G.recordRound = function (round) {
    if (G.mode !== 'shared' || !G.db) return;
    rchain = rchain.then(() => resultsReady).then(() => {
      const b = G.myResults && typeof G.myResults === 'object' ? JSON.parse(JSON.stringify(G.myResults)) : {};
      const doc = {
        rounds: Array.isArray(b.rounds) ? b.rounds : [],
        misses: b.misses && typeof b.misses === 'object' ? b.misses : {},
        bySec: b.bySec && typeof b.bySec === 'object' ? b.bySec : {},
        answered: Number(b.answered) || 0, correct: Number(b.correct) || 0
      };
      doc.rounds.unshift(Object.assign({ at: now() }, round));
      doc.rounds = doc.rounds.slice(0, MAX_ROUNDS);
      round.ans.forEach(a => { if (!a.ok) doc.misses[a.k] = (doc.misses[a.k] || 0) + 1; });
      Object.keys(round.s).forEach(s => { const a = doc.bySec[s] || [0, 0]; doc.bySec[s] = [a[0] + round.s[s][0], a[1] + round.s[s][1]]; });
      doc.answered += round.n; doc.correct += round.correct; doc.updated = now();
      G.myResults = doc;
      return G.db.doc('results/' + G.uid).set(doc);
    }).catch(() => {});
  };

  G.applyRound = function ({ level, score, passed }) {
    const me = G.me, before = me.total;
    me.total = before + score;
    me.rounds = (me.rounds || 0) + 1;
    const key = String(level), prev = me.levels[key] || { best: 0, passed: false, plays: 0 };
    me.levels[key] = { best: Math.max(prev.best || 0, score), passed: !!(prev.passed || passed), plays: (prev.plays || 0) + 1 };
    let rewardNew = false;
    if (level === 5 && passed && !me.reward) { me.reward = true; rewardNew = true; }
    const newHats = AV.HATS.filter(h => h.need > 0 && before < h.need && me.total >= h.need);
    G.save();
    return { before, after: me.total, newHats, rewardNew };
  };

  /* ---------- Дэлгэц сонгох ---------- */
  function blocked(title, msg) {
    $('#blocked-title').textContent = title;
    $('#blocked-msg').textContent = msg;
    G.show('blocked');
  }
  G.route = function () {
    if (G.mode === 'local' && G.loginOn() && !G.isLoggedIn()) return G.openLogin();
    if (!G.me) return G.mode === 'local' && !G.isLoggedIn() && G.localProfiles().length ? G.nav('profiles') : G.openEditor(true);
    if (G.mode === 'shared' && !G.approved(G.uid)) { G.renderWait(); return G.show('wait'); }
    G.nav('home');
  };

  const autoDone = new Set(), boardFilled = new Set();
  let selfSynced = false;
  function onData() {
    const mine = G.players[G.uid];
    if (mine && !G.inRound() && (!G.me || String(mine.updated || '') >= String(G.me.updated || ''))) {
      G.me = G.normalizePlayer(mine);
    }
    // Багшийн хуудас: зөв кодоор нэгдсэн тоглогчдыг зөвшөөрсөн жагсаалтад бичнэ.
    if (G.isAdmin) Object.keys(G.players).forEach(id => {
      if (!G.approvals[id] && G.autoJoinOk(id) && !autoDone.has(id)) { autoDone.add(id); G.setApproval(id, true); }
      // Өмнөх хувилбарын тоглогчдыг тэргүүлэгчдийн самбарт нэг удаа нэмнэ.
      if (id !== G.uid && !isStaff(id) && !G.board[id] && !boardFilled.has(id)) {
        boardFilled.add(id);
        G.db.doc('board/' + id).set(G.boardDoc(G.normalizePlayer(G.players[id]))).catch(() => {});
      }
    });
    // Сурагч: өөрийн самбарын мэдээлэл дутуу эсвэл хоцорсон бол нэг удаа шинэчилнэ.
    if (!G.isAdmin && G.me && !selfSynced && (!G.board[G.uid] || Number(G.board[G.uid].total) !== G.me.total || !('rounds' in G.board[G.uid]))) {
      selfSynced = true;
      G.db.doc('board/' + G.uid).set(G.boardDoc(G.me)).catch(() => {});
    }
    const s = G.screen;
    if (s === 'loading' || s === 'wait') return G.route();
    if (NAV_SCREENS[s]) {
      if (!G.approved(G.uid)) return G.route();
      G.refresh();
    }
  }

  // Онлайн холболт бүтэлгүйтвэл чимээгүй шилжихгүй: шалтгааныг хэлж, дахин оролдох эсвэл офлайн тоглох сонголт өгнө.
  function offline(reason) {
    $('#blocked-title').textContent = 'Онлайн хадгалалтад холбогдсонгүй';
    $('#blocked-msg').textContent = reason + ' Ингэвэл бусад тоглогч, тэргүүлэгчид харагдахгүй, оноо тань багшид очихгүй. ' +
      (window.GADARGA_CLOUD ? 'Интернэт холболтоо шалгаад дахин оролдоно уу.' : 'Тоглоомыг claude.ai дээрх холбоосоор нээж, Claude бүртгэлээрээ нэвтэрсэн эсэхээ шалгаад дахин оролдоно уу.');
    $('#blocked-actions').hidden = false;
    G.show('blocked');
  }
  G.goOffline = () => {
    $('#blocked-actions').hidden = true;
    startLocal('Офлайн горим: ахиц зөвхөн энэ төхөөрөмжийн хөтөч дээр хадгалагдана. Бусад тоглогчид харагдахгүй.');
  };

  function startLocal(note) {
    G.mode = 'local'; G.isAdmin = false; G.localNote = note;
    loadLocal();
    G.me = local.cur && local.list[local.cur] ? G.normalizePlayer(local.list[local.cur]) : null;
    loadCache(); G.mergeRooms();
    // Хөтөч хадгалж чадахгүй бол (нууц цонх, чатын доторх харагч г.м.) анхааруулна.
    $('#storage-warn').hidden = G.storageOk;
    G.route();
    G.accountLoad();
    // Нэгдсэн самбар тохируулсан бол өөр төхөөрөмжийн тоглогчдыг уншиж, үе үе шинэчилнэ.
    G.syncPull(true);
    setInterval(() => {
      if (document.visibilityState === 'visible' && ['home', 'games', 'board', 'profiles', 'levels'].includes(G.screen)) G.syncPull();
    }, 45000);
  }

  async function boot() {
    G.initPlay();
    G.initUI();
    G.initGames();
    window.GADARGA_TERRAIN.mount($('#terrain'));
    G.show('loading');
    // Вэб сайт (Vercel + Supabase): эхлээд имэйлээр нэвтэрсэн эсэхийг шалгана.
    if (window.GADARGA_CLOUD) {
      document.body.dataset.host = 'cloud';
      G.LINK = location.origin;
      const s = await window.GADARGA_CLOUD.session();
      if (!s) { G.cloudLoginMode = true; return G.openLogin(); }
    } else document.body.dataset.host = window.claude ? 'claude' : 'local';
    const cl = window.claude;
    if (!cl || typeof cl.use !== 'function') return startLocal(window.GADARGA_STANDALONE
      ? 'Файл апп: ахиц энэ төхөөрөмжийн хөтөч дээр хадгалагдана. Интернэт шаардлагагүй.'
      : 'Энэ төхөөрөмж дээрх хувилбар: ахиц зөвхөн энэ хөтөч дээр хадгалагдана.');
    let db = null, user = null, perms = null;
    try { [db, user, perms] = await Promise.all([cl.use('db'), cl.use('user'), cl.use('permissions')]); } catch (e) {}
    if (!db || !user) return offline(!db ? 'Онлайн хадгалалт нээгдсэнгүй.' : 'Нэвтэрсэн хэрэглэгчийн мэдээлэл нээгдсэнгүй.');
    // Хадгалах зөвшөөрөл шаардлагатай бол нэг удаа асууна.
    if (perms) {
      try {
        const st = await perms.state();
        const need = ['db', 'user'].filter(n => st[n] === 'prompt');
        if (need.length) {
          $('#loading .note').textContent = 'Тоглоомд таны оноог хадгалах зөвшөөрөл хэрэгтэй. Гарч ирсэн цонхонд «Allow» (Зөвшөөрөх) дарна уу.';
          await perms.request(need);
        }
        const after = await perms.state();
        if (['db', 'user'].some(n => after[n] === 'denied')) {
          return offline('Хадгалах зөвшөөрөл өгөөгүй байна. Хуудасны Permissions (зөвшөөрөл) цэснээс зөвшөөрөөд дахин оролдоно уу.');
        }
      } catch (e) {}
    }
    const [uid, owner, canEdit] = await Promise.all([user.id(), user.isOwner(), user.canEdit()]);
    if (!uid) return blocked('Нэвтэрч орно уу', 'Тоглохын тулд Claude бүртгэлээрээ нэвтэрсэн байх хэрэгтэй.');
    // Багшийн эрх: хуудсыг үүсгэсэн хүн болон Share цэснээс Editor эрх авсан админ.
    Object.assign(G, { db, user, uid, isOwner: owner, isAdmin: owner || canEdit, mode: 'shared' });
    if (G.isAdmin) db.doc('staff/' + uid).get()
      .then(d => (d.exists ? null : db.doc('staff/' + uid).set({ role: owner ? 'owner' : 'admin', at: now() })))
      .catch(() => {});
    resultsReady = db.doc('results/' + uid).get()
      .then(d => { G.myResults = d.exists ? d.data() : null; }, () => {});

    const got = { p: false, a: false, s: false, b: false, t: false };
    const ready = k => { got[k] = true; if (got.p && got.a && got.s && got.b && got.t) onData(); };
    const subErr = err => {
      const c = err && err.code;
      if (c === 'revoked') blocked('Хандах эрх өөрчлөгдлөө', 'Энэ хуудсанд хандах эрх тань өөрчлөгдсөн байна.');
      else if (['not_granted', 'capability_disabled', 'capability_removed', 'unavailable'].includes(c) && G.screen === 'loading') {
        offline('Онлайн мэдээлэл уншиж чадсангүй (' + c + ').');
      }
    };
    // Удаан хугацаанд ачаалагдахгүй бол хэрэглэгчид мэдэгдэнэ.
    setTimeout(() => { if (G.screen === 'loading') offline('Онлайн мэдээлэл ачаалахад хэт удаж байна.'); }, 20000);
    const toMap = snap => { const m = {}; snap.docs.forEach(d => { if (d.exists) m[d.id] = d.data(); }); return m; };
    // Багш бүх тоглогчийн хувийн мэдээллийг уншина. Сурагч зөвхөн өөрийнхөө мэдээллийг уншина.
    if (G.isAdmin) db.collection('players').onSnapshot(snap => { G.players = toMap(snap); ready('p'); }, subErr);
    else db.doc('players/' + uid).onSnapshot(d => { G.players = d.exists ? { [uid]: d.data() } : {}; ready('p'); }, subErr);
    db.collection('board').onSnapshot(snap => { G.board = toMap(snap); ready('b'); }, subErr);
    db.collection('staff').onSnapshot(snap => { G.staff = toMap(snap); ready('t'); }, subErr);
    // Өрөөнүүд: хүн бүр өөрийн үүсгэсэн өрөөнүүдийг roomsby/<өөрийн id> дотор хадгална.
    db.collection('roomsby').onSnapshot(snap => {
      const m = {};
      snap.docs.forEach(d => {
        const list = d.exists && Array.isArray(d.data().rooms) ? d.data().rooms : [];
        list.slice(0, 50).forEach(r => { const v = G.cleanRoom(r); if (v) { v.owner = d.id; m[v.code] = v; } });
      });
      G.onlineRooms = m; G.mergeRooms();
      if (got.p && got.a && got.s && got.b && got.t) onData();
    }, subErr);
    db.collection('approvals').onSnapshot(snap => { G.approvals = toMap(snap); ready('a'); }, subErr);
    db.doc('settings/class').onSnapshot(d => { G.classHash = (d.exists && d.data().hash) || ''; ready('s'); }, subErr);
    if (G.isAdmin) db.doc('admin/class').onSnapshot(d => {
      G.classCode = (d.exists && d.data().code) || '';
      if (G.screen === 'teacher') G.renderTeacher();
    }, subErr);
    if (G.isAdmin) db.collection('results').onSnapshot(snap => {
      G.results = toMap(snap);
      if (G.screen === 'teacher') G.renderTeacher();
    }, subErr);
  }

  // Туршилтын сервераас бусад газар консолоос тоглоомын төлөв рүү шууд хандах замыг хаана.
  if (!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    try { delete window.GAME; delete window.GADARGA; } catch (e) {}
  }

  boot();
})();
