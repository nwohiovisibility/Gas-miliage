/*
Filename: CalculatorDisplay.tsx
Last Edit Date: 2026-08-30 EST
Version: 1.1
*/
interface Props {
  value: string
}

// Standard 7-segment truth table: a=top, b=top-right, c=bottom-right,
// d=bottom, e=bottom-left, f=top-left, g=middle.
const SEGMENTS: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'g', 'c', 'd'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g']
}

const SEGMENT_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'] as const

function SevenSegmentDigit({ char }: { char: string }) {
  const on = SEGMENTS[char]
  if (!on) return <span className="calculator-char">{char}</span>
  return (
    <span className="seven-seg">
      {SEGMENT_LETTERS.map((letter) => (
        <span key={letter} className={`seg seg-${letter}${on.includes(letter) ? ' on' : ''}`} />
      ))}
    </span>
  )
}

export default function CalculatorDisplay({ value }: Props) {
  return (
    <div className="calculator-display" aria-hidden="true">
      {value.split('').map((char, i) => (
        <SevenSegmentDigit key={i} char={char} />
      ))}
    </div>
  )
}
