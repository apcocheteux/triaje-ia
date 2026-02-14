import type { Patient, TriageAssessment } from '../../domain/types'
import { resolveGlasgowScore } from '../../domain/glasgow'

export const buildPrompt = (assessment: TriageAssessment, patient: Patient) => {
  const gcs = resolveGlasgowScore(assessment)
  const gcsDetalle = assessment.glasgow
    ? `O${assessment.glasgow.ocular ?? 'ND'} V${assessment.glasgow.verbal ?? 'ND'} M${assessment.glasgow.motor ?? 'ND'}`
    : 'ND'

  return `Actúa como un asistente de TRIAJE para enfermería en Urgencias. Tu función es proponer una PRIORIDAD ORIENTATIVA y generar documentación de triaje de forma estructurada, basándote SOLO en los datos aportados.

Reglas:
- Si faltan datos clave, NO inventes: indícalos en “Datos faltantes”.
- No des indicaciones médicas (tratamientos farmacológicos). Limítate a ACTUACIONES ENFERMERAS iniciales habituales y seguras.
- Incluye una SOSPECHA CLÍNICA orientativa (pre-diagnóstico diferencial corto), sin afirmar diagnósticos definitivos.
- Prioridad: usa una escala 1–5 (1 = inmediata/critica, 2 = muy urgente, 3 = urgente, 4 = menos urgente, 5 = no urgente).
- En actuaciones de enfermería, prioriza por tiempo y operatividad (0-5 min, 5-15 min, 15-30 min).
- Añade recomendaciones de monitorización y criterios de escalada clínicos claros.
- Sé breve, claro y operativo.

Salida obligatoria:
1) Devuelve un JSON válido (sin markdown) con el siguiente esquema exacto:
{
  "resumen_clinico": "",
  "sospecha_clinica": [""],
  "prioridad_sugerida": 1,
  "motivo_prioridad": "",
  "red_flags_presentes": [""],
  "red_flags_ausentes": [""],
  "actuaciones_enfermeras": [""],
  "actuaciones_priorizadas": [""],
  "objetivos_monitorizacion": [""],
  "criterios_escalada": [""],
  "preguntas_clave": [""],
  "datos_faltantes": [""],
  "evolutivo_triaje": ""
}
2) Después del JSON, añade una línea en blanco y un bloque de texto titulado "EVOLUTIVO" con el texto clínico listo para pegar.

Datos del paciente:
- Edad: ${patient.demographics.edad} años
- Sexo: ${patient.demographics.sexo || 'no especificado'}
- Peso: ${patient.demographics.pesoKg ?? 'ND'} kg
- Antecedentes: ${patient.clinical.antecedentes || 'ND'}
- Alergias: ${patient.clinical.alergias || 'ND'}
- Medicación: ${patient.clinical.medicacion || 'ND'}
- Embarazo: ${patient.clinical.embarazo || 'ND'} ${patient.clinical.semanasEmbarazo ? `(${patient.clinical.semanasEmbarazo} semanas)` : ''}
- Vacunación: ${patient.clinical.vacunacion || 'ND'}
- Riesgos sociales: ${patient.clinical.riesgosSociales || 'ND'}

Datos de triaje:
- Motivo consulta: ${assessment.motivoConsulta || 'ND'}
- Categoría clínica: ${assessment.categoriaClinica}
- Síntomas: ${assessment.sintomas.length ? assessment.sintomas.join(', ') : 'ND'}
- Signos de alarma declarados: ${assessment.redFlags.length ? assessment.redFlags.join(', ') : 'ND'}
- Constantes: FC ${assessment.constantes.hr ?? 'ND'}, FR ${assessment.constantes.rr ?? 'ND'}, TA ${assessment.constantes.sbp ?? 'ND'}/${assessment.constantes.dbp ?? 'ND'}, SatO2 ${assessment.constantes.spo2 ?? 'ND'}, Temp ${assessment.constantes.temp ?? 'ND'}, GCS ${gcs ?? 'ND'} (${gcsDetalle}), Glucemia ${assessment.constantes.glucose ?? 'ND'}
- Dolor EVA (1-10): ${assessment.dolor}/10
- Observaciones: ${assessment.observaciones || 'ND'}
- Sospecha infecciosa: ${assessment.sospechaInfecciosa ? 'sí' : 'no'}
`
}
