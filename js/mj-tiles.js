/* 마작패 앞면 (SVG · viewBox 40×54) */
(() => {
  const GR = '#1D6A43', RD = '#B5232A', BL = '#1F4C8A', BK = '#171717';
  const NUM = ['一', '二', '三', '四', '伍', '六', '七', '八', '九'];
  const F = "'Noto Serif KR','Noto Serif CJK KR',serif";
  const txt = (s, x, y, size, col) => `<text x="${x}" y="${y}" font-family="${F}" font-weight="900" font-size="${size}" fill="${col}" text-anchor="middle" dominant-baseline="central">${s}</text>`;
  const pin = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#FBF8F0" stroke="${c}" stroke-width="${r * .3}"/><circle cx="${x}" cy="${y}" r="${r * .52}" fill="none" stroke="${c}" stroke-width="${r * .14}" stroke-dasharray="${r * .22} ${r * .16}"/><circle cx="${x}" cy="${y}" r="${r * .24}" fill="${c === GR ? RD : c}"/>`;
  const stick = (x, y, h, c, rot = 0) => { const w = 4.6, t = y - h / 2;
    return `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - w / 2}" y="${t}" width="${w}" height="${h}" rx="2.2" fill="${c}"/><rect x="${x - .6}" y="${t + 1.6}" width="1.2" height="${h - 3.2}" rx=".6" fill="#FBF8F0" opacity=".55"/><rect x="${x - w / 2 - .5}" y="${y - .9}" width="${w + 1}" height="1.8" rx=".9" fill="${c}"/><rect x="${x - w / 2 - .5}" y="${t}" width="${w + 1}" height="1.6" rx=".8" fill="${c}"/><rect x="${x - w / 2 - .5}" y="${t + h - 1.6}" width="${w + 1}" height="1.6" rx=".8" fill="${c}"/></g>`; };
  const PINS = {
    2: [[20, 15, GR], [20, 39, GR]], 3: [[10, 11, GR], [20, 27, RD], [30, 43, GR]],
    4: [[11, 15, BL], [29, 15, GR], [11, 39, GR], [29, 39, BL]], 5: [[10, 12, BL], [30, 12, GR], [20, 27, RD], [10, 42, GR], [30, 42, BL]],
    6: [[12, 10, GR], [28, 10, GR], [12, 29, RD], [28, 29, RD], [12, 44, RD], [28, 44, RD]],
    7: [[8, 7, GR], [20, 12, GR], [32, 17, GR], [12, 32, RD], [28, 32, RD], [12, 45, RD], [28, 45, RD]],
    8: [[12, 7, BL], [28, 7, BL], [12, 20, BL], [28, 20, BL], [12, 34, BL], [28, 34, BL], [12, 47, BL], [28, 47, BL]],
    9: [[8, 10, GR], [20, 10, GR], [32, 10, GR], [8, 27, RD], [20, 27, RD], [32, 27, RD], [8, 44, BL], [20, 44, BL], [32, 44, BL]] };
  const PR = { 2: 8.5, 3: 7, 4: 7.5, 5: 6.5, 6: 6, 7: 5.2, 8: 5.2, 9: 5.2 };
  const SOU = {
    2: [[20, 15, 18], [20, 39, 18]], 3: [[20, 15, 18], [11, 39, 18], [29, 39, 18]],
    4: [[11, 15, 18], [29, 15, 18], [11, 39, 18], [29, 39, 18]], 5: [[9, 15, 18], [31, 15, 18], [20, 27, 18, RD], [9, 39, 18], [31, 39, 18]],
    6: [[8, 15, 18], [20, 15, 18], [32, 15, 18], [8, 39, 18], [20, 39, 18], [32, 39, 18]],
    7: [[20, 9, 13, RD], [8, 27, 13], [20, 27, 13], [32, 27, 13], [8, 44, 13], [20, 44, 13], [32, 44, 13]],
    8: [[7, 15, 18], [15.5, 15, 18, 0, 22], [24.5, 15, 18, 0, -22], [33, 15, 18], [7, 39, 18], [15.5, 39, 18, 0, -22], [24.5, 39, 18, 0, 22], [33, 39, 18]],
    9: [[8, 10, 13], [20, 10, 13, RD], [32, 10, 13], [8, 27, 13], [20, 27, 13, RD], [32, 27, 13], [8, 44, 13], [20, 44, 13, RD], [32, 44, 13]] };
  const bird = () => { let tail = ''; [[20, 8], [14, 10], [26, 10], [10, 15], [30, 15], [17, 14], [23, 14], [20, 13]].forEach(([x, y]) => tail += `<circle cx="${x}" cy="${y}" r="2.6" fill="#FBF8F0" stroke="${BL}" stroke-width="1.1"/><circle cx="${x}" cy="${y}" r="1" fill="${RD}"/>`);
    return tail + `<path d="M20 17 C12 22 10 32 16 38 C20 42 28 40 30 34 C33 27 27 20 20 17Z" fill="${GR}"/><path d="M16 26 C19 30 24 31 28 29" stroke="#FBF8F0" stroke-width="1.2" fill="none"/><path d="M14 33 C18 36 24 36 28 34" stroke="#FBF8F0" stroke-width="1.2" fill="none"/><circle cx="29" cy="22" r="4" fill="${GR}"/><circle cx="30" cy="21" r="1" fill="#FBF8F0"/><path d="M32.5 22 L37 23.5 L32.5 24.5Z" fill="${RD}"/><path d="M18 40 L16 48 M22 40 L24 48 M13 48 L18 48 M22 48 L27 48" stroke="${RD}" stroke-width="1.4" stroke-linecap="round"/>`; };
  const cache = {};
  window.tileFace = (t, red) => {
    const k = t + (red ? 'r' : ''); if (cache[k]) return cache[k];
    let g = '';
    if (t >= 27) { const H = ['東', '南', '西', '北', '', '發', '中'], C = [BK, BK, BK, BK, BK, GR, RD]; g = H[t - 27] ? txt(H[t - 27], 20, 27, 34, C[t - 27]) : ''; }
    else { const su = Math.floor(t / 9), n = t % 9 + 1;
      if (su === 0) g = txt(NUM[n - 1], 20, 14, 22, red ? RD : BK) + txt('萬', 20, 38, 25, RD);
      else if (su === 1) g = n === 1 ? `<circle cx="20" cy="27" r="16" fill="#FBF8F0" stroke="${GR}" stroke-width="3.2"/><circle cx="20" cy="27" r="11.5" fill="none" stroke="${red ? RD : GR}" stroke-width="3" stroke-dasharray="2.2 1.6"/><circle cx="20" cy="27" r="7" fill="${red ? RD : '#FBF8F0'}" stroke="${RD}" stroke-width="1.6"/><circle cx="20" cy="27" r="2.6" fill="${red ? '#FBF8F0' : RD}"/>`
        : PINS[n].map(([x, y, c]) => pin(x, y, PR[n], red ? RD : c)).join('');
      else g = n === 1 ? bird() : SOU[n].map(([x, y, h, c, r]) => stick(x, y, h, red ? RD : (c || GR), r || 0)).join(''); }
    return cache[k] = `<svg viewBox="0 0 40 54" preserveAspectRatio="xMidYMid meet">${g}</svg>`;
  };
})();
