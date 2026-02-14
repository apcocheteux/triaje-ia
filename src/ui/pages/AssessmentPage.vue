<template>
  <div v-if="!patient" class="page">
    <div class="card">
      <p class="page-subtitle">Paciente no encontrado.</p>
      <RouterLink to="/cola" class="button">Volver a cola</RouterLink>
    </div>
  </div>

  <div v-else class="page">
    <div>
      <h1 class="page-title">Evaluación de triaje</h1>
      <p class="page-subtitle">
        {{ patient.demographics.nombre || 'Paciente' }} {{ patient.demographics.apellidos || '' }} ·
        {{ patient.demographics.edad }} años
      </p>
    </div>

    <div class="card">
      <h2 class="card-title">Motivo y área clínica</h2>
      <label class="input">
        <span class="label-row"><span class="field-icon">📝</span> Motivo de consulta</span>
        <textarea v-model="form.motivoConsulta" placeholder="Motivo principal de consulta"></textarea>
      </label>

      <div class="section-divider"></div>
      <h3 class="card-title">Área clínica</h3>
      <div class="area-grid" role="radiogroup" aria-label="Área clínica">
        <button
          v-for="area in clinicalAreas"
          :key="area.id"
          type="button"
          class="area-tile"
          :class="{ active: form.categoriaClinica === area.id }"
          @click="form.categoriaClinica = area.id"
        >
          <span class="area-icon">{{ areaIcons[area.id] }}</span>
          <span class="area-name">{{ area.label }}</span>
          <span class="area-desc">{{ area.description }}</span>
        </button>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Síntomas y signos de alarma</h2>
      <div class="grid grid-2">
        <div>
          <h3 class="card-title">Síntomas principales</h3>
          <div class="symptom-summary">
            <span class="badge">Seleccionados: {{ form.sintomas.length }}</span>
            <span class="badge symptom-area-chip">
              {{ areaIcons[form.categoriaClinica] }} {{ areaLabel(form.categoriaClinica) }}
            </span>
            <button v-if="form.sintomas.length" type="button" class="button ghost selection-clear" @click="clearSymptoms">
              Limpiar
            </button>
          </div>
          <div class="symptom-grid">
            <button
              v-for="symptom in symptomOptions[form.categoriaClinica]"
              :key="symptom"
              type="button"
              class="symptom-tile"
              :class="{ active: form.sintomas.includes(symptom) }"
              :aria-pressed="form.sintomas.includes(symptom)"
              @click="toggleSelection(form.sintomas, symptom)"
            >
              <span class="symptom-tile-head">{{ areaIcons[form.categoriaClinica] }} Síntoma</span>
              <span class="symptom-tile-label">{{ symptom }}</span>
              <span class="symptom-tile-check">{{ form.sintomas.includes(symptom) ? '✓' : '+' }}</span>
            </button>
          </div>
        </div>

        <div>
          <h3 class="card-title">Signos de alarma</h3>
          <div class="red-flag-summary">
            <span class="badge">Seleccionados: {{ form.redFlags.length }}</span>
            <span
              v-for="level in redFlagLevels"
              :key="`flag-level-${level}`"
              class="badge red-flag-level-chip"
              :class="`red-level-${level}`"
            >
              {{ redFlagLevelMeta[level].icon }} {{ redFlagLevelMeta[level].label }}: {{ redFlagSelectedByLevel[level] }}
            </span>
            <button v-if="form.redFlags.length" type="button" class="button ghost selection-clear" @click="clearRedFlags">
              Limpiar
            </button>
          </div>
          <div class="red-flag-grid">
            <button
              v-for="flag in redFlagCatalog"
              :key="flag.id"
              type="button"
              class="red-flag-tile"
              :class="[`red-level-${flag.level}`, { active: form.redFlags.includes(flag.id) }]"
              :aria-pressed="form.redFlags.includes(flag.id)"
              @click="toggleSelection(form.redFlags, flag.id)"
            >
              <span class="red-flag-tile-head">
                <span>{{ redFlagLevelMeta[flag.level].icon }}</span>
                <span>{{ redFlagLevelMeta[flag.level].label }}</span>
              </span>
              <span class="red-flag-tile-label">{{ flag.label }}</span>
              <span class="red-flag-tile-check">{{ form.redFlags.includes(flag.id) ? '✓' : '+' }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>
      <label class="input input-inline">
        <input type="checkbox" v-model="form.sospechaInfecciosa" />
        <span class="label-row"><span class="field-icon">🦠</span> Sospecha infecciosa / aislamiento</span>
      </label>
    </div>

    <div class="card">
      <h2 class="card-title">Constantes rápidas</h2>
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
          <span class="label-row"><span class="field-icon">⬇️</span> TA Diastólica (mmHg)</span>
          <input v-model.number="form.constantes.dbp" type="number" min="0" inputmode="numeric" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🌡️</span> Temperatura (°C)</span>
          <input v-model.number="form.constantes.temp" type="number" min="30" max="45" step="0.1" inputmode="decimal" />
        </label>
        <label class="input quick-field">
          <span class="label-row"><span class="field-icon">🍬</span> Glucemia capilar</span>
          <input v-model.number="form.constantes.glucose" type="number" min="0" inputmode="numeric" />
        </label>
        <label class="input quick-field quick-field-wide">
          <span class="label-row"><span class="field-icon">😣</span> Dolor EVA (1-10)</span>
          <div class="eva-scale">
            <button
              v-for="level in evaLevels"
              :key="`eva-${level}`"
              type="button"
              class="eva-button"
              :class="{ active: form.dolor === level }"
              @click="form.dolor = level"
            >
              {{ level }}
            </button>
          </div>
        </label>
      </div>
    </div>

    <div class="card">
      <div class="glasgow-head">
        <div>
          <h2 class="card-title">Escala de Glasgow (automática)</h2>
          <p class="page-subtitle">Selecciona la mejor respuesta ocular, verbal y motora.</p>
        </div>
        <div class="glasgow-score-panel" :class="glasgowVisual.className">
          <div class="glasgow-score-value">{{ glasgowScore ?? '--' }}<small>/15</small></div>
          <div class="glasgow-score-label">{{ glasgowVisual.label }}</div>
          <div class="glasgow-score-breakdown">
            O{{ form.glasgow.ocular ?? '-' }} · V{{ form.glasgow.verbal ?? '-' }} · M{{ form.glasgow.motor ?? '-' }}
          </div>
        </div>
      </div>

      <div class="glasgow-grid">
        <div class="glasgow-column">
          <h3 class="card-title">👀 Ocular</h3>
          <label v-for="option in glasgowOcularOptions" :key="`ocular-${option.value}`" class="glasgow-option" :class="{ active: form.glasgow.ocular === option.value }">
            <input v-model.number="form.glasgow.ocular" type="radio" name="glasgow-ocular" :value="option.value" />
            <span>{{ option.value }} · {{ option.shortLabel }}</span>
          </label>
        </div>

        <div class="glasgow-column">
          <h3 class="card-title">🗣️ Verbal</h3>
          <label v-for="option in glasgowVerbalOptions" :key="`verbal-${option.value}`" class="glasgow-option" :class="{ active: form.glasgow.verbal === option.value }">
            <input v-model.number="form.glasgow.verbal" type="radio" name="glasgow-verbal" :value="option.value" />
            <span>{{ option.value }} · {{ option.shortLabel }}</span>
          </label>
        </div>

        <div class="glasgow-column">
          <h3 class="card-title">💪 Motora</h3>
          <label v-for="option in glasgowMotorOptions" :key="`motor-${option.value}`" class="glasgow-option" :class="{ active: form.glasgow.motor === option.value }">
            <input v-model.number="form.glasgow.motor" type="radio" name="glasgow-motor" :value="option.value" />
            <span>{{ option.value }} · {{ option.shortLabel }}</span>
          </label>
        </div>
      </div>
    </div>

    <div class="card">
      <h2 class="card-title">Observaciones</h2>
      <label class="input">
        <span class="label-row"><span class="field-icon">📌</span> Nota clínica</span>
        <textarea v-model="form.observaciones" placeholder="Observaciones relevantes"></textarea>
      </label>
    </div>

    <div v-if="missingData.length" class="notice">
      Faltan datos clave: {{ missingData.join(', ') }}.
    </div>

    <div v-if="store.config.enabled && !store.config.apiKey" class="notice">
      La IA está activada pero falta la API key en Configuración. Se usará solo el motor determinista.
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="button" :disabled="loading" @click="handleTriage">
        {{ loading ? 'Procesando...' : 'Calcular triaje' }}
      </button>
      <RouterLink :to="`/paciente/${patient.id}/editar`" class="button secondary">Editar datos</RouterLink>
      <RouterLink to="/cola" class="button ghost">Volver a cola</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAppStore } from '../../application/store'
import { safeClone } from '../../application/safeClone'
import type { AiConfig, ClinicalArea, Patient, Priority, TriageAssessment } from '../../domain/types'
import { clinicalAreas, symptomOptions, redFlagCatalog } from '../../domain/catalog'
import { buildReadableEvolutivo, computeMissingData, computeTriage } from '../../domain/triageEngine'
import {
  calculateGlasgowScore,
  getGlasgowVisualState,
  glasgowMotorOptions,
  glasgowOcularOptions,
  glasgowVerbalOptions,
} from '../../domain/glasgow'
import { generateAiTriage } from '../../adapters/ai'

type TriageAssessmentForm = Omit<TriageAssessment, 'glasgow'> & {
  glasgow: NonNullable<TriageAssessment['glasgow']>
}

const route = useRoute()
const router = useRouter()
const store = useAppStore()

const areaIcons: Record<ClinicalArea, string> = {
  respiratorio: '🫁',
  cardiovascular: '❤️',
  neurologico: '🧠',
  trauma: '🩹',
  abdominal: '🫃',
  infeccioso: '🦠',
  toxicos: '☣️',
  urologico: '🟡',
  gineco: '🤰',
  oftalmologico: '👁️',
  otorrino: '👂',
  dermatologico: '🧴',
  endocrino: '🧪',
  psiquiatrico: '🧭',
  pediatrico: '🧸',
  otros: '🩺',
}

const id = route.params.id as string
const patient = computed(() => store.patientById(id) as Patient | undefined)
const evaLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const redFlagLevels = [1, 2, 3] as const
type RedFlagLevel = (typeof redFlagLevels)[number]

const redFlagLevelMeta: Record<RedFlagLevel, { icon: string; label: string }> = {
  1: { icon: '🔴', label: 'Crítico' },
  2: { icon: '🟠', label: 'Emergente' },
  3: { icon: '🟡', label: 'Alarma' },
}

const normalizeEva = (value: number | undefined) => {
  const normalized = Number.isFinite(value) ? Math.round(value as number) : 1
  return Math.min(10, Math.max(1, normalized))
}

const defaultAssessment = (age: number): TriageAssessmentForm => ({
  motivoConsulta: '',
  categoriaClinica: age < 14 ? 'pediatrico' : 'respiratorio',
  sintomas: [],
  redFlags: [],
  constantes: {},
  glasgow: {},
  dolor: 1,
  observaciones: '',
  sospechaInfecciosa: false,
})

const normalizeAssessment = (assessment: TriageAssessment): TriageAssessmentForm => ({
  ...assessment,
  sintomas: [...assessment.sintomas],
  redFlags: [...assessment.redFlags],
  constantes: { ...assessment.constantes },
  glasgow: { ...assessment.glasgow },
  dolor: normalizeEva(assessment.dolor),
})

const initialAssessment = patient.value?.assessment
  ? normalizeAssessment(safeClone(patient.value.assessment))
  : defaultAssessment(patient.value?.demographics.edad ?? 18)

const form = reactive<TriageAssessmentForm>(initialAssessment)

const toggleSelection = (list: string[], value: string) => {
  const index = list.indexOf(value)
  if (index === -1) {
    list.push(value)
    return
  }
  list.splice(index, 1)
}

const areaLabel = (id: ClinicalArea) => clinicalAreas.find((area) => area.id === id)?.label || 'Área clínica'

const clearSymptoms = () => {
  form.sintomas = []
}

const clearRedFlags = () => {
  form.redFlags = []
}

const redFlagSelectedByLevel = computed<Record<RedFlagLevel, number>>(() => {
  const counters: Record<RedFlagLevel, number> = { 1: 0, 2: 0, 3: 0 }
  const selectedFlags = new Set(form.redFlags)
  redFlagCatalog.forEach((flag) => {
    if (selectedFlags.has(flag.id)) {
      counters[flag.level] += 1
    }
  })
  return counters
})

const glasgowScore = computed(() => calculateGlasgowScore(form.glasgow))
const glasgowVisual = computed(() => getGlasgowVisualState(glasgowScore.value))

watch(
  glasgowScore,
  (score) => {
    form.constantes.gcs = score
  },
  { immediate: true }
)

const missingData = computed(() => computeMissingData(form))

const loading = ref(false)
const toPriority = (value: number | undefined): Priority | undefined =>
  value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : undefined

const runAiInBackground = async ({
  patientId,
  triageAt,
  assessmentSnapshot,
  patientSnapshot,
  configSnapshot,
}: {
  patientId: string
  triageAt: string
  assessmentSnapshot: TriageAssessment
  patientSnapshot: Patient
  configSnapshot: AiConfig
}) => {
  const startedAt = Date.now()

  try {
    const ai = await generateAiTriage(assessmentSnapshot, patientSnapshot, configSnapshot)
    const currentPatient = store.patientById(patientId)
    if (!currentPatient?.result || currentPatient.result.triageAt !== triageAt) {
      return
    }

    const updatedResult = safeClone(currentPatient.result)
    updatedResult.ai = ai
    updatedResult.aiError = undefined
    updatedResult.aiLatencyMs = Date.now() - startedAt
    updatedResult.aiPending = false

    const suggestedPriority = toPriority(ai.json?.prioridad_sugerida)
    if (suggestedPriority && suggestedPriority !== updatedResult.priority) {
      updatedResult.deterministicPriority = updatedResult.priority
      updatedResult.deterministicReason = updatedResult.reason
      updatedResult.priority = suggestedPriority
      updatedResult.priorityModifiedByAi = true
      const aiReason = ai.json.motivo_prioridad?.trim()
      if (aiReason) {
        updatedResult.reason = aiReason
      }
    }

    const latestAssessment = currentPatient.assessment ? safeClone(currentPatient.assessment) : assessmentSnapshot
    updatedResult.evolutivo = buildReadableEvolutivo(currentPatient, latestAssessment, updatedResult)
    store.setResult(patientId, updatedResult)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al usar IA'
    const currentPatient = store.patientById(patientId)
    if (!currentPatient?.result || currentPatient.result.triageAt !== triageAt) {
      return
    }

    const failedResult = safeClone(currentPatient.result)
    failedResult.aiError = message
    failedResult.aiLatencyMs = Date.now() - startedAt
    failedResult.aiPending = false
    store.setResult(patientId, failedResult)
    console.error('[IA] Error generando triaje', error)
  }
}

const handleTriage = async () => {
  if (!patient.value) return
  loading.value = true

  try {
    const patientSnapshot = safeClone(patient.value)
    const assessmentSnapshot = safeClone(form)
    const configSnapshot = { ...store.config }
    const result = computeTriage(assessmentSnapshot, patientSnapshot)
    const triageAt = new Date().toISOString()
    result.triageAt = triageAt
    const hasApiKey = Boolean(store.config.apiKey.trim())
    const shouldUseAi = store.config.enabled && hasApiKey
    result.aiAttempted = shouldUseAi
    result.aiProvider = shouldUseAi ? store.config.provider : undefined
    result.aiModel = shouldUseAi ? store.config.model : undefined
    result.aiPending = shouldUseAi

    if (store.config.enabled && !hasApiKey) {
      result.aiError = 'IA activada sin API key en Configuración.'
      result.aiPending = false
    }

    result.evolutivo = buildReadableEvolutivo(patientSnapshot, assessmentSnapshot, result)
    store.setAssessment(patientSnapshot.id, assessmentSnapshot, result)
    if (shouldUseAi) {
      void runAiInBackground({
        patientId: patientSnapshot.id,
        triageAt,
        assessmentSnapshot,
        patientSnapshot,
        configSnapshot,
      })
    }

    await router.push(`/paciente/${patient.value.id}/resultado`)
  } finally {
    loading.value = false
  }
}
</script>
