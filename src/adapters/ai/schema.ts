import { z } from 'zod'

export const aiTriageSchema = z.object({
  resumen_clinico: z.string().min(1),
  sospecha_clinica: z.array(z.string()).default([]),
  prioridad_sugerida: z.number().min(1).max(5),
  motivo_prioridad: z.string().min(1),
  red_flags_presentes: z.array(z.string()),
  red_flags_ausentes: z.array(z.string()),
  actuaciones_enfermeras: z.array(z.string()),
  actuaciones_priorizadas: z.array(z.string()).default([]),
  objetivos_monitorizacion: z.array(z.string()).default([]),
  criterios_escalada: z.array(z.string()).default([]),
  preguntas_clave: z.array(z.string()).default([]),
  datos_faltantes: z.array(z.string()),
  evolutivo_triaje: z.string().min(1),
})

export type AiTriageSchema = z.infer<typeof aiTriageSchema>
