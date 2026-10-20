// Бүлгийн асуултын файлуудыг шалгана: npm run check  (эсвэл node scripts/check-questions.js questions/8-1.js)
// Файлын бүтэц: questions/<анги>-<бүлэг>.js доторх GADARGA_CHAPTER({ … }). README-г үзнэ үү.
const fs = require('fs'), path = require('path');
const QDIR = path.join(__dirname, '..', 'questions');
const files = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.existsSync(QDIR) ? fs.readdirSync(QDIR).filter(f => /^\d{1,2}-\d{1,2}\.js$/.test(f)).map(f => path.join(QDIR, f)) : [];
if (!files.length) { console.log('Шалгах бүлгийн файл алга (questions/<анги>-<бүлэг>.js).'); process.exit(0); }

let failed = 0;
for (const file of files) {
  const errs = [], warns = [];
  let ch = null;
  try {
    new Function('GADARGA_CHAPTER', fs.readFileSync(file, 'utf8'))(c => { if (ch) errs.push('GADARGA_CHAPTER хоёр удаа дуудагдсан'); ch = c; });
  } catch (e) { console.log(`${path.basename(file)}: БИЧЛЭГИЙН АЛДАА — ${e.message}`); failed++; continue; }
  if (!ch) { console.log(`${path.basename(file)}: GADARGA_CHAPTER({ … }) алга`); failed++; continue; }

  const str = v => typeof v === 'string' && v.trim().length > 0;
  if (ch.id + '.js' !== path.basename(file)) errs.push(`id «${ch.id}» файлын нэртэй ижил байх ёстой`);
  if (!/^\d{1,2}-\d{1,2}$/.test(ch.id || '')) errs.push('id нь «7-1» хэлбэртэй байна');
  if (!Number.isInteger(ch.grade) || String(ch.grade) !== String(ch.id).split('-')[0]) errs.push('grade нь id-ийн эхний тоотой ижил байна');
  if (!str(ch.n)) errs.push('n (бүлгийн ром тоо) алга');
  if (!str(ch.title)) errs.push('title алга');
  const pm = String(ch.pages || '').match(/^(\d+)–(\d+)$/);
  if (!pm) errs.push('pages нь «4–15» хэлбэртэй (богино зураас –) байна');
  const p0 = pm ? +pm[1] : 0, p1 = pm ? +pm[2] : 9999;
  const secs = ch.sections && typeof ch.sections === 'object' ? ch.sections : {};
  if (!secs[ch.n]) errs.push(`sections дотор бүлгийн нэгтгэлийн түлхүүр «${ch.n}» байна`);

  const L = Array.isArray(ch.levels) ? ch.levels : [];
  if (L.length < 3 || L.length > 9) errs.push(`3–9 түвшин байна (одоо ${L.length})`);
  L.forEach((l, i) => {
    if (l.n !== i + 1) errs.push(`levels[${i}].n нь ${i + 1} байна`);
    if (!secs[l.s]) errs.push(`levels[${i}].s «${l.s}» sections-д алга`);
    if (!str(l.title)) errs.push(`levels[${i}].title алга`);
    else if (l.title.length > 30) warns.push(`түвшин ${l.n}-ийн нэр урт (${l.title.length} тэмдэгт)`);
    if (i === L.length - 1) { if (!l.free || l.size !== 10) errs.push('сүүлийн түвшин { free: true, size: 10 } байна'); }
    else if (l.free || l.size !== 6 || l.pass !== 4) errs.push(`түвшин ${l.n}: size: 6, pass: 4 байна`);
  });

  const Q = Array.isArray(ch.Q) ? ch.Q : [];
  // Нэмэлт тоглоомын асуултууд (жишээ нь II бүлгийн «Нарны аймгийн аялал»): түвшингүй, бусад нь ижил.
  if (ch.extra != null && !Array.isArray(ch.extra)) errs.push('extra нь асуултын жагсаалт байна');
  if (ch.game != null && !['solar'].includes(ch.game)) errs.push(`game «${ch.game}» гэсэн нэмэлт тоглоом алга`);
  if (Array.isArray(ch.extra) && !ch.game) errs.push('extra асуулт байгаа бол game-ийг заана');
  const X = Array.isArray(ch.extra) ? ch.extra : [];
  const seen = new Set(), per = {};
  Q.concat(X.map(q => Object.assign({ extra: true }, q))).forEach((q, i) => {
    const at = `${q.extra ? 'extra' : 'Q'}[${q.extra ? i - Q.length : i}] «${String(q.q || '').slice(0, 40)}»`;
    if (!q.extra && !L.some(l => l.n === q.l)) errs.push(`${at}: l=${q.l} гэсэн түвшин алга`);
    if (!secs[q.s]) errs.push(`${at}: s=«${q.s}» sections-д алга`);
    if (!Number.isInteger(q.p) || q.p < p0 || q.p > p1) errs.push(`${at}: хуудас p=${q.p} нь ${p0}–${p1}-д багтахгүй`);
    if (!str(q.q)) errs.push(`${at}: асуулт хоосон`);
    if (!Array.isArray(q.a) || q.a.length !== 4 || !q.a.every(str)) errs.push(`${at}: a нь 4 хариулттай (эхнийх нь зөв)`);
    else if (new Set(q.a.map(x => x.trim().toLowerCase())).size !== 4) errs.push(`${at}: давхардсан хариулт`);
    if (!str(q.e)) errs.push(`${at}: тайлбар e алга`);
    const key = String(q.q || '').trim().toLowerCase();
    if (seen.has(key)) errs.push(`${at}: давхардсан асуулт`);
    seen.add(key);
    if (!q.extra) per[q.l] = (per[q.l] || 0) + 1;
  });
  L.forEach(l => {
    const n = per[l.n] || 0;
    if (l.free) { if (n < 1) errs.push(`түвшин ${l.n}: өөрийн асуулт алга`); }
    else if (n < 6) errs.push(`түвшин ${l.n}: ${n} асуулт (дор хаяж 6, 8–10 байвал сайн)`);
    else if (n < 8) warns.push(`түвшин ${l.n}: ${n} асуулт (8–10 байвал давтагдах нь цөөрнө)`);
  });

  console.log(`${ch.id} «${ch.title}»: ${Q.length} асуулт · түвшин ${L.map(l => `${l.n}:${per[l.n] || 0}`).join(' ')}` + (X.length ? ` · нэмэлт тоглоом ${X.length}` : ''));
  warns.forEach(w => console.log('  анхаар: ' + w));
  errs.forEach(e => console.log('  АЛДАА: ' + e));
  if (errs.length) failed++;
}
console.log(failed ? `${failed} файлд алдаа байна.` : 'Бүгд зөв.');
process.exit(failed ? 1 : 0);
