import { fetchIndirizzi } from './fetchIndirizzi';
import { describe, it, expect } from 'vitest'

const percorso = {
  id: 'istitutiTecnici',
  label: 'ISTITUTI TECNICI'
}

describe('fetchIndirizzi', () => {
  it('estrae almeno 60 indirizzi', async () => {
    const indirizzi = await fetchIndirizzi(percorso)
    console.log(indirizzi);
    expect(indirizzi.length).toBeGreaterThan(60)
  })

  it('contiene ITIA', async () => {
    const indirizzi = await fetchIndirizzi(percorso)
    const codes = indirizzi.map(i => i.codice)

    expect(codes).toContain('ITIA')
  })

  it('contiene ITTL', async () => {
    const indirizzi = await fetchIndirizzi(percorso)
    const codes = indirizzi.map(i => i.codice)

    expect(codes).toContain('ITTL');
  })
})
