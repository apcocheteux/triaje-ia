import type { Patient } from '../../domain/types'
import { downloadBlob } from './utils'

const escapeCsv = (value: string | number | undefined) => {
  if (value === undefined) return ''
  const text = String(value)
  if (text.includes(',') || text.includes('\n') || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export const exportListCsv = (patients: Patient[]) => {
  const headers = [
    'id',
    'nombre',
    'apellidos',
    'edad',
    'sexo',
    'estado',
    'categoria',
    'prioridad',
    'motivo',
    'fecha',
  ]

  const rows = patients.map((patient) => {
    const result = patient.result
    return [
      patient.id,
      patient.demographics.nombre || '',
      patient.demographics.apellidos || '',
      patient.demographics.edad,
      patient.demographics.sexo,
      patient.status,
      patient.assessment?.categoriaClinica || '',
      result?.priority ?? '',
      patient.assessment?.motivoConsulta || '',
      patient.createdAt,
    ].map(escapeCsv)
  })

  const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, 'lista-pacientes.csv')
}
