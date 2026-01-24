import { BASE_URL } from '../config/config'
import * as cheerio from 'cheerio';

export type Indirizzo = {
  percorso: string
  codice: string
  descrizione: string
}

type PercorsoConfig = {
  id: string        // es: istitutiTecnici
  label: string     // es: ISTITUTI TECNICI
}

function deduplicate(list: Indirizzo[]): Indirizzo[] {
  const map = new Map<string, Indirizzo>()

  for (const item of list) {
    map.set(item.codice, item)
  }

  return Array.from(map.values())
}

export async function fetchIndirizzi(
  percorso: PercorsoConfig
): Promise<Indirizzo[]> {
  const url = `${BASE_URL}/${percorso.id}.html`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Errore fetch ${url}: ${res.status}`)
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const indirizzi: Indirizzo[] = []
  
  $('a, li').each((_: any, el: any) => {
    const text = $(el).text().trim()

    const match = text.match(/^([A-Z0-9]{3,5})\s*-\s*(.+)$/)

    if (!match) return

    const [, codice, descrizione] = match

    indirizzi.push({
      percorso: percorso.label,
      codice: codice.trim(),
      descrizione: descrizione.trim()
    })
  })

  return deduplicate(indirizzi)
}
