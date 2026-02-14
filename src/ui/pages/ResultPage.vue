<template>
  <div v-if="!patient || !result" class="page">
    <div class="card">
      <p class="page-subtitle">No hay resultado de triaje disponible.</p>
      <RouterLink to="/cola" class="button">Volver a cola</RouterLink>
    </div>
  </div>

  <div v-else class="page">
    <div>
      <h1 class="page-title">Resultado de triaje</h1>
      <p class="page-subtitle">Paciente {{ patient.demographics.nombre || 'sin nombre' }} · {{ patient.demographics.edad }} años</p>
      <div v-if="patientClinicalBadges.length" class="patient-meta-row" style="margin-top: 8px;">
        <span v-for="badge in patientClinicalBadges" :key="badge" class="badge meta-badge">{{ badge }}</span>
      </div>
    </div>

    <div class="metrics-grid">
      <div class="card priority-output-card" :class="`priority-tone-${result.priority}`">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <h2 class="card-title" style="margin: 0;">Prioridad de triaje</h2>
          <span class="badge">SET orientativo</span>
        </div>
        <div class="priority-output-value">P{{ result.priority }}</div>
        <div class="priority-output-name">{{ priorityInfo?.label }}</div>
        <div v-if="result.priorityModifiedByAi && result.deterministicPriority" class="priority-output-original">
          Modificado por IA · SET original P{{ result.deterministicPriority }} ({{ deterministicPriorityInfo?.label }})
        </div>
        <div class="priority-output-justification-head">
          Justificación de prioridad
          <span v-if="hasAiPriorityJustification" class="ia-indicator">✨ IA</span>
        </div>
        <div class="priority-output-reason">{{ priorityJustification }}</div>
        <div class="priority-output-time">Dolor EVA actual: {{ assessment?.dolor ?? 'ND' }}/10</div>
        <div class="priority-output-time">
          Tiempo máximo recomendado (orientativo): {{ priorityInfo?.waitLabel }}
        </div>
        <div class="priority-output-time">
          Hora de triaje: {{ triageDateLabel }}
        </div>
        <div class="priority-output-remaining" :class="remainingAttention.statusClass">
          Tiempo restante total: {{ remainingAttention.label }}
        </div>
        <div v-if="aiPriorityNote" class="priority-ai-note">{{ aiPriorityNote }}</div>

        <div class="priority-scale">
          <div
            v-for="item in priorityScale"
            :key="item.level"
            class="priority-scale-step"
            :class="[`priority-${item.level}`, { active: result.priority === item.level }]"
          >
            <span class="priority-step-head">P{{ item.level }}</span>
            <span class="priority-step-label">{{ item.label }}</span>
            <span class="priority-step-wait">{{ item.waitLabel }}</span>
            <span v-if="result.priority === item.level" class="priority-scale-arrow">▲</span>
          </div>
        </div>
      </div>

      <div class="card gcs-output-card" :class="glasgowVisual.className">
        <div>
          <h2 class="card-title" style="margin-bottom: 4px;">Escala de Glasgow</h2>
          <p class="page-subtitle">Valor calculado automáticamente con la respuesta ocular, verbal y motora.</p>
        </div>
        <div class="gcs-output-value">{{ glasgowScore ?? 'ND' }}<small>/15</small></div>
        <div class="gcs-output-meta">
          {{ glasgowVisual.label }}
          <span v-if="assessment?.glasgow">
            · O{{ assessment?.glasgow?.ocular ?? '-' }} V{{ assessment?.glasgow?.verbal ?? '-' }} M{{ assessment?.glasgow?.motor ?? '-' }}
          </span>
        </div>
      </div>
    </div>

    <div class="grid grid-2">
      <div class="card">
        <h2 class="card-title">
          Resumen clínico
          <span v-if="aiJson" class="ia-indicator">✨ IA</span>
        </h2>
        <p class="page-subtitle">
          {{ aiJson?.resumen_clinico || fallbackSummary }}
        </p>

        <div class="section-divider"></div>
        <h3 class="card-title">
          Sospecha clínica orientativa
          <span v-if="hasAiClinicalSuspicion" class="ia-indicator">✨ IA</span>
        </h3>
        <p class="page-subtitle">Prediagnóstico orientativo para guiar la valoración de medicina y enfermería.</p>
        <div class="list" style="margin-top: 10px;">
          <div v-for="item in clinicalSuspicion" :key="`suspicion-${item}`" class="badge">
            {{ item }}
          </div>
        </div>

        <div class="section-divider"></div>
        <h3 class="card-title">Signos de alarma detectados</h3>
        <div class="list">
          <div v-for="flag in aiJson?.red_flags_presentes || result.redFlagsPresent" :key="flag" class="badge">
            {{ flag }}
          </div>
        </div>

        <details v-if="(aiJson?.red_flags_ausentes || result.redFlagsAbsent).length" class="watch-accordion">
          <summary>Vigilancia clínica: revalorar si aparece alguno de estos signos de alarma</summary>
          <div class="list" style="margin-top: 10px;">
            <div v-for="flag in aiJson?.red_flags_ausentes || result.redFlagsAbsent" :key="flag" class="badge">
              {{ flag }}
            </div>
          </div>
        </details>
      </div>

      <div class="card">
        <h2 class="card-title">Actuaciones enfermeras</h2>
        <div class="list">
          <div v-for="action in result.actions" :key="action" class="badge">{{ action }}</div>
        </div>

        <div v-if="aiJson" class="section-divider"></div>
        <div v-if="aiJson" class="ia-block">
          <h3 class="card-title">Plan ampliado por IA <span class="ia-indicator">✨ IA</span></h3>

          <div v-if="(aiJson.actuaciones_enfermeras || []).length" class="ia-list-block">
            <h4>Actuaciones recomendadas</h4>
            <div class="list">
              <div v-for="action in aiJson.actuaciones_enfermeras" :key="`ai-action-${action}`" class="badge">{{ action }}</div>
            </div>
          </div>

          <div v-if="aiActuacionesPriorizadas.length" class="ia-list-block">
            <h4>Priorización temporal (IA)</h4>
            <div class="list">
              <div v-for="item in aiActuacionesPriorizadas" :key="`ai-priority-${item}`" class="badge">{{ item }}</div>
            </div>
          </div>

          <div v-if="aiObjetivosMonitorizacion.length" class="ia-list-block">
            <h4>Monitorización sugerida (IA)</h4>
            <div class="list">
              <div v-for="item in aiObjetivosMonitorizacion" :key="`ai-monitor-${item}`" class="badge">{{ item }}</div>
            </div>
          </div>

          <div v-if="aiCriteriosEscalada.length" class="ia-list-block">
            <h4>Criterios de escalada (IA)</h4>
            <div class="list">
              <div v-for="item in aiCriteriosEscalada" :key="`ai-escalation-${item}`" class="badge">{{ item }}</div>
            </div>
          </div>

          <div v-if="aiPreguntasClave.length" class="ia-list-block">
            <h4>Preguntas clínicas sugeridas (IA)</h4>
            <div class="list">
              <div v-for="item in aiPreguntasClave" :key="`ai-question-${item}`" class="badge">{{ item }}</div>
            </div>
          </div>
        </div>

        <div class="section-divider"></div>
        <h3 class="card-title">Datos faltantes</h3>
        <div class="list">
          <div v-for="item in aiJson?.datos_faltantes || result.missingData" :key="item" class="badge">
            {{ item }}
          </div>
          <div v-if="!(aiJson?.datos_faltantes?.length || result.missingData.length)" class="badge">No faltan datos clave.</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <h2 class="card-title" style="margin: 0;">
          Evolutivo de triaje
          <span v-if="result.ai" class="ia-indicator">✨ IA</span>
        </h2>
        <button type="button" class="button secondary" @click="handleCopyEvolutivo">Copiar evolutivo</button>
      </div>
      <pre style="white-space: pre-wrap; font-family: 'IBM Plex Sans', sans-serif;">{{ result.evolutivo }}</pre>
      <div v-if="copyStatus === 'success'" class="notice success" style="margin-top: 10px;">
        Evolutivo copiado al portapapeles.
      </div>
      <div v-else-if="copyStatus === 'error'" class="notice critical" style="margin-top: 10px;">
        No se pudo copiar automáticamente. Revisa permisos del navegador.
      </div>
      <details v-if="result.ai" style="margin-top: 12px;">
        <summary>Texto completo de la IA (JSON + evolutivo)</summary>
        <pre style="white-space: pre-wrap; font-family: 'IBM Plex Sans', sans-serif;">{{ result.ai.rawText }}</pre>
      </details>
      <div class="notice" style="margin-top: 12px;">
        Uso académico. Prioridad orientativa y dependiente de protocolo local.
      </div>
      <div class="notice" :class="aiExecutionSummary.className" style="margin-top: 10px;">
        {{ aiExecutionSummary.label }}
      </div>
    </div>

    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <button class="button" @click="handleExportPdf">Descargar PDF</button>
      <button class="button secondary" @click="handleExportJson">Descargar JSON</button>
      <RouterLink :to="`/paciente/${patient.id}/triaje`" class="button ghost">Editar triaje</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAppStore } from '../../application/store'
import { exportAdapter } from '../../adapters/export'
import { getGlasgowVisualState, resolveGlasgowScore } from '../../domain/glasgow'
import { getPriorityInfo, getRemainingAttention, priorityScaleOrder } from '../../domain/priority'
import type { ClinicalArea, Priority } from '../../domain/types'

const route = useRoute()
const store = useAppStore()

const id = route.params.id as string
const patient = computed(() => store.patientById(id))
const assessment = computed(() => patient.value?.assessment)
const result = computed(() => patient.value?.result)
const aiJson = computed(() => result.value?.ai?.json)
const aiActuacionesPriorizadas = computed(() => aiJson.value?.actuaciones_priorizadas ?? [])
const aiObjetivosMonitorizacion = computed(() => aiJson.value?.objetivos_monitorizacion ?? [])
const aiCriteriosEscalada = computed(() => aiJson.value?.criterios_escalada ?? [])
const aiPreguntasClave = computed(() => aiJson.value?.preguntas_clave ?? [])
const aiPriorityJustification = computed(() => aiJson.value?.motivo_prioridad?.trim() ?? '')
const hasAiPriorityJustification = computed(() => Boolean(aiPriorityJustification.value))
const aiSuggestedPriority = computed(() => {
  const value = aiJson.value?.prioridad_sugerida
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5 ? value : undefined
})
const aiClinicalSuspicion = computed(() =>
  Array.from(new Set((aiJson.value?.sospecha_clinica ?? []).map((item) => item.trim()).filter(Boolean)))
)
const hasAiClinicalSuspicion = computed(() => aiClinicalSuspicion.value.length > 0)
const priorityJustification = computed(() => aiPriorityJustification.value || result.value?.reason || 'Sin datos para justificar prioridad.')
const deterministicPriorityInfo = computed(() => {
  const originalPriority = result.value?.deterministicPriority
  if (!originalPriority) return undefined
  return getPriorityInfo(originalPriority)
})
const aiPriorityNote = computed(() => {
  if (!aiSuggestedPriority.value) return ''
  if (result.value?.priorityModifiedByAi) {
    return `✨ IA ajustó la prioridad final a P${aiSuggestedPriority.value}`
  }
  return `✨ IA sugiere prioridad ${aiSuggestedPriority.value}`
})
const aiExecutionSummary = computed(() => {
  if (result.value?.ai) {
    const provider = result.value.aiProvider || store.config.provider
    const model = result.value.aiModel || store.config.model
    const latency = result.value.aiLatencyMs ? ` · ${result.value.aiLatencyMs} ms` : ''
    return {
      className: 'success',
      label: `IA aplicada correctamente (${provider}/${model}${latency}).`,
    }
  }

  if (result.value?.aiAttempted) {
    return {
      className: 'critical',
      label: `IA no disponible en este triaje: ${result.value.aiError || 'error no especificado.'}`,
    }
  }

  if (store.config.enabled && !store.config.apiKey.trim()) {
    return {
      className: '',
      label: 'IA activada en configuración, pero falta API key.',
    }
  }

  if (store.config.enabled) {
    return {
      className: '',
      label: 'IA activada, pendiente de ejecución en este triaje.',
    }
  }

  return {
    className: '',
    label: 'IA desactivada. Resultado generado con motor determinista.',
  }
})
const nowMs = ref(Date.now())
const copyStatus = ref<'idle' | 'success' | 'error'>('idle')

const clinicalSuspicionByArea: Record<ClinicalArea, string> = {
  respiratorio: 'Proceso respiratorio agudo (infección, broncoespasmo o insuficiencia respiratoria).',
  cardiovascular: 'Posible causa cardiovascular aguda; descartar síndrome coronario.',
  neurologico: 'Posible evento neurológico agudo; descartar ictus u otra lesión focal.',
  trauma: 'Traumatismo agudo con lesión potencialmente significativa.',
  abdominal: 'Abdomen agudo de probable origen digestivo o inflamatorio.',
  infeccioso: 'Infección activa con posible repercusión sistémica.',
  toxicos: 'Intoxicación o exposición aguda a tóxicos en estudio.',
  urologico: 'Proceso urológico agudo (cólico renal, infección o retención).',
  gineco: 'Proceso gineco-obstétrico agudo en valoración.',
  oftalmologico: 'Urgencia oftalmológica aguda en valoración.',
  otorrino: 'Proceso otorrinolaringológico agudo en estudio.',
  dermatologico: 'Proceso dermatológico/alérgico agudo en valoración.',
  endocrino: 'Descompensación metabólica o endocrina aguda posible.',
  psiquiatrico: 'Crisis conductual o psiquiátrica aguda en valoración.',
  pediatrico: 'Patología aguda pediátrica pendiente de filiación.',
  otros: 'Cuadro clínico agudo no clasificado; requiere valoración médica.',
}

let timer: number | undefined
let copyFeedbackTimer: number | undefined
onMounted(() => {
  timer = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 30000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
})

const priorityScale = priorityScaleOrder.map((level) => ({
  level,
  label: getPriorityInfo(level).label,
  waitLabel: getPriorityInfo(level).waitLabel,
}))

const priorityInfo = computed(() => {
  if (!result.value) return undefined
  return getPriorityInfo(result.value.priority as Priority)
})

const remainingAttention = computed(() => {
  if (!result.value) {
    return {
      label: 'No disponible',
      statusClass: 'remaining-unknown' as const,
    }
  }
  return getRemainingAttention(result.value.priority as Priority, result.value.triageAt, nowMs.value)
})

const triageDateLabel = computed(() => {
  const triageAt = result.value?.triageAt
  if (!triageAt) return 'No disponible'
  return new Date(triageAt).toLocaleString('es-ES')
})

const glasgowScore = computed(() => {
  if (!assessment.value) return undefined
  return resolveGlasgowScore(assessment.value)
})

const glasgowVisual = computed(() => getGlasgowVisualState(glasgowScore.value))

const patientClinicalBadges = computed(() => {
  if (!patient.value) return []
  const badges: string[] = []

  if (patient.value.clinical.embarazo === 'si') {
    const weeks = patient.value.clinical.semanasEmbarazo
    badges.push(weeks ? `🤰 Embarazo ${weeks} sem` : '🤰 Embarazo')
  }

  const alergias = patient.value.clinical.alergias?.trim()
  if (alergias) {
    badges.push(`⚠️ Alergias: ${alergias}`)
  }

  return badges
})

const fallbackClinicalSuspicion = computed(() => {
  if (!assessment.value || !result.value) {
    return ['Sin datos suficientes para sugerir sospecha clínica orientativa.']
  }

  const suggestions = new Set<string>([clinicalSuspicionByArea[assessment.value.categoriaClinica]])
  const motivo = assessment.value.motivoConsulta.toLowerCase()
  const flagsText = result.value.redFlagsPresent.join(' ').toLowerCase()

  if (assessment.value.sospechaInfecciosa || flagsText.includes('sepsis')) {
    suggestions.add('Posible infección grave en evaluación (descartar sepsis).')
  }
  if (flagsText.includes('dolor torácico') || motivo.includes('torác')) {
    suggestions.add('Descartar síndrome coronario agudo.')
  }
  if (flagsText.includes('neurol') || flagsText.includes('ictus') || motivo.includes('déficit') || motivo.includes('ictus')) {
    suggestions.add('Descartar evento neurológico agudo.')
  }
  if (flagsText.includes('hemorragia') || motivo.includes('sangrado')) {
    suggestions.add('Valorar hemorragia clínicamente significativa.')
  }
  if (assessment.value.dolor >= 8) {
    suggestions.add('Dolor EVA alto con posible proceso agudo subyacente.')
  }
  if (result.value.priority <= 2) {
    suggestions.add('Situación potencialmente tiempo-dependiente: priorizar valoración médica inmediata.')
  }

  return Array.from(suggestions).slice(0, 4)
})

const clinicalSuspicion = computed(() => (aiClinicalSuspicion.value.length ? aiClinicalSuspicion.value : fallbackClinicalSuspicion.value))

const fallbackSummary = computed(() => {
  if (!patient.value || !assessment.value || !result.value) {
    return 'Resumen no disponible. Usa el evolutivo determinista.'
  }
  return `Motivo: ${assessment.value.motivoConsulta || 'ND'}. Categoría: ${assessment.value.categoriaClinica}. Dolor EVA: ${assessment.value.dolor}/10. Prioridad: ${result.value.priority}.`
})

const handleExportPdf = () => {
  if (patient.value && result.value) {
    exportAdapter.exportPatientPdf(patient.value, result.value)
  }
}

const handleExportJson = () => {
  if (patient.value) {
    exportAdapter.exportPatientJson(patient.value)
  }
}

const fallbackCopyText = (text: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!copied) {
    throw new Error('No se pudo copiar usando fallback')
  }
}

const handleCopyEvolutivo = async () => {
  const text = result.value?.evolutivo?.trim()
  if (!text) return

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      fallbackCopyText(text)
    }
    copyStatus.value = 'success'
  } catch (error) {
    console.error('[Clipboard] Error copiando evolutivo', error)
    copyStatus.value = 'error'
  }

  if (copyFeedbackTimer) {
    clearTimeout(copyFeedbackTimer)
  }
  copyFeedbackTimer = window.setTimeout(() => {
    copyStatus.value = 'idle'
  }, 2500)
}
</script>
