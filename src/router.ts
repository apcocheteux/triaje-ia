import { createRouter, createWebHistory } from 'vue-router'
import HomePage from './ui/pages/HomePage.vue'
import QueuePage from './ui/pages/QueuePage.vue'
import PatientFormPage from './ui/pages/PatientFormPage.vue'
import AssessmentPage from './ui/pages/AssessmentPage.vue'
import ResultPage from './ui/pages/ResultPage.vue'
import FollowUpPage from './ui/pages/FollowUpPage.vue'
import ExportPage from './ui/pages/ExportPage.vue'
import SettingsPage from './ui/pages/SettingsPage.vue'
import SourcesPage from './ui/pages/SourcesPage.vue'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomePage },
    { path: '/cola', name: 'queue', component: QueuePage },
    { path: '/paciente/nuevo', name: 'patient-new', component: PatientFormPage },
    { path: '/paciente/:id/editar', name: 'patient-edit', component: PatientFormPage, props: true },
    { path: '/paciente/:id/triaje', name: 'assessment', component: AssessmentPage, props: true },
    { path: '/paciente/:id/resultado', name: 'result', component: ResultPage, props: true },
    { path: '/paciente/:id/seguimiento', name: 'follow-up', component: FollowUpPage, props: true },
    { path: '/exportacion', name: 'export', component: ExportPage },
    { path: '/configuracion', name: 'settings', component: SettingsPage },
    { path: '/fuentes', name: 'sources', component: SourcesPage },
  ],
  scrollBehavior() {
    return { top: 0 }
  },
})
