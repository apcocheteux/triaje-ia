import { jsPDF } from 'jspdf'
import type { Patient, TriageResult } from '../../domain/types'
import { downloadBlob } from './utils'

const disclaimer =
  'Uso académico. No sustituye protocolos oficiales ni el juicio clínico.\nLa prioridad es orientativa y debe validarse según el centro.'

export const exportPatientPdf = (patient: Patient, result: TriageResult) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const margin = 40
  let y = margin
  const aiClinicalSuspicion = result.ai?.json?.sospecha_clinica?.map((item) => item.trim()).filter(Boolean) ?? []
  const aiPriorityJustification = result.ai?.json?.motivo_prioridad?.trim()

  doc.setFontSize(18)
  doc.text('TRIAJE - Informe de Triaje', margin, y)
  y += 24

  doc.setFontSize(11)
  doc.text(`Fecha: ${new Date().toLocaleString('es-ES')}`, margin, y)
  y += 18

  const lines = [
    `Paciente: ${patient.demographics.nombre || ''} ${patient.demographics.apellidos || ''}`.trim() || 'Paciente sin nombre',
    `Edad: ${patient.demographics.edad} años | Sexo: ${patient.demographics.sexo || 'ND'} | Peso: ${patient.demographics.pesoKg ?? 'ND'} kg`,
    `Motivo: ${patient.assessment?.motivoConsulta || 'ND'}`,
    `Categoría: ${patient.assessment?.categoriaClinica || 'ND'}`,
    `Dolor EVA: ${patient.assessment?.dolor !== undefined ? `${patient.assessment.dolor}/10` : 'ND'}`,
    `Prioridad orientativa: ${result.priority} - ${result.reason}`,
    ...(aiPriorityJustification ? [`Justificación de prioridad (IA): ${aiPriorityJustification}`] : []),
    ...(aiClinicalSuspicion.length ? [`Sospecha clínica orientativa (IA): ${aiClinicalSuspicion.join('; ')}`] : []),
    `Signos de alarma presentes: ${result.redFlagsPresent.join('; ')}`,
    `Actuaciones enfermeras: ${result.actions.join('; ')}`,
    `Datos faltantes: ${result.missingData.length ? result.missingData.join('; ') : 'Ninguno'}`,
  ]

  lines.forEach((line) => {
    doc.text(line, margin, y)
    y += 16
  })

  y += 10
  doc.setFontSize(11)
  const evolutivoLines = doc.splitTextToSize(result.evolutivo, 520)
  doc.text('Evolutivo:', margin, y)
  y += 16
  doc.text(evolutivoLines, margin, y)
  y += evolutivoLines.length * 14 + 12

  doc.setFontSize(9)
  const disclaimerLines = doc.splitTextToSize(disclaimer, 520)
  doc.text(disclaimerLines, margin, 760)

  const blob = doc.output('blob')
  downloadBlob(blob, `triaje-${patient.id}.pdf`)
}
