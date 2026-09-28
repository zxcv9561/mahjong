/* MAHJONG — 용어집 (튜토리얼 · 코치 말풍선의 굵은 용어를 누르면 설명 · 게임 중 "용어" 버튼) */
const GLOSS = [
  ['패와 손 모양', [
    ['수패', '숫자가 있는 패. 만수 · 통수 · 삭수 세 종류가 각각 1~9.'],
    ['만수', '萬. 위의 한자 숫자(一~九)가 숫자, 아래에 빨간 萬 글자.'],
    ['통수', '筒. 동그라미 개수가 숫자.'],
    ['삭수', '索. 대나무 막대 개수가 숫자. 1삭만 새 그림.'],
    ['자패', '숫자가 없는 패. 바람패(동 · 남 · 서 · 북)와 삼원패(백 · 발 · 중). 서로 이어지지 않음.'],
    ['삼원패', '백 · 발 · 중. 3장 모으면 역패.'],
    ['몸통', '3장 한 묶음. 슌쯔나 커쯔. 화료하려면 보통 4개 필요.'],
    ['머리', '같은 패 2장. 화료하려면 1개 필요.'],
    ['슌쯔', '같은 종류 수패 연속 3장(예: 3 · 4 · 5만).'],
    ['커쯔', '같은 패 3장.'],
    ['강', '내가 버린 패가 순서대로 놓이는 자리.'],
    ['패산', '아직 뽑지 않은 패 더미.']]],
  ['진행', [
    ['쯔모', '① 패산에서 1장 가져오기. ② 그렇게 가져온 패로 화료하기(나머지 모두가 점수를 나눠 냄).'],
    ['론', '남이 버린 패로 화료하기. 버린 사람 혼자 점수를 냄.'],
    ['화료', '손을 완성해서 점수를 받는 것. "난다"고도 함.'],
    ['텐파이', '1장만 더 오면 화료할 수 있는 상태.'],
    ['샹텐', '텐파이까지 남은 장수. 1샹텐 = 한 장 더 바꾸면 텐파이.'],
    ['대기', '텐파이일 때 화료할 수 있는 패. 대기패라고도 함.'],
    ['유효패', '들어오면 샹텐이 줄어드는 패.'],
    ['친', '동가(그 판의 선). 점수를 1.5배 받고 1.5배 냄.'],
    ['자', '친이 아닌 나머지 세 사람.'],
    ['유국', '패산이 다 떨어질 때까지 아무도 화료하지 못한 것.']]],
  ['울기', [
    ['울기', '남이 버린 패를 가져와 몸통을 만드는 것(퐁 · 치 · 명깡). 빨라지지만 멘젠이 깨짐.'],
    ['멘젠', '한 번도 울지 않은 손. 리치 · 멘젠쯔모 · 핑후는 멘젠이어야 함. 암깡은 멘젠 유지.'],
    ['퐁', '누가 버린 패든 내 손의 같은 패 2장과 합쳐 커쯔.'],
    ['치', '내 왼쪽(바로 앞 차례) 사람이 버린 패로만 슌쯔.'],
    ['깡', '같은 패 4장. 1장 더 가져오고 도라가 하나 늘어남. 암깡(내 패 4장) · 명깡(울어서)이 있음.']]],
  ['대기 모양', [
    ['양면', '34처럼 양쪽으로 이어지는 대기(2 · 5). 가장 좋은 대기.'],
    ['간짱', '46처럼 가운데가 빈 대기(5).'],
    ['변짱', '12나 89처럼 한쪽 끝만 열린 대기(3 또는 7).'],
    ['샤보', '두 쌍 중 하나가 커쯔가 되길 기다리는 대기.'],
    ['단기', '머리 1장을 기다리는 대기.']]],
  ['역과 점수', [
    ['역', '화료하려면 1판 이상 꼭 필요한 조건. 도라는 역이 아님.'],
    ['판', '역과 도라로 쌓이는 점수 단위. 1판 늘 때마다 점수가 약 2배.'],
    ['부', '손 모양으로 정해지는 기본값. 흔히 30부.'],
    ['리치', '멘젠 텐파이에서 1000점을 걸고 선언. 1판짜리 역. 이후 손을 바꿀 수 없음.'],
    ['일발', '리치 후 한 바퀴 안에 화료하면 붙는 1판. 누가 울면 사라짐.'],
    ['멘젠쯔모', '멘젠으로 쯔모 화료하면 붙는 1판짜리 역.'],
    ['탕야오', '2~8 숫자만으로 된 손. 1판. 울어도 인정.'],
    ['역패', '삼원패, 내 바람, 장풍(그 판의 바람) 중 하나를 커쯔로. 1판. 울어도 인정.'],
    ['핑후', '멘젠 · 몸통 모두 슌쯔 · 양면 대기 · 머리가 역패 아님. 1판.'],
    ['치또이츠', '머리 7쌍으로 된 손. 2판.'],
    ['혼일색', '한 가지 수패 + 자패만. 3판(울면 2판).'],
    ['청일색', '한 가지 수패만. 6판(울면 5판).'],
    ['만관', '5판 이상. 자 8000점 · 친 12000점.'],
    ['역만', '특별히 어려운 손. 자 32000점.']]],
  ['도라', [
    ['도라', '1장당 1판을 더해 주는 보너스 패. 역은 아님.'],
    ['도라 표시패', '패산에 뒤집혀 있는 패. 이 패의 "다음 패"가 도라.'],
    ['뒷도라', '리치로 화료했을 때만 확인하는 도라 표시패 아래의 패.'],
    ['적도라', '빨간 5. 1장당 1판.']]],
  ['수비', [
    ['후리텐', '내 대기패 중 하나라도 내가 이미 버렸으면 론할 수 없는 상태. 쯔모는 가능.'],
    ['현물', '리치한 사람이 이미 버린 패. 그 사람에게는 절대 론 당하지 않음.'],
    ['스지', '4를 버렸다면 1 · 7처럼, 양면으로는 맞지 않는 패.']]],
];
const GL = new Map(); GLOSS.forEach(([g, list]) => list.forEach(([k, d]) => GL.set(k, { g, d })));
const GL_ALIAS = { '울면': '울기', '울지': '울기', '울어서': '울기', '도라 표시패': '도라 표시패', '대기패': '대기', '양면 대기': '양면', '역이 1판 이상': '역' };
const glKey = s => { s = s.replace(/<[^>]+>/g, '').replace(/\(.*?\)/g, '').trim(); if (GL.has(s)) return s; if (GL_ALIAS[s]) return GL_ALIAS[s]; const m = s.match(/^[가-힣 ]+/); return m && GL.has(m[0].trim()) ? m[0].trim() : null; };
/* <b>용어</b> → 눌러서 설명을 볼 수 있는 링크 */
function glLink(html) { return String(html).replace(/<b>([^<]{1,20})<\/b>/g, (m, s) => { const k = glKey(s); return k ? `<b class="gl" data-gl="${k}">${s}</b>` : m; }); }
const GLS = { on: false, sel: '', q: '' };
function glOpen(k) { GLS.on = true; GLS.sel = k || ''; GLS.q = ''; glRender(true); }
function glClose() { GLS.on = false; const el = $('gloss'); if (el) el.remove(); }
function glRender(scroll) {
  let el = $('gloss'); if (!el) { el = document.createElement('div'); el.id = 'gloss'; $('stage').appendChild(el); }
  const q = GLS.q.trim(), hit = (k, d) => !q || k.includes(q) || d.includes(q);
  const groups = GLOSS.map(([g, list]) => { const l = list.filter(([k, d]) => hit(k, d)); return l.length ? `<div class="gl-g"><h4>${g}</h4>${l.map(([k, d]) => `<div class="gl-i ${GLS.sel === k ? 'on' : ''}" data-gk="${k}"><b>${k}</b><span>${d}</span></div>`).join('')}</div>` : ''; }).join('');
  el.innerHTML = `<div class="gl-box"><div class="gl-h"><div><div class="k">GLOSSARY</div><h2>마작 용어집</h2></div><input class="gl-s" placeholder="용어 검색" value="${esc(GLS.q)}"><button class="pb" data-glx>닫기</button></div><div class="gl-b">${groups || '<p class="tu-cap">찾는 용어가 없습니다.</p>'}</div></div>`;
  const inp = el.querySelector('.gl-s'); inp.oninput = () => { GLS.q = inp.value; GLS.sel = ''; const pos = inp.selectionStart; glRender(); const n = $('gloss').querySelector('.gl-s'); n.focus(); n.setSelectionRange(pos, pos); };
  if (scroll && GLS.sel) { const it = el.querySelector('.gl-i.on'), b = el.querySelector('.gl-b'); if (it && b) b.scrollTop = it.offsetTop - b.offsetTop - 60; }
}
document.addEventListener('click', e => {
  const t = e.target.closest ? e.target : null; if (!t) return;
  const g = t.closest('[data-gl]'); if (g) { e.stopPropagation(); e.preventDefault(); return glOpen(g.dataset.gl); }
  if (!GLS.on) return;
  if (t.closest('[data-glx]') || t.id === 'gloss') { e.stopPropagation(); return glClose(); }
  const i = t.closest('[data-gk]'); if (i) { GLS.sel = i.dataset.gk; glRender(); }
  if (t.closest('#gloss')) e.stopPropagation();
}, true);
document.addEventListener('keydown', e => { if (GLS.on && e.key === 'Escape') glClose(); });
