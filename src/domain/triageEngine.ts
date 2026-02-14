import type { Patient, Priority, TriageAssessment, TriageResult } from './types'
import { evaluateVitals, getAgeBand } from './vitals'
import { buildActions } from './actions'
import { redFlagCatalog, redFlagAreas } from './catalog'
import { resolveGlasgowScore } from './glasgow'

const criticalIds = new Set(redFlagCatalog.filter((f) => f.level === 1).map((f) => f.id))
const urgentIds = new Set(redFlagCatalog.filter((f) => f.level === 2).map((f) => f.id))
const moderateIds = new Set(redFlagCatalog.filter((f) => f.level === 3).map((f) => f.id))

const missingIfUndefined = (value: unknown, label: string, list: string[]) => {
  if (value === undefined || value === null || value === '') {
    list.push(label)
  }
}

export const computeMissingData = (assessment: TriageAssessment) => {
  const missing: string[] = []
  missingIfUndefined(assessment.motivoConsulta, 'Motivo de consulta', missing)
  missingIfUndefined(assessment.categoriaClinica, 'Categoría clínica', missing)
  missingIfUndefined(assessment.constantes.hr, 'Frecuencia cardiaca', missing)
  missingIfUndefined(assessment.constantes.rr, 'Frecuencia respiratoria', missing)
  missingIfUndefined(assessment.constantes.spo2, 'SatO2', missing)
  missingIfUndefined(assessment.constantes.sbp, 'Tensión arterial sistólica', missing)
  missingIfUndefined(assessment.constantes.temp, 'Temperatura', missing)
  missingIfUndefined(assessment.glasgow?.ocular, 'Glasgow ocular', missing)
  missingIfUndefined(assessment.glasgow?.verbal, 'Glasgow verbal', missing)
  missingIfUndefined(assessment.glasgow?.motor, 'Glasgow motora', missing)
  return missing
}

const formatValue = (value?: number, suffix = '') =>
  value === undefined || Number.isNaN(value) ? 'ND' : `${value}${suffix}`

const formatEva = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) return 'ND'
  const bounded = Math.min(10, Math.max(1, Math.round(value)))
  return `${bounded}/10`
}

const ageBandLabel = (ageYears: number) => {
  const band = getAgeBand(ageYears)
  switch (band) {
    case 'recien_nacido':
      return 'recien nacido'
    case 'lactante':
      return 'lactante'
    case 'nino_pequeno':
      return 'nino pequeno'
    case 'preescolar':
      return 'preescolar'
    case 'escolar':
      return 'escolar'
    case 'adolescente':
      return 'adolescente'
    default:
      return 'adulto'
  }
}

const dedupeList = (values: string[]) => Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))

const formatSigns = (result: TriageResult) => {
  const aiSigns = result.ai?.json?.red_flags_presentes ?? []
  const signs = dedupeList(aiSigns.length ? aiSigns : result.redFlagsPresent)
  if (!signs.length) return 'no referidos'
  return signs.join(', ')
}

const formatActions = (result: TriageResult) => {
  const aiActions = result.ai?.json?.actuaciones_enfermeras ?? []
  const actions = dedupeList(aiActions.length ? aiActions : result.actions).slice(0, 4)
  if (!actions.length) return 'Sin actuaciones específicas registradas'
  return actions.join('; ')
}

export const buildReadableEvolutivo = (patient: Patient, assessment: TriageAssessment, result: TriageResult) => {
  const timestamp = result.triageAt ? new Date(result.triageAt).toLocaleString('es-ES') : new Date().toLocaleString('es-ES')
  const ageBand = ageBandLabel(patient.demographics.edad)
  const gcs = resolveGlasgowScore(assessment)
  const gcsBreakdown = assessment.glasgow
    ? ` (O${assessment.glasgow.ocular ?? '-'} V${assessment.glasgow.verbal ?? '-'} M${assessment.glasgow.motor ?? '-'})`
    : ''
  const priorityReason = result.ai?.json?.motivo_prioridad?.trim() || result.reason

  const lines = [
    `${timestamp} - Paciente ${patient.demographics.edad} años (${ageBand}), sexo ${patient.demographics.sexo || 'no especificado'}.`,
    `Motivo: ${assessment.motivoConsulta || 'ND'}. Categoría: ${assessment.categoriaClinica}.`,
    `Constantes: FC ${formatValue(assessment.constantes.hr)} lpm, FR ${formatValue(assessment.constantes.rr)} rpm, TA ${formatValue(assessment.constantes.sbp)}/${formatValue(
      assessment.constantes.dbp
    )} mmHg, SatO2 ${formatValue(assessment.constantes.spo2)}%, Temp ${formatValue(assessment.constantes.temp)}°C, GCS ${
      gcs === undefined ? 'ND' : gcs
    }${gcsBreakdown}. Dolor EVA ${formatEva(assessment.dolor)}.`,
    `Signos de alarma: ${formatSigns(result)}.`,
    `Prioridad orientativa ${result.priority}: ${priorityReason}.`,
  ]

  if (result.priorityModifiedByAi && result.deterministicPriority) {
    lines.push(
      `Resultado modificado por IA según criterio SET orientativo. Prioridad original determinista: P${result.deterministicPriority}${
        result.deterministicReason ? ` (${result.deterministicReason})` : ''
      }.`
    )
  }

  lines.push(`Actuaciones enfermeras: ${formatActions(result)}.`)

  if (result.missingData.length) {
    lines.push(`Datos pendientes: ${result.missingData.join(', ')}.`)
  }

  return lines.join('\n')
}

export const computeTriage = (assessment: TriageAssessment, patient: Patient): TriageResult => {
  const missingData = computeMissingData(assessment)
  const age = patient.demographics.edad
  const gcs = resolveGlasgowScore(assessment)
  const vitalEvaluation = evaluateVitals({ ...assessment.constantes, gcs }, age)
  const reasons: Record<Priority, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] }

  const redFlagsPresent: string[] = []
  const selectedFlags = new Set(assessment.redFlags)
  redFlagCatalog.forEach((flag) => {
    if (selectedFlags.has(flag.id)) {
      redFlagsPresent.push(flag.label)
      if (flag.level === 1) reasons[1].push(flag.label)
      if (flag.level === 2) reasons[2].push(flag.label)
      if (flag.level === 3) reasons[3].push(flag.label)
    }
  })

  if (vitalEvaluation.flags.length) {
    redFlagsPresent.push(...vitalEvaluation.flags)
    if (vitalEvaluation.severity === 1) reasons[1].push('Constantes vitales críticas')
    if (vitalEvaluation.severity === 2) reasons[2].push('Constantes vitales muy alteradas')
    if (vitalEvaluation.severity === 3) reasons[3].push('Constantes vitales alteradas')
  }

  if (assessment.dolor >= 8) {
    reasons[3].push('Dolor muy intenso')
  } else if (assessment.dolor >= 4) {
    reasons[4].push('Dolor moderado')
  }

  if (assessment.sospechaInfecciosa) {
    reasons[3].push('Sospecha infecciosa')
  }

  let priority: Priority = 5
  if (reasons[1].length) priority = 1
  else if (reasons[2].length) priority = 2
  else if (reasons[3].length) priority = 3
  else if (reasons[4].length) priority = 4

  const reason = reasons[priority][0] || 'Paciente estable sin signos de alarma críticos'

  const uniqueRedFlags = Array.from(new Set(redFlagsPresent))
  const actions = buildActions(priority, assessment.categoriaClinica, assessment, uniqueRedFlags)

  const relevantFlags = new Set([
    ...redFlagAreas[assessment.categoriaClinica],
    ...Array.from(criticalIds),
    ...Array.from(urgentIds),
    ...Array.from(moderateIds),
  ])

  const redFlagsAbsent = Array.from(relevantFlags)
    .map((id) => redFlagCatalog.find((flag) => flag.id === id)?.label)
    .filter((label): label is string => Boolean(label))
    .filter((label) => !uniqueRedFlags.includes(label))

  const result: TriageResult = {
    priority,
    reason,
    redFlagsPresent: uniqueRedFlags.length ? uniqueRedFlags : ['Sin signos de alarma críticos identificados'],
    redFlagsAbsent,
    actions,
    missingData,
    evolutivo: '',
  }

  result.evolutivo = buildReadableEvolutivo(patient, assessment, result)
  return result
}
