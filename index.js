require('dotenv').config();
const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');

const app = express();
const port = process.env.PORT || 8000;

const upload = multer({
  limits: {
    fieldSize: 50 * 1024 * 1024, // 50MB
  },
});



// Variável global para manter a instância do navegador
let browser;

/**
 * Função principal assíncrona para iniciar o navegador e o servidor
 */
(async () => {
  console.log('Iniciando o navegador (Puppeteer/Chromium)...');

  // Inicia o navegador UMA VEZ
  browser = await puppeteer.launch({
    // Opções essenciais para rodar no modo headless em um servidor Linux (Debian)
    // Especialmente importante ao rodar via systemd sem um display
    args: [
      '--no-sandbox',                // Desabilita o sandbox do Chromium
      '--disable-setuid-sandbox',    // Desabilita o sandbox setuid
      '--disable-dev-shm-usage',     // Evita problemas de memória compartilhada em VMs/Containers
      '--disable-gpu',               // Desabilita a aceleração por GPU (desnecessária no headless)
      // Flags de performance adicionadas:
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-translate',
      '--no-first-run',
      '--no-zygote',
      '--disable-renderer-backgrounding',
    ]
  });

  console.log('Navegador (Chromium) iniciado e pronto.');

  // Inicia o servidor Express apenas DEPOIS que o navegador estiver pronto
  app.listen(port, () => {
    console.log(`Serviço de PDF (Puppeteer) rodando em http://localhost:${port}`);
  });

})();


/**
 * Rota principal para conversão de HTML para conversão de HTML para PDF
 */
app.post('/html-report-renderer', upload.none(), async (req, res) => {
  // Verifica se o navegador está pronto
  if (!browser) {
    return res.status(503).send('Serviço (navegador) iniciando, tente novamente em alguns segundos.');
  }

  // Validação do corpo da requisição para JSON
  if (!req.body || !req.body.html || typeof req.body.html !== 'string' || req.body.html.length === 0) {
    return res.status(400).send('Corpo da requisição deve ser um JSON com a chave \'html\' não vazia.');
  }

  let context; // Manter o contexto para fechar no 'finally'

  try {
    // 1. Criar um "Contexto Anônimo"
    // Isso é como abrir uma janela 'anônima' - é 100% isolado da última requisição.
    // É a melhor forma de garantir que não haja vazamento de cookies ou cache.
    context = await browser.createBrowserContext();

    // 2. Criar uma nova aba (page) dentro do contexto
    const page = await context.newPage();

    // 3. Define o conteúdo da página como o HTML recebido
    // 'networkidle0' espera até que não haja mais conexões de rede pendentes (bom para HTMLs que carregam imagens/fontes externas)
    // 'domcontentloaded': Espera apenas que o HTML principal seja carregado e processado. Ele não espera por imagens, CSS ou sub-frames. Para um HTML que já vem pronto, esta é quase sempre a opção mais rápida e correta.
   // 'load': Espera que o HTML e todos os recursos (imagens, CSS) sejam carregados. É um meio-termo.
    await page.setContent(req.body.html, { waitUntil: 'load' });

    // 4. Gera o PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',                 // Formato da página
      printBackground: true,        // Inclui cores e imagens de fundo
      margin: {                     // Define as margens
        top: process.env.PDF_MARGIN_TOP || '1cm',
        right: process.env.PDF_MARGIN_RIGHT || '1cm',
        bottom: process.env.PDF_MARGIN_BOTTOM || '1cm',
        left: process.env.PDF_MARGIN_LEFT || '1cm'
      }
    });

    // 5. Envia o PDF como resposta
    res.contentType('application/pdf');
    res.send(pdfBuffer);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).send('Erro interno ao gerar o PDF: ' + error.message);
  } finally {

    // 6. FECHA O CONTEXTO (MUITO IMPORTANTE)
    // Isso fecha a 'page' e limpa todos os recursos da requisição, evitando vazamento de memória.
    if (context) {
      await context.close();
    }
  }
});

/**
 * Lida com o fechamento gracioso (graceful shutdown)
 * Isso é chamado pelo 'systemctl stop' (SIGTERM) ou Ctrl+C (SIGINT)
 */
async function gracefulShutdown(signal) {
  console.log(`Recebido ${signal}. Fechando o navegador...`);
  if (browser) {
    await browser.close();
  }
  console.log('Navegador fechado. Encerrando o processo.');
  process.exit(0);
}

// O systemd usa SIGTERM para parar o serviço
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// O Ctrl+C no terminal usa SIGINT
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
