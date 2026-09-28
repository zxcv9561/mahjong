/* MAHJONG — 온라인 방 (2단계 · 서버 판정)
   판정 · 봇 · 시간 초과 자동 진행은 Supabase Edge Function "mj"가 합니다. 브라우저는 행동을 보내고, 자기 시점의 상태만 받습니다.
   · 방 만들기: 로그인 후 설정에서 자리 일부를 "온라인 참가자"로 두고 시작 → 서버에 방이 생기고 4자리 코드 표시
   · 참가: 코드 입력 → 빈 참가자 자리. 끊겼다 다시 로그인하면 같은 자리로 자동 복귀 */
(() => {
  const NET = window.NET = { role: null, seat: null, code: '', ch: null, ver: -1, owner: false, busy: false, again: false, tt: null, conns: [] };
  const LAST = 'mj-last-room';
  function need() { if (!CLOUD.sb || !CLOUD.user) { toast('온라인 방은 로그인 후 사용할 수 있습니다'); CLOUD.showLogin(); return false; } return true; }
  async function call(op, body = {}) {
    if (op === 'tick' && NET.busy) { NET.again = true; return null; }
    NET.busy = true;
    try {
      let ses = (await CLOUD.sb.auth.getSession()).data.session; if (ses && ses.expires_at * 1000 < Date.now() + 60000) ses = (await CLOUD.sb.auth.refreshSession()).data.session || ses;
      if (!ses) { toast('로그인이 만료되었습니다 · 다시 로그인하세요'); CLOUD.showLogin && CLOUD.showLogin(); return null; }
      const { data, error } = await CLOUD.sb.functions.invoke('mj', { body: Object.assign({ op, code: NET.code }, body), headers: { Authorization: 'Bearer ' + ses.access_token } });
      let d = data;
      if (error) { try { d = await error.context.json(); } catch (e) { d = { err: '서버에 연결하지 못했습니다' }; } if (d && !d.err) d.err = `서버 오류 ${error.context && error.context.status || ''} · ${d.code || ''} ${d.message || ''}`.trim(); }
      if (d && d.err && !(op === 'tick' && d.gone === undefined && !d.G)) toast(d.err);
      if (d && d.gone && op !== 'create') { if (op === 'tick' || op === 'resume') NET.leave(true); return d; }
      if (d && d.G) apply(d);
      return d;
    } catch (e) { toast('서버 오류 · ' + e.message); return null; }
    finally { NET.busy = false; if (NET.again) { NET.again = false; setTimeout(() => call('tick'), 50); } }
  }
  function apply(v) {
    if (v.ver < NET.ver && v.code === NET.code) return;
    const first = !NET.ch || NET.chCode !== v.code;
    Object.assign(NET, { role: 'guest', seat: v.seat, code: v.code, ver: v.ver, owner: !!v.owner });
    G = v.G; UI.skins = v.skins || {}; if (typeof RANK !== 'undefined') { if (G && G.ranked) RANK.on(); else RANK.off(); } localStorage.setItem(LAST, v.code);
    if (first) { subscribe(v.code); $('setup').hidden = true; }
    PF.record(G, NET.seat); cutCheck(); render();
    clearTimeout(NET.tt); if (!G.over) NET.tt = setTimeout(() => call('tick'), v.next == null ? 4000 : Math.min(4000, v.next + 80));
  }
  function subscribe(code) {
    if (NET.ch) CLOUD.sb.removeChannel(NET.ch);
    NET.chCode = code; NET.ch = CLOUD.sb.channel('mj-room-' + code).on('broadcast', { event: 'v' }, ({ payload }) => { if (payload && payload.ver > NET.ver) call('tick'); }).on('broadcast', { event: 'say' }, ({ payload }) => { if (payload && window.sayShow) sayShow(payload.s, payload.t); }).on('broadcast', { event: 'jk' }, ({ payload }) => { if (window.jkRemote) jkRemote(payload); }).on('broadcast', { event: 'jkreq' }, () => { if (window.jkBcast) jkBcast(); }).subscribe(st => { if (st === 'SUBSCRIBED') setTimeout(() => window.jkAsk && jkAsk(), 600); });
  }
  NET.create = async () => {
    if (!need() || !G) return; if (NET.role) return toast(`방 코드 ${NET.code}`);
    const players = G.seats.map(S => ({ name: S.name, char: S.char, bot: !!S.bot, level: S.level, remote: !!S.remote }));
    const d = await call('create', { code: '', players, n: G.n, len: G.len, aka: G.aka, afk: UI.cfg.afk ?? 20, ranked: !!G.ranked, skin: mySkin() });
    if (d && d.G) toast(`방 코드 ${d.code} · 친구에게 알려주세요`);
  };
  NET.join = async (code, name) => {
    if (!need()) return; NET.leave(true); NET.code = code;
    const d = await call('join', { code, name: !name || name === '참가자' ? PF.d.nick : name, char: 'me', skin: mySkin() });
    if (d && d.G) toast('입장했습니다'); else NET.code = '';
  };
  NET.resume = async () => { const code = localStorage.getItem(LAST); if (!code || NET.role || !CLOUD.user) return; NET.code = code; const d = await call('tick', { code }); if (d && d.G && !d.G.over) toast(`온라인 방 ${code}에 다시 들어왔습니다`); else if (!d || !d.G) NET.code = ''; };
  NET.sendAct = a => { if (NET.role) call('act', { a }); else toast('연결되지 않았습니다'); };
  NET.toBot = s => call('bot', { seat: s });
  NET.leave = quiet => { clearTimeout(NET.tt); if (NET.ch) CLOUD.sb.removeChannel(NET.ch); Object.assign(NET, { role: null, seat: null, code: '', ch: null, chCode: '', ver: -1, owner: false }); localStorage.removeItem(LAST); };
  NET.push = () => {}; NET.pushSkins = () => {};
  addEventListener('visibilitychange', () => { if (!document.hidden && NET.role) call('tick'); });
})();
