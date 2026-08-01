/**
 * OAuth 2.0 loopback redirect server for desktop apps.
 */
const http = require('http');
const { URL } = require('url');

function startLoopbackServer(port, callbackPath = '/oauth/callback') {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const u = new URL(req.url, `http://127.0.0.1:${port}`);
        const pathname = u.pathname || '/';
        if (pathname !== callbackPath && pathname !== '/') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }
        const code = u.searchParams.get('code');
        const error = u.searchParams.get('error');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        if (error) {
          res.end(`<html dir="rtl"><body style="font-family:sans-serif;padding:40px"><h2>فشل الربط</h2><p>${error}</p><p>يمكنك إغلاق هذه النافذة.</p></body></html>`);
          server.close();
          reject(new Error(error));
          return;
        }
        if (code) {
          res.end('<html dir="rtl"><body style="font-family:sans-serif;padding:40px;text-align:center"><h2>✅ تم الربط بنجاح</h2><p>يمكنك إغلاق هذه النافذة والعودة للبرنامج.</p></body></html>');
          server.close();
          resolve(code);
          return;
        }
        res.end('<html><body>OAuth</body></html>');
      } catch (e) {
        res.writeHead(500);
        res.end('Error');
        server.close();
        reject(e);
      }
    });
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {});
    setTimeout(() => {
      server.close();
      reject(new Error('oauth_timeout'));
    }, 5 * 60 * 1000);
  });
}

module.exports = { startLoopbackServer };
