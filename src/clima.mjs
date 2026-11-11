// Clima de Janaúba-MG. Fonte principal: Google Weather API (a mesma base do "clima do Google").
// Enquanto a chave GOOGLE_WEATHER_KEY não existir, usa o Open-Meteo como substituto provisório.

export const LOCAL = { nome: 'Janaúba', lat: -15.8025, lon: -43.30889, fuso: 'America/Sao_Paulo' };

const UA = { 'User-Agent': 'painel-kindle/1.0 (projeto pessoal)' };

async function json(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${r.status} em ${url.replace(/key=[^&]+/, 'key=***')}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

const horaLocal = (iso) =>
  new Intl.DateTimeFormat('pt-BR', { timeZone: LOCAL.fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
const dataLocal = (d) => new Intl.DateTimeFormat('en-CA', { timeZone: LOCAL.fuso }).format(d); // AAAA-MM-DD

// Escolhe 7 horários de 3 em 3 horas a partir da próxima hora cheia (como no post).
function escolherHoras(lista) {
  const agora = Date.now();
  const futuras = lista.filter((h) => new Date(h.inicio).getTime() > agora - 30 * 60 * 1000);
  const out = [];
  for (let i = 0; i < futuras.length && out.length < 7; i += 3) out.push(futuras[i]);
  return out;
}

// ---------- Google Weather API ----------
function iconeGoogle(tipo = '', dia = true) {
  const t = tipo.toUpperCase();
  if (t.includes('THUNDER') || t.includes('HAIL')) return 'tempestade';
  if (t.includes('SNOW')) return 'neve';
  if (t.includes('LIGHT_RAIN') || t.includes('DRIZZLE') || t === 'CHANCE_OF_SHOWERS' || t === 'LIGHT_RAIN_SHOWERS') return 'garoa';
  if (t.includes('RAIN') || t.includes('SHOWER')) return 'chuva';
  if (t.includes('WIND')) return 'vento';
  if (t.includes('FOG') || t.includes('HAZE') || t.includes('MIST')) return 'neblina';
  if (t === 'CLEAR' || t === 'MOSTLY_CLEAR') return dia ? 'sol' : 'lua';
  if (t === 'PARTLY_CLOUDY') return dia ? 'nuvem-sol' : 'nuvem-lua';
  if (t.includes('CLOUDY')) return 'nuvem';
  return dia ? 'nuvem-sol' : 'nuvem-lua';
}

const capitalizar = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

async function viaGoogle(chave) {
  const base = 'https://weather.googleapis.com/v1';
  const q = `key=${chave}&location.latitude=${LOCAL.lat}&location.longitude=${LOCAL.lon}&languageCode=pt-BR&unitsSystem=METRIC`;
  const [atual, horas, dias] = await Promise.all([
    json(`${base}/currentConditions:lookup?${q}`),
    json(`${base}/forecast/hours:lookup?${q}&hours=24&pageSize=24`),
    json(`${base}/forecast/days:lookup?${q}&days=10&pageSize=10`),
  ]);
  const dia = (d) => {
    const cond = d.daytimeForecast?.weatherCondition;
    return {
      data: `${d.displayDate.year}-${String(d.displayDate.month).padStart(2, '0')}-${String(d.displayDate.day).padStart(2, '0')}`,
      max: Math.round(d.maxTemperature?.degrees),
      min: Math.round(d.minTemperature?.degrees),
      tipo: iconeGoogle(cond?.type, true),
      descricao: capitalizar(cond?.description?.text),
      chuva: Math.max(d.daytimeForecast?.precipitation?.probability?.percent ?? 0, d.nighttimeForecast?.precipitation?.probability?.percent ?? 0),
      vento: Math.round(d.daytimeForecast?.wind?.speed?.value ?? 0),
    };
  };
  const listaDias = (dias.forecastDays || []).map(dia);
  const hoje = dataLocal(new Date());
  const iHoje = Math.max(0, listaDias.findIndex((d) => d.data === hoje));
  return {
    fonte: 'Google',
    atual: {
      temp: Math.round(atual.temperature?.degrees),
      sensacao: Math.round(atual.feelsLikeTemperature?.degrees),
      umidade: atual.relativeHumidity,
      descricao: capitalizar(atual.weatherCondition?.description?.text),
      tipo: iconeGoogle(atual.weatherCondition?.type, atual.isDaytime),
      vento: Math.round(atual.wind?.speed?.value ?? 0),
    },
    hoje: listaDias[iHoje],
    amanha: listaDias[iHoje + 1],
    dias: listaDias.slice(iHoje),
    horas: escolherHoras(
      (horas.forecastHours || []).map((h) => ({
        inicio: h.interval?.startTime,
        hora: horaLocal(h.interval?.startTime),
        tipo: iconeGoogle(h.weatherCondition?.type, h.isDaytime),
        temp: Math.round(h.temperature?.degrees),
        chuva: h.precipitation?.probability?.percent ?? 0,
      })),
    ),
  };
}

// ---------- Open-Meteo (provisório) ----------
const WMO = {
  0: ['Céu limpo', 'sol'], 1: ['Predominantemente limpo', 'sol'], 2: ['Parcialmente nublado', 'nuvem-sol'], 3: ['Nublado', 'nuvem'],
  45: ['Neblina', 'neblina'], 48: ['Neblina', 'neblina'],
  51: ['Garoa fraca', 'garoa'], 53: ['Garoa', 'garoa'], 55: ['Garoa forte', 'garoa'], 56: ['Garoa', 'garoa'], 57: ['Garoa', 'garoa'],
  61: ['Chuva fraca', 'garoa'], 63: ['Chuva', 'chuva'], 65: ['Chuva forte', 'chuva'], 66: ['Chuva', 'chuva'], 67: ['Chuva forte', 'chuva'],
  71: ['Neve', 'neve'], 73: ['Neve', 'neve'], 75: ['Neve', 'neve'], 77: ['Neve', 'neve'],
  80: ['Pancadas de chuva', 'chuva'], 81: ['Pancadas de chuva', 'chuva'], 82: ['Pancadas fortes', 'chuva'],
  85: ['Neve', 'neve'], 86: ['Neve', 'neve'],
  95: ['Trovoadas', 'tempestade'], 96: ['Trovoadas com granizo', 'tempestade'], 99: ['Trovoadas com granizo', 'tempestade'],
};
function wmo(code, dia = true) {
  const [desc, ic] = WMO[code] || ['—', 'nuvem'];
  const icone = !dia && ic === 'sol' ? 'lua' : !dia && ic === 'nuvem-sol' ? 'nuvem-lua' : ic;
  return { descricao: desc, tipo: icone };
}

async function viaOpenMeteo() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${LOCAL.lat}&longitude=${LOCAL.lon}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day' +
    '&hourly=temperature_2m,precipitation_probability,weather_code,is_day' +
    '&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max' +
    `&timezone=${encodeURIComponent(LOCAL.fuso)}&forecast_days=10&timeformat=unixtime`;
  const d = await json(url);
  const c = d.current;
  const dias = d.daily.time.map((t, i) => ({
    data: dataLocal(new Date(t * 1000)),
    max: Math.round(d.daily.temperature_2m_max[i]),
    min: Math.round(d.daily.temperature_2m_min[i]),
    chuva: d.daily.precipitation_probability_max[i] ?? 0,
    vento: Math.round(d.daily.wind_speed_10m_max[i] ?? 0),
    ...wmo(d.daily.weather_code[i]),
  }));
  return {
    fonte: 'Open-Meteo',
    atual: {
      temp: Math.round(c.temperature_2m),
      sensacao: Math.round(c.apparent_temperature),
      umidade: c.relative_humidity_2m,
      vento: Math.round(c.wind_speed_10m),
      ...wmo(c.weather_code, c.is_day === 1),
    },
    hoje: dias[0],
    amanha: dias[1],
    dias,
    horas: escolherHoras(
      d.hourly.time.map((t, i) => ({
        inicio: new Date(t * 1000).toISOString(),
        hora: horaLocal(t * 1000),
        temp: Math.round(d.hourly.temperature_2m[i]),
        chuva: d.hourly.precipitation_probability[i] ?? 0,
        tipo: wmo(d.hourly.weather_code[i], d.hourly.is_day[i] === 1).tipo,
      })),
    ),
  };
}

export async function obterClima() {
  const chave = process.env.GOOGLE_WEATHER_KEY;
  if (chave) {
    try {
      return await viaGoogle(chave);
    } catch (e) {
      console.error('Google Weather falhou, usando Open-Meteo:', e.message);
    }
  }
  return viaOpenMeteo();
}
