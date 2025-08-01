<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Personal"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-account-hard-hat"
      animation-type="particles"
    />

    <!-- Contenido principal -->
    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <!-- Header principal -->
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="green">mdi-account-hard-hat</v-icon>
                  Gestión de Personal
                </h1>
                <p class="text-grey-400 ma-0">Administra el personal del sistema EVA</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="openDialog()"
                class="text-none"
              >
                <v-icon left>mdi-plus</v-icon>
                Nuevo Personal
              </v-btn>
            </div>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="search"
                      label="Buscar personal..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedEstacion"
                      :items="estacionOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por estación"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedPuesto"
                      :items="puestoOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por puesto"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="2">
                    <v-btn
                      color="info"
                      variant="outlined"
                      @click="refreshData"
                      :loading="loading"
                      block
                    >
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Tabla de personal -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="filteredPersonal"
                  :search="search"
                  :items-per-page="10"
                  class="transparent"
                  :loading="loading"
                  loading-text="Actualizando datos..."
                  no-data-text="No hay personal registrado"
                >
                  <template v-slot:item.estacion="{ item }">
                    <v-chip
                      color="info"
                      size="small"
                      variant="outlined"
                    >
                      {{ item.estacion?.nombre || getEstacionName(item.estacion_id) || 'Sin estación' }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.puesto="{ item }">
                    <v-chip
                      color="primary"
                      size="small"
                      variant="outlined"
                    >
                      {{ item.puesto || 'Sin puesto' }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.activo="{ item }">
                    <v-chip
                      :color="getStatusColor(item.activo)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(item.activo) }}
                    </v-chip>
                  </template>
                  
                  <template v-slot:item.actions="{ item }">
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      color="primary"
                      variant="text"
                      @click="editPersonal(item)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      size="small"
                      color="error"
                      variant="text"
                      @click="deletePersonal(item)"
                    ></v-btn>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Diálogo para crear/editar personal -->
    <v-dialog v-model="showDialog" max-width="600px" persistent>
      <v-card dark color="#2d2d2d">
        <v-card-title class="text-h5 pa-4">
          <v-icon class="mr-2" color="green">mdi-account-hard-hat</v-icon>
          {{ editingPersonal ? 'Editar Personal' : 'Nuevo Personal' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.nombre"
                  label="Nombre completo"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.cedula"
                  label="Cédula"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.telefono"
                  label="Teléfono"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.email"
                  label="Email"
                  type="email"
                  :rules="[rules.email]"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="personalForm.estacion_id"
                  :items="estaciones"
                  item-title="nombre"
                  item-value="id"
                  label="Estación"
                  :rules="[rules.required]"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.puesto"
                  label="Puesto"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="personalForm.salario"
                  label="Salario"
                  type="number"
                  prefix="$"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="personalForm.activo"
                  label="Activo"
                  color="green"
                  hide-details
                ></v-switch>
              </v-col>
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
            variant="flat" 
            @click="savePersonal"
            :loading="saving"
            :disabled="!formValid"
          >
            {{ editingPersonal ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Diálogo de confirmación para eliminar -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card dark color="#2d2d2d">
        <v-card-title class="text-h5">
          <v-icon class="mr-2" color="error">mdi-delete</v-icon>
          Confirmar eliminación
        </v-card-title>
        <v-card-text>
          ¿Estás seguro de que deseas eliminar a {{ personalToDelete?.nombre }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showDeleteDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="error" variant="flat" @click="confirmDelete">
            Eliminar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top right"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingWave from '@/components/LoadingWave.vue'
import { userService, roleService, stationService } from '@/services/apiService'

// ===== REACTIVE DATA =====
const loading = ref(false)
const saving = ref(false)
const showDialog = ref(false)
const showDeleteDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const selectedEstacion = ref(null)
const selectedPuesto = ref(null)
const editingPersonal = ref(null)
const personalToDelete = ref(null)
const formValid = ref(false)
const search = ref('')

// Estados de carga inicial
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  personal: false,
  estaciones: false
})

// Datos
const personal = ref([])
const estaciones = ref([])

const personalForm = ref({
  nombre: '',
  cedula: '',
  telefono: '',
  email: '',
  estacion_id: null,
  puesto: '',
  salario: null,
  activo: true
})

// Encabezados de la tabla
const headers = [
  {
    title: 'Nombre',
    key: 'nombre'
  },
  {
    title: 'Cédula',
    key: 'cedula'
  },
  {
    title: 'Teléfono',
    key: 'telefono'
  },
  {
    title: 'Estación',
    key: 'estacion'
  },
  {
    title: 'Puesto',
    key: 'puesto'
  },
  {
    title: 'Estado',
    key: 'activo'
  },
  {
    title: 'Acciones',
    key: 'actions',
    sortable: false
  }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  email: value => {
    if (!value) return true
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  }
}

// ===== COMPUTED PROPERTIES =====
const filteredPersonal = computed(() => {
  let filtered = personal.value
  
  if (selectedEstacion.value) {
    filtered = filtered.filter(p => p.estacion_id === selectedEstacion.value)
  }
  
  if (selectedPuesto.value) {
    filtered = filtered.filter(p => p.puesto === selectedPuesto.value)
  }
  
  return filtered
})

const estacionOptions = computed(() => {
  const options = [{ title: 'Todas las estaciones', value: null }]
  estaciones.value.forEach(estacion => {
    options.push({ title: estacion.nombre, value: estacion.id })
  })
  return options
})

const puestoOptions = computed(() => {
  const puestos = [...new Set(personal.value.map(p => p.puesto).filter(Boolean))]
  const options = [{ title: 'Todos los puestos', value: null }]
  puestos.forEach(puesto => {
    options.push({ title: puesto, value: puesto })
  })
  return options
})

// ===== METHODS =====
const updateLoadingProgress = () => {
  const totalTasks = Object.keys(dataLoadingStates.value).length
  const completedTasks = Object.values(dataLoadingStates.value).filter(Boolean).length
  loadingProgress.value = Math.round((completedTasks / totalTasks) * 100)
  
  if (completedTasks === totalTasks) {
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500)
  }
}

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
    showMessage('Error al cargar estaciones', 'error')
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  }
}

const loadPersonal = async () => {
  try {
    loadingMessage.value = 'Cargando personal...'
    
    // Aquí deberías usar personalService.getPersonal() cuando lo crees
    // const result = await personalService.getPersonal()
    
    // Datos de ejemplo mientras tanto
    const result = {
      success: true,
      data: [
        {
          id: 1,
          nombre: 'Juan Pérez',
          cedula: '12345678',
          telefono: '555-0123',
          email: 'juan@example.com',
          estacion_id: 1,
          puesto: 'Operador',
          salario: 2500,
          activo: true
        },
        {
          id: 2,
          nombre: 'María García',
          cedula: '87654321',
          telefono: '555-0456',
          email: 'maria@example.com',
          estacion_id: 2,
          puesto: 'Supervisor',
          salario: 3500,
          activo: true
        }
      ]
    }
    
    if (result.success) {
      personal.value = result.data.map(p => ({
        ...p,
        estacion: estaciones.value.find(e => e.id === p.estacion_id) || null
      }))
      console.log('Personal cargado:', personal.value)
    } else {
      console.warn('No se pudo cargar el personal:', result.message)
      showMessage('Error al cargar personal', 'error')
    }
    
    dataLoadingStates.value.personal = true
    updateLoadingProgress()
  } catch (error) {
    console.error('Error al cargar personal:', error)
    showMessage('Error al cargar personal', 'error')
    dataLoadingStates.value.personal = true
    updateLoadingProgress()
  }
}

const initializeData = async () => {
  await loadEstaciones()
  await loadPersonal()
}

const refreshData = async () => {
  loading.value = true
  await loadPersonal()
  loading.value = false
  showMessage('Datos actualizados correctamente', 'success')
}

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const getEstacionName = (estacionId) => {
  const estacion = estaciones.value.find(e => e.id === estacionId)
  return estacion ? estacion.nombre : 'Sin estación'
}

const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

const openDialog = () => {
  editingPersonal.value = null
  clearForm()
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingPersonal.value = null
  clearForm()
}

const clearForm = () => {
  personalForm.value = {
    nombre: '',
    cedula: '',
    telefono: '',
    email: '',
    estacion_id: null,
    puesto: '',
    salario: null,
    activo: true
  }
}

const editPersonal = (personalItem) => {
  editingPersonal.value = personalItem
  personalForm.value = {
    nombre: personalItem.nombre,
    cedula: personalItem.cedula,
    telefono: personalItem.telefono,
    email: personalItem.email,
    estacion_id: personalItem.estacion_id,
    puesto: personalItem.puesto,
    salario: personalItem.salario,
    activo: personalItem.activo
  }
  showDialog.value = true
}

const savePersonal = async () => {
  if (!formValid.value) return
  
  try {
    saving.value = true
    
    // Aquí deberías usar personalService cuando lo crees
    // const result = editingPersonal.value 
    //   ? await personalService.updatePersonal(editingPersonal.value.id, personalForm.value)
    //   : await personalService.createPersonal(personalForm.value)
    
    // Simulación por ahora
    const result = { success: true, message: 'Personal guardado correctamente' }
    
    if (result.success) {
      showMessage(result.message || 'Personal guardado correctamente', 'success')
      closeDialog()
      await refreshData()
    } else {
      showMessage(result.message || 'Error al guardar personal', 'error')
    }
  } catch (error) {
    console.error('Error al guardar personal:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const deletePersonal = (personalItem) => {
  personalToDelete.value = personalItem
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!personalToDelete.value) return
  
  try {
    // Aquí deberías usar personalService.deletePersonal()
    // const result = await personalService.deletePersonal(personalToDelete.value.id)
    
    // Simulación por ahora
    const result = { success: true, message: 'Personal eliminado correctamente' }
    
    if (result.success) {
      showMessage(result.message || 'Personal eliminado correctamente', 'success')
      await refreshData()
    } else {
      showMessage(result.message || 'Error al eliminar personal', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar personal:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    showDeleteDialog.value = false
    personalToDelete.value = null
  }
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
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

.transparent {
  background: transparent !important;
}

.transparent >>> .v-table__wrapper {
  background: transparent !important;
}

.transparent >>> .v-data-table-header {
  background: rgba(45, 45, 45, 0.8) !important;
}

.transparent >>> .v-data-table__tr:hover {
  background: rgba(76, 175, 80, 0.1) !important;
}
</style>