/* MAHJONG — 화면 (데스크톱 · 모바일 가로 공용 · 1280×720 무대를 화면에 맞춰 확대/축소) */
let G = null, T = null;
const UI = { riichi: false, modal: null, cfg: { n: 4, len: 'han', aka: true, name: '나', seats: ['mid', 'mid', 'mid'] }, join: { code: '', name: '' }, skins: {} };
const AS_KEY = 'seed-mj-assist-v1', SAVE_KEY = 'seed-mj-v1';
const AS = Object.assign({ remain: true, discards: true, label: true, shanten: true, danger: true, yaku: true, calc: true, tutor: true, waits: true, calladv: true }, JSON.parse(localStorage.getItem(AS_KEY) || '{}'));
const AS_INFO = [['remain', '남은 패 개수', '패에 마우스를 올리면(휴대폰은 탭) 아직 보이지 않은 개수를 보여줍니다. 내 손패는 오른쪽 위에 숫자로 항상 표시'], ['discards', '버림 후보 분석', '내 차례에 어떤 패를 버리면 유효패가 몇 종 몇 장 남는지 비교합니다. 버려서 텐파이가 되면 대기패와 남은 장수'], ['label', '패 이름 표시', '내 손패 아래에 3만 · 5통 · 동 같은 이름을 작게 표시'],['shanten', '샹텐 · 유효패', '텐파이까지 몇 장 남았는지, 어떤 패가 들어오면 좋은지 보여줍니다. 버리면 좋은 패에 ★ 표시'],
  ['danger', '위험패 경고', '누군가 리치했을 때 내 패마다 안전 · 주의 · 위험 표시'], ['yaku', '역 힌트', '지금 패로 노릴 수 있는 역과, 텐파이일 때 대기패별 화료 가능 여부'],
  ['waits', '텐파이 대기패', '텐파이일 때 손패 위에 대기패와 남은 장수를 크게 보여줍니다. 내 차례엔 버리면 텐파이가 되는 패를 알려주고, 손패에 마우스를 올리면 그 패를 버렸을 때의 대기로 바뀝니다'], ['calladv', '퐁 · 치 추천', '울 때와 안 울 때를 각각 속도(샹텐 · 유효패) × 타점(예상 역 · 도라, 멘젠이면 리치 포함) × 화료율로 계산해 기대점수가 높은 쪽을 추천합니다. 내가 먼저 끝내 상대 화료를 막는 가치도 반영합니다'], ['calc', '점수 계산 과정', '화료 때 부수 · 판수 · 기본점 · 지불 계산을 한 줄씩 보여줍니다'], ['tutor', '튜토리얼', '상황마다 지금 무엇을 할 수 있는지 짧게 설명합니다']];
const LV = { low: '약함', mid: '보통', high: '강함' };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const isGuest = () => window.NET && NET.role === 'guest';
function me() { if (isGuest()) return NET.seat; if (!G) return 0; const i = G.seats.findIndex(S => !S.bot && !S.remote); return i < 0 ? 0 : i; }
function fit() { const vv = window.visualViewport, w = vv ? vv.width : innerWidth, h = vv ? vv.height : innerHeight, pr = document.getElementById('sa-probe') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'sa-probe' })), cs = getComputedStyle(pr), inset = k => parseFloat(cs[{ '--st': 'paddingTop', '--sb': 'paddingBottom', '--sl': 'paddingLeft', '--sr': 'paddingRight' }[k]]) || 0;
  const mob = matchMedia('(pointer: coarse)').matches, pad = mob ? 10 : 0, aw = w - inset('--sl') - inset('--sr') - pad * 2, ah = h - inset('--st') - inset('--sb') - pad * 2;
  const s = Math.min(aw / 1280, ah / 720), cx = inset('--sl') + pad + aw / 2, cy = inset('--st') + pad + ah / 2;
  const st = $('stage'); st.style.left = cx + 'px'; st.style.top = cy + 'px'; st.style.transform = `translate(-50%,-50%) scale(${s})`; }
function toast(m) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; $('stage').appendChild(d); setTimeout(() => d.remove(), 1800); }
function save() { if (isGuest() || !G) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(G)); } catch (e) {} }

/* ── 패 ── */
function tile(id, sz, extra = '') {
  if (id == null) return `<span class="tl ${sz} back ${extra}"></span>`;
  const t = tT(id), red = G && G.aka && isRed(id), lb = sz === 'L' && AS.label ? `<span class="lb">${t >= 27 ? HONOR_K[t - 27] : t % 9 + 1 + SUIT_K[Math.floor(t / 9)]}</span>` : '';
  if (t >= 27) return `<span data-t="${t}" class="tl ${sz} hon ${extra}">${tileFace(t)}${lb}</span>`;
  const su = Math.floor(t / 9); return `<span data-t="${t}" class="tl ${sz} s${su} ${red ? 'red' : ''} ${extra}">${tileFace(t, red)}${lb}</span>`;
}
const tileT = (t, sz, extra) => tile(t * 4 + 1, sz, extra);
function meldsHTML(S, sz) {
  return S.melds.map(m => `<span class="meld">${m.ids.map((id, j) => m.k === 'ankan' && (j === 0 || j === 3) ? tile(null, sz) : tile(id, sz, id === m.called ? 'rot' : '')).join('')}</span>`).join('')
    + (S.kita.length ? `<span class="meld">${S.kita.map(id => tile(id, sz)).join('')}</span>` : '');
}

/* ── 구동 ── */
function doAct(a) {
  if (isGuest()) { NET.sendAct(a); return; }
  const r = act(G, me(), a); if (!r.ok) { toast(r.why); return; } after();
}
function after() { save(); PF.record(G, me()); cutCheck(); render(); if (window.NET && NET.role === 'host') NET.push(); tick(); }
function tick() {
  clearTimeout(T); if (!G || isGuest() || G.over) return;
  const rs = G.phase === 'discard' && !G.seats[G.turn].bot && G.seats[G.turn].riichi && G.seats[G.turn].drawn != null ? G.turn : -1;
  if (rs >= 0) { const O = discardOpts(G, rs); if (!O.tsumo && !O.ankan.length && !O.kita) { T = setTimeout(() => { const S = G.seats[rs]; if (G.phase === 'discard' && G.turn === rs && S.drawn != null) { const r = act(G, rs, { t: 'discard', id: S.drawn }); if (!r.ok) console.warn('auto', r.why); after(); } }, 700); return; } }
  const w = waitingSeats(G).filter(s => G.seats[s].bot); if (!w.length) return;
  T = setTimeout(() => { w.forEach(s => { if (waitingSeats(G).includes(s)) { const r = act(G, s, botAct(G, s)); if (!r.ok) console.warn('bot', r.why); } }); after(); }, G.phase === 'call' ? 380 : 620);
}

/* ── 렌더 ── */
function render() {
  if ($('tip')) $('tip').hidden = true;
  if (!G) { renderSetup(); return; }
  $('setup').hidden = true; renderTable(); renderPanel(); renderModal();
}
function sideHTML(s) {
  const S = G.seats[s], m = me(), rel = (s - m + G.n) % G.n, rot = (G.n === 4 ? [0, -90, 180, 90] : [0, -90, 90])[rel];
  const hot = G.phase === 'call' && G.last && G.last.s === s;
  const river = S.river.map((r, j) => tile(r.id, 'M', (r.r ? 'rot ' : '') + (r.taken ? 'taken ' : '') + (hot && j === S.river.length - 1 ? 'hot' : ''))).join('');
  const waitTag = S.remote && !S.online ? '<span class="wait">대기</span>' : '';
  const plate = `<div class="plate ${G.turn === s && G.phase === 'discard' ? 'on' : ''} ${s === G.dealer ? 'dealer' : ''}">${avatar(s, 22)}<b>${HONOR_K[seatW(G, s) - 27]}</b><span>${esc(S.name)}</span>${waitTag}<em>${S.pts}</em>${S.riichi ? '<i class="stick"></i>' : ''}</div>`;
  const hand = rel === 0 ? '' : `<div class="ohand">${S.hand.map(() => tile(null, 'S')).join('')}<span class="omelds">${meldsHTML(S, 'S')}</span></div>`;
  return `<div class="side" style="transform:rotate(${rot}deg)"><div class="river">${river}</div>${plate}${hand}</div>`;
}
let VIS = [];
function renderTable() {
  const m = me(), S = G.seats[m]; VIS = visibleCounts(G, m);
  const center = `<div class="center"><div class="rl">${roundLabel(G)}</div><div class="hb">${G.honba}본장 · 공탁 ${G.sticks}</div>
    <div class="dora">${[0, 1, 2, 3, 4].map(k => k < G.doraN ? tile(G.ind[2 * k], 'D') : tile(null, 'D')).join('')}</div><div class="rem">남은 패 <b>${G.wall.length}</b></div></div>`;
  const myTurn = G.phase === 'discard' && G.turn === m, O = myTurn ? discardOpts(G, m) : null;
  const drawn = myTurn && S.drawn != null ? S.drawn : null, base = S.hand.filter(i => i !== drawn);
  const threat = AS.danger && G.seats.some((X, k) => k !== m && X.riichi);
  let best = new Set();
  if (AS.shanten && myTurn && !S.riichi) { const c = cnt(S.hand), fm = S.melds.length, sc = {}; [...new Set(S.hand.map(tT))].forEach(t => { c[t]--; sc[t] = shanten(c, fm); c[t]++; }); const mn = Math.min(...Object.values(sc)); Object.keys(sc).forEach(t => { if (sc[t] === mn) best.add(+t); }); if (best.size > 6) best = new Set(); }
  const one = id => { const t = tT(id);
    const can = myTurn && !(S.riichi && id !== S.drawn) && !(UI.riichi && !O.riichi.includes(t)) && !(S.kuikae || []).includes(t);
    let tag = ''; if (threat) { const d = danger(G, m, t); tag = d <= 0.5 ? '<span class="tag dz0">안전</span>' : d >= 4 ? '<span class="tag dz3">위험</span>' : '<span class="tag dz2">주의</span>'; }
    if (best.has(t) && can) tag += '<span class="tag best">★</span>';
    if (AS.remain) tag += `<span class="rm">${Math.max(0, 4 - VIS[t])}</span>`;
    return tile(id, 'L', (can ? 'can' : myTurn ? 'off' : '')).replace(/^<span /, `<span data-d="${id}" `).replace(/<\/span>$/, tag + '</span>'); };
  const hand = base.map(one).join('') + (drawn != null ? '<span class="gap"></span>' + one(drawn) : '') + `<span class="mymelds">${meldsHTML(S, 'M')}</span>`;
  $('table').innerHTML = `<div class="stamp">麻雀 · ${G.n}인 · ${G.len === 'ton' ? '동풍전' : '반장전'}</div><div class="sq">${G.seats.map((_, s) => sideHTML(s)).join('')}${center}</div>
    <div id="hand">${hand}</div><div id="acts">${actsHTML()}</div><div id="waits">${waitsHTML()}</div><div id="status">${statusText()}</div>`;
}
function statusText() {
  if (G.phase === 'end' || G.over) return ''; const w = waitingSeats(G), m = me();
  if (w.includes(m)) return G.phase === 'call' ? '울기 · 론 응답' : '당신의 차례';
  return w.map(s => G.seats[s].name).join(', ') + (G.phase === 'call' ? ' 응답 대기' : ' 차례');
}
function actsHTML() {
  const m = me(), S = G.seats[m];
  if (G.phase === 'discard' && G.turn === m) { const O = discardOpts(G, m), b = [];
    if (O.tsumo) b.push('<button class="ab hot" data-a="tsumo">쯔모</button>');
    if (O.kyuushu) b.push('<button class="ab" data-a="kyuushu">구종구패 · 유국</button>');
    if (O.riichi.length) b.push(`<button class="ab ${UI.riichi ? 'on' : 'pri'}" data-a="riichi">${UI.riichi ? '리치 · 버릴 패 선택' : '리치'}</button>`);
    O.ankan.forEach(t => b.push(`<button class="ab" data-a="ankan" data-t="${t}">깡 ${tileT(t, 'S')}</button>`));
    O.kakan.forEach(t => b.push(`<button class="ab" data-a="kakan" data-t="${t}">가깡 ${tileT(t, 'S')}</button>`));
    if (O.kita) b.push('<button class="ab" data-a="kita">북 빼기</button>');
    return b.join(''); }
  if (G.phase === 'call' && G.pend.opts[m] && !G.pend.resp[m]) { const o = G.pend.opts[m], b = [], A = AS.calladv ? callAdvice(m) : null, r = k => A && A.pick === k ? ' rec' : '';
    if (o.some(x => x.t === 'ron')) b.push(`<button class="ab hot${r('ron')}" data-a="ron">론</button>`);
    if (o.some(x => x.t === 'pon')) b.push(`<button class="ab pri${r('pon')}" data-a="pon">퐁</button>`);
    if (o.some(x => x.t === 'minkan')) b.push(`<button class="ab pri${r('minkan')}" data-a="minkan">깡</button>`);
    o.filter(x => x.t === 'chi').forEach((x, j) => b.push(`<button class="ab pri${r('chi' + j)}" data-a="chi" data-j="${j}">치 ${x.ids.map(i => tile(i, 'S')).join('')}</button>`));
    b.push(`<button class="ab${r('pass')}" data-a="pass">패스</button>`);
    if (A) b.push(`<div class="adv"><b>추천 · ${A.label}</b> — ${A.why}${A.rows.length ? `<small>${A.rows.join('')}</small>` : ''}</div>`); return b.join(''); }
  return '';
}
/* ── 도움 ── */
function yakuHints(m) {
  const S = G.seats[m], tiles = S.hand.map(tT).concat(...S.melds.map(x => x.ids.map(tT))), open = S.melds.some(x => x.k !== 'ankan'), c = cnt(S.hand);
  const sw = seatW(G, m), rw = 27 + G.wind, yh = t => isDragon(t) || t === sw || t === rw, out = [];
  const yhM = S.melds.filter(x => x.k !== 'chi' && yh(x.t)), yhP = [...Array(34).keys()].filter(t => yh(t) && c[t] >= 2);
  yhM.forEach(x => out.push([`역패 ${tName(x.t)}`, 1])); yhP.forEach(t => out.push([`역패 ${tName(t)} (한 장 더/퐁)`, 2]));
  if (!open) out.push(['리치 (텐파이 시)', 2], ['멘젠 쯔모', 2]);
  const yao = tiles.filter(isYao).length; if (yao <= 2 && S.melds.every(x => x.ids.every(i => !isYao(tT(i))))) out.push([yao ? `탕야오 (요구패 ${yao}장 정리)` : '탕야오', yao ? 2 : 1]);
  const suits = [0, 1, 2].map(k => tiles.filter(t => t < 27 && Math.floor(t / 9) === k).length), hon = tiles.filter(isHon).length, mx = Math.max(...suits);
  if (mx + hon >= tiles.length - 3 && mx >= 7) out.push([hon ? '혼일색' : '청일색', 2]);
  if (!open && c.filter(v => v >= 2).length >= 4) out.push(['치또이츠', 2]);
  if (c.filter(v => v >= 2).length + S.melds.filter(x => x.k !== 'chi').length >= 4) out.push(['또이또이', 2]);
  for (let s = 0; s < 27; s += 9) { const k = [...Array(9).keys()].filter(r => c[s + r]).length; if (k >= 7) out.push(['일기통관', 2]); }
  const hasYaku = yhM.length || (!open) || out.some(x => /탕야오|혼일색|청일색|또이또이/.test(x[0]));
  return { list: out, warn: open && !hasYaku };
}
function assistHTML() {
  const m = me(), S = G.seats[m], c = cnt(S.hand), fm = S.melds.length, sh = shanten(c, fm), myTurn = G.phase === 'discard' && G.turn === m;
  let h = '';
  if (AS.shanten) {
    if (myTurn) h += `<div class="shn">샹텐 <em>${sh}</em> <span style="font-size:12px;color:var(--mut);font-weight:500">${sh <= 0 ? (sh < 0 ? '· 화료형' : '· 버리면 텐파이 (★)') : '· ★ 패를 버리면 가장 빨라요'}</span></div>`;
    else if (sh > 0) { const vis = visibleCounts(G, m), al = allowedT(G), u = []; for (let t = 0; t < 34; t++) { if (!al(t) || c[t] >= 4) continue; c[t]++; if (shanten(c, fm) < sh) u.push([t, Math.max(0, 4 - vis[t])]); c[t]--; }
      h += `<div class="shn">샹텐 <em>${sh}</em> · 유효패 ${u.reduce((a, x) => a + x[1], 0)}장</div><div class="ts">${u.slice(0, 14).map(([t, n]) => `<span>${tileT(t, 'S')}×${n}</span>`).join('')}</div>`; }
  }
  if (AS.discards && myTurn && S.hand.length % 3 === 2) { const al = allowedT(G), rows = [];
    [...new Set(S.hand.map(tT))].forEach(t => { if ((S.kuikae || []).includes(t) || (S.riichi && t !== tT(S.drawn))) return; c[t]--; const s2 = shanten(c, fm), u = [];
      for (let x = 0; x < 34; x++) { if (!al(x) || c[x] >= 4) continue; c[x]++; if (shanten(c, fm) < s2) u.push([x, Math.max(0, 4 - VIS[x])]); c[x]--; }
      rows.push({ t, s2, u, n: u.reduce((a, x) => a + x[1], 0) }); c[t]++; });
    const mn = Math.min(...rows.map(r => r.s2)), best = rows.filter(r => r.s2 === mn).sort((a, b) => b.n - a.n).slice(0, 5);
    if (best.length && mn >= 0) h += `<div class="dh">${mn === 0 ? '버리면 텐파이 · 대기패와 남은 장수' : `버린 뒤 ${mn}샹텐 · 유효패와 남은 장수`}</div>${best.slice(0, 3).map((r, j) => `<div class="dr">${tileT(r.t, 'S')}<span class="ar">→</span><span class="ts">${j === 0 || mn === 0 ? r.u.slice(0, 6).map(([x, k]) => `<span>${tileT(x, 'S')}×${k}</span>`).join('') + (r.u.length > 6 ? '<span>…</span>' : '') : ''}</span><b>${r.u.length}종 ${r.n}장</b></div>`).join('')}`; }
  if ((AS.shanten || AS.yaku) && !myTurn && sh === 0) {
    const w = waitsOf(c, fm, allowedT(G)), vis = visibleCounts(G, m), furi = isFuriten(G, m);
    h += `<div class="shn">텐파이 · 대기 ${w.length}종${furi ? ' <span class="ng">후리텐</span>' : ''}</div><div class="wl">${w.map(t => { const ctx = winCtx(G, m, t * 4 + 1, false), r = scoreHand(ctx), rt = scoreHand({ ...ctx, tsumo: true, houtei: false });
      const st = r ? (furi ? '<span class="mid">쯔모만 (후리텐)</span>' : `<span class="ok">론 가능 · ${r.ym ? r.label : r.han + '판'}</span>`) : rt ? '<span class="mid">쯔모만 가능</span>' : '<span class="ng">역 없음</span>';
      return `${tileT(t, 'S')}<span>남은 ${Math.max(0, 4 - vis[t])}장 · ${st}</span>`; }).join('')}</div>`;
  }
  if (AS.yaku) { const Y = yakuHints(m); h += `<div class="yk">${Y.list.map(([n, k]) => `<span class="y${k}">${esc(n)}</span>`).join('') || '<span>노릴 역이 아직 없어요</span>'}</div>${Y.warn ? '<div class="warn">⚠ 역 없음 — 울고 나면 역이 있어야 화료할 수 있어요</div>' : ''}`; }
  if (AS.danger && G.seats.some((X, k) => k !== m && X.riichi)) h += '<div style="font-size:11.5px;margin-top:6px;color:var(--mut)">리치 선언자 있음 · 내 패 위에 <b class="ok">안전</b> · <b class="mid">주의</b> · <b class="ng">위험</b> 표시</div>';
  return h ? `<div class="box"><h4>도움 · 내 패 분석</h4>${h}</div>` : '';
}
function tipText() {
  const m = me(), S = G.seats[m];
  if (G.phase === 'call' && G.pend.opts[m] && !G.pend.resp[m]) { const o = G.pend.opts[m].map(x => x.t);
    if (o.includes('ron')) return '<b>론</b>할 수 있어요! 방금 버려진 패로 화료합니다. 점수는 버린 사람이 전부 냅니다.';
    return [o.includes('pon') && '<b>퐁</b>: 같은 패 2장 + 버려진 패로 3장 묶음을 만듭니다 (누구의 패든 가능).', o.includes('chi') && '<b>치</b>: 왼쪽 사람이 버린 패로 연속된 3장을 만듭니다.', o.includes('minkan') && '<b>깡</b>: 같은 패 4장. 새 도라가 열리고 한 장 더 뽑습니다.', '울면 멘젠이 깨져서 <b>리치를 못 하고</b>, 역이 따로 있어야 화료할 수 있어요.'].filter(Boolean).join('<br>'); }
  if (G.phase === 'discard' && G.turn === m) { const O = discardOpts(G, m);
    if (O.tsumo) return '<b>쯔모</b> 버튼을 누르면 화료! 직접 뽑은 패로 완성했어요.';
    if (O.kyuushu) return '요구패(1·9·자패)가 9종 이상이에요. <b>구종구패</b>를 선언하면 이번 국을 무효로 하고 다시 시작합니다. 그대로 국사무쌍을 노려도 돼요.';
    if (S.riichi) return '리치 중에는 뽑은 패를 그대로 버립니다. 기다리는 패가 나오면 화료할 수 있어요.';
    if (O.riichi.length) return '<b>리치</b>를 걸 수 있어요. 텐파이 + 울지 않음 + 1000점을 걸면 역이 하나 생기고 뒷도라도 볼 수 있어요. 대신 이후엔 패를 바꿀 수 없어요.';
    if (S.melds.length && S.drawn == null) return '울었으니 패 한 장을 버리세요. 방금 울어 온 패와 같은 패는 바로 버릴 수 없어요.';
    return '패를 하나 골라 <b>버리세요</b>. 목표는 <b>3장 묶음 4개 + 같은 패 2장(머리)</b>. 같은 패 3장이나 연속 3장(같은 종류)이 묶음입니다.'; }
  if (G.phase === 'discard') return `${esc(G.seats[G.turn].name)}의 차례입니다. 다른 사람이 버린 패로 퐁 · 치 · 론을 할 수 있으면 버튼이 나타나요.`;
  return '';
}
function renderPanel() {
  const m = me(), host = !isGuest() || !!(window.NET && NET.owner);
  const sb = G.seats.map((S, i) => `<span class="w">${HONOR_K[seatW(G, i) - 27]}</span><span class="n ${i === m ? 'me' : ''}">${avatar(i, 18)}${esc(S.name)}${S.bot ? `<span class="lv">봇 · ${LV[S.level]}</span>` : S.remote ? `<span class="lv">${S.online ? '온라인' : '참가 대기'}</span>` : ''}${S.remote && !S.online && host ? ` <button class="pb" data-bot="${i}" style="height:20px;font-size:10px">봇으로</button>` : ''}</span><span class="p">${S.pts}${S.riichi ? ' · 리치' : ''}</span>`).join('');
  const online = window.NET && NET.role ? `<div class="box" style="padding:7px 10px;font-size:12.5px"><b>온라인 방 ${esc(NET.code || '')}</b> · ${NET.owner ? '방장' : '참가자'} · 접속 ${G.seats.filter(S => S.online).length}명 · 서버 판정</div>` : '';
  $('panel').innerHTML = `<div class="ph"><div><div class="t">麻雀</div><div class="k">${G.ranked ? '경쟁전 · ' : '리치 마작 · '}${roundLabel(G)} · ${G.honba}본장</div></div>
    <div class="btns"><button class="pb" data-m="assist">도움</button><button class="pb" data-m="yakubook">족보</button><button class="pb" data-m="rules">규칙</button><button class="pb" data-m="juke">음악</button><button class="pb" data-m="say">대사</button><button class="pb" data-m="exit">나가기</button>${host && G.seats.some(S => S.remote) && !(window.NET && NET.role) ? '<button class="pb" data-m="room">방 만들기</button>' : ''}</div></div>
    <div class="sb">${sb}</div>${online}${assistHTML()}${AS.tutor && tipText() ? `<div class="box tip"><h4>튜토리얼</h4><p>${tipText()}</p></div>` : ''}
    <div class="log">${G.log.slice(-40).reverse().map(l => `<div>${esc(l.text)}</div>`).join('')}</div>`;
}
/* ── 모달 ── */
function renderModal() {
  let h = '';
  if (UI.modal === 'juke') h = jukeHTML(); else if (UI.modal === 'say') h = sayHTML(); else if (UI.modal === 'lines') h = linesHTML(); else if (UI.modal === 'bots') { h = botEditHTML(); if (!h) UI.modal = null; } else if (UI.modal === 'rules') h = rulesHTML(); else if (UI.modal === 'yakubook') h = yakuBookHTML(); else if (UI.modal === 'assist') h = assistSetHTML(); else if (UI.modal === 'profile') h = profileHTML(); else if (UI.modal === 'stats') h = statsHTML();
  else if (UI.modal === 'rank') h = rankHTML(); else if (UI.modal === 'exit') h = exitHTML(); else if (G && G.phase === 'end') h = resultHTML(); else if (G && G.over) h = overHTML();
  const ov = $('ov'); ov.innerHTML = h; ov.hidden = !h;
}
function payHTML(pay) { return `<div class="pay">${G.seats.map((S, i) => `<div>${esc(S.name)}<b class="${pay[i] > 0 ? 'plus' : pay[i] < 0 ? 'minus' : ''}">${pay[i] > 0 ? '+' : ''}${pay[i]}</b>${S.pts}</div>`).join('')}</div>`; }
function nextBtn() { return isGuest() ? '<span style="font-size:13px;color:var(--mut)">방장이 다음 국을 시작합니다</span>' : '<button class="go" data-a="next">다음 국 →</button>'; }
function resultHTML() {
  const R = G.result;
  if (R.type === 'abort') return `<div class="md"><div class="k">${roundLabel(G)} · ${G.honba}본장</div><h2>도중 유국 · ${R.why}</h2>${R.who != null ? `<div style="margin:8px 0"><b>${esc(G.seats[R.who].name)}</b><div class="row" style="margin-top:4px">${R.hands[R.who].map(id => tile(id, 'M')).join('')}</div></div>` : ''}<div class="calc">${ABORT_TXT[R.why] || ''}<br>점수 이동 없이 같은 친으로 다시 시작합니다 (본장 +1). 걸린 리치봉은 다음 화료자에게 갑니다.</div><div class="foot">${nextBtn()}</div></div>`;
  if (R.type === 'draw') return `<div class="md"><div class="k">${roundLabel(G)} · ${G.honba}본장</div><h2>${R.nag && R.nag.length ? '유국 만관 · ' + R.nag.map(i => esc(G.seats[i].name)).join(', ') : '유국 · 패가 다 떨어졌습니다'}</h2>
    ${G.seats.map((S, i) => `<div style="margin:8px 0"><b>${esc(S.name)}</b> · ${R.ten[i] ? '<span class="ok">텐파이</span>' : '<span class="ng">노텐</span>'}${R.ten[i] ? `<div class="row" style="margin-top:4px">${R.hands[i].map(id => tile(id, 'M')).join('')}</div>` : ''}</div>`).join('')}
    ${AS.calc ? `<div class="calc">${R.nag && R.nag.length ? '버린 패가 모두 1·9·자패이고 한 장도 울리지 않아 <b>만관 쯔모</b>만큼 받습니다 (텐파이료 대신). ' : ''}텐파이가 아닌 사람이 텐파이한 사람에게 합계 ${G.n === 4 ? 3000 : 2000}점을 나눠 냅니다. ${R.ten[G.dealer] ? '친이 텐파이라 연장(본장 +1)' : '친이 노텐이라 다음 사람이 친'}.</div>` : ''}${payHTML(R.pay)}<div class="foot">${nextBtn()}</div></div>`;
  const all = [R].concat(R.more || []), sum = G.seats.map((_, i) => all.reduce((a, x) => a + x.pay[i], 0));
  return `<div class="md win">${standHTML(charOf(R.k), skinOf(R.k).stand, '', skinOf(R.k).pos)}<div style="min-width:0"><div class="stampbox">${all.length > 1 ? '[ 더블 론 ]' : R.tsumo ? '[ 쯔모 ]' : '[ 론 ]'}</div><div class="k">${roundLabel(G)} · ${G.honba}본장 · 화료</div>${all.map(winBody).join('<hr class="sep">')}${payHTML(sum)}<div class="foot">${nextBtn()}</div></div></div>`;
}
const ABORT_TXT = { '구종구패': '첫 차례에 요구패(1·9·자패)가 9종 이상이라 선언했습니다.', '사풍연타': '첫 바퀴에 4명이 모두 같은 바람패를 버렸습니다.', '사가 리치': '4명 모두 리치를 걸었습니다.', '사깡 산료': '두 명 이상이 합쳐서 깡을 4번 했습니다.', '삼가화': '3명이 동시에 론을 선언했습니다.' };
function winBody(R) {
  const S = G.seats[R.k], r = R.r, from = R.from != null ? G.seats[R.from].name : null, isD = R.k === G.dealer;
  const hand = R.hand.filter(i => i !== R.winId).sort((a, b) => a - b).map(id => tile(id, 'M')).join('') + ' ' + tile(R.winId, 'M', 'win');
  const melds = R.melds.map(m => `<span class="meld" style="margin-left:8px">${m.ids.map(id => tile(id, 'M', id === m.called ? 'rot' : '')).join('')}</span>`).join('');
  let calc = '';
  if (AS.calc) {
    const bLine = r.ym ? `${r.label} → 기본점 ${r.base}` : r.label ? `${r.han}판 → ${r.label} · 기본점 ${r.base}` : `${r.fu}부 × 2<sup>${r.han}+2</sup> = ${r.base} (기본점)`;
    const pLine = R.tsumo ? (isD ? `친 쯔모 · 모두가 기본점 × 2 = ${Math.ceil(r.base * 2 / 100) * 100}` : `자 쯔모 · 친은 기본점 × 2, 자는 × 1 (100 단위 올림)`) : `${isD ? '친' : '자'} 론 · 기본점 × ${isD ? 6 : 4} = ${Math.ceil(r.base * (isD ? 6 : 4) / 100) * 100} → ${esc(from)}가 전부 지불`;
    calc = `<div class="calc">${r.fuT.length ? '<b>부수</b> · ' + r.fuT.map(([n, v]) => `${esc(n)} ${v}`).join(' + ') + ` → <b>${r.fu}부</b> (10단위 올림)<br>` : ''}<b>판수</b> · ${r.yaku.map(y => `${esc(y[0])} ${y[1]}`).join(' + ')}<br><b>기본점</b> · ${bLine}<br><b>지불</b> · ${pLine}${R.honba ? ` · 본장 ${R.honba} × 300` : ''}${R.stick ? ` · 공탁 리치봉 ${R.stick * 1000}` : ''}</div>`;
  }
  return `<h2 style="display:flex;align-items:center;gap:10px">${avatar(R.k, 40)}${esc(S.name)} ${R.tsumo ? '쯔모' : '론 ← ' + esc(from)}</h2><div class="row">${hand}${melds}</div>
    <div class="row" style="margin-top:10px;gap:10px;align-items:center;font-size:12px"><span>도라 표시패</span><span class="row">${[...Array(G.doraN).keys()].map(k => tile(G.ind[2 * k], 'D')).join('')}</span>${R.ura.length ? `<span>뒷도라</span><span class="row">${R.ura.map(id => tile(id, 'D')).join('')}</span>` : ''}</div>
    <table>${r.yaku.map(y => `<tr><td>${esc(y[0])}</td><td>${typeof y[1] === 'string' ? y[1] : y[1] + '판'}</td></tr>`).join('')}</table>
    <div class="tot"><span>${r.ym ? '' : `${r.han}판 ${r.fu}부`} ${r.label}</span><b>${R.pay[R.k] > 0 ? '+' : ''}${R.pay[R.k]}</b></div>${calc}`;
}
function overHTML() {
  return `<div class="md win">${standHTML(charOf(G.rank[0]), skinOf(G.rank[0]).stand, '', skinOf(G.rank[0]).pos)}<div style="min-width:0"><div class="stampbox">[ 終局 ]</div><div class="k">게임 종료 · ${G.ranked ? '경쟁전 · ' : ''}${G.len === 'ton' ? '동풍전' : '반장전'}</div><h2>최종 순위</h2>
    <table>${G.rank.map((i, k) => `<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><b>${k + 1}위</b>${avatar(i, 30)}${esc(G.seats[i].name)}${i === me() ? ' (나)' : ''}</span></td><td>${G.seats[i].pts}</td></tr>`).join('')}</table>
    ${rankResHTML()}<p style="font-size:12px;color:var(--mut)">이번 대국 결과가 내 전적에 기록되었습니다.</p><div class="foot"><button class="go sec" data-m="stats">내 전적</button><button class="go" data-a="again">새 게임</button></div></div></div>`;
}
function assistSetHTML() {
  return `<div class="md" style="width:560px"><div class="k">설정</div><h2>초보자 도움 기능</h2>${AS_INFO.map(([k, n, d]) => `<div class="tg"><div><b>${n}</b><p>${d}</p></div><button class="sw ${AS[k] ? 'on' : ''}" data-as="${k}"></button></div>`).join('')}
    <div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
function rulesHTML() {
  return `<div class="md rules"><div class="k">작전 교본 · 리치 마작</div><h2 style="display:flex;align-items:center;gap:12px">규칙 요약 <button class="pb" data-m="yakubook">족보 보기</button></h2>
  <h3>목표</h3><p>14장으로 <b>3장 묶음 4개 + 같은 패 2장(머리)</b>을 먼저 만들면 화료(승리). 묶음은 같은 패 3장(커쯔) 또는 같은 종류 연속 3장(슌쯔). 예외로 7쌍(치또이츠), 국사무쌍도 있습니다.</p>
  <h3>패</h3><p>만 · 통 · 삭 1~9 각 4장, 동남서북 · 백발중 각 4장. 3인은 만의 2~8이 빠지고, 북은 뽑으면 <b>북 빼기</b>로 도라처럼 씁니다. 빨간 5는 적도라(+1판).</p>
  <h3>진행</h3><ul><li>차례마다 1장 뽑고 1장 버립니다.</li><li><b>퐁</b>: 남이 버린 패 + 내 같은 패 2장. <b>치</b>: 왼쪽 사람이 버린 패로 연속 3장 (4인만). <b>깡</b>: 같은 패 4장 → 새 도라 공개 + 한 장 더 뽑기.</li><li>울면 멘젠이 깨져 리치를 못 하고, 일부 역의 판수가 줄어듭니다.</li></ul>
  <h3>역 (필수)</h3><p>화료하려면 <b>역이 1판 이상</b> 있어야 합니다. 도라만으로는 안 됩니다. 자주 나오는 역: 리치 · 멘젠 쯔모 · 탕야오(2~8만) · 역패(백발중 · 자풍 · 장풍 3장) · 핑후 · 치또이츠 · 혼일색.</p>
  <h3>리치</h3><p>울지 않은 텐파이에서 1000점을 걸고 선언. 역 1판, 한 바퀴 안에 화료하면 일발, 뒷도라를 볼 수 있습니다. 선언 후엔 뽑은 패만 버립니다.</p>
  <h3>화료</h3><p><b>쯔모</b>: 직접 뽑아 완성 → 모두가 나눠 냄. <b>론</b>: 남이 버린 패로 완성 → 버린 사람이 전부 냄.</p>
  <h3>후리텐</h3><p>기다리는 패를 내가 이미 버렸다면 론을 못 하고 쯔모만 할 수 있습니다. 론을 넘긴 직후와 리치 후 넘긴 경우도 마찬가지.</p>
  <h3>유국</h3><p>패가 다 떨어지면 텐파이한 사람이 노텐인 사람에게 텐파이료를 받습니다. 버린 패가 전부 1·9·자패이고 울리지 않았다면 <b>유국 만관</b>. 도중 유국: 구종구패 · 사풍연타 · 사가 리치 · 사깡 산료 · 삼가화(3명 동시 론). 2명 동시 론은 둘 다 화료(더블 론).</p>
  <h3>점수</h3><p>판수와 부수로 기본점을 정합니다. 5판 만관, 6~7판 하네만, 8~10판 배만, 11~12판 삼배만, 13판 이상 역만. 스안커 단기 · 대사희 · 국사무쌍 13면 · 순정 구련보등은 더블 역만. 친(동)은 1.5배. 반장전은 동장 · 남장 두 바퀴, 누군가 0점 미만이면 즉시 종료.</p>
  <div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
/* ── 설정 화면 ── */
function renderSetup() {
  const c = UI.cfg, st = $('setup'); st.hidden = false; let saved = null; try { saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {}
  const winds = ['東', '南', '西', '北'];
  st.innerHTML = `<div class="st-h"><div class="k">RIICHI MAHJONG</div><h1>리치 麻雀</h1><div class="sub">리치 마작 · 3인 / 4인 · 온라인 대국</div>${pfCardHTML()}
    <div class="note">혼자라면 봇과, 친구와 함께라면 자리를 <b>온라인 참가자</b>로 두고 시작한 뒤 오른쪽 위 <b>방 만들기</b>로 4자리 코드를 공유하세요. 친구는 아래 <b>참가하기</b>에 코드를 입력하면 됩니다.<br>초보라면 도움 기능을 켜 두세요. 게임 중에도 <b>도움</b> 버튼으로 하나씩 끄고 켤 수 있습니다.</div>
    <div class="fg" style="margin-top:26px"><label>참가하기 · 코드 + 이름</label><div class="jn"><input id="jcode" placeholder="코드 4자리" maxlength="4" value="${esc(UI.join.code)}"><input id="jname" placeholder="내 이름" value="${esc(UI.join.name || PF.d.nick)}"><button class="go sec" data-a="join" style="height:36px;font-size:15px">참가</button></div></div>
    <div class="box rkbox"><div style="flex:1;min-width:0"><div class="k" style="margin-bottom:4px">경쟁전 · 4인 반장전 · 도움 끔</div>${rankLine()}</div><div style="display:flex;flex-direction:column;gap:6px"><button class="go" data-a="ranked" style="height:36px;font-size:15px">경쟁전 시작</button><button class="pb" data-m="rank">단계 보기</button></div></div></div>
    <div><div class="fg"><label>인원</label><div class="seg">${[4, 3].map(n => `<button class="${c.n === n ? 'on' : ''}" data-cfg="n" data-v="${n}">${n}인${n === 3 ? ' (산마)' : ''}</button>`).join('')}</div></div>
    <div class="fg"><label>길이</label><div class="seg">${[['han', '반장전 (동·남)'], ['ton', '동풍전 (동)']].map(([k, n]) => `<button class="${c.len === k ? 'on' : ''}" data-cfg="len" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="fg"><label>적도라 (빨간 5)</label><div class="seg">${[[true, '있음'], [false, '없음']].map(([k, n]) => `<button class="${c.aka === k ? 'on' : ''}" data-cfg="aka" data-v="${k}">${n}</button>`).join('')}</div></div>
    <div class="fg"><label>자리</label><div class="seat"><b>${winds[0]}</b><span style="display:flex;align-items:center;gap:8px;font-weight:800">${avHTML(CH.me, PF.img('me', 'face'), 28)}${esc(PF.d.nick)}</span><span style="font-size:13px;color:var(--mut)">나 (이 기기)</span></div>
      ${c.seats.slice(0, c.n - 1).map((v, i) => `<div class="seat"><b>${winds[i + 1]}</b><span style="font-size:13px">자리 ${i + 2}</span><select data-seat="${i}">${[['low', '봇 · 약함'], ['mid', '봇 · 보통'], ['high', '봇 · 강함'], ['remote', '온라인 참가자']].map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`).join('')}</div>
    <div class="fg"><label>도움 기능 · 켜고 끄기</label><div style="display:flex;flex-wrap:wrap;gap:6px">${AS_INFO.map(([k, n]) => `<button class="pb ${AS[k] ? 'on' : ''}" data-as="${k}">${n}</button>`).join('')}</div></div>
    <div style="display:flex;gap:10px;margin-top:18px"><button class="go" data-a="start">일반전 시작</button>${saved && !saved.over ? `<button class="go sec" data-a="resume">${saved.ranked ? '경쟁전 ' : ''}이어하기</button>` : ''}</div></div>`;
}
function startGame(ranked) {
  forfeitSaved(); RANK.off(); if (window.applyBots) applyBots();
  const c = ranked ? { n: 4, len: 'han', aka: true, seats: ['high', 'high', 'high'] } : UI.cfg, nm = PF.d.nick || '나', pool = shuffleArr(CHARS.slice());
  const players = [{ name: nm, char: 'me' }].concat(c.seats.slice(0, c.n - 1).map((v, i) => v === 'remote' ? { name: `참가자 ${i + 1}`, remote: true, char: pool[i].id } : { name: `${pool[i].n} · 봇`, bot: true, level: v, char: pool[i].id }));
  UI.skins = {};
  G = newGame({ n: c.n, len: c.len, aka: c.aka, players }); if (ranked) { G.ranked = true; RANK.on(); } UI.modal = AS.tutor ? 'rules' : null;
  if (G.seats.some(S => S.remote) && window.CLOUD && CLOUD.user) { render(); return NET.create(); }
  after();
}
/* 끝나지 않은 경쟁전을 두고 새 대국을 시작하면 도중 이탈로 처리 */
function forfeitSaved() { let s = null; try { s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) {} if (s && s.ranked && !s.over && (!G || G.gid !== s.gid)) { RANK.apply(s, 0, true); localStorage.removeItem(SAVE_KEY); } }
/* ── 입력 ── */
document.addEventListener('click', e => {
  const q = s => e.target.closest(s); let el;
  if ((el = q('[data-cfg]'))) { const k = el.dataset.cfg, v = el.dataset.v; UI.cfg[k] = k === 'n' ? +v : k === 'aka' ? v === 'true' : v; UI.cfg.name = ($('myname') || {}).value || UI.cfg.name; return renderSetup(); }
  if ((el = q('[data-as]'))) { if (G && G.ranked) return toast('경쟁전에서는 도움 기능을 쓸 수 없습니다'); AS[el.dataset.as] = !AS[el.dataset.as]; localStorage.setItem(AS_KEY, JSON.stringify(AS)); return G ? render() : renderSetup(); }
  if ((el = q('[data-color]'))) { PF.d.color = el.dataset.color; PF.save(); return pfRefresh(); }
  if ((el = q('[data-clr]'))) { PF.clearImg('me', el.dataset.clr); return pfRefresh(); }
  if ((el = q('[data-m]'))) { const m = el.dataset.m; if (m === 'room') return NET.create(); UI.modal = m; return renderModal(); }
  if ((el = q('[data-bot]'))) { if (isGuest()) return NET.toBot(+el.dataset.bot); const S = G.seats[+el.dataset.bot]; S.remote = false; S.bot = true; S.level = 'mid'; S.name = S.name.replace('참가자', '봇'); return after(); }
  if ((el = q('[data-d]'))) { const id = +el.dataset.d; if (!el.classList.contains('can')) return; const r = UI.riichi; UI.riichi = false; return doAct({ t: 'discard', id, riichi: r || undefined }); }
  if ((el = q('[data-a]'))) { const a = el.dataset.a, m = me();
    if (a === 'start') return startGame();
    if (a === 'ranked') { UI.modal = null; return startGame(true); }
    if (a === 'resume') { G = JSON.parse(localStorage.getItem(SAVE_KEY)); if (G.ranked) RANK.on(); return after(); }
    if (a === 'exitgo') { if (G && G.ranked && !G.over) { RANK.apply(G, me(), true); localStorage.removeItem(SAVE_KEY); } if (window.NET && NET.role) NET.leave(); G = null; clearTimeout(T); UI.modal = null; RANK.off(); $('ov').hidden = true; return render(); }
    if (a === 'join') { UI.join = { code: $('jcode').value.trim(), name: $('jname').value.trim() || '참가자' }; if (!/^\d{4}$/.test(UI.join.code)) return toast('코드 4자리를 입력하세요'); return NET.join(UI.join.code, UI.join.name); }
    if (a === 'close') { UI.modal = null; renderModal(); return G ? render() : renderSetup(); }
    if (a === 'pfreset') { if (confirm('전적을 모두 지울까요? 되돌릴 수 없습니다.')) { PF.d.stats = PF.blank(); PF.save(); } return pfRefresh(); }
    if (a === 'again') { if (window.NET && NET.role) NET.leave(); RANK.off(); G = null; localStorage.removeItem(SAVE_KEY); clearTimeout(T); $('ov').hidden = true; return render(); }
    if (a === 'riichi') { UI.riichi = !UI.riichi; return renderTable(); }
    if (a === 'next') return doAct({ t: 'next' });
    if (a === 'tsumo' || a === 'kyuushu' || a === 'kita' || a === 'ron' || a === 'pon' || a === 'minkan' || a === 'pass') return doAct({ t: a });
    if (a === 'ankan' || a === 'kakan') return doAct({ t: a, type: +el.dataset.t });
    if (a === 'chi') { const o = G.pend.opts[m].filter(x => x.t === 'chi')[+el.dataset.j]; return doAct({ t: 'chi', ids: o.ids }); } }
});
document.addEventListener('keydown', e => { if (!G || e.target.tagName === 'INPUT') return; const m = me(); if (e.code === 'Space' && G.phase === 'call' && G.pend.opts[m] && !G.pend.resp[m]) { e.preventDefault(); doAct({ t: 'pass' }); } });
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); if (window.visualViewport) visualViewport.addEventListener('resize', fit);
fit(); render();

document.addEventListener('mouseover', e => { const tp = $('tip'); if (!tp) return; const el = e.target.closest && e.target.closest('.tl[data-t]');
  if (!el || !G || !AS.remain) { tp.hidden = true; return; } const t = +el.dataset.t, n = Math.max(0, 4 - visibleCounts(G, me())[t]), sr = $('stage').getBoundingClientRect(), r = el.getBoundingClientRect(), sc = sr.width / 1280;
  tp.innerHTML = `${tName(t)} · 남은 <b>${n}</b>장`; tp.style.left = (r.left + r.width / 2 - sr.left) / sc + 'px'; tp.style.top = (r.top - sr.top) / sc - 28 + 'px'; tp.hidden = false; });

function pfRefresh() { renderModal(); if (!G) renderSetup(); else render(); }
document.addEventListener('change', async e => { const el = e.target.closest && e.target.closest('[data-up]'); if (!el || !el.files[0]) return;
  const r = await PF.setImg('me', el.dataset.up, el.files[0]); if (r === 'full') toast('저장 공간이 부족합니다 · 더 작은 이미지를 올려 주세요'); else if (!r) toast('이미지를 읽지 못했습니다'); pfRefresh(); });
document.addEventListener('input', e => { if (e.target.id !== 'pfnick') return; PF.d.nick = e.target.value.trim().slice(0, 10) || '나'; PF.save(); if (!G) renderSetup(); });

/* ── 컷인 (퐁 · 치 · 깡 · 리치 · 론 · 쯔모) ── */
let CUT = null;
function cutCheck() {
  if (!G) return; const snap = { gid: G.gid, hand: G.handNo + ':' + G.honba + ':' + G.kyoku + ':' + G.wind, melds: G.seats.map(S => S.melds.length), riichi: G.seats.map(S => !!S.riichi), end: G.phase === 'end', over: !!G.over };
  const P = CUT; CUT = snap; if (window.botTalk) botTalk(P, snap); if (!P || P.gid !== snap.gid || P.hand !== snap.hand) return;
  if (snap.end && !P.end && G.result && G.result.type === 'win') { const R = G.result; return showCut(R.k, R.tsumo ? '쯔모' : '론', 'win'); }
  for (let s = 0; s < G.n; s++) {
    if (snap.riichi[s] && !P.riichi[s]) return showCut(s, '리치', 'riichi');
    if (snap.melds[s] > P.melds[s]) { const k = G.seats[s].melds[snap.melds[s] - 1].k; return showCut(s, k === 'chi' ? '치' : k === 'pon' ? '퐁' : '깡', 'call'); } }
}
function showCut(s, word, kind) {
  const old = document.querySelector('.cut'); if (old) old.remove();
  const sk = skinOf(s), d = document.createElement('div'); d.className = 'cut ' + kind;
  d.innerHTML = `<div class="band"></div><div class="who">${standHTML(charOf(s), sk.stand, 'cutst', sk.pos)}</div><div class="word">${word}</div><div class="nm">${esc(G.seats[s].name)}</div>`;
  $('stage').appendChild(d); setTimeout(() => d.remove(), kind === 'win' ? 1700 : 1150);
}
/* ── 스탠딩 보이는 영역 편집 ── */
let DRAG = null;
const posOf = () => PF.standPos('me');
function applyPos() { const im = document.querySelector('.pfg>.stand img'); if (im) im.setAttribute('style', posStyle(posOf())); document.querySelectorAll('[data-pos]').forEach(el => { el.value = posOf()[el.dataset.pos]; }); }
document.addEventListener('pointerdown', e => { const el = e.target.closest && e.target.closest('.pfg>.stand.img'); if (!el) return; e.preventDefault(); DRAG = { x: e.clientX, y: e.clientY, p: Object.assign({}, posOf()), w: el.getBoundingClientRect() }; });
addEventListener('pointermove', e => { if (!DRAG) return; const p = posOf(), k = 100 / DRAG.p.z;
  p.x = Math.max(0, Math.min(100, DRAG.p.x - (e.clientX - DRAG.x) / DRAG.w.width * k)); p.y = Math.max(0, Math.min(100, DRAG.p.y - (e.clientY - DRAG.y) / DRAG.w.height * k)); applyPos(); });
addEventListener('pointerup', () => { if (DRAG) { DRAG = null; PF.save(); } });
document.addEventListener('wheel', e => { const el = e.target.closest && e.target.closest('.pfg>.stand.img'); if (!el) return; e.preventDefault(); const p = posOf(); p.z = Math.max(1, Math.min(3, +(p.z - e.deltaY * 0.0015).toFixed(2))); applyPos(); PF.save(); }, { passive: false });
document.addEventListener('input', e => { const el = e.target.closest && e.target.closest('[data-pos]'); if (!el) return; posOf()[el.dataset.pos] = +el.value; applyPos(); PF.save(); });
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-posreset]')) { PF.d.standPos.me = { x: 50, y: 0, z: 1 }; PF.save(); applyPos(); } });

/* ── 텐파이 대기패 ── */
let HOV = null;
function waitsHTML() {
  if (!AS.waits || !G || G.phase === 'end' || G.over) return '';
  const m = me(), S = G.seats[m], c = cnt(S.hand), fm = S.melds.length, al = allowedT(G), V = visibleCounts(G, m), left = x => Math.max(0, 4 - V[x]);
  const bar = (lb, w, furi) => `<div class="wb"><b>${lb}</b>${w.map(x => `<span class="wt">${tileT(x, 'S')}<i>${left(x)}</i></span>`).join('')}<em>${w.length}종 ${w.reduce((a, x) => a + left(x), 0)}장</em>${furi ? '<span class="ng">후리텐</span>' : ''}</div>`;
  if (S.hand.length % 3 === 1) return shanten(c, fm) === 0 ? bar('텐파이 · 대기', waitsOf(c, fm, al), isFuriten(G, m)) : '';
  if (G.phase !== 'discard' || G.turn !== m) return '';
  const opts = [];
  [...new Set(S.hand.map(tT))].forEach(t => { if ((S.kuikae || []).includes(t) || (S.riichi && t !== tT(S.drawn))) return; c[t]--;
    if (shanten(c, fm) === 0) { const w = waitsOf(c, fm, al); opts.push({ t, w, n: w.reduce((a, x) => a + left(x), 0) }); } c[t]++; });
  if (!opts.length) return ''; opts.sort((a, b) => b.n - a.n);
  const o = opts.find(x => x.t === HOV) || opts[0];
  return bar(`${tileT(o.t, 'S')} 버리면`, o.w) + (opts.length > 1 ? `<span class="wx">텐파이 되는 버림 ${opts.length}가지<br>손패에 마우스를 올려 비교</span>` : '');
}
document.addEventListener('mouseover', e => { const el = e.target.closest && e.target.closest('#hand [data-d]'); if (!el || !G) return; const t = tT(+el.dataset.d); if (t === HOV) return; HOV = t; const w = $('waits'); if (w) w.innerHTML = waitsHTML(); });
/* ── 울기 추천 ── */
const hanPt = h => { const T = [0, 1000, 2000, 3900, 7700, 8000, 12000, 12000, 16000, 16000, 16000, 24000, 24000, 32000]; h = Math.min(13, Math.max(0, h)); const i = Math.floor(h); return T[i] + (T[Math.min(13, i + 1)] - T[i]) * (h - i); };
function estHand(G, m, c, melds, open, redN) {
  const sw = seatW(G, m), rw = 27 + G.wind, yh = t => isDragon(t) || t === sw || t === rw, all = c.slice(); melds.forEach(x => x.ts.forEach(t => all[t]++));
  const Y = [], add = (n, h, p) => { if (p > 0) Y.push({ n, h, p }); }, chiM = melds.filter(x => x.k === 'chi');
  for (let t = 27; t < 34; t++) { if (!yh(t)) continue; const mul = (isDragon(t) ? 1 : 0) + (t === sw ? 1 : 0) + (t === rw ? 1 : 0);
    if (melds.some(x => x.k !== 'chi' && x.t === t) || c[t] >= 3) add('역패 ' + tName(t), mul, 1); else if (c[t] === 2) add('역패 ' + tName(t), mul, 0.4); }
  const yaoH = c.reduce((a, v, t) => a + (isYao(t) ? v : 0), 0); if (!melds.some(x => x.ts.some(isYao)) && yaoH <= 3) add('탕야오', 1, [1, 0.8, 0.55, 0.3][yaoH]);
  const suit = [0, 1, 2].map(k => all.slice(k * 9, k * 9 + 9).reduce((a, v) => a + v, 0)), hon = all.slice(27).reduce((a, v) => a + v, 0), mx = Math.max(...suit), off = suit.reduce((a, v) => a + v, 0) - mx;
  if (off <= 3 && mx >= 6) { const p = [1, 0.7, 0.45, 0.25][off]; if (hon) add('혼일색', open ? 2 : 3, p); else { add('청일색', open ? 5 : 6, p * 0.7); add('혼일색', open ? 2 : 3, p * 0.3); } }
  if (!chiM.length) { const tr = melds.length + c.filter(v => v >= 3).length, pr = c.filter(v => v === 2).length; if (tr + Math.max(0, pr - 1) >= 4) add('또이또이', 2, tr >= 3 ? 0.7 : tr >= 2 ? 0.45 : 0.2); }
  for (let k = 0; k < 3; k++) { const b = k * 9, n = [...Array(9).keys()].filter(r => c[b + r] > 0 || chiM.some(x => x.ts.includes(b + r))).length;
    if (n >= 7 && chiM.every(x => x.t >= b && x.t < b + 9 && (x.t - b) % 3 === 0)) add('일기통관', open ? 1 : 2, n === 9 ? 0.75 : n === 8 ? 0.5 : 0.3); }
  for (let r = 0; r < 7; r++) { const g = [0, 1, 2].map(k => chiM.some(x => x.t === k * 9 + r) ? 3 : [0, 1, 2].filter(d => c[k * 9 + r + d] > 0).length);
    const full = g.filter(v => v === 3).length, near = g.filter(v => v === 2).length; if (full >= 2 && full + near >= 3) add('삼색동순', open ? 1 : 2, full === 3 ? 0.8 : 0.4); }
  const doraT = []; for (let k = 0; k < G.doraN; k++) doraT.push(doraOf(tT(G.ind[2 * k]), G.n === 3));
  const dora = doraT.reduce((a, t) => a + all[t], 0) + redN, yakuH = Y.reduce((a, y) => a + y.p * y.h, 0);
  return { Y: Y.sort((x, y) => y.p * y.h - x.p * x.h), yakuH, dora, route: Y.some(y => y.p >= 0.7) || yakuH >= 0.8 };
}
function speedOf(G, m, c, fm, ban) {
  const V = visibleCounts(G, m), unseen = Math.max(20, V.reduce((a, v) => a + 4 - v, 0)), q = (sh, uk) => ({ sh, uk });
  if (c.reduce((a, v) => a + v, 0) % 3 === 1) { const sh = shanten(c, fm); return q(sh, ukeire(G, m, c, fm, sh)); }
  let best = null; for (let t = 0; t < 34; t++) { if (!c[t] || t === ban) continue; c[t]--; const sh = shanten(c, fm), uk = ukeire(G, m, c, fm, sh); c[t]++;
    if (!best || sh < best.sh || (sh === best.sh && uk > best.uk)) best = { sh, uk, cut: t }; }
  return best || q(8, 0);
}
function winP(G, sp, open) { const V = visibleCounts(G, me()), unseen = Math.max(20, V.reduce((a, v) => a + 4 - v, 0)), left = Math.max(2, G.wall.length / G.n);
  if (sp.sh < 0) return 1; const U = [7, 18, 30, 42, 54, 66, 78], sp1 = open ? 1.3 : 1;
  let need = 0; for (let k = sp.sh; k >= 0; k--) { const u = k === sp.sh ? Math.max(1, sp.uk) : U[k]; need += unseen / u / (k === 0 ? 2.5 : 1) / (k === sp.sh ? 1 : sp1); }
  return Math.max(0, Math.min(0.95, Math.exp(-need / (left * 1.1)))); }
function callAdvice(m) {
  const S = G.seats[m], o = G.pend.opts[m], t = tT(G.last.id), c = cnt(S.hand), fm = S.melds.length, dealer = m === G.dealer ? 1.5 : 1;
  if (o.some(x => x.t === 'ron')) return { pick: 'ron', label: '론', why: '지금 화료할 수 있어요', rows: [] };
  const baseM = S.melds.map(x => ({ k: x.k, t: x.t, ts: x.ids.map(tT) })), wasOpen = S.melds.some(x => x.k !== 'ankan'), myRed = S.hand.concat(...S.melds.map(x => x.ids)).filter(isRed).length;
  const shL = s => s < 0 ? '화료' : s === 0 ? '텐파이' : s + '샹텐';
  const evalOpt = (k, label, rm, meld, extraH) => {
    const c2 = c.slice(); rm.forEach(x => c2[x]--); const ms = meld ? baseM.concat([meld]) : baseM, open = wasOpen || !!meld;
    const sp = speedOf(G, m, c2, ms.length, meld && meld.k !== 'minkan' ? t : -1), E = estHand(G, m, c2, ms, open, myRed + (meld && isRed(G.last.id) ? 1 : 0));
    const dis = Math.pow(open ? 0.92 : 0.85, Math.max(0, sp.sh)); let han = E.Y.reduce((a, y) => a + y.h * (y.p >= 1 ? 1 : y.p * dis), 0) + E.dora + (extraH || 0), ok = true;
    if (!open) han += 1.5; else if (!E.route) ok = false;
    const p = ok ? winP(G, sp, open) : 0, pt = hanPt(Math.max(1, han)) * dealer, ev = p * pt, sc = p * (pt + 3500);
    const yk = (!open ? ['리치'] : []).concat(E.Y.filter(y => y.p >= 0.4).slice(0, 2).map(y => y.n)).concat(E.dora ? ['도라' + E.dora] : []);
    return { k, label, sp, han, p, pt, ev, sc, ok, yk };
  };
  const C = [evalOpt('pass', '패스', [], null)];
  if (o.some(x => x.t === 'pon')) C.push(evalOpt('pon', '퐁', [t, t], { k: 'pon', t, ts: [t, t, t] }));
  o.filter(x => x.t === 'chi').forEach((x, j) => { const ts = x.ids.map(tT).concat([t]).sort((a, b) => a - b); C.push(evalOpt('chi' + j, '치 ' + x.ids.map(i => tName(tT(i))).join('·'), x.ids.map(tT), { k: 'chi', t: ts[0], ts })); });
  if (o.some(x => x.t === 'minkan')) C.push(evalOpt('minkan', '깡', [t, t, t], { k: 'minkan', t, ts: [t, t, t, t] }, 0.3));
  const P = C[0], best = C.slice().sort((a, b) => b.sc - a.sc)[0];
  const rows = C.map(x => `<span class="${x === best ? 'on' : ''}"><b>${x.label}</b> ${shL(x.sp.sh)} · 유효 ${x.sp.uk}장 · ${x.ok ? `약 ${Math.round(x.han * 10) / 10}판${x.yk.length ? ' (' + x.yk.join('·') + ')' : ''} · 화료율 ${Math.round(x.p * 100)}% · 기대 ${Math.round(x.ev / 100) * 100}점` : '울면 역 없음 · 화료 불가'}</span>`);
  let why;
  if (best.k === 'pass') { const alt = C.slice(1).sort((a, b) => b.sc - a.sc)[0];
    why = !alt.ok ? '울고 나면 역이 없어 화료할 수 없어요' : alt.sp.sh >= P.sp.sh && alt.sp.uk <= P.sp.uk ? '울어도 손이 빨라지지 않아요' : `울면 빨라지지만 타점이 ${Math.round(P.han)}판 → ${Math.round(alt.han)}판으로 떨어져 손해예요`; }
  else why = best.sp.sh < P.sp.sh || best.sp.uk > P.sp.uk ? `${best.sp.sh < P.sp.sh ? `${shL(P.sp.sh)} → ${shL(best.sp.sh)}` : `유효패 ${P.sp.uk} → ${best.sp.uk}장`}${best.han >= P.han - 0.5 ? ', 타점도 유지돼요' : `. 타점은 줄지만 화료율이 ${Math.round(P.p * 100)}% → ${Math.round(best.p * 100)}%로 올라 상대 화료도 막아요`}` : '역패 · 도라로 타점이 올라요';
  return { pick: best.k, label: best.label, why, rows };
}
/* ── 족보 ── */
const tp = s => { const out = []; let buf = []; for (const ch of s) { if (/\d/.test(ch)) buf.push(+ch); else { const b = { m: 0, p: 9, s: 18, z: 26 }[ch] + (ch === 'z' ? 0 : -1); buf.forEach(d => out.push(b + d)); buf = []; } } return out; };
const JOKBO = [
  ['1판', [['리치', '멘젠', '멘젠으로 텐파이하면 1000점을 걸고 선언. 이후 손패를 바꿀 수 없어요', ''], ['일발', '멘젠', '리치 후 한 바퀴 안에(누가 울기 전) 화료', ''], ['멘젠 쯔모', '멘젠', '울지 않고 직접 뽑아서 화료', ''], ['핑후', '멘젠', '슌쯔 4개 + 역패 아닌 머리 + 양면 대기', '123m456m789p234s55s'], ['탕야오', '1 · 울어도 1', '1·9·자패 없이 2~8 수패만으로', '234m22567p345678s'], ['이페코', '멘젠', '같은 슌쯔 2세트', '112233m456p789s55z'], ['역패', '1 · 울어도 1', '백·발·중, 자풍, 장풍을 3장. 한 세트마다 1판', '123m456p789s11s555z'], ['해저 · 하저', '1 · 울어도 1', '마지막 패를 쯔모(해저) 또는 마지막 버림패로 론(하저)', ''], ['영상개화', '1 · 울어도 1', '깡 후 보충패로 화료', ''], ['창깡', '1 · 울어도 1', '다른 사람이 가깡하는 패로 론', '']]],
  ['2판', [['더블 리치', '멘젠', '첫 버림패에 리치 (누구도 울기 전)', ''], ['치또이츠', '멘젠', '서로 다른 대자 7쌍', '1133m2255p4477s66z'], ['삼색동순', '2 · 울면 1', '만·통·삭에서 같은 숫자 슌쯔', '12399m123p123456s'], ['일기통관', '2 · 울면 1', '한 종류로 123 · 456 · 789', '123456789m234p55s'], ['찬타', '2 · 울면 1', '모든 몸통과 머리에 1·9·자패 포함', '123789m123p999s11z'], ['또이또이', '2 · 울어도 2', '몸통 4개가 모두 커쯔', '111m555p33999s222z'], ['산안커', '2 · 울어도 2', '울지 않고 만든 커쯔 3개', '222m444p345777s11z'], ['삼색동각', '2 · 울어도 2', '만·통·삭 같은 숫자 커쯔', '333m333p333567s11z'], ['산깡쯔', '2 · 울어도 2', '깡 3개', '1111m2222p3333s456s77z'], ['소삼원', '2 · 울어도 2', '삼원패 중 2개 커쯔 + 1개 머리 (역패 2판 별도)', '123m456p55566677z'], ['혼노두', '2 · 울어도 2', '1·9·자패만으로', '111m999p111s22233z']]],
  ['3판', [['혼일색', '3 · 울면 2', '한 종류 수패 + 자패만', '123345789m11122z'], ['준찬타', '3 · 울면 2', '모든 몸통과 머리에 1·9 수패 포함 (자패 없음)', '123789m123p11789s'], ['량페코', '멘젠', '이페코 2개', '112233m445566p55s']]],
  ['6판', [['청일색', '6 · 울면 5', '한 종류 수패만', '12334556778999m']]],
  ['역만', [['국사무쌍', '멘젠', '1·9·자패 13종 각 1장 + 그중 1장 더', '19m19p19s12345677z'], ['스안커', '멘젠', '울지 않고 만든 커쯔 4개', '111m333p555777s22z'], ['대삼원', '역만', '백·발·중 모두 커쯔', '123m44p555666777z'], ['소사희', '역만', '바람패 중 3개 커쯔 + 1개 머리', '456m11122233344z'], ['대사희', '역만', '바람패 4개 모두 커쯔', '55m111222333444z'], ['자일색', '역만', '자패만으로', '11122255566677z'], ['녹일색', '역만', '2·3·4·6·8삭과 발만으로', '223344666888s66z'], ['청노두', '역만', '1·9 수패만으로', '111999m111999p11s'], ['스깡쯔', '역만', '깡 4개', '1111m2222p3333s4444s55z'], ['구련보등', '멘젠', '한 종류로 1112345678999 + 1장', '11123456789999m'], ['천화 · 지화', '멘젠', '친의 첫 쯔모(천화) / 자의 첫 쯔모(지화)에 화료', '']]]];
function yakuBookHTML() {
  return `<div class="md rules jb"><div class="k">리치 마작 · 역 일람</div><h2>족보</h2>
  <p>화료하려면 <b>역이 최소 1판</b> 있어야 해요. 도라 · 적도라 · 뒷도라는 판수를 더해 주지만 역은 아니에요. <b>멘젠</b> = 울지 않았을 때만 인정.</p>
  <div class="jbs">${[['1~4판', '부수에 따라'], ['5판', '만관 8000 · 친 12000'], ['6~7판', '하네만 12000 · 18000'], ['8~10판', '배만 16000 · 24000'], ['11~12판', '삼배만 24000 · 36000'], ['13판 · 역만', '32000 · 48000']].map(([a, b]) => `<div><b>${a}</b>${b}</div>`).join('')}</div>
  ${JOKBO.map(([g, L]) => `<h3>${g}</h3>${L.map(([n, h, d, ex]) => `<div class="jr"><div><b>${n}</b><span>${h}</span></div><div><p>${d}</p>${ex ? `<div class="jt">${tp(ex).map(t => tileT(t, 'S')).join('')}</div>` : ''}</div></div>`).join('')}`).join('')}
  <div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
