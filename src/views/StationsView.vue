<template>
  <div>
    <LoadingWave 
    v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Sistema"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-map-marker-multiple"
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
                  <v-icon class="mr-3" color="green">mdi-map-marker-multiple</v-icon>
                  Gestión de Estaciones
                </h1>
                <p class="text-grey-400 ma-0">Administra las estaciones del sistema EVA</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="openDialog()"
                class="text-none"
              >
                <v-icon left>mdi-plus</v-icon>
                Nueva Estación
              </v-btn>
            </div>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="Buscar estaciones..."
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

            <!-- Tabla de estaciones -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="filteredStations"
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

                  <!-- Template para acciones -->
                  <template #item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="editStation(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        color="red"
                        variant="text"
                        @click="deleteStation(item)"
                      ></v-btn>
                    </div>
                  </template>

                  <!-- Template para cuando no hay datos -->
                  <template #no-data>
                    <div class="text-center pa-4">
                      <v-icon size="48" color="grey">mdi-map-marker-off</v-icon>
                      <p class="text-grey mt-2">No se encontraron estaciones</p>
                    </div>
                  </template>

                  <!-- Template para el footer -->
                  <template #bottom>
                    <div class="d-flex align-center justify-space-between pa-4">
                      <div class="text-caption text-grey">
                        Mostrando {{ filteredStations.length }} de {{ stations.length }} estaciones
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
    
    <!-- Dialog para agregar/editar estación -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card dark color="#2d2d2d">
        <v-card-title>
          <v-icon left color="green">mdi-map-marker-plus</v-icon>
          {{ editingStation ? 'Editar Estación' : 'Nueva Estación' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="stationForm.nombre"
                  label="Nombre de la estación"
                  variant="outlined"
                  dark
                  required
                  :rules="[v => !!v || 'El nombre es requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-switch
                  v-model="stationForm.activo"
                  label="Estación activa"
                  color="green"
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
            color="green" 
            variant="flat" 
            @click="saveStation"
            :loading="saving"
            :disabled="!formValid"
          >
            {{ editingStation ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmación para eliminar -->
    <v-dialog v-model="showDeleteDialog" max-width="400px">
      <v-card dark color="#2d2d2d">
        <v-card-title>
          <v-icon left color="red">mdi-delete</v-icon>
          Confirmar eliminación
        </v-card-title>
        
        <v-card-text>
          ¿Estás seguro de que deseas eliminar la estación "{{ stationToDelete?.nombre }}"?
          Esta acción no se puede deshacer.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            variant="text" 
            @click="showDeleteDialog = false"
          >
            Cancelar
          </v-btn>
          <v-btn 
            color="red" 
            variant="flat" 
            @click="confirmDelete"
            :loading="deleting"
          >
            Eliminar
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
import { stationService } from '@/services/apiService'

// Estado del componente
const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const selectedStatus = ref(null)
const editingStation = ref(null)
const stationToDelete = ref(null)
const formValid = ref(false)
const search = ref('')

// Estados de carga inicial
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  estaciones: false
})

// Datos de estaciones
const stations = ref([])

const stationForm = ref({
  nombre: '',
  activo: true
})

const statusOptions = [
  { value: true, title: 'Activo' },
  { value: false, title: 'Inactivo' }
]

// Headers de la tabla
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
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

// Función para cargar estaciones
const loadStations = async () => {
  try {
    loadingMessage.value = 'Cargando estaciones...'
    loading.value = true
    
    const result = await stationService.getEstaciones()
    
    if (result.success) {
      stations.value = result.data
      console.log('Estaciones cargadas:', result.data)
    } else {
      console.warn('No se pudieron cargar las estaciones:', result.message)
      showMessage('Error al cargar estaciones', 'error')
    }
    
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
    
    if (!isInitialLoading.value) {
      showMessage('Estaciones cargadas correctamente', 'success')
    }
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
    showMessage('Error al conectar con el servidor', 'error')
    
    dataLoadingStates.value.estaciones = true
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

// Computed para filtrar estaciones
const filteredStations = computed(() => {
  let filtered = stations.value
  
  if (selectedStatus.value !== null && selectedStatus.value !== undefined) {
    filtered = filtered.filter(station => station.activo === selectedStatus.value)
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

const openDialog = () => {
  editingStation.value = null
  clearForm()
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  editingStation.value = null
}

const clearForm = () => {
  stationForm.value = {
    nombre: '',
    activo: true
  }
}

const editStation = (station) => {
  editingStation.value = station
  stationForm.value = {
    nombre: station.nombre,
    activo: station.activo
  }
  showAddDialog.value = true
}

const saveStation = async () => {
  if (!formValid.value) return
  
  try {
    saving.value = true
    
    const stationData = {
      nombre: stationForm.value.nombre,
      activo: stationForm.value.activo
    }

    let result
    if (editingStation.value) {
      // Actualizar estación existente
      result = await stationService.updateEstacion(editingStation.value.id, stationData)
    } else {
      // Crear nueva estación
      result = await stationService.createEstacion(stationData)
    }
    
    if (result.success) {
      showMessage(
        editingStation.value ? 'Estación actualizada correctamente' : 'Estación creada correctamente',
        'success'
      )
      closeDialog()
      await loadStations()
    } else {
      showMessage(result.message || 'Error al guardar la estación', 'error')
    }
  } catch (error) {
    console.error('Error al guardar estación:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    saving.value = false
  }
}

const deleteStation = (station) => {
  stationToDelete.value = station
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!stationToDelete.value) return
  
  try {
    deleting.value = true
    
    const result = await stationService.deleteEstacion(stationToDelete.value.id)
    
    if (result.success) {
      showMessage('Estación eliminada correctamente', 'success')
      showDeleteDialog.value = false
      stationToDelete.value = null
      await loadStations()
    } else {
      showMessage(result.message || 'Error al eliminar la estación', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar estación:', error)
    showMessage('Error al conectar con el servidor', 'error')
  } finally {
    deleting.value = false
  }
}

const refreshData = async () => {
  await loadStations()
}

// Inicialización
const initializeData = async () => {
  loadingMessage.value = 'Inicializando sistema...'
  loadingProgress.value = 0
  
  try {
    await loadStations()
  } catch (error) {
    console.error('Error al inicializar datos:', error)
    showMessage('Error al cargar datos del sistema', 'error')
    isInitialLoading.value = false
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

.loading-content {
  max-width: 400px;
}

.loading-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-subtitle {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.loading-progress {
  margin-bottom: 1rem;
}

.progress-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.7;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

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

/* Estilos para la tabla */
.v-data-table {
  background: transparent !important;
}

.v-data-table ::v-deep(.v-data-table__wrapper) {
  background: transparent;
}

.v-data-table ::v-deep(th) {
  background: #1e1e1e !important;
  color: white !important;
  border-bottom: 1px solid #333 !important;
}

.v-data-table ::v-deep(td) {
  border-bottom: 1px solid #333 !important;
}

.v-data-table ::v-deep(tr:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}
</style>