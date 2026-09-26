/* MAHJONG — 게임 진행 (호스트가 진행하는 순수 상태 기계)
   phase: 'discard'(차례 플레이어가 버림) · 'call'(울기/론 응답 대기) · 'end'(국 결과) · 'over'(게임 종료) */
const START_PTS = { 4: 25000, 3: 35000 };
const ok = (x = {}) => ({ ok: true, ...x }), err = why => ({ ok: false, why });
function shuffleArr(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function allowedT(G) { return t => !(G.n === 3 && t >= 1 && t <= 7); }
function newGame(cfg) {
  const n = cfg.n === 3 ? 3 : 4;
  const G = { v: 1, n, len: cfg.len === 'ton' ? 'ton' : 'han', aka: cfg.aka !== false,
    seats: cfg.players.slice(0, n).map(p => ({ name: p.name, bot: !!p.bot, level: p.level || 'mid', remote: !!p.remote, char: p.char || null, pts: START_PTS[n] })),
    wind: 0, kyoku: 0, honba: 0, sticks: 0, over: false, log: [], handNo: 0, gid: Math.random().toString(36).slice(2, 10) };
  startHand(G); return G;
}
function mjLog(G, text) { G.log.push({ h: G.handNo, text }); if (G.log.length > 200) G.log.shift(); }
function seatW(G, s) { return 27 + (s - G.dealer + G.n) % G.n; }
function roundLabel(G) { return `${HONOR_K[G.wind]}${G.kyoku + 1}국`; }
function sortHand(S) { S.hand.sort((a, b) => a - b); }
function startHand(G) {
  const w = shuffleArr([...Array(136).keys()].filter(i => allowedT(G)(tT(i))));
  G.ind = w.splice(0, 10); G.rin = w.splice(0, 4); G.wall = w; G.doraN = 1; G.kans = 0; G.anyCall = false;
  G.dealer = G.kyoku; G.handNo++;
  G.seats.forEach(S => Object.assign(S, { hand: [], melds: [], river: [], riichi: 0, rPend: 0, ippatsu: false, furiTmp: false, furiR: false, kita: [], nDisc: 0, drawn: null, kuikae: null }));
  for (let r = 0; r < 13; r++) for (let k = 0; k < G.n; k++) G.seats[(G.dealer + k) % G.n].hand.push(G.wall.pop());
  G.seats.forEach(sortHand);
  G.pend = null; G.result = null; G.last = null; G.flags = {};
  mjLog(G, `── ${roundLabel(G)} ${G.honba}본장 · 친 ${G.seats[G.dealer].name}`);
  G.turn = G.dealer; draw(G, G.dealer, false); G.phase = 'discard';
}
function draw(G, s, rin) {
  const S = G.seats[s]; let id;
  if (rin) { id = G.rin.shift(); G.rin.push(G.wall.shift()); } else id = G.wall.pop();
  S.hand.push(id); S.drawn = id; G.flags = { rinshan: !!rin, haitei: !rin && G.wall.length === 0 };
}
function visibleCounts(G, s) {
  const c = new Array(34).fill(0), add = id => c[tT(id)]++;
  G.seats[s].hand.forEach(add);
  G.seats.forEach(S => { S.river.forEach(r => { if (!r.taken) add(r.id); }); S.melds.forEach(m => m.ids.forEach(add)); S.kita.forEach(add); });
  for (let k = 0; k < G.doraN; k++) add(G.ind[2 * k]);
  return c;
}
function winCtx(G, s, winId, tsumo, chankan) {
  const S = G.seats[s], ids = tsumo ? S.hand.slice() : S.hand.concat([winId]);
  const all = ids.concat(...S.melds.map(m => m.ids)), sanma = G.n === 3;
  const doraT = [], uraT = []; for (let k = 0; k < G.doraN; k++) { doraT.push(doraOf(tT(G.ind[2 * k]), sanma)); uraT.push(doraOf(tT(G.ind[2 * k + 1]), sanma)); }
  const n = (arr, t) => arr.filter(x => x === t).length;
  const doraN = all.reduce((a, i) => a + n(doraT, tT(i)), 0), uraN = S.riichi ? all.reduce((a, i) => a + n(uraT, tT(i)), 0) + S.kita.length * n(uraT, 30) : 0;
  return { c: cnt(ids), melds: S.melds.map(m => ({ k: m.k, t: m.t })), open: S.melds.some(m => m.k !== 'ankan'), winT: tT(winId), tsumo,
    riichi: S.riichi, ippatsu: S.ippatsu, haitei: tsumo && G.flags.haitei, houtei: !tsumo && !chankan && G.wall.length === 0, rinshan: tsumo && G.flags.rinshan, chankan: !!chankan,
    tenhou: tsumo && s === G.dealer && S.nDisc === 0 && !G.anyCall, chiihou: tsumo && s !== G.dealer && S.nDisc === 0 && !G.anyCall,
    seatW: seatW(G, s), roundW: 27 + G.wind, doraN, redN: G.aka ? all.filter(isRed).length : 0, uraN, kitaN: S.kita.length * (1 + n(doraT, 30)) };
}
function isFuriten(G, s) {
  const S = G.seats[s]; if (S.furiTmp || S.furiR) return true;
  const w = waitsOf(cnt(S.hand), S.melds.length, allowedT(G)); return S.river.some(r => w.includes(tT(r.id)));
}
function canTsumo(G, s) { const S = G.seats[s]; if (S.drawn == null) return null; return scoreHand(winCtx(G, s, S.drawn, true)); }
function canRon(G, s, id, chankan) { const S = G.seats[s]; const c = cnt(S.hand); c[tT(id)]++; if (shanten(c, S.melds.length) !== -1) return null; if (isFuriten(G, s)) return null; return scoreHand(winCtx(G, s, id, false, chankan)); }
function riichiOpts(G, s) {
  const S = G.seats[s]; if (S.riichi || S.melds.some(m => m.k !== 'ankan') || S.pts < 1000 || G.wall.length < G.n) return [];
  const c = cnt(S.hand), out = [];
  for (let t = 0; t < 34; t++) { if (!c[t]) continue; c[t]--; if (shanten(c, S.melds.length) === 0) out.push(t); c[t]++; }
  return out;
}
function discardOpts(G, s) {
  const S = G.seats[s], c = cnt(S.hand), o = { kyuushu: S.nDisc === 0 && !G.anyCall && S.drawn != null && new Set(S.hand.map(tT).filter(isYao)).size >= 9, tsumo: !!canTsumo(G, s), riichi: riichiOpts(G, s), ankan: [], kakan: [], kita: false };
  if (G.wall.length > 0 && G.kans < 4 && !S.riichi) {
    for (let t = 0; t < 34; t++) if (c[t] === 4) o.ankan.push(t);
    S.melds.forEach(m => { if (m.k === 'pon' && c[m.t]) o.kakan.push(m.t); });
  }
  if (G.n === 3 && c[30] && G.wall.length > 0) o.kita = true;
  return o;
}
function chiCombos(hand, t) {
  if (t >= 27) return []; const r = t % 9, out = [], pick = tt => hand.filter(i => tT(i) === tt).sort((a, b) => (isRed(a) - isRed(b)) || a - b)[0];
  [[-2, -1], [-1, 1], [1, 2]].forEach(([a, b]) => { if (r + a < 0 || r + b > 8) return; const x = pick(t + a), y = pick(t + b); if (x != null && y != null) out.push([x, y]); });
  return out;
}
/* 대기 중인 좌석 (UI·봇 구동용) */
function waitingSeats(G) {
  if (!G || G.over) return []; if (G.phase === 'discard') return [G.turn];
  if (G.phase === 'call') return Object.keys(G.pend.opts).map(Number).filter(k => !G.pend.resp[k]); return [];
}
function act(G, s, a) {
  const S = G.seats[s]; if (!a) return err('행동 없음');
  if (a.t === 'next') { if (G.phase !== 'end') return err('국이 끝나지 않음'); nextHand(G); return ok(); }
  if (G.phase === 'call') {
    const o = G.pend.opts[s]; if (!o || G.pend.resp[s]) return err('응답할 수 없음');
    if (a.t !== 'pass' && !o.some(x => x.t === a.t && (a.t !== 'chi' || JSON.stringify(x.ids) === JSON.stringify(a.ids)))) return err('불가능한 울기');
    G.pend.resp[s] = a; if (waitingSeats(G).length === 0) resolveCall(G); return ok();
  }
  if (G.phase !== 'discard' || s !== G.turn) return err('차례가 아님');
  const O = discardOpts(G, s);
  if (a.t === 'tsumo') { const r = canTsumo(G, s); if (!r) return err('화료 불가'); win(G, s, null, r, S.drawn); return ok(); }
  if (a.t === 'kyuushu') { if (!O.kyuushu) return err('구종구패 아님'); abort(G, '구종구패', s); return ok(); }
  if (a.t === 'kita') { if (!O.kita) return err('북 없음'); const id = S.hand.find(i => tT(i) === 30); S.hand.splice(S.hand.indexOf(id), 1); S.kita.push(id); mjLog(G, `${S.name} · 북 빼기`); draw(G, s, true); sortHand(S); return ok(); }
  if (a.t === 'ankan') { if (!O.ankan.includes(a.type)) return err('깡 불가'); const ids = S.hand.filter(i => tT(i) === a.type); S.hand = S.hand.filter(i => tT(i) !== a.type);
    S.melds.push({ k: 'ankan', t: a.type, ids }); kanAfter(G, s, '안깡'); return ok(); }
  if (a.t === 'kakan') { if (!O.kakan.includes(a.type)) return err('가깡 불가'); const id = S.hand.find(i => tT(i) === a.type); S.hand.splice(S.hand.indexOf(id), 1);
    const m = S.melds.find(x => x.k === 'pon' && x.t === a.type); m.k = 'kakan'; m.ids.push(id);
    const opts = {}; G.seats.forEach((X, k) => { if (k !== s && canRon(G, k, id, true)) opts[k] = [{ t: 'ron' }]; });
    G.last = { s, id, kakan: true };
    if (Object.keys(opts).length) { G.phase = 'call'; G.pend = { opts, resp: {}, kind: 'chankan' }; return ok(); }
    kanAfter(G, s, '가깡'); return ok(); }
  if (a.t === 'discard') {
    const id = a.id; if (!S.hand.includes(id)) return err('없는 패');
    if (S.riichi && id !== S.drawn) return err('리치 중에는 뽑은 패만');
    if (S.kuikae && S.kuikae.includes(tT(id))) return err('울어 온 패와 같은 패는 바로 버릴 수 없음');
    if (a.riichi && !O.riichi.includes(tT(id))) return err('리치 불가');
    S.hand.splice(S.hand.indexOf(id), 1); sortHand(S);
    G.dn = (G.dn || 0) + 1; S.river.push({ id, r: !!a.riichi, tg: id === S.drawn, n: G.dn });
    if (S.ippatsu) S.ippatsu = false;
    if (a.riichi) S.rPend = (S.nDisc === 0 && !G.anyCall) ? 2 : 1;
    S.nDisc++; S.furiTmp = false; S.drawn = null; S.kuikae = null;
    G.last = { s, id }; afterDiscard(G); return ok();
  }
  return err('알 수 없는 행동');
}
function kanAfter(G, s, label) {
  const S = G.seats[s]; G.kans++; G.doraN = Math.min(5, G.doraN + 1); G.anyCall = true; G.seats.forEach(x => x.ippatsu = false);
  mjLog(G, `${S.name} · ${label} ${tName(S.melds[S.melds.length - 1].t)} · 새 도라 표시패`);
  G.pend = null; G.phase = 'discard'; G.turn = s; draw(G, s, true); sortHand(S);
}
function afterDiscard(G) {
  const { s: d, id } = G.last, t = tT(id), opts = {};
  if (G.n === 4 && !G.anyCall && isWind(t) && G.seats.every(S => S.river.length === 1 && tT(S.river[0].id) === t)) { settleRiichi(G, d); return abort(G, '사풍연타'); }
  G.seats.forEach((S, k) => { if (k === d) return; const o = [];
    if (canRon(G, k, id)) o.push({ t: 'ron' });
    if (!S.riichi && G.wall.length > 0) { const c = cnt(S.hand);
      if (c[t] >= 2) o.push({ t: 'pon' }); if (c[t] >= 3 && G.kans < 4) o.push({ t: 'minkan' });
      if (G.n === 4 && k === (d + 1) % G.n) chiCombos(S.hand, t).forEach(ids => o.push({ t: 'chi', ids })); }
    if (o.length) opts[k] = o; });
  if (!Object.keys(opts).length) { settleRiichi(G, d); return nextTurn(G); }
  G.phase = 'call'; G.pend = { opts, resp: {}, kind: 'discard' };
}
function settleRiichi(G, d) {
  const S = G.seats[d]; if (!S.rPend) return;
  S.riichi = S.rPend; S.rPend = 0; S.rN = G.dn; S.ippatsu = true; S.pts -= 1000; G.sticks++;
  mjLog(G, `${S.name} · ${S.riichi === 2 ? '더블 ' : ''}리치`);
}
function resolveCall(G) {
  const R = G.pend.resp, d = G.last.s, order = [...Array(G.n - 1).keys()].map(k => (d + k + 1) % G.n), kind = G.pend.kind;
  const ron = order.filter(k => R[k] && R[k].t === 'ron');
  if (ron.length) { G.seats[d].rPend = 0; G.pend = null; if (ron.length === 3) return abort(G, '삼가화');
    const id = G.last.id, rs = ron.map(k => [k, canRon(G, k, id, kind === 'chankan')]); rs.forEach(([k, r], j) => win(G, k, d, r, id, j > 0)); return; }
  Object.keys(G.pend.opts).forEach(k => { if (G.pend.opts[k].some(o => o.t === 'ron')) { const X = G.seats[k]; X.furiTmp = true; if (X.riichi) X.furiR = true; } });
  if (kind === 'chankan') { G.pend = null; return kanAfter(G, d, '가깡'); }
  settleRiichi(G, d);
  if (allRiichi(G)) { G.pend = null; return abort(G, '사가 리치'); }
  if (kanAbort(G)) { G.pend = null; return abort(G, '사깡 산료'); }
  const pk = order.find(k => R[k] && (R[k].t === 'pon' || R[k].t === 'minkan'));
  if (pk != null) return doCall(G, pk, R[pk]);
  const ck = order.find(k => R[k] && R[k].t === 'chi');
  if (ck != null) return doCall(G, ck, R[ck]);
  G.pend = null; nextTurn(G);
}
function doCall(G, k, r) {
  const S = G.seats[k], id = G.last.id, t = tT(id), D = G.seats[G.last.s];
  D.river[D.river.length - 1].taken = true; G.anyCall = true; G.seats.forEach(x => x.ippatsu = false); G.pend = null;
  const take = n => { const ids = S.hand.filter(i => tT(i) === t).sort((a, b) => (isRed(a) - isRed(b)) || a - b).slice(0, n); S.hand = S.hand.filter(i => !ids.includes(i)); return ids; };
  if (r.t === 'chi') { S.hand = S.hand.filter(i => !r.ids.includes(i)); const ids = [...r.ids, id].sort((a, b) => a - b); S.melds.push({ k: 'chi', t: Math.min(...ids.map(tT)), ids, from: G.last.s, called: id }); S.kuikae = [t]; mjLog(G, `${S.name} · 치 ${tName(t)}`); }
  else if (r.t === 'pon') { S.melds.push({ k: 'pon', t, ids: [...take(2), id], from: G.last.s, called: id }); S.kuikae = [t]; mjLog(G, `${S.name} · 퐁 ${tName(t)}`); }
  else { S.melds.push({ k: 'minkan', t, ids: [...take(3), id], from: G.last.s, called: id }); G.turn = k; return kanAfter(G, k, '밍깡'); }
  G.turn = k; G.phase = 'discard'; S.drawn = null; sortHand(S);
}
function nextTurn(G) {
  G.pend = null; if (allRiichi(G)) return abort(G, '사가 리치'); if (kanAbort(G)) return abort(G, '사깡 산료'); const nx = (G.last.s + 1) % G.n;
  if (G.wall.length === 0) return exhaustive(G);
  G.turn = nx; draw(G, nx, false); G.phase = 'discard';
}
function payWin(G, k, from, base) {
  const pay = G.seats.map(() => 0), up = x => Math.ceil(x / 100) * 100, isD = k === G.dealer;
  if (from == null) G.seats.forEach((_, i) => { if (i === k) return; const v = up(base * (isD || i === G.dealer ? 2 : 1)) + 100 * G.honba; pay[i] -= v; pay[k] += v; });
  else { const v = up(base * (isD ? 6 : 4)) + 300 * G.honba; pay[from] -= v; pay[k] += v; }
  pay[k] += G.sticks * 1000; return pay;
}
const allRiichi = G => G.n === 4 && G.seats.every(S => S.riichi);
const kanAbort = G => G.kans === 4 && G.seats.filter(S => S.melds.some(m => m.k.includes('kan'))).length > 1;
function abort(G, why, s) { G.pend = null; G.result = { type: 'abort', why, who: s, hands: G.seats.map(S => S.hand.slice()) }; G.renchan = true; G.phase = 'end'; mjLog(G, `도중 유국 · ${why}`); }
function win(G, k, from, r, winId, extra) {
  const S = G.seats[k], pay = payWin(G, k, from, r.base);
  const stick = G.sticks; G.sticks = 0; pay.forEach((v, i) => G.seats[i].pts += v);
  const ura = S.riichi ? [...Array(G.doraN).keys()].map(j => G.ind[2 * j + 1]) : [];
  const res = { type: 'win', k, from, tsumo: from == null, r, pay, stick, honba: G.honba, winId, ura,
    hand: from == null ? S.hand.slice() : S.hand.concat([winId]), melds: S.melds.map(m => ({ ...m })), kita: S.kita.slice() };
  if (extra) { (G.result.more = G.result.more || []).push(res); G.renchan = G.renchan || k === G.dealer; } else { G.result = res; G.renchan = k === G.dealer; }
  G.phase = 'end';
  mjLog(G, `${S.name} · ${from == null ? '쯔모' : '론 ← ' + G.seats[from].name} · ${r.ym ? r.label : r.han + '판 ' + r.fu + '부'} · +${pay[k]}`);
}
function exhaustive(G) {
  const ten = G.seats.map(S => shanten(cnt(S.hand), S.melds.length) === 0), nT = ten.filter(Boolean).length, total = G.n === 4 ? 3000 : 2000;
  const pay = G.seats.map(() => 0), nag = G.seats.map((_, i) => i).filter(i => { const S = G.seats[i]; return S.river.length && S.river.every(r => isYao(tT(r.id)) && !r.taken); });
  if (nag.length) nag.forEach(k => G.seats.forEach((_, i) => { if (i === k) return; const v = 2000 * (k === G.dealer || i === G.dealer ? 2 : 1); pay[i] -= v; pay[k] += v; }));
  else if (nT > 0 && nT < G.n) ten.forEach((t, i) => pay[i] = t ? total / nT : -total / (G.n - nT));
  pay.forEach((v, i) => G.seats[i].pts += v);
  G.result = { type: 'draw', ten, pay, nag, hands: G.seats.map(S => S.hand.slice()) }; G.renchan = ten[G.dealer]; G.phase = 'end';
  if (nag.length) mjLog(G, `유국 만관 · ${nag.map(i => G.seats[i].name).join(', ')}`);
  mjLog(G, `유국 · 텐파이 ${G.seats.filter((_, i) => ten[i]).map(S => S.name).join(', ') || '없음'}`);
}
function nextHand(G) {
  const R = G.result; if (R.type === 'win' && !G.renchan) G.honba = 0; else G.honba++;
  if (!G.renchan) { G.kyoku++; if (G.kyoku >= G.n) { G.kyoku = 0; G.wind++; } }
  const maxW = G.len === 'ton' ? 1 : 2;
  if (G.seats.some(S => S.pts < 0) || G.wind >= maxW) return endGame(G);
  startHand(G);
}
function endGame(G) {
  const order = G.seats.map((S, i) => i).sort((a, b) => G.seats[b].pts - G.seats[a].pts || a - b);
  if (G.sticks) { G.seats[order[0]].pts += G.sticks * 1000; G.sticks = 0; }
  G.over = true; G.phase = 'over'; G.rank = order; mjLog(G, `게임 종료 · 1위 ${G.seats[order[0]].name}`);
}
if (typeof module !== 'undefined') module.exports = { newGame, act, waitingSeats, discardOpts };
