import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { parsePdf } from './parsePdf'

describe('parsePdf stabile', () => {
  it('estrae correttamente tutte le materie reali', async () => {
    const buffer = readFileSync('src/fixtures/ITIA.pdf')
    const result = await parsePdf(buffer)

    console.log(result);

    expect(result.materie.length).toBeGreaterThan(0)
    expect(result.materie).toContain('LINGUA E LETTERATURA ITALIANA')
    expect(result.materie).toContain('INFORMATICA')
    expect(result.materie).toContain('SISTEMI E RETI')
    expect(result.materie).toContain('LINGUA INGLESE')
  })
})
