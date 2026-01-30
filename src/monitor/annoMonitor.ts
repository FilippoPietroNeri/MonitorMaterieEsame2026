import axios from 'axios';
import { BASE_URL, LAST_SEEN_ANNO } from '../config/config';
import { sendNotification } from '../mailer/emailService';
import { logger } from '../utils/logger';

import * as dotenv from 'dotenv';
dotenv.config();

const POLL_INTERVAL_MS = 10_000;
const REQUEST_TIMEOUT_MS = 10_000;

function parseWebhookUrls(raw: string): string[] {
  if (!raw) return [];

  const normalized = raw.trim();

  if (normalized.startsWith('[')) {
    try {
      const parsed = JSON.parse(normalized.replace(/'/g, '"'));
      if (Array.isArray(parsed)) {
        return parsed
          .map(url => String(url).trim().replace(/^['"]|['"]$/g, ''))
          .filter(url => url.length > 0);
      }
    } catch (err) {
      logger.warn('Parsing DISCORD_WEBHOOK_URLS fallito, uso split fallback');
    }
  }

  return normalized
    .split(/[\n,;]/)
    .map(url => url.trim().replace(/^['"]|['"]$/g, ''))
    .filter(url => url.length > 0);
}

const webhookEnv = process.env.DISCORD_WEBHOOK_URLS || process.env.DISCORD_WEBHOOK_URL || '';
const webhookUrls = parseWebhookUrls(webhookEnv);

let lastSeenAnno: string | null = LAST_SEEN_ANNO;
let lastNotifiedAnno: string | null = LAST_SEEN_ANNO;
let monitorTimer: NodeJS.Timeout | null = null;
let running = false;

function extractAnno(html: string): string | null {
  const match = html.match(/a\.s\.\s*(\d{4}\/\d{2})/i);
  return match?.[1] ?? null;
}

async function sendDiscordNotifications(anno: string, previousAnno: string | null) {
  if (webhookUrls.length === 0) {
    logger.warn('Nessun webhook Discord configurato');
    return;
  }

  const payload = {
    content: `🚨 Aggiornamento materie esame - Anno scolastico **${anno}** \n\nIl sito del ministero dell'istruzione è finalmente aperto!!\nApri il monitor per sapere le materie che ti interessano!\n\n@everyone`,
    allowed_mentions: { parse: ['everyone'] },
    username: 'Monitor Materie Esame',
    embeds: [
      {
        title: '🎓 Materie d\'Esame Aggiornate',
        description: `Le materie d'esame per l'anno scolastico **${anno}** sono ora disponibili!\n\n➡️ [Apri il monitor](https://maturita.aevorastudios.com)`,
        color: 0x667eea,
        fields: [
          {
            name: '📅 Anno Scolastico',
            value: anno,
            inline: true
          },
          ...(previousAnno ? [
            {
              name: '📊 Aggiornamento',
              value: `Precedente: ${previousAnno}`,
              inline: true
            }
          ] : []),
          {
            name: 'Sito Monitor',
            value: '[maturita.aevorastudios.com](https://maturita.aevorastudios.com)',
            inline: true
          }
        ],
        thumbnail: {
          url: 'https://fluxus.asyncstudios.org/raw/yf2inem'
        },
        footer: {
          text: 'Monitor Materie Esame'
        },
        timestamp: new Date().toISOString()
      }
    ],
  };

  const deliveries = webhookUrls.map(async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const status = response?.status ?? 'n/a';

      if (status === 204) {
        logger.log(`✅ Webhook Discord inviato (${url}). Status: 204`);
      } else if (typeof status === 'number' && status < 400) {
        logger.log(`✅ Webhook Discord inviato (${url}). Status: ${status}`);
      } else {
        logger.warn(`⚠️ Webhook Discord risposta non OK (${url}). Status: ${status}`);
      }
    } catch (err: any) {
      logger.error(`❌ Errore invio webhook ${url}`);
      logger.error('Dettagli errore:', err?.message ?? err);
    } finally {
      clearTimeout(timer);
    }
  });

  await Promise.allSettled(deliveries);
}

async function triggerNotifications(anno: string, previousAnno: string | null) {
  await Promise.allSettled([
    sendDiscordNotifications(anno, previousAnno),
    sendNotification(anno)
  ]);
}

export async function checkAnno(options: { notify: boolean } = { notify: false }) {
  if (running) {
    return { siteUp: false, anno: lastSeenAnno, skipped: true };
  }

  running = true;

  try {
    const response = await axios.get(BASE_URL);
    const siteUp = response.status >= 200 && response.status < 400;

    if (!siteUp) {
      logger.warn(`Sito non raggiungibile (status ${response.status}).`);
      return { siteUp, anno: lastSeenAnno };
    }

    const anno = extractAnno(String(response.data));
    const previousAnno = lastSeenAnno;

    console.log(anno, previousAnno)

    if (!anno) {
      logger.warn('Anno scolastico non trovato nella pagina.');
      return { siteUp, anno: null };
    }

    lastSeenAnno = anno;

    if (lastNotifiedAnno === null) {
      lastNotifiedAnno = anno;
    }

    const changed = previousAnno !== null && anno !== previousAnno;
    console.log(changed)
    const shouldNotify = options.notify && changed && lastNotifiedAnno !== anno;
    console.log(shouldNotify)

    if (shouldNotify) {
      logger.log(`Anno cambiato da ${previousAnno} a ${anno}. Invio notifiche...`);
      await triggerNotifications(anno, previousAnno);
      lastNotifiedAnno = anno;
    }

    return { siteUp, anno, changed };
  } catch (err) {
    logger.error('Errore durante il controllo del sito:', err);
    return { siteUp: false, anno: lastSeenAnno };
  } finally {
    running = false;
  }
}

export function startAnnoMonitor() {
  if (monitorTimer) return;

  monitorTimer = setInterval(() => {
    void checkAnno({ notify: false });
  }, POLL_INTERVAL_MS);

  void checkAnno({ notify: false });
}

export function getLastSeenAnno() {
  return lastSeenAnno;
}

export function getLastNotifiedAnno() {
  return lastNotifiedAnno;
}
