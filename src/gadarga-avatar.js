// Аватар: суурь төрх, өмсөх зүйлс (толгой, нүдний шил, хувцас, хүзүү), дэлгүүр, стил, SVG зураг.
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
    { id: 'top', name: 'Хувцас' }, { id: 'neck', name: 'Хүзүү' }, { id: 'pin', name: 'Энгэр' }
  ];
  // need: нийт оноо хүрэхэд нээгдэнэ · reward: 5 түвшин давбал · price: дэлгүүрээс худалдаж авна
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
    { id: 'specs', slot: 'glasses', name: 'Нүдний шил', price: 20, style: 'formal' },
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
    { id: 'badge', slot: 'pin', name: 'Алтан энгэрийн тэмдэг', price: 90, style: 'formal' }
  ];
  A.STYLES = [
    { id: 'hiphop', name: 'Хип хоп стил', text: 'Малгай (хажуу саравчтай эсвэл бини), хар нарны шил, чихэвч, малгайтай цамц, алтан гинж' },
    { id: 'formal', name: 'Албаны стил', text: 'Малгай (федора эсвэл цилиндр), нүдний шил, костюм, зангиа эсвэл эрвээхэй зангиа, алтан энгэрийн тэмдэг' }
  ];
  A.HATS = A.ITEMS.filter(i => i.slot === 'hat');
  A.DEFAULT = { bg: 0, skin: 1, hair: 0, hairC: 0, eyes: 0, mouth: 0, shirt: 0, hat: 'none', glasses: 'none', ear: 'none', top: 'none', neck: 'none', pin: 'none' };

  A.item = (slot, id) => A.ITEMS.find(i => i.slot === slot && i.id === id) || A.ITEMS.find(i => i.slot === slot);
  A.hat = id => A.item('hat', id);
  A.styleItems = sid => A.ITEMS.filter(i => i.style === sid);
  // Стил нь хэд хэдэн үүрээс бүрдэнэ. Үүр бүрт тухайн стилийн аль нэг зүйл өмссөн бол бүрдсэн гэнэ.
  A.styleSlots = sid => [...new Set(A.styleItems(sid).map(i => i.slot))];
  A.wearingStyle = (av, sid) => !!av && A.styleSlots(sid).every(slot => {
    const it = A.ITEMS.find(i => i.slot === slot && i.id === av[slot]);
    return !!(it && it.style === sid);
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
      top: pick('top', a.top), neck: pick('neck', a.neck), pin: pick('pin', a.pin)
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
      '<path d="M50 89 L58 110 L51 105 L45 95 Z M70 89 L62 110 L69 105 L75 95 Z" fill="#1d232b"/><circle cx="60" cy="116" r="1.6" fill="#11151a"/>'
  };
  const NECK = {
    none: '',
    chain: '<path d="M47 90 Q60 107 73 90" fill="none" stroke="#e8b923" stroke-width="3" stroke-dasharray="3 1.6"/><circle cx="60" cy="100" r="4.5" fill="#e8b923" stroke="#a97c10" stroke-width="1.2"/><path d="M58 100 h4" stroke="#a97c10" stroke-width="1.2"/>',
    tie: '<path d="M57.5 90 L62.5 90 L61.5 93 L63.5 108 L60 112 L56.5 108 L58.5 93 Z" fill="#c4492f" stroke="#8f2f1d" stroke-width=".8"/>',
    bowtie: '<path d="M60 92 L49 86.5 L49 97.5 Z M60 92 L71 86.5 L71 97.5 Z" fill="#1d232b" stroke="#0b0e12" stroke-width=".8" stroke-linejoin="round"/><circle cx="60" cy="92" r="2.6" fill="#11151a"/>'
  };
  const PIN = {
    none: '',
    badge: '<circle cx="78" cy="106" r="5.5" fill="#e8b923" stroke="#a97c10" stroke-width="1.2"/><path d="M78 102.3 l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3z" fill="#fff3c4"/>'
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
    tophat: '<rect x="44" y="7" width="32" height="30" rx="2" fill="#1d232b"/><rect x="44" y="28" width="32" height="5" fill="#8f2f1d"/><ellipse cx="60" cy="37" rx="27" ry="4.5" fill="#11151a"/><path d="M48 10 V26" stroke="#3a4250" stroke-width="2" stroke-linecap="round"/>'
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
      EYES[a.eyes] + GLASSES[a.glasses] + MOUTH[a.mouth] + hairFront(a.hair, hc) + EAR[a.ear] + HAT[a.hat] +
      '</g></svg>';
  };

  window.GADARGA_AVATAR = A;
})();
