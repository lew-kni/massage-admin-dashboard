import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useThemeStore } from './stores/theme'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Initialize theme from store so Tailwind dark class is applied early
const theme = useThemeStore()
theme.init()

app.use(router)

app.mount('#app')
