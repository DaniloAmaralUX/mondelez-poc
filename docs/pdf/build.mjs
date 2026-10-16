// Gera docs/Documentacao-do-Projeto-Mondelez.pdf a partir dos markdowns de docs/.
// Uso: cd docs/pdf && npm install && npm run build
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { Marked } from 'marked';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const docs = path.resolve(here, '..');
const outDir = path.join(here, '.build');
const OUT_NAME = 'Documentacao-do-Projeto-Mondelez.pdf';
const VERSION = process.env.DOC_VERSION ?? '1.1';
const DATE = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
const TITLE = 'Gestão de Rotinas Operacionais · Mondelez';

// Capítulos na ordem do documento. `num` é o rótulo exibido (igual ao número do arquivo).
const chapters = [
  { num: '00', title: 'Sobre este documento', file: '00-como-usar-este-guia.md', lead: 'Propósito, o projeto em dez linhas, ordem de leitura, princípios e glossário mínimo.' },
  { num: null, title: 'Visão geral', html: 'overview.html', marker: 'Visão geral em poucas páginas' },
  { num: '01', title: 'Brief consolidado', file: '01-brief-consolidado.md', lead: 'Síntese de todas as fontes: briefing do Porto Digital, documento interno da Mondelez e proposta da Pitang.' },
  { num: '03', title: 'Personas', file: '03-personas.md', lead: 'Quem usa o produto, em que condições, e o que cada pessoa precisa ver primeiro.' },
  { num: '04', title: 'Jobs to be Done', file: '04-jobs-to-be-done.md', lead: 'O que cada persona precisa conseguir fazer, em ordem de prioridade, e como medir.' },
  { num: '02', title: 'Solução e stack', file: '02-solucao-e-stack.md', lead: 'Tese da solução, princípios, arquitetura, modelo de dados, regras de cálculo, motor de alertas e decisões.' },
  { num: '05', title: 'Requisitos', file: '05-requisitos.md', lead: 'Funcionais, por módulo, regras de negócio, permissões, não funcionais, restrições e glossário.' },
  { num: '06', title: 'Priorização MoSCoW', file: '06-moscow.md', lead: 'O que entra no protótipo, o que fica para o piloto, definição de pronto e ordem de construção.' },
  { num: '07', title: 'Processo de trabalho', file: '07-como-trabalhamos.md', lead: 'Frentes, ritmo, git e PRs, definição de pronto, convenções e comunicação.' },
  { num: '08', title: 'Plano de implementação', file: '08-plano-de-implementacao.md', lead: 'Ambiente, incrementos, frentes por módulo, backlog inicial, critérios de aceite e referências técnicas.' },
  { num: '09', title: 'Framework de UX (UI Audit)', file: '09-framework-ux-ui-audit.md', lead: 'O guia UI Audit aplicado ao projeto: apostas, leis de psicologia por tela, padrões por template, regras pré-decididas e ritual de auditoria.' },
];

const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function renderMarkdown(md, chapterId, toc) {
  const marked = new Marked({ gfm: true, breaks: false });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const plain = text.replace(/<[^>]+>/g, '');
        const id = `${chapterId}-${slug(plain)}`;
        if (depth === 2) toc.push({ id, text: plain });
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
      code({ text, lang }) {
        if (lang === 'mermaid') return `<div class="mermaid">${text}</div>`;
        const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return `<pre><code>${esc}</code></pre>`;
      },
      table(token) {
        const cols = token.header.length;
        const head = token.header.map((c) => `<th>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const body = token.rows.map((r) => `<tr>${r.map((c) => `<td>${this.parser.parseInline(c.tokens)}</td>`).join('')}</tr>`).join('');
        return `<div class="table-wrap"><table class="${cols >= 5 ? 'dense' : ''}"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
      },
    },
  });
  return marked.parse(md);
}

const css = readFileSync(path.join(here, 'style.css'), 'utf8');
const photo = pathToFileURL(path.join(docs, 'assets', 'foto-papel-chao-fabrica.png')).href;
const tocEntries = [];
let body = '';

for (const ch of chapters) {
  const id = ch.num ? `cap-${ch.num}` : slug(ch.title);
  const label = ch.num ? `Capítulo ${ch.num}` : ch.marker;
  const subs = [];
  if (ch.html) {
    body += readFileSync(path.join(here, ch.html), 'utf8');
  } else {
    let md = readFileSync(path.join(docs, ch.file), 'utf8');
    md = md.replace(/^# .*\n/, ''); // o título do arquivo é substituído pelo cabeçalho do capítulo
    const inner = renderMarkdown(md, id, subs);
    body += `<section class="chapter" id="${id}">
      <p class="kicker">${label}</p>
      <h1>${ch.title}</h1>
      ${ch.lead ? `<p class="lead">${ch.lead}</p>` : ''}
      ${inner}
    </section>`;
  }
  tocEntries.push({ id, num: ch.num ?? '', title: ch.title, marker: label, subs });
}

const tocHtml = `<section class="toc" id="sumario"><h1>Sumário</h1><ol>${tocEntries
  .map(
    (e) =>
      `<li class="main"><span class="num">${e.num}</span><span>${e.title}</span><span class="dots"></span><span class="pg" data-marker="${e.marker}"></span></li>` +
      e.subs.map((s) => `<li class="sub"><span>${s.text}</span></li>`).join(''),
  )
  .join('')}</ol>
  <p class="small" style="margin-top:8mm">Este documento é gerado a partir dos arquivos em <code>docs/</code>; a fonte viva é o markdown.</p>
</section>`;

const cover = `<section class="cover">
  <div>
    <div class="stripes"><i class="r"></i><i class="g"></i></div>
    <p class="brand">Pitang Labs · Mondelez · Digitalização da rotina de manufatura</p>
    <h1 class="title">Gestão de Rotinas Operacionais</h1>
    <p class="subtitle">Documentação do protótipo funcional: contexto, personas, jobs, solução, requisitos, prioridades e processo de trabalho.</p>
    <dl class="meta">
      <dt>Versão</dt><dd>${VERSION} · ${DATE}</dd>
      <dt>Fonte</dt><dd>arquivos markdown em <code>docs/</code> do repositório <code>pitang-labs/mondelez</code></dd>
      <dt>Escopo</dt><dd>protótipo web publicado na Vercel; piloto on-premise descrito na proposta Pitang</dd>
      <dt>Uso</dt><dd>interno Pitang e Mondelez</dd>
    </dl>
  </div>
  <div>
    <img class="photo" src="${photo}" alt="Pastas com formulários em papel sobre a máquina de embalagem">
    <p class="caption">Estado atual: formulários plastificados e cadernos sobre a máquina. É isso que o produto substitui.</p>
  </div>
</section>`;

const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${TITLE} · Documentação do projeto</title><style>${css}</style></head>
<body>${cover}${tocHtml}${body}
<script type="module">
  if (document.querySelector('.mermaid')) {
    try {
      const m = await import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs');
      m.default.initialize({ startOnLoad: false, theme: 'neutral' });
      await m.default.run({ querySelector: '.mermaid' });
    } catch (e) { console.warn('mermaid indisponível', e); }
  }
  document.body.dataset.ready = '1';
</script>
</body></html>`;

mkdirSync(outDir, { recursive: true });
const htmlPath = path.join(outDir, 'documentacao.html');
writeFileSync(htmlPath, html, 'utf8');

// Renderização com Edge/Chrome local.
const candidates = [
  process.env.BROWSER_PATH,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const executablePath = candidates.find((p) => existsSync(p));
if (!executablePath) throw new Error('Nenhum Edge/Chrome encontrado. Defina BROWSER_PATH.');

const footer = `<div style="width:100%;font-family:'Segoe UI',sans-serif;font-size:7.5pt;color:#111;padding:0 16mm;display:flex;justify-content:space-between;align-items:baseline;">
  <span><span style="display:inline-block;width:5mm;height:2px;background:#b4232c;vertical-align:middle;margin-right:2mm"></span>${TITLE} · Documentação do projeto v${VERSION}</span>
  <span style="font-variant-numeric:tabular-nums">pág. <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
const pdfOptions = {
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: footer,
  margin: { top: '18mm', right: '16mm', bottom: '20mm', left: '16mm' },
  preferCSSPageSize: false,
};

const browser = await puppeteer.launch({ executablePath, headless: true, args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle0', timeout: 60_000 });
  await page.waitForSelector('body[data-ready="1"]', { timeout: 30_000 }).catch(() => console.warn('aviso: página não sinalizou pronto; seguindo'));

  // Passo 1: PDF provisório para descobrir a página de cada capítulo.
  const draft = await page.pdf(pdfOptions);
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(draft), useSystemFonts: true, disableFontFace: true, verbosity: 0 }).promise;
  // O kicker do capítulo é o primeiro texto da página; o letter-spacing do CSS separa as letras
  // no texto extraído, então comparamos sem espaços e sem caixa.
  const norm = (s) => s.replace(/\s+/g, '').toLowerCase();
  const pageOf = {};
  const markers = tocEntries.map((e) => e.marker);
  for (let i = 2; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    const text = norm(content.items.map((it) => it.str).join(''));
    for (const mk of markers) if (pageOf[mk] === undefined && text.startsWith(norm(mk))) pageOf[mk] = i;
  }
  console.log('páginas dos capítulos:', pageOf);

  // Passo 2: preenche o sumário e gera o PDF final.
  await page.evaluate((map) => {
    document.querySelectorAll('.toc .pg[data-marker]').forEach((el) => {
      const p = map[el.dataset.marker];
      el.textContent = p ? String(p) : '';
    });
  }, pageOf);
  const final = await page.pdf(pdfOptions);
  const outPdf = path.join(docs, OUT_NAME);
  writeFileSync(outPdf, final);
  const finalDoc = await pdfjs.getDocument({ data: new Uint8Array(final), verbosity: 0 }).promise;
  console.log(`ok: ${outPdf} (${finalDoc.numPages} páginas, ${(final.length / 1024).toFixed(0)} KB)`);
} finally {
  await browser.close();
}
