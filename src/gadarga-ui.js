// Нүүр цэс: аватар засварлагч, дэлгүүр ба шүүгээ, стил бүрдүүлэх, урих, цэсний мөр, шагнал.
(function () {
  'use strict';
  const G = window.GAME;
  const AV = window.GADARGA_AVATAR;
  const $ = G.$, esc = G.esc;
  const SKIN_NAMES = ['Цайвар', 'Шаргал', 'Хүрэн шаргал', 'Хүрэн', 'Бараан'];

  /* ---------- Аватар засварлагч (суурь төрх) ---------- */
  let draft = null, draftNew = false;
  const rnd = n => Math.floor(Math.random() * n);

  G.openEditor = function (isNew) {
    draftNew = !!isNew || !G.me;
    draft = AV.normalize(G.me ? G.me.avatar : AV.DEFAULT);
    if (draftNew) Object.assign(draft, { bg: rnd(AV.BG.length), skin: rnd(AV.SKIN.length), hair: rnd(4), shirt: rnd(AV.SHIRT.length) });
    const asks = draftNew && G.mode === 'shared' && !G.isAdmin;
    $('#ed-name').value = G.me ? G.me.nick : '';
    $('#ed-code').value = '';
    $('#ed-code-wrap').hidden = !asks;
    $('#ed-title').textContent = draftNew ? 'Аватараа бүтээ' : 'Аватар засах';
    $('#ed-save').textContent = asks ? 'Нэгдэх' : draftNew ? 'Тоглож эхлэх' : 'Хадгалах';
    $('#ed-sub').textContent = asks
      ? 'Код оруулбал шууд нэгдэнэ. Код байхгүй бол багшид хүсэлт илгээгдэнэ.'
      : 'Малгай, шил, хувцсыг Нүүр цэсийн дэлгүүрээс авна.';
    $('#ed-cancel').hidden = draftNew && !(G.mode === 'local' && G.localProfiles().length);
    $('#ed-err').hidden = true;
    const opt = (label, html) => `<div class="opt"><p class="label">${label}</p>${html}</div>`;
    const sw = (key, colors, names) => `<div class="swatches">${colors.map((c, i) =>
      `<button type="button" class="sw" data-k="${key}" data-v="${i}" style="background:${c}" aria-label="${names ? names[i] : 'Өнгө ' + (i + 1)}"></button>`).join('')}</div>`;
    const pills = (key, names) => `<div class="pills">${names.map((n, i) =>
      `<button type="button" class="pbtn" data-k="${key}" data-v="${i}">${n}</button>`).join('')}</div>`;
    $('#ed-opts').innerHTML =
      opt('Арьсны өнгө', sw('skin', AV.SKIN, SKIN_NAMES)) + opt('Үс', pills('hair', AV.HAIR)) +
      opt('Үсний өнгө', sw('hairC', AV.HAIRC)) + opt('Нүд', pills('eyes', AV.EYES)) +
      opt('Ам', pills('mouth', AV.MOUTH)) + opt('Цамцны өнгө', sw('shirt', AV.SHIRT)) + opt('Дэвсгэр', sw('bg', AV.BG));
    refreshEditor();
    G.show('create');
  };

  function refreshEditor() {
    $('#ed-preview').innerHTML = AV.svg(draft, 160);
    document.querySelectorAll('#ed-opts [data-k]').forEach(b => {
      b.setAttribute('aria-pressed', String(draft[b.dataset.k] === Number(b.dataset.v)));
    });
  }

  async function saveEditor() {
    const nick = $('#ed-name').value.trim().slice(0, 20);
    const err = $('#ed-err');
    const fail = m => { err.textContent = m; err.hidden = false; };
    if (!nick) { fail('Тоглогчийн нэрээ бичнэ үү.'); $('#ed-name').focus(); return; }
    err.hidden = true;
    const btn = $('#ed-save');
    btn.disabled = true;
    let join = '';
    const raw = $('#ed-code-wrap').hidden ? '' : $('#ed-code').value.trim();
    if (raw) {
      join = await G.checkCode(raw);
      if (!join) { btn.disabled = false; fail('Код буруу эсвэл хаагдсан байна. Кодгүйгээр хүсэлт илгээх бол талбарыг хоосон орхино уу.'); return; }
    }
    const ok = await G.saveProfile(nick, draft, join);
    btn.disabled = false;
    if (ok) G.route();
  }

  /* ---------- Цэсний мөр ---------- */
  G.renderNav = function () {
    const me = G.me;
    const online = G.mode === 'shared';
    const chip = `<span class="mode-chip ${online ? 'on' : 'off'}" title="${online ? 'Оноо онлайн хадгалагдаж, бүх тоглогч харагдана' : 'Зөвхөн энэ төхөөрөмж дээр хадгалагдана'}">${online ? 'Онлайн' : 'Офлайн'}</span>`;
    const out = window.GADARGA_CLOUD ? '<button type="button" class="btn-ghost sm" id="cloud-logout">Гарах</button>' : '';
    $('#nav-me').innerHTML = chip + out + (me ? `${AV.svg(me.avatar, 34)}<span><b>${me.total}</b> оноо · дэлгүүрт ${G.balance(me)}</span>` : '');
    $('#nav-teacher').hidden = !(G.mode === 'shared' && G.isAdmin);
    const pend = G.mode === 'shared' && G.isAdmin ? G.pendingIds().length : 0;
    $('#t-badge').hidden = !pend;
    $('#t-badge').textContent = pend;
    $('#nav-profiles').hidden = G.mode !== 'local';
  };

  /* ---------- Нүүр ---------- */
  let slotTab = 'hat', shopMsg = '';

  // Одоогийн цол ба дараагийн цол хүртэлх ахиц.
  function titleLine(me) {
    const t = G.titleOf(me.total), cur = G.TITLES[t.i].need;
    const next = t.next;
    const pct = next ? Math.round((me.total - cur) / (next.need - cur) * 100) : 100;
    return `<p class="lm-titles" style="margin:8px 0 0"><span class="title-chip">${esc(t.name)}</span></p>` +
      `<div class="next-hat">${next
        ? `<p>Дараагийн цол: <b>${esc(next.name)}</b>, нийт ${next.need} оноо хүрэхэд (${next.need - me.total} дутуу)</p><div class="meter title-meter"><i style="width:${pct}%"></i></div>`
        : '<p>Хамгийн дээд цолд хүрлээ!</p>'}</div>`;
  }

  function nextMilestone(me) {
    const list = AV.HATS.filter(h => h.need > 0);
    const next = list.find(h => h.need > me.total);
    const prev = list.filter(h => h.need <= me.total).pop();
    return { next, from: prev ? prev.need : 0 };
  }

  G.renderHome = function () {
    const me = G.me;
    const { next, from } = nextMilestone(me);
    const pct = next ? Math.round((me.total - from) / (next.need - from) * 100) : 100;
    const badges = AV.STYLES.filter(s => AV.wearingStyle(me.avatar, s.id))
      .map(s => `<span class="sbadge ${s.id}">${s.name}</span>`).join('') +
      (me.reward ? '<span class="sbadge formal">Газарзүйч</span>' : '');
    $('#home-me').innerHTML =
      `<div class="av-ring">${AV.svg(me.avatar, 120)}</div><div>` +
      `<p class="me-name">${esc(me.nick)}</p>` + titleLine(me) +
      `<p class="me-pts"><b>${me.total}</b> нийт оноо · ${G.passedCount(me)} түвшин давсан</p>` +
      (badges ? `<div class="style-badges">${badges}</div>` : '') +
      `<div class="next-hat">${next
        ? `<p>Дараагийн шагнал: <b>${next.name}</b>, нийт ${next.need} оноо хүрэхэд (${next.need - me.total} дутуу)</p><div class="meter"><i style="width:${pct}%"></i></div>`
        : '<p>Оноогоор нээгдэх бүх шагналыг цуглууллаа!</p>'}</div>` +
      '<div class="row" style="margin-top:12px"><button type="button" class="btn-ghost sm" id="btn-edit">Төрх засах</button><button type="button" class="btn-primary sm" data-nav="games">Тоглох</button></div></div>';
    $('#wallet').innerHTML = `Дэлгүүрийн оноо: <b>${G.balance(me)}</b>`;
    renderShop();
    renderStyles();

    const admin = G.mode === 'shared' && G.isAdmin;
    $('#invite-link').value = G.LINK;
    // Урих хэсэг зөвхөн үүсгэгчид (эсвэл багшийн өөрийн компьютер дээрх хувилбарт) харагдана.
    $('#invite-card').hidden = !((G.mode === 'shared' && G.isAdmin) || (G.mode === 'local' && !window.GADARGA_STANDALONE));
    $('#invite-text').textContent = window.GADARGA_STANDALONE
      ? 'Энэ апп-ын файлыг бусдад шууд явуулж болно. Багшийн онлайн жагсаалттай хувилбарын холбоос:'
      : G.mode === 'local'
      ? 'Нийтэлсэн тоглоомын холбоос. Хуудас тухайн хүнтэй Share цэснээс хуваалцагдсан байх ёстой.'
      : admin
        ? 'Холбоосыг хуулж сурагчид руу явуулна. Ангийн кодыг Багш цэсэнд үүсгэнэ.'
        : 'Холбоосыг найздаа явуул. Найз чинь багшийн өгсөн кодоор эсвэл багшийн зөвшөөрлөөр нэгдэнэ.';
    $('#mode-note').textContent = G.mode === 'local' ? G.localNote : 'Таны ахиц энэ хуудсан дээр хадгалагдаж, багш болон бусад тоглогчид харна.';
  };

  function itemMeta(item, me, un) {
    if (item.id === 'none') return 'Үндсэн';
    if (item.price) return un ? 'Худалдаж авсан' : `${item.price} оноо`;
    if (item.reward) return un ? 'Үнэгүй шагнал' : '5 түвшин давбал үнэгүй';
    return un ? `${item.need} оноонд нээгдсэн` : `Нийт ${item.need} оноо хүрэхэд`;
  }

  function renderShop() {
    const me = G.me, bal = G.balance(me);
    $('#slot-tabs').innerHTML = AV.SLOTS.map(s =>
      `<button type="button" class="slot-tab" role="tab" data-slot="${s.id}" aria-selected="${s.id === slotTab}">${s.name}</button>`).join('');
    const items = AV.ITEMS.filter(i => i.slot === slotTab);
    $('#shop').innerHTML = (shopMsg ? `<p class="note" style="grid-column:1/-1;margin:0" aria-live="polite">${esc(shopMsg)}</p>` : '') + items.map(item => {
      const un = AV.unlocked(item, me), worn = me.avatar[item.slot] === item.id;
      const style = item.style ? `<span class="it-style">${AV.STYLES.find(s => s.id === item.style).name}</span>` : '';
      let btn;
      if (worn) btn = '<button type="button" class="btn-ghost sm" disabled>Өмссөн</button>';
      else if (un) btn = `<button type="button" class="btn-primary sm" data-act="wear" data-slot="${item.slot}" data-id="${item.id}">Өмсөх</button>`;
      else if (item.price) btn = `<button type="button" class="btn-primary sm" data-act="buy" data-slot="${item.slot}" data-id="${item.id}" ${bal < item.price ? 'disabled' : ''}>Авах · ${item.price}</button>`;
      else btn = '<button type="button" class="btn-ghost sm" disabled>Түгжээтэй</button>';
      const preview = AV.svg(Object.assign({}, me.avatar, { [item.slot]: item.id }), 76);
      return `<div class="item${worn ? ' worn' : ''}${un ? '' : ' locked'}">${preview}<span class="it-name">${item.name}</span>${style}<span class="it-meta">${itemMeta(item, me, un)}</span>${btn}</div>`;
    }).join('');
  }

  function renderStyles() {
    const me = G.me, bal = G.balance(me);
    $('#styles').innerHTML = AV.STYLES.map(s => {
      const ch = G.styleChoice(s.id);
      const own = ch.filter(c => c.have);
      const missing = ch.filter(c => !c.have);
      const cost = missing.reduce((t, c) => t + c.buy.price, 0);
      const wearing = AV.wearingStyle(me.avatar, s.id);
      const look = Object.assign({}, me.avatar);
      ch.forEach(c => { look[c.slot] = (c.have || c.buy).id; });
      const items = ch;
      let btn;
      if (wearing) btn = '<button type="button" class="btn-ghost sm" disabled>Стил бүрдсэн</button>';
      else if (!missing.length) btn = `<button type="button" class="btn-primary sm" data-act="style" data-id="${s.id}">Стилийг өмсөх</button>`;
      else btn = `<button type="button" class="btn-primary sm" data-act="buyset" data-id="${s.id}" ${bal < cost ? 'disabled' : ''}>Үлдсэнийг авах · ${cost}</button>`;
      return `<div class="style-card${wearing ? ' done' : ''}">${AV.svg(look, 72)}<div><h3>${s.name}</h3><p>${s.text}. ${own.length}/${items.length} зүйл цуглуулсан.</p>${btn}</div></div>`;
    }).join('');
  }

  async function copyText(text, input, msgEl) {
    try {
      await navigator.clipboard.writeText(text);
      msgEl.textContent = 'Хуулагдлаа!';
    } catch (e) {
      if (input) { input.focus(); input.select(); }
      msgEl.textContent = 'Автоматаар хуулж чадсангүй. Сонгогдсон текстийг Ctrl+C дарж хуулна уу.';
    }
  }
  G.copyText = copyText;

  /* ---------- Апп татах (онлайн хувилбараас) ---------- */
  let dl = null;
  async function initDownload() {
    if (window.GADARGA_STANDALONE || !window.claude || typeof window.claude.use !== 'function') return;
    try { dl = await window.claude.use('downloads'); } catch (e) { dl = null; }
    G.canDownload = !!dl;
    if (!dl) return;
    if (G.screen === 'teacher') G.renderTeacher();
    $('#app-dl').addEventListener('click', async () => {
      if (!G.isAdmin) return;
      const msg = $('#dl-msg'), btn = $('#app-dl');
      btn.disabled = true;
      msg.textContent = 'Апп-ыг бэлдэж байна…';
      try {
        const res = await fetch('gadarga-app.txt');
        if (!res.ok) throw { code: 'fetch' };
        const text = await res.text();
        await dl.save({ filename: 'Delhiin_gadarga_app.html', data: new Blob([text], { type: 'text/html' }) });
        msg.textContent = 'Файл хадгалагдлаа. Одоо үүнийг бусдад явуулж болно.';
      } catch (e) {
        const c = e && e.code;
        msg.textContent = c === 'declined' ? 'Татахыг цуцаллаа.'
          : c === 'rate_limited' ? 'Түр хүлээгээд дахин дарна уу.'
          : c === 'extension_not_enabled' || c === 'rejected_extension' ? 'Энэ орчинд .html файл татах боломжгүй байна. Файлыг багшаас шууд аваарай.'
          : 'Татаж чадсангүй. Дахин оролдоно уу.';
        if (['unavailable', 'not_granted', 'capability_disabled', 'capability_removed'].includes(c)) $('#app-dl-row').hidden = true;
      }
      btn.disabled = false;
    });
  }

  /* ---------- Хүлээх дэлгэц ---------- */
  G.renderWait = function () {
    $('#wait-av').innerHTML = AV.svg(G.me.avatar, 120);
    // Шинээр нэгдэж буй тоглогч зөвшөөрөл хүлээж байхдаа тэргүүлэгчдийг, тэдний амжилтыг харж болно.
    G.renderLeaders($('#wait-leaders'), { limit: 10 });
    $('#wait-err').hidden = true;
    if (G.declined(G.uid)) {
      $('#wait-title').textContent = 'Хүсэлтийг одоохондоо зөвшөөрөөгүй';
      $('#wait-msg').textContent = 'Багштайгаа ярилцаарай. Багш зөвшөөрвөл энэ хуудас автоматаар нээгдэнэ.';
      $('#wait-code-box').hidden = true;
    } else {
      $('#wait-title').textContent = 'Хүсэлт илгээгдлээ';
      $('#wait-msg').textContent = `${G.me.nick}, багш зөвшөөрөхөд тоглоом автоматаар нээгдэнэ.`;
      $('#wait-code-box').hidden = false;
    }
  };
  async function joinWithCode() {
    const err = $('#wait-err'), fail = m => { err.textContent = m; err.hidden = false; };
    const raw = $('#wait-code').value.trim();
    if (!raw) return fail('Кодоо оруулна уу.');
    // Багшийн үүсгэсэн «Анги» өрөөний код: нэгдмэгц шууд зөвшөөрөгдөнө.
    const rcode = G.cleanCode(raw);
    if (G.rooms[rcode]) {
      if (!G.isStaffRoom(rcode)) return fail('Энэ бол найзуудын өрөөний код. Эхлээд багшийн өгсөн ангийн код хэрэгтэй.');
      if (!G.me.rooms.includes(rcode)) G.me.rooms.push(rcode);
      await G.save();
      return G.route();
    }
    if (!G.classHash) return fail('Код буруу байна. Багшийн өгсөн кодыг шалгана уу.');
    const hash = await G.checkCode(raw);
    if (!hash) return fail('Код буруу эсвэл хаагдсан байна.');
    G.me.joinHash = hash;
    await G.save();
    G.route();
  }

  /* ---------- Имэйлээр нэвтрэх ---------- */
  let lgEmail = '', resendAt = 0;
  const LG_ERR = {
    email: 'Имэйл хаяг буруу байна. Жишээ нь: нэр@gmail.com',
    wait: 'Код саяхан илгээгдсэн. 1 минут хүлээгээд дахин оролдоно уу.',
    limit: 'Өнөөдөр энэ имэйл рүү хэт олон удаа код авлаа. Маргааш дахин оролдоно уу.',
    quota: 'Багшийн имэйл илгээх өдрийн хязгаар дууссан. Маргааш дахин оролдоно уу.',
    code: 'Код буруу байна. Имэйлээ дахин шалгана уу.',
    expired: 'Кодын хугацаа дууссан эсвэл олон удаа буруу оруулсан. Шинэ код авна уу.',
    network: 'Холбогдож чадсангүй. Интернэтээ шалгаад дахин оролдоно уу.',
    denied: 'Нэгдсэн самбарын тохиргоо буруу байна. Багшдаа хэлнэ үү.',
    url: 'Холбоос буруу байна. «https://script.google.com/macros/s/…/exec» хэлбэртэй байх ёстой.'
  };
  const lgErr = code => { const e = $('#lg-err'); e.textContent = LG_ERR[code] || 'Алдаа гарлаа. Дахин оролдоно уу.'; e.hidden = false; };
  const lgStep = n => { [1, 2, 3].forEach(i => { $('#lg-step' + i).hidden = i !== n; }); $('#lg-err').hidden = true; };
  G.openLogin = function () {
    lgStep(1);
    $('#lg-email').value = G.loginPrefill || lgEmail || '';
    G.loginPrefill = '';
    const m = $('#lg-msg');
    m.textContent = G.loginMsg || ''; m.hidden = !G.loginMsg; G.loginMsg = '';
    $('#lg-sync-url').value = G.syncUrl();
    $('#lg-sync').hidden = !!G.cloudLoginMode;
    G.show('login');
  };
  async function sendCode() {
    const email = G.cleanEmail($('#lg-email').value);
    if (!G.validEmail(email)) return lgErr('email');
    const btn = $('#lg-send');
    btn.disabled = true;
    const res = G.cloudLoginMode ? await cloudSend(email) : await G.sendLoginCode(email);
    btn.disabled = false;
    if (!res || !res.ok) return lgErr((res && res.error) || 'network');
    lgEmail = email; resendAt = Date.now() + 60000;
    $('#lg-sent').textContent = G.cloudLoginMode
      ? `Имэйл ${email} хаяг руу илгээгдлээ. Имэйлд ирсэн кодыг (6–8 оронтой) доор оруулна уу. Код биш холбоос (Confirm / Log in) ирсэн бол тэр холбоос дээр ганц удаа дарна уу. Сайт нэвтэрсэн байдлаар нээгдэнэ. Ирээгүй бол Spam хавтсаа шалгаарай.`
      : `Код ${email} хаяг руу илгээгдлээ. Ирээгүй бол Spam хавтсаа шалгаарай. Код 10 минут хүчинтэй.`;
    lgStep(2);
    $('#lg-code').value = '';
    $('#lg-code').focus();
  }
  // Вэб сайт: Supabase имэйл рүү 6 оронтой код илгээнэ.
  async function cloudSend(email) {
    const r = await window.GADARGA_CLOUD.sendOtp(email).catch(e => ({ error: e }));
    if (!r.error) return { ok: true };
    const m = String(r.error.message || '') + ' ' + (r.error.status || '');
    return { ok: false, error: /429|rate|seconds|limit/i.test(m) ? 'wait' : /invalid|email/i.test(m) ? 'email' : 'network' };
  }
  async function verifyCode() {
    const code = $('#lg-code').value.replace(/\D/g, '');
    // Supabase кодын уртыг 6–10 оронтой тохируулж болдог тул аль нь ч байсан хүлээн авна.
    if (code.length < 6 || code.length > 10) return lgErr('code');
    const btn = $('#lg-verify');
    btn.disabled = true;
    if (G.cloudLoginMode) {
      const r = await window.GADARGA_CLOUD.verifyOtp(lgEmail, code).catch(e => ({ error: e }));
      btn.disabled = false;
      if (r.error) return lgErr(/expired|invalid|token/i.test(String(r.error.message || '')) ? 'code' : 'network');
      return location.reload();
    }
    const res = await G.verifyLogin(lgEmail, code);
    btn.disabled = false;
    if (!res.ok) return lgErr(res.error);
    if (res.hasProfile) return G.route();
    const un = G.unlinkedProfiles();
    if (!un.length) return G.openEditor(true);
    $('#lg-adopt').innerHTML = un.map(x =>
      `<li class="prow" style="grid-template-columns:auto minmax(0,1fr) auto">${AV.svg(x.p.avatar, 44)}` +
      `<div style="min-width:0"><p class="nm">${esc(x.p.nick || 'Нэргүй')}</p><p class="sub">${x.p.total} оноо</p></div>` +
      `<button type="button" class="btn-primary sm" data-adopt="${esc(x.id)}">Энэ ахицыг авах</button></li>`).join('');
    lgStep(3);
  }

  /* ---------- Шагнал ---------- */
  function closeModal() { $('#modal').hidden = true; }
  G.showReward = function () {
    $('#modal-av').innerHTML = AV.svg(Object.assign({}, G.me.avatar, { hat: 'explorer' }), 140);
    $('#modal').hidden = false;
    $('#btn-wear').focus();
  };

  G.initUI = function () {
    $('#ed-opts').addEventListener('click', e => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      draft[b.dataset.k] = Number(b.dataset.v);
      refreshEditor();
    });
    $('#ed-save').addEventListener('click', saveEditor);
    $('#ed-name').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); saveEditor(); } });
    $('#ed-cancel').addEventListener('click', () => G.nav(G.me ? 'home' : 'profiles'));
    initDownload();
    $('#wait-edit').addEventListener('click', () => G.openEditor(false));
    $('#wait-join').addEventListener('click', joinWithCode);
    $('#bl-retry').addEventListener('click', () => location.reload());
    $('#lg-send').addEventListener('click', sendCode);
    $('#lg-email').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendCode(); } });
    $('#lg-verify').addEventListener('click', verifyCode);
    $('#lg-code').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); verifyCode(); } });
    $('#lg-resend').addEventListener('click', () => {
      if (Date.now() < resendAt) return lgErr('wait');
      $('#lg-email').value = lgEmail;
      sendCode();
    });
    $('#lg-back').addEventListener('click', () => lgStep(1));
    $('#lg-adopt').addEventListener('click', e => {
      const b = e.target.closest('[data-adopt]');
      if (b && G.adoptProfile(b.dataset.adopt)) G.route();
    });
    $('#lg-fresh').addEventListener('click', () => G.openEditor(true));
    $('#lg-sync-save').addEventListener('click', () => {
      const u = $('#lg-sync-url').value.trim();
      if (u && !G.validSyncUrl(u)) return lgErr('url');
      G.setSyncUrl(u);
      G.route();
    });
    $('#bl-offline').addEventListener('click', () => G.goOffline());
    $('#wait-code').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); joinWithCode(); } });

    document.addEventListener('click', e => {
      const n = e.target.closest('[data-nav]');
      if (n) { G.nav(n.dataset.nav); return; }
      if (e.target.closest('#btn-edit')) G.openEditor(false);
      if (e.target.closest('#cloud-logout')) window.GADARGA_CLOUD.signOut().then(() => location.reload());
    });
    $('#slot-tabs').addEventListener('click', e => {
      const b = e.target.closest('[data-slot]');
      if (!b) return;
      slotTab = b.dataset.slot; shopMsg = '';
      renderShop();
    });
    $('#home').addEventListener('click', e => {
      const b = e.target.closest('[data-act]');
      if (!b || b.disabled) return;
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'wear') G.wear(b.dataset.slot, id);
      else if (act === 'buy') {
        const item = AV.item(b.dataset.slot, id);
        if (G.buy(item)) shopMsg = `«${item.name}» худалдаж аваад өмслөө!`;
      } else if (act === 'style') G.wearStyle(id);
      else if (act === 'buyset') {
        G.styleChoice(id).filter(c => !c.have).forEach(c => G.buy(c.buy));
        if (G.wearStyle(id)) shopMsg = `${AV.STYLES.find(s => s.id === id).name} бүрдлээ!`;
      }
      G.renderHome();
      G.renderNav();
    });
    $('#copy-link').addEventListener('click', () => copyText(G.LINK, $('#invite-link'), $('#copy-msg')));

    $('#btn-wear').addEventListener('click', () => {
      G.me.avatar.hat = 'explorer';
      G.save();
      $('#res-av').innerHTML = AV.svg(G.me.avatar, 120);
      closeModal();
    });
    $('#btn-later').addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });
  };
})();
