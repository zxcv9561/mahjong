/* MAHJONG — 서버 판정 (Edge Function "mj"와 로컬 테스트가 같이 쓰는 코드)
   필요: mj-core.js · mj-game.js · mj-bot.js 가 먼저 로드되어 있어야 합니다.
   db 인터페이스: findRoom(code) · codeTaken(code) · createRoom(code, uid, G) · loadGame(roomId) · saveGame(id, ver, G) · finish(room, G) · notify(code, ver) */
const SV = { END_MS: 12000, BOT_MS: 650, AUTO_MS: 700, AFK_MS: 20000, AFK_CALL_MS: 10000, SEEN_MS: 15000 };

function svView(G, seat, ver, uid) {
  const V = JSON.parse(JSON.stringify(G)), N = V._net || {}, now = Date.now(), reveal = G.phase === 'end' || G.over;
  V.wall = V.wall.map(() => -1); V.rin = (V.rin || []).map(() => -1);
  V.ind = V.ind.map((x, i) => i % 2 === 0 && i / 2 < G.doraN ? x : -1);
  V.seats.forEach((S, i) => {
    if (i !== seat && !reveal) { S.hand = S.hand.map(() => -1); if (S.drawn != null) S.drawn = -1; }
    const u = N.uids && N.uids[i]; S.online = S.bot ? false : !!u && now - ((N.seen || {})[u] || 0) < SV.SEEN_MS;
  });
  if (V.pend && V.pend.opts) Object.keys(V.pend.opts).forEach(k => { if (+k !== seat && V.pend.opts[k]) V.pend.opts[k] = []; });
  const skins = N.skins || {};
  delete V._net;
  return { G: V, ver, seat, code: N.code, owner: N.owner === uid, skins, next: svNext(G, now) };
}
function svRiichiAuto(G) {
  if (G.phase !== 'discard') return false; const s = G.turn, S = G.seats[s];
  if (S.bot || !S.riichi || S.drawn == null) return false; const O = discardOpts(G, s);
  return !O.tsumo && !(O.ankan || []).length && !O.kita;
}
function svNext(G, now) {
  if (!G || G.over) return null; const W = waitingSeats(G), t = G._t || 0, afk = (G._net && G._net.afk) ?? SV.AFK_MS;
  const c = [];
  if (G.phase === 'end') c.push(t + SV.END_MS);
  if (W.some(s => G.seats[s].bot)) c.push(t + SV.BOT_MS);
  if (svRiichiAuto(G)) c.push(t + SV.AUTO_MS);
  if (afk > 0 && W.some(s => !G.seats[s].bot)) c.push(t + (G.phase === 'call' ? Math.min(afk, SV.AFK_CALL_MS) : afk));
  return c.length ? Math.max(0, Math.min(...c) - now) : null;
}
function svStep(G, now) {
  if (G.over) return false; const W = waitingSeats(G), t = G._t || 0, afk = (G._net && G._net.afk) ?? SV.AFK_MS;
  const run = list => { list.forEach(s => { if (waitingSeats(G).includes(s)) { const S = G.seats[s]; S.level = S.level || 'mid'; const r = act(G, s, botAct(G, s)); if (!r.ok) mjLog(G, `(자동 진행 실패 · ${r.why})`); } }); G._t = now; return true; };
  if (G.phase === 'end' && now - t >= SV.END_MS) { svNextHand(G, now); return true; }
  const bots = W.filter(s => G.seats[s].bot);
  if (bots.length && now - t >= SV.BOT_MS) return run(bots);
  if (svRiichiAuto(G) && now - t >= SV.AUTO_MS) { const s = G.turn; act(G, s, { t: 'discard', id: G.seats[s].drawn }); G._t = now; return true; }
  const hum = W.filter(s => !G.seats[s].bot);
  if (afk > 0 && hum.length && now - t >= (G.phase === 'call' ? Math.min(afk, SV.AFK_CALL_MS) : afk)) { hum.forEach(s => mjLog(G, `${G.seats[s].name} 시간 초과 · 자동 진행`)); return run(hum); }
  return false;
}
function svNextHand(G, now) { act(G, 0, { t: 'next' }); G._net.ready = {}; G._t = now; }
function svReady(G, seat, now) {   // 국 종료 화면: 접속 중인 사람이 모두 "다음"을 누르면 진행 (12초 지나면 자동)
  const N = G._net; N.ready = N.ready || {}; N.ready[seat] = true;
  const need = G.seats.map((S, i) => i).filter(i => !G.seats[i].bot && N.uids[i] && now - (N.seen[N.uids[i]] || 0) < SV.SEEN_MS);
  if (need.every(i => N.ready[i])) svNextHand(G, now);
}
const svSeatOf = (G, uid) => { const u = (G._net || {}).uids || {}; const k = Object.keys(u).find(i => u[i] === uid); return k == null ? null : +k; };

async function svHandle(db, uid, body) {
  const op = body && body.op, now = Date.now();
  if (op === 'create') {
    const p = (body.players || []).slice(0, body.n === 3 ? 3 : 4); if (p.length < 3) return { err: '자리 정보가 없습니다' };
    const mine = p.findIndex(x => !x.bot && !x.remote); if (mine < 0) return { err: '내 자리가 없습니다' };
    const players = p.map(x => ({ name: String(x.name || '').slice(0, 10) || '참가자', char: x.char || null, bot: !!x.bot, level: ['low', 'mid', 'high'].includes(x.level) ? x.level : 'mid', remote: !x.bot }));
    let code = ''; for (let i = 0; i < 20 && !code; i++) { const c = String(1000 + Math.floor(Math.random() * 9000)); if (!(await db.codeTaken(c))) code = c; }
    if (!code) return { err: '방 코드를 만들지 못했습니다. 다시 시도하세요' };
    const rk = !!body.ranked; const G = newGame(rk ? { n: 4, len: 'han', aka: true, players } : { n: body.n, len: body.len, aka: body.aka, players }); if (rk) G.ranked = true;
    const afk = body.afk === 0 ? 0 : Math.max(5, Math.min(120, +body.afk || 20)) * 1000;
    G._t = now; G._net = { code, owner: uid, uids: { [mine]: uid }, skins: { [mine]: body.skin || {} }, seen: { [uid]: now }, afk };
    const g = await db.createRoom(code, uid, G); await db.notify(code, g.ver);
    return svView(G, mine, g.ver, uid);
  }
  const code = String(body.code || ''); if (!/^\d{4}$/.test(code)) return { err: '방 코드가 올바르지 않습니다' };
  const room = await db.findRoom(code); if (!room) return { err: '해당 코드의 방이 없습니다', gone: true };
  for (let tries = 0; tries < 5; tries++) {
    const g = await db.loadGame(room.id); if (!g) return { err: '게임을 찾을 수 없습니다', gone: true };
    const G = g.state, N = G._net; let seat = svSeatOf(G, uid), changed = false, err = null;
    if (op === 'join') {
      if (seat == null) {
        if (G.over) return { err: '이미 끝난 방입니다', gone: true };
        const used = Object.keys(N.uids).map(Number); seat = G.seats.findIndex((S, i) => S.remote && !used.includes(i));
        if (seat < 0) return { err: '빈 참가자 자리가 없습니다' };
        N.uids[seat] = uid; const S = G.seats[seat]; S.name = String(body.name || S.name).slice(0, 10); if (body.char) S.char = body.char; mjLog(G, `${S.name} 입장`);
      }
      N.skins[seat] = body.skin || N.skins[seat] || {}; changed = true;
    }
    if (seat == null) return { err: '이 방의 참가자가 아닙니다', gone: true };
    const seenOld = now - (N.seen[uid] || 0) > 5000; N.seen[uid] = now; if (seenOld) changed = true;
    if (op === 'act' && body.a && body.a.t === 'next') { if (G.phase !== 'end') err = '국이 끝나지 않음'; else { svReady(G, seat, now); changed = true; } }
    else if (op === 'act') { const r = act(G, seat, body.a || {}); if (!r.ok) err = r.why; else { G._t = now; changed = true; } }
    else if (op === 'bot') {
      if (N.owner !== uid) return { err: '방장만 바꿀 수 있습니다' };
      const s = +body.seat, S = G.seats[s]; if (!S || S.bot || N.uids[s]) return { err: '바꿀 수 없는 자리입니다' };
      S.remote = false; S.bot = true; S.level = 'mid'; S.name = S.name.replace('참가자', '봇'); G._t = now; changed = true;
    }
    if (svStep(G, now)) changed = true;
    if (!changed) return svView(G, seat, g.ver, uid);
    const ver = await db.saveGame(g.id, g.ver, G);
    if (ver == null) continue;                      // 다른 요청과 겹침 → 다시 읽고 재시도
    if (G.over && room.status !== 'done') await db.finish(room, g.id, G);
    await db.notify(code, ver);
    const v = svView(G, seat, ver, uid); if (err) v.err = err; return v;
  }
  return { err: '요청이 몰려 처리하지 못했습니다. 다시 시도하세요' };
}
