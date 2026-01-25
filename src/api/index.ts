import axios from 'axios';
import { parsePdf } from '../parser/parsePdf';
import { addSubscriber, getSubscribersList, sendNotification } from '../mailer/emailService';
import { BASE_URL, PERCORSI } from '../config/config';

let lastAnnoNotified: string | null = null;

export default async function handler(req: any, res: any) {
    const action = req.query.action;
    try {
        if (action === 'status') {
            const { data: html } = await axios.get(BASE_URL);
            const match = html.match(/a\.s\.\s*(\d{4}\/\d{2})/);
            const anno = match?.[1] ?? null;

            if (!anno) {
                return res.json({ anno: null });
            }

            if (lastAnnoNotified === null) {
                lastAnnoNotified = anno;
                return res.json({ anno: null });
            }

            if (anno !== lastAnnoNotified && getSubscribersList().length > 0) {
                console.log(`📧 Anno scolastico cambiato da "${lastAnnoNotified}" a "${anno}" - Invio newsletter...`);
                await sendNotification(anno);
                lastAnnoNotified = anno;
            }

            return res.json({ anno });
        }

        if (action === 'percorsi') {
            return res.json(PERCORSI);
        }

        if (action === 'indirizzi') {
            const percorso = req.query.percorso;
            if (!percorso) return res.status(400).json({ error: 'percorso mancante' });

            const { data: html } = await axios.get(`${BASE_URL}/${percorso}.html`);

            const indirizzi = [...html.matchAll(/([A-Z0-9]{4})\s-\s([^<]+)/g)]
                .map(m => ({ codice: m[1], nome: m[2].trim() }));

            return res.json(indirizzi);
        }

        if (action === 'materie') {
            const codice = req.query.codice;
            if (!codice) return res.status(400).json({ error: 'codice mancante' });

            const pdfUrl = `${BASE_URL}/pdf/${codice}.pdf`;
            const pdf = await axios.get(pdfUrl, { responseType: 'arraybuffer' });

            const result = await parsePdf(Buffer.from(pdf.data));
            return res.json(result);
        }

        if (action === 'subscribe') {
            const email = req.query.email as string;
            if (!email) return res.status(400).json({ error: 'email mancante' });

            const success = addSubscriber(email);

            if (!success) {
                return res.status(400).json({ error: 'email non valida' });
            }

            return res.json({
                success: true,
                message: 'Iscrizione confermata',
                totalSubscribers: getSubscribersList().length
            });
        }

        return res.status(404).json({ error: 'azione non valida' });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({ error: 'errore server' });
    }
}
