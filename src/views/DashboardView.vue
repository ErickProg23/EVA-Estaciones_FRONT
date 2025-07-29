<template>
  <div>
    <!-- App Bar -->
    <v-app-bar
      color="#2d2d2d"
      dark
      elevation="4"
      border="0"
      class="custom-app-bar"
    >
      <v-app-bar-nav-icon
        @click="navigationStore.toggleDrawer()"
        v-if="$vuetify.display.mobile"
      ></v-app-bar-nav-icon>
      
      <v-app-bar-title class="d-flex align-center">
        <v-icon class="mr-2" color="green">{{ navigationStore.getCurrentModuleInfo().icon }}</v-icon>
        {{ navigationStore.getCurrentModuleInfo().title }}
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Notificaciones y usuario... -->
    </v-app-bar>

    <!-- Contenido principal -->
    <v-main class="main-content">
      <!-- Tu contenido del dashboard aquí -->
    </v-main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNavigationStore } from '@/stores/navigation'

// ===== COMPOSABLES =====
const _router = useRouter()

// ===== REACTIVE DATA =====
const username = ref('')
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const navigationStore = useNavigationStore()

// ===== LIFECYCLE =====
onMounted(() => {
  username.value = localStorage.getItem('username') || 'Usuario'
  
  showMessage('¡Bienvenido al sistema EVA!', 'success')
})


const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}
</script>

<style scoped>
.main-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
}

.dashboard-container {
  background: transparent;
}

.custom-drawer {
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.custom-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
}

.logo-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
}

.navigation-list {
  padding: 8px;
}

.nav-item {
  border-radius: 12px;
  margin-bottom: 4px;
  transition: all 0.2s;
}

.nav-item:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.stat-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.content-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .dashboard-container {
    padding: 16px !important;
  }
}

@media (max-width: 600px) {
  .dashboard-container {
    padding: 8px !important;
  }
}
</style>