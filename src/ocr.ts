import { createWorker, type Worker } from 'tesseract.js'

let workerPromise: Promise<Worker> | null = null

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker('eng')
  }
  return workerPromise
}

/** Warms up the OCR engine ahead of time so the first scan doesn't stall on it. */
export function preloadOcr() {
  void getWorker()
}

export async function recognizeText(imageDataUrl: string): Promise<string> {
  const worker = await getWorker()
  const { data } = await worker.recognize(imageDataUrl)
  return data.text
}

/** Pulls the longest run of digits (an odometer reading) out of OCR text. */
export function parseOdometerGuess(text: string): string | null {
  const matches = text.match(/\d[\d,.\s]{2,}\d|\d+/g)
  if (!matches) return null
  const cleaned = matches
    .map((m) => m.replace(/[,\s]/g, ''))
    .filter((m) => /^\d+(\.\d+)?$/.test(m))
  if (cleaned.length === 0) return null
  // The odometer is almost always the longest digit string on a dashboard photo.
  cleaned.sort((a, b) => b.replace('.', '').length - a.replace('.', '').length)
  return cleaned[0]
}

export interface PumpGuess {
  gallons?: string
  totalCost?: string
  pricePerGallon?: string
}

/**
 * Gas pump displays are visually noisy and inconsistent between brands, so
 * this only produces a best-effort guess per field. The UI always shows
 * these as editable, pre-filled fields rather than trusting them blindly.
 */
export function parsePumpGuess(text: string): PumpGuess {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const guess: PumpGuess = {}

  const numberToken = /\d+\.\d{2,3}/g

  for (const line of lines) {
    const lower = line.toLowerCase()
    const numbers = line.match(numberToken)
    if (!numbers) continue

    if (!guess.totalCost && /(total|sale|amount|\$)/.test(lower)) {
      guess.totalCost = numbers[numbers.length - 1]
    }
    if (!guess.gallons && /(gal|gallons|volume|litre|liter)/.test(lower)) {
      guess.gallons = numbers[0]
    }
    if (!guess.pricePerGallon && /(price|ppg|per\s*gal|\/gal)/.test(lower)) {
      guess.pricePerGallon = numbers[0]
    }
  }

  // Fallback: scan every number found anywhere and bucket by plausible range.
  const allNumbers = Array.from(text.matchAll(numberToken)).map((m) => m[0])
  for (const n of allNumbers) {
    const val = parseFloat(n)
    if (!guess.pricePerGallon && val >= 1.5 && val <= 8) guess.pricePerGallon = n
    else if (!guess.gallons && val > 0 && val <= 40) guess.gallons = n
    else if (!guess.totalCost && val > 0 && val <= 300) guess.totalCost = n
  }

  return guess
}
