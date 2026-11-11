// Gera PNG de 800 × 600 em escala de cinza, próprio para a tela horizontal.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { obterClima, LOCAL } from './src/clima.mjs';
import { obterCalendario } from './src/calendario.mjs';
import { paginaClima } from './src/layout.mjs';
import { cssFontes } from './src/fontes.mjs';

const navegadores = [process.env.CHROME_PATH,'/usr/bin/google-chrome','/usr/bin/chromium-browser','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].filter(Boolean);
const agora = new Date();
const atualizado = new Intl.DateTimeFormat('pt-BR',{timeZone:LOCAL.fuso,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(agora);
const [clima, cal] = await Promise.all([obterClima(),obterCalendario(agora)]);
const html = paginaClima({clima,cal,atualizado,fontesCSS:await cssFontes()});
await mkdir('saida',{recursive:true});
await writeFile('saida/painel.html',html);
await writeFile('saida/NotoSans-OFL.txt',await readFile(new URL('./node_modules/@fontsource/noto-sans/LICENSE',import.meta.url)));
const navegador = await puppeteer.launch({executablePath:navegadores.find(p=>existsSync(p)),headless:true,args:['--no-sandbox','--font-render-hinting=none']});
let png;
try {
  const pagina = await navegador.newPage();
  await pagina.setViewport({width:800,height:600,deviceScaleFactor:1});
  await pagina.setContent(html,{waitUntil:'domcontentloaded',timeout:30000});
  await pagina.evaluate(()=>document.fonts.ready);
  png = await pagina.screenshot({type:'png'});
} finally { await navegador.close(); }
const imagem = await sharp(png).grayscale().toColorspace('b-w').png({compressionLevel:9,palette:false}).toBuffer();
await Promise.all([
  writeFile('saida/painel.png',imagem),
  writeFile('saida/painel-horizontal.png',imagem),
  writeFile('saida/estado.json',JSON.stringify({gerado:agora.toISOString(),atualizado,largura:800,altura:600,orientacao:'horizontal',fonte:clima.fonte,temp:clima.atual.temp,feriado:cal.feriado,fato:cal.fato},null,2)),
]);
console.log(`ok: ${atualizado} · horizontal 800x600 · clima via ${clima.fonte} · ${clima.atual.temp}° ${clima.atual.descricao}`);
