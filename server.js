const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

const server = http.createServer((req, res) => {
  let pathname = url.parse(req.url).pathname;
  
  // Se for raiz, servir index.html
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Se for /tv, servir tv.html
  if (pathname === '/tv') {
    pathname = '/tv.html';
  }

  // Caminho completo do arquivo
  const filePath = path.join(__dirname, pathname);

  // Evitar path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return;
  }

  // Checar se arquivo existe
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - Arquivo não encontrado');
      return;
    }

    // Determinar tipo MIME
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Ler e servir arquivo
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 - Erro no servidor');
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeType });
      res.end(data);
    });
  });
});

server.listen(PORT, () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';

  // Encontrar IP local
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log(`
╔════════════════════════════════════════╗
║   🎮 A Liar Within - Servidor Local    ║
╚════════════════════════════════════════╝

📱 Acesso Local:
   - Jogo: http://localhost:${PORT}
   - TV:   http://localhost:${PORT}/tv

🌐 Acesso pela Rede (TV):
   - Jogo: http://${localIP}:${PORT}
   - TV:   http://${localIP}:${PORT}/tv

Pressione Ctrl+C para parar o servidor
  `);
});
