import type { VitalSigns } from './types'

export type AgeBand = 'infante' | 'preescolar' | 'escolar' | 'adolescente' | 'adulto'

export type Threshold = {
  criticalLow?: number
  urgentLow?: number
  warningLow?: number
  warningHigh?: number
  urgentHigh?: number
  criticalHigh?: number
}

export type VitalThresholds = {
  hr: Threshold
  rr: Threshold
  sbp: Threshold
  spo2: Threshold
  temp: Threshold
  gcs: Threshold
}

const adultThresholds: VitalThresholds = {
  hr: { criticalLow: 40, urgentLow: 50, warningLow: 60, warningHigh: 110, urgentHigh: 130, criticalHigh: 150 },
  rr: { criticalLow: 8, urgentLow: 10, warningLow: 12, warningHigh: 24, urgentHigh: 30, criticalHigh: 35 },
  sbp: { criticalLow: 80, urgentLow: 90, warningLow: 100, warningHigh: 160, urgentHigh: 180, criticalHigh: 200 },
  spo2: { criticalLow: 90, urgentLow: 92, warningLow: 94 },
  temp: { criticalLow: 34, urgentLow: 35, warningLow: 36, warningHigh: 38.5, urgentHigh: 40, criticalHigh: 41 },
  gcs: { criticalLow: 8, urgentLow: 12, warningLow: 14 },
}

const infantThresholds: VitalThresholds = {
  hr: { criticalLow: 80, urgentLow: 90, warningLow: 100, warningHigh: 160, urgentHigh: 180, criticalHigh: 200 },
  rr: { criticalLow: 20, urgentLow: 25, warningLow: 30, warningHigh: 50, urgentHigh: 60, criticalHigh: 70 },
  sbp: { criticalLow: 60, urgentLow: 70, warningLow: 80, warningHigh: 120, urgentHigh: 130, criticalHigh: 140 },
  spo2: { criticalLow: 90, urgentLow: 92, warningLow: 94 },
  temp: adultThresholds.temp,
  gcs: adultThresholds.gcs,
}

const preschoolThresholds: VitalThresholds = {
  hr: { criticalLow: 70, urgentLow: 80, warningLow: 90, warningHigh: 140, urgentHigh: 160, criticalHigh: 180 },
  rr: { criticalLow: 20, urgentLow: 22, warningLow: 24, warningHigh: 40, urgentHigh: 50, criticalHigh: 60 },
  sbp: { criticalLow: 70, urgentLow: 80, warningLow: 90, warningHigh: 120, urgentHigh: 130, criticalHigh: 140 },
  spo2: { criticalLow: 90, urgentLow: 92, warningLow: 94 },
  temp: adultThresholds.temp,
  gcs: adultThresholds.gcs,
}

const schoolThresholds: VitalThresholds = {
  hr: { criticalLow: 60, urgentLow: 70, warningLow: 80, warningHigh: 120, urgentHigh: 140, criticalHigh: 160 },
  rr: { criticalLow: 12, urgentLow: 14, warningLow: 18, warningHigh: 30, urgentHigh: 35, criticalHigh: 45 },
  sbp: { criticalLow: 70, urgentLow: 80, warningLow: 90, warningHigh: 130, urgentHigh: 140, criticalHigh: 160 },
  spo2: { criticalLow: 90, urgentLow: 92, warningLow: 94 },
  temp: adultThresholds.temp,
  gcs: adultThresholds.gcs,
}

const adolescentThresholds: VitalThresholds = adultThresholds

export const getAgeBand = (ageYears: number): AgeBand => {
  if (ageYears < 1) return 'infante'
  if (ageYears < 5) return 'preescolar'
  if (ageYears < 13) return 'escolar'
  if (ageYears < 14) return 'adolescente'
  return 'adulto'
}

export const getThresholds = (ageYears: number): VitalThresholds => {
  const band = getAgeBand(ageYears)
  switch (band) {
    case 'infante':
      return infantThresholds
    case 'preescolar':
      return preschoolThresholds
    case 'escolar':
      return schoolThresholds
    case 'adolescente':
      return adolescentThresholds
    default:
      return adultThresholds
  }
}

const evaluateValue = (value: number, threshold: Threshold, label: string) => {
  if (threshold.criticalLow !== undefined && value <= threshold.criticalLow) {
    return { severity: 1, flag: `${label} críticamente baja` }
  }
  if (threshold.criticalHigh !== undefined && value >= threshold.criticalHigh) {
    return { severity: 1, flag: `${label} críticamente alta` }
  }
  if (threshold.urgentLow !== undefined && value <= threshold.urgentLow) {
    return { severity: 2, flag: `${label} muy baja` }
  }
  if (threshold.urgentHigh !== undefined && value >= threshold.urgentHigh) {
    return { severity: 2, flag: `${label} muy alta` }
  }
  if (threshold.warningLow !== undefined && value <= threshold.warningLow) {
    return { severity: 3, flag: `${label} baja` }
  }
  if (threshold.warningHigh !== undefined && value >= threshold.warningHigh) {
    return { severity: 3, flag: `${label} alta` }
  }
  return { severity: 5, flag: '' }
}

export const evaluateVitals = (vitals: VitalSigns, ageYears: number) => {
  const thresholds = getThresholds(ageYears)
  const flags: string[] = []
  let severity = 5

  const check = (value: number | undefined, threshold: Threshold, label: string) => {
    if (value === undefined || Number.isNaN(value)) return
    const result = evaluateValue(value, threshold, label)
    if (result.flag) flags.push(result.flag)
    severity = Math.min(severity, result.severity)
  }

  check(vitals.hr, thresholds.hr, 'Frecuencia cardiaca')
  check(vitals.rr, thresholds.rr, 'Frecuencia respiratoria')
  check(vitals.sbp, thresholds.sbp, 'Tensión sistólica')
  check(vitals.spo2, thresholds.spo2, 'SatO2')
  check(vitals.temp, thresholds.temp, 'Temperatura')
  check(vitals.gcs, thresholds.gcs, 'GCS')

  return { severity, flags }
}
