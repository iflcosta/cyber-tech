/**
 * Agente de impressão local do Cyber ERP.
 *
 * Roda no PC do balcão da Cyber Informática (ouvindo em localhost:9100).
 * Imprime silenciosamente na impressora térmica MPT-II conectada via Bluetooth (BLE)
 * ou via USB (Driver: Generic / Text Only) sem abrir diálogo do navegador!
 */

try {
  require('dotenv').config();
} catch (_) {}

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const PORT = Number(process.env.PORT) || 9100;
const PRINTER_NAME = process.env.PRINTER_NAME || 'MPT-II';
const PRINTER_BLE_ADDRESS = process.env.PRINTER_BLE_ADDRESS || 'DC:0D:51:5A:B6:C0';
const PYTHON_BLE_SCRIPT = path.join(__dirname, 'ble_print.py');

const ALLOWED_ORIGINS = [
  'https://cyberinformatica.tech',
  'https://www.cyberinformatica.tech',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

function withCors(req, res) {
  const origin = req.headers.origin || '';
  if (
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith('http://localhost:') ||
    origin.startsWith('http://127.0.0.1:')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Imprime via Bluetooth (BLE) sem fio usando o script auxiliar ble_print.py.
 */
function printToBluetoothBLE(text) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(PYTHON_BLE_SCRIPT)) {
      return reject(new Error(`Script ble_print.py nao encontrado em ${PYTHON_BLE_SCRIPT}`));
    }

    const py = spawn('python', [PYTHON_BLE_SCRIPT], {
      env: { ...process.env, PRINTER_BLE_ADDRESS },
    });

    let stderr = '';
    let stdout = '';

    py.stdout.on('data', (d) => { stdout += d.toString(); });
    py.stderr.on('data', (d) => { stderr += d.toString(); });

    py.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const msg = (stderr || stdout || '').trim() || `Processo Python encerrou com codigo ${code}`;
        reject(new Error(msg));
      }
    });

    py.on('error', (err) => {
      reject(err);
    });

    py.stdin.write(text, 'utf-8');
    py.stdin.end();
  });
}

/**
 * Imprime texto diretamente na impressora térmica do Windows (MPT-II)
 * usando o spooler do Windows (Generic / Text Only).
 * Usado como fallback quando conectado via cabo USB.
 */
function printToWindowsPrinter(text, printerName = PRINTER_NAME) {
  return new Promise((resolve, reject) => {
    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-Command',
      `$input | Out-Printer -Name "${printerName}"`,
    ]);

    ps.stdin.write(text, 'latin1');
    ps.stdin.end();

    ps.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Out-Printer encerrou com código de saída ${code}`));
      }
    });

    ps.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Orquestrador inteligente de impressão:
 * 1. Tenta Bluetooth sem fio (BLE) primeiro
 * 2. Se falhar, tenta Spooler USB do Windows
 */
async function printReceipt(text) {
  let btError = null;

  try {
    console.log(`[print-agent] Enviando para Bluetooth BLE (${PRINTER_BLE_ADDRESS})...`);
    await printToBluetoothBLE(text);
    console.log(`[print-agent] Recibo impresso com sucesso via Bluetooth!`);
    return { via: 'bluetooth', address: PRINTER_BLE_ADDRESS };
  } catch (err) {
    btError = err;
    console.warn(`[print-agent] Bluetooth falhou (${err.message}). Tentando Spooler USB...`);
  }

  try {
    console.log(`[print-agent] Enviando para Spooler USB (${PRINTER_NAME})...`);
    await printToWindowsPrinter(text, PRINTER_NAME);
    console.log(`[print-agent] Recibo impresso com sucesso via Windows Spooler USB!`);
    return { via: 'spooler_usb', printer: PRINTER_NAME };
  } catch (spoolerErr) {
    throw new Error(`Falha na impressao. Bluetooth: ${btError?.message || 'Nao disponivel'}. Spooler USB: ${spoolerErr.message}`);
  }
}

const server = http.createServer(async (req, res) => {
  withCors(req, res);
  console.log(`[print-agent] ${new Date().toLocaleTimeString('pt-BR')} ${req.method} ${req.url} (Origin: ${req.headers.origin || 'none'})`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Healthcheck / Status
  if (req.method === 'GET' && (req.url === '/status' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        printer: PRINTER_NAME,
        bluetooth: {
          supported: true,
          address: PRINTER_BLE_ADDRESS,
        },
        port: PORT,
        timestamp: new Date().toISOString(),
      }),
    );
    return;
  }

  // Rota de impressão de recibo PDV (Texto Puro formatado em 30 colunas)
  if (req.method === 'POST' && (req.url === '/print-receipt' || req.url === '/print')) {
    try {
      const bodyBuffer = await readBody(req);
      if (bodyBuffer.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Payload vazio' }));
        return;
      }

      let text = '';
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        try {
          const parsed = JSON.parse(bodyBuffer.toString('utf-8'));
          text = parsed.text || parsed.content || '';
        } catch {
          text = bodyBuffer.toString('utf-8');
        }
      } else {
        text = bodyBuffer.toString('utf-8');
      }

      if (!text.trim()) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Texto do recibo está em branco' }));
        return;
      }

      console.log(`[print-agent] Imprimindo recibo (${text.length} caracteres)...`);
      const result = await printReceipt(text);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, via: result.via, printedAt: new Date().toISOString() }));
    } catch (err) {
      console.error('[print-agent] Erro ao imprimir recibo:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'Rota não encontrada' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[print-agent] Cyber ERP Print Agent rodando estritamente em http://127.0.0.1:${PORT}`);
  console.log(`[print-agent] Impressora USB: ${PRINTER_NAME}`);
  console.log(`[print-agent] Bluetooth Sem Fio: ${PRINTER_BLE_ADDRESS}`);
  console.log(`[print-agent] Pronto para receber impressões sem fio do PDV e recibos da bancada!`);
});
