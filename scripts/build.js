// src/ → public/ : Vercel-д байршуулах бэлэн сайтыг бүтээнэ (config.js, табны тэмдэг, хувилбарын дугаар).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(src, out, { recursive: true }); // thumbs/ хавтас ч хамт

// Хувилбар: package.json-ийн version (0.1.0 → «V.0.1»). Шинэчлэл бүрт дунд тоог нэмнэ.
const ver = String(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || '0.1.0').split('.').slice(0, 2).join('.');
for (const f of ['index.html', 'app.js', 'sw.js']) {
  const p = path.join(out, f);
  fs.writeFileSync(p, fs.readFileSync(p, 'utf8').split('__VERSION__').join(ver));
}

// Хөтчийн табны тэмдэг: logo.svg-ийг цайвар дөрвөлжин дэвсгэр дээр байрлуулна.
const logo = fs.readFileSync(path.join(src, 'logo.svg'), 'utf8');
const inner = logo.slice(logo.indexOf('>', logo.indexOf('<svg')) + 1, logo.lastIndexOf('</svg>'));
fs.writeFileSync(path.join(out, 'icon.svg'), '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
  '<rect width="200" height="200" rx="44" fill="#0b1030"/><g transform="translate(43 5) scale(.95)">' + inner + '</g></svg>\n');

// Supabase холболт: config.public.json (GitHub-д) → орчны хувьсагч (Vercel) → config.local.json (зөвхөн өөрийн компьютерт).
const cfg = { supabaseUrl: '', supabaseAnonKey: '' };
const readJson = f => { try { return JSON.parse(fs.readFileSync(path.join(root, f), 'utf8')); } catch (e) { return {}; } };
Object.assign(cfg, readJson('config.public.json'));
if (process.env.SUPABASE_URL) cfg.supabaseUrl = process.env.SUPABASE_URL;
if (process.env.SUPABASE_ANON_KEY) cfg.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
Object.assign(cfg, readJson('config.local.json'));
cfg.supabaseUrl = String(cfg.supabaseUrl || '').trim().replace(/\/(rest|auth)\/v1\/?$/, '').replace(/\/+$/, '');
fs.writeFileSync(path.join(out, 'config.js'), 'window.LIB_CONFIG = ' + JSON.stringify(cfg) + ';\n');
console.log(`public/ бэлэн (V.${ver}) · Supabase ${cfg.supabaseUrl ? 'холбогдсон' : 'тохируулаагүй'}`);
