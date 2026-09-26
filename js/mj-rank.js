/* MAHJONG — 경쟁전 랭크
   단계: 입문 → 동 3·2·1 → 은 3·2·1 → 금 3·2·1 → 옥 2·1 → 용 2·1 → 천
   포인트가 단계 최대치에 닿으면 승급(다음 단계 절반에서 시작), 0 미만이면 강등(은 이상부터). */
const TIERS = [
  { n: '입문', h: '入', c: '#8A8578', steps: 1, max: 60, pen: 0, down: false },
  { n: '동', h: '銅', c: '#9A5B2E', steps: 3, max: 200, pen: 10, down: false },
  { n: '은', h: '銀', c: '#6F7A84', steps: 3, max: 400, pen: 30, down: true },
  { n: '금', h: '金', c: '#B8871B', steps: 3, max: 600, pen: 50, down: true },
  { n: '옥', h: '玉', c: '#2E7D5B', steps: 2, max: 900, pen: 70, down: true },
  { n: '용', h: '龍', c: '#1F4E9A', steps: 2, max: 1200, pen: 90, down: true },
  { n: '천', h: '天', c: '#C8252C', steps: 1, max: Infinity, pen: 110, down: true }];
const STAGES = TIERS.flatMap(t => Array.from({ length: t.steps }, (_, k) => ({ ...t, name: t.steps > 1 ? `${t.n} ${t.steps - k}` : t.n })));
const RANK = {
  d() { return PF.d.rank = Object.assign({ i: 0, p: 0, peak: 0, games: 0, top: 0, hist: [], last: null, res: null }, PF.d.rank || {}); },
  st(i) { return STAGES[Math.max(0, Math.min(STAGES.length - 1, i))]; },
  start(i) { const s = this.st(i); return s.max === Infinity ? 0 : Math.round(s.max / 2); },
  delta(n, k, pts, i) {
    const pen = this.st(i).pen, uma = n === 3 ? [60, 10, -pen - 15] : [60, 25, -Math.round(pen * 0.4), -pen - 15];
    const adj = Math.max(-40, Math.min(40, Math.round((pts - (n === 3 ? 35000 : 25000)) / 1000)));
    return uma[k] + adj;
  },
  apply(G, m, forfeit) {
    const d = this.d(); if (d.last === G.gid) return; d.last = G.gid;
    const k = forfeit ? G.n - 1 : G.rank.indexOf(m), before = { i: d.i, p: d.p };
    const dv = forfeit ? this.delta(G.n, G.n - 1, Math.min(G.seats[m].pts, G.n === 3 ? 35000 : 25000), d.i) - 20 : this.delta(G.n, k, G.seats[m].pts, d.i);
    d.p += dv; let moved = 0;
    while (d.p >= this.st(d.i).max && d.i < STAGES.length - 1) { d.i++; d.p = this.start(d.i); moved = 1; }
    if (d.p < 0) { if (this.st(d.i).down && d.i > 0) { d.i--; d.p = this.start(d.i); moved = -1; } else d.p = 0; }
    d.peak = Math.max(d.peak, d.i); d.games++; if (k === 0) d.top++;
    d.res = { gid: G.gid, before, after: { i: d.i, p: d.p }, dv, rank: k + 1, moved, forfeit: !!forfeit };
    d.hist.unshift({ d: Date.now(), rank: k + 1, dv, i: d.i, n: G.n }); d.hist = d.hist.slice(0, 20);
    PF.save(); return d.res;
  },
  on() { if (!UI.asSave) UI.asSave = Object.assign({}, AS); Object.keys(AS).forEach(k => AS[k] = false); },
  off() { if (UI.asSave) { Object.assign(AS, UI.asSave); UI.asSave = null; } }
};
function rankBadge(i, px = 34) { const s = RANK.st(i); return `<span class="rkb" style="width:${px}px;height:${px}px;background:${s.c};font-size:${Math.round(px * .5)}px">${s.h}</span>`; }
function rankBar(i, p) { const s = RANK.st(i); return s.max === Infinity ? `<div class="rkp"><span>${p} pt</span></div>` : `<div class="rkp"><i style="width:${Math.min(100, p / s.max * 100)}%;background:${s.c}"></i><span>${p} / ${s.max}</span></div>`; }
function rankLine() { const d = RANK.d(), s = RANK.st(d.i); return `<div class="rkl">${rankBadge(d.i, 30)}<div style="min-width:0;flex:1"><b>${s.name}</b>${rankBar(d.i, d.p)}</div></div>`; }
function rankHTML() {
  const d = RANK.d(), s = RANK.st(d.i);
  return `<div class="md pf"><div class="k">경쟁전 · 랭크</div><h2 style="margin:6px 0 12px">${s.name}</h2>
    <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px"><div style="min-width:0">
      <div class="rkl" style="margin-bottom:12px">${rankBadge(d.i, 56)}<div style="min-width:0;flex:1"><b style="font-size:18px">${s.name}</b>${rankBar(d.i, d.p)}</div></div>
      <div class="stg"><div>경쟁전<b>${d.games}</b></div><div>1위<b>${d.top}</b></div><div>최고 단계<b>${RANK.st(d.peak).name}</b></div><div>4위 감점<b>−${s.pen + 15}</b></div></div>
      <h3 class="sh">포인트 계산</h3><table class="rc"><tr><td>1위</td><td><b>+60</b></td></tr><tr><td>2위</td><td><b>+25</b></td></tr><tr><td>3위</td><td><b>${Math.round(s.pen * .4) ? '−' + Math.round(s.pen * .4) : '±0'}</b></td></tr><tr><td>4위</td><td><b>−${s.pen + 15}</b></td></tr><tr><td>점수 보정</td><td>(최종 점수 − 25000) ÷ 1000 · 최대 ±40</td></tr><tr><td>도중에 나가기</td><td>4위 처리 · 추가 −20</td></tr></table>
      <p style="font-size:12px;color:var(--mut);margin:8px 0 0">규칙 고정 · 4인 반장전 · 적도라 있음 · 도움 기능 꺼짐. 단계 최대치에 닿으면 승급하고 다음 단계 절반에서 시작합니다. 은 이상은 0 아래로 내려가면 강등됩니다.</p>
    </div><div style="min-width:0"><h3 class="sh" style="margin-top:0">단계</h3><div class="rkls">${STAGES.map((x, i) => `<div class="${i === d.i ? 'on' : i < d.i ? 'done' : ''}">${rankBadge(i, 22)}<span>${x.name}</span><small>${x.max === Infinity ? '상한 없음' : x.max + ' pt'}</small></div>`).join('')}</div></div></div>
    <div class="foot"><button class="go sec" data-a="close">닫기</button><button class="go" data-a="ranked">경쟁전 시작</button></div></div>`;
}
function rankResHTML() {
  const d = RANK.d(), r = d.res; if (!G || !G.ranked || !r || r.gid !== G.gid) return '';
  const s = RANK.st(r.after.i);
  return `<div class="box" style="margin:10px 0"><div class="rkl">${rankBadge(r.after.i, 40)}<div style="min-width:0;flex:1"><b>${s.name} <span style="color:${r.dv >= 0 ? 'var(--ink)' : 'var(--red, #C8252C)'};font-family:var(--mono)">${r.dv >= 0 ? '+' : ''}${r.dv} pt</span></b>${rankBar(r.after.i, r.after.p)}</div></div>${r.moved ? `<div style="margin-top:6px;font-weight:800">${r.moved > 0 ? '승급!' : '강등'} ${RANK.st(r.before.i).name} → ${s.name}</div>` : ''}</div>`;
}
function exitHTML() {
  const ranked = G && G.ranked && !G.over, online = window.NET && NET.role;
  const msg = ranked ? `경쟁전 도중에 나가면 <b>4위로 처리</b>되고 추가로 20pt를 잃습니다.` : online ? '온라인 방에서 나갑니다. 내 자리는 봇이 이어받습니다.' : '진행 상황은 저장되어 첫 화면의 <b>이어하기</b>로 계속할 수 있습니다.';
  return `<div class="md" style="max-width:420px"><div class="k">나가기</div><h2 style="margin:6px 0 10px">대국을 나갈까요?</h2><p style="font-size:14px;margin:0">${msg}</p>
    <div class="foot"><button class="go sec" data-a="close">계속하기</button><button class="go" data-a="exitgo">나가기</button></div></div>`;
}
