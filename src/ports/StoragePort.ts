import type { AppState } from '../domain/types'

export interface StoragePort {
  load(): AppState | null
  save(state: AppState): void
  clear(): void
}
