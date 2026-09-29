// Дэвсгэр: санамсаргүй физик газрын зураг, өндрийн өнгө, хаяалбар шугам.
(function () {
  function makeFbm(seed) {
    const hash = (x, y) => {
      let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
      h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
    const noise = (x, y) => {
      const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
      const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    };
    return (x, y) => { let s = 0, amp = .5, f = 1; for (let o = 0; o < 5; o++) { s += amp * noise(x * f + o * 17.3, y * f - o * 9.1); f *= 2.03; amp *= .5; } return s; };
  }
  const fbm = makeFbm((Math.random() * 1e9) | 0);
  const SEA = .52;
  const BANDS = [
    [.14, '#08263f'], [.28, '#0c3656'], [.40, '#134a73'], [.48, '#1f6493'], [SEA, '#3a82b3'],
    [.545, '#2b6a41'], [.65, '#5d9d4c'], [.74, '#a3b95b'], [.83, '#d9b05a'], [.90, '#b06a35'], [.955, '#8b4a29'], [1.01, '#eef3f0']
  ];
  const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

  function draw(cv) {
    const ctx = cv && cv.getContext('2d');
    if (!ctx) return;
    const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const cell = W > 1400 ? 5 : 4, gw = Math.ceil(W / cell) + 2, gh = Math.ceil(H / cell) + 2;
    const v = new Float32Array(gw * gh), sc = cell / 330;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const px = x * sc, py = y * sc;
      const wx = fbm(px * .6 + 5.2, py * .6 + 1.3), wy = fbm(px * .6 + 9.7, py * .6 + 7.1);
      v[y * gw + x] = fbm(px + wx * 1.5, py + wy * 1.5);
    }
    const sorted = Float32Array.from(v).sort();
    const qv = f => sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(f * sorted.length)))];
    const th = BANDS.map(b => qv(b[0])); th[th.length - 1] = Infinity;
    const cols = BANDS.map(b => hexRgb(b[1])), sea = qv(SEA);

    const off = document.createElement('canvas'); off.width = gw; off.height = gh;
    const octx = off.getContext('2d'), img = octx.createImageData(gw, gh), d = img.data;
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const i = y * gw + x, e = v[i];
      let k = 0; while (e > th[k]) k++;
      const c = cols[k];
      const dx = v[y * gw + Math.min(gw - 1, x + 1)] - v[y * gw + Math.max(0, x - 1)];
      const dy = v[Math.min(gh - 1, y + 1) * gw + x] - v[Math.max(0, y - 1) * gw + x];
      const s = Math.max(.72, Math.min(1.28, 1 + (dx + dy) * (e > sea ? 12 : 5)));
      const o = i * 4; d[o] = c[0] * s; d[o + 1] = c[1] * s; d[o + 2] = c[2] * s; d[o + 3] = 255;
    }
    octx.putImageData(img, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, -cell / 2, -cell / 2, gw * cell, gh * cell);

    const contour = (t, color, w) => {
      ctx.beginPath();
      for (let y = 0; y < gh - 1; y++) for (let x = 0; x < gw - 1; x++) {
        const i = y * gw + x, a = v[i], b = v[i + 1], c = v[i + gw + 1], dd = v[i + gw];
        const k = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (dd > t ? 1 : 0);
        if (k === 0 || k === 15) continue;
        const X = x * cell, Y = y * cell;
        const T = () => [X + cell * (t - a) / (b - a), Y], R = () => [X + cell, Y + cell * (t - b) / (c - b)];
        const B = () => [X + cell * (t - dd) / (c - dd), Y + cell], L = () => [X, Y + cell * (t - a) / (dd - a)];
        const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
        switch (k) {
          case 1: case 14: seg(L(), B()); break;
          case 2: case 13: seg(B(), R()); break;
          case 3: case 12: seg(L(), R()); break;
          case 4: case 11: seg(T(), R()); break;
          case 5: seg(L(), T()); seg(B(), R()); break;
          case 6: case 9: seg(T(), B()); break;
          case 7: case 8: seg(L(), T()); break;
          case 10: seg(L(), B()); seg(T(), R()); break;
        }
      }
      ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke();
    };
    for (const f of [.1, .2, .3, .4, .46]) contour(qv(f), 'rgba(150,205,235,.16)', .8);
    let n = 0;
    for (let f = .56; f < .99; f += .025, n++) contour(qv(f), n % 4 === 3 ? 'rgba(45,28,12,.42)' : 'rgba(45,28,12,.2)', n % 4 === 3 ? 1.1 : .7);
    contour(sea, 'rgba(4,20,34,.85)', 1.5);
  }

  function mount(cv) {
    try { draw(cv); } catch (e) {}
    let rt = 0, lastW = window.innerWidth, lastH = window.innerHeight;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        if (Math.abs(window.innerWidth - lastW) > 40 || Math.abs(window.innerHeight - lastH) > 140) {
          lastW = window.innerWidth; lastH = window.innerHeight;
          try { draw(cv); } catch (e) {}
        }
      }, 250);
    });
  }

  window.GADARGA_TERRAIN = { mount };
})();
