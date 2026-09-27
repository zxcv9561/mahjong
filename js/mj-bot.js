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
function threatOf(G, o) {
  const O = G.seats[o]; if (O.riichi) return { w: 1, only: null, why: '리치' };
  const n = O.melds.length; if (n < 2) return null;
  const su = [...new Set(O.melds.map(x => x.t < 27 ? Math.floor(x.t / 9) : 3))], num = su.filter(x => x < 3);
  const flush = num.length <= 1, yh = O.melds.some(x => x.k !== 'chi' && (x.t >= 31 || x.t === seatW(G, o) || x.t === 27 + G.wind));
  const w = n >= 3 ? 0.9 : flush || yh ? 0.7 : 0.45;
  return { w, only: flush ? (num.length ? num[0] : 'hon') : null, why: flush ? (num.length ? ['만수', '통수', '삭수'][num[0]] + ' 혼일색 · 청일색 의심' : '자패 위주') : n + '副露' };
}
function danger(G, s, t, ro) {
  let d = 0; const vis = visibleCounts(G, s);
  G.seats.forEach((O, o) => { if (o === s || (ro && !O.riichi)) return; const th = threatOf(G, o); if (!th) return;
    const ri = O.river.findIndex(r => r.r), gen = new Set(O.river.map(r => tT(r.id)));
    if (O.riichi) G.seats.forEach(X => X.river.forEach(r => { if (O.rN && r.n > O.rN) gen.add(tT(r.id)); }));
    let v; if (gen.has(t)) v = 0;
    else if (isHon(t)) v = vis[t] >= 3 ? 0.5 : vis[t] === 2 ? 2 : 2.5;
    else { const r = t % 9, b = t - r, kab = x => x >= 0 && x <= 8 && vis[b + x] >= 4, L = r >= 3, R = r <= 5;
      const sL = !L || gen.has(b + r - 3) || kab(r - 1) || kab(r - 2), sR = !R || gen.has(b + r + 3) || kab(r + 1) || kab(r + 2);
      v = sL && sR ? 2 : L && R && (sL || sR) ? 3.5 : (r === 0 || r === 8) ? 4 : 6; }
    if (th.only != null && v > 0) { if (th.only === 'hon' ? !isHon(t) : !isHon(t) && Math.floor(t / 9) !== th.only) v *= 0.08; }
    if (O.riichi && ri < 0) v *= 0.6; v *= th.w; d = Math.max(d, v); });
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
    return { t, sh, u, iso, dz: lv === 'low' ? 0 : danger(G, s, t, lv === 'mid') }; });
  const best = Math.min(...cand.map(x => x.sh));
  /* 난이도별 수비 · 약함: 수비 안 함 · 보통: 리치만 보고, 2샹텐 이상이면 현물 위주로 접음 · 강함: 리치 + 울음 상대까지 보고, 샹텐에 따라 공격/수비 저울질 */
  const threat = lv !== 'low' && G.seats.some((O, o) => o !== s && (lv === 'mid' ? O.riichi : threatOf(G, o)));
  let pool;
  if (threat && lv === 'mid' && best >= 2) pool = cand.slice().sort((a, b) => (a.dz > 0) - (b.dz > 0) || a.sh - b.sh || b.u - a.u || a.dz - b.dz);
  else if (threat && lv === 'high') { const k = best === 0 ? 0.6 : best === 1 ? 2.2 : 6, sc = x => (x.sh - best) * 8 - Math.min(x.u, 40) * 0.12 + x.dz * k - x.iso * 0.1;
    pool = cand.slice().sort((a, b) => sc(a) - sc(b)); }
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
