// Аватар: суурь төрх, өмсөх зүйлс (толгой, нүдний шил, хувцас, хүзүү, гарт барих), дэлгүүр, стил, SVG зураг.
(function () {
  const A = {};
  A.SKIN = ['#f3d2b3', '#e6b48f', '#cf9a6d', '#a8714a', '#7a4e30'];
  A.HAIRC = ['#1b1b1f', '#3b2a20', '#6b4428', '#b07a3c', '#8c2f23'];
  A.SHIRT = ['#1f6493', '#5d9d4c', '#d9b05a', '#a9622f', '#c4492f', '#eef3f0'];
  A.BG = ['#0e3b5f', '#2b6a41', '#d9b05a', '#a9622f', '#86c1e0'];
  A.HAIR = ['Богино', 'Өрвөгөр', 'Урт', 'Боодол', 'Халзан'];
  A.EYES = ['Цэг', 'Инээмсэглэсэн', 'Том'];
  A.MOUTH = ['Инээмсэглэл', 'Баяртай', 'Гайхсан'];

  A.SLOTS = [
    { id: 'hat', name: 'Толгой' }, { id: 'glasses', name: 'Нүдний шил' }, { id: 'ear', name: 'Чих' },
    { id: 'top', name: 'Хувцас' }, { id: 'neck', name: 'Хүзүү' }, { id: 'pin', name: 'Энгэр' }, { id: 'hand', name: 'Гарт' }
  ];
  // need: нийт оноо хүрэхэд нээгдэнэ · reward: бүлгийн бүх түвшнийг давбал · price: дэлгүүрээс худалдаж авна
  // style: аль стилд хамаарах (нэг зүйл хэд хэдэн стилд орж болно, жишээ нь нүдний шил албаны ба багшийн стилд)
  A.ITEMS = [
    { id: 'none', slot: 'hat', name: 'Толгойн чимэглэлгүй' },
    { id: 'egg', slot: 'hat', name: 'Шарсан өндөг', need: 10 },
    { id: 'horns', slot: 'hat', name: 'Ямааны эвэр', need: 50 },
    { id: 'bandana', slot: 'hat', name: 'Улаан бандана', need: 100 },
    { id: 'banana', slot: 'hat', name: 'Бананы хальс', need: 150 },
    { id: 'crown', slot: 'hat', name: 'Хааны титэм', need: 200 },
    { id: 'explorer', slot: 'hat', name: 'Экспедицийн малгай', reward: true },
    { id: 'cap', slot: 'hat', name: 'Хажуу саравчтай малгай', price: 25, style: 'hiphop' },
    { id: 'fedora', slot: 'hat', name: 'Федора малгай', price: 30, style: 'formal' },
    { id: 'none', slot: 'glasses', name: 'Шилгүй' },
    { id: 'shades', slot: 'glasses', name: 'Хар нарны шил', price: 20, style: 'hiphop' },
    { id: 'specs', slot: 'glasses', name: 'Нүдний шил', price: 20, style: ['formal', 'teacher'] },
    { id: 'none', slot: 'top', name: 'Энгийн цамц' },
    { id: 'hoodie', slot: 'top', name: 'Малгайтай цамц', price: 40, style: 'hiphop' },
    { id: 'suit', slot: 'top', name: 'Костюм', price: 45, style: 'formal' },
    { id: 'none', slot: 'neck', name: 'Хүзүүний чимэглэлгүй' },
    { id: 'chain', slot: 'neck', name: 'Алтан гинж', price: 35, style: 'hiphop' },
    { id: 'tie', slot: 'neck', name: 'Зангиа', price: 20, style: 'formal' },
    // Шинэ 5 чимэглэл: үнэ нь 10 оноогоор ялгаатай (50, 60, 70, 80, 90).
    { id: 'none', slot: 'ear', name: 'Чихний чимэглэлгүй' },
    { id: 'phones', slot: 'ear', name: 'Чихэвч', price: 50, style: 'hiphop' },
    { id: 'beanie', slot: 'hat', name: 'Бини малгай', price: 60, style: 'hiphop' },
    { id: 'bowtie', slot: 'neck', name: 'Эрвээхэй зангиа', price: 70, style: 'formal' },
    { id: 'tophat', slot: 'hat', name: 'Цилиндр малгай', price: 80, style: 'formal' },
    { id: 'none', slot: 'pin', name: 'Энгэрийн тэмдэггүй' },
    { id: 'badge', slot: 'pin', name: 'Алтан энгэрийн тэмдэг', price: 90, style: 'formal' },
    { id: 'none', slot: 'hand', name: 'Гартаа юмгүй' },
    // Мэргэжлийн стилүүд
    { id: 'cardigan', slot: 'top', name: 'Ноосон кардиган', price: 40, style: 'teacher' },
    { id: 'book', slot: 'hand', name: 'Ном', price: 30, style: 'teacher' },
    { id: 'medcap', slot: 'hat', name: 'Эмчийн малгай', price: 40, style: 'doctor' },
    { id: 'labcoat', slot: 'top', name: 'Цагаан халат', price: 60, style: 'doctor' },
    { id: 'stetho', slot: 'neck', name: 'Чагнуур', price: 50, style: 'doctor' },
    { id: 'policecap', slot: 'hat', name: 'Цагдаагийн малгай', price: 50, style: 'police' },
    { id: 'police', slot: 'top', name: 'Цагдаагийн дүрэмт хувцас', price: 70, style: 'police' },
    { id: 'policebadge', slot: 'pin', name: 'Цагдаагийн тэмдэг', price: 40, style: 'police' },
    { id: 'firehelmet', slot: 'hat', name: 'Гал сөнөөгчийн дуулга', price: 60, style: 'fire' },
    { id: 'firecoat', slot: 'top', name: 'Гал сөнөөгчийн хувцас', price: 70, style: 'fire' },
    { id: 'extinguisher', slot: 'hand', name: 'Гал унтраагуур', price: 50, style: 'fire' },
    { id: 'chefhat', slot: 'hat', name: 'Тогоочийн малгай', price: 40, style: 'chef' },
    { id: 'chefcoat', slot: 'top', name: 'Тогоочийн хувцас', price: 60, style: 'chef' },
    { id: 'kerchief', slot: 'neck', name: 'Хүзүүний ороолт', price: 30, style: 'chef' },
    { id: 'spacehelmet', slot: 'hat', name: 'Сансрын дуулга', price: 100, style: 'astro' },
    { id: 'spacesuit', slot: 'top', name: 'Сансрын хувцас', price: 120, style: 'astro' },
    { id: 'flagpatch', slot: 'pin', name: 'Монголын далбаатай тэмдэг', price: 40, style: 'astro' }
  ];
  // job: мэргэжлийн стил. short: дэлгүүрийн шошго. color: нүүрний тэмдгийн өнгө.
  A.STYLES = [
    { id: 'hiphop', name: 'Хип хоп стил', short: 'Хип хоп', color: '#d9b05a', text: 'Малгай (хажуу саравчтай эсвэл бини), хар нарны шил, чихэвч, малгайтай цамц, алтан гинж' },
    { id: 'formal', name: 'Албаны стил', short: 'Албаны', color: '#86c1e0', text: 'Малгай (федора эсвэл цилиндр), нүдний шил, костюм, зангиа эсвэл эрвээхэй зангиа, алтан энгэрийн тэмдэг' },
    { id: 'teacher', name: 'Багшийн стил', short: 'Багш', color: '#d7b48f', job: true, text: 'Нүдний шил, ноосон кардиган, гартаа ном' },
    { id: 'doctor', name: 'Эмчийн стил', short: 'Эмч', color: '#eef3f0', job: true, text: 'Улаан загалмайтай малгай, цагаан халат, чагнуур' },
    { id: 'police', name: 'Цагдаагийн стил', short: 'Цагдаа', color: '#8fb3e0', job: true, text: 'Цагдаагийн малгай, дүрэмт хувцас, энгэрийн тэмдэг' },
    { id: 'fire', name: 'Гал сөнөөгчийн стил', short: 'Гал сөнөөгч', color: '#ef7a55', job: true, text: 'Улаан дуулга, гэрэл ойлгогч судалтай хувцас, гал унтраагуур' },
    { id: 'chef', name: 'Тогоочийн стил', short: 'Тогооч', color: '#f0cd80', job: true, text: 'Тогоочийн өндөр малгай, цагаан хувцас, хүзүүний улаан ороолт' },
    { id: 'astro', name: 'Сансрын нисгэгчийн стил', short: 'Сансрын нисгэгч', color: '#b9a3ec', job: true, text: 'Сансрын дуулга, сансрын хувцас, Монголын далбаатай тэмдэг' }
  ];
  A.HATS = A.ITEMS.filter(i => i.slot === 'hat');
  A.DEFAULT = { bg: 0, skin: 1, hair: 0, hairC: 0, eyes: 0, mouth: 0, shirt: 0, hat: 'none', glasses: 'none', ear: 'none', top: 'none', neck: 'none', pin: 'none', hand: 'none' };

  A.item = (slot, id) => A.ITEMS.find(i => i.slot === slot && i.id === id) || A.ITEMS.find(i => i.slot === slot);
  A.hat = id => A.item('hat', id);
  A.inStyle = (item, sid) => !!item && [].concat(item.style || []).includes(sid);
  A.styleNames = item => [].concat(item.style || []).map(id => (A.STYLES.find(x => x.id === id) || {}).short).filter(Boolean);
  A.styleItems = sid => A.ITEMS.filter(i => A.inStyle(i, sid));
  // Стил нь хэд хэдэн үүрээс бүрдэнэ. Үүр бүрт тухайн стилийн аль нэг зүйл өмссөн бол бүрдсэн гэнэ.
  A.styleSlots = sid => [...new Set(A.styleItems(sid).map(i => i.slot))];
  A.wearingStyle = (av, sid) => !!av && A.styleSlots(sid).every(slot => {
    const it = A.ITEMS.find(i => i.slot === slot && i.id === av[slot]);
    return A.inStyle(it, sid);
  });

  const clamp = (v, n) => (Number.isInteger(v) && v >= 0 && v < n ? v : 0);
  const pick = (slot, v) => (A.ITEMS.some(i => i.slot === slot && i.id === v) ? v : 'none');
  A.normalize = function (a) {
    a = a && typeof a === 'object' ? a : {};
    return {
      bg: clamp(a.bg, A.BG.length), skin: clamp(a.skin, A.SKIN.length),
      hair: clamp(a.hair, A.HAIR.length), hairC: clamp(a.hairC, A.HAIRC.length),
      eyes: clamp(a.eyes, A.EYES.length), mouth: clamp(a.mouth, A.MOUTH.length),
      shirt: clamp(a.shirt, A.SHIRT.length),
      hat: pick('hat', a.hat), glasses: pick('glasses', a.glasses), ear: pick('ear', a.ear),
      top: pick('top', a.top), neck: pick('neck', a.neck), pin: pick('pin', a.pin), hand: pick('hand', a.hand)
    };
  };
  A.unlocked = function (item, p) {
    if (!item || item.id === 'none') return true;
    if (item.reward) return !!(p && p.reward);
    if (item.price) return !!(p && Array.isArray(p.owned) && p.owned.includes(item.id));
    return ((p && p.total) || 0) >= item.need;
  };

  const shade = (hex, f) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * f).toString(16).padStart(2, '0')).join('');

  const EYES = [
    '<circle cx="50" cy="59" r="3.2" fill="#1d1a1a"/><circle cx="70" cy="59" r="3.2" fill="#1d1a1a"/>',
    '<path d="M46 60 Q50 55 54 60 M66 60 Q70 55 74 60" fill="none" stroke="#1d1a1a" stroke-width="2.6" stroke-linecap="round"/>',
    '<ellipse cx="50" cy="59" rx="4.6" ry="5" fill="#fff"/><ellipse cx="70" cy="59" rx="4.6" ry="5" fill="#fff"/><circle cx="51" cy="60" r="2.6" fill="#1d1a1a"/><circle cx="71" cy="60" r="2.6" fill="#1d1a1a"/><circle cx="52" cy="58.5" r="1" fill="#fff"/><circle cx="72" cy="58.5" r="1" fill="#fff"/>'
  ];
  const MOUTH = [
    '<path d="M52 70 Q60 77 68 70" fill="none" stroke="#5a2a22" stroke-width="2.6" stroke-linecap="round"/>',
    '<path d="M51 69 Q60 83 69 69 Z" fill="#5a2a22"/><path d="M55 75 Q60 80 65 75 Q60 73 55 75 Z" fill="#e0706a"/>',
    '<ellipse cx="60" cy="72" rx="3.2" ry="4.2" fill="#5a2a22"/>'
  ];
  const TOP = 'M34 56 C33 37 46 29 60 29 C74 29 87 37 86 56 C80 45 71 41 60 41 C49 41 40 45 34 56 Z';
  const hairFront = (i, c) => [
    `<path d="${TOP}" fill="${c}"/>`,
    `<path d="M34 56 L35 40 L42 42 L44 30 L52 36 L58 25 L64 35 L72 28 L75 40 L83 37 L86 56 C80 45 71 41 60 41 C49 41 40 45 34 56 Z" fill="${c}"/>`,
    `<path d="M34 54 C34 36 46 29 60 29 C75 29 86 37 86 54 C78 44 66 40 54 43 C45 45 39 49 34 54 Z" fill="${c}"/>`,
    `<circle cx="38" cy="36" r="10" fill="${c}"/><circle cx="82" cy="36" r="10" fill="${c}"/><path d="${TOP}" fill="${c}"/>`,
    '<ellipse cx="51" cy="39" rx="6" ry="3" fill="#fff" opacity=".25"/>'
  ][i];

  const BODY = 'M18 124 C20 100 38 89 60 89 C82 89 100 100 102 124 Z';
  const tops = {
    none: c => `<path d="${BODY}" fill="${c}"/><path d="M50 89 Q60 99 70 89" fill="none" stroke="rgba(0,0,0,.2)" stroke-width="2"/>`,
    hoodie: c => `<path d="${BODY}" fill="${c}"/><path d="M38 94 C40 81 50 77 60 77 C70 77 80 81 82 94 C74 89 67 87 60 87 C53 87 46 89 38 94 Z" fill="${shade(c, .72)}"/>` +
      `<path d="M55 92 L54 106 M65 92 L66 106" stroke="#f4f6f8" stroke-width="1.8" stroke-linecap="round"/><rect x="45" y="108" width="30" height="12" rx="4" fill="${shade(c, .82)}"/>`,
    suit: () => `<path d="${BODY}" fill="#2c3440"/><path d="M50 89 L60 112 L70 89 Z" fill="#f4f6f8"/>` +
      '<path d="M50 89 L58 110 L51 105 L45 95 Z M70 89 L62 110 L69 105 L75 95 Z" fill="#1d232b"/><circle cx="60" cy="116" r="1.6" fill="#11151a"/>',
    cardigan: c => `<path d="${BODY}" fill="#8a4b3a"/><path d="M50 89 Q60 97 70 89 L67 124 L53 124 Z" fill="${c}"/>` +
      '<path d="M50 89 L53 124 M70 89 L67 124" stroke="#6e3a2c" stroke-width="1.6"/><circle cx="51.6" cy="103" r="1.5" fill="#e8d3b0"/><circle cx="52.3" cy="112" r="1.5" fill="#e8d3b0"/><path d="M27 113 h12 M81 113 h12" stroke="#6e3a2c" stroke-width="1.4"/>',
    labcoat: () => `<path d="${BODY}" fill="#f4f6f8" stroke="#cfd6dc" stroke-width="1"/><path d="M51 89 L60 102 L69 89 Z" fill="#86c1e0"/>` +
      '<path d="M51 89 L57 112 M69 89 L63 112" stroke="#c3ccd4" stroke-width="1.6" fill="none"/><path d="M60 102 V124" stroke="#d5dce2" stroke-width="1.2"/><rect x="69" y="106" width="11" height="9" rx="1.5" fill="none" stroke="#c3ccd4" stroke-width="1.3"/><path d="M72 103 V109" stroke="#1f6493" stroke-width="1.8" stroke-linecap="round"/>',
    police: () => `<path d="${BODY}" fill="#1f3a5f"/><path d="M51 89 L60 100 L69 89 Z" fill="#a9c7e8"/>` +
      '<path d="M58.6 91 L61.4 91 L62.4 103 L60 106 L57.6 103 Z" fill="#14243b"/><path d="M22 106 L38 97 L40 101 L25 110 Z M98 106 L82 97 L80 101 L95 110 Z" fill="#14243b"/><rect x="40" y="106" width="11" height="8" rx="1.5" fill="#1a3150" stroke="#14243b"/><rect x="69" y="106" width="11" height="8" rx="1.5" fill="#1a3150" stroke="#14243b"/>',
    firecoat: () => `<path d="${BODY}" fill="#3a3d42"/><path d="M60 92 V124" stroke="#24262a" stroke-width="2"/>` +
      '<rect x="22" y="108" width="76" height="6" fill="#f2c230"/><rect x="22" y="110" width="76" height="2" fill="#dfe3e7"/><path d="M48 91 Q60 99 72 91" fill="none" stroke="#24262a" stroke-width="3"/>',
    chefcoat: () => `<path d="${BODY}" fill="#fbfbf8" stroke="#dcd9d0" stroke-width="1"/><path d="M47 91 Q60 99 73 91 L73 95 Q60 103 47 95 Z" fill="#eceae4"/>` +
      '<g fill="#9aa1a8"><circle cx="53" cy="104" r="1.6"/><circle cx="67" cy="104" r="1.6"/><circle cx="53" cy="112" r="1.6"/><circle cx="67" cy="112" r="1.6"/><circle cx="53" cy="120" r="1.6"/><circle cx="67" cy="120" r="1.6"/></g>',
    spacesuit: () => `<path d="${BODY}" fill="#e9edf1" stroke="#c3ccd4" stroke-width="1"/><ellipse cx="60" cy="91" rx="16" ry="4.5" fill="#b8c2cc"/>` +
      '<rect x="51" y="101" width="18" height="11" rx="2" fill="#8e9aa6"/><circle cx="55" cy="106.5" r="1.8" fill="#c4492f"/><circle cx="60" cy="106.5" r="1.8" fill="#3b82c4"/><circle cx="65" cy="106.5" r="1.8" fill="#5d9d4c"/><path d="M30 104 Q34 112 32 122 M90 104 Q86 112 88 122" stroke="#c3ccd4" stroke-width="1.4" fill="none"/>'
  };
  const NECK = {
    none: '',
    chain: '<path d="M47 90 Q60 107 73 90" fill="none" stroke="#e8b923" stroke-width="3" stroke-dasharray="3 1.6"/><circle cx="60" cy="100" r="4.5" fill="#e8b923" stroke="#a97c10" stroke-width="1.2"/><path d="M58 100 h4" stroke="#a97c10" stroke-width="1.2"/>',
    tie: '<path d="M57.5 90 L62.5 90 L61.5 93 L63.5 108 L60 112 L56.5 108 L58.5 93 Z" fill="#c4492f" stroke="#8f2f1d" stroke-width=".8"/>',
    bowtie: '<path d="M60 92 L49 86.5 L49 97.5 Z M60 92 L71 86.5 L71 97.5 Z" fill="#1d232b" stroke="#0b0e12" stroke-width=".8" stroke-linejoin="round"/><circle cx="60" cy="92" r="2.6" fill="#11151a"/>',
    stetho: '<path d="M47 90 Q47 109 60 110 Q73 109 73 90" fill="none" stroke="#2a2f36" stroke-width="2.4"/><path d="M60 110 V115" stroke="#2a2f36" stroke-width="2.4"/><circle cx="60" cy="118.5" r="4" fill="#c7ced6" stroke="#5b6670" stroke-width="1.4"/>',
    kerchief: '<path d="M48 90 Q60 98 72 90 L66 100 L60 106 L54 100 Z" fill="#c4492f" stroke="#8f2f1d" stroke-width=".8"/><circle cx="60" cy="96" r="3" fill="#a8261f"/>'
  };
  const PIN = {
    none: '',
    badge: '<circle cx="78" cy="106" r="5.5" fill="#e8b923" stroke="#a97c10" stroke-width="1.2"/><path d="M78 102.3 l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#fff3c4"/>',
    policebadge: '<path d="M78 99 L84.5 101.5 L83.5 108.5 Q78 114 72.5 108.5 L71.5 101.5 Z" fill="#e8b923" stroke="#a97c10" stroke-width="1.1"/><path d="M78 102.5 l1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3z" fill="#fff3c4"/>',
    // Монгол Улсын төрийн далбаа: улаан, цэнхэр, улаан; зүүн улаанд шар соёмбо (хялбарчилсан).
    flagpatch: '<rect x="70" y="101" width="15" height="9" rx="1" fill="#c4272f" stroke="#8f1d22" stroke-width=".6"/><rect x="75" y="101" width="5" height="9" fill="#015197"/><rect x="71.4" y="102.5" width="2.2" height="6" fill="#f9cf02"/>'
  };
  const EAR = {
    none: '',
    phones: '<path d="M31 60 C29 27 91 27 89 60" fill="none" stroke="#1b1b1f" stroke-width="5" stroke-linecap="round"/><rect x="24" y="51" width="13" height="19" rx="5" fill="#c4492f"/><rect x="83" y="51" width="13" height="19" rx="5" fill="#c4492f"/><rect x="28" y="55" width="6" height="11" rx="3" fill="#1b1b1f"/><rect x="86" y="55" width="6" height="11" rx="3" fill="#1b1b1f"/>'
  };
  const GLASSES = {
    none: '',
    shades: '<path d="M41 55 H57 V60 C57 65 52 66 49 66 C45 66 41 64 41 59 Z M63 55 H79 V59 C79 64 75 66 71 66 C68 66 63 65 63 60 Z" fill="#141414"/><path d="M57 57 H63 M34 57 L41 56 M79 56 L86 57" stroke="#141414" stroke-width="2"/><path d="M44 58 L48 57" stroke="#fff" stroke-width="1.2" opacity=".5"/>',
    specs: '<circle cx="50" cy="59" r="7" fill="rgba(255,255,255,.14)" stroke="#2a2a2a" stroke-width="1.8"/><circle cx="70" cy="59" r="7" fill="rgba(255,255,255,.14)" stroke="#2a2a2a" stroke-width="1.8"/><path d="M57 59 H63 M34 57 L43 58 M77 58 L86 57" stroke="#2a2a2a" stroke-width="1.8"/>'
  };
  const HAT = {
    none: '',
    egg: '<path d="M42 33 C39 24 50 19 57 22 C63 16 77 19 77 27 C82 31 76 38 67 36 C60 40 47 39 42 33 Z" fill="#fffdf6" stroke="#e2d6bb" stroke-width="1"/><circle cx="60" cy="28" r="6.5" fill="#f5b50d"/><circle cx="58" cy="26" r="2" fill="#fff" opacity=".7"/>',
    horns: '<g fill="#dccfae" stroke="#9c8a62" stroke-width="1.3" stroke-linejoin="round"><path d="M45 37 C41 22 31 13 19 14 C27 18 32 27 35 42 Z"/><path d="M75 37 C79 22 89 13 101 14 C93 18 88 27 85 42 Z"/></g><path d="M36 31 l6 -2 M31 24 l6 -3 M84 31 l-6 -2 M89 24 l-6 -3" stroke="#9c8a62" stroke-width="1.4" stroke-linecap="round"/>',
    bandana: '<path d="M34 51 C33 34 46 28 60 28 C74 28 87 34 86 51 C78 45 68 43 60 43 C52 43 42 45 34 51 Z" fill="#c8322b"/><path d="M84 46 L100 40 L97 52 Z M84 49 L98 58 L90 61 Z" fill="#a8261f"/><g fill="#fff" opacity=".85"><circle cx="48" cy="36" r="1.6"/><circle cx="60" cy="33" r="1.6"/><circle cx="72" cy="36" r="1.6"/><circle cx="54" cy="40" r="1.3"/><circle cx="66" cy="40" r="1.3"/></g>',
    banana: '<g stroke="#a88414" stroke-width="1.2" stroke-linejoin="round"><path d="M51 32 C43 30 37 37 35 46 C42 41 47 38 54 36 Z" fill="#f5dc55"/><path d="M69 32 C77 30 83 37 85 46 C78 41 73 38 66 36 Z" fill="#f5dc55"/><path d="M50 34 C49 24 71 24 70 34 Z" fill="#f2d23c"/><path d="M57 33 C54 38 55 44 57 49 C60 44 62 39 63 33 Z" fill="#efd046"/><path d="M58 26 C58 19 61 14 65 12 L67 14 C64 17 63 21 63 26 Z" fill="#8a6a1c"/></g><circle cx="44" cy="40" r="1.2" fill="#7a5a14"/><circle cx="76" cy="41" r="1.2" fill="#7a5a14"/><circle cx="63" cy="29" r="1.1" fill="#7a5a14"/>',
    crown: '<path d="M39 38 L41 18 L50 28 L60 13 L70 28 L79 18 L81 38 Z" fill="#e8b923" stroke="#a97c10" stroke-width="1.5" stroke-linejoin="round"/><rect x="39" y="34" width="42" height="6" rx="1.5" fill="#d4a318" stroke="#a97c10" stroke-width="1.2"/><circle cx="60" cy="25" r="2.8" fill="#c4492f"/><circle cx="48" cy="31" r="2" fill="#1f6493"/><circle cx="72" cy="31" r="2" fill="#1f6493"/><circle cx="41" cy="17" r="2" fill="#f4d25a"/><circle cx="60" cy="12" r="2" fill="#f4d25a"/><circle cx="79" cy="17" r="2" fill="#f4d25a"/>',
    explorer: '<path d="M34 44 C34 21 86 21 86 44 Z" fill="#cdb77f"/><ellipse cx="60" cy="44" rx="33" ry="5.5" fill="#b59d63"/><path d="M35 40 L85 40" stroke="#7c6a3f" stroke-width="3"/><circle cx="60" cy="23" r="2.2" fill="#b59d63"/>',
    cap: '<path d="M34 47 C34 25 86 25 86 47 Z" fill="#1b1b1f"/><path d="M40 44 C30 43 17 45 11 50 C18 53 31 52 44 48 Z" fill="#c4492f"/><rect x="34" y="44" width="52" height="4" fill="#c4492f"/><circle cx="64" cy="35" r="4.5" fill="#f0cd80"/><path d="M62 35 h4" stroke="#1b1b1f" stroke-width="1.2"/>',
    fedora: '<path d="M40 40 C39 21 81 21 80 40 Z" fill="#3a3f47"/><path d="M50 26 Q60 32 70 26" fill="none" stroke="#23272d" stroke-width="2"/><rect x="40" y="35" width="40" height="5" fill="#1d2126"/><ellipse cx="60" cy="41" rx="31" ry="5" fill="#2f343b"/>',
    beanie: '<path d="M34 50 C33 25 87 25 86 50 Z" fill="#e0a82e"/><path d="M46 31 V44 M54 28 V44 M62 27 V44 M70 29 V44 M78 33 V44" stroke="#c9921f" stroke-width="1.6"/><rect x="32" y="43" width="56" height="10" rx="4" fill="#c9921f"/><circle cx="60" cy="23" r="5.5" fill="#eef3f0"/>',
    tophat: '<rect x="44" y="7" width="32" height="30" rx="2" fill="#1d232b"/><rect x="44" y="28" width="32" height="5" fill="#8f2f1d"/><ellipse cx="60" cy="37" rx="27" ry="4.5" fill="#11151a"/><path d="M48 10 V26" stroke="#3a4250" stroke-width="2" stroke-linecap="round"/>',
    medcap: '<path d="M37 45 C36 28 84 28 83 45 Z" fill="#f4f6f8" stroke="#cfd6dc" stroke-width="1"/><rect x="37" y="41" width="46" height="5" fill="#e3e8ec"/><rect x="57.5" y="30" width="5" height="12" fill="#c4492f"/><rect x="54" y="33.5" width="12" height="5" fill="#c4492f"/>',
    policecap: '<path d="M32 40 C29 24 91 24 88 40 Z" fill="#1f3a5f"/><rect x="36" y="37" width="48" height="7" fill="#14243b"/><path d="M40 43 Q60 49 80 43 L78.5 46.5 Q60 52.5 41.5 46.5 Z" fill="#0b1422"/><path d="M40 40.5 h40" stroke="#e8b923" stroke-width="1.2"/><path d="M60 28 l3.5 1.5 -.5 4.5 -3 2.5 -3 -2.5 -.5 -4.5 z" fill="#e8b923" stroke="#a97c10" stroke-width=".8"/>',
    firehelmet: '<path d="M33 47 C31 21 89 21 87 47 Z" fill="#c8322b"/><path d="M60 22 V46" stroke="#9c2620" stroke-width="5" stroke-linecap="round"/><path d="M24 47 Q60 39 96 47 Q98 53 90 52 Q60 46 30 52 Q22 53 24 47 Z" fill="#a8261f"/><path d="M60 30 l5 2 -1 6 -4 3 -4 -3 -1 -6 z" fill="#e8b923" stroke="#a97c10" stroke-width=".9"/>',
    chefhat: '<path d="M40 38 C29 33 32 14 45 18 C47 6 73 6 75 18 C88 14 91 33 80 38 Z" fill="#fbfbf8" stroke="#dcd9d0" stroke-width="1.2"/><path d="M50 22 Q52 30 50 36 M60 18 V36 M70 22 Q68 30 70 36" stroke="#e6e3da" stroke-width="1.4" fill="none"/><rect x="40" y="35" width="40" height="11" rx="2" fill="#f1efe8" stroke="#dcd9d0" stroke-width="1.2"/>',
    spacehelmet: '<circle cx="60" cy="59" r="34" fill="rgba(170,215,255,.2)" stroke="#dfe6ec" stroke-width="5"/><circle cx="60" cy="59" r="31" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="1"/><path d="M36 46 Q42 33 55 29" stroke="#fff" stroke-width="3.2" stroke-linecap="round" opacity=".7" fill="none"/>'
  };
  // Гарт барих зүйл (баруун доод талд, гарын хамт).
  const HAND = {
    none: () => '',
    book: s => '<g transform="rotate(-10 81 102)"><rect x="72" y="91" width="18" height="22" rx="2" fill="#1f6493"/><rect x="74" y="93" width="14" height="18" rx="1" fill="#2c7cb3"/><path d="M76.5 98 h9 M76.5 102 h7 M76.5 106 h8" stroke="#eef3f0" stroke-width="1.4"/></g>' +
      `<ellipse cx="75" cy="112" rx="6" ry="5" fill="${s}"/>`,
    extinguisher: s => '<rect x="74" y="92" width="11" height="22" rx="4" fill="#c8322b"/><rect x="74" y="99" width="11" height="5" fill="#f4f6f8"/><rect x="77" y="87" width="5" height="6" rx="1" fill="#2a2a2a"/><path d="M82 89 q8 -1 7 9" stroke="#2a2a2a" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      `<ellipse cx="79.5" cy="111" rx="6.5" ry="5" fill="${s}"/>`
  };

  let seq = 0;
  A.svg = function (av, size, label) {
    const a = A.normalize(av);
    const skin = A.SKIN[a.skin], hc = A.HAIRC[a.hairC];
    const id = 'avc' + (++seq);
    return `<svg class="av" viewBox="0 0 120 120" width="${size}" height="${size}" role="img" aria-label="${label || 'Аватар'}">` +
      `<defs><clipPath id="${id}"><circle cx="60" cy="60" r="60"/></clipPath></defs><g clip-path="url(#${id})">` +
      `<rect width="120" height="120" fill="${A.BG[a.bg]}"/>` +
      '<circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="1.5"/><circle cx="60" cy="60" r="38" fill="none" stroke="rgba(255,255,255,.09)" stroke-width="1.5"/>' +
      (a.hair === 2 ? `<path d="M31 60 C30 34 45 26 60 26 C75 26 90 34 89 60 L92 96 L28 96 Z" fill="${hc}"/>` : '') +
      tops[a.top](A.SHIRT[a.shirt]) +
      `<rect x="53" y="76" width="14" height="15" rx="4" fill="${skin}"/>` +
      (a.top === 'suit' ? '<path d="M53 89 L60 96 L67 89 Z" fill="#f4f6f8"/>' : '') +
      NECK[a.neck] + PIN[a.pin] +
      `<circle cx="34" cy="60" r="5.5" fill="${skin}"/><circle cx="86" cy="60" r="5.5" fill="${skin}"/>` +
      `<ellipse cx="60" cy="58" rx="26" ry="27" fill="${skin}"/>` +
      '<circle cx="45" cy="67" r="4" fill="#e0706a" opacity=".28"/><circle cx="75" cy="67" r="4" fill="#e0706a" opacity=".28"/>' +
      EYES[a.eyes] + GLASSES[a.glasses] + MOUTH[a.mouth] + hairFront(a.hair, hc) + EAR[a.ear] + HAT[a.hat] + HAND[a.hand](skin) +
      '</g></svg>';
  };

  window.GADARGA_AVATAR = A;
})();
