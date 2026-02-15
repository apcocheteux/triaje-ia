import { defineStore } from 'pinia'
import type { AiConfig, AiTokenEvent, AppState, Patient, TriageAssessment, TriageResult } from '../domain/types'
import { localStorageAdapter } from '../adapters/storage/localStorage'
import { buildDemoPatients } from '../data/demoPatients'
import { migrateAiConfigTokens } from '../domain/aiTokens'

const VERSION = 'v1'

export const defaultAiConfig: AiConfig = {
  enabled: false,
  provider: 'gemini',
  apiKey: '',
  tokens: [],
  model: 'gemini-2.5-flash',
}

const defaultState = (): AppState => ({
  version: VERSION,
  updatedAt: new Date().toISOString(),
  patients: [],
  config: { ...defaultAiConfig, tokens: [] },
})

const migrateAiConfig = (config: AiConfig): AiConfig => {
  const provider = config.provider === 'openai' ? 'openai' : 'gemini'
  const model = config.model?.trim() || defaultAiConfig.model
  return {
    enabled: Boolean(config.enabled),
    provider,
    model: provider === 'gemini' && model === 'gemini-1.5-flash' ? 'gemini-2.5-flash' : model,
    apiKey: '',
    tokens: migrateAiConfigTokens({ ...config, provider, model }),
  }
}

export const useAppStore = defineStore('app', {
  state: (): AppState => {
    const loaded = localStorageAdapter.load()
    if (!loaded || loaded.version !== VERSION) {
      return defaultState()
    }
    loaded.config = migrateAiConfig({ ...defaultAiConfig, ...loaded.config })
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
      this.config = migrateAiConfig({ ...this.config, ...config })
      this.updatedAt = new Date().toISOString()
    },
    recordAiTokenEvents(events: AiTokenEvent[]) {
      if (!events.length) return
      let touched = false
      events.forEach((event) => {
        const token = this.config.tokens.find((candidate) => candidate.id === event.tokenId && candidate.provider === event.provider)
        if (!token) return
        if (event.usedAt) {
          token.lastUsedAt = event.usedAt
          touched = true
        }
        if (event.errorAt) {
          token.lastErrorAt = event.errorAt
          token.lastError = event.errorMessage || 'Error desconocido'
          touched = true
        }
      })
      if (touched) {
        this.updatedAt = new Date().toISOString()
      }
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
      const preservedConfig = { ...this.config }
      this.$state = {
        ...defaultState(),
        config: preservedConfig,
        updatedAt: new Date().toISOString(),
      }
      localStorageAdapter.save(this.$state)
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
