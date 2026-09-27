/* MAHJONG — 주크박스
   곡 목록은 서버 mahjong.songs (파일은 mahjong-skins/music/). 추가 · 이름 바꾸기 · 삭제는 관리자만(서버 정책으로도 막힘), 재생은 누구나. 온라인 방에서는 방장이 튼 음악이 방 전체에 같이 나옴(참가자는 '방 음악 따라가기'를 끄면 따로 들을 수 있음). */
const JK_KEY = 'mj-juke', JK_LIST = 'mj-juke-list';
const JK = { list: [], i: -1, on: false, vol: 0.6, shuf: false, rep: 'all', follow: true, needTap: false, a: new Audio() };
(() => { try { const s = JSON.parse(localStorage.getItem(JK_KEY) || '{}'); Object.assign(JK, { vol: s.vol ?? 0.6, shuf: !!s.shuf, rep: s.rep || 'all', follow: s.follow ?? true }); JK.list = JSON.parse(localStorage.getItem(JK_LIST) || '[]') || []; } catch (e) {} })();
JK.a.volume = JK.vol; JK.a.preload = 'none';
const jkSave = () => { try { localStorage.setItem(JK_KEY, JSON.stringify({ vol: JK.vol, shuf: JK.shuf, rep: JK.rep, follow: JK.follow })); } catch (e) {} };
const jkCur = () => JK.list[JK.i] || null;
function jkRefresh() { if (UI.modal === 'juke') renderModal(); document.querySelectorAll('[data-m="juke"]').forEach(b => { b.textContent = JK.on ? '음악 ▶' : '음악'; b.classList.toggle('on', JK.on); }); }
async function jkLoad() {
  if (!window.CLOUD || !CLOUD.sb || !CLOUD.user) return;
  const { data, error } = await CLOUD.sb.from('songs').select('id,title,url,path,sort').order('sort').order('added_at');
  if (error) return console.warn('songs', error.message);
  const cur = jkCur(); JK.list = data || []; JK.i = cur ? JK.list.findIndex(s => s.id === cur.id) : -1;
  try { localStorage.setItem(JK_LIST, JSON.stringify(JK.list)); } catch (e) {} jkRefresh();
}
function jkPlay(i) {
  if (!JK.list.length) return toast('등록된 곡이 없습니다');
  if (i != null) { JK.i = i; JK.a.src = JK.list[i].url; } else if (JK.i < 0) { JK.i = JK.shuf ? Math.floor(Math.random() * JK.list.length) : 0; JK.a.src = JK.list[JK.i].url; }
  JK.a.play().then(() => { JK.on = true; jkRefresh(); }).catch(() => toast('재생하지 못했습니다'));
}
function jkPause() { JK.a.pause(); JK.on = false; jkRefresh(); }
function jkStep(d) {
  const n = JK.list.length; if (!n) return;
  let j = JK.shuf && n > 1 ? (() => { let r; do r = Math.floor(Math.random() * n); while (r === JK.i); return r; })() : JK.i + d;
  if (j >= n) { if (JK.rep !== 'all') { jkPause(); JK.i = -1; return; } j = 0; } if (j < 0) j = n - 1; jkPlay(j);
}
JK.a.addEventListener('ended', () => { if (jkGuest()) { JK.on = false; return jkRefresh(); } JK.rep === 'one' ? jkPlay(JK.i) : jkStep(1); });
/* 방 음악 동기화 · Supabase 방 채널 broadcast 'jk' */
const jkRoom = () => !!(window.NET && NET.role && NET.ch);
const jkHost = () => jkRoom() && NET.owner;
const jkGuest = () => jkRoom() && !NET.owner && JK.follow;
function jkBcast() { if (!jkHost()) return; const c = jkCur();
  try { NET.ch.send({ type: 'broadcast', event: 'jk', payload: c ? { id: c.id, url: c.url, title: c.title, t: JK.a.currentTime || 0, on: JK.on && !JK.a.paused, at: Date.now() } : { on: false } }); } catch (e) {} }
function jkAsk() { if (!jkRoom() || NET.owner) return; try { NET.ch.send({ type: 'broadcast', event: 'jkreq', payload: {} }); } catch (e) {} }
function jkRemote(p) {
  if (!p || !jkGuest()) return;
  if (!p.on || !p.url) { JK.a.pause(); JK.on = false; return jkRefresh(); }
  let i = JK.list.findIndex(s => s.id === p.id); if (i < 0) { JK.list.push({ id: p.id, title: p.title || '방 음악', url: p.url }); i = JK.list.length - 1; }
  if (JK.i !== i || JK.a.src !== p.url) { JK.i = i; JK.a.src = p.url; }
  const want = p.t + Math.min(5, Math.max(0, (Date.now() - p.at) / 1000)), go = () => { if (Math.abs((JK.a.currentTime || 0) - want) > 1.5) try { JK.a.currentTime = want; } catch (e) {} };
  if (JK.a.readyState >= 1) go(); else JK.a.addEventListener('loadedmetadata', go, { once: true });
  JK.a.play().then(() => { JK.on = true; JK.needTap = false; jkRefresh(); }).catch(() => { JK.needTap = true; toast('방장이 음악을 틀었습니다 · 화면을 한 번 누르면 들립니다'); });
}
['play', 'pause', 'seeked'].forEach(ev => JK.a.addEventListener(ev, () => jkBcast()));
setInterval(() => { if (jkHost() && JK.on) jkBcast(); }, 10000);
document.addEventListener('pointerdown', () => { if (!JK.needTap) return; JK.needTap = false; JK.a.play().then(() => { JK.on = true; jkRefresh(); }).catch(() => {}); }, true);
Object.assign(window, { jkRemote, jkBcast, jkAsk });
JK.a.addEventListener('timeupdate', () => { const b = document.getElementById('jkbar'); if (b && JK.a.duration) b.style.width = (JK.a.currentTime / JK.a.duration * 100) + '%'; const t = document.getElementById('jktime'); if (t) t.textContent = jkT(JK.a.currentTime) + ' / ' + jkT(JK.a.duration); });
const jkT = s => isFinite(s) ? Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0') : '0:00';

function jukeHTML() {
  const c = jkCur(), adm = typeof isAdmin === 'function' && isAdmin();
  const rows = JK.list.map((s, i) => `<div class="jkr ${i === JK.i ? 'on' : ''}"><button class="jkp" data-jk="play" data-i="${i}"><em>${i === JK.i && JK.on ? '❚❚' : '▶'}</em><span>${esc(s.title)}</span></button>${adm ? `<button class="pb" data-jk="ren" data-i="${i}">이름</button><button class="pb" data-jk="del" data-i="${i}">삭제</button>` : ''}</div>`).join('');
  return `<div class="md" style="width:560px"><div class="k">주크박스</div><h2>${c ? esc(c.title) : '음악'}</h2>
    <div class="jkpro"><i id="jkbar" style="width:${JK.a.duration ? JK.a.currentTime / JK.a.duration * 100 : 0}%"></i></div><div id="jktime" class="jkt">${jkT(JK.a.currentTime)} / ${jkT(JK.a.duration)}</div>
    <div class="jkc"><button class="pb" data-jk="prev">이전</button><button class="go" data-jk="${JK.on ? 'pause' : 'resume'}">${JK.on ? '일시정지' : '재생'}</button><button class="pb" data-jk="next">다음</button>
      <button class="pb ${JK.shuf ? 'on' : ''}" data-jk="shuf">섞기 ${JK.shuf ? '켬' : '끔'}</button><button class="pb" data-jk="rep">반복 · ${{ all: '전체', one: '한 곡', off: '끔' }[JK.rep]}</button>
      <label class="jkv">음량<input type="range" min="0" max="1" step="0.05" value="${JK.vol}" data-jkvol></label></div>
    <div class="jkl">${rows || '<p style="font-size:14px;color:var(--mut)">아직 등록된 곡이 없습니다.</p>'}</div>
    ${adm ? `<div class="up" style="margin-top:12px"><b>곡 추가</b><label class="pb">파일 올리기<input type="file" accept="audio/*" multiple data-jkup></label><span>mp3 · m4a · ogg · 한 곡 20MB까지 · 관리자 전용</span></div>` : ''}
    ${jkRoom() && !NET.owner ? `<div style="display:flex;align-items:center;gap:8px;margin-top:10px"><button class="pb ${JK.follow ? 'on' : ''}" data-jk="follow">방 음악 따라가기 ${JK.follow ? '켬' : '끔'}</button><span style="font-size:12px;color:var(--mut)">${JK.follow ? '방장이 고른 곡이 나옵니다' : '내 기기에서 따로 고릅니다'}</span></div>` : ''}
    <p style="font-size:12px;color:var(--mut);margin:10px 0 0">${jkHost() ? '온라인 방장입니다 · 내가 튼 음악이 방 참가자 모두에게 같이 나옵니다.' : jkRoom() ? '온라인 방에서는 방장이 튼 음악이 같이 나옵니다.' : '음악은 이 기기에서만 재생됩니다.'} 창을 닫아도 계속 재생됩니다.${window.CLOUD && CLOUD.user ? '' : ' 로그인하면 최신 곡 목록을 받아옵니다.'}</p>
    <div class="foot"><button class="go sec" data-a="close">닫기</button></div></div>`;
}

document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-jk]'); if (!b) return; const k = b.dataset.jk, i = +b.dataset.i;
  if (k === 'follow') { JK.follow = !JK.follow; jkSave(); if (JK.follow) jkAsk(); else { JK.a.pause(); JK.on = false; } return jkRefresh(); }
  if (jkGuest() && ['play', 'pause', 'resume', 'prev', 'next'].includes(k)) return toast('방장이 음악을 고릅니다 · 따라가기를 끄면 따로 들을 수 있어요');
  if (k === 'play') return i === JK.i && JK.on ? jkPause() : i === JK.i ? jkPlay() : jkPlay(i);
  if (k === 'pause') return jkPause(); if (k === 'resume') return jkPlay();
  if (k === 'prev') return JK.a.currentTime > 3 ? (JK.a.currentTime = 0) : jkStep(-1); if (k === 'next') return jkStep(1);
  if (k === 'shuf') { JK.shuf = !JK.shuf; jkSave(); return jkRefresh(); }
  if (k === 'rep') { JK.rep = { all: 'one', one: 'off', off: 'all' }[JK.rep]; jkSave(); return jkRefresh(); }
  if (!isAdmin()) return; const s = JK.list[i]; if (!s) return;
  if (k === 'ren') { const t = prompt('곡 이름', s.title); if (!t || !t.trim()) return; const { error } = await CLOUD.sb.from('songs').update({ title: t.trim().slice(0, 60) }).eq('id', s.id); if (error) return toast('저장 실패 · ' + error.message); return jkLoad(); }
  if (k === 'del') { if (!confirm(`"${s.title}"을(를) 삭제할까요? 모든 사람의 목록에서 사라집니다.`)) return; if (i === JK.i) { jkPause(); JK.a.removeAttribute('src'); JK.i = -1; }
    const { error } = await CLOUD.sb.from('songs').delete().eq('id', s.id); if (error) return toast('삭제 실패 · ' + error.message);
    if (s.path) CLOUD.sb.storage.from('mahjong-skins').remove([s.path]); return jkLoad(); }
});
document.addEventListener('input', e => { if (!e.target.hasAttribute || !e.target.hasAttribute('data-jkvol')) return; JK.vol = +e.target.value; JK.a.volume = JK.vol; jkSave(); });
document.addEventListener('change', async e => {
  const el = e.target; if (!el.hasAttribute || !el.hasAttribute('data-jkup') || !el.files.length || !isAdmin()) return;
  const files = [...el.files]; let ok = 0, base = JK.list.reduce((m, s) => Math.max(m, s.sort || 0), 0);
  for (const f of files) {
    if (f.size > 20 * 1024 * 1024) { toast(`${f.name} · 20MB를 넘어서 건너뜁니다`); continue; }
    toast(`올리는 중… ${f.name}`);
    const ext = (f.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, ''), path = `music/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
    const up = await CLOUD.sb.storage.from('mahjong-skins').upload(path, f, { contentType: f.type || 'audio/mpeg' });
    if (up.error) { toast('업로드 실패 · ' + up.error.message); continue; }
    const url = CLOUD.sb.storage.from('mahjong-skins').getPublicUrl(path).data.publicUrl;
    const { error } = await CLOUD.sb.from('songs').insert({ title: f.name.replace(/\.[^.]+$/, '').slice(0, 60), url, path, sort: ++base });
    if (error) { toast('저장 실패 · ' + error.message); CLOUD.sb.storage.from('mahjong-skins').remove([path]); continue; } ok++;
  }
  if (ok) toast(`${ok}곡을 추가했습니다`); jkLoad();
});
