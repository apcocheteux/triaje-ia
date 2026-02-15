import type { AiProviderPort } from '../../ports/AiProviderPort'
import type {
  AiConfig,
  AiPriorityResponse,
  AiToken,
  AiTokenEvent,
  AiTriageResponse,
  Patient,
  TriageAssessment,
} from '../../domain/types'
import { getProviderTokens, getTokenSuffix } from '../../domain/aiTokens'
import { geminiAdapter } from './gemini'
import { openAiAdapter } from './openai'

const providerMap: Record<string, AiProviderPort> = {
  gemini: geminiAdapter,
  openai: openAiAdapter,
}

class AiTokenFallbackError extends Error {
  tokenEvents: AiTokenEvent[]
  statusCode?: number

  constructor(message: string, tokenEvents: AiTokenEvent[], statusCode?: number) {
    super(message)
    this.name = 'AiTokenFallbackError'
    this.tokenEvents = tokenEvents
    this.statusCode = statusCode
  }
}

const resolveStatusCode = (error: unknown) => {
  if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
    return error.status
  }
  if (error instanceof Error) {
    const match = error.message.match(/error\s+(\d{3})/i)
    if (match?.[1]) {
      return Number.parseInt(match[1], 10)
    }
  }
  return undefined
}

const resolveErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().slice(0, 220)
  }
  return 'Error desconocido en llamada IA.'
}

const appendTokenEvents = <T extends { tokenId?: string; tokenSuffix?: string; tokenEvents?: AiTokenEvent[] }>(
  response: T,
  token: AiToken,
  tokenEvents: AiTokenEvent[]
) => ({
  ...response,
  tokenId: token.id,
  tokenSuffix: getTokenSuffix(token.value),
  tokenEvents,
})

const executeWithTokenFallback = async <T extends { tokenId?: string; tokenSuffix?: string; tokenEvents?: AiTokenEvent[] }>(
  config: AiConfig,
  execute: (configWithToken: AiConfig) => Promise<T>
): Promise<T> => {
  const tokens = getProviderTokens(config, config.provider)
  if (!tokens.length) {
    throw new AiTokenFallbackError(`No hay tokens configurados para ${config.provider}.`, [])
  }

  const tokenEvents: AiTokenEvent[] = []

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) {
      continue
    }
    const configWithToken: AiConfig = {
      ...config,
      apiKey: token.value,
    }

    try {
      const response = await execute(configWithToken)
      tokenEvents.push({
        tokenId: token.id,
        provider: token.provider,
        usedAt: new Date().toISOString(),
      })
      return appendTokenEvents(response, token, tokenEvents)
    } catch (error) {
      const statusCode = resolveStatusCode(error)
      tokenEvents.push({
        tokenId: token.id,
        provider: token.provider,
        errorAt: new Date().toISOString(),
        errorMessage: resolveErrorMessage(error),
        statusCode,
      })

      const isRateLimited = statusCode === 429
      const hasMoreTokens = index < tokens.length - 1
      if (isRateLimited && hasMoreTokens) {
        continue
      }

      throw new AiTokenFallbackError(resolveErrorMessage(error), tokenEvents, statusCode)
    }
  }

  throw new AiTokenFallbackError('No se pudo obtener respuesta IA con los tokens configurados.', tokenEvents)
}

export const extractAiTokenEvents = (error: unknown): AiTokenEvent[] => {
  if (error instanceof AiTokenFallbackError) {
    return error.tokenEvents
  }
  if (typeof error === 'object' && error !== null && 'tokenEvents' in error && Array.isArray(error.tokenEvents)) {
    return error.tokenEvents as AiTokenEvent[]
  }
  return []
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
  return executeWithTokenFallback(config, (configWithToken) => provider.generate(assessment, patient, configWithToken))
}

export const generateAiPriority = async (
  assessment: TriageAssessment,
  patient: Patient,
  config: AiConfig
): Promise<AiPriorityResponse> => {
  const provider = providerMap[config.provider]
  if (!provider) {
    throw new Error('Proveedor de IA no soportado')
  }
  return executeWithTokenFallback(config, (configWithToken) =>
    provider.generatePriority(assessment, patient, configWithToken)
  )
}
