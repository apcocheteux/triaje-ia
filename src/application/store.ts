import { defineStore } from 'pinia'
import type { AppState, Patient, AiConfig, TriageAssessment, TriageResult } from '../domain/types'
import { localStorageAdapter } from '../adapters/storage/localStorage'
import { buildDemoPatients } from '../data/demoPatients'

const VERSION = 'v1'

export const defaultAiConfig: AiConfig = {
  enabled: false,
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-1.5-flash',
}

const defaultState = (): AppState => ({
  version: VERSION,
  updatedAt: new Date().toISOString(),
  patients: [],
  config: { ...defaultAiConfig },
})

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    const loaded = localStorageAdapter.load()
    if (!loaded || loaded.version !== VERSION) {
      return defaultState()
    }
    return loaded
  },
  getters: {
    patientById: (state) => (id: string) => state.patients.find((patient) => patient.id === id),
  },
  actions: {
    bindStorage() {
      this.$subscribe((_mutation, state) => {
        localStorageAdapter.save(state)
      })
    },
    addPatient(patient: Patient) {
      this.patients.unshift(patient)
      this.updatedAt = new Date().toISOString()
    },
    updatePatient(updated: Patient) {
      const index = this.patients.findIndex((patient) => patient.id === updated.id)
      if (index !== -1) {
        this.patients[index] = { ...updated, updatedAt: new Date().toISOString() }
      }
      this.updatedAt = new Date().toISOString()
    },
    removePatient(id: string) {
      this.patients = this.patients.filter((patient) => patient.id !== id)
      this.updatedAt = new Date().toISOString()
    },
    setAssessment(id: string, assessment: TriageAssessment, result?: TriageResult) {
      const patient = this.patients.find((p) => p.id === id)
      if (!patient) return
      patient.assessment = assessment
      if (result) {
        if (!result.triageAt) {
          result.triageAt = new Date().toISOString()
        }
        patient.result = result
      }
      if (patient.status === 'en_espera') {
        patient.status = 'en_triaje'
      }
      patient.updatedAt = new Date().toISOString()
      this.updatedAt = new Date().toISOString()
    },
    setResult(id: string, result: TriageResult) {
      const patient = this.patients.find((p) => p.id === id)
      if (!patient) return
      if (!result.triageAt) {
        result.triageAt = new Date().toISOString()
      }
      patient.result = result
      patient.updatedAt = new Date().toISOString()
      this.updatedAt = new Date().toISOString()
    },
    updateConfig(config: Partial<AiConfig>) {
      this.config = { ...this.config, ...config }
      this.updatedAt = new Date().toISOString()
    },
    loadDemo() {
      if (this.patients.length) return
      this.patients = buildDemoPatients()
      this.updatedAt = new Date().toISOString()
    },
    importDemoPatients() {
      this.patients = [...buildDemoPatients(), ...this.patients]
      this.updatedAt = new Date().toISOString()
    },
    clearAll() {
      this.$state = defaultState()
      localStorageAdapter.clear()
    },
  },
})

export const createEmptyPatient = (): Patient => {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'en_espera',
    demographics: {
      nombre: '',
      apellidos: '',
      sexo: '',
      edad: 0,
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
  }
}
