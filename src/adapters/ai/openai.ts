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

const buildOpenAiHttpError = async (response: Response) => {
  let details = ''
  try {
    const body = await response.text()
    details = body.replace(/\s+/g, ' ').trim().slice(0, 180)
  } catch {
    details = ''
  }
  const message = details ? `OpenAI error ${response.status}: ${details}` : `OpenAI error ${response.status}`
  const error = new Error(message) as Error & { status?: number }
  error.status = response.status
  return error
}

export const openAiAdapter: AiProviderPort = {
  async generate(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiTriageResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de OpenAI')
    }

    const prompt = buildPrompt(assessment, patient)
    const endpoint = 'https://api.openai.com/v1/chat/completions'
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    }

    const buildBody = (jsonMode: boolean, maxTokens: number, extraInstruction = '') => ({
      model: config.model,
      messages: [{ role: 'user', content: `${prompt}${extraInstruction}` }],
      temperature: 0.2,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    })

    const requestCompletion = async (maxTokens: number, extraInstruction = '') => {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildBody(true, maxTokens, extraInstruction)),
      })

      if (!response.ok && response.status === 400) {
        // Fallback para modelos que no soportan json mode en chat completions.
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildBody(false, maxTokens, extraInstruction)),
        })
      }

      if (!response.ok) {
        throw await buildOpenAiHttpError(response)
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string | null }>
      }
      const choice = data?.choices?.[0]
      const text = choice?.message?.content
      if (!text) {
        throw new Error('Respuesta vacía de OpenAI')
      }

      return { text, finishReason: choice?.finish_reason ?? null }
    }

    const firstAttempt = await requestCompletion(2600)

    try {
      if (firstAttempt.finishReason === 'length') {
        const secondAttempt = await requestCompletion(4200, strictJsonReminder)
        return parseAiResponse(secondAttempt.text)
      }
      return parseAiResponse(firstAttempt.text)
    } catch (error) {
      if (!isJsonParsingIssue(error)) {
        throw error
      }

      const secondAttempt = await requestCompletion(4200, strictJsonReminder)
      try {
        return parseAiResponse(secondAttempt.text)
      } catch (secondError) {
        const reason = secondAttempt.finishReason ? ` (finish_reason=${secondAttempt.finishReason})` : ''
        throw new Error(`No se pudo obtener JSON válido de OpenAI${reason}. ${String(secondError)}`)
      }
    }
  },
  async generatePriority(assessment: TriageAssessment, patient: Patient, config: AiConfig): Promise<AiPriorityResponse> {
    if (!config.apiKey) {
      throw new Error('Falta API key de OpenAI')
    }

    const prompt = buildPriorityPrompt(assessment, patient)
    const endpoint = 'https://api.openai.com/v1/chat/completions'
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    }

    const buildBody = (jsonMode: boolean, maxTokens: number, extraInstruction = '') => ({
      model: config.model,
      messages: [{ role: 'user', content: `${prompt}${extraInstruction}` }],
      temperature: 0.1,
      max_tokens: maxTokens,
      ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
    })

    const requestCompletion = async (maxTokens: number, extraInstruction = '') => {
      let response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(buildBody(true, maxTokens, extraInstruction)),
      })

      if (!response.ok && response.status === 400) {
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildBody(false, maxTokens, extraInstruction)),
        })
      }

      if (!response.ok) {
        throw await buildOpenAiHttpError(response)
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string }; finish_reason?: string | null }>
      }
      const choice = data?.choices?.[0]
      const text = choice?.message?.content
      if (!text) {
        throw new Error('Respuesta vacía de OpenAI')
      }

      return { text, finishReason: choice?.finish_reason ?? null }
    }

    const firstAttempt = await requestCompletion(180)

    try {
      if (firstAttempt.finishReason === 'length') {
        const secondAttempt = await requestCompletion(360, strictPriorityReminder)
        return parseAiPriorityResponse(secondAttempt.text)
      }
      return parseAiPriorityResponse(firstAttempt.text)
    } catch (error) {
      if (!isJsonParsingIssue(error)) {
        throw error
      }

      const secondAttempt = await requestCompletion(360, strictPriorityReminder)
      try {
        return parseAiPriorityResponse(secondAttempt.text)
      } catch (secondError) {
        const reason = secondAttempt.finishReason ? ` (finish_reason=${secondAttempt.finishReason})` : ''
        throw new Error(`No se pudo obtener JSON válido de OpenAI (prioridad)${reason}. ${String(secondError)}`)
      }
    }
  },
}
