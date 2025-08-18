const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Server</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .success { color: green; }
            .info { background: #f0f8ff; padding: 20px; border-radius: 8px; }
        </style>
    </head>
    <body>
        <h1 class="success">✅ Basic Server is Working!</h1>
        <div class="info">
            <h2>Server Information:</h2>
            <p><strong>Node.js Version:</strong> ${process.version}</p>
            <p><strong>Platform:</strong> ${process.platform}</p>
            <p><strong>Port:</strong> 3000</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>If you can see this page, the basic Node.js server is working correctly.</p>
        <p>The issue might be with Next.js configuration or dependencies.</p>
    </body>
    </html>
  `);
});

server.listen(3000, () => {
  console.log('✅ Test server running on http://localhost:3000');
  console.log('Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
