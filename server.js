/**
 * KK Mobile Shop - Lightweight Local Dev Server (Zero Dependencies)
 * Run with: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.rules': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Parse URL and sanitize path
    let requestPath = req.url.split('?')[0];
    if (requestPath === '/' || requestPath === '') {
        requestPath = '/index.html';
    }

    const safePath = path.normalize(requestPath).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(PUBLIC_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<h1>404 Not Found</h1><p>The requested file <code>${requestPath}</code> was not found.</p>`);
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*'
        });

        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 KK Mobile Shop Server running at:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`👉 Customer Site:   http://localhost:${PORT}/index.html`);
    console.log(`👉 Track Status:    http://localhost:${PORT}/track.html`);
    console.log(`👉 Admin Dashboard: http://localhost:${PORT}/admin.html`);
    console.log('====================================================');
    console.log('Press Ctrl + C to stop the server.');
});
