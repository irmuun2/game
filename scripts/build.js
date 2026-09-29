// src/ → public/ : Vercel-д байршуулах бэлэн сайтыг бүтээнэ.
// - Асуултын эх файлуудыг (хариулттай) нийтлэхгүй, оронд нь нууцалсан gadarga-qdata.js үүсгэнэ.
// - config.js-ийг орчны хувьсагч (SUPABASE_URL, SUPABASE_ANON_KEY) эсвэл config.local.json-оос үүсгэнэ.
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'public');
// Хариулттай эх файлууд зөвхөн таны компьютерт (questions/, GitHub-д орохгүй).
const QDIR = path.join(root, 'questions'), QUESTION_SOURCES = ['gadarga-questions.js', 'gadarga-questions-v1.js'];

// Асуултын эх файл байвал (таны компьютер) нууцалсан src/gadarga-qdata.js-ийг шинээр үүсгэнэ.
// Vercel дээр эх файл байхгүй тул GitHub-д байгаа нууцалсан хувилбарыг шууд ашиглана.
let qinfo = 'GitHub дахь нууцалсан асуулт';
if (QUESTION_SOURCES.every(f => fs.existsSync(path.join(QDIR, f)))) {
  const w = { GADARGA: {} };
  for (const f of QUESTION_SOURCES) new Function('window', 'GADARGA', fs.readFileSync(path.join(QDIR, f), 'utf8'))(w, w.GADARGA);
  const g = w.GADARGA;
  const json = JSON.stringify({ BLOOM: g.BLOOM, SECTIONS: g.SECTIONS, LEVELS: g.LEVELS, Q: g.Q, Q1: g.Q1 });
  const key = crypto.randomBytes(24), data = Buffer.from(json, 'utf8');
  for (let i = 0; i < data.length; i++) data[i] ^= key[i % key.length];
  fs.writeFileSync(path.join(src, 'gadarga-qdata.js'),
    '// Асуултын сан (нууцалсан). Засах бол questions/ доторх эх файлыг засаад npm run build.\n' +
    '(function(){var k=atob("' + key.toString('base64') + '"),d=atob("' + data.toString('base64') + '"),b=new Uint8Array(d.length);' +
    'for(var i=0;i<d.length;i++)b[i]=d.charCodeAt(i)^k.charCodeAt(i%k.length);' +
    'window.GADARGA=Object.assign(window.GADARGA||{},JSON.parse(new TextDecoder().decode(b)));})();\n');
  qinfo = `${g.Q.length} + ${g.Q1.length} асуулт`;
}
if (!fs.existsSync(path.join(src, 'gadarga-qdata.js'))) throw new Error('src/gadarga-qdata.js алга: questions/ хавтсанд асуултын эх файлуудыг хийгээд дахин build хийнэ үү.');

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
