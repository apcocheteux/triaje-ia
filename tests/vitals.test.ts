import { describe, expect, it } from 'vitest'
import { evaluateVitals, getAgeBand } from '../src/domain/vitals'

describe('vitals pediatric thresholds', () => {
  it('clasifica correctamente las bandas de edad', () => {
    expect(getAgeBand(0)).toBe('recien_nacido')
    expect(getAgeBand(0.2)).toBe('lactante')
    expect(getAgeBand(2)).toBe('nino_pequeno')
    expect(getAgeBand(4)).toBe('preescolar')
    expect(getAgeBand(10)).toBe('escolar')
    expect(getAgeBand(15)).toBe('adolescente')
    expect(getAgeBand(25)).toBe('adulto')
  })

  it('no marca alertas en un nino pequeno dentro de rango normal', () => {
    const evaluation = evaluateVitals(
      {
        hr: 110,
        rr: 28,
        sbp: 95,
        spo2: 98,
        temp: 37,
      },
      2
    )

    expect(evaluation.severity).toBe(5)
    expect(evaluation.flags).toEqual([])
  })

  it('marca SatO2 baja en pediatria cuando cae por debajo de 95%', () => {
    const evaluation = evaluateVitals(
      {
        hr: 100,
        rr: 24,
        sbp: 100,
        spo2: 94,
        temp: 37,
      },
      6
    )

    expect(evaluation.severity).toBeLessThanOrEqual(3)
    expect(evaluation.flags).toContain('SatO2 baja')
  })
})
