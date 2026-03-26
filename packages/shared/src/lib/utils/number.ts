export function checkPrecision(num: number, precision: number): boolean {
  return Number(num.toFixed(precision)) === num
}

export interface Unit {
  label: string
  multiplier: number
}

export const detectUnit = (value: number, units: Unit[], expectedDigits: number): { unit: string; display: number } => {
  // deal with edge cases
  if (!value || Number.isNaN(value) || units.length === 0 || expectedDigits < 1) {
    return { unit: units[0]?.label || '', display: value }
  }

  const absValue = Math.abs(value)
  const originalLessThanOne = absValue < 1

  // find the best unit
  let bestUnit = units[0]
  let bestScore = Infinity

  for (const unit of units) {
    const display = absValue / unit.multiplier

    // if original value >= 1, strongly prefer display >= 1
    if (!originalLessThanOne && display < 1) {
      continue // skip units that would make display < 1 when original >= 1
    }

    const digits = display >= 1 ? Math.floor(Math.log10(display)) + 1 : 1
    const score = Math.abs(digits - expectedDigits)

    if (score < bestScore) {
      bestScore = score
      bestUnit = unit
    }
  }

  if (!bestUnit) {
    throw new Error('No units provided')
  }
  return { unit: bestUnit.label, display: value / bestUnit.multiplier }
}

export const formatWithUnits = (value: number | string, units: Unit[], fractionDigits = 2): string => {
  const num = typeof value === 'number' ? value : Number(value)
  if (!num || Number.isNaN(num)) {
    return `0 ${units[0]?.label || ''}`
  }

  const { unit, display } = detectUnit(num, units, 1)
  return `${display.toFixed(fractionDigits)} ${unit}`
}
