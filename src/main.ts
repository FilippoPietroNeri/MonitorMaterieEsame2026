import express from 'express';
import handler from './api/index';
import path from 'path';

const app = express();
const PORT = 3000;

// serve frontend statico
app.use(express.static(path.join(process.cwd(),'/src/api/public')));

// simula /api di Vercel
app.get('/api', (req, res) => {
  handler(req as any, res as any);
});

app.listen(PORT, () => {
  console.log(`DEV server attivo su http://localhost:${PORT}`);
});
