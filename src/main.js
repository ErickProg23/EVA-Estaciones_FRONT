import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import LoadingWave from './components/LoadingWave.vue'

const app = createApp(App)

// Registrar componente globalmente
app.component('LoadingWave', LoadingWave)

const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

app.mount('#app')