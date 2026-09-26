/* MAHJONG — core · 리치 마작
   패 번호: id 0~135 (종류 t = id>>2) · t 0~8 만 · 9~17 통 · 18~26 삭 · 27~30 東南西北 · 31~33 白發中
   적도라: id 16(5만) 52(5통) 88(5삭) */
const HONOR_K = ['東', '南', '西', '北', '白', '發', '中'];
const HONOR_KR = ['동', '남', '서', '북', '백', '발', '중'];
const SUIT_K = ['만', '통', '삭'];
const tT = id => id >> 2;
const isRed = id => id === 16 || id === 52 || id === 88;
const isHon = t => t >= 27;
const isYao = t => t >= 27 || t % 9 === 0 || t % 9 === 8;
const isDragon = t => t >= 31;
const isWind = t => t >= 27 && t <= 30;
const tName = t => t >= 27 ? HONOR_K[t - 27] : (t % 9 + 1) + SUIT_K[Math.floor(t / 9)];
function cnt(ids) { const c = new Array(34).fill(0); ids.forEach(i => c[tT(i)]++); return c; }
function doraOf(t, sanma) {
  if (t < 27) { const s = Math.floor(t / 9) * 9, r = t % 9; if (sanma && s === 0) return r === 0 ? 8 : 0; return s + (r + 1) % 9; }
  if (t <= 30) return t === 30 ? 27 : t + 1; return t === 33 ? 31 : t + 1;
}

/* ── 샹텐 (일반형 · 치또이츠 · 국사) — 수트별 메모 ── */
const SH_MEMO = new Map();
function groupRes(a, hon) {
  const key = (hon ? 'h' : 's') + a.join(''); let r = SH_MEMO.get(key); if (r) return r;
  const res = new Set(), L = a.length;
  const go = (i, m, t, p) => {
    while (i < L && !a[i]) i++;
    if (i >= L) { res.add(m * 100 + t * 10 + p); return; }
    if (a[i] >= 3) { a[i] -= 3; go(i, m + 1, t, p); a[i] += 3; }
    if (!hon && i <= L - 3 && a[i + 1] && a[i + 2]) { a[i]--; a[i + 1]--; a[i + 2]--; go(i, m + 1, t, p); a[i]++; a[i + 1]++; a[i + 2]++; }
    if (a[i] >= 2) { a[i] -= 2; if (!p) go(i, m, t, 1); go(i, m, t + 1, p); a[i] += 2; }
    if (!hon && i <= L - 2 && a[i + 1]) { a[i]--; a[i + 1]--; go(i, m, t + 1, p); a[i]++; a[i + 1]++; }
    if (!hon && i <= L - 3 && a[i + 2]) { a[i]--; a[i + 2]--; go(i, m, t + 1, p); a[i]++; a[i + 2]++; }
    a[i]--; go(i, m, t, p); a[i]++;
  };
  go(0, 0, 0, 0);
  let arr = [...res].map(v => [Math.floor(v / 100), Math.floor(v / 10) % 10, v % 10]);
  arr = arr.filter(x => !arr.some(y => y !== x && y[0] >= x[0] && y[1] >= x[1] && y[2] >= x[2] && (y[0] > x[0] || y[1] > x[1] || y[2] > x[2])));
  SH_MEMO.set(key, arr); return arr;
}
function shReg(c, fm) {
  let st = [[fm, 0, 0]];
  const groups = [[c.slice(0, 9), 0], [c.slice(9, 18), 0], [c.slice(18, 27), 0], [c.slice(27, 34), 1]];
  for (const [a, h] of groups) {
    const g = groupRes(a, h), nx = [];
    st.forEach(s => g.forEach(o => { if (s[2] + o[2] > 1) return; nx.push([s[0] + o[0], s[1] + o[1], s[2] + o[2]]); }));
    st = nx.filter(x => !nx.some(y => y !== x && y[0] >= x[0] && y[1] >= x[1] && y[2] >= x[2] && (y[0] > x[0] || y[1] > x[1] || y[2] > x[2])));
  }
  let best = 8; st.forEach(([m, t, p]) => { const s = 8 - 2 * m - Math.min(t, 4 - m) - p; if (s < best) best = s; }); return best;
}
function shChi(c) { let pr = 0, kd = 0; c.forEach(v => { if (v >= 2) pr++; if (v >= 1) kd++; }); return 6 - pr + Math.max(0, 7 - kd); }
const YAO_T = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
function shKoku(c) { let kd = 0, pr = 0; YAO_T.forEach(t => { if (c[t]) kd++; if (c[t] >= 2) pr = 1; }); return 13 - kd - pr; }
function shanten(c, fm) { let s = shReg(c, fm); if (!fm) { s = Math.min(s, shChi(c), shKoku(c)); } return s; }
function waitsOf(c, fm, allowed) { const w = []; for (let t = 0; t < 34; t++) { if (allowed && !allowed(t)) continue; if (c[t] >= 4) continue; c[t]++; if (shanten(c, fm) === -1) w.push(t); c[t]--; } return w; }

/* ── 분해 ── */
function decomps(c) {
  const out = [];
  for (let p = 0; p < 34; p++) { if (c[p] < 2) continue; c[p] -= 2; const sets = [];
    const rec = i => { while (i < 34 && !c[i]) i++; if (i >= 34) { out.push({ pair: p, sets: sets.slice() }); return; }
      if (c[i] >= 3) { c[i] -= 3; sets.push({ k: 'kou', t: i }); rec(i); sets.pop(); c[i] += 3; }
      if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; sets.push({ k: 'shun', t: i }); rec(i); sets.pop(); c[i]++; c[i + 1]++; c[i + 2]++; } };
    rec(0); c[p] += 2; }
  return out;
}

/* ── 역 · 부수 · 점수 ── */
function yakuhaiN(t, ctx) { return (isDragon(t) ? 1 : 0) + (t === ctx.seatW ? 1 : 0) + (t === ctx.roundW ? 1 : 0); }
function evalReg(ctx, pair, sets, wait) {
  const Y = [], ym = [], cl = !ctx.open, op = (a, b) => cl ? a : b;
  const shun = sets.filter(s => s.k === 'shun'), kous = sets.filter(s => s.k !== 'shun'), kans = sets.filter(s => s.k === 'kan');
  const tiles = [pair, pair]; sets.forEach(s => { if (s.k === 'shun') tiles.push(s.t, s.t + 1, s.t + 2); else tiles.push(s.t, s.t, s.t); });
  const suits = new Set(tiles.filter(t => t < 27).map(t => Math.floor(t / 9))), hasHon = tiles.some(isHon);
  const ank = kous.filter(s => !s.open).length, drK = kous.filter(s => isDragon(s.t)).length, wK = kous.filter(s => isWind(s.t)).length;
  if (ank === 4) ym.push(wait === 'tanki' ? ['스안커 단기', 2] : ['스안커', 1]);
  if (drK === 3) ym.push(['대삼원', 1]);
  if (wK === 4) ym.push(['대사희', 2]); else if (wK === 3 && isWind(pair)) ym.push(['소사희', 1]);
  if (tiles.every(isHon)) ym.push(['자일색', 1]);
  if (tiles.every(t => [19, 20, 21, 23, 25, 32].includes(t))) ym.push(['녹일색', 1]);
  if (tiles.every(t => t < 27 && (t % 9 === 0 || t % 9 === 8))) ym.push(['청노두', 1]);
  if (kans.length === 4) ym.push(['스깡쯔', 1]);
  if (cl && !ctx.melds.length && suits.size === 1 && !hasHon) { const s = [...suits][0] * 9, r = [3, 1, 1, 1, 1, 1, 1, 1, 3]; if (r.every((v, i) => ctx.c[s + i] >= v)) ym.push(r.every((v, i) => ctx.c[s + i] - (s + i === ctx.winT ? 1 : 0) === v) ? ['순정 구련보등', 2] : ['구련보등', 1]); }
  if (ctx.tenhou) ym.push(['천화', 1]); if (ctx.chiihou) ym.push(['지화', 1]);
  if (ym.length) return { ym, yaku: [], fu: 0 };
  if (ctx.riichi === 2) Y.push(['더블 리치', 2]); else if (ctx.riichi) Y.push(['리치', 1]);
  if (ctx.riichi && ctx.ippatsu) Y.push(['일발', 1]);
  if (cl && ctx.tsumo) Y.push(['멘젠 쯔모', 1]);
  const pinfu = cl && shun.length === 4 && !yakuhaiN(pair, ctx) && wait === 'ryanmen';
  if (pinfu) Y.push(['핑후', 1]);
  if (tiles.every(t => !isYao(t))) Y.push(['탕야오', 1]);
  if (cl) { const m = {}; shun.forEach(s => m[s.t] = (m[s.t] || 0) + 1); const pr = Object.values(m).reduce((a, v) => a + Math.floor(v / 2), 0); if (pr === 2) Y.push(['량페코', 3]); else if (pr === 1) Y.push(['이페코', 1]); }
  kous.forEach(s => { if (isDragon(s.t)) Y.push(['역패 ' + tName(s.t), 1]); if (s.t === ctx.seatW) Y.push(['자풍 ' + tName(s.t), 1]); if (s.t === ctx.roundW) Y.push(['장풍 ' + tName(s.t), 1]); });
  if (ctx.haitei) Y.push(['해저로월', 1]); if (ctx.houtei) Y.push(['하저로어', 1]); if (ctx.rinshan) Y.push(['영상개화', 1]); if (ctx.chankan) Y.push(['창깡', 1]);
  const hasShun = t => shun.some(s => s.t === t), hasKou = t => kous.some(s => s.t === t);
  for (let r = 0; r < 7; r++) if (hasShun(r) && hasShun(r + 9) && hasShun(r + 18)) { Y.push(['삼색동순', op(2, 1)]); break; }
  for (let s = 0; s < 27; s += 9) if (hasShun(s) && hasShun(s + 3) && hasShun(s + 6)) { Y.push(['일기통관', op(2, 1)]); break; }
  const allYao = sets.every(s => s.k === 'shun' ? (s.t % 9 === 0 || s.t % 9 === 6) : isYao(s.t)) && isYao(pair);
  if (allYao && shun.length) { if (hasHon) Y.push(['찬타', op(2, 1)]); else Y.push(['준찬타', op(3, 2)]); }
  if (kous.length === 4) Y.push(['또이또이', 2]);
  if (ank === 3) Y.push(['산안커', 2]);
  if (kans.length === 3) Y.push(['산깡쯔', 2]);
  for (let r = 0; r < 9; r++) if (hasKou(r) && hasKou(r + 9) && hasKou(r + 18)) { Y.push(['삼색동각', 2]); break; }
  if (tiles.every(isYao) && hasHon && tiles.some(t => t < 27)) Y.push(['혼노두', 2]);
  if (drK === 2 && isDragon(pair)) Y.push(['소삼원', 2]);
  if (suits.size === 1) { if (hasHon) Y.push(['혼일색', op(3, 2)]); else Y.push(['청일색', op(6, 5)]); }
  // 부수
  const F = [];
  let fu;
  if (pinfu) { fu = ctx.tsumo ? 20 : 30; F.push(['핑후 ' + (ctx.tsumo ? '쯔모' : '론'), fu]); }
  else {
    fu = 20; F.push(['기본', 20]);
    if (cl && !ctx.tsumo) { fu += 10; F.push(['멘젠 론', 10]); }
    if (ctx.tsumo) { fu += 2; F.push(['쯔모', 2]); }
    sets.forEach(s => { if (s.k === 'shun') return; let v = isYao(s.t) ? 4 : 2; if (!s.open) v *= 2; if (s.k === 'kan') v *= 4; fu += v; F.push([`${s.open ? '밍' : '안'}${s.k === 'kan' ? '깡' : '커'} ${tName(s.t)}`, v]); });
    const py = yakuhaiN(pair, ctx) * 2; if (py) { fu += py; F.push(['머리 ' + tName(pair), py]); }
    if (['kanchan', 'penchan', 'tanki'].includes(wait)) { fu += 2; F.push([{ kanchan: '간짱 대기', penchan: '변짱 대기', tanki: '단기 대기' }[wait], 2]); }
    if (!cl && fu === 20) { fu = 30; F.push(['울은 핑후형 보정', 10]); }
    fu = Math.ceil(fu / 10) * 10;
  }
  return { ym: [], yaku: Y, fu, fuT: F };
}
function pointsOf(han, fu, ym) {
  if (ym) return { base: 8000 * ym, label: ym === 2 ? '더블 역만' : ym > 2 ? ym + '배 역만' : '역만' };
  if (han >= 13) return { base: 8000, label: '헤아림 역만' }; if (han >= 11) return { base: 6000, label: '삼배만' };
  if (han >= 8) return { base: 4000, label: '배만' }; if (han >= 6) return { base: 3000, label: '하네만' }; if (han >= 5) return { base: 2000, label: '만관' };
  const b = fu * Math.pow(2, han + 2); return b >= 2000 ? { base: 2000, label: '만관' } : { base: b, label: '' };
}
function finish(ctx, e) {
  if (e.ym.length) { const n = e.ym.reduce((a, y) => a + y[1], 0); return { ...pointsOf(0, 0, n), han: 13 * n, fu: 0, yaku: e.ym.map(y => [y[0], y[1] > 1 ? '더블 역만' : '역만']), fuT: [], ym: n }; }
  if (!e.yaku.length) return null;
  let han = e.yaku.reduce((a, y) => a + y[1], 0); const yaku = e.yaku.slice();
  if (ctx.doraN) yaku.push(['도라', ctx.doraN]); if (ctx.redN) yaku.push(['적도라', ctx.redN]); if (ctx.uraN) yaku.push(['뒷도라', ctx.uraN]); if (ctx.kitaN) yaku.push(['북 도라', ctx.kitaN]);
  han += ctx.doraN + ctx.redN + ctx.uraN + ctx.kitaN;
  return { ...pointsOf(han, e.fu, 0), han, fu: e.fu, yaku, fuT: e.fuT, ym: 0 };
}
/* ctx: { c(닫힌 패 + 화료패), melds[{k,t}], open, winT, tsumo, riichi, ippatsu, haitei, houtei, rinshan, chankan, tenhou, chiihou, seatW, roundW, doraN, redN, uraN, kitaN } */
function scoreHand(ctx) {
  const c = ctx.c.slice(), fm = ctx.melds.length; if (shanten(c, fm) !== -1) return null;
  const cands = [];
  if (!fm && shKoku(c) === -1) cands.push(finish(ctx, { ym: [c[ctx.winT] === 2 ? ['국사무쌍 13면', 2] : ['국사무쌍', 1]], yaku: [], fu: 0 }));
  if (!fm && shChi(c) === -1) {
    const e = evalChi(ctx); if (e) cands.push(finish(ctx, e));
  }
  const ms = ctx.melds.map(m => m.k === 'chi' ? { k: 'shun', t: m.t, open: true } : m.k === 'pon' ? { k: 'kou', t: m.t, open: true } : { k: 'kan', t: m.t, open: m.k !== 'ankan' });
  decomps(c).forEach(d => {
    const places = [];
    if (d.pair === ctx.winT) places.push({ wait: 'tanki' });
    d.sets.forEach((s, j) => {
      if (s.k === 'kou' && s.t === ctx.winT) places.push({ wait: 'shanpon', j });
      if (s.k === 'shun' && ctx.winT >= s.t && ctx.winT <= s.t + 2) { const pos = ctx.winT - s.t, r = s.t % 9;
        places.push({ wait: pos === 1 ? 'kanchan' : (pos === 0 && r === 6) || (pos === 2 && r === 0) ? 'penchan' : 'ryanmen' }); }
    });
    places.forEach(pl => {
      const sets = d.sets.map((s, j) => ({ ...s, open: pl.wait === 'shanpon' && pl.j === j && !ctx.tsumo })).concat(ms);
      const r = finish(ctx, evalReg(ctx, d.pair, sets, pl.wait)); if (r) cands.push({ ...r, wait: pl.wait });
    });
  });
  const ok = cands.filter(Boolean); if (!ok.length) return null;
  ok.sort((a, b) => b.base - a.base || b.han - a.han || b.fu - a.fu); return ok[0];
}
function evalChi(ctx) {
  const tiles = []; ctx.c.forEach((v, t) => { for (let k = 0; k < v; k++) tiles.push(t); });
  const suits = new Set(tiles.filter(t => t < 27).map(t => Math.floor(t / 9))), hasHon = tiles.some(isHon);
  if (tiles.every(isHon)) return { ym: [['자일색', 1]], yaku: [], fu: 0 };
  if (ctx.tenhou) return { ym: [['천화', 1]], yaku: [], fu: 0 }; if (ctx.chiihou) return { ym: [['지화', 1]], yaku: [], fu: 0 };
  const Y = [['치또이츠', 2]];
  if (ctx.riichi === 2) Y.push(['더블 리치', 2]); else if (ctx.riichi) Y.push(['리치', 1]);
  if (ctx.riichi && ctx.ippatsu) Y.push(['일발', 1]); if (ctx.tsumo) Y.push(['멘젠 쯔모', 1]);
  if (tiles.every(t => !isYao(t))) Y.push(['탕야오', 1]);
  if (tiles.every(isYao)) Y.push(['혼노두', 2]);
  if (ctx.haitei) Y.push(['해저로월', 1]); if (ctx.houtei) Y.push(['하저로어', 1]);
  if (suits.size === 1) Y.push(hasHon ? ['혼일색', 3] : ['청일색', 6]);
  return { ym: [], yaku: Y, fu: 25, fuT: [['치또이츠 고정', 25]] };
}
if (typeof module !== 'undefined') module.exports = { tT, cnt, shanten, waitsOf, scoreHand, doraOf, tName };
