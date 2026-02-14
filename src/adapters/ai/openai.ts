import type { AiProviderPort } from '../../ports/AiProviderPort'
import type { AiConfig, AiTriageResponse, Patient, TriageAssessment } from '../../domain/types'
import { buildPrompt } from './prompt'
import { parseAiResponse } from './parser'

export const openAiAdapter: AiProviderPort = {
  async generate(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiTriageResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de OpenAI')
    }

    const prompt = buildPrompt(assessment, patient)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 900,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI error ${response.status}`)
    }

    const data = await response.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      throw new Error('Respuesta vacía de OpenAI')
    }

    return parseAiResponse(text)
  },
}
