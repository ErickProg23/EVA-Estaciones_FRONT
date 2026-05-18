<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Sistema"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-account-hard-hat"
      animationType="particles"
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
                  Gestión de Puestos
                </h1>
                <p class="text-grey-400 ma-0">Administra los puestos de trabajo del sistema EVA</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="openDialog()"
                class="text-none"
              >
                <v-icon left>mdi-plus</v-icon>
                Nuevo Puesto
              </v-btn>
            </div>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="Buscar puestos..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
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
                  <v-col cols="12" md="3">
                    <v-btn
                      color="info"
                      variant="outlined"
                      @click="refreshData"
                      :loading="loading"
                    >
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Tabla de puestos -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="filteredPuestos"
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

                  <!-- Template para mostrar nombre de estación -->
                  <template #item.estacion_nombre="{ item }">
                    {{ getEstacionNombre(item.estacion_id) }}
                  </template>

                  <!-- Template para acciones -->
                  <template #item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="editPuesto(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="red"
                        variant="text"
                        @click="deletePuesto(item)"
                      ></v-btn>
                    </div>
                  </template>

                  <!-- Template para cuando no hay datos -->
                  <template #no-data>
                    <div class="text-center pa-4">
                      <v-icon size="48" color="grey">mdi-account-hard-hat-outline</v-icon>
                      <p class="text-grey mt-2">No se encontraron puestos</p>
                    </div>
                  </template>

                  <!-- Template para el footer -->
                  <template #bottom>
                    <div class="d-flex align-center justify-space-between pa-4">
                      <div class="text-caption text-grey">
                        Mostrando {{ filteredPuestos.length }} de {{ puestos.length }} puestos
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
    
    <!-- Dialog para agregar/editar puesto -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card dark color="#2d2d2d">
        <v-card-title>
          <v-icon left color="blue">mdi-account-hard-hat-outline</v-icon>
          {{ editingPuesto ? 'Editar Puesto' : 'Nuevo Puesto' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="puestoForm.nombre"
                  label="Nombre del puesto"
                  variant="outlined"
                  dark
                  required
                  :rules="[v => !!v || 'El nombre es requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="puestoForm.estacion_id"
                  :items="estaciones"
                  item-title="nombre"
                  item-value="id"
                  label="Estación"
                  variant="outlined"
                  dark
                  required
                  :rules="[v => !!v || 'La estación es requerida']"
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="puestoForm.activo"
                  label="Puesto activo"
                  color="blue"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            variant="text" 
            @click="closeDialog"
          >
            Cancelar
          </v-btn>
          <v-btn 
            color="blue" 
            variant="flat" 
            @click="savePuesto"
            :loading="saving"
            :disabled="!formValid"
          >
            {{ editingPuesto ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="4000"
      location="top right"
    >
      {{ snackbarMessage }}
      <template #actions>
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
import { puestoService, stationService } from '@/services/apiService'

// Estado del componente
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showAddDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const selectedStatus = ref(null)
const editingPuesto = ref(null)
const formValid = ref(false)
const search = ref('')
const estaciones = ref([])

// Estados de carga inicial
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  puestos: false,
  estaciones: false
})

// Datos de puestos
const puestos = ref([])

const puestoForm = ref({
  nombre: '',
  estacion_id: '',
  activo: true
})

const statusOptions = [
  { title: 'Todos', value: null },
  { title: 'Activos', value: true },
  { title: 'Inactivos', value: false }
]


// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Estación', key: 'estacion_nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Función para actualizar el progreso de carga
const updateLoadingProgress = () => {
  const completedTasks = Object.values(dataLoadingStates.value).filter(Boolean).length
  const totalTasks = Object.keys(dataLoadingStates.value).length
  loadingProgress.value = Math.round((completedTasks / totalTasks) * 100)
  
  if (completedTasks === totalTasks) {
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500)
  }
}

// Función para cargar puestos
const loadPuestos = async () => {
  try {
    loadingMessage.value = 'Cargando puestos...'
    loading.value = true
    const response = await puestoService.getPuestos()
        
    if (response.success) {
      // Asignar los datos
      puestos.value = response.puestos || []
      
      dataLoadingStates.value.puestos = true
      updateLoadingProgress()
      
      if (!isInitialLoading.value) {
        showMessage('Puestos cargados correctamente', 'success')
      }
    } else {
      showMessage('Error al cargar puestos', 'error')
      dataLoadingStates.value.puestos = true
      updateLoadingProgress()
    }
  } catch (error) {
    showMessage('Error al conectar con el servidor', 'error')
    dataLoadingStates.value.puestos = true
    updateLoadingProgress()
  } finally {
    loading.value = false
  }
}

// Función para mostrar mensajes
const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Computed para filtrar puestos
const filteredPuestos = computed(() => {
  let filtered = puestos.value

  if (selectedStatus.value !== null && selectedStatus.value !== undefined) {
    filtered = filtered.filter(puesto => puesto.activo === selectedStatus.value)
  }

  return filtered
})



const loadEstaciones = async () => {
  try {
    loadingMessage.value = 'Cargando estaciones...'
    const response = await stationService.getEstaciones()
    if (response.success) {
      estaciones.value = response.data
    } else {
      showMessage('Error al cargar estaciones', 'error')
    }
    
    // ¡Esta línea faltaba!
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
    
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
    showMessage('Error al conectar con el servidor', 'error')
    
    // También actualizar en caso de error
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  }
}

// Métodos
// Función para obtener el nombre de la estación
const getEstacionNombre = (estacionId) => {
  const estacion = estaciones.value.find(e => e.id === estacionId)
  return estacion ? estacion.nombre : 'Sin asignar'
}

// Métodos existentes
const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

const openDialog = () => {
  editingPuesto.value = null
  clearForm()
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  editingPuesto.value = null
  
  // Limpiar el formulario
  puestoForm.value = {
    nombre: '',
    estacion_id: '',
    activo: true
  }
}

const clearForm = () => {
  puestoForm.value = {
    nombre: '',
    descripcion: '',
    activo: true
  }
}

const editPuesto = (puesto) => {
  editingPuesto.value = puesto
  puestoForm.value = {
    nombre: puesto.nombre,
    descripcion: puesto.descripcion,
    activo: puesto.activo
  }
  showAddDialog.value = true
}

const savePuesto = async () => {
  try {
    saving.value = true
    
    // Validar el formulario
    if (!formValid.value) {
      showMessage('Por favor completa todos los campos requeridos', 'error')
      return
    }
    
    // Preparar los datos del puesto
    const puestoData = {
      nombre: puestoForm.value.nombre,
      estacion_id: puestoForm.value.estacion_id,
      activo: puestoForm.value.activo
    }
    
    console.log('Enviando datos del puesto:', puestoData)
    
    if (editingPuesto.value) {
      // Modo edición
      const response = await puestoService.updatePuesto(editingPuesto.value.id, puestoData)
      if (response.success) {
        showMessage('Puesto actualizado correctamente', 'success')
        closeDialog()
        await loadPuestos() // Recargar la lista de puestos
      } else {
        showMessage(response.message || 'Error al actualizar el puesto', 'error')
      }
    } else {
      // Modo creación
      const response = await puestoService.newPuesto(puestoData)
      
      console.log('Respuesta del servidor:', response)
      
      if (response.success) {
        showMessage('Puesto creado correctamente', 'success')
        closeDialog()
        await loadPuestos() // Recargar la lista de puestos
      } else {
        showMessage(response.message || 'Error al crear el puesto', 'error')
      }
    }
  } catch (error) {
    console.error('Error al guardar puesto:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const deletePuesto = async (puesto) => {
  try {
    deleting.value = true
    const response = await puestoService.deletePuesto(puesto.id)
    if (response.success) {
      showMessage('Puesto eliminado correctamente', 'success')
      await loadPuestos() // Recargar la lista de puestos
    } else {
      showMessage(response.message || 'Error al eliminar el puesto', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar puesto:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    deleting.value = false
  }
}

const refreshData = () => {
  loadPuestos()
}

// Inicialización
onMounted(async () => {
  await loadEstaciones()
  await loadPuestos()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-in;
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

.v-data-table {
  background: transparent !important;
}

.v-data-table__wrapper {
  background: transparent !important;
}
</style>