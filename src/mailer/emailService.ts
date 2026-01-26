import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const SUBSCRIBERS_FILE = path.join(process.cwd(), 'subscribers.json');

function getSubscribers(): string[] {
  try {
    if (fs.existsSync(SUBSCRIBERS_FILE)) {
      const data = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    logger.error('Errore lettura iscritti:', err);
  }
  return [];
}

function saveSubscribers(subscribers: string[]) {
  try {
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify([...new Set(subscribers)], null, 2));
  } catch (err) {
    logger.error('Errore salvataggio iscritti:', err);
  }
}

export function addSubscriber(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return false;
  }

  const subscribers = getSubscribers();
  if (!subscribers.includes(email)) {
    subscribers.push(email);
    saveSubscribers(subscribers);
  }
  return true;
}

export function getSubscribersList(): string[] {
  return getSubscribers();
}

export async function sendNotification(anno: string): Promise<void> {
  const subscribers = getSubscribers();

  logger.log(subscribers);
  
  if (subscribers.length === 0) {
    logger.log('Nessun iscritto');
    return;
  }

  const subject = `📚 Materie d\'esame ${anno} - Uscite le nuove materie!`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
          .content { padding: 20px; background: #f8f9fa; margin: 20px 0; border-radius: 8px; }
          .button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 15px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Materie d'esame in arrivo!</h1>
          </div>
          
          <div class="content">
            <p>Ciao,</p>
            <p>Le materie d'esame per l'anno scolastico <strong>${anno}</strong> sono finalmente state pubblicate! 🎉</p>
            <p>Accedi al nostro monitor per visualizzare i dettagli:</p>
            <a href="https://maturita.aevorastudios.com" class="button">Visualizza Materie</a>
          </div>
          
          <div class="footer">
            <p>Monitor Materie Esame ${anno} - Ricevi notifiche quando escono le materie</p>
            <p>© ${anno} - All rights reserved</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
Ciao,

Le materie d'esame per l'anno scolastico ${anno} sono finalmente state pubblicate!

Accedi a: https://maturita.aevorastudios.com

---
Monitor Materie Esame ${anno}
`;

  try {
    const result = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      bcc: subscribers.join(','),
      subject,
      text: textContent,
      html: htmlContent
    });

    logger.log(`Email inviate a ${subscribers.length} iscritti. MessageID: ${result.messageId}`);
  } catch (err) {
    logger.error('Errore invio email:', err);
  }
}
