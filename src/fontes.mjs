import { readFile } from 'node:fs/promises';

// A fonte viaja no próprio HTML; a renderização não depende do Google Fonts.
export async function cssFontes(base = new URL('../node_modules/@fontsource/noto-sans/files/', import.meta.url)) {
  return (await Promise.all([400, 700].map(async peso => {
    const dados = await readFile(new URL(`noto-sans-latin-${peso}-normal.woff2`, base));
    return `@font-face{font-family:'Noto Sans';font-style:normal;font-weight:${peso};font-display:block;src:url(data:font/woff2;base64,${dados.toString('base64')}) format('woff2')}`;
  }))).join('\n');
}
