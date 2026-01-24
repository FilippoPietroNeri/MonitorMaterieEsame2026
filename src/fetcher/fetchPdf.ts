import { buffer } from "stream/consumers";
import { BASE_URL } from "../config/config";
import crypto from 'crypto';

export type PdfResult = {
    codice: string
    url: string
    hash: string
    buffer: Buffer
};

export async function fetchPdf(codice: string): Promise<PdfResult> {
    const url = `${BASE_URL}/pdf/${codice}.pdf`;

    const res = await fetch(url)

    if (!res.ok) {
        throw new Error(`Impossibile scaricare il PDF ${codice} : ${res.status}`);
    }

    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer);

    const hash = crypto
        .createHash('sha256')
        .update(buffer)
        .digest('hex')

    return {
        codice,
        url,
        hash,
        buffer
    }
}


