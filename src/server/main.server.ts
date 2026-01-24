import express from 'express';
import axios from 'axios';
import path from 'node:path';

import {BASE_URL} from '../config/config';

const app = express();
const PORT = 3000;

app.use(express.static(path.join(process.cwd(), '/src/server/public')));

// Endpoint proxy
app.get('/api/brand', async (req, res) => {
  try {
    const { data: html } = await axios.get(BASE_URL);
    res.send(html);
  } catch (err) {
    res.status(500).send('Errore fetch sito: ' + err);
  }
});



app.listen(PORT, () => console.log(`Server in ascolto su http://localhost:${PORT}`));
