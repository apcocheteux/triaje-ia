import { aiTriageSchema } from './schema'
import type { AiTriageResponse } from '../../domain/types'

const normalizeClinicalQuestion = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  let core = trimmed.replace(/^[¿?]+/, '').replace(/[?]+$/, '').trim()
  core = core.replace(/[.!;,:\s]+$/, '').trim()
  if (!core) return ''

  return `¿${core}?`
}

const extractFirstJsonObject = (text: string) => {
  const start = text.indexOf('{')
  if (start === -1) return ''

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(start, index + 1)
      }
    }
  }

  return ''
}

const extractJson = (text: string) => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1]
  return extractFirstJsonObject(text)
}

export const parseAiResponse = (text: string): AiTriageResponse => {
  const jsonText = extractJson(text)
  if (!jsonText) {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180)
    throw new Error(`No se encontró JSON en la respuesta. Muestra recibida: "${preview || 'vacía'}"`)
  }
  const parsed = JSON.parse(jsonText)
  const json = aiTriageSchema.parse(parsed)
  json.preguntas_clave = json.preguntas_clave.map(normalizeClinicalQuestion).filter(Boolean)
  return { json, rawText: text }
}
