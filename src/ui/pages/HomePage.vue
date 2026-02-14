<template>
  <div class="page">
    <div class="hero">
      <div>
        <div class="hero-title-row">
          <img :src="appLogo" alt="Logo TRIAJE" class="hero-title-logo" />
          <h1 class="page-title">TR<span class="brand-title-accent">IA</span>JE: triaje rápido, claro y basado en protocolos</h1>
        </div>
        <p class="page-subtitle">
          Herramienta académica para priorizar pacientes, documentar el evolutivo y sugerir actuaciones enfermeras
          iniciales de forma segura.
        </p>
        <div class="tag-list" style="margin-top: 16px;">
          <span class="tag">SET orientativo</span>
          <span class="tag">Pediatría &lt; 14 años</span>
          <span class="tag">IA opcional</span>
          <span class="tag">Sin backend</span>
        </div>
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 20px;">
          <RouterLink to="/paciente/nuevo" class="button">Nuevo paciente</RouterLink>
          <RouterLink to="/cola" class="button secondary">Ver cola</RouterLink>
          <button class="button ghost" @click="handleLoadDemo">
            {{ store.patients.length ? 'Importar casos demo' : 'Cargar casos demo' }}
          </button>
        </div>
      </div>
      <div class="hero-panel">
        <h2 class="card-title">Aviso importante</h2>
        <p class="page-subtitle">
          Uso académico y de apoyo. No sustituye protocolos oficiales ni el juicio clínico. La prioridad es
          orientativa y debe validarse en el contexto del centro.
        </p>
        <div class="section-divider"></div>
        <div class="list">
          <div class="badge">JSON + texto en IA para consistencia</div>
          <div class="badge">Evolutivo listo para pegar</div>
          <div class="badge">Exportación PDF/CSV/JSON</div>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Flujo recomendado</h2>
      <div class="grid grid-3">
        <div>
          <h3 class="card-title">1. Alta</h3>
          <p class="page-subtitle">Recoge datos completos y antecedentes.</p>
        </div>
        <div>
          <h3 class="card-title">2. Triaje</h3>
          <p class="page-subtitle">Introduce constantes, síntomas y signos de alarma.</p>
        </div>
        <div>
          <h3 class="card-title">3. Resultado</h3>
          <p class="page-subtitle">Prioridad, actuaciones y evolutivo listos para exportar.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useAppStore } from '../../application/store'
import appLogo from '../../assets/logo-app.png'

const store = useAppStore()

const handleLoadDemo = () => {
  if (store.patients.length) {
    store.importDemoPatients()
    return
  }
  store.loadDemo()
}
</script>
