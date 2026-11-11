// Calendário do dia: feriados (calculados), datas comemorativas e fatos da Wikipédia em português.
import { LOCAL } from './clima.mjs';

const UA = { 'User-Agent': 'painel-kindle/1.0 (projeto pessoal)' };
const p2 = (n) => String(n).padStart(2, '0');
const chave = (m, d) => `${p2(m)}-${p2(d)}`;

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
export const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

// Data de hoje no fuso de Janaúba.
export function hojeLocal(agora = new Date()) {
  const [a, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL.fuso }).format(agora).split('-').map(Number);
  const semana = new Date(Date.UTC(a, m - 1, d)).getUTCDay();
  return { ano: a, mes: m, dia: d, semana };
}

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(ano, mes - 1, dia));
}
const somarDias = (dt, n) => new Date(dt.getTime() + n * 86400000);
const chaveData = (dt) => chave(dt.getUTCMonth() + 1, dt.getUTCDate());
function nDomingo(ano, mes, n) {
  const primeiro = new Date(Date.UTC(ano, mes - 1, 1));
  return somarDias(primeiro, ((7 - primeiro.getUTCDay()) % 7) + 7 * (n - 1));
}

// Feriados e datas móveis do ano. tipo: 'feriado' | 'facultativo' | 'data'
export function feriadosDoAno(ano) {
  const p = pascoa(ano);
  const lista = {
    '01-01': ['feriado', 'Confraternização Universal'],
    '04-21': ['feriado', 'Tiradentes'],
    '05-01': ['feriado', 'Dia do Trabalhador'],
    '09-07': ['feriado', 'Independência do Brasil'],
    '10-12': ['feriado', 'Nossa Senhora Aparecida'],
    '11-02': ['feriado', 'Finados'],
    '11-15': ['feriado', 'Proclamação da República'],
    '11-20': ['feriado', 'Dia Nacional de Zumbi e da Consciência Negra'],
    '12-25': ['feriado', 'Natal'],
  };
  lista[chaveData(somarDias(p, -48))] = ['facultativo', 'Carnaval'];
  lista[chaveData(somarDias(p, -47))] = ['facultativo', 'Carnaval'];
  lista[chaveData(somarDias(p, -46))] = ['facultativo', 'Quarta-feira de Cinzas'];
  lista[chaveData(somarDias(p, -2))] = ['feriado', 'Sexta-feira Santa'];
  lista[chaveData(p)] = ['data', 'Páscoa'];
  lista[chaveData(somarDias(p, 60))] = ['facultativo', 'Corpus Christi'];
  lista[chaveData(nDomingo(ano, 5, 2))] = ['data', 'Dia das Mães'];
  lista[chaveData(nDomingo(ano, 8, 2))] = ['data', 'Dia dos Pais'];
  return lista;
}

// Datas comemorativas que fazem sentido para ele e às vezes faltam na Wikipédia.
const COMEMORATIVAS = {
  '08-11': ['Dia do Advogado', 'Dia do Estudante'],
  '10-23': ['Dia do Aviador'],
  '12-08': ['Dia da Justiça'],
  '10-15': ['Dia do Professor'],
  '10-12': ['Dia das Crianças'],
  '06-12': ['Dia dos Namorados'],
  '12-24': ['Véspera de Natal'],
  '12-31': ['Véspera de Ano-Novo'],
};

async function wiki(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`Wikipédia ${r.status}`);
  return r.json();
}

// Acessos dos últimos 30 dias de vários artigos numa consulta só (usado para escolher o mais conhecido).
async function audiencias(titulos) {
  const total = {};
  let cont = {}, voltas = 0;
  try {
    do {
      const qs = new URLSearchParams({ action: 'query', prop: 'pageviews', pvipdays: '30', format: 'json', formatversion: '2', titles: titulos.join('|'), ...cont });
      const j = await wiki(`https://pt.wikipedia.org/w/api.php?${qs}`);
      for (const p of j.query?.pages || []) if (p.pageviews) total[p.title] = Object.values(p.pageviews).reduce((s, v) => s + (v || 0), 0);
      cont = j.continue || null;
    } while (cont && ++voltas < 10);
  } catch (e) { console.error('Audiência indisponível:', e.message); }
  return total;
}

const ehBrasil = (t = '') => /brasil|brasileir|imperador pedro|d\. pedro|getúlio|rio de janeiro|são paulo|minas gerais|bahia/i.test(t);
const tituloPrincipal = (item) => (item.pages?.[0]?.title || '').replace(/_/g, ' ');

async function maisConhecido(itens, max = 50) {
  const cand = itens.slice(0, max);
  const notas = await audiencias([...new Set(cand.map(tituloPrincipal).filter(Boolean))]);
  let melhor = cand[0], nota = -1;
  for (const i of cand) { const n = notas[tituloPrincipal(i)] ?? 0; if (n > nota) { nota = n; melhor = i; } }
  return melhor;
}

const limparTexto = (t = '') => t.replace(/\s+/g, ' ').replace(/\.$/, '').trim();

export async function obterCalendario(agora = new Date()) {
  const h = hojeLocal(agora);
  const k = chave(h.mes, h.dia);
  const feriados = feriadosDoAno(h.ano);
  const feriado = feriados[k] ? { tipo: feriados[k][0], nome: feriados[k][1] } : null;

  let comemorativas = [...(COMEMORATIVAS[k] || [])];
  let fato = null, nascimento = null;
  try {
    const w = await wiki(`https://pt.wikipedia.org/api/rest_v1/feed/onthisday/all/${p2(h.mes)}/${p2(h.dia)}`);

    // Datas comemorativas: só as brasileiras e mundiais; aniversários de cidades só se for Janaúba/MG.
    for (const x of w.holidays || []) {
      const t = limparTexto(x.text);
      if (/^Aniversário d/i.test(t) && !/Janaúba|Minas Gerais/i.test(t)) continue;
      if (!/^(Dia|Semana|Festa|Aniversário)/i.test(t)) continue;
      if (comemorativas.some((c) => c.toLowerCase() === t.toLowerCase())) continue;
      if (feriado && t.toLowerCase().includes(feriado.nome.toLowerCase())) continue;
      comemorativas.push(t);
    }

    // Fato do dia: prefere acontecimento ligado ao Brasil; entre eles, o mais lido.
    const eventos = [...(w.selected || []), ...(w.events || [])];
    const doBrasil = eventos.filter((e) => ehBrasil(e.text) || ehBrasil(e.pages?.map((p) => p.extract).join(' ')));
    const ev = doBrasil.length ? await maisConhecido(doBrasil) : (w.selected?.[0] || w.events?.[0]);
    if (ev) fato = { ano: ev.year, texto: limparTexto(ev.text) };

    // Quem nasceu hoje: brasileiro mais conhecido.
    const nasc = (w.births || []).filter((b) => /brasileir/i.test(b.text));
    const n = nasc.length ? await maisConhecido(nasc) : null;
    if (n) nascimento = { ano: n.year, texto: limparTexto(n.text) };
  } catch (e) {
    console.error('Wikipédia indisponível:', e.message);
  }

  // Grade do mês (domingo primeiro), com os feriados marcados.
  const primeiro = new Date(Date.UTC(h.ano, h.mes - 1, 1)).getUTCDay();
  const diasNoMes = new Date(Date.UTC(h.ano, h.mes, 0)).getUTCDate();
  const grade = [];
  for (let i = 0; i < primeiro; i++) grade.push(null);
  for (let d = 1; d <= diasNoMes; d++) {
    const f = feriados[chave(h.mes, d)];
    grade.push({ dia: d, hoje: d === h.dia, feriado: f?.[0] === 'feriado' });
  }

  return { ...h, feriado, comemorativas: comemorativas.slice(0, 3), fato, nascimento, grade };
}
