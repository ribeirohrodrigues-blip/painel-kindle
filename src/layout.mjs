// Página de 800 × 600: clima e calendário com leitura ampliada para o Kindle.
import { icone } from './icones.mjs';
import { LOCAL } from './clima.mjs';
import { MESES, SEMANA } from './calendario.mjs';

const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const grau = n => Number.isFinite(n) ? `${n}°` : '–';
const numero = n => Number.isFinite(n) ? n : '–';

export function paginaClima({ clima: c, cal, atualizado, fontesCSS = '' }) {
  const horas = c.horas.slice(0, 7).map(h => `<div class="hora"><span class="hh">${esc(h.hora)}</span>${icone(h.tipo, 34, 1.8)}<strong>${grau(h.temp)}</strong><span class="chuva">${numero(h.chuva)}%</span></div>`).join('');
  const cab = ['D','S','T','Q','Q','S','S'].map(d => `<div class="gc">${d}</div>`).join('');
  const dias = cal.grade.map(g => g ? `<div class="gd${g.hoje ? ' hoje' : ''}${g.feriado ? ' fer' : ''}">${g.dia}</div>` : '<div class="gd"></div>').join('');
  const dia = (rotulo, d) => `<section class="dia"><div class="rotulo">${rotulo}</div><div class="range">${icone(d?.tipo, 38, 1.8)}<b>${grau(d?.max)} <span>/ ${grau(d?.min)}</span></b></div><p class="condicao">${esc(d?.descricao || 'Sem previsão')}</p><p class="detalhe">${numero(d?.chuva)}% de chuva</p><p class="detalhe">Vento ${numero(d?.vento ?? c.atual.vento)} km/h</p></section>`;
  const linhas = [];
  if (cal.feriado) {
    const rot = cal.feriado.tipo === 'feriado' ? 'Feriado' : cal.feriado.tipo === 'facultativo' ? 'Ponto facultativo' : 'Data especial';
    linhas.push(`<p class="li especial"><b>${rot}</b> ${esc(cal.feriado.nome)}</p>`);
  }
  if (cal.comemorativas?.length) linhas.push(`<p class="li comemoracoes"><b>Comemora-se</b> ${cal.comemorativas.map(esc).join(' · ')}</p>`);
  if (cal.fato) linhas.push(`<p class="li fato"><b>Neste dia, em ${esc(cal.fato.ano)}</b> ${esc(cal.fato.texto)}.</p>`);
  if (cal.nascimento) linhas.push(`<p class="li nascimento"><b>Nasceu em ${esc(cal.nascimento.ano)}</b> ${esc(cal.nascimento.texto)}</p>`);
  if (!linhas.length) linhas.push('<p class="li">Nenhuma data especial hoje.</p>');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=800">
<!-- Noto Sans, SIL Open Font License. Licença em NotoSans-OFL.txt. -->
<style>${fontesCSS}</style>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:800px;height:600px;background:#fff;color:#000;font-family:'Noto Sans',Arial,sans-serif;overflow:hidden}
body{padding:14px 20px 12px;font-size:20px}
.topo{height:40px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #000;padding-right:112px}
.cidade{font-size:23px;font-weight:700;white-space:nowrap}.cidade span{font-size:18px;font-weight:400}
.atualizado{font-size:18px;line-height:30px}
.atual{height:176px;display:grid;grid-template-columns:300px 1fr 1fr;border-bottom:2px solid #000;gap:14px;padding:10px 0}
.agora{display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0}
.big{display:flex;align-items:center;gap:6px;height:107px}.big svg{width:105px;height:105px;flex-shrink:0}
.temperatura{font-size:108px;font-weight:700;line-height:1;letter-spacing:-5px}
.descricao{font-size:25px;line-height:31px;text-align:center;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sensacao{font-size:18px;line-height:25px;white-space:nowrap}
.dia{border-left:1px solid #000;padding-left:14px;min-width:0}
.rotulo{font-size:20px;font-weight:700;line-height:25px}
.range{display:flex;gap:6px;align-items:center;height:43px;white-space:nowrap}.range svg{flex-shrink:0}.range b{font-size:32px;letter-spacing:-1.3px}.range span{font-size:28px;font-weight:500}
.condicao{font-size:19px;line-height:23px;height:46px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.detalhe{font-size:18px;line-height:23px;white-space:nowrap}
.horas{height:111px;display:grid;grid-template-columns:repeat(7,1fr);border-bottom:2px solid #000;padding:6px 0 5px}
.hora{display:flex;flex-direction:column;align-items:center;gap:0;min-width:0}.hh{font-size:18px;line-height:22px}.hora strong{font-size:23px;line-height:25px}.chuva{font-size:18px;line-height:22px}
.calcab{height:36px;display:flex;align-items:center;justify-content:space-between}.calcab b{font-size:21px}.calcab span{font-size:18px}
.cal{height:209px;display:grid;grid-template-columns:100px 232px 1fr;gap:16px;min-width:0}
.tile{height:178px;background:#000;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center}.tile .m{font-size:19px;letter-spacing:2px;font-weight:700}.tile .d{font-size:76px;font-weight:700;line-height:1.12}.tile .s{font-size:18px}
.mes{font-size:20px;line-height:27px;font-weight:700;text-transform:capitalize}
.grade{display:grid;grid-template-columns:repeat(7,1fr);align-content:start;row-gap:0}
.gc{font-size:18px;line-height:24px;font-weight:700;text-align:center}.gd{font-size:20px;text-align:center;height:25px;line-height:25px}.gd.fer{font-weight:700;text-decoration:underline}.gd.hoje{background:#000;color:#fff;font-weight:700;border-radius:2px}
.fatos{display:flex;flex-direction:column;gap:7px;min-width:0;height:209px;overflow:hidden;border-left:1px solid #000;padding-left:14px}
.li{font-size:19px;line-height:23.5px;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}.li b{font-weight:700}.li.fato{-webkit-line-clamp:3}.li.especial{font-weight:500}.li.especial b{background:#000;color:#fff;padding:0 4px}
.tem-feriado .comemoracoes{-webkit-line-clamp:1}.tem-feriado .fato{-webkit-line-clamp:2}.tem-feriado .nascimento{-webkit-line-clamp:1}
</style></head><body class="${cal.feriado ? 'tem-feriado' : ''}">
<header class="topo"><div class="cidade">${esc(LOCAL.nome)} <span>· Minas Gerais</span></div><span class="atualizado">Atualizado ${esc(atualizado)}</span></header>
<main><div class="atual"><section class="agora"><div class="big">${icone(c.atual.tipo,105,1.45)}<strong class="temperatura">${grau(c.atual.temp)}</strong></div><p class="descricao">${esc(c.atual.descricao)}</p><p class="sensacao">Sensação ${grau(c.atual.sensacao)} · Umidade ${numero(c.atual.umidade)}%</p></section>${dia('Hoje',c.hoje)}${dia('Amanhã',c.amanha)}</div>
<section class="horas" aria-label="Previsão por horário">${horas}</section>
<header class="calcab"><b>Calendário</b><span>${esc(SEMANA[cal.semana].replace(/^./, x=>x.toUpperCase()))}, ${cal.dia} de ${MESES[cal.mes-1]} de ${cal.ano}</span></header>
<section class="cal"><div class="tile"><span class="m">${MESES[cal.mes-1].slice(0,3).toUpperCase()}</span><span class="d">${cal.dia}</span><span class="s">${SEMANA[cal.semana].split('-')[0]}</span></div><div><div class="mes">${MESES[cal.mes-1]}</div><div class="grade">${cab}${dias}</div></div><div class="fatos">${linhas.join('')}</div></section></main>
</body></html>`;
}
