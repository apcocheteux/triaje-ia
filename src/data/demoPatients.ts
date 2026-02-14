import type { Patient } from '../domain/types'
import { computeTriage } from '../domain/triageEngine'

const basePatient = (partial: Partial<Patient>): Patient => {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: 'en_espera',
    demographics: {
      nombre: '',
      apellidos: '',
      sexo: '',
      edad: 30,
      pesoKg: undefined,
    },
    clinical: {
      antecedentes: '',
      alergias: '',
      medicacion: '',
      embarazo: 'desconocido',
      semanasEmbarazo: undefined,
      vacunacion: '',
      riesgosSociales: '',
    },
    assessment: undefined,
    result: undefined,
    followUps: [],
    ...partial,
  }
}

export const buildDemoPatients = (): Patient[] => {
  const demo1 = basePatient({
    demographics: { nombre: 'Carlos', apellidos: 'M.', sexo: 'M', edad: 58, pesoKg: 82 },
    clinical: {
      antecedentes: 'HTA, dislipemia',
      alergias: 'ND',
      medicacion: 'IECA',
      embarazo: 'no',
      semanasEmbarazo: undefined,
      vacunacion: 'ND',
      riesgosSociales: '',
    },
    assessment: {
      motivoConsulta: 'Dolor torácico opresivo de inicio súbito',
      categoriaClinica: 'cardiovascular',
      sintomas: ['Dolor torácico', 'Disnea'],
      redFlags: ['dolor_toracico'],
      constantes: { hr: 112, rr: 24, sbp: 145, dbp: 90, spo2: 94, temp: 36.7, gcs: 15 },
      dolor: 8,
      observaciones: 'Dolor irradiado a brazo izquierdo',
      sospechaInfecciosa: false,
    },
  })

  demo1.result = computeTriage(demo1.assessment!, demo1)

  const demo2 = basePatient({
    demographics: { nombre: 'Lucía', apellidos: 'G.', sexo: 'F', edad: 3, pesoKg: 14 },
    clinical: {
      antecedentes: 'Sin antecedentes',
      alergias: 'ND',
      medicacion: '',
      embarazo: 'no',
      vacunacion: 'Calendario completo',
      riesgosSociales: '',
    },
    assessment: {
      motivoConsulta: 'Fiebre alta y decaimiento',
      categoriaClinica: 'pediatrico',
      sintomas: ['Fiebre', 'Letargo'],
      redFlags: ['sepsis'],
      constantes: { hr: 150, rr: 38, sbp: 90, spo2: 95, temp: 39.5, gcs: 14 },
      dolor: 2,
      observaciones: 'Rechazo de alimentación',
      sospechaInfecciosa: true,
    },
  })

  demo2.result = computeTriage(demo2.assessment!, demo2)

  const demo3 = basePatient({
    demographics: { nombre: 'Manuel', apellidos: 'R.', sexo: 'M', edad: 72, pesoKg: 76 },
    clinical: {
      antecedentes: 'DM2',
      alergias: '',
      medicacion: 'Metformina',
      embarazo: 'no',
      vacunacion: 'ND',
      riesgosSociales: 'Vive solo',
    },
    assessment: {
      motivoConsulta: 'Debilidad brusca en hemicuerpo derecho',
      categoriaClinica: 'neurologico',
      sintomas: ['Déficit focal', 'Alteración conciencia'],
      redFlags: ['ictus'],
      constantes: { hr: 98, rr: 20, sbp: 170, dbp: 95, spo2: 96, temp: 36.5, gcs: 13 },
      dolor: 1,
      observaciones: 'Inicio hace 40 min',
      sospechaInfecciosa: false,
    },
  })

  demo3.result = computeTriage(demo3.assessment!, demo3)

  const demo4 = basePatient({
    demographics: { nombre: 'Ana', apellidos: 'L.', sexo: 'F', edad: 29, pesoKg: 60 },
    clinical: {
      antecedentes: 'Embarazo 20 semanas',
      alergias: 'ND',
      medicacion: '',
      embarazo: 'si',
      semanasEmbarazo: 20,
      vacunacion: 'ND',
      riesgosSociales: '',
    },
    assessment: {
      motivoConsulta: 'Dolor abdominal bajo y sangrado leve',
      categoriaClinica: 'gineco',
      sintomas: ['Dolor pélvico', 'Sangrado vaginal'],
      redFlags: ['embarazo_riesgo'],
      constantes: { hr: 105, rr: 18, sbp: 110, dbp: 70, spo2: 98, temp: 36.8, gcs: 15 },
      dolor: 6,
      observaciones: 'Sin mareos',
      sospechaInfecciosa: false,
    },
  })

  demo4.result = computeTriage(demo4.assessment!, demo4)

  return [demo1, demo2, demo3, demo4]
}

export const demoPatients: Patient[] = buildDemoPatients()
