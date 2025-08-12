<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      v-if="isAuthenticated"
      color="#1a1a1a"
      dark
      elevation="2"
      height="64"
    >
      <v-app-bar-title class="text-green font-weight-bold">
        Sistema EVA - Estaciones
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Menú de usuario -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon
            size="large"
            class="mr-2"
          >
            <v-avatar color="green" size="40">
              <v-icon color="white">mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        
        <v-list dark color="#2d2d2d" min-width="200">
          <!-- Información del usuario -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="green" size="32">
                <v-icon color="white" size="20">mdi-account</v-icon>
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
          <v-list-item @click="showLogoutDialog = true" class="text-red">
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

    <!-- ✅ NUEVO: Diálogo estético de confirmación de logout -->
    <!-- ✅ AJUSTAR: Hacer el diálogo más ancho -->
    <v-dialog v-model="showLogoutDialog" max-width="500px" persistent>
      <v-card dark color="#2d2d2d" class="logout-dialog">
        <!-- Encabezado con icono -->
        <v-card-title class="text-center pa-6">
          <div class="d-flex flex-column align-center">
            <v-avatar color="orange" size="64" class="mb-4">
              <v-icon color="white" size="32">mdi-logout-variant</v-icon>
            </v-avatar>
            <h3 class="text-h5 font-weight-bold">Cerrar Sesión</h3>
          </div>
        </v-card-title>
        
        <!-- Contenido -->
        <v-card-text class="text-center pa-6">
          <p class="text-body-1 mb-2">¿Estás seguro de que deseas cerrar sesión?</p>
          <p class="text-body-2 text-grey-lighten-1">
            Se perderán todos los datos no guardados y tendrás que iniciar sesión nuevamente.
          </p>
        </v-card-text>
        
        <!-- Acciones -->
        <v-card-actions class="pa-6 pt-0 d-flex justify-space-between">
          <v-btn
            color="grey"
            variant="outlined"
            size="large"
            min-width="140px"
            @click="showLogoutDialog = false"
          >
            <v-icon left size="small">mdi-close</v-icon>
            Cancelar
          </v-btn>
          
          <v-btn
            color="orange"
            variant="flat"
            size="large"
            min-width="140px"
            @click="confirmLogout"
            :loading="loggingOut"
          >
            <v-icon left size="small">mdi-logout</v-icon>
            Cerrar Sesión
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

// ✅ NUEVAS variables para el diálogo de logout
const showLogoutDialog = ref(false)
const loggingOut = ref(false)

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

// ✅ NUEVA función de logout mejorada
const confirmLogout = async () => {
  loggingOut.value = true
  
  try {
    // Simular un pequeño delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 800))
    
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
    
    // Cerrar diálogo
    showLogoutDialog.value = false
    
    // Redirigir al login
    await router.push('/')
    
  } catch (error) {
    console.error('Error durante el logout:', error)
  } finally {
    loggingOut.value = false
  }
}

// ✅ ELIMINAR la función logout antigua y reemplazar con:
// const logout = () => { ... } // ← Eliminar esta función

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

/* ✅ NUEVOS estilos para el diálogo de logout */
.logout-dialog {
  border-radius: 16px !important;
  border: 2px solid #ff9800;
}

.logout-dialog .v-card-title {
  background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
  border-radius: 16px 16px 0 0;
}

.logout-dialog .v-btn {
  border-radius: 12px !important;
  font-weight: 600;
  text-transform: none;
}

.logout-dialog .v-btn--variant-outlined {
  border-width: 2px;
}

.logout-dialog .v-avatar {
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}
</style>