import { describe, it, expect } from 'vitest'
import { fetchPdf } from './fetchPdf'

describe('fetchPdf', () => {
    it('scarica il PDF ITIA e calcola hash', async () => {
        const pdf = await fetchPdf('ITIA');

        expect(pdf.hash).toHaveLength(64);
        expect(pdf.buffer.length).toBeGreaterThanOrEqual(64);
        expect(pdf.url).toContain('ITIA.pdf');
    })
})