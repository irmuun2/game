// Сэдэв бүрийн дэлгэцийн хичээлийн нүүр зургийг (480×270 JPEG) гаргана → src/thumbs/<анги>-<код>.jpg, src/thumbs.js.
// Эхлээд `node scripts/make-import.js` ажиллуулсан байх ёстой (import/manifest.json-оос уншина).
// Edge (headless) хуудсыг 1280×720-д зураг болгож, PowerShell (System.Drawing) жижигрүүлнэ. Зөвхөн Windows дээр.
const fs = require('fs'), path = require('path'), os = require('os'), { spawnSync } = require('child_process');
const root = path.join(__dirname, '..'), imp = path.join(root, 'import'), out = path.join(root, 'src', 'thumbs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const man = JSON.parse(fs.readFileSync(path.join(imp, 'manifest.json'), 'utf8'));

// Сэдэв бүрээс нэг HTML: шинэ интерактив хичээлийг түрүүлж, «(хуучин)»-ыг сүүлд сонгоно.
const pick = {};
const rank = it => (/интерактив хичээл/.test(it.title) && !/хуучин/.test(it.title) ? 0 : /хуучин/.test(it.title) ? 2 : 1);
man.items.filter(it => it.kind === 'screen' && /\.html?$/i.test(it.file)).forEach(it => {
  const k = `${it.grade}/${it.code}`;
  if (!pick[k] || rank(it) < rank(pick[k]) || (rank(it) === rank(pick[k]) && it.title.length < pick[k].title.length)) pick[k] = it; // ижил бол богино нэртэй нь гол
});

const sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const waitFile = (p, ms) => { for (const end = Date.now() + ms; Date.now() < end; sleep(300)) if (fs.existsSync(p) && fs.statSync(p).size > 0) return true; return false; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'thumbs-'));
fs.mkdirSync(out, { recursive: true });
const shots = [];
// Зөвхөн заасан сэдвүүд: node scripts/make-thumbs.js 7/2.1 8/1.3
const only = process.argv.slice(2);
let idx = 0;
for (const [k, it] of Object.entries(pick).filter(([k]) => !only.length || only.includes(k))) {
  idx++;
  let html = fs.readFileSync(path.join(imp, it.file), 'utf8');
  const engine = /LESSON\(\{/.test(html);
  // Интерактив хичээлийн дээд, доод товчны мөрийг нууж зөвхөн нүүрийг үлдээнэ.
  if (engine) html = html.replace('</head>', '<style>#stage .top,#stage .bottom,.teams,.notes{display:none!important}</style></head>');
  const page = path.join(tmp, k.replace('/', '-') + '.html'), png = page.replace(/\.html$/, '.png');
  fs.writeFileSync(page, html);
  const url = 'file:///' + page.replace(/\\/g, '/') + (engine ? '#s=1' : '');
  // msedge.exe шууд буцаж, зургийг хэдэн секундийн дараа бичдэг тул файл гартал хүлээнэ.
  for (let t = 0; t < 3 && !fs.existsSync(png); t++) {
    spawnSync(EDGE, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${path.join(tmp, `prof-${idx}-${t}`)}`,
      '--window-size=1280,720', '--virtual-time-budget=3000', `--screenshot=${png}`, url], { timeout: 60000 });
    if (waitFile(png, 25000)) sleep(800); // бичиж дуусахыг хүлээнэ
  }
  if (fs.existsSync(png)) { shots.push([k, png]); console.log('✓ ' + k + '  ' + it.title); } else console.warn('✗ ' + k + ' зураг гарсангүй');
}

// PNG → 480×270 JPEG (чанар 80)
const list = shots.map(([k, png]) => `'${png.replace(/'/g, "''")}|${path.join(out, k.replace('/', '-') + '.jpg').replace(/'/g, "''")}'`).join(',');
const ps = `Add-Type -AssemblyName System.Drawing
$enc = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$p = New-Object System.Drawing.Imaging.EncoderParameters 1
$p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 80L
foreach ($pair in @(${list})) {
  $a = $pair.Split('|'); $src = [System.Drawing.Image]::FromFile($a[0])
  $bmp = New-Object System.Drawing.Bitmap 480, 270
  $g = [System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode = 'HighQualityBicubic'; $g.DrawImage($src, 0, 0, 480, 270)
  $bmp.Save($a[1], $enc, $p); $g.Dispose(); $bmp.Dispose(); $src.Dispose()
}`;
const psFile = path.join(tmp, 'resize.ps1');
fs.writeFileSync(psFile, '\ufeff' + ps);
const r = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psFile], { encoding: 'utf8' });
if (r.status !== 0) { console.error(r.stderr || r.stdout); process.exit(1); }

// src/thumbs.js: сэдэв → зураг (?v= нь шинэчлэгдсэн зургийг хөтөч дахин татахад)
const map = {};
for (const f of fs.readdirSync(out).filter(x => x.endsWith('.jpg')).sort()) {
  const k = f.replace(/.jpg$/, '').replace('-', '/'), st = fs.statSync(path.join(out, f));
  if (pick[k]) map[k] = `thumbs/${f}?v=${Math.round(st.mtimeMs / 1000).toString(36)}`;
}
fs.writeFileSync(path.join(root, 'src', 'thumbs.js'), '// node scripts/make-thumbs.js-ээр үүснэ. Сэдэв бүрийн дэлгэцийн хичээлийн нүүр зураг.\nwindow.LIB_THUMBS = ' + JSON.stringify(map, null, 1) + ';\n');
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) {} // Edge профайл түгжигдсэн байж болно
console.log(`thumbs: ${shots.length} шинэ, нийт ${Object.keys(map).length}/${Object.keys(pick).length} зураг · ${(fs.readdirSync(out).reduce((s, f) => s + fs.statSync(path.join(out, f)).size, 0) / 1024).toFixed(0)} КБ`);
