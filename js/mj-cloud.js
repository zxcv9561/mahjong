/* MAHJONG — 계정 (Supabase · 기존 프로젝트의 mahjong 스키마)
   로그인 → 허용 목록 확인 → 프로필 · 전적 · 스킨 이미지를 서버에 저장. 로그인 없이 혼자 하기도 가능(이 기기 저장). */
const CLOUD_URL = 'https://zojxbxvnhfszuvbfoafp.supabase.co';
const CLOUD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvanhieHZuaGZzenV2YmZvYWZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMDM1NTcsImV4cCI6MjA5MjU3OTU1N30.SelY462oVujeAuUE341CBw6M_eiBRon6Pfsz2xU0VII';
const BUCKET = 'mahjong-skins';
const CLOUD = window.CLOUD = { sb: null, user: null, ready: false, t: null };
(() => {
  const css = document.createElement('style');
  css.textContent = `#login{position:fixed;inset:0;z-index:50;background:rgba(20,20,18,.55);display:flex;align-items:center;justify-content:center;font-family:inherit}
#login .lg{background:#FAF8F3;color:#161614;width:min(360px,92vw);padding:26px 26px 20px;border:1.5px solid #161614;box-shadow:6px 6px 0 #161614;display:flex;flex-direction:column;gap:10px}
#login h2{margin:0;font-size:26px;letter-spacing:.02em}#login .s{font-size:13px;color:#55524B;margin:-4px 0 6px}
#login input{font:inherit;font-size:15px;padding:10px 12px;border:1.5px solid #161614;background:#fff;color:#161614;min-height:44px}
#login button{font:inherit;font-size:15px;font-weight:700;min-height:44px;border:1.5px solid #161614;background:#161614;color:#FAF8F3;cursor:pointer}
#login button.sub{background:transparent;color:#161614;font-weight:500}#login .er{color:#B3261E;font-size:13px;min-height:18px}`;
  document.head.appendChild(css);
  const LOCAL_IMG = (ch, k) => `mj-skin-${ch}-${k}`;

  CLOUD.showLogin = (msg) => {
    let el = document.getElementById('login'); if (!el) { el = document.createElement('div'); el.id = 'login'; document.body.appendChild(el); }
    el.innerHTML = `<form class="lg"><h2>리치 麻雀</h2><div class="s">받은 이메일과 비밀번호로 로그인하세요</div>
      <input id="lgE" type="email" autocomplete="username" placeholder="이메일" required><input id="lgP" type="password" autocomplete="current-password" placeholder="비밀번호" required>
      <div class="er" id="lgR">${msg ? esc(msg) : ''}</div><button type="submit">로그인</button><button type="button" class="sub" id="lgO">로그인 없이 혼자 하기</button></form>`;
    el.querySelector('form').onsubmit = async e => { e.preventDefault(); const r = el.querySelector('#lgR'); r.textContent = '확인 중…';
      if (!CLOUD.sb) { r.textContent = '서버에 연결하지 못했습니다. 잠시 후 다시 시도하세요'; return; }
      const { error } = await CLOUD.sb.auth.signInWithPassword({ email: el.querySelector('#lgE').value.trim(), password: el.querySelector('#lgP').value });
      if (error) { r.textContent = /Invalid/i.test(error.message) ? '이메일 또는 비밀번호가 맞지 않습니다' : error.message; return; }
      const ok = await afterLogin(); if (ok) el.remove(); else r.textContent = '마작 허용 목록에 없는 계정입니다'; };
    el.querySelector('#lgO').onclick = () => { localStorage.setItem('mj-offline', '1'); el.remove(); refresh(); };
  };

  async function afterLogin() {
    const { data: { user } } = await CLOUD.sb.auth.getUser(); if (!user) return false;
    const { data: row, error } = await CLOUD.sb.rpc('ensure_profile');
    if (error) { await CLOUD.sb.auth.signOut(); return false; }
    CLOUD.user = user; localStorage.removeItem('mj-offline');
    const d = row.data && Object.keys(row.data).length ? row.data : null;
    if (d) { PF.d = Object.assign({ nick: row.nick, char: row.char, standPos: {}, skinUrls: {} }, d); PF.d.stats = Object.assign(PF.blank(), PF.d.stats || {}); PF.d.skinUrls = PF.d.skinUrls || {}; PF.migrateMe(); }
    else { if (hasLocal() && !(await askImport())) wipeLocal(); PF.d.nick = PF.d.nick && PF.d.nick !== '나' ? PF.d.nick : row.nick; PF.d.skinUrls = PF.d.skinUrls || {}; await migrateImgs(); }
    PF.saveLocal(); await push(); if (window.botLoad) await botLoad(); if (window.jkLoad) jkLoad(); refresh(); if (window.NET && NET.resume) NET.resume(); return true;
  }

  /* 이 기기 프로필 비우기 (새로 시작 · 로그아웃) */
  function wipeLocal() { try { localStorage.removeItem(PF_KEY); ['face', 'stand'].forEach(k => localStorage.removeItem(LOCAL_IMG('me', k))); localStorage.removeItem('mj-lines-v1'); } catch (e) {} PF.load(); PF.d.skinUrls = {}; }
  const hasLocal = () => (PF.d.stats && (PF.d.stats.games > 0 || PF.d.stats.hands > 0)) || (PF.d.nick && PF.d.nick !== '나') || !!localStorage.getItem(LOCAL_IMG('me', 'face')) || !!localStorage.getItem(LOCAL_IMG('me', 'stand'));
  function askImport() { return new Promise(res => { const d = document.createElement('div'); d.className = 'ov'; d.style.zIndex = 90;
    d.innerHTML = `<div class="md" style="max-width:520px"><div class="k">처음 로그인</div><h2>이 기기의 프로필을 가져올까요?</h2><p style="font-size:14px;line-height:1.6">이 브라우저에 로그인 전 프로필이 있습니다 · 닉네임 <b>${esc(PF.d.nick || '나')}</b> · 대국 ${(PF.d.stats && PF.d.stats.games) || 0}판.<br>내 것이면 <b>가져오기</b>, 다른 사람이 쓰던 기기라면 <b>새로 시작</b>을 누르세요. 새로 시작하면 이 기기의 로그인 전 프로필은 지워집니다.</p><div class="foot" style="display:flex;gap:8px"><button class="go sec" data-imp="0">새로 시작</button><button class="go" data-imp="1">가져오기</button></div></div>`;
    d.addEventListener('click', e => { const b = e.target.closest('[data-imp]'); if (!b) return; d.remove(); res(b.dataset.imp === '1'); });
    ($('stage') || document.body).appendChild(d); }); }
  async function migrateImgs() { for (const c of [{ id: 'me' }]) for (const k of ['face', 'stand']) { const u = localStorage.getItem(LOCAL_IMG(c.id, k)); if (u) await upload(c.id, k, u); } }
  async function upload(ch, kind, dataUrl) {
    const blob = await (await fetch(dataUrl)).blob(), ext = blob.type.split('/')[1] || 'webp', path = `${CLOUD.user.id}/${ch}-${kind}.${ext}`;
    const { error } = await CLOUD.sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type });
    if (error) { toast('이미지 업로드 실패 · ' + error.message); return false; }
    const url = CLOUD.sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl + '?v=' + Date.now();
    (PF.d.skinUrls[ch] = PF.d.skinUrls[ch] || {})[kind] = url; localStorage.removeItem(LOCAL_IMG(ch, kind)); return true;
  }
  async function push() {
    if (!CLOUD.user) return; clearTimeout(CLOUD.t);
    const { error } = await CLOUD.sb.from('profiles').update({ nick: String(PF.d.nick || '나').slice(0, 10), char: 'me', data: PF.d }).eq('id', CLOUD.user.id);
    if (error) console.warn('profile save', error.message);
  }
  function refresh() { if (typeof G !== 'undefined' && G) render(); else if (typeof renderSetup === 'function') renderSetup(); }

  /* PF 저장 위치 교체: 로그인 상태면 서버, 아니면 이 기기 */
  PF.saveLocal = PF.save.bind(PF);
  PF.save = function () { this.saveLocal(); if (CLOUD.user) { clearTimeout(CLOUD.t); CLOUD.t = setTimeout(push, 800); } };
  const _img = PF.img.bind(PF), _set = PF.setImg.bind(PF), _clr = PF.clearImg.bind(PF);
  PF.img = (ch, k) => (CLOUD.user && PF.d.skinUrls && PF.d.skinUrls[ch] && PF.d.skinUrls[ch][k]) || _img(ch, k);
  PF.setImg = async (ch, k, file) => { const r = await _set(ch, k, file); if (r !== true || !CLOUD.user) return r; PF.d.skinUrls = PF.d.skinUrls || {}; const ok = await upload(ch, k, localStorage.getItem(LOCAL_IMG(ch, k))); if (ok) PF.save(); return true; };
  PF.clearImg = (ch, k) => { _clr(ch, k); const u = PF.d.skinUrls && PF.d.skinUrls[ch]; if (u && u[k]) { const path = u[k].split(`/${BUCKET}/`)[1]; if (path && CLOUD.user) CLOUD.sb.storage.from(BUCKET).remove([path.split('?')[0]]); delete u[k]; PF.save(); } };

  /* 프로필 카드에 계정 줄 추가 */
  const _card = pfCardHTML;
  pfCardHTML = () => _card().replace('<button class="pb" data-m="yakubook">족보</button>', `<button class="pb" data-m="yakubook">족보</button>${CLOUD.user ? '<button class="pb" data-cloud="out">로그아웃</button>' : '<button class="pb" data-cloud="in">로그인</button>'}`)
    .replace('<div class="k">내 프로필', `<div class="k">${CLOUD.user ? esc(CLOUD.user.email) + ' · 서버 저장' : '로그인 안 함 · 이 기기에 저장'} · 내 프로필`);
  document.addEventListener('click', async e => { const b = e.target.closest('[data-cloud]'); if (!b) return; e.stopPropagation();
    if (b.dataset.cloud === 'in') return CLOUD.showLogin();
    if (!confirm('로그아웃할까요?')) return; await push(); await CLOUD.sb.auth.signOut(); CLOUD.user = null; CLOUD.admin = false; wipeLocal(); refresh(); CLOUD.showLogin(); }, true);

  /* 시작 */
  const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
  s.onload = async () => {
    CLOUD.sb = window.supabase.createClient(CLOUD_URL, CLOUD_KEY, { db: { schema: 'mahjong' }, auth: { persistSession: true, storageKey: 'mj-auth' } });
    const { data: { session } } = await CLOUD.sb.auth.getSession();
    if (session) { const ok = await afterLogin(); if (!ok) CLOUD.showLogin('마작 허용 목록에 없는 계정입니다'); }
    else if (!localStorage.getItem('mj-offline')) CLOUD.showLogin();
    CLOUD.ready = true; refresh();
  };
  s.onerror = () => { CLOUD.ready = true; toast('서버에 연결하지 못했습니다 · 혼자 하기만 가능합니다'); };
  document.head.appendChild(s);
})();
