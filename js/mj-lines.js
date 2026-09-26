/* MAHJONG — 대사 (내 대사 4칸 · 봇 상황 대사) · 봇 정보 편집 */
const BOT_SIT = [['riichi', '리치할 때'], ['win', '화료할 때'], ['dealin', '방총했을 때'], ['top', '1위로 끝났을 때']];
const BOT_DEF_LINES = {
  haru: ['간다, 리치!', '한 방이면 충분해.', '으윽, 너무 서둘렀나…', '역시 공격이 최고야!'],
  yeon: ['…리치.', '조용히, 확실하게.', '제 실수네요.', '끝까지 침착했을 뿐이에요.'],
  seol: ['계산 끝. 리치.', '기대값대로야.', '확률이 나빴어.', '숫자는 거짓말을 안 하지.'],
  ryu: ['리치. 판을 키우지.', '이게 승부다.', '…다음엔 역만이다.', '용은 끝까지 살아남는다.'],
  mio: ['리치예요~', '짝이 딱 맞았네요!', '어머, 그걸 노렸어요?', '오늘은 운이 좋았어요~'],
  gang: ['리치다! 어서 와!', '빠른 게 최고지!', '크, 한 방 먹었네.', '속도가 곧 실력이야!'],
  rin: ['리치. 색은 이미 정해졌어.', '물들었네.', '색을 잘못 읽었어.', '한 가지 색이면 충분해.'],
  dal: ['에라 모르겠다, 리치!', '오예, 운 좋다!', '뭐, 그럴 수도 있지~', '달님이 도와줬나 봐!'] };
const CH_DEF = Object.fromEntries(CHARS.map(c => [c.id, { ...c }]));
const BOT_COLORS = ['#C8252C', '#2E8B3D', '#1E4DDB', '#0A0A0C', '#6B3FA0', '#9A5418', '#0F6E72', '#E0B028'];
function applyBots() { const o = PF.d.bots || {}; CHARS.forEach(c => { const e = o[c.id] || {}; Object.assign(c, CH_DEF[c.id], { n: e.n || CH_DEF[c.id].n, h: e.h || CH_DEF[c.id].h, c: e.c || CH_DEF[c.id].c, d: e.d || CH_DEF[c.id].d }); if (e.c) c.fg = e.c === '#E0B028' ? '#0A0A0C' : undefined; }); }
const botEd = id => ((PF.d.bots = PF.d.bots || {})[id] = PF.d.bots[id] || {});
const botLine = (id, i) => { const e = (PF.d.bots || {})[id]; const v = e && e.lines && e.lines[i]; return v != null && v !== '' ? v : (BOT_DEF_LINES[id] || [])[i] || ''; };
const myLines = () => { const l = PF.d.lines || (PF.d.lines = ['', '', '', '']); while (l.length < 4) l.push(''); return l; };
applyBots();

/* 봇 이미지: 이 기기 기준 · 봇 자리에는 봇 캐릭터 이미지를 씀 */
const _skinOfBase = skinOf;
skinOf = function (s) { const S = G && G.seats[s]; if (S && S.bot && S.char && CH_DEF[S.char]) { const k = 'bot-' + S.char; return { face: PF.img(k, 'face'), stand: PF.img(k, 'stand'), pos: PF.standPos(k) }; } return _skinOfBase(s); };

/* ── 말풍선 ── */
function sayShow(s, text) {
  if (!G || !text || s == null) return; const plate = $('table').querySelectorAll('.plate')[s], st = $('stage'); if (!plate) return;
  document.querySelectorAll(`.say[data-s="${s}"]`).forEach(x => x.remove());
  const sr = st.getBoundingClientRect(), r = plate.getBoundingClientRect(), sc = sr.width / 1280;
  const d = document.createElement('div'); d.className = 'say'; d.dataset.s = s;
  d.innerHTML = `<span class="who">${avatar(s, 20)}<b>${esc(G.seats[s].name)}</b></span><span class="tx">${esc(text)}</span>`;
  st.appendChild(d);
  const cx = (r.left + r.width / 2 - sr.left) / sc, top = (r.top - sr.top) / sc, w = d.offsetWidth, h = d.offsetHeight;
  d.style.left = Math.max(8, Math.min(1272 - w, cx - w / 2)) + 'px'; d.style.top = Math.max(8, top - h - 12) + 'px';
  setTimeout(() => d.classList.add('out'), 2600); setTimeout(() => d.remove(), 3000);
}
window.sayShow = sayShow;
function botSay(s, k, delay) { const S = G.seats[s]; if (!S || !S.bot || !S.char) return; const t = botLine(S.char, BOT_SIT.findIndex(x => x[0] === k)); if (t) setTimeout(() => sayShow(s, t), delay); }
function botTalk(P, snap) {
  if (!P || P.gid !== snap.gid) return;
  if (snap.over && !P.over && G.rank) botSay(G.rank[0], 'top', 900);
  if (P.hand !== snap.hand) return;
  if (snap.end && !P.end && G.result && G.result.type === 'win') { const R = G.result; botSay(R.k, 'win', 1600); if (R.from != null) botSay(R.from, 'dealin', 2900); return; }
  for (let s = 0; s < G.n; s++) if (snap.riichi[s] && !P.riichi[s]) botSay(s, 'riichi', 1100);
}
let SAY_T = 0;
function saySend(i) {
  const t = myLines()[i]; if (!t || !G) return; if (Date.now() - SAY_T < 2500) return toast('잠시 후 다시 말할 수 있습니다'); SAY_T = Date.now();
  const s = me(); sayShow(s, t);
  if (window.NET && NET.ch) try { NET.ch.send({ type: 'broadcast', event: 'say', payload: { s, t } }); } catch (e) {}
}

/* ── 모달 ── */
function sayHTML() {
  const l = myLines(), any = l.some(Boolean);
  return `<div class="md" style="width:460px"><div class="k">대사</div><h2>한마디</h2>
    ${any ? `<div style="display:grid;gap:8px">${l.map((t, i) => t ? `<button class="sayb" data-say="${i}"><em>${i + 1}</em>${esc(t)}</button>` : '').join('')}</div>` : '<p style="font-size:14px">아직 등록한 대사가 없습니다.</p>'}
    <div class="foot"><button class="pb" data-m="lines">대사 편집</button><button class="go sec" data-a="close">닫기</button></div></div>`;
}
function linesHTML() {
  return `<div class="md pf"><div class="k">내 프로필</div>${pfTabs('lines')}
    <p style="font-size:13.5px;margin:0 0 12px">대국 중 오른쪽 위 <b>대사</b> 버튼으로 말할 수 있습니다. 내 자리 위에 말풍선으로 뜨고, 온라인 방에서는 다른 사람에게도 보입니다.</p>
    <div style="display:grid;gap:10px;max-width:560px">${myLines().map((t, i) => `<label class="lnrow"><em>${i + 1}</em><input class="pfin" style="width:100%" maxlength="30" data-line="${i}" value="${esc(t)}" placeholder="대사 ${i + 1} · 30자까지"></label>`).join('')}</div>
    <div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
function botEditHTML() {
  const id = UI.bsel && CH_DEF[UI.bsel] ? UI.bsel : CHARS[0].id, c = CH[id], e = botEd(id), k = 'bot-' + id, face = PF.img(k, 'face'), st = PF.img(k, 'stand');
  const list = CHARS.map(x => `<button class="ch ${x.id === id ? 'on' : ''}" data-bsel="${x.id}">${avHTML(x, PF.img('bot-' + x.id, 'face'), 34)}<b>${esc(x.n)}</b></button>`).join('');
  return `<div class="md pf"><div class="k">내 프로필</div>${pfTabs('bots')}
    <p style="font-size:13px;margin:0 0 12px;color:var(--mut)">봇 이름 · 색 · 이미지 · 대사를 바꿀 수 있습니다. 이 기기(로그인하면 내 계정)에서만 적용되고, 다음 대국부터 반영됩니다. 칸을 비우면 기본값으로 돌아갑니다.</p>
    <div class="chs" style="grid-template-columns:repeat(8,minmax(0,1fr));margin-bottom:14px">${list}</div>
    <div class="pfg" style="grid-template-columns:200px minmax(0,1fr)">${standHTML(c, st, '', PF.standPos(k)).replace('class="stand', 'style="width:200px;height:340px" class="stand')}<div style="min-width:0">
      <div style="display:grid;grid-template-columns:1fr 90px;gap:10px"><div class="fg"><label>이름</label><input class="pfin" style="width:100%" maxlength="8" data-bf="n" value="${esc(e.n || '')}" placeholder="${esc(CH_DEF[id].n)}"></div><div class="fg"><label>한자</label><input class="pfin" style="width:100%" maxlength="1" data-bf="h" value="${esc(e.h || '')}" placeholder="${esc(CH_DEF[id].h)}"></div></div>
      <div class="fg"><label>소개</label><input class="pfin" style="width:100%" maxlength="20" data-bf="d" value="${esc(e.d || '')}" placeholder="${esc(CH_DEF[id].d)}"></div>
      <div class="fg"><label>색</label><div style="display:flex;gap:8px">${BOT_COLORS.map(v => `<button class="pb" data-bcolor="${v}" aria-label="${v}" style="width:30px;height:30px;padding:0;background:${v};border:${v === c.c ? '3px solid var(--ink)' : '1px solid var(--line)'};outline:${v === c.c ? '2px solid #fff' : 'none'};outline-offset:-5px"></button>`).join('')}</div></div>
      <div class="fg"><label>이미지</label>
        <div class="up"><b>프로필 사진</b><label class="pb">올리기<input type="file" accept="image/*" data-bup="face"></label>${face ? '<button class="pb" data-bclr="face">기본으로</button>' : ''}</div>
        <div class="up"><b>스탠딩</b><label class="pb">올리기<input type="file" accept="image/*" data-bup="stand"></label>${st ? '<button class="pb" data-bclr="stand">기본으로</button>' : ''}</div></div>
      <div class="fg"><label>상황 대사 · 봇은 이 상황에서만 말합니다</label><div style="display:grid;gap:6px">${BOT_SIT.map(([, n], i) => `<label class="lnrow"><em style="width:auto;padding:0 8px;white-space:nowrap">${n}</em><input class="pfin" style="width:100%;height:34px;font-size:14px" maxlength="30" data-bl="${i}" value="${esc(((e.lines || [])[i]) || '')}" placeholder="${esc(BOT_DEF_LINES[id][i])}"></label>`).join('')}</div></div>
    </div></div>
    <div class="foot"><button class="pb" data-breset>이 봇 기본값으로</button><button class="go sec" data-a="close">닫기</button></div></div>`;
}

document.addEventListener('click', e => {
  const q = s => e.target.closest && e.target.closest(s); let el;
  if ((el = q('[data-say]'))) { UI.modal = null; renderModal(); return saySend(+el.dataset.say); }
  if ((el = q('[data-bsel]'))) { UI.bsel = el.dataset.bsel; return renderModal(); }
  const id = UI.bsel && CH_DEF[UI.bsel] ? UI.bsel : CHARS[0].id;
  if ((el = q('[data-bcolor]'))) { botEd(id).c = el.dataset.bcolor; applyBots(); PF.save(); return pfRefresh(); }
  if ((el = q('[data-bclr]'))) { PF.clearImg('bot-' + id, el.dataset.bclr); return pfRefresh(); }
  if (q('[data-breset]')) { if (!confirm('이 봇의 이름 · 색 · 대사 · 이미지를 기본값으로 되돌릴까요?')) return; delete PF.d.bots[id]; ['face', 'stand'].forEach(k => PF.clearImg('bot-' + id, k)); applyBots(); PF.save(); return pfRefresh(); }
});
document.addEventListener('input', e => { const t = e.target;
  if (t.dataset.line != null) { myLines()[+t.dataset.line] = t.value.slice(0, 30); return PF.save(); }
  const id = UI.bsel && CH_DEF[UI.bsel] ? UI.bsel : CHARS[0].id;
  if (t.dataset.bf) { botEd(id)[t.dataset.bf] = t.value.trim(); applyBots(); return PF.save(); }
  if (t.dataset.bl != null) { const E = botEd(id); E.lines = E.lines || ['', '', '', '']; E.lines[+t.dataset.bl] = t.value.slice(0, 30); return PF.save(); }
});
document.addEventListener('change', async e => { const el = e.target.closest && e.target.closest('[data-bup]'); if (!el || !el.files[0]) return;
  const id = UI.bsel && CH_DEF[UI.bsel] ? UI.bsel : CHARS[0].id, r = await PF.setImg('bot-' + id, el.dataset.bup, el.files[0]);
  if (r === 'full') toast('저장 공간이 부족합니다 · 더 작은 이미지를 올려 주세요'); else if (!r) toast('이미지를 읽지 못했습니다'); pfRefresh(); });
