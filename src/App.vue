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
      <!-- ✅ AGREGAR: Botón hamburguesa para controlar la barra lateral -->
      <v-app-bar-nav-icon 
        @click="navigationStore.toggleDrawer()"
        color="green"
      ></v-app-bar-nav-icon>
      
      <v-app-bar-title class="text-green font-weight-bold">
        EVA
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
            <!-- ✅ CAMBIAR: Avatar con iniciales -->
            <v-avatar color="green" size="40">
              <span class="text-white font-weight-bold text-h6">
                {{ getUserInitials(currentUser?.nombre) }}
              </span>
            </v-avatar>
          </v-btn>
        </template>
        
        <v-card class="user-menu" color="#2d2d2d" dark min-width="260">
          <div class="user-menu__header">
            <v-avatar color="green" size="44" class="user-menu__avatar">
              <span class="text-white font-weight-bold text-h6">
                {{ getUserInitials(currentUser?.nombre) }}
              </span>
            </v-avatar>
            <div class="user-menu__meta">
              <div class="user-menu__name">{{ currentUser?.nombre || 'Usuario' }}</div>
              <div class="user-menu__role">{{ currentUserRoleName || 'Sin rol' }}</div>
            </div>
          </div>

          <v-divider class="user-menu__divider"></v-divider>

          <v-list class="user-menu__list" bg-color="transparent" density="compact">
            <v-list-item @click="showLogoutDialog = true" class="user-menu__logout" rounded="lg">
              <template v-slot:prepend>
                <v-icon color="red">mdi-logout</v-icon>
              </template>
              <v-list-item-title class="text-red">Cerrar Sesión</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
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
const navigationStore = useNavigationStore() // ✅ Ya existe
const currentUser = ref(null)
const currentUserRoleName = computed(() => {
  return (
    currentUser.value?.rol_nombre ||
    currentUser.value?.rol?.nombre ||
    sessionStorage.getItem('rol_nombre') ||
    ''
  )
})

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

// ✅ NUEVA función para obtener iniciales
const getUserInitials = (nombre) => {
  if (!nombre) return 'U'
  
  const words = nombre.trim().split(' ')
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase()
  }
  
  // Tomar primera letra del primer y último nombre
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

// ✅ MODIFICAR: Cargar información del usuario actual
const loadCurrentUser = () => {
  if (isAuthenticated.value) {
    const userData = sessionStorage.getItem('currentUser')
    if (userData) {
      const parsed = JSON.parse(userData)
      const rolNombre = parsed?.rol_nombre || parsed?.rol?.nombre || sessionStorage.getItem('rol_nombre') || null
      currentUser.value = rolNombre ? { ...parsed, rol_nombre: rolNombre } : parsed
    } else {
      const rolNombre = sessionStorage.getItem('rol_nombre') || null
      currentUser.value = {
        nombre: sessionStorage.getItem('username') || 'Usuario',
        rol_nombre: rolNombre || 'Usuario'
      }
    }
    
    // ✅ AGREGAR: Actualizar el rol en el store de navegación
    navigationStore.updateUserRole()
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
    sessionStorage.removeItem('rol_nombre')
    sessionStorage.removeItem('usuario_id')
    sessionStorage.removeItem('nombre')
    
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

// ✅ MODIFICAR: Watchers
watch(() => route.path, () => {
  updateAuthState()
  loadCurrentUser()
})

watch(isAuthenticated, (newValue) => {
  if (newValue) {
    loadCurrentUser()
  } else {
    currentUser.value = null
    // ✅ AGREGAR: Limpiar el rol cuando se desautentica
    navigationStore.updateUserRole()
  }
})

watch(
  () => route.fullPath,
  () => {
    navigationStore.drawer = false
  }
)

// ✅ MODIFICAR: Escuchar cambios en sessionStorage
window.addEventListener('storage', (e) => {
  if (e.key === 'isAuthenticated' || e.key === 'rol_id') {
    updateAuthState()
    loadCurrentUser() // Esto ya llama a updateUserRole()
  }
})
</script>

<style scoped>
.text-red {
  color: #f44336 !important;
}

.user-menu {
  border-radius: 16px !important;
  border: 1px solid rgba(76, 175, 80, 0.35);
  box-shadow: 0 18px 55px rgba(0, 0, 0, 0.6) !important;
  overflow: hidden;
}

.user-menu__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 14px 12px;
  background: linear-gradient(45deg, rgba(20, 20, 20, 0.75), rgba(45, 45, 45, 0.45));
}

.user-menu__avatar {
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45);
}

.user-menu__meta {
  min-width: 0;
}

.user-menu__name {
  font-weight: 800;
  letter-spacing: 0.01em;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__role {
  margin-top: 2px;
  font-size: 0.85rem;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-menu__divider {
  border-color: rgba(255, 255, 255, 0.08);
}

.user-menu__list {
  padding: 10px;
}

.user-menu__logout {
  background: rgba(244, 67, 54, 0.07);
}

.user-menu__logout:hover {
  background: rgba(244, 67, 54, 0.12);
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

<style>
html,
body,
#app {
  height: 100%;
}

body {
  margin: 0;
  background: rgb(var(--v-theme-background));
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.v-application {
  background: rgb(var(--v-theme-background)) !important;
}
</style>
