export type Priority = 1 | 2 | 3 | 4 | 5
export type Sex = 'M' | 'F' | 'X' | ''
export type PatientStatus = 'en_espera' | 'en_triaje' | 'en_observacion' | 'alta'

export type ClinicalArea =
  | 'respiratorio'
  | 'cardiovascular'
  | 'neurologico'
  | 'trauma'
  | 'abdominal'
  | 'infeccioso'
  | 'toxicos'
  | 'urologico'
  | 'gineco'
  | 'oftalmologico'
  | 'otorrino'
  | 'dermatologico'
  | 'endocrino'
  | 'psiquiatrico'
  | 'pediatrico'
  | 'otros'

export type AiProvider = 'gemini' | 'openai'

export interface VitalSigns {
  hr?: number
  rr?: number
  temp?: number
  spo2?: number
  sbp?: number
  dbp?: number
  gcs?: number
  glucose?: number
}

export interface GlasgowAssessment {
  ocular?: number
  verbal?: number
  motor?: number
}

export interface TriageAssessment {
  motivoConsulta: string
  categoriaClinica: ClinicalArea
  sintomas: string[]
  redFlags: string[]
  constantes: VitalSigns
  glasgow?: GlasgowAssessment
  dolor: number
  observaciones: string
  sospechaInfecciosa: boolean
}

export interface AiTriageJson {
  resumen_clinico: string
  sospecha_clinica: string[]
  prioridad_sugerida: number
  motivo_prioridad: string
  red_flags_presentes: string[]
  red_flags_ausentes: string[]
  actuaciones_enfermeras: string[]
  actuaciones_priorizadas: string[]
  objetivos_monitorizacion: string[]
  criterios_escalada: string[]
  preguntas_clave: string[]
  datos_faltantes: string[]
  evolutivo_triaje: string
}

export interface AiTriageResponse {
  json: AiTriageJson
  rawText: string
}

export interface TriageResult {
  priority: Priority
  reason: string
  deterministicPriority?: Priority
  deterministicReason?: string
  priorityModifiedByAi?: boolean
  triageAt?: string
  aiAttempted?: boolean
  aiPending?: boolean
  aiProvider?: AiProvider
  aiModel?: string
  aiError?: string
  aiLatencyMs?: number
  redFlagsPresent: string[]
  redFlagsAbsent: string[]
  actions: string[]
  missingData: string[]
  evolutivo: string
  ai?: AiTriageResponse
}

export interface FollowUpEvent {
  id: string
  createdAt: string
  note: string
  constantes?: VitalSigns
  reTriage?: TriageResult
}

export interface Patient {
  id: string
  createdAt: string
  updatedAt: string
  status: PatientStatus
  demographics: {
    nombre?: string
    apellidos?: string
    sexo: Sex
    edad: number
    pesoKg?: number
  }
  clinical: {
    antecedentes?: string
    alergias?: string
    medicacion?: string
    embarazo?: 'si' | 'no' | 'desconocido'
    semanasEmbarazo?: number
    vacunacion?: string
    riesgosSociales?: string
  }
  assessment?: TriageAssessment
  result?: TriageResult
  followUps: FollowUpEvent[]
}

export interface AiConfig {
  enabled: boolean
  provider: AiProvider
  apiKey: string
  model: string
}

export interface AppState {
  version: string
  updatedAt: string
  patients: Patient[]
  config: AiConfig
}
