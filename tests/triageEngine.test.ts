import { describe, it, expect } from 'vitest'
import { computeMissingData, computeTriage } from '../src/domain/triageEngine'
import type { Patient, TriageAssessment } from '../src/domain/types'

const basePatient: Patient = {
  id: 'test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'en_espera',
  demographics: { nombre: '', apellidos: '', sexo: 'M', edad: 45, pesoKg: 80 },
  clinical: {
    antecedentes: '',
    alergias: '',
    medicacion: '',
    embarazo: 'no',
    semanasEmbarazo: undefined,
    vacunacion: '',
    riesgosSociales: '',
  },
  assessment: undefined,
  result: undefined,
  followUps: [],
}

const baseAssessment: TriageAssessment = {
  motivoConsulta: 'Disnea',
  categoriaClinica: 'respiratorio',
  sintomas: ['Disnea'],
  redFlags: [],
  constantes: { hr: 90, rr: 18, sbp: 120, dbp: 70, spo2: 97, temp: 36.5 },
  glasgow: { ocular: 4, verbal: 5, motor: 6 },
  dolor: 2,
  observaciones: '',
  sospechaInfecciosa: false,
}

describe('triageEngine', () => {
  it('detecta datos faltantes clave', () => {
    const missing = computeMissingData({
      ...baseAssessment,
      motivoConsulta: '',
      constantes: {},
    })
    expect(missing).toContain('Motivo de consulta')
    expect(missing).toContain('Frecuencia cardiaca')
  })

  it('prioriza como nivel 1 con SatO2 crítica', () => {
    const result = computeTriage(
      { ...baseAssessment, constantes: { ...baseAssessment.constantes, spo2: 85 } },
      basePatient
    )
    expect(result.priority).toBe(1)
  })

  it('prioriza como nivel 2 con dolor torácico', () => {
    const result = computeTriage(
      { ...baseAssessment, categoriaClinica: 'cardiovascular', redFlags: ['dolor_toracico'] },
      basePatient
    )
    expect(result.priority).toBe(2)
  })

  it('aplica umbrales pediátricos', () => {
    const pedPatient = { ...basePatient, demographics: { ...basePatient.demographics, edad: 3 } }
    const result = computeTriage(
      { ...baseAssessment, constantes: { ...baseAssessment.constantes, hr: 170 } },
      pedPatient
    )
    expect(result.priority).toBeLessThanOrEqual(2)
  })
})
