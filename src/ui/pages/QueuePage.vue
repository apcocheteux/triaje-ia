<template>
  <div class="page">
    <div>
      <h1 class="page-title">Cola de pacientes</h1>
      <p class="page-subtitle">Gestión del flujo: triaje, seguimiento y alta.</p>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px;">
        <RouterLink to="/paciente/nuevo" class="button">Nuevo paciente</RouterLink>
        <button class="button secondary" @click="store.importDemoPatients">Importar casos demo</button>
      </div>
    </div>

    <div class="card" v-if="!patients.length">
      <p class="page-subtitle">No hay pacientes todavía. Crea uno nuevo o carga casos demo.</p>
      <div style="display: flex; gap: 12px; margin-top: 12px;">
        <button class="button secondary" @click="store.loadDemo">Cargar casos demo</button>
      </div>
    </div>

    <div class="card" v-else>
      <table class="table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Edad</th>
            <th>Categoría</th>
            <th>Prioridad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="patient in patients" :key="patient.id">
            <td>
              <RouterLink :to="patientRoute(patient)" class="patient-link">
                {{ patient.demographics.nombre || 'Paciente' }} {{ patient.demographics.apellidos || '' }}
              </RouterLink>
              <div v-if="patientClinicalBadges(patient).length" class="patient-meta-row">
                <span v-for="badge in patientClinicalBadges(patient)" :key="badge" class="badge meta-badge">{{ badge }}</span>
              </div>
            </td>
            <td>{{ patient.demographics.edad }} años</td>
            <td>{{ areaLabel(patient.assessment?.categoriaClinica) }}</td>
            <td>
              <PriorityPill v-if="patient.result" :priority="patient.result.priority" />
              <span v-else class="badge">Sin triaje</span>
            </td>
            <td>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <RouterLink :to="`/paciente/${patient.id}/editar`" class="button secondary">Editar</RouterLink>
                <RouterLink :to="`/paciente/${patient.id}/triaje`" class="button">Triaje</RouterLink>
                <RouterLink v-if="patient.result" :to="`/paciente/${patient.id}/resultado`" class="button secondary">
                  Resultado
                </RouterLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAppStore } from '../../application/store'
import PriorityPill from '../components/PriorityPill.vue'
import type { Patient } from '../../domain/types'
import { clinicalAreas } from '../../domain/catalog'

const store = useAppStore()
const patients = computed(() => store.patients)
const areaLabel = (id?: string) => clinicalAreas.find((area) => area.id === id)?.label || 'ND'
const patientRoute = (patient: Patient) => (patient.result ? `/paciente/${patient.id}/resultado` : `/paciente/${patient.id}/triaje`)

const patientClinicalBadges = (patient: Patient) => {
  const badges: string[] = []

  if (patient.clinical.embarazo === 'si') {
    const weeks = patient.clinical.semanasEmbarazo
    badges.push(weeks ? `🤰 Embarazo ${weeks} sem` : '🤰 Embarazo')
  }

  const alergias = patient.clinical.alergias?.trim()
  if (alergias) {
    badges.push(`⚠️ Alergias: ${alergias}`)
  }

  return badges
}

</script>
