import type { AiConfig, AiTriageResponse, Patient, TriageAssessment } from '../domain/types'

export interface AiProviderPort {
  generate(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiTriageResponse>
}
