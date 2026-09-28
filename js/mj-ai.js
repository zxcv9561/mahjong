/* MAHJONG — AI 작사 (내 PC의 로컬 언어모델 · Ollama 또는 OpenAI 호환 서버)
   엔진(강함)이 후보 수를 뽑고 → AI가 그중 하나를 고르며 한마디 → 시간 초과 · 오류 시 엔진 수로 대신 둠.
   혼자 하기 전용. 온라인 방에서는 강함 봇으로 앉습니다. */
const AI_KEY = 'mj-ai';
const AICFG = Object.assign({ url: 'http://localhost:11434', model: 'qwen3:14b', api: 'ollama', timeout: 12, talk: true, on: false, keep: 5 }, JSON.parse(localStorage.getItem(AI_KEY) || '{}'));
const aiSave = () => localStorage.setItem(AI_KEY, JSON.stringify(AICFG));
const AIQ = { pend: {}, warned: false, stat: '' };
LV.ai = 'AI 작사';
const aiNm = t => tnm(t);
const aiIds = ids => ids.map(i => aiNm(tT(i)) + (isRed(i) ? '(적)' : '')).join(' ');
const aiKey = (G, s) => `${G.gid || ''}|${G.log.length}|${G.phase}|${G.turn}|${G.wall.length}|${G.seats[s].hand.length}`;
const asHigh = (S, f) => { const lv = S.level; S.level = 'high'; try { return f(); } finally { S.level = lv; } };

function aiSituation(G, s) {
  const S = G.seats[s], rel = o => ['나', '오른쪽', '맞은편', '왼쪽'][(o - s + G.n) % G.n] || '상대';
  const dora = [...Array(G.doraN).keys()].map(k => aiNm(doraOf(tT(G.ind[2 * k]), G.n === 3))).join(' ');
  const lines = [`${roundLabel(G)} · 남은 패 ${G.wall.length}장 · 도라: ${dora}`,
    `점수: ${G.seats.map((X, o) => `${rel(o)} ${X.pts}`).join(' / ')}`,
    `내 손패: ${aiIds(S.hand)}${S.melds.length ? ` · 운 패: ${S.melds.map(m => aiIds(m.ids)).join(' | ')}` : ''}`];
  G.seats.forEach((X, o) => { if (o === s) return; lines.push(`${rel(o)}${X.riichi ? '(리치)' : ''}${X.melds.length ? `(${X.melds.length}번 울음)` : ''} 버림패: ${X.river.map(r => aiNm(tT(r.id))).join(' ') || '없음'}`); });
  return lines.join('\n');
}
function aiDiscardCands(G, s) {
  const S = G.seats[s], c = cnt(S.hand), fm = S.melds.length, eng = asHigh(S, () => botAct(G, s)), O = discardOpts(G, s);
  const types = [...new Set(S.hand.map(tT))].filter(t => !(S.kuikae || []).includes(t));
  const rows = types.map(t => { c[t]--; const sh = shanten(c, fm), u = ukeire(G, s, c, fm, sh); c[t]++; return { t, sh, u, dz: danger(G, s, t, false) }; })
    .sort((a, b) => a.sh - b.sh || b.u - a.u || a.dz - b.dz);
  const et = eng && eng.t === 'discard' ? tT(eng.id) : null, top = rows.filter(r => r.t === et).concat(rows.filter(r => r.t !== et)).slice(0, 3);
  return { eng, O, top };
}
function aiPrompt(sys, user) { return [{ role: 'system', content: sys }, { role: 'user', content: user }]; }
const AI_SYS = '너는 리치 마작을 두는 작사다. 주어진 상황과 후보 수 중 하나를 고른다. 샹텐이 낮을수록, 유효패가 많을수록 빠르고, 위험도가 높을수록 상대에게 론 당하기 쉽다. 상대가 리치했는데 내 손이 멀면 위험도를 가장 중요하게 본다. 반드시 JSON 한 줄로만 답한다: {"pick":후보번호,"line":"12자 이내 짧은 혼잣말(한국어)"}';
async function aiAsk(msgs) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), AICFG.timeout * 1000), base = AICFG.url.replace(/\/+$/, '');
  try {
    let txt;
    if (AICFG.api === 'openai') {
      const r = await fetch(base + '/v1/chat/completions', { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: AICFG.model, messages: msgs, temperature: 0.5, max_tokens: 120, response_format: { type: 'json_object' } }) });
      txt = (await r.json()).choices[0].message.content;
    } else {
      const r = await fetch(base + '/api/chat', { method: 'POST', signal: ctl.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: AICFG.model, messages: msgs, stream: false, format: 'json', think: false, keep_alive: AICFG.keep + 'm', options: { temperature: 0.5, num_predict: 120 } }) });
      txt = (await r.json()).message.content;
    }
    AIQ.down = 0; const m = String(txt).replace(/<think>[\s\S]*?<\/think>/g, '').match(/\{[\s\S]*\}/); AIQ.stat = 'ok'; return m ? JSON.parse(m[0]) : null;
  } finally { clearTimeout(to); }
}
/* GPU 메모리 비우기 (Ollama: keep_alive 0) */
function aiUnload(quiet) {
  if (AICFG.api !== 'ollama') { if (!quiet) toast('LM Studio는 앱에서 모델을 내려 주세요'); return; }
  fetch(AICFG.url.replace(/\/+$/, '') + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: AICFG.model, keep_alive: 0 }) })
    .then(() => { if (!quiet) toast('AI 모델을 GPU에서 내렸습니다'); }).catch(() => { if (!quiet) toast('로컬 AI가 꺼져 있습니다'); });
}
async function aiDecide(G, s) {
  if (!AICFG.on) throw new Error('off');
  const S = G.seats[s], fb = asHigh(S, () => botAct(G, s));
  if (AIQ.down && Date.now() - AIQ.down < 30000) throw new Error('down');   // 연결 실패 후 30초는 바로 엔진으로 (게임이 느려지지 않게)
  if (G.phase === 'call') {
    const o = G.pend.opts[s]; if (o.some(x => x.t === 'ron') || G.pend.kind === 'chankan') return { a: fb };
    const ch = [{ t: 'pass' }].concat(o), eng = fb || { t: 'pass' }, ei = Math.max(0, ch.findIndex(x => x.t === eng.t && (x.t !== 'chi' || x.ids + '' === (eng.ids || []) + '')));
    const desc = ch.map((x, i) => `${i + 1}. ${x.t === 'pass' ? '넘긴다(멘젠 유지)' : x.t === 'pon' ? `퐁 ${aiNm(tT(G.last.id))}` : x.t === 'chi' ? `치 ${aiIds(x.ids)} + ${aiNm(tT(G.last.id))}` : x.t}${i === ei ? ' ← 엔진 추천' : ''}`).join('\n');
    const j = await aiAsk(aiPrompt(AI_SYS, `${aiSituation(G, s)}\n\n상대가 ${aiNm(tT(G.last.id))}을 버렸다. 선택지:\n${desc}`));
    const k = j && +j.pick - 1; return { a: ch[k] || eng, line: j && j.line };
  }
  const { eng, O, top } = aiDiscardCands(G, s);
  if (!eng || eng.t !== 'discard' || S.riichi || top.length < 2) return { a: fb };
  const desc = top.map((r, i) => `${i + 1}. ${aiNm(r.t)} 버림 · 샹텐 ${r.sh} · 유효패 ${r.u}장 · 위험도 ${r.dz.toFixed ? r.dz.toFixed(1) : r.dz}${i === 0 ? ' ← 엔진 추천' : ''}${O.riichi.includes(r.t) ? ' · 리치 가능' : ''}`).join('\n');
  const j = await aiAsk(aiPrompt(AI_SYS + ' 리치 가능한 후보를 골랐다면 "riichi":true/false 도 넣는다.', `${aiSituation(G, s)}\n\n버릴 패 후보:\n${desc}`));
  const r = j && top[+j.pick - 1]; if (!r) return { a: eng, line: j && j.line };
  const ids = S.hand.filter(i => tT(i) === r.t).sort((a, b) => (isRed(a) - isRed(b)) || a - b), id = S.drawn != null && tT(S.drawn) === r.t && !isRed(S.drawn) ? S.drawn : ids[0];
  const rc = O.riichi.includes(r.t) && (j.riichi === true || (j.riichi == null && r.t === tT(eng.id) && eng.riichi));
  return { a: { t: 'discard', id, riichi: rc || undefined }, line: j.line };
}
(() => {
  const _tick = tick;
  tick = function () {
    if (!G || isGuest() || G.over || !G.seats.some(X => X.level === 'ai') || G.tut) return _tick();
    const ai = waitingSeats(G).filter(s => G.seats[s].bot && G.seats[s].level === 'ai');
    const lv = ai.map(s => G.seats[s].level); ai.forEach(s => G.seats[s].bot = false);
    try { _tick(); } finally { ai.forEach(s => G.seats[s].bot = true); }
    ai.forEach(s => { const k = aiKey(G, s); if (AIQ.pend[s] === k) return; AIQ.pend[s] = k; const g0 = G;
      const t0 = Date.now();
      aiDecide(G, s).catch(e => { if (!AIQ.warned) { AIQ.warned = true; toast('AI 작사 서버에 연결하지 못해 엔진(강함)이 대신 둡니다'); } AIQ.stat = 'fail'; if (e.message === 'off') return { a: asHigh(G.seats[s], () => botAct(G, s)) }; if (e.message !== 'down') AIQ.down = Date.now(); return { a: asHigh(G.seats[s], () => botAct(G, s)) }; })
        .then(({ a, line }) => setTimeout(() => {
          if (G !== g0 || aiKey(G, s) !== k || !waitingSeats(G).includes(s)) return;
          const r = act(G, s, a || asHigh(G.seats[s], () => botAct(G, s))); if (!r.ok) { const f = act(G, s, asHigh(G.seats[s], () => botAct(G, s))); if (!f.ok) console.warn('ai', r.why); }
          if (AICFG.talk && line && typeof sayShow === 'function') try { sayShow(s, String(line).slice(0, 24)); } catch (e) {}
          after(); }, Math.max(0, 500 - (Date.now() - t0))));
    });
  };
  const _sg = startGame;
  startGame = function (ranked) {
    const bak = UI.cfg.seats, on = bak.slice(0, UI.cfg.n - 1).includes('remote');
    if (!ranked && !AICFG.on && bak.includes('ai')) { UI.cfg.seats = bak.map(v => v === 'ai' ? 'high' : v); }
    else if (!ranked && on && bak.includes('ai')) { toast('온라인 방에서는 AI 작사가 강함 봇으로 앉습니다'); UI.cfg.seats = bak.map(v => v === 'ai' ? 'high' : v); }
    try { _sg.apply(this, arguments); } finally { UI.cfg.seats = bak; }
    AIQ.pend = {}; AIQ.warned = false; AIQ.down = 0;
    if (G) G.seats.forEach(S => { if (S.level === 'ai') S.name = S.name.replace('· 봇', '· AI 작사'); });
    if (G && G.seats.some(S => S.level === 'ai')) after();
  };
  let wasAi = false; const _af = after;
  after = function () { const r = _af.apply(this, arguments); const has = !!(G && !G.over && G.seats.some(S => S.level === 'ai')); if (wasAi && !has && AICFG.on && AICFG.keep === 0) aiUnload(true); wasAi = has; return r; };
  const _rs = renderSetup;
  renderSetup = function () {
    const r = _rs.apply(this, arguments), c = UI.cfg, st = $('setup'); if (!st || st.hidden) return r;
    const sel = st.querySelector('select[data-seat]'), fg = sel && sel.closest('.fg'); if (!fg || st.querySelector('.aibox')) return r;
    if (!c.seats.slice(0, c.n - 1).includes('ai') && !AICFG.on) {
      const t = document.createElement('div'); t.className = 'fg aibox aimini';
      t.innerHTML = '<label>로컬 AI</label><div class="aitg"><button class="pb" data-ai-on="1">켜기</button><span>꺼짐 · 사이트가 내 PC의 AI에 전혀 접속하지 않습니다</span></div>';
      fg.after(t); return r;
    }
    const tg = `<div class="aitg"><button class="pb ${AICFG.on ? 'on' : ''}" data-ai-on="1">켜짐</button><button class="pb ${AICFG.on ? '' : 'on'}" data-ai-on="0">꺼짐</button><span>${AICFG.on ? '대국 중에만 AI에 접속합니다' : '꺼져 있으면 AI 작사 자리는 강함 봇이 둡니다 · 접속 없음'}</span></div>`;
    const keep = `<div class="aig2"><label>대국 후 GPU</label><select data-ai="keep"><option value="0" ${AICFG.keep === 0 ? 'selected' : ''}>대국 끝나면 바로 비우기</option><option value="5" ${AICFG.keep === 5 ? 'selected' : ''}>5분 뒤 비우기</option><option value="30" ${AICFG.keep === 30 ? 'selected' : ''}>30분 뒤 비우기</option></select><button class="pb" data-ai-unload>지금 비우기</button></div>`;
    const d = document.createElement('div'); d.className = 'fg aibox';
    d.innerHTML = !AICFG.on ? `<label>AI 작사 · 내 PC의 로컬 AI 서버</label>${tg}` : `<label>AI 작사 · 내 PC의 로컬 AI 서버</label>${tg}<div class="aig"><select data-ai="api"><option value="ollama" ${AICFG.api === 'ollama' ? 'selected' : ''}>Ollama</option><option value="openai" ${AICFG.api === 'openai' ? 'selected' : ''}>OpenAI 호환 (LM Studio 등)</option></select><input data-ai="url" value="${esc(AICFG.url)}" placeholder="http://localhost:11434"><input data-ai="model" value="${esc(AICFG.model)}" placeholder="모델 이름"><input data-ai="timeout" type="number" min="3" max="60" value="${AICFG.timeout}" title="한 수 제한 시간(초)"><button class="pb" data-ai-test>연결 확인</button></div>${keep}<div class="aist">${AIQ.stat === 'ok' ? '연결됨' : AIQ.stat === 'fail' ? '연결 안 됨 · 엔진이 대신 둡니다' : '연결이 안 되면 엔진(강함)이 대신 둡니다'}</div>`;
    fg.after(d); return r;
  };
  document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.ai; if (!k) return; AICFG[k] = k === 'timeout' ? Math.max(3, Math.min(60, +e.target.value || 12)) : k === 'keep' ? +e.target.value : e.target.value.trim(); aiSave(); if (k === 'api') { AICFG.url = AICFG.api === 'openai' ? AICFG.url.replace(':11434', ':1234') : AICFG.url.replace(':1234', ':11434'); aiSave(); renderSetup(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest && e.target.closest('[data-ai-on],[data-ai-unload]'); if (!t) return; e.preventDefault();
    if (t.dataset.aiUnload != null) return aiUnload(false);
    const on = t.dataset.aiOn === '1'; if (!on && AICFG.on) aiUnload(true);
    AICFG.on = on; AIQ.down = 0; AIQ.stat = ''; aiSave(); renderSetup();
  });
  document.addEventListener('click', async e => {
    const b = e.target.closest && e.target.closest('[data-ai-test]'); if (!b) return; e.preventDefault(); const st = document.querySelector('.aist'); st.textContent = '확인 중…';
    try { const j = await aiAsk(aiPrompt('JSON으로만 답한다.', '{"pick":1,"line":"준비 완료"} 를 그대로 답하라.'));
      st.textContent = j ? `연결됨 · ${AICFG.model} · "${j.line || 'OK'}"` : '연결됐지만 답을 읽지 못했습니다. 다른 모델을 써 보세요'; }
    catch (err) { AIQ.stat = 'fail'; st.textContent = err.name === 'AbortError' ? '시간 초과 · 모델이 처음 켜지는 중이면 한 번 더 눌러 보세요' : '연결 실패 · 서버가 켜져 있는지, 허용 주소(OLLAMA_ORIGINS) 설정을 확인하세요'; }
  });
})();
