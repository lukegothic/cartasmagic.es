const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const app = express();
const port = process.env.PORT || process.argv[2] || 3000;

// Configurar motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(expressLayouts);

// Serve static files
app.use(express.static('public'));

// Rutas principales
require('./routes/main')(app);

// Health check (útil para monitorizar)
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`✅ Serving on port ${port}`);
});

// Global error handlers to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
