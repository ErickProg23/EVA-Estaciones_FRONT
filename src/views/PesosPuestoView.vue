<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Configuración"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-weight"
      animation-type="particles"
    />

    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <!-- Header -->
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="orange">mdi-weight</v-icon>
                  Configuración de Pesos por Puesto
                </h1>
                <p class="text-grey-400 ma-0">Configura los pesos de evaluación para cada aspecto según el puesto</p>
              </div>
            </div>

            <!-- Selector de puesto -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-select
                      v-model="selectedPuesto"
                      :items="puestoOptions"
                      item-title="nombre"
                      item-value="id"
                      label="Seleccionar Puesto"
                      variant="outlined"
                      density="compact"
                      @update:model-value="loadAspectosByPuesto"
                      :loading="loadingPuestos"
                    >
                      <template v-slot:prepend-inner>
                        <v-icon>mdi-account-tie</v-icon>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-btn
                      color="info"
                      variant="outlined"
                      @click="refreshData"
                      :loading="loading"
                      :disabled="!selectedPuesto"
                      block
                    >
                      <v-icon left>mdi-refresh</v-icon>
                      Actualizar
                    </v-btn>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-btn
                      color="success"
                      @click="saveAllPesos"
                      :loading="saving"
                      :disabled="!hasModifiedPesos || !selectedPuesto"
                      block
                    >
                      <v-icon left>mdi-content-save</v-icon>
                      Guardar Cambios ({{ modifiedCount }})
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Tabla de aspectos con pesos -->
            <v-card dark color="#2d2d2d" v-if="selectedPuesto">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="aspectosPesos"
                  :loading="loading"
                  loading-text="Cargando aspectos..."
                  no-data-text="No hay aspectos disponibles para este puesto"
                  items-per-page="15"
                  class="elevation-0"
                  dark
                >
                  <template v-slot:item.tipo="{ item }">
                    <v-chip
                      :color="getCategoriaColor(item.tipo)"
                      variant="tonal"
                      size="small"
                    >
                      {{ getCategoriaNombre(item.tipo) }}
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

                  <template v-slot:item.peso="{ item }">
                    <v-text-field
                      v-model.number="item.peso"
                      type="number"
                      density="compact"
                      variant="outlined"
                      min="0"
                      step="1"
                      :rules="[
                        v => v !== null && v !== undefined && v !== '' || 'Requerido',
                        v => v >= 0 || 'Debe ser ≥ 0',
                        v => Number.isInteger(Number(v)) || 'Debe ser entero'
                      ]"
                      hide-details="auto"
                      @input="markAsModified(item)"
                      style="max-width: 120px;"
                    ></v-text-field>
                  </template>

                  <template v-slot:item.estado="{ item }">
                    <v-chip
                      :color="getEstadoColor(item)"
                      size="small"
                      variant="flat"
                    >
                      <v-icon left size="small">
                        {{ getEstadoIcon(item) }}
                      </v-icon>
                      {{ getEstadoText(item) }}
                    </v-chip>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>

            <!-- Mensaje cuando no hay puesto seleccionado -->
            <v-card dark color="#2d2d2d" v-else>
              <v-card-text class="text-center py-12">
                <v-icon size="64" color="grey">mdi-account-tie</v-icon>
                <h3 class="text-h6 mt-4 mb-2">Selecciona un puesto</h3>
                <p class="text-grey-400">Elige un puesto para configurar los pesos de sus aspectos de evaluación</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

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
import { aspectoService, puestoService } from '@/services/apiService'

// Estados de carga
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const loading = ref(false)
const loadingPuestos = ref(false)
const saving = ref(false)

// Datos
const selectedPuesto = ref(null)
const puestoOptions = ref([])
const aspectosPesos = ref([])
const originalPesos = ref({})

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Headers de la tabla
const headers = [
  { title: 'Aspecto', key: 'nombre', sortable: true },
  { title: 'Categoría', key: 'tipo', sortable: true },
  { title: 'Peso', key: 'peso', sortable: false, align: 'center' },
  { title: 'Estado Aspecto', key: 'activo', sortable: true },
  { title: 'Estado Cambio', key: 'estado', sortable: false, align: 'center' }
]

// Computed
const hasModifiedPesos = computed(() => {
  return aspectosPesos.value.some(item => item.modified)
})

const modifiedCount = computed(() => {
  return aspectosPesos.value.filter(item => item.modified).length
})

// Funciones auxiliares
const getCategoriaNombre = (tipoId) => {
  const categorias = {
    1: 'Operativo',
    2: 'Administrativo'
  }
  return categorias[tipoId] || 'Sin categoría'
}

const getCategoriaColor = (tipoId) => {
  const colors = {
    1: 'blue',
    2: 'green'
  }
  return colors[tipoId] || 'grey'
}

const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

// Funciones principales
const loadPuestos = async () => {
  loadingPuestos.value = true
  try {
    const result = await puestoService.getPuestos()
    
    if (result.success) {
      puestoOptions.value = result.data
    } else {
      // Fallback con datos simulados si el servicio no está disponible
      console.warn('Servicio de puestos no disponible, usando datos simulados')
      puestoOptions.value = [
        { id: 1, nombre: 'Gerente General' },
        { id: 2, nombre: 'Supervisor' },
        { id: 3, nombre: 'Operador' },
        { id: 4, nombre: 'Auxiliar' }
      ]
    }
  } catch (error) {
    console.error('Error al cargar puestos:', error)
    showMessage('Error al cargar puestos', 'error')
    
    // Fallback con datos simulados
    puestoOptions.value = [
      { id: 1, nombre: 'Gerente General' },
      { id: 2, nombre: 'Supervisor' },
      { id: 3, nombre: 'Operador' },
      { id: 4, nombre: 'Auxiliar' }
    ]
  } finally {
    loadingPuestos.value = false
  }
}

const loadAspectosByPuesto = async () => {
  if (!selectedPuesto.value) return
  
  loading.value = true
  try {
    // ✅ Usar tu endpoint del backend
    const result = await aspectoService.getAspectosByPuesto(selectedPuesto.value)
    
    if (result.success) {
      aspectosPesos.value = result.data.map(aspecto => ({
        ...aspecto,
        modified: false,
        originalPeso: aspecto.peso
      }))
      
      // Guardar pesos originales para comparación
      originalPesos.value = {}
      result.data.forEach(aspecto => {
        originalPesos.value[aspecto.id] = aspecto.peso
      })
      
      showMessage(`${result.data.length} aspectos cargados correctamente`, 'success')
    } else {
      showMessage(result.message || 'Error al cargar aspectos', 'error')
    }
  } catch (error) {
    console.error('Error al cargar aspectos:', error)
    showMessage('Error al cargar aspectos del puesto', 'error')
  } finally {
    loading.value = false
  }
}

// ✅ Nuevas funciones para manejar el estado
const getEstadoColor = (item) => {
  if (!item.tiene_peso_asignado) return 'warning'
  return item.modified ? 'info' : 'success'
}

const getEstadoIcon = (item) => {
  if (!item.tiene_peso_asignado) return 'mdi-alert'
  return item.modified ? 'mdi-pencil' : 'mdi-check'
}

const getEstadoText = (item) => {
  if (!item.tiene_peso_asignado) return 'Sin peso'
  return item.modified ? 'Modificado' : 'Guardado'
}

// ✅ Actualizar markAsModified para manejar aspectos sin peso inicial
const markAsModified = (item) => {
  if (!item.tiene_peso_asignado) {
    // Si es un aspecto nuevo sin peso, marcarlo como modificado cuando se asigne un peso > 0
    item.modified = (item.peso > 0)
  } else {
    // Si ya tenía peso, comparar con el original
    item.modified = (item.peso !== item.originalPeso)
  }
}

const saveAllPesos = async () => {
  saving.value = true
  try {
    const modifiedItems = aspectosPesos.value.filter(item => item.modified)
    let successCount = 0
    let errorCount = 0
    
    for (const item of modifiedItems) {
      // ✅ Usar tu endpoint para actualizar peso
      const result = await aspectoService.updatePesoAspectoPuesto(
        selectedPuesto.value, 
        item.id, 
        item.peso
      )
      
      if (result.success) {
        item.modified = false
        item.originalPeso = item.peso
        originalPesos.value[item.id] = item.peso
        successCount++
      } else {
        console.error(`Error al actualizar peso del aspecto ${item.nombre}:`, result.message)
        errorCount++
      }
    }
    
    if (errorCount === 0) {
      showMessage(`${successCount} pesos actualizados correctamente`, 'success')
    } else if (successCount > 0) {
      showMessage(`${successCount} pesos actualizados, ${errorCount} errores`, 'warning')
    } else {
      showMessage('Error al actualizar los pesos', 'error')
    }
    
  } catch (error) {
    console.error('Error al guardar pesos:', error)
    showMessage('Error al guardar los cambios', 'error')
  } finally {
    saving.value = false
  }
}

const refreshData = async () => {
  await loadAspectosByPuesto()
}

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const initializeData = async () => {
  loadingMessage.value = 'Cargando puestos...'
  loadingProgress.value = 50
  await loadPuestos()
  
  loadingProgress.value = 100
  setTimeout(() => {
    isInitialLoading.value = false
  }, 500)
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.v-data-table {
  background-color: transparent !important;
}

.v-data-table ::v-deep(.v-data-table__wrapper) {
  background-color: transparent;
}

.v-data-table ::v-deep(th) {
  background-color: #1a1a1a !important;
  color: white !important;
  font-weight: 600;
}

.v-data-table ::v-deep(td) {
  border-bottom: 1px solid #404040 !important;
}

.v-data-table ::v-deep(tr:hover) {
  background-color: #353535 !important;
}
</style>