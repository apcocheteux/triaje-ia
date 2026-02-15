import type { AiConfig, AiProvider, AiToken } from './types'

const isProvider = (value: unknown): value is AiProvider => value === 'gemini' || value === 'openai'

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const createTokenId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const normalizeDate = (value: unknown) => {
  const raw = normalizeText(value)
  if (!raw) return undefined
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed.toISOString()
}

const sanitizeToken = (token: Partial<AiToken>, fallbackProvider: AiProvider): AiToken | null => {
  const value = normalizeText(token.value)
  if (!value) return null

  return {
    id: normalizeText(token.id) || createTokenId(),
    provider: isProvider(token.provider) ? token.provider : fallbackProvider,
    value,
    createdAt: normalizeDate(token.createdAt) || new Date().toISOString(),
    lastUsedAt: normalizeDate(token.lastUsedAt),
    lastErrorAt: normalizeDate(token.lastErrorAt),
    lastError: normalizeText(token.lastError) || undefined,
  }
}

export const migrateAiConfigTokens = (config: AiConfig): AiToken[] => {
  const tokens: AiToken[] = []
  const seen = new Set<string>()
  const pushUnique = (token: AiToken) => {
    const key = `${token.provider}:${token.value}`
    if (seen.has(key)) return
    seen.add(key)
    tokens.push(token)
  }

  if (Array.isArray(config.tokens)) {
    config.tokens.forEach((token) => {
      const sanitized = sanitizeToken(token, config.provider)
      if (sanitized) {
        pushUnique(sanitized)
      }
    })
  }

  const legacyKey = normalizeText(config.apiKey)
  if (legacyKey) {
    pushUnique({
      id: createTokenId(),
      provider: config.provider,
      value: legacyKey,
      createdAt: new Date().toISOString(),
    })
  }

  return tokens
}

export const getProviderTokens = (config: AiConfig, provider: AiProvider = config.provider): AiToken[] => {
  if (!Array.isArray(config.tokens)) return []
  return config.tokens.filter((token) => token.provider === provider && normalizeText(token.value).length > 0)
}

export const hasProviderTokens = (config: AiConfig, provider: AiProvider = config.provider) =>
  getProviderTokens(config, provider).length > 0

export const getTokenSuffix = (tokenValue: string) => tokenValue.slice(-4)

export const maskToken = (tokenValue: string) => `••••${getTokenSuffix(tokenValue)}`
