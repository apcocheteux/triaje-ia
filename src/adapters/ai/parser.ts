import { aiTriageSchema } from './schema'
import type { AiTriageResponse } from '../../domain/types'

const extractJson = (text: string) => {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i)
  if (fenced?.[1]) return fenced[1]
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1)
  }
  return ''
}

export const parseAiResponse = (text: string): AiTriageResponse => {
  const jsonText = extractJson(text)
  if (!jsonText) {
    throw new Error('No se encontró JSON en la respuesta')
  }
  const parsed = JSON.parse(jsonText)
  const json = aiTriageSchema.parse(parsed)
  return { json, rawText: text }
}
