import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { timingSafeEqual } from 'node:crypto';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 41040);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT invalida');

// This is a temporary preview gate, NOT the production login/MFA system.
// Require both credentials before listening, so the preview fails closed.
const previewUser = process.env.GOR_PREVIEW_USER || '';
const previewPassword = process.env.GOR_PREVIEW_PASSWORD || '';
if (!previewUser || !previewPassword || previewPassword.length < 8) {
  throw new Error('Defina GOR_PREVIEW_USER e GOR_PREVIEW_PASSWORD (minimo 8 caracteres) antes de iniciar');
}

const page = await readFile(new URL('./index.html', import.meta.url));
const evolutionUrl = process.env.GOR_EVOLUTION_URL || 'http://127.0.0.1:41041';
const evolutionKey = process.env.GOR_EVOLUTION_API_KEY || '';
const instance = 'gorcentral';
async function evolution(path, method = 'GET') {
  if (!evolutionKey) throw new Error('Integracao WhatsApp nao configurada no servidor');
  const response = await fetch(evolutionUrl + path, {
    method,
    headers: { apikey: evolutionKey, accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  const body = await response.text();
  let json;
  try { json = JSON.parse(body); } catch { throw new Error('Resposta inesperada da Evolution API'); }
  if (!response.ok) throw new Error('Evolution API retornou HTTP ' + response.status);
  return json;
}
async function whatsapp(req, res) {
  const url = req.url;
  const method = req.method;
  if (url === '/api/whatsapp/status' && method === 'GET') {
    const data = await evolution('/instance/connectionState/' + instance);
    return { status: data.instance?.state || data.state || 'unknown' };
  }
  if (url === '/api/whatsapp/connect' && method === 'POST') {
    const data = await evolution('/instance/connect/' + instance);
    const raw = data.base64 || data.qrcode?.base64 || '';
    const qr = typeof raw === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raw)
      && raw.length < 200000 ? raw : null;
    return { status: data.instance?.state || data.state || 'pending', qr, pairingAvailable: Boolean(data.pairingCode) };
  }
  throw new Error('Rota nao encontrada');
}
function equal(a, b) {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && timingSafeEqual(left, right);
}
function authorized(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); }
  catch { return false; }
  const separator = decoded.indexOf(':');
  if (separator < 0) return false;
  return equal(decoded.slice(0, separator), previewUser) &&
    equal(decoded.slice(separator + 1), previewPassword);
}
createServer(async (req, res) => {
  if (!authorized(req)) {
    res.writeHead(401, {
      'www-authenticate': 'Basic realm="GOR Central - Preview", charset="UTF-8"',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    res.end('Acesso restrito');
    return;
  }
  if (req.url?.startsWith('/api/whatsapp/')) {
    try {
      const result = await whatsapp(req, res);
      res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
      res.end(JSON.stringify(result));
    } catch (error) {
      const status = error.message === 'Rota nao encontrada' ? 404 : 502;
      res.writeHead(status, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
      res.end(JSON.stringify({ error: status === 404 ? 'Rota nao encontrada' : 'Falha ao consultar a conexao WhatsApp' }));
      console.error('WhatsApp:', error.message);
    }
    return;
  }
  if (req.url === '/healthz') {
    res.writeHead(200, {'content-type':'application/json; charset=utf-8','cache-control':'no-store'});
    res.end(JSON.stringify({ok:true,mode:'demo',publishing:false}));
    return;
  }
  if (req.method !== 'GET' || !['/','/index.html'].includes(req.url)) {
    res.writeHead(404, {'content-type':'text/plain; charset=utf-8'});
    res.end('Not found');
    return;
  }
  res.writeHead(200, {
    'content-type':'text/html; charset=utf-8',
    'cache-control':'no-store',
    'x-content-type-options':'nosniff',
    'referrer-policy':'no-referrer',
    'x-frame-options':'DENY',
    'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
  res.end(page);
}).listen(port, host, () => console.log('GOR Central demo protegido em http://' + host + ':' + port));
