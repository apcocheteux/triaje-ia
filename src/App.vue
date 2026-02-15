<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="brand-left">
        <img :src="ueHeaderLogo" alt="Universidad Europea" class="brand-mark-logo" />
      </div>

      <div class="brand-center">
        <img :src="appLogo" alt="Logo TRIAJE" class="brand-app-logo" />
        <div>
          <div class="brand-title">
            TR<span class="brand-title-accent">IA</span>JE
          </div>
          <div class="brand-subtitle">Asistente de triaje en urgencias</div>
        </div>
      </div>

      <nav class="nav">
        <RouterLink to="/" class="nav-link">Inicio</RouterLink>
        <RouterLink to="/cola" class="nav-link">Cola</RouterLink>
        <RouterLink to="/paciente/nuevo" class="nav-link">Nuevo</RouterLink>
        <RouterLink to="/exportacion" class="nav-link">Exportación</RouterLink>
        <RouterLink to="/configuracion" class="nav-link">Configuración</RouterLink>
        <RouterLink to="/fuentes" class="nav-link">Fuentes</RouterLink>
      </nav>
    </header>

    <main class="app-main">
      <RouterView />
    </main>

    <footer class="app-footer">
      <span>Uso académico. No sustituye el juicio clínico ni protocolos del centro.</span>
      <span class="app-footer-ai-status" :class="footerAiStatus.className">{{ footerAiStatus.label }}</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import ueHeaderLogo from './assets/ue-logo-new.svg'
import appLogo from './assets/logo-app.png'
import { useAppStore } from './application/store'
import { getProviderTokens } from './domain/aiTokens'

const store = useAppStore()

const footerAiStatus = computed(() => {
  if (!store.config.enabled) {
    return { className: 'ai-off', label: 'IA: desactivada' }
  }

  const tokenCount = getProviderTokens(store.config, store.config.provider).length
  if (!tokenCount) {
    return { className: 'ai-warning', label: 'IA: activa sin tokens para el proveedor actual' }
  }

  const latestAiAttempt = store.patients
    .filter((patient) => patient.result?.aiAttempted && patient.result?.triageAt)
    .sort((first, second) => {
      const firstTime = new Date(first.result?.triageAt || 0).getTime()
      const secondTime = new Date(second.result?.triageAt || 0).getTime()
      return secondTime - firstTime
    })[0]

  if (!latestAiAttempt?.result) {
    return { className: 'ai-warning', label: `IA: activa (${tokenCount} token${tokenCount > 1 ? 's' : ''}, pendiente de primera ejecución)` }
  }

  if (latestAiAttempt.result.aiPending) {
    return { className: 'ai-warning', label: 'IA: procesando último triaje...' }
  }

  if (latestAiAttempt.result.ai) {
    return { className: 'ai-ok', label: 'IA: operativa (último triaje OK)' }
  }

  if (latestAiAttempt.result.aiError) {
    return { className: 'ai-error', label: 'IA: error en último triaje (ver resultado)' }
  }

  return { className: 'ai-warning', label: 'IA: activa (resultado IA pendiente de sincronización)' }
})
</script>
