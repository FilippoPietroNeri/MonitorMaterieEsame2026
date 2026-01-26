import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkAnno } from './annoMonitor';
import axios from 'axios';

let currentPageAnno = '2024/25';

// Mock di axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

beforeEach(() => {
  // Reset lo stato tra i test
  currentPageAnno = '2024/25';
  
  // Mock della risposta axios
  mockedAxios.get.mockResolvedValue({
    status: 200,
    data: `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Motore di Ricerca delle Discipline dell'esame di Stato a.s. ${currentPageAnno}</title>
        </head>
        <body>
          <h1>Materie Esame a.s. ${currentPageAnno}</h1>
          <p>Questo è un server di test</p>
        </body>
      </html>
    `
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('annoMonitor - Estrazione Anno', () => {
  it('dovrebbe estrarre l\'anno dal titolo HTML', async () => {
    const result = await checkAnno({ notify: false });
    console.log(result);

    expect(result.anno).toBe('2024/25');
    expect(result.siteUp).toBe(true);
    expect(mockedAxios.get).toHaveBeenCalled();
  });

  it('dovrebbe rilevare il cambio di anno', async () => {
    // Primo check - anno iniziale
    let result = await checkAnno({ notify: false });
    expect(result.anno).toBe('2024/25');

    // Simula cambio del sito
    currentPageAnno = '2025/26';
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Motore di Ricerca delle Discipline dell'esame di Stato a.s. ${currentPageAnno}</title>
          </head>
          <body>
            <h1>Materie Esame a.s. ${currentPageAnno}</h1>
          </body>
        </html>
      `
    });
    
    // Secondo check - dovrebbe rilevare il cambio
    result = await checkAnno({ notify: true });
    console.log(result);
    expect(result.anno).toBe('2025/26');
    expect(result.changed).toBe(true);
  });

  it('dovrebbe gestire errore di connessione', async () => {
    vi.mocked(mockedAxios.get).mockRejectedValue(new Error('Connection failed'));
    
    const result = await checkAnno({ notify: false });

    expect(result.siteUp).toBe(false);
  });

  it('dovrebbe riconoscere anno non trovato nel HTML', async () => {
    mockedAxios.get.mockResolvedValue({
      status: 200,
      data: '<html><body>Nessun anno</body></html>'
    });

    const result = await checkAnno({ notify: false });

    expect(result.anno).toBeNull();
  });
});
