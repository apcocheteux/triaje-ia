<template>
  <div v-if="!patient" class="page">
    <div class="card">
      <p class="page-subtitle">Paciente no encontrado.</p>
      <RouterLink to="/cola" class="button">Volver a cola</RouterLink>
    </div>
  </div>

  <div v-else class="page">
    <div>
      <h1 class="page-title">Seguimiento</h1>
      <p class="page-subtitle">Actualiza evolución y re-triage si es necesario.</p>
    </div>

    <div class="card">
      <h2 class="card-title">Nueva anotación</h2>
      <div class="quick-vitals-grid">
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">❤️</span> FC (lpm)</span>
          <input v-model.number="form.constantes.hr" type="number" min="0" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🫁</span> FR (rpm)</span>
          <input v-model.number="form.constantes.rr" type="number" min="0" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🩸</span> SatO2 (%)</span>
          <input v-model.number="form.constantes.spo2" type="number" min="0" max="100" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">⬆️</span> TA Sistólica (mmHg)</span>
          <input v-model.number="form.constantes.sbp" type="number" min="0" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🌡️</span> Temperatura (°C)</span>
          <input v-model.number="form.constantes.temp" type="number" min="30" max="45" step="0.1" inputmode="decimal" />
        </label>
      </div>

      <div class="section-divider"></div>
      <h3 class="card-title">Glasgow automático</h3>
      <div class="grid grid-3">
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">👀</span> Ocular (1-4)</span>
          <input v-model.number="form.glasgow.ocular" type="number" min="1" max="4" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🗣️</span> Verbal (1-5)</span>
          <input v-model.number="form.glasgow.verbal" type="number" min="1" max="5" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">💪</span> Motora (1-6)</span>
          <input v-model.number="form.glasgow.motor" type="number" min="1" max="6" inputmode="numeric" />
        </label>
      </div>
      <div class="notice" style="margin-top: 12px;">
        Glasgow calculado: <strong>{{ followUpGlasgow ?? 'ND' }}</strong> / 15 (O{{ form.glasgow.ocular ?? '-' }} V{{ form.glasgow.verbal ?? '-' }} M{{ form.glasgow.motor ?? '-' }}).
      </div>

      <label class="input" style="margin-top: 12px;">Nota de seguimiento
        <textarea v-model="form.note" placeholder="Descripción breve"></textarea>
      </label>

      <label class="input input-inline">
        <input type="checkbox" v-model="form.reTriage" />
        <span>Recalcular prioridad con estas constantes</span>
      </label>

      <div style="display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap;">
        <button class="button" @click="handleAdd">Guardar seguimiento</button>
        <RouterLink :to="`/paciente/${patient.id}/resultado`" class="button secondary">Ver resultado</RouterLink>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Historial</h2>
      <div v-if="!patient.followUps.length" class="page-subtitle">Sin registros de seguimiento.</div>
      <div v-else class="list">
        <div v-for="event in patient.followUps" :key="event.id" class="card" style="box-shadow: none;">
          <strong>{{ formatDate(event.createdAt) }}</strong>
          <p class="page-subtitle">{{ event.note }}</p>
          <div v-if="event.reTriage" class="tag-list">
            <PriorityPill :priority="event.reTriage.priority" />
            <span class="badge">{{ event.reTriage.reason }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAppStore } from '../../application/store'
import type { FollowUpEvent, GlasgowAssessment, Patient, VitalSigns } from '../../domain/types'
import { computeTriage } from '../../domain/triageEngine'
import { calculateGlasgowScore } from '../../domain/glasgow'
import PriorityPill from '../components/PriorityPill.vue'

const route = useRoute()
const store = useAppStore()
const id = route.params.id as string

const patient = computed(() => store.patientById(id) as Patient | undefined)

const form = reactive<{ constantes: VitalSigns; glasgow: GlasgowAssessment; note: string; reTriage: boolean }>({
  constantes: {},
  glasgow: {},
  note: '',
  reTriage: false,
})

const followUpGlasgow = computed(() => calculateGlasgowScore(form.glasgow))

const handleAdd = () => {
  if (!patient.value) return

  const constantesWithGcs = { ...form.constantes }
  if (followUpGlasgow.value !== undefined) {
    constantesWithGcs.gcs = followUpGlasgow.value
  }

  const event: FollowUpEvent = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    note: form.note || 'Sin observaciones',
    constantes: constantesWithGcs,
  }

  if (form.reTriage && patient.value.assessment) {
    const updatedAssessment = {
      ...patient.value.assessment,
      constantes: {
        ...patient.value.assessment.constantes,
        ...constantesWithGcs,
      },
      glasgow: {
        ...patient.value.assessment.glasgow,
        ...form.glasgow,
      },
    }
    event.reTriage = computeTriage(updatedAssessment, patient.value)
    event.reTriage.triageAt = new Date().toISOString()
    patient.value.assessment = updatedAssessment
    patient.value.result = event.reTriage
  }

  const updated: Patient = {
    ...patient.value,
    followUps: [event, ...patient.value.followUps],
    updatedAt: new Date().toISOString(),
  }

  store.updatePatient(updated)
  form.note = ''
  form.constantes = {}
  form.glasgow = {}
  form.reTriage = false
}

const formatDate = (value: string) => new Date(value).toLocaleString('es-ES')
</script>
