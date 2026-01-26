import axios from 'axios';
import { parsePdf } from '../parser/parsePdf';
import { addSubscriber, getSubscribersList } from '../mailer/emailService';
import { BASE_URL, PERCORSI } from '../config/config';
import { checkAnno, getLastSeenAnno } from '../monitor/annoMonitor';
import { logger } from '../utils/logger';

export default async function handler(req: any, res: any) {
    const action = req.query.action;
    try {
        if (action === 'status') {
            const result = await checkAnno({ notify: false });
            const currentAnno = result.anno ?? getLastSeenAnno();
            return res.json({ anno: currentAnno ?? null });
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
        logger.error(err);
        return res.status(500).json({ error: 'errore server' });
    }
}
