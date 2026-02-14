import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import './ui/styles/global.css'
import { useAppStore } from './application/store'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
const store = useAppStore(pinia)
store.bindStorage()
app.mount('#app')
