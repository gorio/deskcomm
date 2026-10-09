import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const host = '127.0.0.1';
const port = Number(process.env.PORT || 41040);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('PORT invalida');
const page = await readFile(new URL('./index.html', import.meta.url));
createServer((req, res) => {
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
    'content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
  res.end(page);
}).listen(port, host, () => console.log('GOR Central demo em http://' + host + ':' + port));
