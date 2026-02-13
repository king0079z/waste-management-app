// Vercel serverless entry – export Express app (Vercel invokes it as app(req, res))
// Set before loading server so server.js does not call listen()
process.env.VERCEL = '1';

let app;
try {
  app = require('../server.js');
} catch (loadErr) {
  console.error('Load error:', loadErr);
  app = (req, res) => {
    res.status(500).setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Load failed',
        message: loadErr.message,
        stack: process.env.NODE_ENV !== 'production' ? loadErr.stack : undefined,
      })
    );
  };
}

module.exports = app;
