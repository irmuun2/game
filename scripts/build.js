// src/ → public/ : Vercel-д байршуулах бэлэн сайтыг бүтээнэ.
// - Асуултын эх файлуудыг (хариулттай) нийтлэхгүй, оронд нь анги тус бүрийн нууцалсан асуултын файл үүсгэнэ.
// - config.js-ийг орчны хувьсагч (SUPABASE_URL, SUPABASE_ANON_KEY) эсвэл config.local.json-оос үүсгэнэ.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'public');
// Хариулттай эх файлууд зөвхөн таны компьютерт (questions/, GitHub-д орохгүй).
//   gadarga-questions.js, gadarga-questions-v1.js — 7-р анги, III бүлэг (анхны хувилбар) ба газрын зургийн тоглоом
//   <анги>-<бүлэг>.js (жишээ нь 7-1.js, 8-2.js) — бусад бүлэг: GADARGA_CHAPTER({ … })
const QDIR = path.join(root, 'questions'), LEGACY = ['gadarga-questions.js', 'gadarga-questions-v1.js'];
// Цэсэнд харагдах ангиуд. Асуултгүй анги «Удахгүй» гэж харагдана.
const GRADES = [7, 8, 9, 10, 11];

// Нууцалсан JS файл: өгөгдлийг XOR-оор далдалж, ачаалахад window.GADARGA.CH-д нэмнэ.
function writeSecret(file, obj, note) {
  const key = crypto.randomBytes(24), data = Buffer.from(JSON.stringify(obj), 'utf8');
  for (let i = 0; i < data.length; i++) data[i] ^= key[i % key.length];
  fs.writeFileSync(path.join(src, file),
    '// ' + note + ' (нууцалсан). Засах бол questions/ доторх эх файлыг засаад npm run build.\n' +
    '(function(){var k=atob("' + key.toString('base64') + '"),d=atob("' + data.toString('base64') + '"),b=new Uint8Array(d.length);' +
    'for(var i=0;i<d.length;i++)b[i]=d.charCodeAt(i)^k.charCodeAt(i%k.length);' +
    'var o=JSON.parse(new TextDecoder().decode(b)),G=window.GADARGA=window.GADARGA||{};' +
    'G.CH=Object.assign(G.CH||{},o.CH);G.X=Object.assign(G.X||{},o.X);if(o.Q1)G.Q1=o.Q1;})();\n');
}

// Асуултын эх файл байвал (таны компьютер) нууцалсан файлуудыг шинээр үүсгэнэ.
// Vercel дээр эх файл байхгүй тул GitHub-д байгаа нууцалсан хувилбарыг шууд ашиглана.
let qinfo = 'GitHub дахь нууцалсан асуулт';
if (LEGACY.every(f => fs.existsSync(path.join(QDIR, f)))) {
  const w = { GADARGA: {} };
  for (const f of LEGACY) new Function('window', 'GADARGA', fs.readFileSync(path.join(QDIR, f), 'utf8'))(w, w.GADARGA);
  const g = w.GADARGA;
  const chapters = [{
    id: '7-3', grade: 7, n: 'III', title: 'Дэлхийн гадарга', pages: '21–30', game: 'map',
    sections: g.SECTIONS, levels: g.LEVELS.map(({ n, s, title, size, pass, free }) => ({ n, s, title, size, pass, free })), Q: g.Q
  }];
  fs.readdirSync(QDIR).filter(f => /^\d{1,2}-\d{1,2}\.js$/.test(f)).forEach(f => {
    new Function('GADARGA_CHAPTER', fs.readFileSync(path.join(QDIR, f), 'utf8'))(c => {
      if (!c || c.id + '.js' !== f) throw new Error(`${f}: id нь файлын нэртэй ижил байх ёстой`);
      if (!c.levels.every(l => c.Q.filter(q => q.l === l.n).length >= (l.free ? 1 : l.size))) throw new Error(`${f}: түвшин бүрт хангалттай асуулт алга`);
      chapters.push(c);
    });
  });
  const num = id => id.split('-').map(Number);
  chapters.sort((a, b) => num(a.id)[0] - num(b.id)[0] || num(a.id)[1] - num(b.id)[1]);

  // Цэс (асуултгүй): анги, бүлэг, сэдэв, түвшин. Хариулт агуулаагүй тул нууцлахгүй.
  const catalog = {
    // Асуулт өөрчлөгдөхөд хөтөч хуучин файлыг ашиглахгүйн тулд.
    v: crypto.createHash('sha256').update(JSON.stringify(chapters)).digest('hex').slice(0, 10),
    grades: GRADES.map(gr => ({
      g: gr,
      chapters: chapters.filter(c => c.grade === gr).map(c => ({
        id: c.id, n: c.n, title: c.title, pages: c.pages, sections: c.sections, game: c.game || '', extra: (c.extra || []).length,
        levels: c.levels.map(l => Object.assign({}, l, { count: c.Q.filter(q => q.l === l.n).length })), count: c.Q.length
      }))
    }))
  };
  fs.writeFileSync(path.join(src, 'gadarga-catalog.js'),
    '// Анги, бүлэг, түвшний жагсаалт (асуултгүй). npm run build үүсгэнэ.\nwindow.GADARGA_CATALOG = ' + JSON.stringify(catalog) + ';\n');

  // Асуулт: 7-р анги тоглоом нээгдэхэд шууд ачаалагдана (gadarga-qdata.js), бусад анги сонгоход (gadarga-qdata-8.js …).
  const strip = Q => Q.map(({ l, s, p, q, a, e, fig }) => (fig ? { l, s, p, q, a, e, fig } : { l, s, p, q, a, e }));
  const counts = [];
  GRADES.forEach(gr => {
    const file = gr === 7 ? 'gadarga-qdata.js' : `gadarga-qdata-${gr}.js`;
    const list = chapters.filter(c => c.grade === gr);
    if (!list.length) { if (gr !== 7) fs.rmSync(path.join(src, file), { force: true }); return; }
    // X: бүлгийн нэмэлт тоглоомын асуултууд (жишээ нь II бүлгийн «Нарны аймгийн аялал»).
    const CH = {}, X = {};
    list.forEach(c => { CH[c.id] = strip(c.Q); if (c.extra) X[c.id] = strip(c.extra); });
    writeSecret(file, gr === 7 ? { CH, X, Q1: g.Q1 } : { CH, X }, `${gr}-р ангийн асуултын сан`);
    counts.push(`${gr}-р анги: ${list.length} бүлэг, ${list.reduce((s, c) => s + c.Q.length + (c.extra || []).length, 0)} асуулт`);
  });
  qinfo = counts.join(' · ') + ` · газрын зургийн тоглоом ${g.Q1.length} асуулт`;
}
['gadarga-qdata.js', 'gadarga-catalog.js'].forEach(f => {
  if (!fs.existsSync(path.join(src, f))) throw new Error(`src/${f} алга: questions/ хавтсанд асуултын эх файлуудыг хийгээд дахин build хийнэ үү.`);
});

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(src)) fs.copyFileSync(path.join(src, f), path.join(out, f));

// Supabase холболтын тохиргоо (publishable/anon түлхүүр нь нийтэд харагдах зориулалттай; хамгаалалтыг RLS дүрэм хийнэ).
// Эрэмбэ: config.public.json (GitHub-д байгаа) → орчны хувьсагч (Vercel) → config.local.json (зөвхөн өөрийн компьютерт).
const cfg = { supabaseUrl: '', supabaseAnonKey: '' };
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); } catch (e) { return {}; } };
Object.assign(cfg, readJson('config.public.json'));
if (process.env.SUPABASE_URL) cfg.supabaseUrl = process.env.SUPABASE_URL;
if (process.env.SUPABASE_ANON_KEY) cfg.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
Object.assign(cfg, readJson('config.local.json'));
// «…supabase.co/rest/v1/» гэж хуулсан байсан ч төслийн үндсэн хаяг болгоно.
cfg.supabaseUrl = String(cfg.supabaseUrl || '').trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
fs.writeFileSync(path.join(out, 'config.js'), 'window.GADARGA_CONFIG = ' + JSON.stringify(cfg) + ';\n');

console.log(`public/ бэлэн: ${qinfo} · Supabase ${cfg.supabaseUrl ? 'холбогдсон' : 'тохируулаагүй (офлайн горим)'}`);
