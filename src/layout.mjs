// Página 1 do painel: clima de Janaúba (no estilo do post) + calendário do dia. Tela do Kindle: 600x800.
import { icone } from './icones.mjs';
import { LOCAL } from './clima.mjs';
import { MESES, SEMANA } from './calendario.mjs';

const esc = (s = '') => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const grau = (n) => (Number.isFinite(n) ? `${n}°` : '–');

export function paginaClima({ clima: c, cal, atualizado }) {
  const horas = c.horas
    .map((h) => `<div class="h"><div class="hh">${h.hora}</div>${icone(h.tipo, 34, 1.6)}<div class="ht">${grau(h.temp)}</div><div class="hc">${h.chuva}%</div></div>`)
    .join('');

  const cab = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => `<div class="gc">${d}</div>`).join('');
  const dias = cal.grade
    .map((g) => (g ? `<div class="gd${g.hoje ? ' hoje' : ''}${g.feriado ? ' fer' : ''}">${g.dia}</div>` : '<div class="gd"></div>'))
    .join('');

  const linhas = [];
  if (cal.feriado) {
    const rot = cal.feriado.tipo === 'feriado' ? 'Feriado nacional' : cal.feriado.tipo === 'facultativo' ? 'Ponto facultativo' : 'Data especial';
    linhas.push(`<div class="selo"><span>${rot}</span>${esc(cal.feriado.nome)}</div>`);
  }
  if (cal.comemorativas.length) linhas.push(`<div class="li"><b>Comemora-se</b> ${cal.comemorativas.map(esc).join(' · ')}</div>`);
  if (cal.fato) linhas.push(`<div class="li fato"><b>Neste dia, em ${cal.fato.ano}</b> ${esc(cal.fato.texto)}.</div>`);
  if (cal.nascimento) linhas.push(`<div class="li"><b>Nasceu em ${cal.nascimento.ano}</b> ${esc(cal.nascimento.texto)}</div>`);
  if (!linhas.length) linhas.push('<div class="li">Nenhuma data especial hoje.</div>');

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:600px;height:800px;background:#fff;color:#000;font-family:'Noto Sans',sans-serif;overflow:hidden}
body{padding:14px 22px 0}
.topo{display:flex;justify-content:center;font-size:14px;height:22px;align-items:center;color:#222}
.cidade{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1.5px solid #000;padding:4px 0 6px;margin-top:2px}
.cidade b{font-size:17px;font-weight:600}
.cidade span{font-size:14px;color:#222}
.atual{display:flex;border-bottom:1.5px solid #000;height:236px}
.esq{width:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.big{display:flex;align-items:center;gap:6px}
.big .t{font-size:92px;font-weight:700;line-height:1;letter-spacing:-2px}
.desc{font-size:21px;margin-top:6px}
.sens{font-size:14.5px;color:#111}
.dir{flex:1;padding:16px 0 0 18px;display:flex;flex-direction:column}
.rot{font-size:14px;color:#222}
.mm{font-size:28px;font-weight:700;line-height:1.15}
.cond{font-size:17px;margin-top:4px}
.det{font-size:14px;color:#111;margin-top:2px}
.amanha{border-top:1px solid #000;margin-top:12px;padding-top:10px;display:flex;gap:12px;align-items:center}
.amanha .mm{font-size:22px}
.horas{display:flex;justify-content:space-between;padding:12px 4px 10px;border-bottom:1.5px solid #000}
.h{display:flex;flex-direction:column;align-items:center;gap:4px;width:70px}
.hh{font-size:13.5px;color:#222}
.ht{font-size:17px;font-weight:700}
.hc{font-size:13px;color:#222}
.calcab{display:flex;justify-content:space-between;align-items:baseline;padding:10px 0 8px}
.calcab b{font-size:17px;font-weight:600}
.calcab span{font-size:14.5px}
.cal{display:flex;gap:16px}
.tile{width:132px;height:148px;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}
.tile .m{font-size:15px;letter-spacing:2px;text-transform:uppercase;font-weight:600}
.tile .d{font-size:66px;font-weight:700;line-height:1.05}
.tile .s{font-size:15px}
.grade{flex:1;display:grid;grid-template-columns:repeat(7,1fr);row-gap:1px;align-content:start}
.gc{font-size:12.5px;font-weight:700;text-align:center;padding-bottom:3px}
.gd{font-size:14px;text-align:center;height:21px;line-height:21px}
.gd.fer{font-weight:700;text-decoration:underline}
.gd.hoje{background:#000;color:#fff;font-weight:700;border-radius:3px}
.fatos{margin-top:12px;display:flex;flex-direction:column;gap:8px}
.selo{font-size:16px;font-weight:600}
.selo span{background:#000;color:#fff;font-size:12.5px;padding:2px 7px;margin-right:8px;border-radius:2px;text-transform:uppercase;letter-spacing:.5px;vertical-align:2px}
.li{font-size:15.5px;line-height:1.34;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.li.fato{-webkit-line-clamp:3}
.li b{font-weight:700;margin-right:4px}
</style></head><body>
<div class="topo">Atualizado ${atualizado}</div>
<div class="cidade"><b>${esc(LOCAL.nome)}</b><span>Minas Gerais</span></div>
<div class="atual">
  <div class="esq">
    <div class="big">${icone(c.atual.tipo, 112, 1.3)}<div class="t">${grau(c.atual.temp)}</div></div>
    <div class="desc">${esc(c.atual.descricao)}</div>
    <div class="sens">Sensação ${grau(c.atual.sensacao)} · Umidade ${c.atual.umidade}%</div>
  </div>
  <div class="dir">
    <div class="rot">Hoje</div>
    <div class="mm">${grau(c.hoje?.max)} / ${grau(c.hoje?.min)}</div>
    <div class="cond">${esc(c.hoje?.descricao)}</div>
    <div class="det">${c.hoje?.chuva ?? 0}% chuva · ${c.hoje?.vento ?? c.atual.vento} km/h</div>
    <div class="amanha">${icone(c.amanha?.tipo, 44, 1.5)}<div><div class="rot">Amanhã</div><div class="mm">${grau(c.amanha?.max)} / ${grau(c.amanha?.min)}</div><div class="det">${c.amanha?.chuva ?? 0}% chuva</div></div></div>
  </div>
</div>
<div class="horas">${horas}</div>
<div class="calcab"><b>Calendário</b><span>${SEMANA[cal.semana].replace(/^./, (x) => x.toUpperCase())}, ${cal.dia} de ${MESES[cal.mes - 1]} de ${cal.ano}</span></div>
<div class="cal">
  <div class="tile"><div class="m">${MESES[cal.mes - 1].slice(0, 3)}</div><div class="d">${cal.dia}</div><div class="s">${SEMANA[cal.semana].split('-')[0]}</div></div>
  <div class="grade">${cab}${dias}</div>
</div>
<div class="fatos">${linhas.join('')}</div>
</body></html>`;
}
