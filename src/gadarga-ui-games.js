// Тоглоом цэс: анги → бүлэг → түвшин, чулуулгийн газрын зураг (III бүлэг), тоглогчид, багшийн самбар.
(function () {
  'use strict';
  const G = window.GAME;
  const C = window.GADARGA_CONTENT;
  const AV = window.GADARGA_AVATAR;
  const R = window.GADARGA_ROCKS;
  const S = window.GADARGA_SOLAR;
  const $ = G.$, esc = G.esc;

  /* ---------- Тоглоомын цэс ---------- */
  /* ---------- Анги ба бүлэг сонгох ---------- */
  G.gradeSel = 0;
  const ZC = ['--plain', '--upland', '--plateau', '--mountain', '--shallow', '--t3', '--t1'];
  G.renderGames = function () {
    const me = G.me;
    if (!G.gradeSel) G.gradeSel = me.grade || 7;
    const grades = C.grades();
    $('#grade-tabs').innerHTML = grades.map(g => `<button type="button" class="grade-tab${g.chapters.length ? '' : ' soon'}" role="tab" data-grade="${g.g}" aria-selected="${g.g === G.gradeSel}" aria-label="${g.g}-р анги${g.chapters.length ? '' : ', удахгүй'}">` +
      `<b>${g.g}</b><span>анги</span>${g.chapters.length ? '' : '<small>удахгүй</small>'}</button>`).join('');
    const gr = C.grade(G.gradeSel);
    const list = gr ? gr.chapters : [];
    $('#chapters').innerHTML = list.length ? list.map((c, i) => {
      const pr = G.chapterProgress(me, c.id), pct = pr.total ? Math.round(pr.passed / pr.total * 100) : 0;
      const map = c.game === 'map' ? me.levels.map : null, sol = c.game === 'solar' ? me.levels.solar : null;
      const status = pr.done ? `Бүх ${pr.total} түвшнийг давсан · шилдэг ${pr.best} оноо`
        : pr.played ? `${pr.passed}/${pr.total} түвшин давсан` : `${c.levels.length} түвшин · ${c.count} асуулт`;
      return `<article class="ch-card${pr.done ? ' done' : ''}" style="--zc:var(${ZC[i % ZC.length]})">` +
        `<p class="ch-n">${c.n} бүлэг · ${c.pages}-р хуудас</p><h2 class="ch-t">${esc(c.title)}</h2>` +
        `<p class="ch-p">${status}</p><div class="ch-bar" aria-hidden="true"><i style="width:${pct}%"></i></div>` +
        (c.game === 'map' ? `<p class="ch-p">Нэмэлт тоглоом: чулуулгийн газрын зураг · ${me.mapSeen.length}/${R.SITES.length} газар${map ? ` · шилдэг ${map.best}` : ''}</p>` : '') +
        (c.game === 'solar' ? `<p class="ch-p">Нэмэлт тоглоом: нарны аймгийн аялал · ${me.solarSeen.length}/${S.BODIES.length} биет${sol ? ` · шилдэг ${sol.best}` : ''}</p>` : '') +
        `<div class="row"><button type="button" class="btn-primary sm" data-ch="${c.id}">${pr.played ? 'Үргэлжлүүлэх' : 'Эхлэх'}</button>` +
        (c.game === 'map' ? '<button type="button" class="btn-ghost sm" data-open-map>Газрын зураг</button>' : '') +
        (c.game === 'solar' ? '<button type="button" class="btn-ghost sm" data-open-solar>Нарны аймаг</button>' : '') + '</div></article>';
    }).join('')
      : `<div class="card soon-card"><h2 class="h-sm">${G.gradeSel}-р ангийн бүлгүүд удахгүй нэмэгдэнэ</h2>` +
        '<p class="note" style="margin:0">Сурах бичгийн бүлэг бүрээр түвшин, асуултууд бэлтгэгдэж байна. Одоохондоо бусад ангийн бүлгүүдээр тоглоорой.</p></div>';
    const tk = G.roomTokens(me);
    $('#g3-prog').textContent = `${me.rooms.length} өрөөнд нэгдсэн · Өрөө үүсгэх эрх: ${tk === Infinity ? 'хязгааргүй' : tk}`;
    G.renderRival($('#games-rival'));
    G.renderLeaders($('#games-leaders'), { limit: 10 });
  };
  function pickGrade(g) {
    if (!C.grade(g)) return;
    G.gradeSel = g;
    // Сүүлд сонгосон ангийг хадгална. Асуултыг урьдчилан ачаална.
    if (G.me && G.me.grade !== g) { G.me.grade = g; G.save(); }
    C.load(g);
    G.renderGames();
  }

  G.renderLevels = function () {
    const me = G.me, c = C.chapter(G.curCh);
    if (!c) { G.nav('games'); return; }
    $('#levels-eyebrow').textContent = `${c.grade}-р анги · ${c.n} бүлэг · ${c.pages}-р хуудас`;
    $('#levels-title').textContent = c.title;
    const N = c.levels.length, k = N - 1;
    const stairs = $('#stairs');
    stairs.style.setProperty('--n', N);
    stairs.innerHTML = c.levels.map((l, i) => {
      const st = me.levels[C.levelKey(c.id, l.n)], open = G.levelOpen(c.id, l.n);
      const status = !open ? 'Түгжээтэй'
        : l.free ? (st ? `Шилдэг ${st.best} оноо` : 'Нээлттэй')
        : st && st.passed ? `Давсан · шилдэг ${st.best}` : 'Нээлттэй';
      // Өнгө ба өндөр: тал нутгаас (1) оргил (5) хүртэл, оноо цуглуулах түвшин (6).
      const z = l.free ? 6 : k <= 1 ? 5 : Math.round(1 + i * 4 / (k - 1));
      const h = Math.round(140 + i * 150 / Math.max(1, N - 1));
      return `<button type="button" class="step" data-n="${l.n}" data-z="${z}" style="height:${h}px" ${open ? '' : 'disabled'}>` +
        `<span class="st-b">Түвшин</span><span class="st-n">${l.n}</span><span class="st-t">${esc(l.title)}</span>` +
        `<span class="st-s">${status}</span></button>`;
    }).join('');
    const last = c.levels[N - 1];
    $('#stairs-note').textContent = `Түвшин бүрт 6 асуулт. 4-өөс доошгүй зөв хариулбал дараагийн түвшин нээгдэнэ. ` +
      `Бүх түвшнийг давбал «${last.title}» түвшин нээгдэж, 10 асуултаар оноо цуглуулна.` +
      (me.reward ? '' : ' Аль нэг бүлгийн бүх түвшнийг анх давахад үнэгүй шагнал авна.');
  };

  /* ---------- 2-р тоглоом: газрын зураг ---------- */
  let selected = null;
  const MAP_SECS = ['3.1', '3.2', '3.3', '3.4'];
  const SECTIONS = (C.chapter(C.LEGACY) || {}).sections || {};
  let mset = { sections: MAP_SECS.slice(), count: 10 };
  try {
    const s = JSON.parse(localStorage.getItem('gadarga-map-settings') || 'null');
    if (s && Array.isArray(s.sections)) mset = { sections: s.sections.filter(k => MAP_SECS.includes(k)), count: [10, 15, 20, 'all'].includes(s.count) ? s.count : 10 };
  } catch (e) {}
  const saveMset = () => { try { localStorage.setItem('gadarga-map-settings', JSON.stringify(mset)); } catch (e) {} };
  const Q1 = () => C.Q1();

  G.renderMap = function () {
    const me = G.me, seen = me.mapSeen;
    $('#world').innerHTML = R.svg(seen, selected);
    $('#rock-legend').innerHTML = Object.values(R.TYPES).map(t => `<span><i style="background:${t.color}"></i>${t.name}</span>`).join('') +
      '<span><i style="background:transparent;border:2px solid #eef3f0"></i>Үзсэн газар</span>';
    const s = R.SITES.find(x => x.id === selected);
    $('#site-card').innerHTML = s
      ? `<span class="st-type" style="background:${R.TYPES[s.t].color}">${R.TYPES[s.t].name}</span>` +
        `<h3>${s.rock}</h3><p class="st-where">${s.place} · ${s.country}</p><p class="st-text">${s.text}</p>`
      : '<h3 style="margin-top:0">Газрын зургийг судал</h3><p class="st-text">Өнгөт цэг дээр дарж тэнд ямар чулуулаг их олддог, яагаад гэдгийг уншаарай. Улаан цэг нь магмын, шар цэг нь тунамал, ягаан цэг нь хувирмал чулуулаг.</p>';
    $('#seen-count').textContent = `Судалсан газар: ${seen.length}/${R.SITES.length}`;
    $('#site-list').innerHTML = R.SITES.map(x =>
      `<button type="button" class="site-btn${seen.includes(x.id) ? ' seen' : ''}" data-site="${x.id}" aria-pressed="${x.id === selected}"><i style="background:${R.TYPES[x.t].color}"></i>${x.place}</button>`).join('');

    $('#m-secs').innerHTML = MAP_SECS.map(k =>
      `<button type="button" class="chip" data-sec="${k}" aria-pressed="${mset.sections.includes(k)}"><span class="chip-k">${k}</span><span>${SECTIONS[k]}</span><span class="chip-c">${Q1().filter(q => q.s === k).length}</span></button>`).join('');
    $('#m-count').innerHTML = [10, 15, 20, 'all'].map(c =>
      `<input type="radio" name="m-count" id="mc-${c}" value="${c}" ${String(mset.count) === String(c) ? 'checked' : ''}><label for="mc-${c}">${c === 'all' ? 'Бүгд' : c}</label>`).join('');
    syncStart();
  };

  function syncStart() {
    const seen = G.me.mapSeen.length;
    const avail = Q1().filter(q => mset.sections.includes(q.s)).length;
    const n = mset.count === 'all' ? avail : Math.min(mset.count, avail);
    const btn = $('#m-start'), hint = $('#m-hint');
    if (seen < 3) { btn.disabled = true; hint.textContent = `Эхлээд газрын зургаас дор хаяж 3 газрыг судлаарай (${seen}/3).`; }
    else if (!avail) { btn.disabled = true; hint.textContent = 'Дор хаяж нэг сэдэв сонгоно уу.'; }
    else { btn.disabled = false; hint.textContent = `${n} асуулт · дээд оноо ${n * 3}`; }
  }

  function pickSite(id) {
    if (!R.SITES.some(s => s.id === id)) return;
    selected = id;
    G.markSeen(id);
    G.renderMap();
    const mk = document.querySelector(`#world .mk[data-site="${id}"]`);
    if (mk && document.activeElement && document.activeElement.closest && document.activeElement.closest('#world')) mk.focus();
  }

  /* ---------- II бүлэг: нарны аймгийн аялал ---------- */
  let body = null, scount = 10;
  try { const v = JSON.parse(localStorage.getItem('gadarga-solar-count') || 'null'); if ([10, 15, 20, 'all'].includes(v)) scount = v; } catch (e) {}
  const solarCh = () => C.chapters().find(c => c.game === 'solar');
  G.renderSolar = function () {
    const me = G.me, seen = me.solarSeen;
    $('#solar-view').innerHTML = S.svg(seen, body);
    const b = body && S.body(body);
    $('#body-card').innerHTML = b
      ? `<span class="st-type" style="background:${b.color}">${b.kind}</span><h3>${b.name}</h3>` +
        (S.facts(b).length ? '<dl class="bd-facts">' + S.facts(b).map(x => `<div><dt>${x[0]}</dt><dd>${x[1]}</dd></div>`).join('') + '</dl>' : '') +
        `<p class="st-text">${b.text}</p><p class="st-fact"><b>Сонирхолтой нь:</b> ${b.fact}</p>`
      : '<h3 style="margin-top:0">Нарны аймгийг судал</h3><p class="st-text">Нар, гараг, Сар, бага гаргуудын бүс дээр дарж сурах бичгийн 2.1 сэдвийн мэдээллийг уншаарай. Дор хаяж 3 биетийг судалсны дараа асуулт нээгдэнэ.</p>';
    $('#body-count').textContent = `Судалсан биет: ${seen.length}/${S.BODIES.length}`;
    $('#body-list').innerHTML = S.BODIES.map(x =>
      `<button type="button" class="site-btn${seen.includes(x.id) ? ' seen' : ''}" data-body="${x.id}" aria-pressed="${x.id === body}"><i style="background:${x.color}"></i>${x.name}</button>`).join('');
    $('#s-count').innerHTML = [10, 15, 20, 'all'].map(c =>
      `<input type="radio" name="s-count" id="sc-${c}" value="${c}" ${String(scount) === String(c) ? 'checked' : ''}><label for="sc-${c}">${c === 'all' ? 'Бүгд' : c}</label>`).join('');
    syncSolarStart();
    renderOrder();
  };
  function syncSolarStart() {
    const ch = solarCh(), seen = G.me.solarSeen.length, avail = ch ? C.extraPool(ch.id).length : 0;
    const n = scount === 'all' ? avail : Math.min(scount, avail), btn = $('#s-start'), hint = $('#s-hint');
    if (seen < 3) { btn.disabled = true; hint.textContent = `Эхлээд дор хаяж 3 биетийг судлаарай (${seen}/3).`; }
    else if (!avail) { btn.disabled = true; hint.textContent = 'Асуулт ачаалагдсангүй.'; }
    else { btn.disabled = false; hint.textContent = `${avail} асуултаас ${n} · дээд оноо ${n * 3}`; }
  }
  function pickBody(id) {
    if (!S.body(id)) return;
    body = id;
    G.markSolar(id);
    G.renderSolar();
    const mk = document.querySelector(`#solar-view .bd[data-body="${id}"]`);
    if (mk && document.activeElement && document.activeElement.closest && document.activeElement.closest('#solar-view')) mk.focus();
  }

  // Дарааллын сорил: 2.1 дүгээр хүснэгтийн 10 мөрийг нарнаас эхлэн дарна. Шилдэг дүнгээ ахиулсан хэмжээгээр оноо авна.
  const ord = { on: false, next: 0, miss: 0, t0: 0, chips: S.ORDER.slice() };
  function renderOrder() {
    $('#order-slots').innerHTML = S.ORDER.map((id, i) => {
      const done = i < ord.next || (!ord.on && ord.next === S.ORDER.length);
      return `<li class="${done ? 'done' : ''}${ord.on && i === ord.next ? ' cur' : ''}"><b>${i + 1}</b><span>${done ? S.body(id).name : ''}</span></li>`;
    }).join('');
    $('#order-chips').innerHTML = ord.chips.map(id => {
      const placed = S.ORDER.indexOf(id) < ord.next;
      return `<button type="button" class="order-chip" data-ord="${id}" ${!ord.on || placed ? 'disabled' : ''}><i style="background:${S.body(id).color}"></i>${S.body(id).name}</button>`;
    }).join('');
    $('#order-start').textContent = ord.on ? 'Дахин эхлэх' : ord.next ? 'Дахин тоглох' : 'Эхлэх';
    const best = G.me.levels.order;
    if (!ord.on && !ord.next) $('#order-msg').textContent = best ? `Шилдэг дүн: ${best.best}/10` : 'Эхлэх дарахад нэрс холилдоно.';
  }
  function startOrder() {
    Object.assign(ord, { on: true, next: 0, miss: 0, t0: performance.now(), chips: G.shuffle(S.ORDER) });
    $('#order-msg').textContent = 'Нарнаас хамгийн ойр биетээс эхэл.';
    renderOrder();
    const first = document.querySelector('#order-chips .order-chip:not([disabled])');
    if (first) first.focus();
  }
  function tapOrder(btn) {
    if (!ord.on) return;
    const id = btn.dataset.ord;
    if (id !== S.ORDER[ord.next]) {
      ord.miss++;
      btn.classList.remove('bad'); void btn.offsetWidth; btn.classList.add('bad');
      G.sfx('bad');
      $('#order-msg').textContent = `Буруу. ${S.ordinal(ord.next + 1)} нь ${S.body(id).name} биш. Алдаа: ${ord.miss}`;
      return;
    }
    ord.next++;
    G.sfx('ok');
    if (ord.next < S.ORDER.length) { $('#order-msg').textContent = `Зөв! Дараагийнх нь ${S.ordinal(ord.next + 1)}.`; renderOrder(); refocus(id); return; }
    ord.on = false;
    const sec = (performance.now() - ord.t0) / 1000, score = Math.max(0, 10 - ord.miss);
    const prev = (G.me.levels.order && G.me.levels.order.best) || 0, gain = Math.max(0, score - prev);
    G.applyRound({ key: 'order', score, passed: true, gain });
    G.recordRound({ g: 'O', score, correct: score, n: 10, s: {}, ans: [] });
    G.sfx('end');
    $('#order-msg').textContent = `Дууслаа! ${sec.toFixed(1)} секунд, ${ord.miss} алдаа. Дүн: ${score}/10. ` +
      (gain ? `+${gain} оноо!` : score === 10 ? 'Та аль хэдийн бүрэн дүн авсан тул оноо нэмэгдсэнгүй.' : `Шилдэг дүн ${prev}/10-аас давбал оноо авна.`);
    renderOrder();
    G.renderNav();
  }
  function refocus(id) {
    const all = [...document.querySelectorAll('#order-chips .order-chip')];
    const i = all.findIndex(b => b.dataset.ord === id);
    const next = all.slice(i + 1).concat(all.slice(0, i)).find(b => !b.disabled);
    if (next) next.focus();
  }

  /* ---------- Тоглогчид ---------- */
  function playerRow(r, i, extra) {
    const p = r.p;
    const styles = AV.STYLES.filter(s => AV.wearingStyle(p.avatar, s.id)).map(s => s.name);
    const sub = r.sub || [`${G.passedCount(p)} түвшин`].concat(styles).join(' · ');
    return `<li class="prow${r.me ? ' is-me' : ''}"><span class="rk">${i + 1}</span>${AV.svg(p.avatar, 44)}` +
      `<div style="min-width:0"><p class="nm">${esc(p.nick || 'Нэргүй')}${r.me ? ' (та)' : ''}</p><p class="sub">${esc(sub)}</p></div>` +
      (extra || `<span class="pt">${p.total}</span>`) + '</li>';
  }

  // Тэргүүлэгчид: эхний 3 нь индэр дээр, бусад нь жагсаалтаар. Хүн бүр зөвхөн нэр, аватар, оноог харна.
  G.renderLeaders = function (el, opts) {
    if (!el) return;
    const limit = (opts && opts.limit) || Infinity;
    const room = opts && opts.room, mv = room ? () => '' : moveTag;
    const { list, rank } = G.myRank(room);
    if (!list.length) {
      el.innerHTML = '<p class="note" style="margin:0">Одоогоор тэргүүлэгч алга. Тоглоод эхний байрыг эзлээрэй!</p>' + offlineNote();
      return;
    }
    const shown = list.slice(0, Math.min(limit, TOP_N));
    lastList = list;
    const top = shown.slice(0, 3), order = [1, 0, 2].filter(i => top[i]);
    const nm = r => esc(r.p.nick || 'Нэргүй') + (r.me ? ' (та)' : '');
    const podium = `<div class="podium" style="grid-template-columns:repeat(${order.length},minmax(0,1fr))">` + order.map(i => {
      const r = top[i];
      return `<div class="pod p${i + 1}${r.me ? ' me' : ''}" data-lid="${esc(r.id)}" tabindex="0" role="button" aria-label="${i + 1}-р байр, ${esc(r.p.nick || 'Нэргүй')}, ${r.p.total} оноо. Амжилтыг харах">` +
        `${AV.svg(r.p.avatar, i === 0 ? 84 : 64)}<p class="pod-n">${nm(r)}</p>` +
        `<p class="pod-t"><span class="place-chip">${G.PLACE_TITLES[i]}</span>${esc(G.titleOf(r.p.total).name)}</p>` +
        `<p class="pod-pts"><b>${r.p.total}</b> оноо ${mv(r.id, i + 1)}</p>` +
        `<div class="pod-step"><span>${i + 1}</span></div></div>`;
    }).join('') + '</div>';
    const rest = shown.slice(3);
    const rows = rest.length ? '<ol class="plist">' + rest.map((r, j) => {
      const n = j + 4, a = achievementsOf(r.p).filter(x => x.ok).length;
      return `<li class="prow pick${r.me ? ' is-me' : ''}" data-lid="${esc(r.id)}" tabindex="0" role="button" aria-label="${n}-р байр, ${esc(r.p.nick || 'Нэргүй')}, ${r.p.total} оноо. Амжилтыг харах">` +
        `<span class="rk">${n}</span>${AV.svg(r.p.avatar, 44)}<div style="min-width:0"><p class="nm">${nm(r)}</p>` +
        `<p class="sub"><span class="title-chip sm">${esc(G.titleOf(r.p.total).name)}</span> ${G.passedCount(r.p)} түвшин · ${a} амжилт</p></div><span class="pt">${r.p.total} ${mv(r.id, n)}</span></li>`;
    }).join('') + '</ol>' : '';
    const mine = G.mode === 'shared' && G.isAdmin
      ? '<p class="my-rank">Та багшийн эрхтэй тул жагсаалтад ордоггүй.</p>'
      : rank ? `<p class="my-rank">Таны байр: <b>${rank}</b> / ${list.length}${rank > shown.length ? ` · ${G.me.total} оноо. Эхний ${TOP_N}-д орохын тулд ${Math.max(1, shown[shown.length - 1].p.total - G.me.total + 1)} оноо хэрэгтэй.` : ''}</p>` : '';
    el.innerHTML = podium + rows + mine + '<p class="note" style="margin-top:8px">Тэргүүлэгч дээр дарж амжилтыг нь харна уу.</p>' + offlineNote();
    if (!room) saveRanks(list);
  };

  /* ---------- Өрсөлдөгч: хэнийг гүйцэх, хэн ард ойртож байгааг харуулж өдөөнө ---------- */
  G.renderRival = function (el, room) {
    if (!el) return;
    if (G.mode === 'shared' && G.isAdmin) { el.innerHTML = ''; return; }
    const { list, rank } = G.myRank(room);
    if (!rank) { el.innerHTML = ''; return; }
    lastList = list;
    const me = list[rank - 1], above = list[rank - 2], below = list[rank];
    const nick = r => esc(r.p.nick || 'Нэргүй');
    const need = gap => Math.max(1, Math.ceil((gap + 1) / 3));
    const side = (r, label, place) => `<div class="rv-side" ${r.me ? '' : `data-lid="${esc(r.id)}" tabindex="0" role="button" aria-label="${nick(r)}-ийн амжилтыг харах"`}>` +
      `${AV.svg(r.p.avatar, 64)}<b>${label}</b><span>${r.p.total} оноо · ${place}-р байр</span></div>`;
    let target, msg, sub = '';
    if (above) {
      const gap = above.p.total - me.p.total;
      target = above;
      msg = gap > 0
        ? `<b>${nick(above)}</b> танаас <b>${gap} оноо</b> илүү байна. Гүйцэж түрүүлэхэд ойролцоогоор <b>${need(gap)} маш хурдан зөв хариулт</b> хэрэгтэй!`
        : `<b>${nick(above)}</b> тантай тэнцүү оноотой байна. Ганц зөв хариулт л таныг өмнө нь гаргана!`;
    } else if (below) {
      const gap = me.p.total - below.p.total;
      target = below;
      msg = `Та <b>тэргүүлж</b> байна! Ард чинь <b>${nick(below)}</b> ердөө <b>${gap} оноо</b> дутуу. Байраа хамгаал!`;
    } else {
      el.innerHTML = `<div class="rival solo"><p class="rv-kicker">Өрсөлдөгч</p><p class="rv-msg">${room
        ? 'Өрөөнд одоогоор ганцаараа байна. Кодоо ангийнхан, найзууддаа өгч өрсөлдөгчтэй болоорой.'
        : 'Та одоогоор ганцаараа жагсаалтад байна. Бусад тоглогч нэгдэхэд энд таны өрсөлдөгч гарна.'}</p></div>`;
      return;
    }
    if (above && below) sub = `<p class="rv-behind">Ард чинь <b>${nick(below)}</b> ${me.p.total - below.p.total} оноо зөрүүтэй ойртож байна.</p>`;
    const pct = target === above ? Math.round(me.p.total / Math.max(1, above.p.total) * 100) : 100;
    el.innerHTML = `<div class="rival">` + side(me, 'Та', rank) +
      `<div class="rv-mid"><p class="rv-kicker">${target === above ? 'Дараагийн өрсөлдөгч' : 'Таныг мөрдөж буй өрсөлдөгч'}</p><p class="rv-msg">${msg}</p>` +
      `<div class="rv-bar" aria-hidden="true"><i style="width:${Math.min(100, pct)}%"></i></div>${sub}</div>` +
      side(target, nick(target), target === above ? rank - 1 : rank + 1) + '</div>';
  };

  // Офлайн үед яагаад бусад тоглогч харагдахгүйг тайлбарлана.
  function offlineNote() {
    if (G.mode !== 'local') return '';
    if (G.syncAllowed() && G.syncUrl()) {
      if (G.syncState === 'ok') return '<p class="sync-note">Ангийн нэгдсэн самбар: өөр төхөөрөмжөөс тоглож буй хүмүүс ч хамт харагдаж байна.</p>';
      if (G.syncState === 'error') return '<p class="offline-note">Ангийн нэгдсэн самбарт холбогдсонгүй. Интернэт холболтоо шалгана уу. Одоогоор зөвхөн энэ төхөөрөмжийн тоглогчид харагдаж байна.</p>';
      return '<p class="sync-note">Өөр төхөөрөмжийн тоглогчдыг ачаалж байна…</p>';
    }
    return G.syncAllowed()
      ? '<p class="offline-note">Одоогоор зөвхөн энэ төхөөрөмжийн тоглогчид харагдаж байна. Багш «Тоглогч солих» цэсэнд ангийн нэгдсэн самбарыг тохируулбал өөр төхөөрөмжийн тоглогчид ч харагдана.</p>'
      : '<p class="offline-note">Офлайн горим: зөвхөн энэ төхөөрөмжийн тоглогчид харагдаж байна.</p>';
  }

  G.renderBoard = function () { G.renderRival($('#board-rival')); G.renderLeaders($('#board-leaders'), { limit: TOP_N }); };

  /* ---------- Байрны өөрчлөлт (▲/▼): энэ хөтөч дээр өмнө харсан байртай харьцуулна ---------- */
  const TOP_N = 10;
  let lastList = [], prevRanks = {};
  try { prevRanks = JSON.parse(localStorage.getItem('gadarga-ranks') || '{}') || {}; } catch (e) {}
  function moveTag(id, now) {
    const was = prevRanks[id];
    if (!was) return Object.keys(prevRanks).length ? '<span class="rkd new" title="Шинээр жагсаалтад орсон">шинэ</span>' : '';
    if (was > now) return `<span class="rkd up" title="${was - now} байр дээшилсэн">▲${was - now}</span>`;
    if (was < now) return `<span class="rkd down" title="${now - was} байр доошилсон">▼${now - was}</span>`;
    return '';
  }
  // Хэрэглэгч хуудсыг дахин нээхэд өөрчлөлтийг харуулахын тулд одоогийн байрыг хадгална.
  let saveTimer = 0;
  function saveRanks(list) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const m = {};
      list.forEach((r, i) => { m[r.id] = i + 1; });
      try { localStorage.setItem('gadarga-ranks', JSON.stringify(m)); } catch (e) {}
    }, 4000);
  }

  /* ---------- Тэргүүлэгчийн амжилт ---------- */
  function achievementsOf(p) {
    const s = G.pubStats(p), passed = G.passedCount(p), sites = R.SITES.length, done = s.chDone || 0;
    return [
      { name: 'Анхны алхам', text: 'Эхний түвшнээ давсан', ok: passed >= 1 },
      { name: 'Өндөрлөгт хүрэв', text: '3 түвшин давсан', ok: passed >= 3 },
      { name: 'Оргилд гарав', text: 'Нэг бүлгийн бүх түвшнийг давсан', ok: done >= 1 },
      { name: 'Бүлгийн аялагч', text: '3 бүлгийн бүх түвшнийг давсан', ok: done >= 3 },
      { name: 'Номын мастер', text: '7 бүлгийн бүх түвшнийг давсан', ok: done >= 7 },
      { name: 'Газарзүйч', text: 'Экспедицийн малгайг шагнал болгон авсан', ok: !!p.reward },
      { name: '100 оноо', text: 'Нийт 100 оноо цуглуулсан', ok: p.total >= 100 },
      { name: '200 оноо', text: 'Нийт 200 оноо цуглуулсан', ok: p.total >= 200 },
      { name: '500 оноо', text: 'Нийт 500 оноо цуглуулсан', ok: p.total >= 500 },
      { name: 'Газрын зургийн судлаач', text: `Газрын зургийн ${sites} газрыг бүгдийг судалсан`, ok: s.seen >= sites },
      { name: 'Сансрын аялагч', text: `Нарны аймгийн ${S.BODIES.length} биетийг бүгдийг судалсан`, ok: (s.sun || 0) >= S.BODIES.length },
      { name: 'Цуглуулагч', text: 'Дэлгүүрээс 5 ба түүнээс олон зүйл авсан', ok: s.items >= 5 },
      { name: 'Хип хоп стил', text: 'Хип хоп стилийг бүрэн өмссөн', ok: AV.wearingStyle(p.avatar, 'hiphop') },
      { name: 'Албаны стил', text: 'Албаны стилийг бүрэн өмссөн', ok: AV.wearingStyle(p.avatar, 'formal') },
      { name: 'Мэргэжилтэн', text: 'Багш, эмч, цагдаа гэх мэт мэргэжлийн стилийг бүрэн өмссөн', ok: AV.STYLES.some(st => st.job && AV.wearingStyle(p.avatar, st.id)) }
    ];
  }

  function openLeader(id) {
    const i = lastList.findIndex(r => r.id === id);
    if (i < 0) return;
    const r = lastList[i], p = r.p, s = G.pubStats(p), ach = achievementsOf(p);
    const got = ach.filter(a => a.ok).length;
    $('#lm-body').innerHTML =
      `<div class="lm-head"><div class="av-ring">${AV.svg(p.avatar, 110)}</div><div>` +
      `<p class="eyebrow" style="margin:0 0 6px">${i + 1}-р байр ${moveTag(r.id, i + 1)}</p>` +
      `<h2 class="h2" id="lm-title">${esc(p.nick || 'Нэргүй')}${r.me ? ' (та)' : ''}</h2>` +
      `<p class="lm-titles">${i < 3 ? `<span class="place-chip">${G.PLACE_TITLES[i]}</span>` : ''}<span class="title-chip">${esc(G.titleOf(p.total).name)}</span></p>` +
      `<p class="me-pts"><b>${p.total}</b> нийт оноо</p>` +
      (r.viaCode ? `<p class="note" style="margin:6px 0 0">Онооны кодоор нэмсэн · ${fmtTime(r.at)} <button type="button" class="btn-ghost sm" data-rmcard="${esc(r.id)}">Жагсаалтаас хасах</button></p>` : '') +
      '</div></div>' +
      '<dl class="rd-stats lm-stats">' +
      `<div><dt>Давсан түвшин</dt><dd>${G.passedCount(p)}</dd></div>` +
      `<div><dt>Дуусгасан бүлэг</dt><dd>${s.chDone || 0}</dd></div>` +
      `<div><dt>Тоглосон тоглолт</dt><dd>${s.rounds}</dd></div>` +
      `<div><dt>Газрын зургийн шилдэг</dt><dd>${s.bestMap || '–'}</dd></div>` +
      `<div><dt>Судалсан газар</dt><dd>${s.seen}/${R.SITES.length}</dd></div>` +
      `<div><dt>Дэлгүүрээс авсан</dt><dd>${s.items}</dd></div></dl>` +
      `<h3 class="h-sm">Амжилтууд · ${got}/${ach.length}</h3>` +
      `<ul class="ach">${ach.map(a => `<li class="${a.ok ? 'ok' : ''}"><b>${a.name}</b><span>${a.text}</span></li>`).join('')}</ul>`;
    $('#leader-modal').hidden = false;
    $('#lm-close').focus();
  }
  function closeLeader() { $('#leader-modal').hidden = true; }

  /* ---------- Энэ төхөөрөмжийн тоглогчид ---------- */
  let delArm = null, delTimer = 0;
  function renderSync() {
    const card = $('#sync-card');
    card.hidden = !G.syncAllowed();
    if (card.hidden) return;
    const inp = $('#sync-url');
    if (document.activeElement !== inp) inp.value = G.syncUrl();
    const n = Object.keys(G.remote).length;
    $('#sync-status').textContent = !G.syncUrl() ? 'Тохируулаагүй байна.'
      : G.syncState === 'ok' ? `Холбогдсон. Самбарт нийт ${n} тоглогч байна.`
      : G.syncState === 'error' ? 'Холбогдож чадсангүй. Холбоос болон интернэтээ шалгана уу.'
      : 'Холбогдож байна…';
  }

  G.renderProfiles = function () {
    renderSync();
    const list = G.localProfiles().sort((a, b) => b.p.total - a.p.total)
      .map(r => Object.assign(r, r.p.email ? { sub: r.p.email + (G.auth[r.id] ? ' · нэвтэрсэн' : ' · нэвтрээгүй') } : {}));
    $('#profile-list').innerHTML = list.length ? list.map((r, i) => playerRow(r, i,
      `<div class="acts">${r.me ? '<span class="sub">Одоо тоглож байна</span>' : `<button type="button" class="btn-primary sm" data-pact="use" data-id="${r.id}">${G.loginOn() && !G.auth[r.id] ? 'Нэвтрэх' : 'Сонгох'}</button>`}` +
      (G.auth[r.id] ? `<button type="button" class="btn-ghost sm" data-pact="logout" data-id="${r.id}">Гарах</button>` : '') +
      `<button type="button" class="btn-ghost sm" data-pact="del" data-id="${r.id}">${delArm === r.id ? 'Дахин дарж устгана' : 'Устгах'}</button></div>`)).join('')
      : '<li class="empty">Энэ төхөөрөмж дээр тоглогч алга.</li>';
  };

  /* ---------- Багшийн самбар ---------- */
  const renderAccess = async function () {
    if (G.mode !== 'shared' || !G.isAdmin) return;
    $('#class-code').textContent = G.classCode ? G.formatCode(G.classCode) : G.classHash ? 'Код идэвхтэй' : 'Код үүсгээгүй';
    $('#code-copy').disabled = !G.classCode;
    $('#code-off').disabled = !G.classHash;
    $('#code-new').disabled = !G.codeSupported();
    const ids = Object.keys(G.players), staffIds = Object.keys(G.staff);
    let prof = {};
    try { prof = await G.user.profiles(ids.concat(staffIds)); } catch (e) {}
    const acct = id => (prof[id] && prof[id].name) || (G.players[id] && G.players[id].email) || 'бүртгэлийн нэр харагдахгүй';
    const item = id => ({ id, p: G.normalizePlayer(G.players[id]), me: id === G.uid });

    // Админуудын жагсаалт (үүсгэгч + Editor эрхтэй хүмүүс).
    $('#t-admins').innerHTML = staffIds.length ? staffIds.map(id => {
      const s = G.staff[id] || {}, owner = s.role === 'owner';
      const img = prof[id] && prof[id].avatarUrl ? `<img class="av" src="${esc(prof[id].avatarUrl)}" alt="" width="36" height="36">` : '';
      const act = G.isOwner && !owner && id !== G.uid
        ? `<button type="button" class="btn-ghost sm" data-act="unstaff" data-id="${esc(id)}">Жагсаалтаас хасах</button>` : '';
      return `<li class="prow" style="grid-template-columns:auto minmax(0,1fr) auto">${img}<div style="min-width:0"><p class="nm">${esc(acct(id))}${id === G.uid ? ' (та)' : ''}</p>` +
        `<p class="sub">${owner ? 'Үүсгэгч' : 'Админ (Editor)'}</p></div>${act}</li>`;
    }).join('') : '<li class="empty">Админ бүртгэгдээгүй байна.</li>';
    const withSub = r => Object.assign(r, { sub: `Бүртгэл: ${acct(r.id)} · ${r.p.total} оноо · ${G.passedCount(r.p)} түвшин` + (r.p.joinHash && r.p.joinHash === G.classHash ? ' · кодоор нэгдсэн' : '') });
    const btn = (act, id, label, primary) => `<button type="button" class="${primary ? 'btn-primary' : 'btn-ghost'} sm" data-act="${act}" data-id="${esc(id)}">${label}</button>`;
    const render = (el, rows, acts, empty) => {
      el.innerHTML = rows.length
        ? rows.map((r, i) => playerRow(withSub(r), i, `<div class="acts">${acts(r)}</div>`)).join('')
        : `<li class="empty">${empty}</li>`;
    };
    render($('#t-pending'), G.pendingIds().map(item),
      r => btn('approve', r.id, 'Зөвшөөрөх', true) + btn('decline', r.id, 'Татгалзах'), 'Шинэ хүсэлт алга.');
    render($('#t-players'), ids.filter(G.approved).map(item).sort((a, b) => b.p.total - a.p.total),
      r => (r.id === G.uid && G.isAdmin) ? '<span class="sub">Та</span>' : btn('decline', r.id, 'Эрхийг хаах'), 'Зөвшөөрсөн тоглогч алга.');
    render($('#t-declined'), ids.filter(G.declined).map(item),
      r => btn('approve', r.id, 'Зөвшөөрөх'), 'Татгалзсан хүсэлт алга.');
  };

  /* ---------- Багшийн самбарын хэсгүүд ---------- */
  let ttab = 'access', rSel = null, bankSel = '';
  const qByKey = k => C.qByKey(k);
  // Тайланд гарах асуултуудын ангийг ачаална (7-р ангиас бусад нь сонгоход л ачаалагддаг).
  const askedLoad = new Set();
  function ensureLoaded(keys, rerender) {
    const ids = [...new Set(keys.map(C.chapterOfKey).filter(id => id && !C.loaded(id) && !askedLoad.has(id)))];
    if (!ids.length) return;
    ids.forEach(id => askedLoad.add(id));
    C.loadFor(ids).then(() => { if (G.screen === 'teacher') rerender(); });
  }
  const keyLabel = k => {
    if (String(k)[0] === 'M') return 'III бүлэг · Газрын зураг';
    const c = C.chapter(C.chapterOfKey(k));
    return c ? `${c.grade}-р анги · ${c.n} бүлэг` + (/^[^:]*x:/.test(k) ? ' · Нарны аймгийн аялал' : '') : '';
  };
  const fmtTime = iso => {
    const d = new Date(iso); if (isNaN(d)) return '';
    const z = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())} ${z(d.getHours())}:${z(d.getMinutes())}`;
  };
  const gameName = g => {
    const m = String(g || '').match(/^(?:(\d+-\d+)\/)?L(\d+)$/);
    if (g === 'S') return 'II бүлэг · Нарны аймгийн аялал';
    if (g === 'O') return 'II бүлэг · Дарааллын сорил';
    if (!m) return 'III бүлэг · Газрын зургийн тоглоом';
    const c = C.chapter(m[1] || C.LEGACY);
    return c ? `${c.grade}-р анги · ${c.n} бүлэг · Түвшин ${m[2]}` : `Түвшин ${m[2]}`;
  };
  // Бүх сэдвийн түлхүүр сурах бичгийн дарааллаар (тайлангийн «Сэдвээр» хэсэгт).
  const secOrder = () => C.grades().flatMap(g => g.chapters.flatMap(c => Object.keys(c.sections).map(s => C.secKey(g.g, s))));
  const classMisses = () => {
    const agg = {};
    Object.values(G.results).forEach(r => Object.keys((r && r.misses) || {}).forEach(k => { agg[k] = (agg[k] || 0) + (Number(r.misses[k]) || 0); }));
    return agg;
  };

  G.renderTeacher = function () {
    if (G.mode !== 'shared' || !G.isAdmin) return;
    document.querySelectorAll('#t-tabs [data-ttab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.ttab === ttab)));
    ['access', 'report', 'bank', 'code'].forEach(t => { $('#tt-' + t).hidden = t !== ttab; });
    if (ttab === 'access') renderAccess();
    else if (ttab === 'report') renderReport();
    else if (ttab === 'bank') renderBank();
    else renderCode();
  };

  async function renderReport() {
    const ids = Object.keys(G.players).filter(id => G.approved(id) || G.results[id]);
    ensureLoaded(Object.values(G.results).flatMap(r => Object.keys((r && r.misses) || {})
      .concat(((r && r.rounds) || []).flatMap(rd => (Array.isArray(rd.ans) ? rd.ans : Array.isArray(rd.wrong) ? rd.wrong : []).map(a => a && a.k)))), renderReport);
    let prof = {};
    try { prof = await G.user.profiles(ids); } catch (e) {}
    const acct = id => (prof[id] && prof[id].name) || (G.players[id] && G.players[id].email) || 'бүртгэлийн нэр харагдахгүй';
    const rows = ids.map(id => {
      const p = G.normalizePlayer(G.players[id]), r = G.results[id] || {};
      const acc = Number(r.answered) ? Math.round(Number(r.correct) / Number(r.answered) * 100) : null;
      return { id, p, r, acc, me: id === G.uid };
    }).sort((a, b) => b.p.total - a.p.total);
    if (!rows.some(x => x.id === rSel)) rSel = rows.length ? rows[0].id : null;
    $('#r-players').innerHTML = rows.length ? rows.map((x, i) =>
      playerRow(Object.assign(x, { sub: `${acct(x.id)} · ${x.acc === null ? 'тоглоогүй' : x.acc + '% зөв'}` }), i)
        .replace('<li class="prow', `<li data-rid="${esc(x.id)}" tabindex="0" class="prow pick${x.id === rSel ? ' sel' : ''}`)).join('')
      : '<li class="empty">Одоогоор тоглогч алга.</li>';

    const x = rows.find(y => y.id === rSel);
    if (!x) $('#r-detail').innerHTML = '<p class="note" style="margin:0">Тоглогч сонгоно уу.</p>';
    else {
      const r = x.r, rounds = Array.isArray(r.rounds) ? r.rounds : [], bySec = r.bySec || {};
      const secRows = secOrder().filter(k => Array.isArray(bySec[k])).map(k => {
        const c = Number(bySec[k][0]) || 0, n = Number(bySec[k][1]) || 0, pct = n ? Math.round(c / n * 100) : 0, info = C.secInfo(k);
        const label = info ? (info.grade === 7 ? '' : info.grade + '-р анги · ') + info.label : k;
        return `<div class="bar-row"><span>${esc(label)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="bar-v">${c}/${n}</span></div>`;
      }).join('');
      const misses = r.misses || {};
      const topMiss = Object.keys(misses).sort((a, b) => misses[b] - misses[a]).slice(0, 5).map(k => {
        const q = qByKey(k);
        return q ? `<li><span class="mq">${esc(q.q)}</span><span class="ma">${Number(misses[k]) || 0} удаа алдсан · Зөв: ${esc(q.a[0])}</span></li>` : '';
      }).join('');
      const roundsHtml = rounds.map(rd => {
        // Шинэ тоглолтод бүх хариулт (ans), өмнөхөд зөвхөн алдаа (wrong) хадгалагдсан.
        const ans = Array.isArray(rd.ans) ? rd.ans : (Array.isArray(rd.wrong) ? rd.wrong.map(w => Object.assign({}, w, { ok: false })) : []);
        const items = ans.map(a => {
          const q = qByKey(a && a.k);
          if (!q) return '';
          const detail = a.ok ? `Зөв хариулсан: ${esc(q.a[0])}`
            : `${a.p == null ? 'Хариулаагүй (хугацаа дууссан)' : 'Хариулсан: ' + esc(a.p)} · Зөв: ${esc(q.a[0])}`;
          return `<li class="${a.ok ? 'ok' : 'no'}"><span class="mark">${a.ok ? '✓' : '✗'}</span> ${esc(q.q)}<span class="wa">${detail}</span></li>`;
        }).join('');
        const allOk = (Number(rd.correct) || 0) === (Number(rd.n) || 0) && Number(rd.n) > 0;
        return `<li class="round"><div class="round-h"><span>${esc(gameName(rd.g))} · ${Number(rd.score) || 0} оноо · ${Number(rd.correct) || 0}/${Number(rd.n) || 0} зөв</span><span>${fmtTime(rd.at)}</span></div>` +
          (items ? `<ul class="wrongs">${items}</ul>` : '') + (allOk ? '<p class="allok">Бүгдийг зөв хариулсан.</p>' : '') + '</li>';
      }).join('');
      $('#r-detail').innerHTML =
        `<div class="rd-head">${AV.svg(x.p.avatar, 56)}<div><h3>${esc(x.p.nick || 'Нэргүй')}</h3><p class="sub" style="margin:0">Бүртгэл: ${esc(acct(x.id))}</p></div></div>` +
        `<dl class="rd-stats"><div><dt>Нийт оноо</dt><dd>${x.p.total}</dd></div><div><dt>Зөв хариулт</dt><dd>${x.acc === null ? '–' : x.acc + '%'}</dd></div>` +
        `<div><dt>Хариулсан асуулт</dt><dd>${Number(r.answered) || 0}</dd></div><div><dt>Давсан түвшин</dt><dd>${G.passedCount(x.p)}</dd></div></dl>` +
        (secRows ? `<h4 class="h-sm">Сэдвээр</h4><div class="bars">${secRows}</div>` : '') +
        (topMiss ? `<h4 class="h-sm" style="margin-top:16px">Хамгийн их алдсан асуултууд</h4><ol class="miss-list">${topMiss}</ol>` : '') +
        `<h4 class="h-sm" style="margin-top:16px">Сүүлийн тоглолтууд: зөв (✓) ба буруу (✗) хариултууд</h4>` +
        (roundsHtml ? `<ul class="rounds">${roundsHtml}</ul>` : '<p class="note" style="margin:0">Энэ тоглогч онлайн хувилбарт одоогоор тоглоогүй байна.</p>');
    }
    const agg = classMisses();
    const top = Object.keys(agg).sort((a, b) => agg[b] - agg[a]).slice(0, 10);
    $('#r-top').innerHTML = top.length ? top.map(k => {
      const q = qByKey(k);
      return q ? `<li><span class="mq">${esc(q.q)}</span><span class="ma">${esc(keyLabel(k))} · ${agg[k]} удаа алдсан · Зөв: ${esc(q.a[0])}</span></li>` : '';
    }).join('') : '<li class="note" style="list-style:none">Одоогоор алдаа бүртгэгдээгүй байна.</li>';
  }

  // Сонголт: «L|<бүлэг>|<түвшин>», «M|<сэдэв>» (газрын зургийн тоглоом) эсвэл «X|<бүлэг>» (нарны аймгийн аялал).
  function renderBank() {
    const sel = $('#b-game');
    if (!sel.options.length) {
      sel.innerHTML = C.grades().filter(g => g.chapters.length).map(g => g.chapters.map(c =>
        `<optgroup label="${g.g}-р анги · ${c.n} бүлэг «${esc(c.title)}»">` +
        c.levels.map(l => `<option value="L|${c.id}|${l.n}">${c.n} бүлэг · Түвшин ${l.n} · ${esc(l.title)}</option>`).join('') + '</optgroup>' +
        (c.game === 'solar' ? `<optgroup label="${c.n} бүлэг · Нарны аймгийн аялал"><option value="X|${c.id}">Нарны аймгийн аялал · нэмэлт ${c.extra} асуулт</option></optgroup>` : '') +
        (c.game === 'map' ? `<optgroup label="${c.n} бүлэг · Газрын зургийн тоглоом">` +
          MAP_SECS.map(s => `<option value="M|${s}">Газрын зураг · ${s} ${esc(SECTIONS[s] || '')}</option>`).join('') + '</optgroup>' : '')).join('')).join('');
      if (!bankSel) bankSel = sel.options.length ? sel.options[0].value : '';
    }
    sel.value = bankSel;
    const agg = classMisses(), v = bankSel.split('|');
    let items = [];
    if (v[0] === 'L') {
      const ch = v[1], n = Number(v[2]);
      if (!C.loaded(ch)) {
        $('#b-list').innerHTML = '<li class="note" style="list-style:none">Асуултуудыг ачаалж байна…</li>';
        C.loadFor([ch]).then(() => { if (G.screen === 'teacher' && ttab === 'bank' && C.loaded(ch)) renderBank(); });
        return;
      }
      items = C.questions(ch).map((q, i) => ({ q, k: C.qKey(ch, i) })).filter(x => x.q.l === n);
    } else if (v[0] === 'M') {
      items = C.Q1().map((q, i) => ({ q, k: 'M:' + i })).filter(x => x.q.s === v[1]);
    } else if (v[0] === 'X') {
      items = C.extra(v[1]).map((q, i) => ({ q, k: C.qKeyX(v[1], i) }));
    }
    $('#b-list').innerHTML = items.map(({ q, k }) =>
      `<li><span class="bq">${esc(q.q)}</span>${agg[k] ? `<span class="bm">${agg[k]} удаа алдсан</span>` : ''}` +
      `<span class="bo">Зөв: <span class="ba">${esc(q.a[0])}</span> · Бусад: ${q.a.slice(1).map(esc).join(', ')} · ${q.p}-р хуудас${q.fig ? ' · зурагтай' : ''}</span></li>`).join('');
  }

  const CODE_FILES = ['gadarga-core.js', 'gadarga-play.js', 'gadarga-ui.js', 'gadarga-ui-games.js', 'gadarga-avatar.js', 'gadarga-rocks.js', 'gadarga-terrain.js', 'gadarga.css'];
  function renderCode() {
    const sel = $('#c-file');
    if (!sel.options.length) sel.innerHTML = CODE_FILES.map(f => `<option value="${f}">${f}</option>`).join('');
    $('#app-dl-row').hidden = !G.canDownload;
    if (G.canDownload === false) $('#dl-msg').textContent = 'Апп татах боломж энэ харагдацад алга байна.';
  }
  async function showCode() {
    const view = $('#c-view');
    view.textContent = 'Ачаалж байна…';
    try {
      const res = await fetch($('#c-file').value);
      if (!res.ok) throw new Error(String(res.status));
      view.textContent = await res.text();
    } catch (e) { view.textContent = 'Файлыг ачаалж чадсангүй.'; }
  }

  /* ---------- Өрөөнүүд ---------- */
  let rtab = 'mine', curRoom = null, leaveArm = 0;
  const typeName = t => G.ROOM_TYPES[t] || G.ROOM_TYPES.class;
  function tokenText(me) {
    const t = G.roomTokens(me);
    if (t === Infinity) return 'Та багш тул хүссэн хэмжээгээрээ өрөө үүсгэж болно.';
    const next = G.nextTokenAt(me);
    return `Өрөө үүсгэх эрх: <b>${t}</b>. Нийт оноо 100 хүрэх бүрд 1 эрх нэмэгдэнэ. Дараагийн эрх: нийт ${next} оноо хүрэхэд (${next - me.total} дутуу).`;
  }

  G.renderRooms = function () {
    const me = G.me;
    document.querySelectorAll('#rooms-tabs [data-rtab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.rtab === rtab)));
    ['mine', 'create', 'join'].forEach(t => { $('#rt-' + t).hidden = t !== rtab; });
    $('#room-tokens').innerHTML = tokenText(me);
    $('#room-create').disabled = G.roomTokens(me) < 1;
    $('#rooms-list').innerHTML = me.rooms.length ? me.rooms.map(code => {
      const r = G.roomOf(code), { list, rank } = G.myRank(code);
      const lead = list[0];
      return `<button type="button" class="room-card ${r.type}" data-room="${code}">` +
        `<span class="rc-type">${typeName(r.type)}</span><span class="rc-name">${esc(r.name)}</span>` +
        `<span class="rc-meta">${list.length} гишүүн · Таны байр: ${rank ? rank + '/' + list.length : '–'}</span>` +
        `<span class="rc-lead">${lead ? `Тэргүүлж буй: ${esc(lead.p.nick || 'Нэргүй')} · ${lead.p.total} оноо` : 'Одоогоор өрсөлдөгчгүй'}</span>` +
        `<span class="rc-code">Код: ${G.formatCode(code)}</span></button>`;
    }).join('') : '<p class="note" style="margin:0">Та одоогоор өрөөнд нэгдээгүй байна. Өрөө үүсгэх эсвэл кодоор нэгдэх цэсийг сонгоно уу.</p>';
  };

  G.renderRoom = function () {
    if (!curRoom || !G.me.rooms.includes(curRoom)) { G.nav('rooms'); return; }
    const r = G.roomOf(curRoom), { list } = G.myRank(curRoom);
    $('#room-eyebrow').textContent = `${typeName(r.type)} · өрөө`;
    $('#room-title').textContent = r.name;
    $('#room-code-view').textContent = G.formatCode(curRoom);
    $('#room-meta').textContent = `${list.length} гишүүн` + (r.ownerNick ? ` · Үүсгэсэн: ${r.ownerNick}` : '');
    $('#room-leave').textContent = leaveArm ? 'Дахин дарж гарна' : 'Өрөөнөөс гарах';
    G.renderRival($('#room-rival'), curRoom);
    G.renderLeaders($('#room-leaders'), { limit: TOP_N, room: curRoom });
    $('#room-swap').hidden = G.mode !== 'local' || G.loginOn();
  };
  G.openRoom = code => {
    curRoom = code; leaveArm = 0;
    ['#card-out', '#card-copy'].forEach(s => { $(s).hidden = true; });
    ['#card-msg', '#card-add-msg'].forEach(s => { $(s).textContent = ''; });
    G.nav('room');
  };

  // Кодыг гаргаж харуулах, хуулах товчтой хамт.
  function showCode(outSel, copySel, msgSel, code, hint) {
    const out = $(outSel);
    out.value = code; out.hidden = false; $(copySel).hidden = false;
    $(msgSel).textContent = hint;
    out.focus(); out.select();
  }

  G.initGames = function () {
    $('#open-rooms').addEventListener('click', () => { rtab = 'mine'; G.nav('rooms'); });
    $('#open-room-create').addEventListener('click', () => { rtab = 'create'; G.nav('rooms'); });
    $('#rooms-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-rtab]');
      if (!b) return;
      rtab = b.dataset.rtab;
      G.renderRooms();
    });
    $('#rooms-list').addEventListener('click', e => { const b = e.target.closest('[data-room]'); if (b) G.openRoom(b.dataset.room); });
    $('#room-create').addEventListener('click', async () => {
      const err = $('#room-create-err'), btn = $('#room-create');
      err.hidden = true; btn.disabled = true;
      const type = (document.querySelector('input[name="room-type"]:checked') || {}).value || 'class';
      const res = await G.createRoom($('#room-name').value, type);
      btn.disabled = G.roomTokens(G.me) < 1;
      if (res.error) { err.textContent = res.error; err.hidden = false; return; }
      $('#room-name').value = '';
      const made = $('#room-made');
      made.innerHTML = `<p class="rv-kicker">Өрөө бэлэн боллоо</p><p class="room-code big">${G.formatCode(res.room.code)}</p>` +
        `<p class="note" style="margin:0 0 10px">Энэ кодыг ${res.room.type === 'class' ? 'ангийнхандаа' : 'найзууддаа'} өгөөрэй. Тэд «Кодоор нэгдэх» цэсээр орно.</p>` +
        `<button type="button" class="btn-primary sm" data-open-room="${res.room.code}">Өрөөг нээх</button>`;
      made.hidden = false;
      G.renderRooms();
    });
    $('#room-made').addEventListener('click', e => { const b = e.target.closest('[data-open-room]'); if (b) G.openRoom(b.dataset.openRoom); });
    const doJoin = async () => {
      const err = $('#room-join-err');
      err.hidden = true;
      const res = await G.joinRoom($('#room-code').value);
      if (res.error) { err.textContent = res.error; err.hidden = false; return; }
      $('#room-code').value = '';
      G.openRoom(res.room.code);
    };
    $('#room-join').addEventListener('click', doJoin);
    $('#room-code').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doJoin(); } });
    $('#room-back').addEventListener('click', () => { rtab = 'mine'; G.nav('rooms'); });

    // Онооны код солилцох (интернэтгүй)
    $('#card-make').addEventListener('click', () => showCode('#card-out', '#card-copy', '#card-msg', G.myCard(),
      'Энэ кодыг хуулж өрөөнийхөндөө чатаар явуулаарай.'));
    $('#card-copy').addEventListener('click', () => G.copyText($('#card-out').value, $('#card-out'), $('#card-msg')));
    $('#card-add').addEventListener('click', () => {
      const res = G.importCard($('#card-in').value), msg = $('#card-add-msg');
      if (res.error) { msg.textContent = res.error; return; }
      $('#card-in').value = '';
      msg.textContent = `${res.nick} (${res.total} оноо) нэмэгдлээ.` +
        (res.shared.length ? ` Нийтлэг өрөө: ${res.shared.join(', ')}.` : ' Гэхдээ тэр энэ өрөөнд нэгдээгүй байна. Эхлээд өрөөний кодоор нэгдэхийг хэлээрэй.');
      G.renderRoom();
    });

    $('#lm-body').addEventListener('click', e => {
      const b = e.target.closest('[data-rmcard]');
      if (!b) return;
      G.removeCard(b.dataset.rmcard);
      closeLeader(); G.refresh();
    });
    $('#room-copy').addEventListener('click', () => G.copyText(G.formatCode(curRoom), null, $('#room-copy-msg')));
    $('#room-leave').addEventListener('click', () => {
      if (!leaveArm) { leaveArm = setTimeout(() => { leaveArm = 0; if (G.screen === 'room') G.renderRoom(); }, 3000); G.renderRoom(); return; }
      clearTimeout(leaveArm); leaveArm = 0;
      G.leaveRoom(curRoom); curRoom = null; rtab = 'mine'; G.nav('rooms');
    });

    const leaderPick = e => {
      const t = e.target.closest('[data-lid]');
      if (!t) return;
      if (e.type === 'keydown') { if (e.key !== 'Enter' && e.key !== ' ') return; e.preventDefault(); }
      openLeader(t.dataset.lid);
    };
    ['#board-leaders', '#games-leaders', '#res-leaders', '#wait-leaders', '#games-rival', '#board-rival', '#res-rival', '#room-leaders', '#room-rival'].forEach(sel => {
      $(sel).addEventListener('click', leaderPick);
      $(sel).addEventListener('keydown', leaderPick);
    });
    $('#lm-close').addEventListener('click', closeLeader);
    $('#leader-modal').addEventListener('click', e => { if (e.target.id === 'leader-modal') closeLeader(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#leader-modal').hidden) closeLeader(); });

    $('#t-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-ttab]');
      if (!b) return;
      ttab = b.dataset.ttab;
      G.renderTeacher();
    });
    const pickRow = e => {
      const li = e.target.closest('[data-rid]');
      if (!li) return;
      if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
      if (e.type === 'keydown') e.preventDefault();
      rSel = li.dataset.rid;
      renderReport();
    };
    $('#r-players').addEventListener('click', pickRow);
    $('#r-players').addEventListener('keydown', pickRow);
    $('#b-game').addEventListener('change', e => { bankSel = e.target.value; renderBank(); });
    $('#c-show').addEventListener('click', showCode);
    $('#grade-tabs').addEventListener('click', e => { const b = e.target.closest('[data-grade]'); if (b) pickGrade(Number(b.dataset.grade)); });
    $('#chapters').addEventListener('click', e => {
      if (e.target.closest('[data-open-map]')) return G.nav('map');
      if (e.target.closest('[data-open-solar]')) return G.nav('solar');
      const b = e.target.closest('[data-ch]');
      if (!b) return;
      G.curCh = b.dataset.ch;
      const c = C.chapter(G.curCh);
      if (c) C.load(c.grade);
      G.nav('levels');
    });
    $('#stairs').addEventListener('click', e => {
      const b = e.target.closest('.step');
      if (b && !b.disabled) G.startLevel(G.curCh, Number(b.dataset.n));
    });
    $('#world').addEventListener('click', e => { const m = e.target.closest('[data-site]'); if (m) pickSite(m.dataset.site); });
    $('#world').addEventListener('keydown', e => {
      const m = e.target.closest('[data-site]');
      if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickSite(m.dataset.site); }
    });
    $('#site-list').addEventListener('click', e => { const b = e.target.closest('[data-site]'); if (b) pickSite(b.dataset.site); });
    $('#m-secs').addEventListener('click', e => {
      const b = e.target.closest('[data-sec]');
      if (!b) return;
      const k = b.dataset.sec;
      mset.sections = mset.sections.includes(k) ? mset.sections.filter(x => x !== k) : MAP_SECS.filter(x => x === k || mset.sections.includes(x));
      b.setAttribute('aria-pressed', String(mset.sections.includes(k)));
      saveMset(); syncStart();
    });
    $('#m-count').addEventListener('change', e => {
      const v = e.target.value;
      mset.count = v === 'all' ? 'all' : Number(v);
      saveMset(); syncStart();
    });
    $('#m-start').addEventListener('click', () => G.startMap(mset.sections, mset.count));

    $('#solar-view').addEventListener('click', e => { const m = e.target.closest('[data-body]'); if (m) pickBody(m.dataset.body); });
    $('#solar-view').addEventListener('keydown', e => {
      const m = e.target.closest('[data-body]');
      if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); pickBody(m.dataset.body); }
    });
    $('#body-list').addEventListener('click', e => { const b = e.target.closest('[data-body]'); if (b) pickBody(b.dataset.body); });
    $('#s-count').addEventListener('change', e => {
      const v = e.target.value;
      scount = v === 'all' ? 'all' : Number(v);
      try { localStorage.setItem('gadarga-solar-count', JSON.stringify(scount)); } catch (err) {}
      syncSolarStart();
    });
    $('#s-start').addEventListener('click', () => G.startSolar(scount));
    $('#order-start').addEventListener('click', startOrder);
    $('#order-chips').addEventListener('click', e => { const b = e.target.closest('[data-ord]'); if (b && !b.disabled) tapOrder(b); });

    $('#profile-new').addEventListener('click', () => G.newLocalProfile());
    $('#sync-save').addEventListener('click', () => {
      const u = $('#sync-url').value.trim();
      if (u && !G.validSyncUrl(u)) {
        $('#sync-status').textContent = 'Холбоос буруу байна. «https://script.google.com/macros/s/…/exec» хэлбэртэй байх ёстой.';
        return;
      }
      G.setSyncUrl(u);
      renderSync();
    });
    $('#profile-list').addEventListener('click', e => {
      const b = e.target.closest('[data-pact]');
      if (!b) return;
      const id = b.dataset.id;
      if (b.dataset.pact === 'use') return G.switchProfile(id);
      if (b.dataset.pact === 'logout') { G.logout(id); return G.me ? G.renderProfiles() : G.route(); }
      if (delArm !== id) {
        delArm = id; clearTimeout(delTimer);
        delTimer = setTimeout(() => { delArm = null; if (G.screen === 'profiles') G.renderProfiles(); }, 3000);
        return G.renderProfiles();
      }
      delArm = null;
      G.deleteProfile(id);
      if (!G.localProfiles().length) return G.openEditor(true);
      G.renderProfiles();
      G.renderNav();
    });

    $('#teacher').addEventListener('click', async e => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      b.disabled = true;
      if (b.dataset.act === 'unstaff') {
        if (G.isOwner) await G.db.doc('staff/' + b.dataset.id).delete().catch(() => {});
      } else {
        await G.setApproval(b.dataset.id, b.dataset.act === 'approve');
      }
      b.disabled = false;
    });
    $('#code-new').addEventListener('click', async () => {
      $('#code-msg').textContent = 'Код үүсгэж байна…';
      const ok = await G.makeCode();
      $('#code-msg').textContent = ok ? 'Шинэ код бэлэн. Өмнөх код ажиллахаа больсон.' : 'Код үүсгэж чадсангүй. Дахин оролдоно уу.';
    });
    $('#code-copy').addEventListener('click', () => G.classCode && G.copyText(G.formatCode(G.classCode), null, $('#code-msg')));
    $('#code-off').addEventListener('click', async () => {
      const ok = await G.closeCode();
      $('#code-msg').textContent = ok ? 'Кодоор нэгдэх боломжийг хаалаа. Кодоор нэгдсэн тоглогчид хэвээр үлдэнэ.' : 'Кодыг хааж чадсангүй.';
    });
  };
})();
