/* MAHJONG — 효과음 (Web Audio로 직접 합성 · 파일 없음) */
const SFX = { on: localStorage.getItem('mj-sfx') !== '0', vol: +(localStorage.getItem('mj-sfx-vol') || 0.7), ctx: null, prev: null };
function sfxCtx() { if (!SFX.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; SFX.ctx = new C(); } if (SFX.ctx.state === 'suspended') SFX.ctx.resume(); return SFX.ctx; }
function sfxClack(strong, delay) {
  if (!SFX.on) return; const c = sfxCtx(); if (!c) return; const t0 = c.currentTime + (delay || 0), v = SFX.vol * (strong ? 1 : 0.75);
  const len = 0.07, buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
  const n = c.createBufferSource(); n.buffer = buf; const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = strong ? 2100 : 2600 + Math.random() * 500; bp.Q.value = 1.6;
  const g = c.createGain(); g.gain.setValueAtTime(v * 0.9, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + len);
  n.connect(bp).connect(g).connect(c.destination); n.start(t0);
  const o = c.createOscillator(), og = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(strong ? 150 : 210, t0); o.frequency.exponentialRampToValueAtTime(70, t0 + 0.06);
  og.gain.setValueAtTime(v * (strong ? 0.8 : 0.45), t0); og.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07); o.connect(og).connect(c.destination); o.start(t0); o.stop(t0 + 0.08);
}
function sfxCheck() {
  if (!G) { SFX.prev = null; return; }
  const cur = { gid: G.gid + ':' + G.handNo, river: G.seats.map(S => S.river.length), melds: G.seats.map(S => S.melds.length), ri: G.seats.map(S => !!S.riichi) }, p = SFX.prev; SFX.prev = cur;
  if (!p || p.gid !== cur.gid) return;
  let k = 0; cur.river.forEach((n, s) => { if (n > p.river[s]) sfxClack(cur.ri[s] && !p.ri[s], k++ * 0.12); });
}
if (typeof cutCheck === 'function') { const _cc = cutCheck; cutCheck = function () { try { sfxCheck(); } catch (e) {} return _cc.apply(this, arguments); }; }
document.addEventListener('pointerdown', () => { if (SFX.on) sfxCtx(); }, { once: true, capture: true });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sfx]'); if (!b) return; SFX.on = !SFX.on; localStorage.setItem('mj-sfx', SFX.on ? '1' : '0'); if (SFX.on) sfxClack(false); if (typeof renderModal === 'function') renderModal(); });
document.addEventListener('input', e => { if (!e.target.hasAttribute || !e.target.hasAttribute('data-sfxvol')) return; SFX.vol = +e.target.value; localStorage.setItem('mj-sfx-vol', SFX.vol); });
const sfxHTML = () => `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><button class="pb ${SFX.on ? 'on' : ''}" data-sfx>패 효과음 ${SFX.on ? '켬' : '끔'}</button><label class="jkv">효과음 크기<input type="range" min="0" max="1" step="0.05" value="${SFX.vol}" data-sfxvol></label></div>`;

/* ── 보이스 (브라우저 TTS) ── */
const VOICE = { on: localStorage.getItem('mj-voice') !== '0', lang: localStorage.getItem('mj-voice-lang') || 'ja' };
const VO_W = { ja: { '론': 'ロン', '쯔모': 'ツモ', '리치': 'リーチ', '퐁': 'ポン', '치': 'チー', '깡': 'カン' }, ko: { '론': '론', '쯔모': '쯔모', '리치': '리치', '퐁': '퐁', '치': '치', '깡': '깡' } };
function voSay(word, s) {
  if (!VOICE.on || !window.speechSynthesis) return; const L = VOICE.lang, txt = (VO_W[L] || VO_W.ja)[word]; if (!txt) return;
  const u = new SpeechSynthesisUtterance(txt), code = L === 'ja' ? 'ja-JP' : 'ko-KR', vs = speechSynthesis.getVoices().filter(v => v.lang && v.lang.replace('_', '-').startsWith(code.slice(0, 2)));
  u.lang = code; if (vs.length) u.voice = vs[(s || 0) % vs.length];
  u.pitch = [1, 0.8, 1.25, 0.95][(s || 0) % 4]; u.rate = word === '론' || word === '쯔모' ? 1.05 : 1.15; u.volume = Math.min(1, SFX.vol + 0.2);
  speechSynthesis.cancel(); speechSynthesis.speak(u);
}
if (window.speechSynthesis) speechSynthesis.getVoices();
if (typeof showCut === 'function') { const _sc = showCut; showCut = function (s, word) { try { voSay(word, s); } catch (e) {} return _sc.apply(this, arguments); }; }
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-voice]'); if (!b) return; const v = b.dataset.voice;
  if (v === 'tg') { VOICE.on = !VOICE.on; localStorage.setItem('mj-voice', VOICE.on ? '1' : '0'); } else { VOICE.lang = v; localStorage.setItem('mj-voice-lang', v); }
  if (VOICE.on) voSay('리치', 0); if (typeof renderModal === 'function') renderModal(); });
const voiceHTML = () => `<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap"><button class="pb ${VOICE.on ? 'on' : ''}" data-voice="tg">보이스 ${VOICE.on ? '켬' : '끔'}</button><button class="pb ${VOICE.lang === 'ja' ? 'on' : ''}" data-voice="ja">일본어</button><button class="pb ${VOICE.lang === 'ko' ? 'on' : ''}" data-voice="ko">한국어</button><span style="font-size:11.5px;color:var(--mut)">론 · 쯔모 · 리치 · 퐁 · 치 · 깡</span></div>`;
