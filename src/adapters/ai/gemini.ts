import type { AiProviderPort } from '../../ports/AiProviderPort'
import type { AiConfig, AiPriorityResponse, AiTriageResponse, Patient, TriageAssessment } from '../../domain/types'
import { buildPriorityPrompt, buildPrompt } from './prompt'
import { parseAiPriorityResponse, parseAiResponse } from './parser'

const strictJsonReminder =
  '\n\nIMPORTANTE FINAL: Devuelve SOLO un JSON cerrado y válido, sin texto fuera del JSON. "resumen_clinico" entre 45 y 90 palabras. Resto de strings: máximo 18 palabras. Máximo 4 elementos por array. "preguntas_clave" en formato pregunta clínica (¿...?).'
const strictPriorityReminder =
  '\n\nIMPORTANTE FINAL: Devuelve SOLO un JSON cerrado y válido con {"prioridad_sugerida":1,"motivo_prioridad":""}. Sin texto fuera del JSON.'

const isJsonParsingIssue = (error: unknown) =>
  (error instanceof Error &&
    (error.message.includes('No se encontró JSON') ||
      error.message.includes('Unexpected end of JSON input') ||
      error.message.includes('JSON'))) ||
  (typeof error === 'object' && error !== null && 'name' in error && error.name === 'ZodError')

const buildGeminiHttpError = async (response: Response) => {
  let details = ''
  try {
    const body = await response.text()
    details = body.replace(/\s+/g, ' ').trim().slice(0, 180)
  } catch {
    details = ''
  }
  const message = details ? `Gemini error ${response.status}: ${details}` : `Gemini error ${response.status}`
  const error = new Error(message) as Error & { status?: number }
  error.status = response.status
  return error
}

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
        throw await buildGeminiHttpError(response)
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
  async generatePriority(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiPriorityResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de Gemini')
    }

    const prompt = buildPriorityPrompt(assessment, patient)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`
    const buildBody = (jsonMode: boolean, maxOutputTokens: number, extraInstruction = '') => ({
      contents: [{ role: 'user', parts: [{ text: `${prompt}${extraInstruction}` }] }],
      generationConfig: {
        temperature: 0.1,
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
        response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildBody(false, maxOutputTokens, extraInstruction)),
        })
      }

      if (!response.ok) {
        throw await buildGeminiHttpError(response)
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

    const firstAttempt = await requestCompletion(260)

    try {
      if (firstAttempt.finishReason === 'MAX_TOKENS') {
        const secondAttempt = await requestCompletion(420, strictPriorityReminder)
        return parseAiPriorityResponse(secondAttempt.text)
      }
      return parseAiPriorityResponse(firstAttempt.text)
    } catch (error) {
      if (!isJsonParsingIssue(error)) {
        throw error
      }

      const secondAttempt = await requestCompletion(420, strictPriorityReminder)
      try {
        return parseAiPriorityResponse(secondAttempt.text)
      } catch (secondError) {
        const reason = secondAttempt.finishReason ? ` (finishReason=${secondAttempt.finishReason})` : ''
        throw new Error(`No se pudo obtener JSON válido de Gemini (prioridad)${reason}. ${String(secondError)}`)
      }
    }
  },
}
