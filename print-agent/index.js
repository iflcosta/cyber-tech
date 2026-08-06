/**
 * Agente de impressão local do Cyber ERP.
 *
 * Roda no PC da bancada (não no Vercel, não no navegador). Ouve em
 * localhost e, quando o site manda um payload ESC/POS via POST
 * /print, abre a porta COM da impressora (criada pelo Windows quando
 * a MPT-II é pareada por Bluetooth) e escreve os bytes crus nela.
 *
 * Por que precisa disso: o navegador não tem acesso a porta
 * serial/Bluetooth diretamente (WebUSB existe, mas só cobre USB, e a
 * MPT-II é Bluetooth). Esse agentinho é a ponte.
 *
 * Uso:
 *   1. npm install
 *   2. cp .env.example .env   (e ajustar PRINTER_COM_PORT se precisar)
 *   3. npm start
 *   4. Deixar rodando enquanto usa o sistema (ideal: iniciar junto
 *      com o Windows — ver README.md).
 */

require('dotenv').config();
const http = require('http');
const { SerialPort } = require('serialport');

const PORT = Number(process.env.PORT) || 9100;
const COM_PORT = process.env.PRINTER_COM_PORT || 'COM9';
const BAUD_RATE = Number(process.env.BAUD_RATE) || 9600;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://cyberinformatica.tech';

function withCors(res) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function printBytes(bytes) {
  return new Promise((resolve, reject) => {
    const port = new SerialPort({ path: COM_PORT, baudRate: BAUD_RATE }, (err) => {
      if (err) {
        reject(new Error(`Não consegui abrir a porta ${COM_PORT}: ${err.message}. A impressora está ligada e pareada?`));
        return;
      }

      port.write(bytes, (writeErr) => {
        if (writeErr) {
          port.close();
          reject(new Error(`Erro ao mandar dados pra impressora: ${writeErr.message}`));
          return;
        }
        port.drain((drainErr) => {
          port.close();
          if (drainErr) {
            reject(new Error(`Erro ao finalizar envio: ${drainErr.message}`));
            return;
          }
          resolve();
        });
      });
    });

    port.on('error', (err) => {
      reject(new Error(`Erro na porta serial: ${err.message}`));
    });
  });
}

const server = http.createServer(async (req, res) => {
  withCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, comPort: COM_PORT, baudRate: BAUD_RATE }));
    return;
  }

  if (req.method === 'POST' && req.url === '/print') {
    try {
      const body = await readBody(req);
      if (body.length === 0) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Payload vazio.');
        return;
      }
      await printBytes(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (err) {
      console.error('[print-agent] erro ao imprimir:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(err.message);
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

// Só escuta em localhost — não expõe a porta pra rede local.
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Agente de impressão do Cyber ERP rodando em http://localhost:${PORT}`);
  console.log(`Porta configurada: ${COM_PORT} @ ${BAUD_RATE} baud`);
  console.log(`Origem liberada: ${ALLOWED_ORIGIN}`);
  console.log('Deixe esta janela aberta enquanto usa o sistema. Testar em http://localhost:' + PORT + '/status');
});
