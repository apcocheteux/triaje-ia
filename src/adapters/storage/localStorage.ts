import type { AppState } from '../../domain/types'
import type { StoragePort } from '../../ports/StoragePort'

export const STORAGE_KEY = 'triaje-ia:v1'

export const localStorageAdapter: StoragePort = {
  load() {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AppState
    } catch {
      return null
    }
  },
  save(state: AppState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  },
  clear() {
    localStorage.removeItem(STORAGE_KEY)
  },
}
