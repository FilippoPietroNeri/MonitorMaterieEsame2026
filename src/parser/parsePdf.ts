import {PDFParse} from 'pdf-parse'

export type MaterieResult = {
  materie: string[]
}

export async function parsePdf(buffer: Buffer): Promise<MaterieResult> {
  const uint8Buffer = new Uint8Array(buffer)
  const parser = new PDFParse(uint8Buffer);
  const data = await parser.getText();

  const lines = data.text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)

  const materie: string[] = []

  for (let line of lines) {
    const upper = line.toUpperCase()

    // --- intestazioni generali da ignorare ---
    const intestazioni = [
      'DISCIPLINE DI ESAME',
      'CODICE E DENOMINAZIONE',
      'DIPLOMA',
      'ARTICOLAZIONE',
      'TITOLO DI STUDIO',
      'ALTRE DISCIPLINE AFFIDATE AI COMMISSARI ESTERNI',
      'PRIMA PROVA',
      'SECONDA PROVA',
      'COMMISSARI ESTERNI'
    ]

    if (
      intestazioni.some(h => upper.includes(h)) ||
      /INSEGN|CLASSI|NUMERO/.test(upper)
    ) {
      continue
    }

    // --- ignora linee che sono chiaramente codici ---
    // solo lettere maiuscole + numeri + tab/trattini
    if (/^[A-Z\d\t\- ]+$/.test(line)) {
      // se contiene almeno una lettera e almeno un numero → codice → scarta
      if (line.match(/\d/) && line.match(/[A-Z]/)) continue
    }

    // rimuove prefissi tipo "1)", "-", tab, spazi
    line = line.replace(/^(\d+\)|-|\t|\s)+/, '').trim()

    // aggiunge solo linee con almeno una lettera
    if (/[A-ZÀ-ÖØ-Ý]/.test(line)) {
      materie.push(line.toUpperCase())
    }
  }

  // rimuove duplicati
  const uniqueMaterie = Array.from(new Set(materie))

  return { materie: uniqueMaterie }
}
