import type { AiProviderPort } from '../../ports/AiProviderPort'
import type { AiConfig, AiTriageResponse, Patient, TriageAssessment } from '../../domain/types'
import { buildPrompt } from './prompt'
import { parseAiResponse } from './parser'

const strictJsonReminder =
  '\n\nIMPORTANTE FINAL: Devuelve SOLO un JSON cerrado y válido, sin texto fuera del JSON. "resumen_clinico" entre 45 y 90 palabras. Resto de strings: máximo 18 palabras. Máximo 4 elementos por array. "preguntas_clave" en formato pregunta clínica (¿...?).'

const isJsonParsingIssue = (error: unknown) =>
  error instanceof Error &&
  (error.message.includes('No se encontró JSON') ||
    error.message.includes('Unexpected end of JSON input') ||
    error.message.includes('JSON'))

export const geminiAdapter: AiProviderPort = {
  async generate(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiTriageResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de Gemini')
    }

    const prompt = buildPrompt(assessment, patient)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
    const buildBody = (jsonMode: boolean, maxOutputTokens: number, extraInstruction = '') => ({
      contents: [{ role: 'user', parts: [{ text: `${prompt}${extraInstruction}` }] }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens,
        ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
      },
    })

    const requestCompletion = async (maxOutputTokens: number, extraInstruction = '') => {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildBody(true, maxOutputTokens, extraInstruction)),
      })

      if (!response.ok && response.status === 400) {
        // Fallback para modelos sin soporte responseMimeType JSON.
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(false, maxOutputTokens, extraInstruction)),
        })
      }

      if (!response.ok) {
        throw new Error(`Gemini error ${response.status}`)
      }

      const data = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>
      }
      const candidate = data?.candidates?.[0]
      const text = candidate?.content?.parts?.map((part) => part.text || '').join('')
      if (!text) {
        throw new Error('Respuesta vacía de Gemini')
      }

      return { text, finishReason: candidate?.finishReason ?? '' }
    }

    const firstAttempt = await requestCompletion(2600)

    try {
      if (firstAttempt.finishReason === 'MAX_TOKENS') {
        const secondAttempt = await requestCompletion(4096, strictJsonReminder)
        return parseAiResponse(secondAttempt.text)
      }
      return parseAiResponse(firstAttempt.text)
    } catch (error) {
      if (!isJsonParsingIssue(error)) {
        throw error
      }

      const secondAttempt = await requestCompletion(4096, strictJsonReminder)
      try {
        return parseAiResponse(secondAttempt.text)
      } catch (secondError) {
        const reason = secondAttempt.finishReason ? ` (finishReason=${secondAttempt.finishReason})` : ''
        throw new Error(`No se pudo obtener JSON válido de Gemini${reason}. ${String(secondError)}`)
      }
    }
  },
}
