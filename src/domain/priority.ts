import type { Priority } from './types'

export type PriorityInfo = {
  level: Priority
  label: string
  waitLabel: string
  maxWaitMinutes: number
}

export const priorityInfos: Record<Priority, PriorityInfo> = {
  1: { level: 1, label: 'Reanimación', waitLabel: 'Atención inmediata', maxWaitMinutes: 0 },
  2: { level: 2, label: 'Emergencia', waitLabel: '10-15 minutos', maxWaitMinutes: 15 },
  3: { level: 3, label: 'Urgencia', waitLabel: '60 minutos', maxWaitMinutes: 60 },
  4: { level: 4, label: 'Prioritario', waitLabel: '2 horas', maxWaitMinutes: 120 },
  5: { level: 5, label: 'No urgente', waitLabel: '4 horas', maxWaitMinutes: 240 },
}

export const priorityScaleOrder: Priority[] = [5, 4, 3, 2, 1]

export const getPriorityInfo = (priority: Priority) => priorityInfos[priority]

type RemainingAttention = {
  label: string
  statusClass: 'remaining-ok' | 'remaining-warning' | 'remaining-overdue' | 'remaining-immediate' | 'remaining-unknown'
}

const formatDuration = (minutes: number) => {
  if (minutes <= 0) return '0 min'
  const hours = Math.floor(minutes / 60)
  const restMinutes = minutes % 60
  if (hours === 0) return `${restMinutes} min`
  if (restMinutes === 0) return `${hours} h`
  return `${hours} h ${restMinutes} min`
}

export const getRemainingAttention = (priority: Priority, triageAt?: string, nowMs = Date.now()): RemainingAttention => {
  const info = getPriorityInfo(priority)

  if (priority === 1) {
    return {
      label: 'Atención inmediata',
      statusClass: 'remaining-immediate',
    }
  }

  if (!triageAt) {
    return {
      label: 'No disponible (sin hora de triaje)',
      statusClass: 'remaining-unknown',
    }
  }

  const triageMs = new Date(triageAt).getTime()
  if (Number.isNaN(triageMs)) {
    return {
      label: 'No disponible (hora de triaje inválida)',
      statusClass: 'remaining-unknown',
    }
  }

  const elapsedMinutes = Math.floor((nowMs - triageMs) / 60000)
  const remainingMinutes = info.maxWaitMinutes - elapsedMinutes

  if (remainingMinutes < 0) {
    return {
      label: `Superado hace ${formatDuration(Math.abs(remainingMinutes))}`,
      statusClass: 'remaining-overdue',
    }
  }

  if (remainingMinutes <= 15) {
    return {
      label: `Restan ${formatDuration(remainingMinutes)}`,
      statusClass: 'remaining-warning',
    }
  }

  return {
    label: `Restan ${formatDuration(remainingMinutes)}`,
    statusClass: 'remaining-ok',
  }
}
