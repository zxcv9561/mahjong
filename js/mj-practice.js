/* MAHJONG — 연습 대국 (패가 미리 정해진 한 판 · 코치 말풍선 · 정해진 행동만 허용 · 전적에 기록 안 됨) */
const PRACTICE = [
  { t: '버리기 → 리치 → 쯔모', d: '외톨이 패를 버려 텐파이를 만들고, 리치를 건 뒤 직접 뽑아 화료합니다.',
    me: '234m567p2s88s99m3z6z', d1: '3s', seq: ['F', 'F', 'F', '4s', 'F', 'F', 'F', 'F', 'F', 'F', 'F', '9m'], fill: '9p1s2z4z1p7z6m5z',
    steps: [
      { a: 'discard', t: '3z', say: '3삭이 들어와 <b>2 · 3삭</b>이 이어졌어요. 이제 <b>서</b>는 짝도 없고 이어질 수도 없는 외톨이입니다. 손패의 <b>서</b>를 눌러 버리세요.', hint: '외톨이 자패인 서를 버려 보세요.' },
      { a: 'discard', t: '6z', r: 1, say: '4삭이 들어와 <b>2 · 3 · 4삭</b> 몸통이 됐어요! 발을 버리면 <b>8삭 · 9만</b>을 기다리는 텐파이입니다. 한 번도 울지 않았으니 <b>리치</b> 버튼을 누른 다음 <b>발</b>을 버리세요.', hint: '먼저 오른쪽 아래 리치 버튼을 누르고, 발을 버리세요.', pre: '상대들이 패를 버리는 중입니다. 내 차례를 기다리세요.' },
      { a: 'tsumo', say: '리치 중에는 뽑은 패가 화료패가 아니면 자동으로 버려집니다. <b>9만</b>이나 <b>8삭</b>을 뽑으면 <b>쯔모</b> 버튼이 나옵니다.', ready: G => G.turn === 0 && G.phase === 'discard' && discardOpts(G, 0).tsumo, readySay: '<b>9만</b>을 뽑았어요! <b>쯔모</b> 버튼을 눌러 화료하세요. 리치 · 멘젠쯔모 두 가지 역이 붙습니다.', hint: '쯔모 버튼을 누르세요.' }],
    end: '첫 화료입니다! <b>외톨이 패 정리 → 텐파이 → 리치 → 쯔모</b>가 가장 기본적인 흐름입니다.' },
  { t: '퐁 → 역패 → 론', d: '삼원패(중)를 퐁해서 역을 만들고, 상대가 버린 패로 론합니다.',
    me: '77z234m456p67s11p9s', d1: '4z', seq: ['7z', 'F', '8s', 'F', 'F', 'F', 'F', 'F'], fill: '1z3z6z9m1s1m2z5z',
    steps: [
      { a: 'discard', t: '4z', say: '방금 뽑은 <b>북</b>은 쓸모가 없어요. <b>북</b>을 버리세요.', hint: '북을 버려 보세요.' },
      { a: 'pon', say: '내 손에 <b>중</b>이 2장 있어요. 누가 중을 버리면 <b>퐁</b>할 수 있습니다.', ready: G => G.phase === 'call' && G.pend && (G.pend.opts[0] || []).some(o => o.t === 'pon'), readySay: '오른쪽 상대가 <b>중</b>을 버렸어요! <b>퐁</b> 버튼을 누르세요. 중 3장은 그 자체로 역(<b>역패</b>)이라, 울어도 화료할 수 있습니다.', hint: '퐁 버튼을 누르세요.' },
      { a: 'discard', t: '9s', say: '퐁을 하면 그 자리에서 1장을 버립니다. <b>9삭</b>을 버리면 <b>5 · 8삭</b>을 기다리는 텐파이예요.', hint: '외톨이인 9삭을 버리세요.' },
      { a: 'ron', say: '이제 누가 <b>5삭</b>이나 <b>8삭</b>을 버리기를 기다립니다.', ready: G => G.phase === 'call' && G.pend && (G.pend.opts[0] || []).some(o => o.t === 'ron'), readySay: '맞은편 상대가 <b>8삭</b>을 버렸어요! <b>론</b> 버튼을 누르세요. 점수는 버린 사람이 혼자 냅니다.', hint: '론 버튼을 누르세요.' }],
    end: '울어서 빠르게 화료했습니다. 울 때는 <b>역패처럼 역이 확실한지</b> 먼저 확인하세요.' },
  { t: '리치에 수비하기', d: '상대가 리치했을 때, 내 손이 멀면 현물(상대가 버린 패)로 안전하게 피합니다.',
    me: '13m7m57p99p468s1s3z4z', d1: '2m', seq: ['F', 'F', '3z', '6m'], s3: '234p456m678p555s6z', rSeat: 3, fill: '9s1z2z5z7z9m',
    steps: [
      { a: 'discard', t: '4z', say: '2만이 들어와 <b>1 · 2 · 3만</b>이 됐어요. 외톨이 <b>북</b>을 버리세요.', hint: '북을 버려 보세요.' },
      { a: 'discard', t: '3z', say: '상대들이 패를 버리는 중입니다.', ready: G => G.seats[3].riichi && G.turn === 0 && G.phase === 'discard', readySay: '<b>왼쪽 상대가 리치</b>했어요! 내 손은 아직 텐파이까지 멉니다. 상대가 방금 버린 <b>서</b>는 <b>현물</b>이라 이 상대에게 절대 론 당하지 않아요. 손패 위 <b>안전 · 주의 · 위험</b> 표시도 확인하고, <b>서</b>를 버리세요.', hint: '리치한 상대가 버린 서(현물)를 버려야 안전합니다.' }],
    end: '잘 막았습니다! 상대가 리치했는데 내 손이 멀면, <b>현물 → 스지 → 여러 장 보인 자패</b> 순서로 버리며 피하세요.' },
];
const PR_BAK = { as: null };
function prStep() { const P = G && G.tut && PRACTICE[G.tut.sc]; return P && P.steps[G.tut.i]; }
function prMatch(st, a) { if (a.t !== st.a) return false; if (st.a === 'discard') { if (tT(a.id) !== tp_(st.t)[0]) return false; if (st.r && !a.riichi) return false; } return true; }
function prStart(k) {
  const P = PRACTICE[k]; forfeitSaved(); if (typeof RANK !== 'undefined') RANK.off();
  PR_BAK.as = PR_BAK.as || Object.assign({}, AS); Object.keys(AS).forEach(x => AS[x] = true);
  const pool = shuffleArr(CHARS.slice()), players = [{ name: PF.d.nick || '나', char: 'me' }].concat([0, 1, 2].map(i => ({ name: `${pool[i].n} · 봇`, bot: true, level: 'low', char: pool[i].id })));
  UI.skins = {}; G = newGame({ n: 4, len: 'ton', aka: false, players }); G.tut = { sc: k, i: 0 };
  const left = [...Array(136).keys()], take = t => { const j = left.findIndex(id => tT(id) === t); if (j < 0) return null; return left.splice(j, 1)[0]; };
  const fill = tp_(P.fill); let fi = 0; const takeF = () => { for (let n = 0; n < 40; n++) { const id = take(fill[fi++ % fill.length]); if (id != null) return id; } return left.shift(); };
  const myH = tp_(P.me).map(take), d1 = take(tp_(P.d1)[0]), s3 = P.s3 ? tp_(P.s3).map(take) : null;
  const seq = P.seq.map(x => x === 'F' ? takeF() : take(tp_(x)[0]));
  const extra = []; for (let n = 0; n < 12; n++) extra.push(takeF());
  shuffleArr(left); G.ind = [take(tp_('8p')[0]), take(tp_('3p')[0])].concat(left.splice(0, 8));
  G.rin = left.splice(0, 4); shuffleArr(left);
  G.seats.forEach(S => Object.assign(S, { hand: [], melds: [], river: [], riichi: 0, rPend: 0, ippatsu: false, furiTmp: false, furiR: false, kita: [], nDisc: 0, drawn: null, kuikae: null }));
  G.seats[0].hand = myH; [1, 2, 3].forEach(s => { G.seats[s].hand = s === 3 && s3 ? s3 : left.splice(0, 13); });
  G.seats.forEach(sortHand); G.seats[0].hand.push(d1); G.seats[0].drawn = d1;
  G.wall = left.concat(extra.reverse(), seq.slice().reverse()); G.doraN = 1; G.turn = 0; G.phase = 'discard'; G.dealer = 0; G.pend = null; G.last = null; G.flags = {};
  G.log = []; mjLog(G, `── 연습 대국 · ${P.t}`);
  UI.modal = null; UI.riichi = false; tutClose(); after();
}
function prExit(toTut) {
  clearTimeout(T); const sc = G && G.tut ? G.tut.sc : 0; G = null; localStorage.removeItem(SAVE_KEY);
  if (PR_BAK.as) { Object.assign(AS, PR_BAK.as); localStorage.setItem(AS_KEY, JSON.stringify(AS)); PR_BAK.as = null; }
  UI.modal = null; if ($('ov')) $('ov').hidden = true; const cb = $('coach'); if (cb) cb.remove();
  if (toTut) { TUT.li = LESSONS.length + sc; TUT.si = 0; tutOpen(); } else renderSetup();
}
function prFinished() { return G && G.tut && (G.phase === 'end' || G.tut.fin); }
function prCoach() {
  let el = $('coach'); if (!G || !G.tut) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'coach'; $('stage').appendChild(el); }
  const P = PRACTICE[G.tut.sc], st = prStep(), k = `연습 대국 ${G.tut.sc + 1} / ${PRACTICE.length} · ${P.t}`;
  let body;
  if (prFinished()) { tutMark('g' + G.tut.sc); body = `<p>${glLink(P.end)}</p><div class="cb-b"><button class="pb" data-pr="again">다시 하기</button>${G.tut.sc < PRACTICE.length - 1 ? '<button class="pb on" data-pr="next">다음 연습 대국</button>' : '<button class="pb on" data-pr="coach">코칭 실전으로</button>'}<button class="pb" data-pr="back">튜토리얼로</button></div>`; }
  else if (st) { const ready = !st.ready || st.ready(G), myTurn = waitingSeats(G).includes(0); body = `<p>${glLink(ready ? (st.readySay || st.say) : st.say)}</p>`;
    if (st.pre && !myTurn) body = `<p>${glLink(st.pre)}</p>`; }
  else body = '<p>상대 차례를 기다리세요.</p>';
  el.innerHTML = `<div class="k">${k}</div>${body}${prFinished() ? '' : '<button class="cb-x" data-pr="back">연습 그만두기</button>'}`;
}
(() => {
  const _ba = botAct; botAct = function (G, s) {
    if (!G.tut) return _ba(G, s); const S = G.seats[s], P = PRACTICE[G.tut.sc];
    if (G.phase === 'call') return { t: 'pass' };
    if (G.phase === 'discard' && S.drawn != null) return { t: 'discard', id: S.drawn, riichi: P.rSeat === s && !S.riichi && riichiOpts(G, s).includes(tT(S.drawn)) ? true : undefined };
    return _ba(G, s);
  };
  const _da = doAct; doAct = function (a) {
    if (!G || !G.tut || isGuest()) return _da(a);
    if (a.t === 'next') return prExit(true);
    const st = prStep(); if (!st || G.tut.fin) return;
    if (a.t === 'pass' && !(st.a === 'pass')) { toast(st.hint); return; }
    if (!prMatch(st, a)) { toast(st.hint || '코치가 말한 행동을 해 보세요'); return; }
    const r = act(G, me(), a); if (!r.ok) { toast(r.why); return; }
    G.tut.i++; if (G.tut.i >= PRACTICE[G.tut.sc].steps.length && PRACTICE[G.tut.sc].steps[G.tut.i - 1].a === 'discard') G.tut.fin = true;
    after();
  };
  const _tk = tick; tick = function () { if (G && G.tut && G.tut.fin) { clearTimeout(T); return; } return _tk.apply(this, arguments); };
  const _rd = render; render = function () { const r = _rd.apply(this, arguments); try { prCoach(); } catch (e) { console.warn(e); } return r; };
  if (PF && PF.record) { const _rc = PF.record; PF.record = function (G) { if (G && G.tut) return; return _rc.apply(this, arguments); }; }
})();
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-pr]'); if (!b) return; const a = b.dataset.pr, sc = G && G.tut ? G.tut.sc : 0;
  if (a === 'back') return prExit(true);
  if (a === 'again') return prStart(sc);
  if (a === 'next') return prStart(sc + 1);
  if (a === 'coach') { prExit(false); return tutCoach(); }
}, true);
