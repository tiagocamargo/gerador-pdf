# Serviço de Conversão de HTML para PDF

Este projeto é um serviço Node.js que converte HTML em PDF usando Puppeteer. Ele expõe um endpoint HTTP que recebe um corpo HTML e retorna um arquivo PDF.

## Instalação

1. Clone o repositório.
2. Instale as dependências:

```bash
npm install
```

## Como Rodar

1. Crie um arquivo `.env` na raiz do projeto (você pode copiar o `.env.example`).
2. Inicie o serviço:

```bash
node index.js
```

O serviço estará rodando em `http://localhost:8000` (ou na porta que você definir).

## Variáveis de Ambiente

As seguintes variáveis de ambiente podem ser configuradas no arquivo `.env`:

| Variável                    | Descrição                                                                                             | Padrão                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `PORT`                      | A porta em que o serviço irá rodar.                                                                   | `8000`                                                                      |
| `PUPPETEER_EXECUTABLE_PATH` | O caminho para o executável do Chromium. Se não for definido, o Puppeteer usará a versão que vem com ele. | (Nenhum)                                                                    |
| `PDF_MARGIN_TOP`            | A margem superior do PDF.                                                                             | `1cm`                                                                       |
| `PDF_MARGIN_RIGHT`          | A margem direita do PDF.                                                                              | `1cm`                                                                       |
| `PDF_MARGIN_BOTTOM`         | A margem inferior do PDF.                                                                             | `1cm`                                                                       |
| `PDF_MARGIN_LEFT`           | A margem esquerda do PDF.                                                                             | `1cm`                                                                       |
| `PUPPETEER_WAIT_UNTIL`      | A opção de espera do Puppeteer ao carregar o HTML. Opções: `load`, `domcontentloaded`, `networkidle0`. | `load`                                                                      |

## Endpoint da API

### `POST /html-report-renderer`

Converte um HTML para PDF.

**Corpo da Requisição:**

- `Content-Type`: `application/json`

```json
{
  "html": "<h1>Olá, Mundo!</h1>"
}
```

**Resposta de Sucesso:**

- `Content-Type`: `application/pdf`
- O corpo da resposta será o arquivo PDF gerado.

**Respostas de Erro:**

- `400 Bad Request`: Se o corpo da requisição for inválido (por exemplo, sem a chave `html`).
- `500 Internal Server Error`: Se ocorrer um erro durante a geração do PDF.
- `503 Service Unavailable`: Se o serviço estiver iniciando e o navegador ainda não estiver pronto.
