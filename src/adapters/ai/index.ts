import type { AiProviderPort } from '../../ports/AiProviderPort'
import type { AiConfig, AiTriageResponse, Patient, TriageAssessment } from '../../domain/types'
import { geminiAdapter } from './gemini'
import { openAiAdapter } from './openai'

const providerMap: Record<string, AiProviderPort> = {
  gemini: geminiAdapter,
  openai: openAiAdapter,
}

export const generateAiTriage = async (
  assessment: TriageAssessment,
  patient: Patient,
  config: AiConfig
): Promise<AiTriageResponse> => {
  const provider = providerMap[config.provider]
  if (!provider) {
    throw new Error('Proveedor de IA no soportado')
  }
  return provider.generate(assessment, patient, config)
}
