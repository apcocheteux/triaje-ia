import type { ClinicalArea } from './types'

export const clinicalAreas: { id: ClinicalArea; label: string; description: string }[] = [
  { id: 'respiratorio', label: 'Respiratorio', description: 'Disnea, tos, hipoxemia, asma, EPOC.' },
  { id: 'cardiovascular', label: 'Cardiovascular', description: 'Dolor torácico, palpitaciones, síncope.' },
  { id: 'neurologico', label: 'Neurológico', description: 'Déficit focal, cefalea, convulsión.' },
  { id: 'trauma', label: 'Trauma', description: 'Politrauma, heridas, caídas.' },
  { id: 'abdominal', label: 'Abdominal/Digestivo', description: 'Dolor abdominal, vómitos, diarrea.' },
  { id: 'infeccioso', label: 'Infeccioso/Sepsis', description: 'Fiebre, foco infeccioso, sepsis.' },
  { id: 'toxicos', label: 'Tóxicos/Intoxicación', description: 'Ingesta, exposición, intoxicaciones.' },
  { id: 'urologico', label: 'Urológico', description: 'Dolor cólico, hematuria, retención.' },
  { id: 'gineco', label: 'Gineco-Obstétrico', description: 'Dolor pélvico, sangrado, embarazo.' },
  { id: 'oftalmologico', label: 'Oftalmológico', description: 'Visión borrosa, dolor ocular.' },
  { id: 'otorrino', label: 'Otorrino', description: 'Epistaxis, odinofagia, vértigo.' },
  { id: 'dermatologico', label: 'Dermatológico/Alérgico', description: 'Urticaria, erupciones, edema.' },
  { id: 'endocrino', label: 'Endocrino/Metabólico', description: 'Hipoglucemia, cetoacidosis.' },
  { id: 'psiquiatrico', label: 'Psiquiátrico/Agitación', description: 'Riesgo autolesivo, agitación.' },
  { id: 'pediatrico', label: 'Pediátrico', description: 'Consulta infantil general.' },
  { id: 'otros', label: 'Otros/No clasificado', description: 'Situaciones no incluidas.' },
]

export const symptomOptions: Record<ClinicalArea, string[]> = {
  respiratorio: ['Disnea', 'Tos', 'Sibilancias', 'Dolor torácico pleurítico', 'Expectoración', 'Fiebre'],
  cardiovascular: ['Dolor torácico', 'Palpitaciones', 'Síncope', 'Disnea', 'Edema'],
  neurologico: ['Cefalea intensa', 'Déficit focal', 'Convulsión', 'Alteración conciencia', 'Vértigo'],
  trauma: ['Caída', 'Herida abierta', 'Dolor intenso', 'Hemorragia', 'Pérdida conciencia'],
  abdominal: ['Dolor abdominal', 'Náuseas', 'Vómitos', 'Diarrea', 'Hematemesis', 'Melena'],
  infeccioso: ['Fiebre', 'Escalofríos', 'Confusión', 'Dolor localizado', 'Disuria'],
  toxicos: ['Ingesta tóxica', 'Somnolencia', 'Vómitos', 'Alucinaciones', 'Olor a alcohol/drogas'],
  urologico: ['Dolor cólico', 'Hematuria', 'Retención urinaria', 'Disuria', 'Fiebre'],
  gineco: ['Dolor pélvico', 'Sangrado vaginal', 'Embarazo', 'Síncope', 'Fiebre'],
  oftalmologico: ['Dolor ocular', 'Pérdida visión', 'Trauma ocular', 'Fotofobia'],
  otorrino: ['Odinofagia', 'Epistaxis', 'Otalgia', 'Vértigo', 'Fiebre'],
  dermatologico: ['Urticaria', 'Edema', 'Eritema', 'Prurito', 'Lesión extensa'],
  endocrino: ['Poliuria', 'Polidipsia', 'Confusión', 'Dolor abdominal', 'Vómitos'],
  psiquiatrico: ['Agitación', 'Ideación suicida', 'Desorientación', 'Consumo sustancias'],
  pediatrico: ['Fiebre', 'Llanto inconsolable', 'Letargo', 'Dificultad respiratoria', 'Vómitos'],
  otros: ['Malestar general', 'Dolor inespecífico', 'Consulta administrativa'],
}

export type RedFlag = { id: string; label: string; level: 1 | 2 | 3 }

export const redFlagCatalog: RedFlag[] = [
  { id: 'parada', label: 'Parada cardiorrespiratoria', level: 1 },
  { id: 'via_aerea', label: 'Compromiso de vía aérea', level: 1 },
  { id: 'resp_severa', label: 'Dificultad respiratoria severa', level: 1 },
  { id: 'shock', label: 'Signos de shock', level: 1 },
  { id: 'gcs_bajo', label: 'Alteración grave del nivel de consciencia', level: 1 },
  { id: 'convulsion', label: 'Convulsión activa o reciente', level: 2 },
  { id: 'dolor_toracico', label: 'Dolor torácico sugestivo de SCA', level: 2 },
  { id: 'ictus', label: 'Síntomas neurológicos focales', level: 2 },
  { id: 'sepsis', label: 'Sospecha de sepsis', level: 2 },
  { id: 'hemorragia', label: 'Hemorragia activa importante', level: 2 },
  { id: 'trauma_alto', label: 'Trauma de alta energía', level: 2 },
  { id: 'dolor_intenso', label: 'Dolor muy intenso', level: 3 },
  { id: 'embarazo_riesgo', label: 'Embarazo con signos de riesgo', level: 3 },
]

export const redFlagAreas: Record<ClinicalArea, string[]> = {
  respiratorio: ['resp_severa', 'via_aerea', 'shock'],
  cardiovascular: ['dolor_toracico', 'shock', 'parada'],
  neurologico: ['ictus', 'gcs_bajo', 'convulsion'],
  trauma: ['hemorragia', 'trauma_alto', 'shock'],
  abdominal: ['shock', 'hemorragia', 'dolor_intenso'],
  infeccioso: ['sepsis', 'shock'],
  toxicos: ['gcs_bajo', 'shock'],
  urologico: ['hemorragia', 'dolor_intenso'],
  gineco: ['embarazo_riesgo', 'hemorragia', 'shock'],
  oftalmologico: ['dolor_intenso'],
  otorrino: ['hemorragia', 'resp_severa'],
  dermatologico: ['resp_severa', 'shock'],
  endocrino: ['gcs_bajo', 'shock'],
  psiquiatrico: ['gcs_bajo'],
  pediatrico: ['resp_severa', 'gcs_bajo', 'shock'],
  otros: ['dolor_intenso'],
}
