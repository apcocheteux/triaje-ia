import type { ExportPort } from '../../ports/ExportPort'
import type { Patient, TriageResult } from '../../domain/types'
import { exportPatientPdf } from './pdf'
import { exportPatientJson, exportListJson } from './json'
import { exportListCsv } from './csv'

export const exportAdapter: ExportPort = {
  exportPatientPdf(patient: Patient, result: TriageResult) {
    exportPatientPdf(patient, result)
  },
  exportPatientJson(patient: Patient) {
    exportPatientJson(patient)
  },
  exportListCsv(patients: Patient[]) {
    exportListCsv(patients)
  },
  exportListJson(patients: Patient[]) {
    exportListJson(patients)
  },
}
