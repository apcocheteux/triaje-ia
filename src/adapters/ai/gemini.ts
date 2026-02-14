import type { AiProviderPort } from '../../ports/AiProviderPort'
import type { AiConfig, AiTriageResponse, Patient, TriageAssessment } from '../../domain/types'
import { buildPrompt } from './prompt'
import { parseAiResponse } from './parser'

export const geminiAdapter: AiProviderPort = {
  async generate(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiTriageResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de Gemini')
    }

    const prompt = buildPrompt(assessment, patient)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, topP: 0.8, topK: 40, maxOutputTokens: 800 },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini error ${response.status}`)
    }

    const data = await response.json()
    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text: string }) => part.text).join('')
    if (!text) {
      throw new Error('Respuesta vacía de Gemini')
    }
    return parseAiResponse(text)
  },
}
