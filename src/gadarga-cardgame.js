// Хос картын тоглоом (7-р анги): түвшин сонгох, самбар, эргүүлэх, цаг, оноо, дүн.
// Хос бүрийг 30 секундэд олно: 0–10 сек 3 оноо, 10–20 сек 2, 20–30 сек 1. Буруу хос −1. Хос олох бүрд цаг дахин эхэлнэ.
(function () {
  'use strict';
  const G = window.GAME;
  const K = window.GADARGA_CARDS;
  const AV = window.GADARGA_AVATAR;
  const $ = G.$, esc = G.esc;
  const LIMIT = 30, PREVIEW = 3, ZONE = ['Хугацаа дууслаа', '1 оноо', '2 оноо', '3 оноо'];
  const key = n => 'card:' + n;
  const pointsFor = sec => (sec < 10 ? 3 : sec < 20 ? 2 : sec < LIMIT ? 1 : 0);
  G.cardOpen = n => n === 1 || !!(G.me && G.me.levels[key(n - 1)] && G.me.levels[key(n - 1)].passed);
  G.cardsPassed = p => K.LEVELS.filter(l => !l.free && p.levels && p.levels[key(l.n)] && p.levels[key(l.n)].passed).length;
  G.cardsBest = p => Math.max(0, ...K.LEVELS.map(l => ((p.levels && p.levels[key(l.n)]) || {}).best || 0));

  let game = null, raf = 0, timers = [], quitAt = 0;
  const later = (f, ms) => { const t = setTimeout(f, ms); timers.push(t); return t; };
  const clearAll = () => { timers.forEach(clearTimeout); timers = []; clearInterval(raf); };
  const prevInRound = G.inRound;
  G.inRound = () => prevInRound() || (!!game && G.screen === 'cardplay');

  /* ---------- Түвшин сонгох ---------- */
  G.renderCards = function () {
    const me = G.me, N = K.LEVELS.length;
    const stairs = $('#cg-stairs');
    stairs.style.setProperty('--n', N);
    stairs.innerHTML = K.LEVELS.map((l, i) => {
      const st = me.levels[key(l.n)], open = G.cardOpen(l.n);
      const status = !open ? 'Түгжээтэй' : l.free ? (st ? `Шилдэг ${st.best} оноо` : 'Нээлттэй')
        : st && st.passed ? `Давсан · шилдэг ${st.best}` : 'Нээлттэй';
      const z = l.free ? 6 : Math.round(1 + i * 4 / (N - 2)), h = Math.round(140 + i * 150 / (N - 1));
      return `<button type="button" class="step" data-n="${l.n}" data-z="${z}" style="height:${h}px" ${open ? '' : 'disabled'}>` +
        `<span class="st-b">Түвшин</span><span class="st-n">${l.n}</span><span class="st-t">${esc(l.title)}</span>` +
        `<span class="st-s">${l.ch} · ${l.pairs} хос<br>${status}</span></button>`;
    }).join('');
    if (!$('#cg-demo').innerHTML) {
      $('#cg-demo').innerHTML = `<span class="mcard demo"><span class="mcard-face mcard-back"><img src="logo.svg" alt=""></span></span>` +
        `<span class="mcard demo"><span class="mcard-face mcard-front img">${K.icon('granite', 'Гранитын зураг')}</span></span>` +
        `<span class="mcard demo"><span class="mcard-face mcard-front name"><span class="cg-name">Гранит</span></span></span>`;
    }
  };

  /* ---------- Тоглолт ---------- */
  const el = i => $(`#cg-board [data-i="${i}"]`);
  G.startCards = function (n) {
    const lv = K.LEVELS.find(l => l.n === n);
    if (!G.me || !lv || !G.cardOpen(n)) return;
    clearAll();
    const ids = K.draw(n, G.shuffle);
    const cards = G.shuffle(ids.flatMap(id => [{ id, kind: 'img' }, { id, kind: 'name' }]));
    game = { lv, ids, cards, found: 0, score: 0, miss: 0, log: [], open: [], lock: true, phase: 'preview', t0: 0, lastSec: null };
    resetQuit();
    G.show('cardplay');
    const board = $('#cg-board');
    board.style.setProperty('--cols', cards.length === 10 ? 5 : 4);
    board.style.setProperty('--maxw', cards.length > 12 ? '470px' : '560px');
    board.innerHTML = cards.map((c, i) => `<button type="button" class="mcard up" data-i="${i}" aria-label="Карт ${i + 1}"><span class="mcard-in">` +
      `<span class="mcard-face mcard-back"><img src="logo.svg" alt=""></span>` +
      `<span class="mcard-face mcard-front ${c.kind}">${c.kind === 'img' ? K.icon(c.id, 'Зураг') : `<span class="cg-name">${esc(K.ITEMS[c.id].name)}</span>`}</span>` +
      '</span></button>').join('');
    hud();
    paintTimer(LIMIT, 3);
    // Эхэнд бүх картыг хэдэн секунд харуулна.
    const g = game;
    for (let s = PREVIEW; s >= 1; s--) later(() => { if (game === g) $('#cg-msg').textContent = `Цээжлээрэй! ${s}`; }, (PREVIEW - s) * 1000);
    later(() => {
      if (game !== g) return;
      [...board.children].forEach(b => b.classList.remove('up'));
      g.phase = 'play'; g.lock = false; g.t0 = performance.now();
      $('#cg-msg').textContent = 'Зураг ба нэрийг тааруул!';
      // Цагийг 0.1 секунд тутам шалгана (өөр таб руу шилжсэн ч хугацаа зөв тоологдоно).
      clearInterval(raf); raf = setInterval(tick, 100);
    }, PREVIEW * 1000);
    G.unlockAudio();
  };

  function hud() {
    $('#cg-found').innerHTML = `Олсон хос <b>${game.found}</b> / ${game.ids.length}`;
    $('#cg-tag').textContent = `Түвшин ${game.lv.n} · ${game.lv.title}`;
    $('#cg-score').textContent = game.score;
  }
  function paintTimer(rem, zone) {
    $('#cg-fill').style.width = (rem / LIMIT * 100) + '%';
    $('#cg-timer').dataset.zone = zone;
    $('#cg-zone').textContent = `${Math.ceil(rem)} сек · ${ZONE[zone]}`;
  }
  function tick() {
    if (!game || game.phase !== 'play') { clearInterval(raf); return; }
    const sec = (performance.now() - game.t0) / 1000, rem = Math.max(0, LIMIT - sec);
    paintTimer(rem, pointsFor(sec));
    const s = Math.ceil(rem);
    if (s !== game.lastSec) { if (game.lastSec !== null && s >= 1 && s <= 5) G.sfx('tick'); game.lastSec = s; }
    // Хос шалгаж байх үед (хөдөлгөөн дуустал) хугацаа дуусгахгүй.
    if (rem <= 0 && !game.lock) { clearInterval(raf); timeout(); }
  }
  function pop(text, cls) {
    const p = $('#cg-pop');
    p.textContent = text; p.className = 'pop ' + cls;
    void p.offsetWidth; p.classList.add('go');
  }

  function flip(i) {
    const g = game;
    if (!g || g.lock || g.phase !== 'play') return;
    const c = g.cards[i];
    if (!c || c.gone || c.up) return;
    c.up = true; el(i).classList.add('up');
    g.open.push(i);
    if (g.open.length < 2) return;
    const [a, b] = g.open, A = g.cards[a], B = g.cards[b];
    g.open = []; g.lock = true;
    if (A.id === B.id) {
      const sec = (performance.now() - g.t0) / 1000, pts = Math.max(1, pointsFor(sec));
      g.score += pts; g.found++; g.log.push({ id: A.id, pts, sec });
      el(a).classList.add('ok'); el(b).classList.add('ok');
      pop('+' + pts, 'p' + pts); G.sfx('ok');
      $('#cg-msg').textContent = `Зөв! ${K.ITEMS[A.id].name}`;
      hud();
      later(() => {
        if (game !== g) return;
        A.gone = B.gone = true; el(a).classList.add('gone'); el(b).classList.add('gone');
        if (g.found === g.ids.length) return finish(false);
        g.lock = false; g.t0 = performance.now(); g.lastSec = null;
      }, 600);
    } else {
      g.miss++; g.score = Math.max(0, g.score - 1);
      el(a).classList.add('bad'); el(b).classList.add('bad');
      pop('−1', 'p0'); G.sfx('bad');
      $('#cg-msg').textContent = 'Таарсангүй. −1 оноо';
      hud();
      later(() => {
        if (game !== g) return;
        A.up = B.up = false;
        [a, b].forEach(j => el(j).classList.remove('up', 'bad'));
        g.lock = false;
      }, 950);
    }
  }

  function timeout() {
    const g = game;
    g.phase = 'over'; g.lock = true;
    paintTimer(0, 0);
    $('#cg-msg').textContent = 'Хугацаа дууслаа!';
    G.sfx('timeout');
    g.cards.forEach((c, i) => { if (!c.gone) el(i).classList.add('up'); });
    later(() => { if (game === g) finish(true); }, 1600);
  }

  function finish(timedOut) {
    clearAll();
    const g = game;
    game = null;
    const lv = g.lv, n = g.ids.length, passed = lv.free ? true : (!timedOut && g.found === n);
    const out = G.applyRound({ key: key(lv.n), ch: null, score: g.score, passed });
    G.recordRound({ g: 'C' + lv.n, score: g.score, correct: g.found, n, s: {}, ans: [] });
    const me = G.me;
    $('#res-eyebrow').textContent = `7-р анги · Хос карт · Түвшин ${lv.n} · ${lv.title}`;
    $('#res-av').innerHTML = AV.svg(me.avatar, 120);
    const verdict = $('#res-verdict');
    verdict.classList.toggle('fail', !passed);
    verdict.textContent = lv.free ? (timedOut ? 'Хугацаа дууслаа' : 'Бүх хосыг оллоо!') : passed ? `Түвшин ${lv.n}: амжилттай давлаа!` : 'Хугацаа дууслаа';
    $('#res-score').innerHTML = `<b>+${g.score}</b> оноо · нийт ${out.after} · дэлгүүрт ${G.balance(me)}`;
    const next = lv.free ? null : K.LEVELS.find(l => l.n === lv.n + 1);
    let desc;
    if (lv.free) desc = `${n} хосоос ${g.found}-г оллоо. Дахин тоглож оноогоо нэмээрэй.`;
    else if (!passed) desc = `Хос бүрийг 30 секундын дотор олох хэрэгтэй. Та ${n} хосоос ${g.found}-г оллоо.`;
    else if (next && next.free) desc = `Эхний 5 түвшнийг бүгдийг давлаа! Түвшин ${next.n} «${next.title}» нээгдлээ.`;
    else desc = `Түвшин ${next.n} нээгдлээ: ${next.title}.`;
    $('#res-desc').textContent = desc;
    const t0 = G.titleOf(out.before), t1 = G.titleOf(out.after);
    $('#res-unlocks').innerHTML = (t1.i > t0.i ? `<div class="unlock title-up"><span class="title-chip">Шинэ цол</span><span><b>${esc(t1.name)}</b> болж ахилаа!</span></div>` : '') +
      out.newHats.map(h => `<div class="unlock">${AV.svg(Object.assign({}, me.avatar, { hat: h.id }), 40)}<span>Шинэ чимэглэл: <b>${esc(h.name)}</b></span></div>`).join('');

    const btnNext = $('#btn-res-next');
    btnNext.hidden = !(passed && next);
    if (next) btnNext.textContent = `Түвшин ${next.n} рүү`;
    btnNext.onclick = () => next && G.startCards(next.n);
    $('#btn-res-again').onclick = () => G.startCards(lv.n);
    $('#btn-res-menu').textContent = 'Хос картын түвшнүүд';
    $('#btn-res-menu').onclick = () => G.nav('cards');

    const avg = g.log.length ? g.log.reduce((s, l) => s + l.sec, 0) / g.log.length : 0;
    $('#st-correct').textContent = `${g.found} / ${n}`;
    $('#st-three').textContent = g.log.filter(l => l.pts === 3).length;
    $('#st-avg').textContent = g.log.length ? `${avg.toFixed(1)} сек` : '–';
    const missing = g.ids.filter(id => !g.log.some(l => l.id === id));
    $('#res-review').innerHTML = g.log.map(l =>
      `<li><span class="pill p${l.pts}">+${l.pts}</span><div><p class="rv-q">${esc(K.ITEMS[l.id].name)}</p><p class="rv-a">Зураг ба нэрийг тааруулсан</p></div><span class="rv-t">${l.sec.toFixed(1)} сек</span></li>`).join('') +
      missing.map(id => `<li><span class="pill p0">0</span><div><p class="rv-q">${esc(K.ITEMS[id].name)}</p><p class="rv-a">Олдоогүй</p></div><span class="rv-t"></span></li>`).join('') +
      (g.miss ? `<li><span class="pill p0">−${g.miss}</span><div><p class="rv-q">Буруу хос</p><p class="rv-a">${g.miss} удаа таараагүй хос эргүүлсэн</p></div><span class="rv-t"></span></li>` : '');

    G.renderLeaders($('#res-leaders'), { limit: 5 });
    G.renderRival($('#res-rival'));
    G.show('result');
    G.sfx(passed ? 'end' : 'bad');
  }

  function quit() {
    if (Date.now() - quitAt < 3000) {
      clearAll(); game = null; resetQuit(); G.nav('cards');
    } else {
      quitAt = Date.now();
      $('#cg-quit').textContent = 'Дахин дарж гарна';
      later(resetQuit, 3000);
    }
  }
  function resetQuit() { quitAt = 0; const b = $('#cg-quit'); if (b) b.textContent = 'Гарах'; }

  G.initCards = function () {
    $('#cg-stairs').addEventListener('click', e => { const b = e.target.closest('.step'); if (b && !b.disabled) G.startCards(Number(b.dataset.n)); });
    $('#cg-board').addEventListener('click', e => { const b = e.target.closest('.mcard'); if (b) flip(Number(b.dataset.i)); });
    $('#cg-quit').addEventListener('click', quit);
  };
})();
