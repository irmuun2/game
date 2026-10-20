// Агуулга: анги → бүлэг → түвшин → асуулт. Цэс нь gadarga-catalog.js-д, асуултууд нь анги тус бүрийн
// нууцалсан файлд (gadarga-qdata.js = 7-р анги, gadarga-qdata-8.js …) байна. Бусад ангийг сонгоход ачаална.
(function () {
  'use strict';
  const CAT = window.GADARGA_CATALOG || { grades: [] };
  // CH: бүлгийн түвшний асуултууд, XQ: бүлгийн нэмэлт тоглоомын асуултууд.
  const CH = {}, XQ = {}, loading = {};
  let Q1 = [];
  // 7-р ангийн III бүлэг анхны хувилбараас хойш ахиц, тайлангийн хуучин түлхүүрүүдтэй (1…6, L:12, 3.1) үлдэнэ.
  const LEGACY = '7-3';

  const fnv = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  // Ачаалсан асуултыг хувийн хувьсагчид шилжүүлж, нийтийн window.GADARGA-г цэвэрлэнэ.
  function absorb() {
    const G = window.GADARGA;
    if (!G) return;
    const take = (from, to) => Object.keys(from || {}).forEach(id => {
      const list = from[id];
      const byId = {};
      list.forEach((q, i) => { q.id = fnv(q.q); byId[q.id] = i; });
      to[id] = { Q: list, byId };
    });
    take(G.CH, CH); take(G.X, XQ);
    if (Array.isArray(G.Q1)) Q1 = G.Q1;
    G.CH = {}; G.X = {};
  }
  absorb();

  const byId = {};
  CAT.grades.forEach(g => g.chapters.forEach(c => { c.grade = g.g; byId[c.id] = c; }));

  const C = window.GADARGA_CONTENT = {
    LEGACY,
    grades: () => CAT.grades,
    grade: g => CAT.grades.find(x => x.g === g) || null,
    chapter: id => byId[id] || null,
    chapters: () => Object.values(byId),
    loaded: id => !!CH[id],
    questions: id => (CH[id] ? CH[id].Q : []),
    Q1: () => Q1,
    extra: id => (XQ[id] ? XQ[id].Q : []),
    // Нэмэлт тоглоомын асуултын сан: нэмэлт асуултууд + бүлгийн тэр сэдвийн түвшний асуултууд. [{ q, k }]
    extraPool(id) {
      const X = C.extra(id), secs = new Set(X.map(q => q.s));
      return C.questions(id).map((q, i) => ({ q, k: C.qKey(id, i) })).filter(x => secs.has(x.q.s))
        .concat(X.map((q, i) => ({ q, k: C.qKeyX(id, i) })));
    },
    // Тухайн ангийн асуултыг ачаална. 7-р анги аль хэдийн ачаалагдсан.
    load(g) {
      const gr = C.grade(g);
      if (!gr || !gr.chapters.length || gr.chapters.every(c => CH[c.id])) return Promise.resolve(!!gr);
      if (loading[g]) return loading[g];
      loading[g] = new Promise(res => {
        const s = document.createElement('script');
        s.src = `gadarga-qdata-${g}.js?v=${encodeURIComponent(CAT.v || '')}`;
        s.onload = () => { absorb(); res(gr.chapters.every(c => CH[c.id])); };
        s.onerror = () => { delete loading[g]; res(false); };
        document.head.appendChild(s);
      });
      return loading[g];
    },
    loadFor: ids => Promise.all([...new Set(ids.map(id => (byId[id] || {}).grade).filter(Boolean))].map(C.load)),

    // Тоглогчийн ахицын түлхүүр: me.levels[levelKey(бүлэг, түвшин)].
    levelKey: (id, n) => (id === LEGACY ? String(n) : id + ':' + n),
    // Тайлангийн асуултын түлхүүр: хуучин III бүлэг L:<дугаар>, бусад <бүлэг>:<асуултын хэш>.
    qKey: (id, qi) => (id === LEGACY ? 'L:' + qi : id + ':' + CH[id].Q[qi].id),
    // Нэмэлт тоглоомын асуулт: <бүлэг>x:<асуултын хэш>.
    qKeyX: (id, i) => id + 'x:' + XQ[id].Q[i].id,
    qByKey(k) {
      const s = String(k || ''), i = s.indexOf(':');
      if (i < 0) return null;
      const pre = s.slice(0, i), rest = s.slice(i + 1);
      if (pre === 'L') return CH[LEGACY] ? CH[LEGACY].Q[Number(rest)] || null : null;
      if (pre === 'M') return Q1[Number(rest)] || null;
      const c = /x$/.test(pre) ? XQ[pre.slice(0, -1)] : CH[pre];
      return c && c.byId[rest] != null ? c.Q[c.byId[rest]] : null;
    },
    chapterOfKey(k) {
      const pre = String(k || '').split(':')[0].replace(/x$/, '');
      return pre === 'L' || pre === 'M' ? LEGACY : byId[pre] ? pre : null;
    },
    // Сэдвийн түлхүүр: 7-р ангид сэдвийн дугаар (3.1), бусад ангид «8:1.2».
    secKey: (grade, s) => (grade === 7 ? s : grade + ':' + s),
    secInfo(key) {
      const m = String(key).match(/^(?:(\d+):)?(.+)$/), grade = m[1] ? Number(m[1]) : 7, s = m[2];
      const gr = C.grade(grade);
      const c = gr && gr.chapters.find(x => x.sections && x.sections[s]);
      if (!c) return null;
      return { grade, chapter: c, s, label: (s === c.n ? `${c.n} бүлэг · ` : s + ' ') + c.sections[s] };
    },
    // Сэдвийн нэр асуултын дээр: «1.2 Дэлхийг бүрхсэн торлол…» эсвэл бүлгийн нэгтгэл бол зөвхөн нэр.
    where: (c, s) => `${s === c.n ? '' : s + ' '}${c.sections[s] || ''}`
  };
})();
