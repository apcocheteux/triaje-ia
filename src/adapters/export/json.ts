import type { Patient } from '../../domain/types'
import { downloadBlob } from './utils'

export const exportPatientJson = (patient: Patient) => {
  const blob = new Blob([JSON.stringify(patient, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `paciente-${patient.id}.json`)
}

export const exportListJson = (patients: Patient[]) => {
  const blob = new Blob([JSON.stringify(patients, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `lista-pacientes.json`)
}
