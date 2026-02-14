import type { ClinicalArea, Priority, TriageAssessment } from './types'

const baseActions: Record<Priority, string[]> = {
  1: [
    'Activar circuito de críticos y aviso inmediato al equipo médico',
    'Monitorización continua y constantes frecuentes',
    'Canalizar vía venosa y extracción según protocolo',
    'Oxígeno si SatO2 < 94% o dificultad respiratoria',
  ],
  2: [
    'Monitorización continua o seriada según protocolo',
    'Constantes completas y reevaluación frecuente',
    'Canalizar vía venosa si procede',
    'ECG si dolor torácico, síncope o palpitaciones',
    'Glucemia capilar si alteración del nivel de consciencia',
  ],
  3: [
    'Constantes completas y reevaluación periódica',
    'Control de dolor no farmacológico y confort',
    'Educación breve de signos de alarma',
  ],
  4: [
    'Constantes básicas y reevaluación si cambios',
    'Información de tiempos de espera y signos de alarma',
  ],
  5: [
    'Orientación y educación sanitaria básica',
    'Recomendación de seguimiento ambulatorio si procede',
  ],
}

const areaActions: Record<ClinicalArea, string[]> = {
  respiratorio: ['Ajuste de posición y evaluación de disnea'],
  cardiovascular: ['ECG de 12 derivaciones si dolor torácico o palpitaciones'],
  neurologico: ['Escala neurológica seriada (GCS/FAST)'],
  trauma: ['Control de hemorragias e inmovilización si procede'],
  abdominal: ['Control de dolor y valoración de abdomen'],
  infeccioso: ['Aislamiento si sospecha infecciosa', 'Control de temperatura'],
  toxicos: ['Retirar acceso a tóxicos y vigilar vía aérea'],
  urologico: ['Control de diuresis si procede'],
  gineco: ['Valoración de sangrado y monitorización fetal si procede'],
  oftalmologico: ['Protección ocular si trauma'],
  otorrino: ['Compresión local en epistaxis si protocolo'],
  dermatologico: ['Observación de lesiones y signos de anafilaxia'],
  endocrino: ['Glucemia capilar y monitorización'],
  psiquiatrico: ['Entorno seguro y valoración de riesgo autolesivo'],
  pediatrico: ['Escala pediátrica y confort familiar'],
  otros: ['Reevaluación según evolución'],
}

export const buildActions = (
  priority: Priority,
  area: ClinicalArea,
  assessment: TriageAssessment,
  redFlagsPresent: string[]
) => {
  const actions = new Set<string>()
  baseActions[priority].forEach((item) => actions.add(item))
  areaActions[area].forEach((item) => actions.add(item))

  if (assessment.sospechaInfecciosa) {
    actions.add('Medidas de aislamiento según protocolo')
  }

  if (redFlagsPresent.some((flag) => flag.toLowerCase().includes('dolor torácico'))) {
    actions.add('Monitorización cardiaca continua')
  }

  return Array.from(actions)
}
