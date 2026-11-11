// Gera a imagem do painel do Kindle (600x800, tons de cinza) em saida/painel.png.
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { obterClima, LOCAL } from './src/clima.mjs';
import { obterCalendario } from './src/calendario.mjs';
import { paginaClima } from './src/layout.mjs';

const NAVEGADORES = [
  process.env.CHROME_PATH,
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter(Boolean);

const agora = new Date();
const atualizado = new Intl.DateTimeFormat('pt-BR', { timeZone: LOCAL.fuso, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(agora);

const [clima, cal] = await Promise.all([obterClima(), obterCalendario(agora)]);
const html = paginaClima({ clima, cal, atualizado });

await mkdir('saida', { recursive: true });
await writeFile('saida/painel.html', html);

const navegador = await puppeteer.launch({
  executablePath: NAVEGADORES.find((p) => existsSync(p)),
  headless: true,
  args: ['--no-sandbox', '--font-render-hinting=none'],
});
const pagina = await navegador.newPage();
await pagina.setViewport({ width: 600, height: 800, deviceScaleFactor: 1 });
await pagina.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
await pagina.evaluate(() => document.fonts.ready);
const png = await pagina.screenshot({ type: 'png' });
await navegador.close();

// O Kindle precisa de PNG em tons de cinza de 8 bits (colorido aparece cortado ao meio).
await sharp(png).grayscale().png({ compressionLevel: 9, palette: false }).toColorspace('b-w').toFile('saida/painel.png');
await writeFile(
  'saida/estado.json',
  JSON.stringify({ gerado: agora.toISOString(), atualizado, fonte: clima.fonte, temp: clima.atual.temp, feriado: cal.feriado, fato: cal.fato }, null, 2),
);
console.log(`ok: ${atualizado} · clima via ${clima.fonte} · ${clima.atual.temp}° ${clima.atual.descricao}`);
