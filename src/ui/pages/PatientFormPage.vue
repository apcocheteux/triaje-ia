<template>
  <div class="page">
    <div>
      <h1 class="page-title">{{ isEdit ? 'Editar paciente' : 'Alta de nuevo paciente' }}</h1>
      <p class="page-subtitle">Recoge datos completos para una valoración precisa.</p>
    </div>

    <div class="card">
      <h2 class="card-title">Datos demográficos</h2>
      <div class="grid grid-3">
        <label class="input">Nombre
          <input v-model="form.demographics.nombre" type="text" placeholder="Nombre" />
        </label>
        <label class="input">Apellidos
          <input v-model="form.demographics.apellidos" type="text" placeholder="Apellidos" />
        </label>
        <label class="input">Sexo
          <select v-model="form.demographics.sexo">
            <option value="">No especificado</option>
            <option value="F">F</option>
            <option value="M">M</option>
            <option value="X">X</option>
          </select>
        </label>
        <label class="input">Edad (años)
          <input v-model.number="form.demographics.edad" type="number" min="0" />
        </label>
        <label class="input">Peso (kg)
          <input v-model.number="form.demographics.pesoKg" type="number" min="0" step="0.1" />
        </label>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Antecedentes y contexto</h2>
      <div class="grid grid-2">
        <label class="input">Antecedentes
          <textarea v-model="form.clinical.antecedentes" placeholder="HTA, DM2, etc."></textarea>
          <button type="button" class="text-shortcut" @click="setNoPresenta('antecedentes')">No presenta</button>
        </label>
        <label class="input">Alergias
          <textarea v-model="form.clinical.alergias" placeholder="Alergias conocidas"></textarea>
          <button type="button" class="text-shortcut" @click="setNoPresenta('alergias')">No presenta</button>
        </label>
        <label class="input">Medicación habitual
          <textarea v-model="form.clinical.medicacion" placeholder="Tratamiento crónico"></textarea>
          <button type="button" class="text-shortcut" @click="setNoPresenta('medicacion')">No presenta</button>
        </label>
        <label class="input">Vacunación
          <textarea v-model="form.clinical.vacunacion" placeholder="Calendario o estado vacunal"></textarea>
          <button type="button" class="text-shortcut" @click="setNoPresenta('vacunacion')">No presenta</button>
        </label>
        <label class="input">Riesgos sociales
          <textarea v-model="form.clinical.riesgosSociales" placeholder="Vive solo, dependencia, etc."></textarea>
          <button type="button" class="text-shortcut" @click="setNoPresenta('riesgosSociales')">No presenta</button>
        </label>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Embarazo</h2>
      <div class="grid grid-3">
        <div class="input">
          <span>Situación gestacional</span>
          <div class="pregnancy-toggle" role="radiogroup" aria-label="Situación de embarazo">
            <button
              v-for="option in pregnancyOptions"
              :key="option.value"
              type="button"
              class="pregnancy-option"
              :class="{ active: form.clinical.embarazo === option.value }"
              :aria-pressed="form.clinical.embarazo === option.value"
              @click="form.clinical.embarazo = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
        <label v-if="form.clinical.embarazo === 'si'" class="input">Semanas de gestación
          <input v-model.number="form.clinical.semanasEmbarazo" type="number" min="0" />
        </label>
      </div>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="button" @click="handleSave">Guardar</button>
      <RouterLink to="/cola" class="button secondary">Volver a cola</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAppStore, createEmptyPatient } from '../../application/store'
import { safeClone } from '../../application/safeClone'
import type { Patient } from '../../domain/types'

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const id = computed(() => route.params.id as string | undefined)
const existing = id.value ? store.patientById(id.value) : undefined

const form = reactive<Patient>(existing ? safeClone(existing) : createEmptyPatient())
const pregnancyOptions: { value: 'desconocido' | 'no' | 'si'; label: string }[] = [
  { value: 'desconocido', label: 'Desconocido' },
  { value: 'no', label: 'No' },
  { value: 'si', label: 'Sí' },
]
type ClinicalTextField = 'antecedentes' | 'alergias' | 'medicacion' | 'vacunacion' | 'riesgosSociales'

const isEdit = computed(() => Boolean(existing))

watch(
  () => form.clinical.embarazo,
  (value) => {
    if (value !== 'si') {
      form.clinical.semanasEmbarazo = undefined
    }
  },
  { immediate: true }
)

const setNoPresenta = (field: ClinicalTextField) => {
  form.clinical[field] = 'No presenta'
}

const handleSave = () => {
  const snapshot = safeClone(form)
  if (existing) {
    store.updatePatient(snapshot)
  } else {
    store.addPatient(snapshot)
  }
  router.push('/cola')
}
</script>
