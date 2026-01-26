import express from 'express';
import handler from './api/index';
import path from 'path';
import { startAnnoMonitor } from './monitor/annoMonitor';
import { logger } from './utils/logger';

import * as dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT || 3000;

app.use(express.static(path.join(process.cwd(),'/src/api/public')));
app.get('/api', (req, res) => {
  handler(req as any, res as any);
});

app.listen(PORT, () => {
  logger.log(`DEV server attivo su http://localhost:${PORT}`);
  startAnnoMonitor();
});
