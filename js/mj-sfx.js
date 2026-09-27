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
  let k = 0; cur.melds.forEach((n, s) => { if (n > p.melds[s]) { sfxClack(true, 0); sfxClack(true, 0.09); sfxClack(true, 0.18); k++; } });
  cur.river.forEach((n, s) => { if (n > p.river[s]) sfxClack(cur.ri[s] && !p.ri[s], k++ * 0.12); });
}
if (typeof cutCheck === 'function') { const _cc = cutCheck; cutCheck = function () { try { sfxCheck(); } catch (e) {} return _cc.apply(this, arguments); }; }
document.addEventListener('pointerdown', () => { if (SFX.on) sfxCtx(); }, { once: true, capture: true });
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-sfx]'); if (!b) return; SFX.on = !SFX.on; localStorage.setItem('mj-sfx', SFX.on ? '1' : '0'); if (SFX.on) sfxClack(false); if (typeof renderModal === 'function') renderModal(); });
document.addEventListener('input', e => { if (!e.target.hasAttribute || !e.target.hasAttribute('data-sfxvol')) return; SFX.vol = +e.target.value; localStorage.setItem('mj-sfx-vol', SFX.vol); });
const sfxHTML = () => `<div style="display:flex;align-items:center;gap:10px;margin-top:10px"><button class="pb ${SFX.on ? 'on' : ''}" data-sfx>패 효과음 ${SFX.on ? '켬' : '끔'}</button><label class="jkv">효과음 크기<input type="range" min="0" max="1" step="0.05" value="${SFX.vol}" data-sfxvol></label></div>`;
