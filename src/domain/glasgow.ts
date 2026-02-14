import type { GlasgowAssessment, TriageAssessment, VitalSigns } from './types'

export type GlasgowOption = {
  value: number
  shortLabel: string
  longLabel: string
}

export const glasgowOcularOptions: GlasgowOption[] = [
  { value: 4, shortLabel: 'Espontánea', longLabel: 'Abre los ojos espontáneamente' },
  { value: 3, shortLabel: 'A la voz', longLabel: 'Abre los ojos al estímulo verbal' },
  { value: 2, shortLabel: 'Al dolor', longLabel: 'Abre los ojos al estímulo doloroso' },
  { value: 1, shortLabel: 'Ninguna', longLabel: 'No apertura ocular' },
]

export const glasgowVerbalOptions: GlasgowOption[] = [
  { value: 5, shortLabel: 'Orientado', longLabel: 'Orientado y conversa adecuadamente' },
  { value: 4, shortLabel: 'Confuso', longLabel: 'Confuso pero responde en frases' },
  { value: 3, shortLabel: 'Palabras', longLabel: 'Palabras inapropiadas' },
  { value: 2, shortLabel: 'Sonidos', longLabel: 'Sonidos incomprensibles' },
  { value: 1, shortLabel: 'Ninguna', longLabel: 'Sin respuesta verbal' },
]

export const glasgowMotorOptions: GlasgowOption[] = [
  { value: 6, shortLabel: 'Obedece', longLabel: 'Obedece órdenes' },
  { value: 5, shortLabel: 'Localiza', longLabel: 'Localiza el dolor' },
  { value: 4, shortLabel: 'Retira', longLabel: 'Retirada al dolor' },
  { value: 3, shortLabel: 'Flexión', longLabel: 'Flexión anormal (decorticación)' },
  { value: 2, shortLabel: 'Extensión', longLabel: 'Extensión anormal (descerebración)' },
  { value: 1, shortLabel: 'Ninguna', longLabel: 'Sin respuesta motora' },
]

export const areGlasgowComponentsComplete = (glasgow?: GlasgowAssessment) => {
  return (
    glasgow?.ocular !== undefined &&
    glasgow?.verbal !== undefined &&
    glasgow?.motor !== undefined
  )
}

export const calculateGlasgowScore = (glasgow?: GlasgowAssessment) => {
  if (!areGlasgowComponentsComplete(glasgow)) return undefined
  return (glasgow?.ocular ?? 0) + (glasgow?.verbal ?? 0) + (glasgow?.motor ?? 0)
}

export const resolveGlasgowScore = (
  assessment: Pick<TriageAssessment, 'glasgow' | 'constantes'> | { glasgow?: GlasgowAssessment; constantes?: VitalSigns }
) => {
  const calculated = calculateGlasgowScore(assessment.glasgow)
  if (calculated !== undefined) return calculated
  if (assessment.constantes?.gcs !== undefined && !Number.isNaN(assessment.constantes.gcs)) {
    return assessment.constantes.gcs
  }
  return undefined
}

export const getGlasgowVisualState = (score?: number) => {
  if (score === undefined) return { label: 'Sin valorar', className: 'glasgow-neutral' }
  if (score <= 8) return { label: 'Crítico', className: 'glasgow-critical' }
  if (score <= 12) return { label: 'Grave', className: 'glasgow-high' }
  if (score <= 14) return { label: 'Moderado', className: 'glasgow-medium' }
  return { label: 'Leve / normal', className: 'glasgow-low' }
}
