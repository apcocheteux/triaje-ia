import { afterEach, describe, expect, it, vi } from 'vitest'
import { extractAiTokenEvents, generateAiPriority } from '../src/adapters/ai'
import { geminiAdapter } from '../src/adapters/ai/gemini'
import type { AiConfig, Patient, TriageAssessment } from '../src/domain/types'

const buildAssessment = (): TriageAssessment => ({
  motivoConsulta: 'Dolor torácico',
  categoriaClinica: 'cardiovascular',
  sintomas: ['Dolor torácico'],
  redFlags: ['dolor_toracico_sca'],
  constantes: {
    hr: 112,
    rr: 24,
    sbp: 145,
    dbp: 90,
    spo2: 94,
    temp: 36.7,
    gcs: 15,
  },
  glasgow: { ocular: 4, verbal: 5, motor: 6 },
  dolor: 8,
  observaciones: '',
  sospechaInfecciosa: false,
})

const buildPatient = (): Patient => ({
  id: 'patient-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  status: 'en_triaje',
  demographics: {
    nombre: 'Carlos',
    apellidos: 'Demo',
    sexo: 'M',
    edad: 58,
  },
  clinical: {
    embarazo: 'no',
  },
  assessment: undefined,
  result: undefined,
  followUps: [],
})

const buildConfig = (): AiConfig => ({
  enabled: true,
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  apiKey: '',
  tokens: [
    {
      id: 'token-a',
      provider: 'gemini',
      value: 'token-AAAA',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'token-b',
      provider: 'gemini',
      value: 'token-BBBB',
      createdAt: new Date().toISOString(),
    },
  ],
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('token fallback IA', () => {
  it('usa el siguiente token cuando el primero devuelve 429', async () => {
    const spy = vi
      .spyOn(geminiAdapter, 'generatePriority')
      .mockRejectedValueOnce(Object.assign(new Error('Gemini error 429'), { status: 429 }))
      .mockResolvedValueOnce({
        prioridad_sugerida: 3,
        motivo_prioridad: 'Prioridad orientativa ajustada.',
        rawText: '{"prioridad_sugerida":3}',
      })

    const response = await generateAiPriority(buildAssessment(), buildPatient(), buildConfig())

    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy.mock.calls[0]?.[2]?.apiKey).toBe('token-AAAA')
    expect(spy.mock.calls[1]?.[2]?.apiKey).toBe('token-BBBB')
    expect(response.tokenSuffix).toBe('BBBB')
    expect(response.tokenEvents?.length).toBe(2)
    expect(response.tokenEvents?.[0]?.statusCode).toBe(429)
    expect(response.tokenEvents?.[0]?.errorAt).toBeTruthy()
    expect(response.tokenEvents?.[1]?.usedAt).toBeTruthy()
  })

  it('no rota token cuando el error no es 429', async () => {
    vi.spyOn(geminiAdapter, 'generatePriority').mockRejectedValueOnce(
      Object.assign(new Error('Gemini error 401'), { status: 401 })
    )

    await expect(generateAiPriority(buildAssessment(), buildPatient(), buildConfig())).rejects.toThrow('401')
  })

  it('expone eventos de token cuando todos fallan', async () => {
    vi.spyOn(geminiAdapter, 'generatePriority')
      .mockRejectedValueOnce(Object.assign(new Error('Gemini error 429'), { status: 429 }))
      .mockRejectedValueOnce(Object.assign(new Error('Gemini error 429'), { status: 429 }))

    try {
      await generateAiPriority(buildAssessment(), buildPatient(), buildConfig())
      throw new Error('Expected rejection')
    } catch (error) {
      const events = extractAiTokenEvents(error)
      expect(events.length).toBe(2)
      expect(events.every((event) => event.statusCode === 429)).toBe(true)
    }
  })
})
