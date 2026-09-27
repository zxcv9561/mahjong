/* MAHJONG — 프로필 · 캐릭터(스킨) · 전적
   지금은 이 기기(localStorage)에 저장합니다. Supabase 연결 시 PF.load / PF.save / PF.img / PF.setImg / PF.record 다섯 곳만 서버용으로 바꿉니다. */
const CHARS = [
  { id: 'haru', n: '하루', h: '春', c: '#C8252C', d: '공격형 · 리치 한 방' },
  { id: 'yeon', n: '연', h: '蓮', c: '#2E8B3D', d: '침착한 수비형' },
  { id: 'seol', n: '설', h: '雪', c: '#1E4DDB', d: '계산 빠른 핑후파' },
  { id: 'ryu', n: '류', h: '龍', c: '#0A0A0C', d: '역만을 노리는 승부사' },
  { id: 'mio', n: '미오', h: '澪', c: '#6B3FA0', d: '치또이츠 애호가' },
  { id: 'gang', n: '강', h: '剛', c: '#9A5418', d: '울기 좋아하는 속공파' },
  { id: 'rin', n: '린', h: '凛', c: '#0F6E72', d: '혼일색 장인' },
  { id: 'dal', n: '달', h: '月', c: '#E0B028', fg: '#0A0A0C', d: '운에 맡기는 낙천가' }];
const CH = Object.fromEntries(CHARS.map(c => [c.id, c]));
/* 내 프로필: 캐릭터 고르기 없이 한 프로필(id "me"). 이미지가 없을 때는 닉네임 첫 글자 + 고른 색으로 표시 */
const ME_COLORS = ['#2B2A27', '#C8252C', '#1F4E9A', '#0F6E72', '#6A3D9A', '#B5651D'];
const meChar = (name, color) => ({ id: 'me', n: name || '나', h: String(name || '나').slice(0, 1), c: color || ME_COLORS[0], d: '내 프로필' });
Object.defineProperty(CH, 'me', { get: () => meChar(PF.d.nick, PF.d.color), enumerable: false });
const YAKU_ALL = ['리치', '더블 리치', '일발', '멘젠 쯔모', '핑후', '탕야오', '이페코', '역패', '자풍', '장풍', '해저로월', '하저로어', '영상개화', '창깡', '치또이츠', '삼색동순', '일기통관', '찬타', '또이또이', '산안커', '산깡쯔', '삼색동각', '혼노두', '소삼원', '혼일색', '준찬타', '량페코', '청일색',
  '국사무쌍', '스안커', '대삼원', '소사희', '자일색', '녹일색', '청노두', '스깡쯔', '구련보등', '천화', '지화', '대사희', '스안커 단기', '국사무쌍 13면', '순정 구련보등'];
const YM_SET = new Set(YAKU_ALL.slice(28));
const PF_KEY = 'mj-profile-v1';
const PF = {
  blank: () => ({ games: 0, hands: 0, wins: 0, tsumo: 0, dealin: 0, riichi: 0, calls: 0, winPts: 0, maxPts: null, rank4: [0, 0, 0, 0], rank3: [0, 0, 0], yaku: {}, ym: [], best: null, recent: [], lastHand: '', lastGame: '' }),
  load() { let d = null; try { d = JSON.parse(localStorage.getItem(PF_KEY) || 'null'); } catch (e) {} this.d = Object.assign({ nick: '나', char: 'haru', standPos: {} }, d || {}); this.d.stats = Object.assign(this.blank(), this.d.stats || {}); this.migrateMe(); },
  migrateMe() {   // 예전 버전(캐릭터 8종)에서 쓰던 이미지 · 위치를 한 프로필로 옮김
    const old = this.d.char; if (old && old !== 'me' && CH[old]) { ['face', 'stand'].forEach(k => { const v = localStorage.getItem(`mj-skin-${old}-${k}`); if (v && !localStorage.getItem(`mj-skin-me-${k}`)) { try { localStorage.setItem(`mj-skin-me-${k}`, v); } catch (e) {} } });
      if (this.d.standPos[old] && !this.d.standPos.me) this.d.standPos.me = this.d.standPos[old]; if (this.d.skinUrls && this.d.skinUrls[old] && !this.d.skinUrls.me) this.d.skinUrls.me = this.d.skinUrls[old]; }
    this.d.char = 'me'; },
  save() { try { localStorage.setItem(PF_KEY, JSON.stringify(this.d)); } catch (e) {} },
  standPos(ch) { return this.d.standPos[ch] || (this.d.standPos[ch] = { x: 50, y: 0, z: 1 }); },
  img(ch, kind) { return localStorage.getItem(`mj-skin-${ch}-${kind}`); },
  clearImg(ch, kind) { localStorage.removeItem(`mj-skin-${ch}-${kind}`); },
  setImg(ch, kind, file) {
    return new Promise(res => { const fr = new FileReader(); fr.onerror = () => res(false);
      fr.onload = () => { const im = new Image(); im.onerror = () => res(false);
        im.onload = () => { const cv = document.createElement('canvas'), x = cv.getContext('2d');
          if (kind === 'face') { const S = 192, m = Math.min(im.width, im.height); cv.width = cv.height = S; x.drawImage(im, (im.width - m) / 2, (im.height - m) * 0.25, m, m, 0, 0, S, S); }
          else { const k = Math.min(1, 440 / im.width, 760 / im.height); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); x.drawImage(im, 0, 0, cv.width, cv.height); }
          let url = cv.toDataURL('image/webp', 0.86); if (!url.startsWith('data:image/webp')) url = kind === 'face' ? cv.toDataURL('image/jpeg', 0.88) : cv.toDataURL('image/png');
          try { localStorage.setItem(`mj-skin-${ch}-${kind}`, url); res(true); } catch (e) { res('full'); } };
        im.src = fr.result; };
      fr.readAsDataURL(file); });
  },
  record(G, m) {
    if (!G || m == null || !G.seats[m]) return; const st = this.d.stats, gid = G.gid || 'local', key = gid + ':' + G.handNo + ':' + G.honba + ':' + G.kyoku + ':' + G.wind; let ch = false;
    if (G.phase === 'end' && G.result && st.lastHand !== key) { st.lastHand = key; ch = true; const S = G.seats[m], R = G.result; st.hands++;
      if (S.riichi) st.riichi++; if (S.melds.some(x => x.k !== 'ankan')) st.calls++;
      if (R.type === 'win') { let dealt = false;
        [R].concat(R.more || []).forEach(x => {
          if (x.k === m) { const r = x.r, p = x.pay[m]; st.wins++; if (x.tsumo) st.tsumo++; st.winPts += p;
            r.yaku.map(y => y[0]).filter(n => !/도라/.test(n)).forEach(n => { const k = n.replace(/^(역패|자풍|장풍) .*/, '$1'); st.yaku[k] = (st.yaku[k] || 0) + 1; });
            const score = r.ym ? 1e6 * r.ym : r.base;
            if (!st.best || score > st.best.score || (score === st.best.score && p > st.best.pts))
              st.best = { score, pts: p, short: r.ym ? r.label : r.label || `${r.han}판`, label: r.ym ? r.label : `${r.han}판 ${r.fu}부${r.label ? ' · ' + r.label : ''}`, yaku: r.yaku.map(y => `${y[0]} ${typeof y[1] === 'string' ? y[1] : y[1] + '판'}`), hand: x.hand.filter(i => i !== x.winId), melds: x.melds.map(q => q.ids), win: x.winId, date: Date.now() };
            if (r.ym) st.ym.push({ name: r.yaku.map(y => y[0]).join(' · '), date: Date.now() }); }
          else if (x.from === m && !x.tsumo && !dealt) { st.dealin++; dealt = true; } }); } }
    if (G.over && st.lastGame !== gid && G.rank) { st.lastGame = gid; ch = true; const k = G.rank.indexOf(m), S = G.seats[m];
      st.games++; (G.n === 3 ? st.rank3 : st.rank4)[k]++; st.maxPts = Math.max(st.maxPts ?? -1e9, S.pts);
      st.recent.unshift({ d: Date.now(), n: G.n, len: G.len, rank: k + 1, pts: S.pts, who: G.rank.map(i => G.seats[i].name) }); st.recent = st.recent.slice(0, 20); if (G.ranked && typeof RANK !== 'undefined') RANK.apply(G, m); }
    if (ch) this.save();
  }
};
PF.load();

/* ── 표시 ── */
const pct = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '–';
function avgRank(r) { const g = r.reduce((a, v) => a + v, 0); return g ? (r.reduce((a, v, i) => a + v * (i + 1), 0) / g).toFixed(2) : '–'; }
function avHTML(ch, face, px) {
  return face ? `<span class="av" style="width:${px}px;height:${px}px"><img src="${face}" alt=""></span>`
    : `<span class="av" style="width:${px}px;height:${px}px;font-size:${Math.round(px * 0.56)}px;background:${ch.c};color:${ch.fg || '#fff'}">${ch.h}</span>`;
}
const posStyle = p => { p = p || { x: 50, y: 0, z: 1 }; return `object-position:${p.x}% ${p.y}%;transform:scale(${p.z});transform-origin:${p.x}% ${p.y}%`; };
function standHTML(ch, img, cls = '', pos) {
  return img ? `<div class="stand img ${cls}"><img src="${img}" alt="" draggable="false" style="${posStyle(pos)}"></div>`
    : `<div class="stand ph ${cls}" style="background-color:${ch.c};color:${ch.fg || '#fff'}"><b>${ch.h}</b><span>${ch.n}</span><em>스탠딩 이미지 없음</em></div>`;
}
const mySkin = () => ({ face: PF.img('me', 'face'), stand: PF.img('me', 'stand'), pos: PF.standPos('me'), color: PF.d.color || null });
function charOf(s) { const S = G.seats[s]; if (S.char === 'me') { const mine = isGuest() ? s === NET.seat : s === me(); return mine ? CH.me : meChar(S.name, ((UI.skins || {})[s] || {}).color); } return CH[S.char] || CHARS[s % CHARS.length]; }
function skinOf(s) { const mine = isGuest() ? s === NET.seat : s === me(); return mine ? mySkin() : (UI.skins || {})[s] || {}; }
const avatar = (s, px) => avHTML(charOf(s), skinOf(s).face, px);
function allSkins() { const o = Object.assign({}, UI.skins); if (G) o[me()] = mySkin(); return o; }

function pfCardHTML() {
  const s = PF.d.stats, ch = CH[PF.d.char], r = s.rank4.some(Boolean) ? s.rank4 : s.rank3;
  return `<div class="pfc">${standHTML(ch, PF.img(ch.id, 'stand'), 'sm', PF.standPos(ch.id))}<div style="min-width:0"><div class="k">내 프로필</div><div class="nk">${esc(PF.d.nick)}</div>
    <div class="ms"><div>대국<b>${s.games}</b></div><div>평균 순위<b>${avgRank(r)}</b></div><div>화료율<b>${pct(s.wins, s.hands)}</b></div><div>최고 화료<b>${s.best ? esc(s.best.short) : '–'}</b></div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px"><button class="pb" data-m="profile">프로필 · 스킨</button><button class="pb" data-m="stats">전적 보기</button><button class="pb" data-m="rank">랭크</button><button class="pb" data-m="yakubook">족보</button><button class="pb" data-m="juke">음악</button>${window.CLOUD && CLOUD.admin ? '<button class="pb" data-m="bots">봇 편집</button>' : ''}</div></div></div>`;
}
const pfTabs = on => `<div class="seg" style="width:520px;margin:10px 0 14px">${[['profile', '프로필 · 스킨'], ['lines', '대사']].concat(window.CLOUD && CLOUD.admin ? [['bots', '봇 편집']] : []).concat([['stats', '전적']]).map(([k, n]) => `<button class="${on === k ? 'on' : ''}" data-m="${k}">${n}</button>`).join('')}</div>`;
function profileHTML() {
  const ch = CH[PF.d.char], face = PF.img(ch.id, 'face'), st = PF.img(ch.id, 'stand');
  return `<div class="md pf"><div class="k">내 프로필</div>${pfTabs('profile')}<div class="pfg">${standHTML(ch, st, '', PF.standPos(ch.id))}<div style="min-width:0">
    <div class="fg"><label>닉네임</label><div style="display:flex;gap:10px;align-items:center">${avHTML(ch, face, 38)}<input id="pfnick" class="pfin" maxlength="10" value="${esc(PF.d.nick)}"></div></div>
    <div class="fg"><label>기본 색 · 이미지가 없을 때 자리와 화료 화면에 쓰입니다</label><div style="display:flex;gap:8px">${ME_COLORS.map(c => `<button class="pb" data-color="${c}" aria-label="${c}" style="width:34px;height:34px;padding:0;background:${c};border:${c === ch.c ? '3px solid var(--ink)' : '1px solid var(--line)'};outline:${c === ch.c ? '2px solid #fff' : 'none'};outline-offset:-5px"></button>`).join('')}</div></div>
    <div class="fg"><label>스킨 · 내 이미지로 바꾸기</label>
      <div class="up"><b>프로필 사진</b><label class="pb">올리기<input type="file" accept="image/*" data-up="face"></label>${face ? '<button class="pb" data-clr="face">기본으로</button>' : ''}<span>정사각형으로 잘립니다 (얼굴이 위쪽)</span></div>
      <div class="up"><b>스탠딩</b><label class="pb">올리기<input type="file" accept="image/*" data-up="stand"></label>${st ? '<button class="pb" data-clr="stand">기본으로</button>' : ''}<span>세로 전신 · 배경 투명 PNG 권장</span></div>${st ? `<div class="crop"><b>보이는 영역</b><span>왼쪽 그림을 끌어서 위치, 휠로 확대</span><label>확대<input type="range" min="1" max="3" step="0.05" data-pos="z" value="${PF.standPos(ch.id).z}"></label><label>가로<input type="range" min="0" max="100" data-pos="x" value="${PF.standPos(ch.id).x}"></label><label>세로<input type="range" min="0" max="100" data-pos="y" value="${PF.standPos(ch.id).y}"></label><button class="pb" data-posreset>처음대로</button></div>` : ''}</div>
    <p style="font-size:12px;color:var(--mut);margin:4px 0 0">로그인하면 서버에, 아니면 이 기기에 저장됩니다. 온라인 방에서는 내 닉네임 · 이미지가 다른 사람에게도 보입니다.</p>
  </div></div><div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
function statsHTML() {
  const s = PF.d.stats, g4 = s.rank4.reduce((a, v) => a + v, 0), g3 = s.rank3.reduce((a, v) => a + v, 0);
  const bars = (r, n) => { const g = r.reduce((a, v) => a + v, 0), mx = Math.max(1, ...r); return g ? `<div class="rk"><span style="grid-column:1/-1;font-weight:800">${n}인 · ${g}판 · 평균 ${avgRank(r)}위</span>${r.map((v, i) => `<span>${i + 1}위</span><i style="width:${v / mx * 100}%"></i><span>${pct(v, g)}</span>`).join('')}</div>` : ''; };
  const keys = YAKU_ALL.concat(Object.keys(s.yaku).filter(k => !YAKU_ALL.includes(k)));
  const b = s.best, tl = id => tile(id, 'S');
  return `<div class="md pf"><div class="k">내 프로필</div>${pfTabs('stats')}<div class="sg2"><div style="min-width:0">
    <div class="stg"><div>대국 수<b>${s.games}</b></div><div>1위율<b>${pct(s.rank4[0] + s.rank3[0], g4 + g3)}</b></div><div>최고 점수<b>${s.maxPts ?? '–'}</b></div><div>역만<b>${s.ym.length}</b></div>
      <div>화료율<b>${pct(s.wins, s.hands)}</b></div><div>방총률<b>${pct(s.dealin, s.hands)}</b></div><div>리치율<b>${pct(s.riichi, s.hands)}</b></div><div>후로율<b>${pct(s.calls, s.hands)}</b></div>
      <div>평균 화료점<b>${s.wins ? Math.round(s.winPts / s.wins) : '–'}</b></div><div>쯔모 비율<b>${pct(s.tsumo, s.wins)}</b></div><div>화료<b>${s.wins}</b></div><div>국 수<b>${s.hands}</b></div></div>
    ${bars(s.rank4, 4)}${bars(s.rank3, 3)}
    <h3 class="sh">최대 역</h3>${b ? `<div class="box"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-family:var(--disp);font-size:22px">${esc(b.label)}</b><b style="font-family:var(--mono)">+${b.pts}</b></div>
      <div class="row" style="margin:8px 0">${b.hand.slice().sort((x, y) => x - y).map(tl).join('')} ${tile(b.win, 'S', 'win')}${b.melds.map(q => `<span class="meld" style="margin-left:6px">${q.map(tl).join('')}</span>`).join('')}</div>
      <div style="font-size:12px;color:var(--mut)">${b.yaku.map(esc).join(' · ')} · ${new Date(b.date).toLocaleDateString('ko-KR')}</div></div>` : '<p class="em">아직 화료 기록이 없습니다.</p>'}
  </div><div style="min-width:0"><h3 class="sh" style="margin-top:0">역 도감 · ${keys.filter(k => s.yaku[k]).length} / ${keys.length}</h3>
    <div class="yz">${keys.map(k => `<span class="${s.yaku[k] ? (YM_SET.has(k) ? 'ym' : '') : 'no'}">${k}${s.yaku[k] ? ' ' + s.yaku[k] : ''}</span>`).join('')}</div>
    <h3 class="sh">최근 대국</h3>${s.recent.length ? `<table class="rc">${s.recent.slice(0, 8).map(r => `<tr><td>${new Date(r.d).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })} · ${r.n}인 ${r.len === 'ton' ? '동풍' : '반장'}</td><td><b>${r.rank}위</b></td><td>${r.pts}</td></tr>`).join('')}</table>` : '<p class="em">아직 끝낸 대국이 없습니다.</p>'}
  </div></div><div class="foot"><button class="go sec" data-a="pfreset">전적 초기화</button><button class="go sec" data-a="close">닫기</button></div></div>`;
}
