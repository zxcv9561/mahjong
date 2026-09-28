/* MAHJONG — 튜토리얼 (단계별 레슨 12개 → 코칭 실전) · 진행은 이 기기에 저장 */
const TUT_KEY = 'mj-tut-v1';
const TUT = { on: false, li: 0, si: 0, pick: [], fb: null, done: JSON.parse(localStorage.getItem(TUT_KEY) || '[]') };
/* 레슨 순서 변경(리치를 퐁 · 치 · 깡, 역 뒤로) → 예전 완료 번호 옮기기 */
if (!localStorage.getItem('mj-tut-ord2')) { const mv = [0, 1, 2, 6, 3, 4, 5, 7, 8, 9, 10, 11]; TUT.done = TUT.done.map(x => typeof x === 'number' ? mv[x] : x); localStorage.setItem(TUT_KEY, JSON.stringify(TUT.done)); localStorage.setItem('mj-tut-ord2', '1'); }
/* "123m456p789s11z" → 패 종류 번호 (m 만 · p 통 · s 삭 · z 동남서북백발중) */
function tp_(s) { const o = []; let buf = []; for (const ch of s) { if (/\d/.test(ch)) buf.push(+ch); else { const b = { m: 0, p: 9, s: 18, z: 27 }[ch]; buf.forEach(n => o.push(b + n - 1)); buf = []; } } return o; }
const tcnt = ts => { const c = new Array(34).fill(0); ts.forEach(t => c[t]++); return c; };
const tnm = t => t >= 27 ? HONOR_KR[t - 27] : (t % 9 + 1) + SUIT_K[Math.floor(t / 9)];
const tRow = (ts, sz, pick) => `<div class="tu-row">${ts.map((t, i) => pick ? `<span class="tu-p ${TUT.pick.includes(i) ? 'sel' : ''}" data-ti="${i}">${tileT(t, sz || 'L', 'nodr')}</span>` : tileT(t, sz || 'L', 'nodr')).join('')}</div>`;
const tGroups = gs => `<div class="tu-row" style="gap:18px">${gs.map(g => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="display:flex;gap:2px">${tp_(g[0]).map(t => tileT(t, 'M', 'nodr')).join('')}</div><span class="tu-cap">${g[1]}</span></div>`).join('')}</div>`;
function discardToTenpai(ts) { return i => { const c = tcnt(ts); c[ts[i]]--; return shanten(c, 0) === 0; }; }
function bestDiscard(ts) { const sh = ts.map((t, i) => { const c = tcnt(ts); c[t]--; return shanten(c, 0); }), m = Math.min(...sh); return i => sh[i] === m; }
function waitOpts(ts, wrong) { const w = waitsOf(tcnt(ts), 0).map(tnm).join(' · '); return [w].concat(wrong); }
function ptsRon(han, fu) { const b = pointsOf(han, fu, 0).base; return Math.ceil(b * 4 / 100) * 100; }

const T_WAIT = tp_('123m456p34s99s555z'), T_14 = tp_('123m456p34s99s555z8m'), T_TRASH = tp_('234m567p13s88s99m4z5m'), T_SAFE = tp_('24m678p345s3z9p5s');
const LESSONS = [
  { t: '패 종류와 몸통 · 머리', s: [
    { x: '마작패는 숫자가 있는 <b>수패</b> 세 종류(만수 · 통수 · 삭수, 각 1~9)와 숫자가 없는 <b>자패</b>로 나뉩니다. 같은 패가 4장씩, 모두 136장입니다. 하나씩 모양을 익혀 봅시다.',
      h: () => tRow(tp_('123456789m'), 'M') + tRow(tp_('123456789p'), 'M') + tRow(tp_('123456789s'), 'M') + tRow(tp_('1234567z'), 'M') },
    { x: '<b>만수(萬)</b>: 위에 한자 숫자(一 二 三 … 九), 아래에 빨간 <b>萬</b> 글자가 있습니다. 위의 한자가 곧 숫자입니다. 一 = 1, 伍 = 5, 九 = 9.',
      h: () => tGroups([['1m', '1만 · 一'], ['2m', '2만 · 二'], ['3m', '3만 · 三'], ['4m', '4만 · 四'], ['5m', '5만 · 伍'], ['6m', '6만 · 六'], ['7m', '7만 · 七'], ['8m', '8만 · 八'], ['9m', '9만 · 九']]) },
    { x: '<b>통수(筒)</b>: 동그란 동전 무늬입니다. <b>동그라미 개수가 숫자</b>입니다. 1통은 커다란 동그라미 하나, 9통은 작은 동그라미 아홉 개입니다.',
      h: () => tGroups([['1p', '1통'], ['2p', '2통'], ['3p', '3통'], ['4p', '4통'], ['5p', '5통'], ['6p', '6통'], ['7p', '7통'], ['8p', '8통'], ['9p', '9통']]) },
    { x: '<b>삭수(索)</b>: 대나무 막대 무늬입니다. <b>막대 개수가 숫자</b>입니다. 단, <b>1삭만 막대 대신 새</b>가 그려져 있어 헷갈리기 쉬우니 꼭 기억하세요.',
      h: () => tGroups([['1s', '1삭 · 새'], ['2s', '2삭'], ['3s', '3삭'], ['4s', '4삭'], ['5s', '5삭'], ['6s', '6삭'], ['7s', '7삭'], ['8s', '8삭'], ['9s', '9삭']]) },
    { x: '<b>자패</b>: 바람패 넷은 한자 <b>東(동) 南(남) 西(서) 北(북)</b>. 삼원패 셋은 아무것도 없는 흰 패 <b>백</b>, 초록 <b>發(발)</b>, 빨간 <b>中(중)</b>입니다. 자패에는 숫자가 없어 서로 이어지지 않습니다.',
      h: () => tGroups([['1z', '동 · 東'], ['2z', '남 · 南'], ['3z', '서 · 西'], ['4z', '북 · 北'], ['5z', '백 · 빈 패'], ['6z', '발 · 發'], ['7z', '중 · 中']]) },
    { x: '이 패는 무엇일까요?', h: () => tRow(tp_('1s')), q: ['1삭', '1통', '백'], a: 0, w: '새 그림은 1삭입니다. 삭수 중 1삭만 막대 대신 새가 그려져 있습니다.' },
    { x: '이 패는요?', h: () => tRow(tp_('6p')), q: ['6통', '6삭', '6만'], a: 0, w: '동그라미가 6개면 6통입니다.' },
    { x: '목표는 14장으로 <b>몸통 4개 + 머리 1개</b>를 만드는 것입니다. 몸통은 같은 종류 연속 3장(<b>슌쯔</b>)이나 같은 패 3장(<b>커쯔</b>), 머리는 같은 패 2장입니다.',
      h: () => tGroups([['123m', '슌쯔'], ['456p', '슌쯔'], ['789s', '슌쯔'], ['555z', '커쯔'], ['11z', '머리']]) },
    { x: '이 세 장은 몸통일까요?', h: () => tRow(tp_('345m')), q: ['슌쯔', '커쯔', '몸통 아님'], a: 0, w: '3 · 4 · 5만은 같은 종류 연속 3장이라 슌쯔입니다.' },
    { x: '이 세 장은요?', h: () => tRow(tp_('891s')), q: ['슌쯔', '커쯔', '몸통 아님'], a: 2, w: '9 다음은 1로 이어지지 않습니다. 8 · 9 · 1은 몸통이 아닙니다.' },
    { x: '자패 세 장이 모두 다릅니다.', h: () => tRow(tp_('123z')), q: ['슌쯔', '커쯔', '몸통 아님'], a: 2, w: '자패는 숫자가 없어서 슌쯔를 만들 수 없습니다. 같은 패 3장(커쯔)만 몸통이 됩니다.' }] },
  { t: '쯔모와 버리기', s: [
    { x: '차례가 오면 패산에서 1장을 가져오고(<b>쯔모</b>) 1장을 버립니다. 손패는 늘 13장이고, 버린 패는 내 앞 <b>강</b>에 순서대로 놓입니다. PC에서는 <b>우클릭</b>으로 방금 가져온 패를 바로 버릴 수 있습니다.' },
    { x: '5만을 가져와 14장이 됐습니다. 가장 쓸모없는 패를 눌러 버려 보세요.', h: () => tRow(T_TRASH, 'L', 1), p: i => T_TRASH[i] === 30,
      w: '짝도 없고 이어질 수도 없는 외톨이 자패가 가장 먼저 버릴 패입니다. 수패는 옆 숫자가 오면 몸통이 될 수 있어 더 쓸모가 있습니다.' }] },
  { t: '텐파이와 대기', s: [
    { x: '한 장만 더 오면 완성되는 상태를 <b>텐파이</b>라고 합니다. 텐파이까지 몇 장 남았는지를 <b>샹텐</b>이라고 부릅니다(1샹텐 = 한 장 더 바꾸면 텐파이).' },
    { x: '이 손은 텐파이입니다. 무엇을 기다리고 있을까요?', h: () => tRow(T_WAIT), q: waitOpts(T_WAIT, ['3삭 · 4삭', '5삭', '1삭 · 4삭']), a: 0, w: '3 · 4삭은 양쪽(2삭 · 5삭)으로 이어질 수 있습니다. 이런 대기를 <b>양면</b>이라고 하며 가장 좋은 대기입니다.' },
    { x: '대기 모양: <b>양면</b>(34 → 2·5), <b>간짱</b>(46 → 5), <b>변짱</b>(12 → 3), <b>샤보</b>(두 쌍 중 하나가 커쯔로), <b>단기</b>(머리 한 장). 기다리는 종류와 남은 장수가 많을수록 유리합니다.',
      h: () => tGroups([['34s', '양면'], ['46s', '간짱'], ['12s', '변짱'], ['5588p', '샤보'], ['7z', '단기']]) },
    { x: '14장입니다. 무엇을 버리면 텐파이가 될까요?', h: () => tRow(T_14, 'L', 1), p: discardToTenpai(T_14), w: '8만은 어디에도 이어지지 않습니다. 8만을 버리면 2 · 5삭을 기다리는 텐파이가 됩니다.' }] },
  { t: '론과 쯔모', s: [
    { x: '화료 방법은 두 가지입니다. 내가 가져온 패로 완성하면 <b>쯔모</b>(나머지 모두가 나눠서 냄), 남이 버린 패로 완성하면 <b>론</b>(버린 사람 혼자 냄)입니다.' },
    { x: '이 손은 2 · 5삭 대기입니다. 상대가 5삭을 버렸습니다.', h: () => tRow(T_WAIT), q: ['론', '그냥 넘긴다'], a: 0, w: '기다리던 패가 나왔으니 론입니다. 이 손은 <b>백</b> 3장(<b>역패</b>라는 <b>역</b>)이 있어 화료할 수 있습니다. 역은 뒤 레슨에서 배웁니다.' }] },
  { t: '퐁 · 치 · 깡', s: [
    { x: '남이 버린 패를 가져와 몸통을 만드는 것을 <b>울기</b>라고 합니다. 방법은 세 가지입니다.<br><b>퐁</b>: 누가 버린 패든 내 손의 같은 패 2장과 합쳐 커쯔를 만듭니다.<br><b>치</b>: <b>내 왼쪽(바로 앞 차례) 사람</b>이 버린 패로만 슌쯔를 만듭니다.<br><b>깡</b>: 같은 패 4장. 패를 1장 더 가져오고 <b>도라</b>(보너스 패)가 하나 늘어납니다.' },
    { x: '한 번도 울지 않은 손을 <b>멘젠</b>이라고 합니다. 한 번이라도 퐁 · 치 · 명깡을 하면 멘젠이 깨집니다. 내 패 4장으로 하는 <b>암깡</b>은 울기가 아니라서 멘젠이 유지됩니다.' },
    { x: '<b>울면</b> 몸통이 빨리 모여 화료가 빨라집니다. 대신 멘젠이 깨져서, 멘젠에서만 되는 <b>역</b>(뒤에서 배울 리치 등)을 쓸 수 없게 됩니다. 울기 전에 무엇을 잃는지 생각해야 합니다.' },
    { x: '맞은편 사람이 4만을 버렸습니다. 손에 2 · 3만이 있습니다. 치할 수 있을까요?', h: () => tRow(tp_('23m')), q: ['할 수 있다', '할 수 없다'], a: 1, w: '치는 왼쪽 사람이 버린 패로만 할 수 있습니다. 퐁은 누구의 패든 됩니다.' },
    { x: '누군가 중을 버렸고, 내 손에 중이 2장 있습니다.', h: () => tRow(tp_('77z')), q: ['퐁할 수 있다', '퐁할 수 없다'], a: 0, w: '퐁은 누구의 패로든 할 수 있습니다. 중 커쯔는 그 자체로 역(역패)이 되어 좋은 퐁입니다.' }] },
  { t: '역이 없으면 못 난다', s: [
    { x: '모양이 완성돼도 <b>역이 1판 이상</b> 있어야 화료할 수 있습니다. 도라는 판수는 올려 주지만 역은 아닙니다.' },
    { x: '역을 만드는 가장 쉬운 방법: 멘젠이면 <b>리치</b>(다음 레슨), 멘젠으로 직접 뽑으면 <b>멘젠쯔모</b>, 2~8 숫자만 쓰면 <b>탕야오</b>, 삼원패 · 내 바람 커쯔면 <b>역패</b>.' },
    { x: '치를 두 번 해서 1만과 9삭이 섞인 텐파이입니다. 역패도 없습니다. 기다리던 패가 나오면?', q: ['론할 수 있다', '론할 수 없다'], a: 1, w: '울어서 리치 · 멘젠쯔모가 없고, 1 · 9가 있어 탕야오도 안 됩니다. 역이 없어서 화료할 수 없습니다. 울기 전에 역이 있는지 먼저 확인하세요.' }] },
  { t: '리치', s: [
    { x: '<b>멘젠</b>(한 번도 울지 않은 손)으로 <b>텐파이</b>가 되면 1000점을 걸고 <b>리치</b>를 선언할 수 있습니다. 리치는 그 자체로 1판짜리 <b>역</b>이라, 역이 없는 손도 리치만 걸면 화료할 수 있습니다. <b>일발</b> · <b>뒷도라</b>라는 보너스 기회도 생깁니다.' },
    { x: '대신 리치 후에는 손패를 바꿀 수 없고, 가져온 패가 화료패가 아니면 그대로 버립니다(이 게임은 자동으로 버립니다).' },
    { x: '퐁을 한 번 한 뒤 텐파이가 됐습니다. 리치할 수 있을까요?', q: ['할 수 있다', '할 수 없다'], a: 1, w: '퐁 · 치 · 명깡을 하면 멘젠이 깨져 리치할 수 없습니다. 암깡은 멘젠이 유지됩니다.' },
    { x: '리치 후 더 좋은 대기를 만들 수 있는 패가 들어왔습니다. 바꿀 수 있을까요?', q: ['바꿀 수 있다', '바꿀 수 없다'], a: 1, w: '리치 후에는 손을 바꿀 수 없습니다. 그래서 리치는 대기가 괜찮을 때 거는 것이 좋습니다.' }] },
  { t: '자주 나오는 역', s: [
    { x: '<b>리치</b>(1) · <b>멘젠쯔모</b>(1) · <b>탕야오</b>(1, 2~8 숫자만) · <b>역패</b>(1, 삼원패나 내 바람 · 장풍 커쯔) · <b>핑후</b>(1, 멘젠에 몸통이 모두 슌쯔이고 양면 대기) · <b>치또이츠</b>(2, 머리 7개) · <b>혼일색</b>(3, 한 가지 수패 + 자패) · <b>청일색</b>(6, 한 가지 수패만).<br>전체 목록은 게임 안 <b>계보</b>에서 볼 수 있습니다.' },
    { x: '완성된 손입니다. 이 손에 반드시 있는 역은?', h: () => tRow(tp_('234m345p567s678s22p')), q: ['탕야오', '혼일색', '역패', '치또이츠'], a: 0, w: '모든 패가 2~8입니다. 탕야오는 울어도 인정됩니다(이 게임 규칙).' },
    { x: '머리 7개로 된 손입니다.', h: () => tRow(tp_('1199m3355p77s1177z')), q: ['핑후', '치또이츠', '역 없음'], a: 1, w: '같은 패 2장씩 7쌍은 치또이츠(2판)입니다. 몸통 4개 + 머리 1개 규칙의 예외입니다.' }] },
  { t: '후리텐', s: [
    { x: '내 대기패 중 하나라도 <b>내가 이미 버린 적이 있으면</b> 론할 수 없습니다. 이를 <b>후리텐</b>이라고 합니다. 쯔모로는 화료할 수 있습니다.' },
    { x: '론할 수 있는 패를 한 번 넘긴 경우에도 다음 내 차례까지 론할 수 없고, 리치 중이라면 그 판 내내 론할 수 없습니다.' },
    { x: '2 · 5삭 대기입니다. 내 강에 5삭이 있습니다. 상대가 2삭을 버렸습니다.', h: () => tRow(T_WAIT), q: ['론할 수 있다', '론할 수 없다'], a: 1, w: '대기 중 5삭을 내가 버렸으므로 후리텐입니다. 2삭이 나와도 론할 수 없고, 직접 뽑아야 화료합니다.' }] },
  { t: '수비 (현물 · 스지)', s: [
    { x: '상대가 <b>리치</b>하면 내 손이 멀 때는 <b>안전한 패</b>부터 버립니다.<br><b>현물</b>: 리치한 사람이 이미 버린 패 → 그 사람에게 론 당하지 않습니다(앞에서 배운 <b>후리텐</b> 때문).<br><b>스지</b>: 4를 버렸다면 1 · 7은 양면으로는 안 맞습니다.<br>자패는 여러 장 보일수록 안전합니다.' },
    { x: '상대가 리치했습니다. 상대의 강이 위, 내 손이 아래입니다. 가장 안전한 패를 골라 보세요.',
      h: () => `<div class="tu-cap" style="margin-bottom:4px">리치한 상대의 강</div>${tRow(tp_('1z9p4m8s2z'), 'M')}<div class="tu-cap" style="margin:10px 0 4px">내 손</div>${tRow(T_SAFE, 'L', 1)}`,
      p: i => T_SAFE[i] === tp_('9p')[0], w: '9통은 상대가 버린 현물이라 가장 안전합니다. 현물이 없으면 스지(상대가 4만을 버렸다면 1 · 7만)나 여러 장 보인 자패를 고릅니다.' }] },
  { t: '도라', s: [
    { x: '패산에 뒤집힌 <b>도라 표시패</b>의 <b>다음 패</b>가 도라입니다. 수패는 9 다음이 1, 바람은 동 → 남 → 서 → 북 → 동, 삼원패는 백 → 발 → 중 → 백. 도라 1장당 1판이지만 역은 아닙니다. 빨간 5(<b>적도라</b>)도 1판입니다. 게임에서는 도라에 금색 표시가 붙습니다.' },
    { x: '표시패가 9만이면 도라는?', h: () => tRow(tp_('9m')), q: ['1만', '8만', '9만'], a: 0, w: '9 다음은 1로 돌아갑니다.' },
    { x: '표시패가 북이면?', h: () => tRow(tp_('4z')), q: ['동', '백', '서'], a: 0, w: '바람은 동 → 남 → 서 → 북 → 동으로 돕니다.' },
    { x: '표시패가 중이면?', h: () => tRow(tp_('7z')), q: ['백', '동', '발'], a: 0, w: '삼원패는 백 → 발 → 중 → 백으로 돕니다.' }] },
  { t: '점수 계산 기초', s: [
    { x: () => `점수는 <b>판</b>(역 + 도라)과 <b>부</b>(손 모양의 기본값)로 정해집니다. 흔한 30부 기준, 자(子)가 론했을 때: 1판 ${ptsRon(1, 30)} · 2판 ${ptsRon(2, 30)} · 3판 ${ptsRon(3, 30)} · 4판 ${ptsRon(4, 30)}.<br>5판 이상은 부와 상관없이 만관 8000 · 하네만 12000 · 배만 16000 · 삼배만 24000 · 역만 32000. <b>친</b>(동가)은 1.5배를 받습니다.` },
    { x: '처음에는 "판이 하나 늘 때마다 점수가 약 두 배"라고 기억하면 됩니다. 화료하면 계산 과정이 한 줄씩 나옵니다.' },
    { x: () => `자가 3판 30부로 론했습니다. 몇 점일까요?`, q: () => [ptsRon(3, 30) + '점', ptsRon(2, 30) + '점', '8000점'], a: 0, w: '3판 30부는 3900점입니다. 여기에 1판만 더하면 7700점까지 올라갑니다.' }] }
];

function tutOpen() { TUT.on = true; TUT.fb = null; TUT.pick = []; tutRender(); }
function tutClose() { TUT.on = false; const el = $('tut'); if (el) el.remove(); }
function tutGo(li) { TUT.li = li; TUT.si = 0; TUT.fb = null; TUT.pick = []; tutRender(); }
function tutMark(li) { if (!TUT.done.includes(li)) { TUT.done.push(li); localStorage.setItem(TUT_KEY, JSON.stringify(TUT.done)); } }
function tutCoach() {
  Object.keys(AS).forEach(k => AS[k] = true); localStorage.setItem(AS_KEY, JSON.stringify(AS));
  Object.assign(UI.cfg, { n: 4, len: 'ton', aka: true, rk: false }); UI.cfg.seats = ['low', 'low', 'low'];
  tutMark('coach'); tutClose(); startGame();
}
function tutRender() {
  let el = $('tut'); if (!el) { el = document.createElement('div'); el.id = 'tut'; $('stage').appendChild(el); }
  const N = LESSONS.length, coach = TUT.li === N + PRACTICE.length, prk = TUT.li >= N && !coach ? TUT.li - N : -1, L = LESSONS[TUT.li], S = L && L.s[TUT.si], v = f => typeof f === 'function' ? f() : f;
  const list = LESSONS.map((l, i) => `<button class="tu-li ${i === TUT.li ? 'on' : ''}" data-tl="${i}"><span class="n">${String(i + 1).padStart(2, '0')}</span><span>${l.t}</span>${TUT.done.includes(i) ? '<span class="ck">완료</span>' : ''}</button>`).join('')
    + PRACTICE.map((P, k) => `<button class="tu-li ${TUT.li === N + k ? 'on' : ''}" data-tl="${N + k}"><span class="n">G${k + 1}</span><span>연습 대국 · ${P.t}</span>${TUT.done.includes('g' + k) ? '<span class="ck">완료</span>' : ''}</button>`).join('')
    + `<button class="tu-li ${coach ? 'on' : ''}" data-tl="${N + PRACTICE.length}"><span class="n">▶</span><span>코칭 실전</span>${TUT.done.includes('coach') ? '<span class="ck">완료</span>' : ''}</button>`;
  let body;
  if (prk >= 0) { const P = PRACTICE[prk]; body = `<div class="k">연습 대국 ${prk + 1} / ${PRACTICE.length}</div><h2>${P.t}</h2><p>${P.d}</p><p>패가 미리 정해진 한 판을 실제 대국 화면에서 둡니다. 화면 위 <b>코치 말풍선</b>이 할 일을 알려 주고, 다른 행동을 하면 힌트가 나옵니다. 상대 봇은 뽑은 패를 그대로 버립니다. 전적에는 기록되지 않습니다.</p><div class="tu-btns"><button class="go" data-tu="prac" data-k="${prk}">연습 대국 시작</button></div>`; }
  else if (coach) body = `<div class="k">마지막 단계</div><h2>코칭 실전</h2><p>배운 것을 실제 대국에서 써 봅니다. <b>4인 동풍전</b>, 상대는 <b>약한 봇 3명</b>이고, 도움 기능이 모두 켜집니다.</p><p>매 순간 할 수 있는 일을 알려 주고, 버릴 패 추천(★), 대기패, 위험패, 퐁 · 치 추천이 함께 나옵니다. 익숙해지면 게임 중 <b>도움</b> 버튼에서 하나씩 끄세요.</p><p class="tu-cap">완료한 레슨 ${TUT.done.filter(x => typeof x === 'number').length} / ${N} · 연습 대국 ${TUT.done.filter(x => /^g/.test(x)).length} / ${PRACTICE.length}</p><div class="tu-btns"><button class="go" data-tu="coach">코칭 실전 시작</button></div>`;
  else {
    const q = S.q && v(S.q), fb = TUT.fb, last = TUT.si === L.s.length - 1, needs = (S.q || S.p) && !(fb && fb.ok);
    body = `<div class="k">레슨 ${TUT.li + 1} / ${N} · ${TUT.si + 1} / ${L.s.length}</div><h2>${L.t}</h2><div class="tu-dots">${L.s.map((_, i) => `<i class="${i < TUT.si ? 'd' : i === TUT.si ? 'c' : ''}"></i>`).join('')}</div>
      <p class="tu-x">${glLink(v(S.x))}</p>${S.h ? `<div class="tu-h">${S.h()}</div>` : ''}
      ${q ? `<div class="tu-q">${q.map((o, i) => `<button class="pb ${fb && fb.i === i ? (fb.ok ? 'ok' : 'ng') : ''}" data-tq="${i}">${o}</button>`).join('')}</div>` : ''}
      ${fb ? `<div class="tu-fb ${fb.ok ? 'ok' : 'ng'}"><b>${fb.ok ? '정답' : '다시 생각해 보세요'}</b> ${fb.ok ? glLink(S.w) : (S.p ? '다른 패를 골라 보세요.' : '')}</div>` : ''}
      <div class="tu-btns">${TUT.si > 0 ? '<button class="go sec" data-tu="prev">이전</button>' : ''}${needs ? '' : `<button class="go" data-tu="next">${last ? (TUT.li === N - 1 ? '레슨 완료 · 연습 대국으로' : '레슨 완료 · 다음 레슨') : '다음'}</button>`}</div>`;
  }
  el.innerHTML = `<div class="tu-side"><div class="k">TUTORIAL</div><h1>처음 배우는 마작</h1><div class="tu-list">${list}</div><button class="go sec" data-gl="" style="height:38px;font-size:15px">용어집</button><button class="go sec" data-tu="exit" style="height:38px;font-size:15px">나가기</button></div><div class="tu-main">${body}</div>`;
}
document.addEventListener('click', e => {
  const c = e.target.closest ? e.target : null; if (!c) return;
  if (c.closest('[data-tut]')) return tutOpen();
  if (!TUT.on) return;
  if (c.closest('#coach')) return;
  const L = LESSONS[TUT.li], S = L && L.s[TUT.si];
  const tl = c.closest('[data-tl]'); if (tl) return tutGo(+tl.dataset.tl);
  const tq = c.closest('[data-tq]'); if (tq && S) { const i = +tq.dataset.tq; TUT.fb = { i, ok: i === S.a }; return tutRender(); }
  const ti = c.closest('[data-ti]'); if (ti && S && S.p) { if (TUT.fb && TUT.fb.ok) return; const i = +ti.dataset.ti, ok = S.p(i); TUT.pick = [i]; TUT.fb = { i: -1, ok }; return tutRender(); }
  const b = c.closest('[data-tu]'); if (!b) return; const a = b.dataset.tu;
  if (a === 'exit') { tutClose(); if (typeof renderSetup === 'function' && !G) renderSetup(); return; }
  if (a === 'coach') return tutCoach();
  if (a === 'prac') return prStart(+b.dataset.k);
  if (a === 'prev') { TUT.si--; TUT.fb = null; TUT.pick = []; return tutRender(); }
  if (a === 'next') { if (TUT.si < L.s.length - 1) { TUT.si++; TUT.fb = null; TUT.pick = []; return tutRender(); } tutMark(TUT.li); return tutGo(TUT.li + 1); }
});
