import { toRaw } from 'vue'

export const safeClone = <T>(value: T): T => {
  const rawValue = toRaw(value)

  try {
    return structuredClone(rawValue) as T
  } catch {
    return JSON.parse(JSON.stringify(rawValue)) as T
  }
}
