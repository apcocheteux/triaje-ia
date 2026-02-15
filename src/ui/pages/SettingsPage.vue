<template>
  <div class="page">
    <div>
      <h1 class="page-title">Configuración</h1>
      <p class="page-subtitle">Configura la IA opcional y la gestión de datos locales.</p>
    </div>

    <div class="card">
      <h2 class="card-title">IA opcional (Gemini + OpenAI)</h2>
      <label class="input checkbox-row">
        <input type="checkbox" v-model="config.enabled" />
        <span>Activar IA para redacción (opcional)</span>
      </label>

      <div class="grid grid-2" style="margin-top: 12px;">
        <label class="input">Proveedor
          <select v-model="config.provider">
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI</option>
          </select>
        </label>
        <label class="input">Modelo
          <input v-model="config.model" type="text" placeholder="gemini-2.5-flash / gpt-4o-mini" />
        </label>
      </div>

      <div class="section-divider"></div>
      <h3 class="card-title" style="margin-bottom: 6px;">Tokens API para {{ providerName(config.provider) }}</h3>
      <p class="page-subtitle">
        Puedes registrar varios tokens. Si hay error 429 se prueba automáticamente el siguiente token en orden.
      </p>

      <div class="token-add-row">
        <label class="input token-add-input">
          Nuevo token
          <input
            v-model="newToken"
            type="password"
            placeholder="Pega tu token"
            autocomplete="off"
            @keydown.enter.prevent="handleAddToken"
          />
        </label>
        <button type="button" class="button" @click="handleAddToken">Añadir token</button>
      </div>

      <div v-if="tokenInputError" class="notice critical" style="margin-top: 10px;">
        {{ tokenInputError }}
      </div>

      <div v-if="activeProviderTokens.length" class="token-list">
        <div v-for="token in activeProviderTokens" :key="token.id" class="token-item">
          <div class="token-item-head">
            <strong>Token {{ maskToken(token.value) }}</strong>
          </div>
          <div class="token-item-meta">
            <span>{{ formatLastUsed(token.lastUsedAt) }}</span>
            <span>{{ formatLastError(token.lastErrorAt, token.lastError) }}</span>
          </div>
          <button type="button" class="button ghost token-remove-button" @click="removeToken(token.id)">Eliminar</button>
        </div>
      </div>
      <div v-else class="notice" style="margin-top: 10px;">
        No hay tokens configurados para {{ providerName(config.provider) }}.
      </div>

      <div class="notice" style="margin-top: 12px;">
        Los tokens se guardan en tu navegador (localStorage). No se envían a ningún backend propio.
      </div>
      <div style="display: flex; gap: 12px; margin-top: 16px;">
        <button class="button" @click="handleSave">Guardar configuración</button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Datos locales</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="button" @click="store.importDemoPatients">Importar casos demo</button>
        <button class="button secondary" @click="store.clearAll">Borrar todos los datos</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useAppStore } from '../../application/store'
import { maskToken } from '../../domain/aiTokens'
import type { AiConfig, AiProvider, AiToken } from '../../domain/types'

const store = useAppStore()

const cloneConfig = (): AiConfig => ({
  ...store.config,
  tokens: store.config.tokens.map((token) => ({ ...token })),
})

const config = reactive<AiConfig>(cloneConfig())
const newToken = ref('')
const tokenInputError = ref('')

const activeProviderTokens = computed(() => config.tokens.filter((token) => token.provider === config.provider))

const createTokenId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

const providerName = (provider: AiProvider) => (provider === 'gemini' ? 'Google Gemini' : 'OpenAI')

const formatDate = (value?: string) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('es-ES')
}

const formatLastUsed = (value?: string) => {
  const formatted = formatDate(value)
  return formatted ? `Último uso: ${formatted}` : 'Último uso: sin ejecuciones'
}

const formatLastError = (dateValue?: string, message?: string) => {
  const date = formatDate(dateValue)
  if (!date) return 'Último error: sin errores'
  return `Último error: ${date}${message ? ` · ${message}` : ''}`
}

const handleAddToken = () => {
  tokenInputError.value = ''
  const value = newToken.value.trim()
  if (!value) {
    tokenInputError.value = 'Introduce un token válido.'
    return
  }

  const duplicated = config.tokens.some((token) => token.provider === config.provider && token.value === value)
  if (duplicated) {
    tokenInputError.value = 'Ese token ya existe para este proveedor.'
    return
  }

  const token: AiToken = {
    id: createTokenId(),
    provider: config.provider,
    value,
    createdAt: new Date().toISOString(),
  }
  config.tokens.unshift(token)
  newToken.value = ''
}

const removeToken = (tokenId: string) => {
  config.tokens = config.tokens.filter((token) => token.id !== tokenId)
}

const handleSave = () => {
  store.updateConfig({
    ...config,
    apiKey: '',
    tokens: config.tokens.map((token) => ({ ...token })),
  })
}
</script>
