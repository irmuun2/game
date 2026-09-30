// 2-р тоглоом: чулуулаг хаана их олддог вэ? Газрын зургийн цэгүүд ба зураг.
(function () {
  const TYPES = {
    magma: { name: 'Магмын чулуулаг', color: '#ef7a55' },
    sed: { name: 'Тунамал чулуулаг', color: '#f0cd80' },
    meta: { name: 'Хувирмал чулуулаг', color: '#b9a3ec' }
  };
  const SITES = [
    { id: 'yosemite', place: 'Йосемити', country: 'АНУ', lat: 37.75, lng: -119.6, rock: 'Гранит', t: 'magma', text: 'Сурах бичигт гардаг хөмбөн уулын жишээ. Асар том гранит хадан цохионууд нь магма газрын гүнд удаан хөрж үүссэн.' },
    { id: 'shield', place: 'Канадын бамбай', country: 'Канад', lat: 52, lng: -74, rock: 'Гранит', t: 'magma', text: 'Дэлхийн хамгийн эртний чулуулаг бүхий нутгийн нэг. Гранит болон хувирмал чулуулаг өргөн тархсан.' },
    { id: 'scand', place: 'Скандинав', country: 'Норвеги, Швед, Финланд', lat: 62, lng: 16, rock: 'Гранит', t: 'magma', text: 'Эртний гранитан чулуулаг ил гарсан нутаг. Барилга, хөшөөнд хэрэглэх боржин чулуу ихээр олборлодог.' },
    { id: 'terelj', place: 'Тэрэлж', country: 'Монгол', lat: 47.9, lng: 107.5, rock: 'Гранит', t: 'magma', text: 'Мэлхий хад зэрэг сонин хэлбэрийн хадууд боржин чулуу олон мянган жил өгөршиж, элэгдэж үүссэн.' },
    { id: 'iceland', place: 'Исланд', country: 'Исланд', lat: 64.9, lng: -18.6, rock: 'Базальт', t: 'magma', text: 'Хоёр тектоникийн хавтангийн хил дээр оршдог тул галт уул олон. Лаав хурдан хөрж базальт үүсдэг.' },
    { id: 'hawaii', place: 'Хавай', country: 'АНУ', lat: 19.6, lng: -155.5, rock: 'Базальт', t: 'magma', text: 'Номхон далай дахь галт уулын арлууд. Шингэн лаав хурдан хөрж жижиг талсттай базальт болдог.' },
    { id: 'deccan', place: 'Декан өндөрлөг', country: 'Энэтхэг', lat: 19, lng: 76, rock: 'Базальт', t: 'magma', text: 'Эртний асар их лаав урсаж хөрснөөр үүссэн базальтан тэгш өндөрлөг.' },
    { id: 'khorgo', place: 'Хорго', country: 'Монгол', lat: 48.2, lng: 99.9, rock: 'Базальт', t: 'magma', text: 'Архангай аймгийн Хорго унтарсан галт уулын орчимд лаавын базальтан талбай тархсан.' },
    { id: 'ridge', place: 'Атлантын дундах нуруу', country: 'Атлантын далайн ёроол', lat: 10, lng: -40, rock: 'Базальт', t: 'magma', text: 'Хавтангууд холдон салж, гүнээс гарсан магма хөрж далайн ёроолын базальтан давхарга үүсдэг. Далайн давхаргын ихэнх нь базальт.' },
    { id: 'dover', place: 'Доверын цагаан хад', country: 'Их Британи', lat: 51.2, lng: 0.8, rock: 'Шохойн чулуу', t: 'sed', text: 'Далайн жижиг амьтдын бүрхүүл сая сая жил хуримтлагдаж үүссэн цагаан шохойн чулуун хад.' },
    { id: 'guilin', place: 'Гуйлинь', country: 'Хятад', lat: 25.3, lng: 110.3, rock: 'Шохойн чулуу', t: 'sed', text: 'Шохойн чулуу усанд уусаж, элэгдсээр өвөрмөц өндөр шовх хадат уулс үүссэн.' },
    { id: 'giza', place: 'Гизагийн пирамид', country: 'Египет', lat: 30, lng: 31.1, rock: 'Шохойн чулуу', t: 'sed', text: 'Пирамидуудыг ихэвчлэн шохойн чулуун блокоор барьсан. Шохойн чулуу барилгын чухал түүхий эд.' },
    { id: 'everest', place: 'Эверестийн орой', country: 'Непал, Хятад', lat: 27.8, lng: 86.8, rock: 'Шохойн чулуу', t: 'sed', text: 'Дэлхийн хамгийн өндөр оргилын оройд далайн амьтдын ул мөртэй шохойн чулуу бий. Хавтангууд нийлж далайн ёроол өргөгдсөний нотолгоо.' },
    { id: 'canyon', place: 'Гранд Каньон', country: 'АНУ', lat: 36.1, lng: -112.1, rock: 'Элсэн чулуу, шохойн чулуу', t: 'sed', text: 'Колорадо гол олон сая жил элэгдүүлж, тунамал чулуулгийн олон давхаргыг ил гаргасан.' },
    { id: 'petra', place: 'Петра', country: 'Иордан', lat: 30.3, lng: 35.4, rock: 'Элсэн чулуу', t: 'sed', text: 'Эртний хотыг улаан элсэн чулуун хадан цохиог сийлж барьсан.' },
    { id: 'uluru', place: 'Улуру', country: 'Австрали', lat: -25.3, lng: 131, rock: 'Элсэн чулуу', t: 'sed', text: 'Тал газрын дунд ганцаараа сүндэрлэх асар том элсэн чулуун хад.' },
    { id: 'wales', place: 'Уэльс', country: 'Их Британи', lat: 53, lng: -4, rock: 'Занар', t: 'meta', text: 'Шаварлаг чулуулаг өндөр даралт, температурын нөлөөгөөр занар болсон. Дээвэр хийхэд ашигладаг.' },
    { id: 'carrara', place: 'Каррара', country: 'Итали', lat: 44.1, lng: 10.1, rock: 'Гантиг', t: 'meta', text: 'Шохойн чулуу газрын гүнд даралт, температурын нөлөөгөөр хувирч гантиг болсон. Хөшөө, барилгад хэрэглэнэ.' }
  ];

  // jsvectormap-ийн Миллерийн проекцтой ижил тооцоо.
  function project(lat, lng) {
    const W = window.GADARGA_WORLD, R = 6381372, rd = Math.PI / 180;
    const x = R * (lng - W.cm) * rd;
    const y = -R * Math.log(Math.tan((45 + 0.4 * lat) * rd)) / 0.8;
    const b = W.bbox;
    return { x: (x - b[0].x) / (b[1].x - b[0].x) * W.w, y: (y - b[0].y) / (b[1].y - b[0].y) * W.h };
  }

  function svg(seen, selected) {
    const W = window.GADARGA_WORLD;
    if (!W) return '<p class="note">Газрын зураг ачаалагдсангүй. Доорх жагсаалтаас газрыг сонгоно уу.</p>';
    const top = 30, h = W.h - 70; // Антарктидын доод хэсгийг бага зэрэг тайрна
    const marks = SITES.map(s => {
      const p = project(s.lat, s.lng), c = TYPES[s.t].color;
      const on = s.id === selected, was = seen.includes(s.id);
      return `<g class="mk${on ? ' on' : ''}" data-site="${s.id}" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})" tabindex="0" role="button" aria-label="${s.place}, ${s.rock}">` +
        `<circle r="11" fill="transparent"/>` +
        (on ? `<circle r="10" fill="none" stroke="${c}" stroke-width="2" opacity=".7"/>` : '') +
        `<circle r="${on ? 6.5 : 5}" fill="${c}" stroke="${was ? '#eef3f0' : '#07233a'}" stroke-width="${was ? 1.6 : 1.2}"/></g>`;
    }).join('');
    return `<svg class="world" viewBox="0 ${top} ${W.w} ${h}" role="group" aria-label="Дэлхийн газрын зураг, чулуулгийн цэгүүд">` +
      `<rect x="0" y="${top}" width="${W.w}" height="${h}" fill="#0c3656"/>` +
      `<path d="${W.d}" fill="#3f7d4a" stroke="#2b5c38" stroke-width=".4"/>` + marks + '</svg>';
  }

  window.GADARGA_ROCKS = { TYPES, SITES, svg };
})();
