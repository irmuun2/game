// Багшийн хавтас (Desktop\gazarzui) дахь материалуудыг хичээлийн сан руу оруулахад бэлдэнэ: import/ хавтас + manifest.json.
// Ажиллуулах: node scripts/make-import.js  →  Админ → «Материал олноор оруулах» хэсгээс import хавтсыг сонгоно.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, '..'), out = path.join(root, 'import');

// [анги, бүлэг, код, хичээлийн нэр (нэмэлт хичээлд), төрөл, арга зүй, файлын гарчиг, эх файл]
const ITEMS = [
  // Санд зөвхөн интерактив хичээл, тэдгээрийн төлөвлөгөө, шинээр хийсэн тараах материал орно.
  // Хуучин зурагтай дасгал, өмнөх мэдлэг сэргээх, илтгэл (pptx), хоосон загвар, тоглоомын сайтыг оруулахгүй (багшийн шийдвэр).
  // 7-р анги · II бүлэг · 2.1 Нарны аймаг
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · интерактив хичээл (хуучин)', '7-r_angi narnii_aimag_hicheel.html'],
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · асуулт', '7-r_angi_Narnii_aimag_asuult.html'],
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · асуудал шийдэх', '7-r_angi_Narnii_aimag_asuudal.html'],
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · тоглоом 1', '7-r_angi_Narnii_aimag_togloom.html'],
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · тоглоом 2', '7-r_angi_Narnii_aimag_togloom_v2.html'],
  [7, 'II', '2.1', '', 'screen', '', 'Нарны аймаг · тоглоом бүтээх', '7-r_angi_Narnii_aimag_togloom_buteeh.html'],
  [7, 'II', '2.1', '', 'handout', '', 'Зурагтай бататгах дасгал', '7-r angi 2.1 Narnii aimag - zuragtai dasgal.docx'],
  [7, 'II', '2.1', '', 'plan', 'Ээлжит', 'Ээлжит хичээлийн төлөвлөгөө', '7-r angi Narnii aimag - tuluvluguu.docx'],
  [7, 'II', '2.1', '', 'plan', 'Уламжлалт', 'Уламжлалт аргаар', '7-r angi Narnii aimag - ulamjlalt tuluvluguu.docx'],
  [7, 'II', '2.1', '', 'plan', 'Тоглоомт', 'Тоглоомт аргаар', '7-r angi Narnii aimag - togloomt tuluvluguu.docx'],
  // 7-р анги · бүлгийн тараах материал (II, IV бүлэг)
  [7, 'II', 'II-buleg', 'Бүлгийн тараах материал', 'handout', '', 'Тараах материал · 2.1 Нарны аймаг, 2.2 Дэлхий гараг', '7-r angi 2-r buleg Delhii garag - taraah material.docx'],
  [7, 'IV', 'IV-buleg', 'Бүлгийн тараах материал', 'handout', '', 'Тараах материал · 4.1 Цаг агаар, 4.2 Уур амьсгал', '7-r angi 4-r buleg Delhiin uur amisgal - taraah material.docx'],
  // 7-р анги · бүлгийн тойм кино (III бүлэг, «Бүлгийн тойм» нэмэлт хичээлийн «Кино» хэсэгт)
  [7, 'III', 'III-toim', 'Бүлгийн тойм', 'video', '', 'Дэлхийн гадарга · бүлгийн тойм кино (4,5 мин)', '7-r_angi_3-r_buleg_Delhiin_gadarga_toim_kino.html'],
  // 7-р анги · 2.2
  [7, 'II', '2.2', '', 'screen', '', 'Дэлхий гараг: улирал ба цагийн бүс · интерактив хичээл', 'Delhii_garag_tsagiin_bus_interaktiv_hicheel.html'],
  [7, 'II', '2.2', '', 'plan', 'Уламжлалт', 'Уламжлалт аргаар', '7-r angi Delhii garag - ulamjlalt tuluvluguu.docx'],
  [7, 'II', '2.2', '', 'plan', 'Тоглоомт', 'Тоглоомт аргаар', '7-r angi Delhii garag - togloomt tuluvluguu.docx'],
  [7, 'II', '2.2', '', 'plan', 'Туршилтын', 'Туршилтын аргаар', '7-r angi Delhii garag - turshilt tuluvluguu.docx'],
  [7, 'II', '2.2', '', 'plan', 'Станцын', 'Станцаар ажиллах', '7-r angi Delhii garag - stants tuluvluguu.docx'],
  [7, 'II', '2.2', '', 'plan', 'KWL', 'Мэддэг – Мэдэхийг хүсэж байна – Мэдсэн (KWL) аргаар', '7-r angi Delhii garag - kwl tuluvluguu.docx'],
  [7, 'II', '2.2', '', 'plan', 'Ээлжит', 'Ээлжит хичээлийн төлөвлөгөө · KWL, 2 хэсэг (цагийн бүс → улирал)', 'ээлжит.docx'],
  // 9-р анги · 2.5
  [9, 'II', '2.5', '', 'screen', '', 'Нар-сар-дэлхийн хөдөлгөөн ба аж ахуй · интерактив хичээл', '9-r_angi_Nar_sar_delhiin_hudulguun_aj_ahui.html'],
  [9, 'II', '2.5', '', 'plan', 'Ээлжит', 'Ээлжит хичээлийн төлөвлөгөө', '9-r angi Nar sar delhiin hudulguun - tuluvluguu.docx'],
  // 10-р анги · II бүлэг
  [10, 'II', '2.1', '', 'screen', '', 'Дэлхийн байрлал ба хөдөлгөөн · интерактив хичээл', '10-r_angi_Delhiin_bairlal_ba_hudulguun.html'],
  [10, 'II', '2.1', '', 'screen', '', 'Дэлхийн хэлбэр, тэнхлэгээ эргэх · интерактив хичээл', '10-r_angi_1_Delhiin_helber_tenhlegiin_ergelt.html'],
  [10, 'II', '2.2', '', 'screen', '', 'Нарыг тойрох, улирал, бүслүүр · интерактив хичээл', '10-r_angi_2_Naryg_toiroh_uliral_busluur.html']
];

// Нэгдсэн хөдөлгүүрээр хийсэн интерактив хичээлүүд (node interaktiv/build.js → interaktiv/lessons.json)
const built = path.join(src, 'interaktiv', 'lessons.json');
if (fs.existsSync(built)) JSON.parse(fs.readFileSync(built, 'utf8')).forEach(x => ITEMS.push([x.grade, x.chapter, x.code, '', 'screen', '', x.title + ' · интерактив хичээл', x.file]));

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const manifest = { made: new Date().toISOString(), items: [] };
let bytes = 0;
ITEMS.forEach(([grade, chapter, code, lessonTitle, kind, method, title, file], i) => {
  const from = path.join(src, file);
  if (!fs.existsSync(from)) { console.warn('Алга: ' + file); return; }
  const ext = path.extname(file).toLowerCase();
  const name = `${String(i + 1).padStart(2, '0')}-g${grade}-${code.replace(/[^a-z0-9.]/gi, '')}-${kind}${ext}`;
  fs.copyFileSync(from, path.join(out, name));
  bytes += fs.statSync(from).size;
  manifest.items.push({ grade, chapter, code, lessonTitle, kind, method, title, file: name, name: path.basename(file), size: fs.statSync(from).size, mtime: Math.round(fs.statSync(from).mtimeMs) });
});
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log(`import/ бэлэн: ${manifest.items.length} файл, ${(bytes / 1048576).toFixed(1)} МБ`);
