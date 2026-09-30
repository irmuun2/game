// II бүлгийн нэмэлт тоглоом «Нарны аймгийн аялал»: нарны аймгийн биетүүд ба зураг.
// Зай (см) нь сурах бичгийн 2.1 дүгээр хүснэгтээс (16-р хуудас). Загварт 10 см = 150 сая км тул 1 см = 15 сая км.
(function () {
  const KM = cm => (cm * 15).toLocaleString('mn-MN').replace(/ |,/g, ' ');
  // ord: нарнаас алслагдах дугаар (сурах бичгийн дагуу 9 гараг). fact: сонирхолтой нэмэлт баримт.
  const BODIES = [
    { id: 'sun', name: 'Нар', kind: 'Од', color: '#f6c343',
      text: 'Дэлхийд хамгийн ойр орших шар од. Химийн найрлагад устөрөгч, гели зонхилж, гадаргын температур нь 6000°C.',
      fact: 'Нарны аймгийн бүх гараг нарыг тойрон өөр өөрийн замаар эргэдэг.' },
    { id: 'mercury', name: 'Буд', kind: 'Гараг', ord: 1, cm: 4, color: '#a3a3a3', r: 5,
      text: 'Нарнаас алслагдах дарааллаар 1 дэх буюу нарт хамгийн ойр гараг.',
      fact: 'Нарт хамгийн ойр тул нарыг ердөө 88 хоногт тойрдог.' },
    { id: 'venus', name: 'Сугар', kind: 'Гараг', ord: 2, cm: 7, color: '#e6cf98', r: 8,
      text: 'Нарнаас алслагдах дарааллаар 2 дахь гараг. Дэлхийгээс нарт ойр оршдог.',
      fact: 'Өтгөн агаар мандал нь дулааныг хадгалдаг тул нарны аймгийн хамгийн халуун гараг.' },
    { id: 'earth', name: 'Дэлхий', kind: 'Гараг', ord: 3, cm: 10, color: '#3b82c4', r: 8.5,
      text: 'Нарнаас 3 дахь гараг. Нарнаас дунджаар 150 сая км зайд оршиж, нарыг 365 хоногт тойрно. Ганц дагуултай, тэр нь Сар.',
      fact: 'Амьдрал байгаа нь мэдэгдсэн цорын ганц гараг.' },
    { id: 'moon', name: 'Сар', kind: 'Дагуул', color: '#d4d4d4', r: 3,
      text: 'Дэлхийн ганц дагуул. Дэлхийгээс 384 400 км зайд оршдог. Дэлхийг тойрох, тэнхлэгээ эргэх хугацаа нь бараг ижил тул бид сарны зөвхөн нэг талыг хардаг.',
      fact: 'Нар дэлхийгээс 150 сая км зайтай тул Сар дэлхийд нараас хэдэн зуу дахин ойр.' },
    { id: 'mars', name: 'Ангараг', kind: 'Гараг', ord: 4, cm: 15, color: '#c4532f', r: 6.5,
      text: 'Нарнаас 4 дэх гараг. 2.1 дүгээр хүснэгтэд улаан өнгөтэй гэж бичсэн.',
      fact: 'Хөрсөнд нь төмрийн исэл их байдаг тул улаан өнгөтэй харагддаг.' },
    { id: 'belt', name: 'Бага гаргуудын бүс', kind: 'Жижиг гаргууд', cm: 28, color: '#8a8378',
      text: 'Ангараг, Бархасбадь хоёр гаргийн хооронд олон жижиг гараг нарыг тойрон эргэдэг бүс.',
      fact: 'Бүсийн жижиг гаргуудыг астероид ч гэж нэрлэдэг.' },
    { id: 'jupiter', name: 'Бархасбадь', kind: 'Гараг', ord: 5, cm: 52, color: '#d6b186', r: 22,
      text: 'Нарнаас 5 дахь гараг. Сурах бичигт 79 дагуултай гэж бичсэн.',
      fact: 'Нарны аймгийн хамгийн том гараг.' },
    { id: 'saturn', name: 'Санчир', kind: 'Гараг', ord: 6, cm: 96, color: '#e3c77c', r: 17,
      text: 'Нарнаас 6 дахь гараг. Загварт бараг 1 метрийн зайд байрлана.',
      fact: 'Мөс, чулуунаас тогтсон тод цагирагтай.' },
    { id: 'uranus', name: 'Тэнгэрийн ван', kind: 'Гараг', ord: 7, cm: 192, color: '#8fd3dc', r: 12,
      text: 'Нарнаас 7 дахь гараг. Нарнаас Санчираас 2 дахин хол оршдог.',
      fact: 'Тэнхлэг нь бараг хажуу тийшээ хэвтсэн байдалтай эргэдэг.' },
    { id: 'neptune', name: 'Далай ван', kind: 'Гараг', ord: 8, cm: 300, color: '#4468cc', r: 12,
      text: 'Нарнаас 8 дахь гараг. Нарнаас Дэлхийгээс 30 дахин хол оршдог.',
      fact: 'Нарны аймгийн хамгийн хүчтэй салхи энэ гараг дээр үлээдэг.' },
    { id: 'pluto', name: 'Дэлхий ван', kind: 'Одой гараг', ord: 9, cm: 395, color: '#b39b86', r: 4,
      text: 'Сурах бичигт нарнаас 9 дэх гараг гэж бичсэн. 2.1 дүгээр хүснэгтэд хамгийн алс, 395 см-т байрлана.',
      fact: 'Одон орон судлаачид 2006 оноос Дэлхий ванг одой гараг гэж ангилдаг.' }
  ];
  // Дарааллын сорил: 2.1 дүгээр хүснэгтийн мөрүүдийн дараалал.
  const ORDER = ['mercury', 'venus', 'earth', 'mars', 'belt', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const body = id => BODIES.find(b => b.id === id);
  const ordinal = n => n + ([1, 4, 9].includes(n) ? ' дэх' : ' дахь');
  // Биетийн картын мөрүүд: [гарчиг, утга].
  const facts = b => [
    b.ord ? ['Нарнаас', ordinal(b.ord) + (b.id === 'pluto' ? ' (сурах бичгээр)' : '')] : null,
    b.cm ? ['Загварт (2.1 дүгээр хүснэгт)', b.cm + ' см'] : null,
    b.cm ? ['Нарнаас бодит зай', 'ойролцоогоор ' + KM(b.cm) + ' сая км'] : null
  ].filter(Boolean);

  // Хэвтээ зураг: нар зүүн талд, гаргууд нарнаас алслагдах дарааллаар. Зай нь бодит хэмжээгээр биш (багтаахын тулд шахсан).
  const Y = 150, X = cm => 150 + Math.pow(cm / 395, 0.4) * 820;
  const STARS = Array.from({ length: 70 }, (_, i) => [(i * 137.5) % 1000, (i * 71.3 + 17) % 290, i % 3 ? 0.7 : 1.3]);
  function svg(seen, selected) {
    const mk = (b, inner, label, ly) => {
      const on = b.id === selected, was = seen.includes(b.id);
      return `<g class="bd${on ? ' on' : ''}${was ? ' seen' : ''}" data-body="${b.id}" tabindex="0" role="button" aria-label="${b.name}${was ? ', судалсан' : ''}">` + inner +
        (label ? `<text x="${label}" y="${ly}" text-anchor="middle" class="bd-l">${b.name}</text>` : '') + '</g>';
    };
    const ring = (x, r, on, was) => (on ? `<circle cx="${x}" cy="${Y}" r="${r + 6}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>` : '') +
      (was ? `<circle cx="${x}" cy="${Y}" r="${r + 3}" fill="none" stroke="#eef3f0" stroke-width="1" opacity=".55"/>` : '');
    let up = false;
    const parts = BODIES.filter(b => b.cm).map(b => {
      const x = X(b.cm), on = b.id === selected, was = seen.includes(b.id);
      if (b.id === 'belt') {
        const dots = Array.from({ length: 26 }, (_, i) => `<circle cx="${(x - 9 + (i * 7.3) % 18).toFixed(1)}" cy="${(Y - 60 + (i * 23.7) % 120).toFixed(1)}" r="${i % 4 ? 1.2 : 1.8}" fill="${b.color}"/>`).join('');
        return mk(b, `<rect x="${x - 14}" y="${Y - 66}" width="28" height="132" rx="10" fill="${on ? 'rgba(255,255,255,.12)' : 'transparent'}" stroke="${was ? 'rgba(238,243,240,.45)' : 'none'}"/>` + dots, x, Y + 86);
      }
      up = !up;
      const r = b.r, ly = up ? Y + r + 16 : Y - r - 8;
      let shape = `<circle cx="${x}" cy="${Y}" r="${r + 8}" fill="transparent"/><circle cx="${x}" cy="${Y}" r="${r}" fill="${b.color}"/>`;
      if (b.id === 'jupiter') shape += `<path d="M${x - r * 0.95} ${Y - 5}h${r * 1.9}M${x - r * 0.98} ${Y + 4}h${r * 1.96}M${x - r * 0.8} ${Y + 12}h${r * 1.6}" stroke="#a9794f" stroke-width="2.4" opacity=".7"/>`;
      if (b.id === 'saturn') shape += `<ellipse cx="${x}" cy="${Y}" rx="${r * 1.9}" ry="${r * 0.5}" fill="none" stroke="#cdb271" stroke-width="3"/>`;
      if (b.id === 'earth') {
        const m = body('moon'), mx = x + 12, my = Y - 12, mOn = selected === 'moon', mWas = seen.includes('moon');
        shape += `<path d="M${x - 4} ${Y - 5}q4 -2 6 2q-3 4 -6 1z" fill="#4fa35c"/>`;
        return mk(b, ring(x, r, on, was) + shape, x, ly) +
          mk(m, `<circle cx="${mx}" cy="${my}" r="8" fill="transparent"/>` + (mOn ? `<circle cx="${mx}" cy="${my}" r="7" fill="none" stroke="#fff" stroke-width="1.4"/>` : '') +
            `<circle cx="${mx}" cy="${my}" r="${m.r}" fill="${m.color}" stroke="${mWas ? '#eef3f0' : 'none'}" stroke-width="1"/>`, 0, 0);
      }
      return mk(b, ring(x, r, on, was) + shape, x, ly);
    }).join('');
    const orbits = BODIES.filter(b => b.cm && b.id !== 'belt').map(b =>
      `<circle cx="40" cy="${Y}" r="${(X(b.cm) - 40).toFixed(1)}" fill="none" stroke="rgba(238,243,240,.13)" stroke-width="1"/>`).join('');
    const sun = BODIES[0], sOn = selected === 'sun', sWas = seen.includes('sun');
    return `<svg class="solar" viewBox="0 0 1000 300" role="group" aria-label="Нарны аймаг: нар ба гаргууд нарнаас алслагдах дарааллаар">` +
      '<defs><radialGradient id="sun-g" cx=".45" cy=".45" r=".6"><stop offset="0" stop-color="#fff3b0"/><stop offset=".55" stop-color="#f6c343"/><stop offset="1" stop-color="#e2821f"/></radialGradient></defs>' +
      '<rect width="1000" height="300" fill="#050f1c"/>' +
      STARS.map(s => `<circle cx="${s[0].toFixed(1)}" cy="${s[1].toFixed(1)}" r="${s[2]}" fill="#eef3f0" opacity=".45"/>`).join('') + orbits +
      mk(sun, `<circle cx="40" cy="${Y}" r="92" fill="url(#sun-g)"/>` + (sOn ? `<circle cx="40" cy="${Y}" r="100" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>` : '') +
        (sWas ? `<circle cx="40" cy="${Y}" r="96" fill="none" stroke="#eef3f0" stroke-width="1" opacity=".5"/>` : ''), 70, Y + 4) +
      parts + '</svg>';
  }

  window.GADARGA_SOLAR = { BODIES, ORDER, body, facts, svg, ordinal };
})();
