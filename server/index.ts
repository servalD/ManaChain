import express from 'express';
import path from 'path';
import cors from 'cors';
import routes from './routes';

const app = express();

app.use(express.json());
app.use(cors());

// Static assets (e.g. logo for emails) — served at /assets
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mana Chain API',
  });
});

// All API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}!`);
  console.log(`Connected to Supabase database`);
  console.log(`JWT authentication enabled`);
  console.log(`Email service configured`);
});

export default app;
