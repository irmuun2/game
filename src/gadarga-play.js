// Тоглолт: түвшний асуултууд, 15 секундийн цаг, оноо, дүн, дуу.
(function () {
  'use strict';
  const G = window.GAME = window.GAME || {};
  const C = window.GADARGA_CONTENT;
  const AV = window.GADARGA_AVATAR;
  const DURATION = 15;
  const ZONE_NAME = { 3: 'Уул', 2: 'Өндөрлөг', 1: 'Тал', 0: 'Далайн түвшин' };
  const LETTERS = ['А', 'Б', 'В', 'Г'];

  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pointsFor(rem) { const s = Math.ceil(rem); return s >= 10 ? 3 : s >= 6 ? 2 : s >= 1 ? 1 : 0; }
  G.$ = $; G.esc = esc; G.shuffle = shuffle;

  let round = null, raf = 0, lastSec = null, quitAt = 0, quitTimer = 0;

  /* ---------- Асуултын зураг: сурах бичгийн 3.4 дүгээр зураг «Гадаргын зүсэлт» (23-р хуудас) ---------- */
  const FIGS = {
    profile: (() => {
      // [өндөр м, төвийн x, хагас өргөн, хагас өндөр, өнгө]. Баруун талд шугамууд ойр (эгц), зүүн талд хол (налуу).
      const lv = [[50, 175, 150, 50, '#b5dca0'], [100, 185, 118, 40, '#d3e0a0'], [150, 195, 86, 30, '#ead79a'],
        [200, 205, 55, 20, '#dfb377'], [250, 213, 24, 9, '#c58a5c']];
      const cy = 72, base = 270, Y = h => base - h * 0.4;
      const pts = [[15, Y(20)]].concat(lv.map(l => [l[1] - l[2], Y(l[0])]), [[213, Y(275)]],
        lv.slice().reverse().map(l => [l[1] + l[2], Y(l[0])]), [[345, Y(20)]]);
      const line = pts.map(p => p.join(' ')).join(' L');
      const drops = pts.slice(1, -1).filter(p => p[0] !== 213)
        .map(p => `<line x1="${p[0]}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#5f7f94" stroke-width=".8" stroke-dasharray="3 3"/>`).join('');
      const grid = [0, 50, 100, 150, 200, 250].map(h =>
        `<line x1="15" y1="${Y(h)}" x2="345" y2="${Y(h)}" stroke="#c9d6dd" stroke-width=".7"/><text x="350" y="${Y(h) + 3}" font-size="9" fill="#3b4a55">${h} м</text>`).join('');
      return '<svg viewBox="0 0 382 292" role="img" style="font-family:Onest,Segoe UI,sans-serif" aria-label="3.4 дүгээр зураг: хаяалбар шугамтай уул ба А–Б шугамын дагуух гадаргын зүсэлт. Зүүн тал налуу, баруун тал эгц.">' +
        '<text x="15" y="13" font-size="10" font-weight="700" fill="#0d1f2b">Хаяалбар шугам (үеийн өндөр 50 м)</text>' +
        lv.map(l => `<ellipse cx="${l[1]}" cy="${cy}" rx="${l[2]}" ry="${l[3]}" fill="${l[4]}" stroke="#6b5a3a" stroke-width="1"/>`).join('') +
        lv.map(l => `<text x="${l[1] - l[2] + 3}" y="${cy - 4}" font-size="8.5" fill="#3b3226">${l[0]}</text>`).join('') +
        '<path d="M213 66 l4 7 h-8 z" fill="#5a3a22"/>' +
        `<line x1="15" y1="${cy}" x2="345" y2="${cy}" stroke="#c4492f" stroke-width="1.6"/>` +
        `<circle cx="15" cy="${cy}" r="2.6" fill="#c4492f"/><circle cx="345" cy="${cy}" r="2.6" fill="#c4492f"/>` +
        `<text x="3" y="${cy + 4}" font-size="11" font-weight="700" fill="#c4492f">А</text><text x="350" y="${cy + 4}" font-size="11" font-weight="700" fill="#c4492f">Б</text>` +
        '<text x="15" y="150" font-size="10" font-weight="700" fill="#0d1f2b">Гадаргын зүсэлт А–Б</text>' +
        grid + drops +
        `<path d="M15 ${base} L${line} L345 ${base} Z" fill="#d9b05a" fill-opacity=".55"/>` +
        `<path d="M${line}" fill="none" stroke="#6b3f1f" stroke-width="2" stroke-linejoin="round"/>` +
        '<text x="36" y="226" font-size="9.5" font-style="italic" fill="#2b4a5c">налуу</text>' +
        '<text x="300" y="203" font-size="9.5" font-style="italic" fill="#2b4a5c">эгц</text>' +
        `<text x="11" y="${base + 14}" font-size="10" font-weight="700" fill="#c4492f">А</text><text x="341" y="${base + 14}" font-size="10" font-weight="700" fill="#c4492f">Б</text>` +
        '</svg><figcaption>Сурах бичгийн 3.4 дүгээр зураг «Гадаргын зүсэлт»-ийн дагуу зурав (23-р хуудас).</figcaption>';
    })()
  };

  // ch: бүлэг ('7-1' …), n: түвшин. Тухайн ангийн асуулт ачаалагдаагүй бол эхлээд ачаална.
  let starting = false;
  G.startLevel = async function (ch, n) {
    const c = C.chapter(ch), lv = c && c.levels.find(l => l.n === n);
    if (!G.me || !lv || !G.levelOpen(ch, n) || starting) return;
    if (!C.loaded(ch)) {
      starting = true;
      const ok = await C.load(c.grade);
      starting = false;
      if (!ok) { alert('Асуулт ачаалж чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.'); return; }
    }
    const Q = C.questions(ch), ids = Q.map((q, i) => i);
    let order;
    if (lv.free) {
      // Оноо цуглуулах: өөрийн 3 асуулт + бүлгийн бусад түвшнээс санамсаргүй.
      const own = shuffle(ids.filter(i => Q[i].l === lv.n)).slice(0, 3);
      const rest = shuffle(ids.filter(i => Q[i].l !== lv.n)).slice(0, lv.size - own.length);
      order = shuffle(own.concat(rest));
    } else {
      order = shuffle(ids.filter(i => Q[i].l === n)).slice(0, lv.size);
    }
    G.curCh = ch;
    begin({ kind: 'level', ch, c, lv, pool: Q, order });
  };

  // Чулуулгийн газрын зургийн тоглоом (III бүлэг): анхны асуултууд, сонгосон сэдэв ба тоогоор.
  G.startMap = function (sections, count) {
    const Q1 = C.Q1(), ids = Q1.map((q, i) => i).filter(i => sections.includes(Q1[i].s));
    if (!ids.length) return;
    const n = count === 'all' ? ids.length : Math.min(count, ids.length);
    begin({ kind: 'map', ch: C.LEGACY, c: C.chapter(C.LEGACY), pool: Q1, order: shuffle(ids).slice(0, n), sections, count });
  };

  // Нарны аймгийн аялал (II бүлэг): нэмэлт асуултууд + 2.1 сэдвийн түвшний асуултууд.
  G.startSolar = function (count) {
    const ch = C.chapters().find(c => c.game === 'solar');
    if (!ch || !G.me) return;
    const P = C.extraPool(ch.id);
    if (!P.length) return;
    const n = count === 'all' ? P.length : Math.min(count, P.length);
    begin({ kind: 'solar', ch: ch.id, c: ch, pool: P.map(x => x.q), keys: P.map(x => x.k), order: shuffle(P.map((x, i) => i)).slice(0, n), count });
  };
  // Нэмэлт тоглоомын нэр ба буцах дэлгэц.
  const EXTRA = {
    map: { tag: 'Газрын зураг', title: 'III бүлэг · Чулуулгийн газрын зураг', back: 'map', menu: 'Газрын зураг', g: 'M' },
    solar: { tag: 'Нарны аймгийн аялал', title: 'II бүлэг · Нарны аймгийн аялал', back: 'solar', menu: 'Нарны аймаг', g: 'S' }
  };

  function begin(spec) {
    round = Object.assign(spec, { idx: 0, score: 0, log: [], answered: false });
    unlockAudio();
    G.show('play');
    const t = $('#track');
    t.style.gap = spec.order.length > 30 ? '2px' : '4px';
    t.innerHTML = spec.order.map(() => '<i></i>').join('');
    ask();
  }
  G.inRound = () => !!round && G.screen === 'play';

  function paintTrack() {
    [...$('#track').children].forEach((el, i) => {
      const l = round.log[i];
      el.className = l ? 'p' + l.pts : (i === round.idx ? 'cur' : '');
    });
  }

  function ask() {
    const q = round.pool[round.order[round.idx]], lv = round.lv;
    round.opts = shuffle(q.a.map((t, i) => ({ t, ok: i === 0 })));
    round.answered = false;
    $('#q-num').innerHTML = `Асуулт <b>${round.idx + 1}</b> / ${round.order.length}`;
    const where = C.where(round.c, q.s);
    $('#q-tag').textContent = EXTRA[round.kind] ? `${EXTRA[round.kind].tag} · ${where}` : `${round.c.n} бүлэг · Түвшин ${lv.n} · ${where}`;
    $('#q-text').textContent = q.q;
    const fig = $('#q-fig');
    fig.innerHTML = q.fig && FIGS[q.fig] ? FIGS[q.fig] : '';
    fig.hidden = !fig.innerHTML;
    const box = $('#answers');
    box.innerHTML = '';
    round.opts.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'ans'; b.id = 'ans-' + i;
      b.innerHTML = `<span class="ans-k">${LETTERS[i]}</span><span>${esc(o.t)}</span>`;
      b.addEventListener('click', () => answer(i));
      box.appendChild(b);
    });
    $('#feedback').hidden = true;
    $('#score').textContent = round.score;
    $('#timer').classList.remove('stopped');
    paintTrack();
    lastSec = null;
    round.t0 = performance.now();
    updateTimer(DURATION);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    $('#q-text').focus({ preventScroll: true });
  }

  function tick(now) {
    if (!round || round.answered) return;
    const rem = Math.max(0, DURATION - (now - round.t0) / 1000);
    updateTimer(rem);
    if (rem <= 0) { answer(null); return; }
    raf = requestAnimationFrame(tick);
  }

  function updateTimer(rem) {
    const pct = Math.min(100, (1 - rem / DURATION) * 100);
    $('#elapsed').style.width = pct + '%';
    $('#marker').style.left = pct + '%';
    const sec = Math.ceil(rem);
    if (sec !== lastSec) {
      const first = lastSec === null;
      lastSec = sec;
      const p = pointsFor(rem);
      $('#sec').textContent = sec;
      $('#timer').dataset.zone = p;
      $('#zone-name').textContent = p ? `${ZONE_NAME[p]} · ${p} оноо` : 'Хугацаа дууслаа';
      if (!first && sec >= 1 && sec <= 5) sfx('tick');
    }
  }

  function answer(i) {
    if (!round || round.answered) return;
    const rem = Math.max(0, DURATION - (performance.now() - round.t0) / 1000);
    round.answered = true;
    cancelAnimationFrame(raf);
    updateTimer(rem);
    $('#timer').classList.add('stopped');

    const qi = round.order[round.idx], q = round.pool[qi];
    const chosen = i == null ? null : round.opts[i];
    const ok = !!(chosen && chosen.ok) && rem > 0;
    const pts = ok ? pointsFor(rem) : 0;
    round.score += pts;
    round.log.push({ qi, pick: chosen ? chosen.t : null, ok, pts, used: Math.round((DURATION - rem) * 10) / 10 });

    [...$('#answers').children].forEach((b, j) => {
      b.disabled = true;
      if (round.opts[j].ok) b.classList.add('is-correct');
      else if (j === i) b.classList.add('is-wrong');
      else b.classList.add('is-dim');
    });

    const pill = $('#fb-pill');
    pill.className = 'pill p' + pts;
    pill.textContent = pts ? `+${pts} оноо` : '0 оноо';
    if (ok) {
      $('#fb-title').textContent = 'Зөв!';
      $('#fb-sub').textContent = ['', 'Удаан хариулсан тул 1 оноо.', 'Хурдан хариулсан тул 2 оноо.', 'Маш хурдан хариулсан тул 3 оноо!'][pts];
    } else {
      $('#fb-title').textContent = chosen ? 'Буруу' : 'Хугацаа дууслаа';
      $('#fb-sub').textContent = `Зөв хариулт: ${q.a[0]}`;
    }
    $('#fb-exp').textContent = q.e;
    $('#fb-src').textContent = `Газар зүй ${round.c.grade}-р анги, сурах бичгийн ${q.p}-р хуудас`;
    $('#btn-next').textContent = round.idx === round.order.length - 1 ? 'Дүнг харах' : 'Дараагийн асуулт';
    $('#feedback').hidden = false;
    $('#score').textContent = round.score;
    if (pts) {
      const el = $('#pop');
      el.textContent = '+' + pts; el.className = 'pop p' + pts;
      void el.offsetWidth; el.classList.add('go');
    }
    paintTrack();
    sfx(ok ? 'ok' : chosen ? 'bad' : 'timeout');
    $('#btn-next').focus({ preventScroll: true });
    $('#feedback').scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  }

  function next() {
    if (!round || !round.answered || G.screen !== 'play') return;
    round.idx++;
    if (round.idx >= round.order.length) finish(); else ask();
  }

  function finish() {
    cancelAnimationFrame(raf);
    const r = round, X = EXTRA[r.kind], lv = X ? { n: r.kind, free: true } : r.lv, n = r.order.length, c = r.c;
    const correct = r.log.filter(l => l.ok).length;
    const passed = lv.free ? true : correct >= lv.pass;
    const out = G.applyRound({ key: X ? r.kind : C.levelKey(r.ch, lv.n), ch: X ? null : r.ch, score: r.score, passed });
    const me = G.me;
    const secs = {};
    r.log.forEach(l => { const s = C.secKey(c.grade, r.pool[l.qi].s), a = secs[s] || (secs[s] = [0, 0]); a[1]++; if (l.ok) a[0]++; });
    // Тайлан: g = тоглоом (M = газрын зураг, S = нарны аймаг, L3 = III бүлгийн 3-р түвшин, 7-1/L3 = бусад бүлэг), k = асуултын түлхүүр.
    const keyOf = qi => (r.kind === 'map' ? 'M:' + qi : r.keys ? r.keys[qi] : C.qKey(r.ch, qi));
    G.recordRound({
      g: X ? X.g : r.ch === C.LEGACY ? 'L' + lv.n : r.ch + '/L' + lv.n, score: r.score, correct, n, s: secs,
      ans: r.log.map(l => ({ k: keyOf(l.qi), p: l.pick, ok: l.ok }))
    });

    $('#res-eyebrow').textContent = X ? X.title : `${c.grade}-р анги · ${c.n} бүлэг · Түвшин ${lv.n} · ${lv.title}`;
    $('#res-av').innerHTML = AV.svg(me.avatar, 120);
    const verdict = $('#res-verdict');
    verdict.classList.toggle('fail', !passed);
    verdict.textContent = lv.free ? 'Оноо цуглууллаа!' : passed ? `Түвшин ${lv.n}: амжилттай давлаа!` : 'Дахиад оролдоорой';
    $('#res-score').innerHTML = `<b>+${r.score}</b> оноо · нийт ${out.after} · дэлгүүрт ${G.balance(me)}`;
    const nextLv = X ? null : c.levels.find(l => l.n === lv.n + 1);
    let desc;
    if (X) desc = `${n} асуултаас ${correct}-д зөв хариуллаа. Оноогоо Нүүр цэсийн дэлгүүрт зарцуулж дүрээ хөгжүүлээрэй.`;
    else if (lv.free) desc = 'Дахин тоглож оноогоо нэмээд шинэ чимэглэл нээгээрэй.';
    else if (!passed) desc = `Давахын тулд ${n}-аас ${lv.pass} зөв хариулт хэрэгтэй. Та ${correct} зөв хариуллаа.`;
    else if (nextLv && nextLv.free) desc = `«${c.title}» бүлгийн бүх түвшнийг давлаа! Түвшин ${nextLv.n} «${nextLv.title}» нээгдлээ.`;
    else desc = `Түвшин ${nextLv.n} нээгдлээ: ${nextLv.title}.`;
    $('#res-desc').textContent = desc;
    const t0 = G.titleOf(out.before), t1 = G.titleOf(out.after);
    $('#res-unlocks').innerHTML = (t1.i > t0.i ? `<div class="unlock title-up"><span class="title-chip">Шинэ цол</span><span><b>${esc(t1.name)}</b> болж ахилаа!</span></div>` : '') + out.newHats.map(h =>
      `<div class="unlock">${AV.svg(Object.assign({}, me.avatar, { hat: h.id }), 40)}<span>Шинэ чимэглэл: <b>${esc(h.name)}</b></span></div>`).join('');

    const btnNext = $('#btn-res-next');
    btnNext.hidden = !(passed && nextLv);
    if (nextLv) btnNext.textContent = nextLv.free ? `Түвшин ${nextLv.n}: ${nextLv.title}` : `Түвшин ${nextLv.n} рүү`;
    btnNext.onclick = () => nextLv && G.startLevel(r.ch, nextLv.n);
    $('#btn-res-again').onclick = () => (r.kind === 'map' ? G.startMap(r.sections, r.count) : r.kind === 'solar' ? G.startSolar(r.count) : G.startLevel(r.ch, lv.n));
    $('#btn-res-menu').textContent = X ? X.menu : 'Бүлгийн түвшнүүд';
    $('#btn-res-menu').onclick = () => G.nav(X ? X.back : 'levels');

    const answered = r.log.filter(l => l.pick !== null);
    const avg = answered.length ? answered.reduce((s, l) => s + l.used, 0) / answered.length : 0;
    $('#st-correct').textContent = `${correct} / ${n}`;
    $('#st-three').textContent = r.log.filter(l => l.pts === 3).length;
    $('#st-avg').textContent = answered.length ? `${avg.toFixed(1)} сек` : '–';
    $('#res-review').innerHTML = r.log.map(l => {
      const q = r.pool[l.qi];
      const detail = l.ok ? `Зөв: ${esc(q.a[0])}` : `${l.pick === null ? 'Хариулаагүй' : 'Таны хариулт: ' + esc(l.pick)} · Зөв: ${esc(q.a[0])}`;
      return `<li><span class="pill p${l.pts}">${l.pts ? '+' + l.pts : '0'}</span><div><p class="rv-q">${esc(q.q)}</p><p class="rv-a">${detail}</p></div><span class="rv-t">${l.used.toFixed(1)} сек</span></li>`;
    }).join('');

    G.renderLeaders($('#res-leaders'), { limit: 5 });
    G.renderRival($('#res-rival'));
    round = null;
    G.show('result');
    sfx(passed ? 'end' : 'bad');
    if (out.rewardNew) G.showReward();
  }

  function quit() {
    if (Date.now() - quitAt < 3000) {
      const back = round && EXTRA[round.kind] ? EXTRA[round.kind].back : 'levels';
      cancelAnimationFrame(raf); round = null; resetQuit(); G.nav(back);
    } else {
      quitAt = Date.now();
      $('#btn-quit').textContent = 'Дахин дарж гарна';
      clearTimeout(quitTimer); quitTimer = setTimeout(resetQuit, 3000);
    }
  }
  function resetQuit() { clearTimeout(quitTimer); quitAt = 0; $('#btn-quit').textContent = 'Гарах'; }

  /* ---------- Дуу ---------- */
  let actx = null, soundOn = true;
  try { soundOn = localStorage.getItem('gadarga-sound') !== 'false'; } catch (e) {}
  function unlockAudio() {
    if (!soundOn) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
    } catch (e) { actx = null; }
  }
  function tone(f, d, type = 'sine', v = .07, delay = 0) {
    if (!soundOn || !actx) return;
    try {
      const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
      o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + d + .02);
    } catch (e) {}
  }
  function sfx(k) {
    if (k === 'tick') tone(880, .06, 'square', .025);
    else if (k === 'ok') { tone(660, .14, 'sine', .08); tone(990, .24, 'sine', .08, .1); }
    else if (k === 'bad') tone(196, .35, 'triangle', .1);
    else if (k === 'timeout') { tone(330, .18, 'sawtooth', .035); tone(220, .3, 'sawtooth', .035, .16); }
    else if (k === 'end') { tone(523, .16, 'sine', .07); tone(659, .16, 'sine', .07, .14); tone(784, .3, 'sine', .07, .28); }
  }
  G.sfx = sfx;
  const ICON_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function syncSound() {
    const b = $('#btn-sound');
    b.innerHTML = soundOn ? ICON_ON : ICON_OFF;
    b.setAttribute('aria-pressed', String(soundOn));
    b.setAttribute('aria-label', soundOn ? 'Дуу асаалттай' : 'Дуу унтраалттай');
  }

  G.initPlay = function () {
    $('#btn-next').addEventListener('click', next);
    $('#btn-quit').addEventListener('click', quit);
    syncSound();
    $('#btn-sound').addEventListener('click', () => {
      soundOn = !soundOn;
      try { localStorage.setItem('gadarga-sound', String(soundOn)); } catch (e) {}
      syncSound(); unlockAudio();
    });
    const full = $('#btn-full');
    if (!document.documentElement.requestFullscreen) full.hidden = true;
    full.addEventListener('click', () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => { full.hidden = true; });
      } catch (e) { full.hidden = true; }
    });
    document.addEventListener('keydown', e => {
      if (G.screen !== 'play' || !round || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!round.answered) {
        const i = ['1', '2', '3', '4'].indexOf(e.key);
        if (i >= 0) { e.preventDefault(); answer(i); }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); next();
      }
    });
  };
})();
