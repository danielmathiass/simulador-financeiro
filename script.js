// ── HELPERS ──────────────────────────────────────────────────
// Formata valores numéricos como moeda BRL
function formatBRL(v) { 
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); 
}

// Formata número inteiro com separador de milhar
function formatInt(v) { 
  return Math.round(v).toLocaleString('pt-BR'); 
}

// Formata percentual com vírgula
function formatPct(v, d = 1) { 
  return v.toFixed(d).replace('.', ',') + '%'; 
}

const $ = id => document.getElementById(id);
const txt = (id, v) => $(id).textContent = v;
const num = id => +$(id).value;

// Mantém um pouco de DRY na atualização de labels de ranges
function updateSliderLabel(id, valueText) { 
  txt(id, valueText); 
}

// Compatibilidade com o código existente (sem alterar todas as chamadas)
const R = formatBRL;
const N = formatInt;
const P = formatPct;
const val = num;
const el = $;
const setTxt = txt;

// Navegação de abas
const MODS = ['m0', 'm1', 'm2', 'm3', 'm4'];
function goTab(i) {
  document.querySelectorAll('.mod').forEach((m, j) => m.classList.toggle('act', j === i));
  document.querySelectorAll('.tab').forEach((t, j) => t.classList.toggle('act', j === i));
  if (i === 1) u2();
  if (i === 2) u3();
  if (i === 3) u4();
}

// ── CHART 1 (pricing bar) ────────────────────────────────────
let c1 = null;
function u1() {
  const serv = val('r-serv'), equipe = val('r-equipe'), mktg = val('r-mktg'), outros = val('r-outros');
  const cv = val('r-cv'), cli = val('r-cli'), mg = val('r-mg') / 100;
  const cf = serv + equipe + mktg + outros;
  const cvTot = cv * cli;
  const cuUn = (cf / cli) + cv;
  const preco = cuUn * (1 + mg);
  const receita = preco * cli;
  const cTotal = cf + cvTot;
  const lucro = receita - cTotal;
  const mReal = lucro / receita;

  // slider labels
  setTxt('v-serv', R(serv)); setTxt('v-equipe', R(equipe)); setTxt('v-mktg', R(mktg));
  setTxt('v-outros', R(outros)); setTxt('v-cv', 'R$ ' + Math.round(cv));
  setTxt('v-cli', N(cli)); setTxt('v-mg', Math.round(mg * 100) + '%');
  setTxt('tcf', R(cf));

  // KPIs
  setTxt('k1-p', R(preco)); setTxt('k1-r', R(receita));
  setTxt('k1-rs', 'com ' + N(cli) + ' clientes');
  setTxt('k1-l', R(lucro)); setTxt('k1-ls', 'margem de ' + P(mReal * 100));
  setTxt('k1-cu', R(cuUn));
  el('k1-lcard').className = 'kpi ' + (lucro >= 0 ? 'pos' : 'neg');

  // decomposition
  setTxt('d-cv', 'R$ ' + Math.round(cv));
  setTxt('d-cf', 'R$ ' + Math.round(cf / cli));
  setTxt('d-ct', 'R$ ' + Math.round(cuUn));
  setTxt('d-mv', '+ R$ ' + Math.round(preco - cuUn));
  setTxt('d-pf', 'R$ ' + Math.round(preco));

  // cost bar
  const tot2 = cf + cvTot;
  function w(v) { 
    return (v / tot2 * 100).toFixed(1) + '%';
  }
  el('b-serv').style.width = w(serv); el('b-equipe').style.width = w(equipe);
  el('b-mktg').style.width = w(mktg); el('b-outros').style.width = w(outros);
  el('b-var').style.width = w(cvTot);

  // status
  const sb = el('sb1');
  if (lucro > 0) { sb.className = 'sbox ok'; sb.textContent = '✓ Com preço de ' + R(preco) + ', a margem é +' + P(mReal * 100) + '. Operação saudável.' }
  else { 
    sb.className = 'sbox bad'; sb.textContent = '✗ Margem negativa. Reduza custos ou aumente a margem desejada.' 
  }

  // chart
  if (c1) c1.destroy();
  c1 = new Chart(el('c1').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['Servidores', 'Equipe', 'Marketing', 'Outros', 'Var.Total', 'Receita', 'Lucro'],
      datasets: [{
        data: [serv, equipe, mktg, outros, cvTot, receita, lucro],
        backgroundColor: ['#9FE1CB', '#B5D4F4', '#FAC775', '#D3D1C7', '#F09595', '#1D9E75', lucro >= 0 ? '#185FA5' : '#E24B4A'],
        borderRadius: 4, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + R(c.raw) } } },
      scales: {
        y: { ticks: { callback: v => 'R$ ' + (v / 1000).toFixed(0) + 'k', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

// ── CHART 2 (break-even) ─────────────────────────────────────
let c2 = null;
// PE line plugin
const pePlugin = {
  id: 'peLine',
  afterDraw(chart, args, opts) {
    if (opts.peIdx == null) return;
    const meta = chart.getDatasetMeta(0);
    if (!meta.data[opts.peIdx]) return;
    const x = meta.data[opts.peIdx].x;
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bottom);
    ctx.strokeStyle = '#185FA5'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#185FA5'; ctx.font = '11px system-ui'; ctx.fillText('PE: ' + opts.peLabel, x + 5, top + 13);
    ctx.restore();
  }
};
Chart.register(pePlugin);

function u2() {
  const cf = val('r-serv') + val('r-equipe') + val('r-mktg') + val('r-outros');
  const cv = val('r-cv'), mg = val('r-mg') / 100, cli = val('r-cli');
  const cuUn = (cf / cli) + cv;
  const preco = cuUn * (1 + mg);
  const mc = preco - cv;
  const pe = Math.ceil(cf / mc);
  const rpe = pe * preco;
  const diff = cli - pe;
  const ms = (diff / cli) * 100;

  setTxt('k2-pe', N(pe)); setTxt('k2-rpe', R(rpe));
  el('k2-scard').className = 'kpi ' + (diff >= 0 ? 'pos' : 'neg');
  setTxt('k2-diff', (diff >= 0 ? '+' : '') + N(diff));
  setTxt('k2-dsub', diff >= 0 ? 'clientes acima do PE' : 'clientes abaixo do PE');
  el('k2-mscard').className = 'kpi ' + (ms >= 20 ? 'pos' : ms >= 0 ? 'wrn' : 'neg');
  setTxt('k2-ms', P(ms));

  setTxt('d2-p', R(preco)); setTxt('d2-cv', R(cv)); setTxt('d2-mc', R(mc));
  setTxt('d2-mcp', P(mc / preco * 100)); setTxt('d2-cf', R(cf));
  setTxt('d2-form', N(cf) + ' ÷ ' + Math.round(mc)); setTxt('d2-pe', N(pe) + ' clientes');

  const sb = el('sb2');
  if (diff >= 0) { sb.className = 'sbox ok'; sb.textContent = '✓ Com ' + N(cli) + ' clientes, a empresa supera o PE de ' + N(pe) + ' por ' + N(diff) + ' clientes.' }
  else { sb.className = 'sbox bad'; sb.textContent = '✗ Abaixo do PE! Faltam ' + N(-diff) + ' clientes para atingir o equilíbrio financeiro.' }

  // Build axis data
  const maxN = Math.max(cli * 1.6, pe * 1.5, 400);
  const step = Math.ceil(maxN / 10 / 50) * 50;
  const labels = [], dRec = [], dCost = [];
  let peIdx = null;
  for (let n = 0; n <= maxN; n += step) {
    if (peIdx == null && n >= pe) peIdx = labels.length;
    labels.push(N(n)); dRec.push(n * preco); dCost.push(cf + n * cv);
  }

  if (c2) c2.destroy();
  c2 = new Chart(el('c2').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Receita Total', data: dRec, borderColor: '#1D9E75', borderWidth: 2, pointRadius: 0, fill: false, tension: 0 },
        { label: 'Custo Total', data: dCost, borderColor: '#E24B4A', borderWidth: 2, pointRadius: 0, fill: false, tension: 0 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => c.dataset.label + ': ' + R(c.raw) } },
        peLine: { peIdx, peLabel: N(pe) + ' cli.' }
      },
      scales: {
        y: { ticks: { callback: v => 'R$ ' + (v / 1000).toFixed(0) + 'k', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: {
          ticks: { font: { size: 10 }, maxTicksLimit: 10 }, grid: { display: false },
          title: { display: true, text: 'Número de Clientes', font: { size: 10 }, color: '#888' }
        }
      }
    }
  });
}

// ── CHART 3 (scenarios) ──────────────────────────────────────
let c3 = null, horizon = 36;
function setH(h) {
  horizon = h;
  ['p12', 'p24', 'p36'].forEach(id => el(id).className = 'pill');
  el('p' + h).className = 'pill ' + (h === 12 ? 'p12' : h === 24 ? 'p24' : 'p36');
  el('h-lbl').textContent = 'Próximos ' + h + ' meses';
  u3();
}
function u3() {
  const cli0 = val('r3-cli'), preco = val('r3-preco');
  const pessTx = val('r3-pess') / 100, realTx = val('r3-real') / 100, otimTx = val('r3-otim') / 100;
  const meta = val('r3-meta');

  setTxt('v3-cli', N(cli0)); setTxt('v3-preco', R(preco));
  setTxt('v3-cf', P(val('r3-cf')));
  setTxt('v3-pess', (pessTx * 100).toFixed(1).replace('.', ',').replace('-', '−') + '%');
  setTxt('v3-real', '+' + (realTx * 100).toFixed(1).replace('.', ',') + '%');
  setTxt('v3-otim', '+' + (otimTx * 100).toFixed(1).replace('.', ',') + '%');
  const mM = meta / 1000000;
  setTxt('v3-meta', 'R$ ' + mM.toFixed(mM < 1 ? 1 : 0).replace('.', ',') + 'M');

  const h = horizon;
  const labels = Array.from({ length: h + 1 }, (_, i) => i === 0 ? 'Hoje' : 'M' + i);
  function proj(tx) {
    let c = cli0;
    return Array.from({ length: h + 1 }, (_, i) => { const r = c * preco; c = Math.max(0, c * (1 + tx)); return r });
  }
  const pd = proj(pessTx), rd = proj(realTx), od = proj(otimTx);
  const metaMes = Array(h + 1).fill(meta / (h || 1));
  const pCum = pd.reduce((a, v) => a + v, 0);
  const rCum = rd.reduce((a, v) => a + v, 0);
  const oCum = od.reduce((a, v) => a + v, 0);

  // Table milestones
  const miles = h >= 36 ? [6, 12, 24, 36] : h >= 24 ? [6, 12, 18, 24] : [3, 6, 9, 12];
  const tbody = el('ptbody'); tbody.innerHTML = '';
  miles.filter(m => m <= h).forEach(m => {
    const pv = pd[m], rv = rd[m], ov = od[m], base = pd[0];
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>Mês ${m}</strong></td>
      <td class="${pv < base ? 'neg' : ''}">${R(pv)}</td>
      <td class="${rv > base ? 'pos' : ''}">${R(rv)}</td>
      <td class="pos">${R(ov)}</td>`;
    tbody.appendChild(tr);
  });
  const tr2 = document.createElement('tr');
  tr2.innerHTML = `<td><strong>Acumulado (${h}m)</strong></td>
    <td class="${pCum >= meta ? 'pos' : 'neg'}">${R(pCum)}</td>
    <td class="${rCum >= meta ? 'pos' : 'neg'}">${R(rCum)}</td>
    <td class="pos">${R(oCum)}</td>`;
  tbody.appendChild(tr2);

  // Status
  const sb = el('sb3');
  if (rCum >= meta) { sb.className = 'sbox ok'; sb.textContent = '✓ Cenário Realista atinge a meta de ' + R(meta) + ' em receita acumulada. Investidores satisfeitos!' }
  else if (oCum >= meta) { sb.className = 'sbox wrn'; sb.textContent = '⚠ Apenas o cenário Otimista atinge a meta de ' + R(meta) + '. Revise a estratégia de aquisição.' }
  else { sb.className = 'sbox bad'; sb.textContent = '✗ Nenhum cenário atinge a meta de ' + R(meta) + ' no período. Revisão urgente de estratégia e precificação.' }

  if (c3) c3.destroy();
  c3 = new Chart(el('c3').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Pessimista', data: pd, borderColor: '#E24B4A', borderWidth: 2, pointRadius: 0, tension: .3, fill: false },
        { label: 'Realista', data: rd, borderColor: '#BA7517', borderWidth: 2, pointRadius: 0, tension: .3, fill: false },
        { label: 'Otimista', data: od, borderColor: '#1D9E75', borderWidth: 2, pointRadius: 0, tension: .3, fill: 'origin', backgroundColor: 'rgba(29,158,117,0.05)' },
        { label: 'Meta/mês', data: metaMes, borderColor: '#888', borderWidth: 1, borderDash: [4, 4], pointRadius: 0, fill: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + R(c.raw) } } },
      scales: {
        y: { ticks: { callback: v => v >= 1e6 ? 'R$' + (v / 1e6).toFixed(1) + 'M' : 'R$' + (v / 1000).toFixed(0) + 'k', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { size: 10 }, maxTicksLimit: 13 }, grid: { display: false } }
      }
    }
  });
}

// ── CHART 4 (resource donut) ─────────────────────────────────
let c4 = null;
function u4() {
  const serv = val('r4-serv'), tec = val('r4-tec'), sup = val('r4-sup'), mkt = val('r4-mkt'), adm = val('r4-adm');
  const rec = val('r4-rec'), cli = val('r4-cli');
  setTxt('v4-serv', R(serv)); setTxt('v4-tec', R(tec)); setTxt('v4-sup', R(sup));
  setTxt('v4-mkt', R(mkt)); setTxt('v4-adm', R(adm)); setTxt('v4-rec', R(rec)); setTxt('v4-cli', N(cli));
  const tot = serv + tec + sup + mkt + adm;
  setTxt('v4-tot', R(tot));
  const mg = (rec - tot) / rec, pct = tot / rec;
  setTxt('k4-mv', P(mg * 100)); setTxt('k4-cpc', 'R$ ' + Math.round(tot / cli));
  setTxt('k4-cpcs', 'base ' + N(cli) + ' clientes'); setTxt('k4-pv', P(pct * 100));
  el('k4-mc').className = 'kpi ' + (mg >= .2 ? 'pos' : mg >= 0 ? 'wrn' : 'neg');
  el('k4-pc').className = 'kpi ' + (pct < .65 ? 'pos' : pct < .80 ? 'wrn' : 'neg');

  const areas = [
    { lbl: 'Servidores / Infra', v: serv, c: '#1D9E75' },
    { lbl: 'Equipe técnica', v: tec, c: '#185FA5' },
    { lbl: 'Suporte ao cliente', v: sup, c: '#BA7517' },
    { lbl: 'Marketing', v: mkt, c: '#E24B4A' },
    { lbl: 'Administrativo', v: adm, c: '#888780' },
  ];
  el('rbars').innerHTML = areas.map(a => `
    <div class="rbar-row">
      <div class="rbar-lbl">${a.lbl}</div>
      <div class="rbar-bg"><div class="rbar-fill" style="width:${(a.v / tot * 100).toFixed(1)}%;background:${a.c}"></div></div>
      <div class="rbar-pct">${(a.v / tot * 100).toFixed(0)}%</div>
    </div>`).join('');

  // Recs
  const recs = [];
  if (tec / tot > .55) recs.push({ t: 'wrn', m: 'Equipe técnica representa ' + P(tec / tot * 100) + ' dos custos. Avaliar automação e ferramentas que ampliem produtividade.' });
  if (mkt / tot < .10) recs.push({ t: 'bad', m: 'Marketing abaixo de 10% (atual: ' + P(mkt / tot * 100) + '). Com concorrência crescente, aquisição de clientes pode ser comprometida.' });
  if (serv / tot > .15) recs.push({ t: 'wrn', m: 'Infra em nuvem representa ' + P(serv / tot * 100) + ' dos custos. Revisar plano e considerar reservas de capacidade para redução.' });
  if (pct < .65) recs.push({ t: 'ok', m: 'Custo/Receita de ' + P(pct * 100) + ' está saudável (abaixo de 65%). Manter disciplina de custos.' });
  if (mg < 0) recs.push({ t: 'bad', m: 'ALERTA: Margem negativa! Os custos superam a receita em ' + R(tot - rec) + '. Corte imediato necessário.' });
  else if (mg >= .25) recs.push({ t: 'ok', m: 'Margem de ' + P(mg * 100) + ' é sólida. Considerar reinvestir parte em P&D ou marketing de crescimento.' });
  if (sup / rec < .05) recs.push({ t: 'wrn', m: 'Suporte representa apenas ' + P(sup / rec * 100) + ' da receita. Monitorar satisfação de clientes para evitar churn.' });
  if (!recs.length) recs.push({ t: 'ok', m: 'Alocação equilibrada. Monitorar KPIs mensalmente e ajustar conforme crescimento.' });

  el('recs').innerHTML = recs.map(r => `<div class="sbox ${r.t}" style="margin-bottom:8px">${r.t === 'ok' ? '✓' : r.t === 'bad' ? '✗' : '⚠'} ${r.m}</div>`).join('');

  if (c4) c4.destroy();
  c4 = new Chart(el('c4').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: areas.map(a => a.lbl),
      datasets: [{ data: areas.map(a => a.v), backgroundColor: areas.map(a => a.c), borderWidth: 3, borderColor: '#fff' }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ' ' + R(c.raw) + ' (' + P(c.raw / tot * 100) + ')' } } },
      cutout: '62%'
    }
  });
}

// INIT
u1();
