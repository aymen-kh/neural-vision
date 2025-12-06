const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const type = data.type.toUpperCase();
        const color = type === 'ERROR' ? '\x1b[31m' : type === 'WARN' ? '\x1b[33m' : '\x1b[36m';
        const reset = '\x1b[0m';

        console.log(`${color}[BROWSER ${type}]${reset}`, ...data.args);
      } catch (e) {
        console.log('Raw log:', body);
      }
      res.writeHead(200);
      res.end('ok');
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`\x1b[32mLog bridge server running on port ${PORT}\x1b[0m`);
  console.log('Browser logs will appear here...');
});
