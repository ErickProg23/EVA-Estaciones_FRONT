<template>
  <v-app>
    <!-- App Bar - Solo mostrar si está autenticado -->
    <v-app-bar
      v-if="isAuthenticated"
      color="#1a1a1a"
      density="compact"
      flat
      border="0"
    >
      <!-- Botón de menú -->
      <v-app-bar-nav-icon
        @click="navigationStore.toggleDrawer()"
        color="white"
      ></v-app-bar-nav-icon>
      
      <!-- Título dinámico -->
      <v-app-bar-title class="text-white">
        <v-icon :icon="navigationStore.getCurrentModuleInfo()?.icon || 'mdi-view-dashboard'" class="mr-2"></v-icon>
        {{ navigationStore.getCurrentModuleInfo()?.title || 'EVA System' }}
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Menú de perfil de usuario -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="large"
            class="mr-2"
          >
            <v-avatar size="32" color="green">
              <v-icon color="white">mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        
        <v-list min-width="200">
          <!-- Información del usuario -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar size="40" color="green">
                <v-icon color="white">mdi-account</v-icon>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-bold">
              {{ currentUser?.nombre || 'Usuario' }}
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ currentUser?.rol?.nombre || 'Sin rol' }}
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-divider></v-divider>
          
          <!-- Cerrar sesión -->
          <v-list-item @click="logout" class="text-red">
            <template v-slot:prepend>
              <v-icon color="red">mdi-logout</v-icon>
            </template>
            <v-list-item-title class="text-red">Cerrar Sesión</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer - Solo mostrar si está autenticado -->
    <NavigationBar v-if="isAuthenticated" />
    
    <!-- Contenido principal -->
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import NavigationBar from '@/components/NavigationBar.vue'
import { useNavigationStore } from '@/stores/navigation'

const router = useRouter()
const route = useRoute()
const navigationStore = useNavigationStore()
const currentUser = ref(null)

// Estado reactivo para autenticación
const authState = ref(sessionStorage.getItem('isAuthenticated') === 'true')

// Computed para verificar autenticación
const isAuthenticated = computed(() => {
  return authState.value
})

// Función para actualizar el estado de autenticación
const updateAuthState = () => {
  authState.value = sessionStorage.getItem('isAuthenticated') === 'true'
}

// Cargar información del usuario actual
const loadCurrentUser = () => {
  if (isAuthenticated.value) {
    const userData = sessionStorage.getItem('currentUser')
    if (userData) {
      currentUser.value = JSON.parse(userData)
    } else {
      currentUser.value = {
        nombre: sessionStorage.getItem('username') || 'Usuario',
        rol: { nombre: 'Usuario' }
      }
    }
  }
}

const logout = () => {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    // Limpiar datos de sesión
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('currentUser')
    sessionStorage.removeItem('isAuthenticated')
    sessionStorage.removeItem('rol_id')
    sessionStorage.removeItem('estacion_id')
    
    // Actualizar estado reactivo
    updateAuthState()
    currentUser.value = null
    
    // Redirigir al login
    router.push('/')
  }
}

// Watchers
watch(() => route.path, () => {
  updateAuthState()
  loadCurrentUser()
})

watch(isAuthenticated, (newValue) => {
  if (newValue) {
    loadCurrentUser()
  } else {
    currentUser.value = null
  }
})

// Lifecycle
onMounted(() => {
  updateAuthState()
  loadCurrentUser()
})

// Escuchar cambios en sessionStorage desde otras pestañas/ventanas
window.addEventListener('storage', (e) => {
  if (e.key === 'isAuthenticated') {
    updateAuthState()
  }
})
</script>

<style scoped>
.text-red {
  color: #f44336 !important;
}
</style>