<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Usuarios"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-account-multiple"
    />

    <!-- Contenido principal (solo se muestra cuando todo está cargado) -->
    <div v-else class="fade-in">
      <v-container v-if="!isInitialLoading" fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <!-- Header principal -->
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="green">mdi-account-group</v-icon>
                  Gestión de Usuarios
                </h1>
                <p class="text-grey-400 ma-0">Administra los usuarios del sistema EVA</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="openDialog()"
                class="text-none"
              >
                <v-icon left>mdi-plus</v-icon>
                Nuevo Usuario
              </v-btn>
            </div>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="Buscar usuarios..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedRole"
                      :items="roles"
                      item-title="nombre"
                      item-value="id"
                      label="Filtrar por rol"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedStatus"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por estado"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Tabla de usuarios -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="filteredUsers"
                  :search="search"
                  :items-per-page="10"
                  class="transparent"
                  :loading="loading"
                  loading-text="Actualizando datos..."
                >
                  <!-- Template para estado activo -->
                  <template #item.activo="{ item }">
                    <v-chip
                      :color="getStatusColor(item.activo)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(item.activo) }}
                    </v-chip>
                  </template>

                  <!-- Template para rol -->
                  <template #item.rol.nombre="{ item }">
                    <v-chip
                      :color="getRoleColor(item.rol?.nombre || getRoleName(item.rol_id))"
                      size="small"
                      variant="outlined"
                    >
                      {{ item.rol?.nombre || getRoleName(item.rol_id) || 'Sin rol' }}
                    </v-chip>
                  </template>

                  <!-- Template para estación -->
                  <template #item.estacion.nombre="{ item }">
                    <v-chip
                      color="info"
                      size="small"
                      variant="outlined"
                    >
                      {{ item.estacion?.nombre || getEstacionName(item.estacion_id) || 'Sin estación' }}
                    </v-chip>
                  </template>

                  <!-- Template para acciones -->
                  <template #item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="editUser(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="red"
                        variant="text"
                        @click="deleteUser(item)"
                      ></v-btn>
                    </div>
                  </template>

                  <!-- Template para cuando no hay datos -->
                  <template #no-data>
                    <div class="text-center pa-4">
                      <v-icon size="48" color="grey">mdi-account-off</v-icon>
                      <p class="text-grey mt-2">No se encontraron usuarios</p>
                    </div>
                  </template>

                  <!-- Template para el footer con información -->
                  <template #bottom>
                    <div class="d-flex align-center justify-space-between pa-4">
                      <div class="text-caption text-grey">
                        Mostrando {{ filteredUsers.length }} de {{ users.length }} usuarios
                      </div>
                    </div>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
    
    <!-- Dialog para agregar/editar usuario -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card dark color="#2d2d2d">
        <v-card-title>
          <v-icon left color="green">mdi-account-plus</v-icon>
          {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="userForm.nombre"
                  label="Nombre completo"
                  variant="outlined"
                  dark
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.username"
                  label="Usuario"
                  variant="outlined"
                  dark
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.correo"
                  label="Correo electrónico"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  dark
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.password"
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  dark
                  required
                  :disabled="editingUser"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.rol_id"
                  :items="roles"
                  item-title="nombre"
                  item-value="id"
                  label="Rol"
                  variant="outlined"
                  dark
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.estacion_id"
                  :items="estaciones"
                  item-title="nombre"
                  item-value="id"
                  label="Estación"
                  variant="outlined"
                  dark
                  required
                ></v-select>
              </v-col>
              <!-- Campo de estado oculto, siempre activo -->
              <input type="hidden" v-model="userForm.activo" value="true" />
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">
            Cancelar
          </v-btn>
          <v-btn 
            color="green" 
            variant="outlined" 
            @click="saveUser"
            :disabled="!formValid"
            :loading="saving"
          >
            {{ editingUser ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { userService, roleService, stationService } from '@/services/apiService'

// Estado del componente
const loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const selectedRole = ref(null)
const selectedStatus = ref(null)
const editingUser = ref(null)
const formValid = ref(false)
const search = ref('')

// Estados de carga inicial
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  usuarios: false,
  roles: false,
  estaciones: false
})

// ===== CONFIGURACIÓN API =====
const API_URL = process.env.VUE_APP_API_URL

// Datos de usuarios desde API
const users = ref([])
const currentUser = ref(null)

const userForm = ref({
  nombre: '',
  username: '',
  correo: '',
  password: '',
  rol_id: null,
  estacion_id: null,
  activo: true
})

// Opciones (ahora se cargan dinámicamente)
const roles = ref([])
const estaciones = ref([])

const statusOptions = [
  { value: true, title: 'Activo' },
  { value: false, title: 'Inactivo' }
]

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Usuario', key: 'usuario', sortable: true },
  { title: 'Rol', key: 'rol.nombre', sortable: true },
  { title: 'Estación', key: 'estacion.nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Función para actualizar el progreso de carga
const updateLoadingProgress = () => {
  const completedTasks = Object.values(dataLoadingStates.value).filter(Boolean).length
  const totalTasks = Object.keys(dataLoadingStates.value).length
  loadingProgress.value = Math.round((completedTasks / totalTasks) * 100)
  
  // Verificar si todo está cargado
  if (completedTasks === totalTasks) {
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500) // Pequeña pausa para mejor UX
  }
}

// Función para cargar roles con mejor manejo de errores
const loadRoles = async () => {
  try {
    loadingMessage.value = 'Cargando roles...'
    
    const result = await roleService.getRoles()
    
    if (result.success) {
      roles.value = result.data
      console.log('Roles cargados:', result.data)
    } else {
      console.warn('No se pudieron cargar los roles:', result.message)
    }
    
    dataLoadingStates.value.roles = true
    updateLoadingProgress()
  } catch (error) {
    console.error('Error al cargar roles:', error)
    showMessage('Error al cargar roles, usando valores por defecto', 'warning')
    
    // Usar datos por defecto en caso de error
    roles.value = [
      { id: 1, nombre: 'Administrador' },
      { id: 2, nombre: 'Encargado' },
      { id: 3, nombre: 'Capital humano' },
      { id: 4, nombre: 'Mantenimiento' },
      { id: 5, nombre: 'Administrativos' }
    ]
    
    dataLoadingStates.value.roles = true
    updateLoadingProgress()
  }
}

// Función para cargar estaciones con mejor manejo de errores
const loadEstaciones = async () => {
  try {
    loadingMessage.value = 'Cargando estaciones...'
    
    const result = await stationService.getEstaciones()
    
    if (result.success) {
      estaciones.value = result.data
      console.log('Estaciones cargadas:', result.data)
    } else {
      console.warn('No se pudieron cargar las estaciones:', result.message)
    }
    
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
    showMessage('Error al cargar estaciones, usando valores por defecto', 'warning')
    
    // Usar datos por defecto en caso de error
    estaciones.value = [
      { id: 1, nombre: 'Todas' },
      { id: 2, nombre: 'Estación Nuevo Leon' },
      { id: 3, nombre: 'Estación San Felipe' }
    ]
    
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  }
}

// Función para inicializar todos los datos con mejor manejo de errores
const initializeData = async () => {
  loadingMessage.value = 'Inicializando sistema...'
  loadingProgress.value = 0
  
  try {
    // Cargar todos los datos en paralelo
    await Promise.allSettled([
      loadRoles(),
      loadEstaciones(),
      getUsuarios()
    ])
  } catch (error) {
    console.error('Error al inicializar datos:', error)
    showMessage('Error al cargar datos del sistema', 'error')
    // Asegurar que la animación se detenga
    isInitialLoading.value = false
  }
}

// Función mejorada para cargar usuarios que mapea los datos correctamente
const getUsuarios = async () => {
  try {
    loadingMessage.value = 'Cargando usuarios...'
    
    const result = await userService.getUsuarios()
    
    if (result.success && result.data.length > 0) {
      const usuarios = result.data.map(usuario => ({
        ...usuario,
        rol_id: usuario.rol_id || null,
        estacion_id: usuario.estacion_id || null,
        rol: usuario.rol_id ? roles.value.find(r => r.id === usuario.rol_id) || null : null,
        estacion: usuario.estacion_id ? estaciones.value.find(e => e.id === usuario.estacion_id) || null : null
      }))
      
      users.value = usuarios
      currentUser.value = usuarios[0] || null
      
      console.log('Usuarios cargados:', usuarios)
    } else {
      console.warn('No se encontraron usuarios:', result.message)
      users.value = []
      currentUser.value = null
    }
    
    dataLoadingStates.value.usuarios = true
    updateLoadingProgress()
    
    if (!isInitialLoading.value) {
      showMessage('Usuarios cargados correctamente', 'success')
    }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    
    dataLoadingStates.value.usuarios = true
    updateLoadingProgress()
    
    if (error.response?.status === 401) {
      showMessage('Token expirado o inválido', 'error')
      sessionStorage.removeItem('token')
    } else {
      showMessage('Error al conectar con el servidor', 'error')
    }
  }
}

// Función para mostrar mensajes
const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}


// Funciones helper para obtener nombres por ID
const getRoleName = (rolId) => {
  if (!rolId) return null
  const rol = roles.value.find(r => r.id === rolId)
  return rol?.nombre || null
}

const getEstacionName = (estacionId) => {
  if (!estacionId) return null
  const estacion = estaciones.value.find(e => e.id === estacionId)
  return estacion?.nombre || null
}

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value
  
  if (selectedStatus.value !== null && selectedStatus.value !== undefined) {
    filtered = filtered.filter(user => user.activo === selectedStatus.value)
  }
  
  return filtered
})

// Métodos
const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

const getRoleColor = (roleName) => {
  const colors = {
    'ADMIN': 'red',
    'Encargado': 'orange',
    'Capital humano': 'blue',
    'Mantenimiento': 'green',
    'Administrativos': 'purple'
  }
  return colors[roleName] || 'grey'
}

const openDialog = () => {
  editingUser.value = null
  clearForm()
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  editingUser.value = null
}

const clearForm = () => {
  userForm.value = {
    nombre: '',
    username: '',
    correo: '',
    password: '',
    rol_id: null,
    estacion_id: null,
    activo: true
  }
}

const editUser = (user) => {
  editingUser.value = user
  userForm.value = {
    nombre: user.nombre,
    username: user.usuario, // Asegúrate de usar 'usuario' no 'username'
    correo: user.correo || user.email || '',
    password: '',
    rol_id: user.rol_id || user.rol?.id,
    estacion_id: user.estacion_id || user.estacion?.id,
    activo: user.activo
  }
  showAddDialog.value = true
}

//Solo desactivar al usuario
const deleteUser = (user) => {
  if (confirm(`¿Estás seguro de eliminar al usuario ${user.nombre}?`)) {
    showMessage('Funcionalidad de eliminar pendiente de implementar', 'warning')
  }
}

const saveUser = async () => {
  saving.value = true
  
  try {
    if (!formValid.value) {
      showMessage('Por favor complete todos los campos', 'warning')
      return
    }

    const userData = {
      nombre: userForm.value.nombre,
      usuario: userForm.value.username,
      correo: userForm.value.correo,
      password: userForm.value.password,
      activo: userForm.value.activo,
      rol_id: userForm.value.rol_id,
      estacion_id: userForm.value.estacion_id
    }

    if (editingUser.value && !userData.password) {
      delete userData.password
    }

    let result
    if (editingUser.value) {
      // Actualizar usuario existente
      result = await userService.updateUsuario(editingUser.value.id, userData)
    } else {
      // Crear nuevo usuario
      result = await userService.createUsuario(userData)
    }

    if (result.success) {
      showMessage(result.message || 'Usuario guardado correctamente', 'success')
      closeDialog()
      loading.value = true
      await getUsuarios()
      loading.value = false
    } else {
      showMessage(result.message || 'Error al guardar usuario', 'error')
    }

  } catch (error) {
    console.error('Error al guardar usuario:', error)
    if (error.response?.data?.message) {
      showMessage(error.response.data.message, 'error')
    } else {
      showMessage('Error al conectar con el servidor', 'error')
    }
  } finally {
    saving.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
/* Estilos para la pantalla de carga */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-container {
  text-align: center;
  color: white;
}

.loading-spinner {
  margin-bottom: 2rem;
  animation: pulse 2s infinite;
}

.loading-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #4CAF50;
}

.loading-subtitle {
  font-size: 1.1rem;
  color: #ccc;
  margin-bottom: 2rem;
}

.loading-progress {
  width: 300px;
  margin: 0 auto;
}

.progress-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #4CAF50;
  font-weight: bold;
}

/* Animación de entrada para el contenido principal */
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.main-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
}

.content-card {
  border-radius: 12px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.custom-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.custom-table {
  background: transparent !important;
}

.custom-table .v-data-table__wrapper {
  background: transparent;
}

.v-data-table-header {
  background: rgba(76, 175, 80, 0.1) !important;
}

.v-data-table-rows-no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
