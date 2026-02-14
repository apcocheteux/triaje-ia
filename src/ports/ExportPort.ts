import type { Patient, TriageResult } from '../domain/types'

export interface ExportPort {
  exportPatientPdf(patient: Patient, result: TriageResult): void
  exportPatientJson(patient: Patient): void
  exportListCsv(patients: Patient[]): void
  exportListJson(patients: Patient[]): void
}
