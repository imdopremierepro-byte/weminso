const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = __dirname;

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
    console.log(`[${new Date().toISOString()}] Request: ${req.url}`);

    // Add CORS headers so YouTube embeds work
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Disable caching to prevent "not fixing" issues
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    try {
        // Remove query string (e.g. ?v=10) and decode URI
        const decodedUrl = decodeURI(req.url);
        const urlPath = decodedUrl.split('?')[0];

        // Prevent directory traversal
        if (urlPath.includes('..')) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
        }

        let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);

        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';

        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`File not found: ${filePath}`);
                res.writeHead(404);
                res.end('Not Found');
                return;
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    } catch (e) {
        console.error('Server Error:', e);
        res.writeHead(500);
        res.end('Internal Server Error');
    }
});

server.listen(PORT, () => {
    console.log(`웨민소 서버 실행 중: http://localhost:${PORT}`);
});
