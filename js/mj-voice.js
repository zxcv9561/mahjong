/* MAHJONG — 보이스팩 (상황별 음성 + 말풍선 · 팩을 고르면 전체가 그 팩으로)
   팩 정보는 봇 정보와 같은 곳(mahjong.bot_config · data._vp)에 저장 · 음성 파일은 mahjong-skins/voice/<팩>/ · 편집은 관리자만.
   한 사람만 말하는 상황만 씁니다(행동한 사람 · 화료한 사람). 비어 있는 상황은 기본 TTS · 기본 문구. */
const VP_SIT = [
  ['행동 선언', [['pon', '퐁'], ['chi', '치'], ['kan', '깡'], ['riichi', '리치'], ['wriichi', '더블리치'], ['ron', '론'], ['tsumo', '쯔모'], ['kita', '북 빼기 (3인)']]],
  ['화료 결과 · 론 · 쯔모 다음에 이어서', [['win', '일반 화료'], ['mangan', '만관'], ['haneman', '하네만'], ['baiman', '배만'], ['sanbaiman', '삼배만'], ['yakuman', '역만'], ['ippatsu', '일발'], ['ura', '뒷도라'], ['comeback', '역전 화료 (1위로)']]],
  ['기타', [['renchan', '친 연장'], ['nagashi', '유국만관'], ['hurry', '제한 시간 임박 (온라인 · 내 화면만)'], ['line1', '대사 1'], ['line2', '대사 2'], ['line3', '대사 3'], ['line4', '대사 4']]],
];
const VP_KEYS = VP_SIT.flatMap(([, l]) => l.map(x => x[0]));
const VP_NAME = Object.fromEntries(VP_SIT.flatMap(([, l]) => l));
const VP_WORD = { '퐁': 'pon', '치': 'chi', '깡': 'kan', '리치': 'riichi', '론': 'ron', '쯔모': 'tsumo' };
const VPS = { vol: +(localStorage.getItem('mj-vp-vol') || 0.9), cache: {}, cur: null, sel: null };
const vpAll = () => (BOTCFG._vp = BOTCFG._vp || {});
const vpGet = id => id && vpAll()[id] || null;
const vpOf = s => { const S = G && G.seats[s]; if (!S) return null; if (S.bot && S.char) return vpGet((BOTCFG[S.char] || {}).voice); return vpGet((skinOf(s) || {}).voice); };
const vpLines = (P, k) => String(((P && P.lines) || {})[k] || '').split(/\n|\s\/\s/).map(x => x.trim()).filter(Boolean);
const pick = a => a[Math.floor(Math.random() * a.length)];
function vpAudio(url) { let a = VPS.cache[url]; if (!a) { a = VPS.cache[url] = new Audio(url); a.preload = 'auto'; } return a; }
function vpPreload() { if (!G) return; for (let s = 0; s < G.n; s++) { const P = vpOf(s); if (P) Object.values(P.audio || {}).flat().forEach(u => vpAudio(u)); } }
/* 재생: 음성이 있으면 true (TTS 생략) · 문구가 있으면 말풍선 */
function vpPlay(s, k, opt = {}) {
  const P = vpOf(s); if (!P) return false; const au = (P.audio || {})[k] || [], tx = vpLines(P, k);
  if (tx.length && !opt.noBubble && window.sayShow) sayShow(s, pick(tx));
  if (!au.length || (typeof VOICE !== 'undefined' && !VOICE.on)) return !!au.length;
  try { if (VPS.cur) VPS.cur.pause(); const a = vpAudio(pick(au)); a.volume = VPS.vol; a.currentTime = 0; VPS.cur = a; a.play().catch(() => {}); } catch (e) {}
  return true;
}
window.vpPlay = vpPlay;
/* 행동 선언: 컷씬(showCut → voSay) 자리에서 팩 음성으로 바꿈 */
(() => { const _vs = voSay; voSay = function (word, s) { let k = VP_WORD[word]; if (!k) return _vs.apply(this, arguments);
  if (k === 'riichi' && G && G.seats[s] && G.seats[s].riichi === 2 && vpPlay(s, 'wriichi')) return;
  if (vpPlay(s, k)) return; return _vs.apply(this, arguments); }; })();
/* 화료 결과 · 친 연장 · 유국만관 · 북 */
let VPC = null;
function vpCheck() {
  if (!G) return; const snap = { gid: G.gid, hand: G.handNo, dealer: G.dealer, end: G.phase === 'end', kita: G.seats.map(S => (S.kita || []).length) };
  const P = VPC; VPC = snap; if (!P || P.gid !== snap.gid) { vpPreload(); return; }
  if (snap.hand !== P.hand) { if (snap.dealer === P.dealer && G.honba > 0) setTimeout(() => vpPlay(G.dealer, 'renchan'), 900); return; }
  for (let s = 0; s < G.n; s++) if (snap.kita[s] > P.kita[s]) vpPlay(s, 'kita');
  if (!snap.end || P.end || !G.result) return; const R = G.result;
  if (R.type === 'draw' && R.nag) { const w = [].concat(R.nag).map((v, i) => v === true ? i : v).filter(v => typeof v === 'number'); if (w.length === 1) setTimeout(() => vpPlay(w[0], 'nagashi'), 600); return; }
  if (R.type !== 'win' || !R.r) return; const r = R.r, names = (r.yaku || []).map(y => y[0]).join(' '), lb = r.label || '';
  const rk = pts => pts.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0] || a[1] - b[1])[0][1];
  const after = G.seats.map(S => S.pts), before = after.map((p, i) => p - ((R.pay || [])[i] || 0));
  const k = r.ym || /역만/.test(lb) ? 'yakuman' : /삼배만/.test(lb) ? 'sanbaiman' : /배만/.test(lb) ? 'baiman' : /하네만/.test(lb) ? 'haneman' : /만관/.test(lb) ? 'mangan'
    : rk(after) === R.k && rk(before) !== R.k ? 'comeback' : /일발/.test(names) ? 'ippatsu' : /뒷도라|우라/.test(names) ? 'ura' : 'win';
  const P2 = vpOf(R.k); if (!P2) return;
  const has = x => ((P2.audio || {})[x] || []).length || vpLines(P2, x).length, key = has(k) ? k : (k !== 'win' && has('win') ? 'win' : null);
  if (key) setTimeout(() => vpPlay(R.k, key), 1500);
}
(() => { const _af = after; after = function () { const r = _af.apply(this, arguments); try { vpCheck(); } catch (e) { console.warn(e); } return r; }; })();
/* 제한 시간 임박 (온라인 · 내 차례 · 남은 5초) */
setInterval(() => { if (!G || !window.NET || !NET.role || !NET.dl) return; const m = me(); if (!waitingSeats(G).includes(m)) { VPS.hk = null; return; }
  const left = NET.dl - Date.now(), key = G.log.length + ':' + G.phase; if (left > 0 && left < 5000 && VPS.hk !== key) { VPS.hk = key; vpPlay(m, 'hurry'); } }, 500);

/* ── 저장 · 업로드 (관리자) ── */
const vpSave = () => botSave();
async function vpUpload(id, k, file) {
  if (!isAdmin() || !file) return false; if (file.size > 3 * 1024 * 1024) { toast('3MB 이하 음성 파일만 올릴 수 있습니다'); return false; }
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, ''), path = `voice/${id}/${k}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}.${ext}`;
  const { error } = await CLOUD.sb.storage.from('mahjong-skins').upload(path, file, { upsert: true, contentType: file.type || 'audio/mpeg' });
  if (error) { toast('업로드 실패 · ' + error.message); return false; }
  const P = vpGet(id); (P.audio = P.audio || {})[k] = (P.audio[k] || []).concat(CLOUD.sb.storage.from('mahjong-skins').getPublicUrl(path).data.publicUrl); vpSave(); return true;
}
function vpRmFile(id, k, i) { const P = vpGet(id), l = (P.audio || {})[k] || [], u = l[i]; if (!u) return; const p = u.split('/mahjong-skins/')[1]; if (p) CLOUD.sb.storage.from('mahjong-skins').remove([p.split('?')[0]]); l.splice(i, 1); vpSave(); }
function vpDelete(id) { const P = vpGet(id); if (!P) return; const ps = Object.values(P.audio || {}).flat().map(u => (u.split('/mahjong-skins/')[1] || '').split('?')[0]).filter(Boolean); if (ps.length) CLOUD.sb.storage.from('mahjong-skins').remove(ps);
  delete vpAll()[id]; Object.keys(BOTCFG).forEach(c => { if (BOTCFG[c] && BOTCFG[c].voice === id) delete BOTCFG[c].voice; }); if (PF.d.voice === id) { PF.d.voice = ''; PF.save(); } vpSave(); }

/* ── 화면 (프로필 → 보이스팩 탭) ── */
function vpCount(P) { let n = 0; VP_KEYS.forEach(k => { if (((P.audio || {})[k] || []).length) n++; }); return n; }
function vpListenHTML(id) { const P = vpGet(id); if (!P) return '';
  return `<div class="vpls"><div class="k" style="margin:10px 0 4px">${esc(P.n || '')} · 상황별 듣기</div>${VP_SIT.map(([g, l]) => `<div class="vplg"><b>${g.split(' · ')[0]}</b>${l.map(([k, n]) => { const au = (P.audio || {})[k] || []; return `<button class="vplb ${au.length ? '' : 'off'}" ${au.length ? `data-vplisten="${id}:${k}"` : 'disabled'}>${au.length ? '▶' : '–'} ${n.replace(/ \(.*\)/, '')}${au.length > 1 ? ` <em>${au.length}</em>` : ''}</button>`; }).join('')}</div>`).join('')}</div>`; }
/* 파일 이름으로 상황 맞추기: ron.mp3 · 론_2.mp3 · 03_riichi.wav 등 */
const VP_ALIAS = Object.assign({}, ...VP_SIT.flatMap(([, l]) => l.map(([k, n]) => ({ [k]: k, [n.replace(/ \(.*\)/, '').replace(/\s/g, '')]: k })) ), { '대사1': 'line1', '대사2': 'line2', '대사3': 'line3', '대사4': 'line4', '북': 'kita', '역전': 'comeback', '연장': 'renchan', '임박': 'hurry' });
function vpMatch(name) { const b = name.replace(/\.[^.]+$/, '').toLowerCase().replace(/\s/g, ''); const keys = Object.keys(VP_ALIAS).sort((a, c) => c.length - a.length); for (const a of keys) if (b.includes(a.toLowerCase())) return VP_ALIAS[a]; return null; }
function voicePackHTML() {
  const packs = Object.entries(vpAll()), mine = PF.d.voice || '', adm = isAdmin(), sel = VPS.sel && vpGet(VPS.sel) ? VPS.sel : null;
  if (VPS.sel == null && mine && vpGet(mine)) VPS.sel = adm ? mine : null;
  const card = (id, n, sub) => `<button class="vpc ${mine === id ? 'on' : ''}" data-vpick="${id}"><b>${esc(n)}</b><span>${sub}</span>${mine === id ? '<em>사용 중</em>' : ''}</button>`;
  let h = `<div class="md pf"><div class="k">내 프로필</div>${pfTabs('voice')}
    <p style="font-size:13.5px;margin:0 0 10px">고른 보이스팩으로 퐁 · 치 · 리치 · 론 · 쯔모와 화료 결과, 대사 1~4의 음성과 말풍선이 모두 바뀝니다. 온라인 방에서는 다른 사람에게도 내 팩으로 들립니다. 비어 있는 상황은 기본 음성으로 나옵니다.</p>
    <div class="vpl">${card('', '기본', '브라우저 TTS 음성')}${packs.map(([id, P]) => card(id, P.n || '이름 없음', `${vpCount(P)} / ${VP_KEYS.length} 상황 녹음`)).join('')}</div>
    ${vpListenHTML(mine)}
    <div class="vpbar"><button class="pb" data-vptest>미리 듣기</button><label>음량 <input type="range" min="0" max="1" step="0.05" value="${VPS.vol}" data-vpvol></label>${adm ? `<span style="flex:1"></span><button class="pb" data-vpnew>새 팩 만들기</button>` : ''}${adm && sel ? `<label class="pb" style="position:relative;overflow:hidden">파일 한꺼번에 올리기<input type="file" accept="audio/*" multiple data-vpbulk style="position:absolute;inset:0;opacity:0;cursor:pointer"></label>` : ''}</div>`;
  if (adm && packs.length) {
    h += `<div class="vpadm"><div class="vph"><b>관리자 · 팩 편집</b><select data-vpsel><option value="">편집할 팩 선택</option>${packs.map(([id, P]) => `<option value="${id}" ${sel === id ? 'selected' : ''}>${esc(P.n || id)}</option>`).join('')}</select></div>`;
    if (sel) { const P = vpGet(sel);
      h += `<div class="vpmeta"><input class="pfin" data-vpn value="${esc(P.n || '')}" maxlength="16" placeholder="팩 이름"><button class="pb" data-vpdel>팩 삭제</button></div>
      <div class="vpbots"><span>봇에게 입히기</span>${CHARS.map(c => `<button class="pb ${(BOTCFG[c.id] || {}).voice === sel ? 'on' : ''}" data-vpbot="${c.id}">${esc(c.n)}</button>`).join('')}</div>
      ${VP_SIT.map(([g, l]) => `<h4>${g}</h4>${l.map(([k, n]) => { const au = (P.audio || {})[k] || [];
        return `<div class="vpr"><em>${n}</em><input class="pfin" data-vpl="${k}" value="${esc((P.lines || {})[k] || '')}" placeholder="말풍선 문구 · 여러 개는 / 로 구분 (비우면 말풍선 없음)"><div class="vpf">${au.map((u, i) => `<span class="vpa"><button data-vpplay="${k}:${i}" title="재생">▶ ${i + 1}</button><button data-vprm="${k}:${i}" title="삭제">×</button></span>`).join('')}<label class="pb">음성 추가<input type="file" accept="audio/*" multiple data-vpup="${k}"></label></div></div>`; }).join('')}`).join('')}`; }
    h += '</div>';
  }
  return h + `<div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}
document.addEventListener('click', e => {
  const q = s => e.target.closest && e.target.closest(s); let el;
  if ((el = q('[data-vpick]'))) { PF.d.voice = el.dataset.vpick; PF.save(); return pfRefresh(); }
  if ((el = q('[data-vplisten]'))) { const [id, k] = el.dataset.vplisten.split(':'), P = vpGet(id); try { const a = vpAudio(pick(P.audio[k])); a.volume = VPS.vol; a.currentTime = 0; a.play(); } catch (err) {} return; }
  if (q('[data-vptest]')) { const P = vpGet(PF.d.voice); if (!P) return voSay('론', 0); const k = ['ron', 'tsumo', 'riichi', 'win'].find(x => ((P.audio || {})[x] || []).length) || VP_KEYS.find(x => ((P.audio || {})[x] || []).length); if (!k) return toast('이 팩에는 아직 음성이 없습니다');
    try { const a = vpAudio(pick(P.audio[k])); a.volume = VPS.vol; a.currentTime = 0; a.play(); } catch (err) {} return; }
  if ((el = q('[data-vpplay]'))) { const [k, i] = el.dataset.vpplay.split(':'), P = vpGet(VPS.sel); try { const a = vpAudio(P.audio[k][+i]); a.volume = VPS.vol; a.currentTime = 0; a.play(); } catch (err) {} return; }
  if (!isAdmin()) return;
  if (q('[data-vpnew]')) { const n = prompt('새 보이스팩 이름', '보이스팩 ' + (Object.keys(vpAll()).length + 1)); if (!n) return; const id = 'vp' + Date.now().toString(36); vpAll()[id] = { n: n.slice(0, 16), lines: {}, audio: {} }; VPS.sel = id; vpSave(); return pfRefresh(); }
  if (q('[data-vpdel]')) { if (!confirm('이 보이스팩과 올린 음성 파일을 모두 지울까요?')) return; vpDelete(VPS.sel); VPS.sel = null; return pfRefresh(); }
  if ((el = q('[data-vprm]'))) { const [k, i] = el.dataset.vprm.split(':'); vpRmFile(VPS.sel, k, +i); return pfRefresh(); }
  if ((el = q('[data-vpbot]'))) { const E = botEd(el.dataset.vpbot); if (E.voice === VPS.sel) delete E.voice; else E.voice = VPS.sel; vpSave(); return pfRefresh(); }
});
document.addEventListener('change', async e => { const t = e.target;
  if (t.dataset.vpsel != null) { VPS.sel = t.value || null; return pfRefresh(); }
  if (t.dataset.vpbulk != null && isAdmin() && VPS.sel) { const fs = [...t.files], miss = []; let ok = 0; toast('올리는 중…'); for (const f of fs) { const k = vpMatch(f.name); if (!k) { miss.push(f.name); continue; } if (await vpUpload(VPS.sel, k, f)) ok++; }
    toast(`${ok}개 올림${miss.length ? ` · 상황을 못 찾은 파일 ${miss.length}개` : ''}`); if (miss.length) alert('상황을 찾지 못한 파일:\n' + miss.join('\n') + '\n\n파일 이름에 상황 이름(예: 론, 리치, 만관, 대사1) 또는 영문 키(ron, riichi, mangan, line1)를 넣어 주세요.'); return pfRefresh(); }
  if (t.dataset.vpup && isAdmin()) { const fs = [...t.files]; if (!fs.length) return; toast('올리는 중…'); for (const f of fs) await vpUpload(VPS.sel, t.dataset.vpup, f); pfRefresh(); }
});
document.addEventListener('input', e => { const t = e.target;
  if (t.dataset.vpvol != null) { VPS.vol = +t.value; localStorage.setItem('mj-vp-vol', VPS.vol); return; }
  if (!isAdmin() || !VPS.sel) return; const P = vpGet(VPS.sel); if (!P) return;
  if (t.dataset.vpn != null) { P.n = t.value.trim().slice(0, 16); return vpSave(); }
  if (t.dataset.vpl) { (P.lines = P.lines || {})[t.dataset.vpl] = t.value.slice(0, 80); return vpSave(); }
});
