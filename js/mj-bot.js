/* MAHJONG — 봇 (약함 low · 보통 mid · 강함 high) */
function botYakuRoute(G, s, addT) {
  const S = G.seats[s], sw = seatW(G, s), rw = 27 + G.wind, yh = t => isDragon(t) || t === sw || t === rw;
  if (S.melds.some(m => m.k !== 'chi' && yh(m.t))) return true;
  if (addT != null && yh(addT) && cnt(S.hand)[addT] >= 2) return true;
  const tiles = S.hand.map(tT).concat(...S.melds.map(m => m.ids.map(tT))); if (addT != null) tiles.push(addT);
  if (tiles.filter(isYao).length <= 1 && S.melds.every(m => m.ids.every(i => !isYao(tT(i))))) return true;
  const suits = [0, 1, 2].map(k => tiles.filter(t => t < 27 && Math.floor(t / 9) === k).length), hon = tiles.filter(isHon).length, mx = Math.max(...suits);
  if (mx + hon >= tiles.length - 1 && S.melds.every(m => m.t >= 27 || Math.floor(m.t / 9) === suits.indexOf(mx))) return true;
  return false;
}
function danger(G, s, t) {
  let d = 0;
  G.seats.forEach((O, o) => { if (o === s || !O.riichi) return;
    const ri = O.river.findIndex(r => r.r), gen = new Set(O.river.map(r => tT(r.id)));
    G.seats.forEach(X => X.river.forEach(r => { if (O.rN && r.n > O.rN) gen.add(tT(r.id)); }));
    let v; if (gen.has(t)) v = 0;
    else if (isHon(t)) v = visibleCounts(G, s)[t] >= 3 ? 0.5 : 2.5;
    else { const r = t % 9, b = t - r, suji = (r - 3 >= 0 && gen.has(b + r - 3)) + (r + 3 <= 8 && gen.has(b + r + 3)), edge = r < 3 || r > 5;
      v = suji >= (edge ? 1 : 2) ? 2 : suji ? 3.5 : (r === 0 || r === 8) ? 4 : 6; }
    if (ri < 0) v *= 0.6; d = Math.max(d, v); });
  return d;
}
function ukeire(G, s, c, fm, sh) {
  const vis = visibleCounts(G, s), al = allowedT(G); let n = 0;
  for (let t = 0; t < 34; t++) { if (!al(t) || c[t] >= 4) continue; c[t]++; if (shanten(c, fm) < sh) n += Math.max(0, 4 - vis[t]); c[t]--; }
  return n;
}
function botDiscard(G, s) {
  const S = G.seats[s], lv = S.level, c = cnt(S.hand), fm = S.melds.length, types = [...new Set(S.hand.map(tT))].filter(t => !(S.kuikae || []).includes(t));
  const sw = seatW(G, s), rw = 27 + G.wind;
  const cand = types.map(t => { c[t]--; const sh = shanten(c, fm); const u = lv === 'low' ? 0 : ukeire(G, s, c, fm, sh); c[t]++;
    const iso = isHon(t) ? (c[t] === 1 ? (isDragon(t) || t === sw || t === rw ? 1.5 : 3) : 0) : (t % 9 === 0 || t % 9 === 8 ? 1 : 0);
    return { t, sh, u, iso, dz: danger(G, s, t) }; });
  const best = Math.min(...cand.map(x => x.sh));
  const threat = G.seats.some((O, o) => o !== s && O.riichi);
  let pool = cand;
  if (threat && ((lv === 'high' && best >= 1) || (lv === 'mid' && best >= 2))) pool = cand.slice().sort((a, b) => a.dz - b.dz || a.sh - b.sh || b.u - a.u);
  else pool = cand.slice().sort((a, b) => a.sh - b.sh || b.u - a.u || b.iso - a.iso);
  let pick = pool[0];
  if (lv === 'low' && Math.random() < 0.2) pick = cand[Math.floor(Math.random() * cand.length)];
  const ids = S.hand.filter(i => tT(i) === pick.t).sort((a, b) => (isRed(a) - isRed(b)) || a - b);
  return S.drawn != null && tT(S.drawn) === pick.t && !isRed(S.drawn) ? S.drawn : ids[0];
}
function botCall(G, s, opts) {
  const S = G.seats[s], lv = S.level, t = tT(G.last.id), c = cnt(S.hand), fm = S.melds.length, sh = shanten(c, fm);
  const sw = seatW(G, s), rw = 27 + G.wind, yh = isDragon(t) || t === sw || t === rw;
  if (lv === 'low') { if (opts.some(o => o.t === 'pon') && isDragon(t) && Math.random() < 0.6) return { t: 'pon' }; return null; }
  const pon = opts.find(o => o.t === 'pon');
  if (pon) { const c2 = c.slice(); c2[t] -= 2; const s2 = shanten(c2, fm + 1);
    if (yh && s2 <= sh) return { t: 'pon' };
    if (s2 < sh && botYakuRoute(G, s, t) && (fm > 0 || lv === 'high')) return { t: 'pon' }; }
  const chis = opts.filter(o => o.t === 'chi');
  for (const o of chis) { const c2 = c.slice(); o.ids.forEach(i => c2[tT(i)]--); const s2 = shanten(c2, fm + 1);
    if (s2 < sh && botYakuRoute(G, s, t) && (fm > 0 || (lv === 'high' && sh <= 2))) return o; }
  return null;
}
function botAct(G, s) {
  const S = G.seats[s], lv = S.level;
  if (G.phase === 'call') { const o = G.pend.opts[s]; if (o.some(x => x.t === 'ron')) return { t: 'ron' }; if (G.pend.kind === 'chankan') return { t: 'pass' }; return botCall(G, s, o) || { t: 'pass' }; }
  if (G.phase !== 'discard') return null;
  const O = discardOpts(G, s);
  if (O.kyuushu && shKoku(cnt(S.hand)) > 3) return { t: 'kyuushu' };
  if (O.tsumo) return { t: 'tsumo' };
  if (O.kita) return { t: 'kita' };
  if (O.ankan.length && lv !== 'low') { const t = O.ankan[0], c = cnt(S.hand), sh = shanten(c, S.melds.length); c[t] -= 4; if (shanten(c, S.melds.length + 1) <= sh) return { t: 'ankan', type: t }; }
  if (O.kakan.length && lv !== 'low') return { t: 'kakan', type: O.kakan[0] };
  if (S.riichi) return { t: 'discard', id: S.drawn };
  const id = botDiscard(G, s);
  if (O.riichi.includes(tT(id)) && (lv !== 'low' || Math.random() < 0.5)) return { t: 'discard', id, riichi: true };
  return { t: 'discard', id };
}
if (typeof module !== 'undefined') module.exports = { botAct };
