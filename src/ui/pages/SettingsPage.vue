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
          <input v-model="config.model" type="text" placeholder="gemini-1.5-flash / gpt-4o-mini" />
        </label>
        <label class="input">API Key
          <input v-model="config.apiKey" type="password" placeholder="Pega tu API key" />
        </label>
      </div>
      <div class="notice" style="margin-top: 12px;">
        La API key se guarda en tu navegador (localStorage). No se envía a ningún backend propio.
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
import { reactive } from 'vue'
import { useAppStore } from '../../application/store'
import type { AiConfig } from '../../domain/types'

const store = useAppStore()
const config = reactive<AiConfig>({ ...store.config })

const handleSave = () => {
  store.updateConfig({ ...config })
}
</script>
