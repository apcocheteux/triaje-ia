<template>
  <div class="page">
    <div>
      <h1 class="page-title">Exportación</h1>
      <p class="page-subtitle">Descarga informes por paciente o la lista completa.</p>
    </div>

    <div class="card">
      <h2 class="card-title">Exportar lista completa</h2>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <button class="button" @click="exportAdapter.exportListCsv(store.patients)">Descargar CSV</button>
        <button class="button secondary" @click="exportAdapter.exportListJson(store.patients)">Descargar JSON</button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Exportación por paciente</h2>
      <div v-if="!store.patients.length" class="page-subtitle">No hay pacientes disponibles.</div>
      <div v-else class="list">
        <div v-for="patient in store.patients" :key="patient.id" class="card" style="box-shadow: none;">
          <strong>{{ patient.demographics.nombre || 'Paciente' }} {{ patient.demographics.apellidos || '' }}</strong>
          <div class="tag-list">
            <span class="badge">{{ patient.demographics.edad }} años</span>
            <span class="badge">{{ patient.assessment?.categoriaClinica || 'ND' }}</span>
            <PriorityPill v-if="patient.result" :priority="patient.result.priority" />
          </div>
          <div style="display: flex; gap: 12px; margin-top: 10px; flex-wrap: wrap;">
            <button class="button" :disabled="!patient.result" @click="exportPdf(patient)">PDF</button>
            <button class="button secondary" @click="exportAdapter.exportPatientJson(patient)">JSON</button>
          </div>
        </div>
      </div>
    </div>

    <div class="notice">Recuerda incluir el PDF en el póster interactivo o en la entrega final.</div>
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '../../application/store'
import { exportAdapter } from '../../adapters/export'
import PriorityPill from '../components/PriorityPill.vue'
import type { Patient } from '../../domain/types'

const store = useAppStore()

const exportPdf = (patient: Patient) => {
  if (!patient.result) return
  exportAdapter.exportPatientPdf(patient, patient.result)
}
</script>
