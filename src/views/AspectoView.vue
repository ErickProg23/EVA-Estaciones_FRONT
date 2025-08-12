<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Aspectos"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-clipboard-list"
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
                  <v-icon class="mr-3" color="green">mdi-clipboard-list</v-icon>
                  Gestión de Aspectos
                </h1>
                <p class="text-grey-400 ma-0">Administra los aspectos de evaluación del sistema EVA</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="openDialog()"
                class="text-none"
              >
                <v-icon left>mdi-plus</v-icon>
                Nuevo Aspecto
              </v-btn>
            </div>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="search"
                      label="Buscar aspectos..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
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

            <!-- Tabla de aspectos -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                    :headers="headers"
                    :items="aspectos"
                    :search="search"
                    :loading="loading"
                    loading-text="Cargando aspectos..."
                    no-data-text="No hay aspectos disponibles"
                    items-per-page="10"
                    class="elevation-0"
                    dark
                  >
                  <!-- Slot para estado activo -->
                  <template v-slot:item.activo="{ item }">
                    <v-chip
                      :color="getStatusColor(item.activo)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(item.activo) }}
                    </v-chip>
                  </template>

                  <!-- Slot para acciones -->
                  <template v-slot:item.actions="{ item }">
                    <div class="d-flex gap-2">
                      <v-btn
                        icon="mdi-pencil"
                        size="small"
                        color="blue"
                        variant="text"
                        @click="editAspecto(item)"
                      >
                        <v-icon>mdi-pencil</v-icon>
                        <v-tooltip activator="parent" location="top">
                          Editar aspecto
                        </v-tooltip>
                      </v-btn>
                      
                      <!-- ✅ Nuevo botón para configurar pesos -->
                      <v-btn
                        icon="mdi-weight"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="openPesosDialog(item)"
                      >
                        <v-icon>mdi-weight</v-icon>
                        <v-tooltip activator="parent" location="top">
                          Configurar pesos por puesto
                        </v-tooltip>
                      </v-btn>
                    </div>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Dialog para agregar/editar aspecto -->
    <v-dialog v-model="showAddDialog" max-width="600px" persistent>
      <v-card dark color="#2d2d2d">
        <v-card-title class="text-h5 pa-6">
          <v-icon class="mr-3" color="green">mdi-clipboard-list</v-icon>
          {{ editingAspecto ? 'Editar Aspecto' : 'Nuevo Aspecto' }}
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">
          <v-form ref="form" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="aspectoForm.nombre"
                  label="Nombre del aspecto"
                  variant="outlined"
                  :rules="[rules.required]"
                  required
                ></v-text-field>
              </v-col>
              
              <!-- ✅ Remover el campo de peso del formulario -->
              
              <v-col cols="12">
                <v-switch
                  v-model="aspectoForm.activo"
                  label="Aspecto activo"
                  color="green"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            @click="closeDialog"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="green"
            @click="saveAspecto"
            :loading="saving"
            :disabled="!formValid"
          >
            {{ editingAspecto ? 'Actualizar' : 'Guardar' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ✅ Modal para configurar pesos por puesto -->
    <v-dialog v-model="showPesosDialog" max-width="900px" persistent>
      <v-card dark color="#2d2d2d">
        <v-card-title class="text-h5 pa-6">
          <v-icon class="mr-3" color="orange">mdi-weight</v-icon>
          Configurar Pesos - {{ selectedAspecto?.nombre }}
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="pa-6">        
          <v-data-table
            :headers="pesosHeaders"
            :items="puestosPesos"
            :loading="loadingPesos"
            loading-text="Cargando puestos..."
            no-data-text="No hay puestos disponibles"
            class="elevation-0"
            dark
          >
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
                  v => v >= 0 || 'Debe ser mayor o igual a 0',
                  v => Number.isInteger(Number(v)) || 'Debe ser un número entero'
                ]"
                hide-details="auto"
                @blur="markPesoAsModified(item)"
              ></v-text-field>
            </template>
            
            <template v-slot:item.estado="{ item }">
              <v-chip
                :color="getEstadoPesoColor(item)"
                size="small"
                variant="flat"
              >
                <v-icon left size="small">
                  {{ getEstadoPesoIcon(item) }}
                </v-icon>
                {{ getEstadoPesoText(item) }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            @click="closePesosDialog"
            :disabled="savingPesos"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="orange"
            @click="savePesos"
            :loading="savingPesos"
            :disabled="!hasModifiedPesos"
          >
            Guardar Pesos
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
import { aspectoService, puestoService } from '@/services/apiService' // ✅ Descomenta esta línea

// Estados de carga inicial
const isInitialLoading = ref(true)
const showPesosDialog = ref(false)
const selectedAspecto = ref(null)
const puestosPesos = ref([])
const loadingPesos = ref(false)
const savingPesos = ref(false)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  aspectos: false,
})

// Estados generales
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const selectedCategoria = ref(null)

// Datos
const aspectos = ref([])

// Headers para la tabla de pesos
const pesosHeaders = [
  { title: 'Puesto', key: 'nombre', sortable: true },
  { title: 'Peso', key: 'peso', sortable: false, align: 'center' },
  { title: 'Estado', key: 'estado', sortable: false, align: 'center' }
]

// Computed para verificar si hay pesos modificados
// Agregar esta computed property
const hasModifiedPesos = computed(() => {
  return puestosPesos.value.some(item => item.modified)
})

// ✅ Nuevas funciones para manejar pesos
const openPesosDialog = async (aspecto) => {
  selectedAspecto.value = aspecto
  showPesosDialog.value = true
  await loadPuestosPesos(aspecto.id)
}

const closePesosDialog = () => {
  showPesosDialog.value = false
  selectedAspecto.value = null
  puestosPesos.value = []
}

const loadPuestosPesos = async (aspectoId) => {
  loadingPesos.value = true
  try {
    // Primero cargar todos los puestos
    const puestosResult = await puestoService.getPuestos()
    
    if (puestosResult.success) {
      const puestosConPesos = []
      
      // ✅ SIEMPRE procesar TODOS los puestos
      for (const puesto of puestosResult.puestos) {
        let pesoActual = 0
        let tienePesoAsignado = false
        
        try {
          // Intentar obtener los aspectos de este puesto
          const aspectosResult = await aspectoService.getAspectosByPuesto(puesto.id)
          
          if (aspectosResult.success && aspectosResult.data) {
            // Buscar el aspecto específico en este puesto
            const aspectoEnPuesto = aspectosResult.data.find(a => a.id === aspectoId)
            
            if (aspectoEnPuesto) {
              pesoActual = aspectoEnPuesto.peso || 0
              tienePesoAsignado = true
            }
          }
        } catch (error) {
          console.warn(`No se pudieron cargar aspectos para puesto ${puesto.nombre}:`, error)
          // No hacer nada, mantener peso en 0 y tienePesoAsignado en false
        }
        
        // ✅ SIEMPRE agregar el puesto, tenga o no peso asignado
        puestosConPesos.push({
          id: puesto.id,
          nombre: puesto.nombre,
          peso: pesoActual,
          tiene_peso_asignado: tienePesoAsignado,
          modified: false,
          originalPeso: pesoActual
        })
      }
      
      puestosPesos.value = puestosConPesos
      
      // ✅ Mensaje más informativo
      const puestosConPeso = puestosConPesos.filter(p => p.tiene_peso_asignado).length
      const totalPuestos = puestosConPesos.length
      
      if (puestosConPeso === 0) {
        showMessage(`${totalPuestos} puestos cargados. Ninguno tiene peso asignado para este aspecto.`, 'info')
      } else {
        showMessage(`${totalPuestos} puestos cargados. ${puestosConPeso} ya tienen peso asignado.`, 'success')
      }
      
    } else {
      showMessage('Error al cargar puestos', 'error')
    }
  } catch (error) {
    console.error('Error al cargar pesos:', error)
    showMessage('Error al cargar pesos por puesto', 'error')
  } finally {
    loadingPesos.value = false
  }
}

const markPesoAsModified = (item) => {
  // Solo marcar como modificado si realmente cambió
  item.modified = (item.peso !== item.originalPeso)
}

const getEstadoPesoColor = (item) => {
  if (!item.tiene_peso_asignado && item.peso === 0) return 'grey'
  if (item.modified) return 'warning'
  return 'success'
}

const getEstadoPesoIcon = (item) => {
  if (!item.tiene_peso_asignado && item.peso === 0) return 'mdi-help'
  if (item.modified) return 'mdi-pencil'
  return 'mdi-check'
}

const getEstadoPesoText = (item) => {
  if (!item.tiene_peso_asignado && item.peso === 0) return 'Sin configurar'
  if (item.modified) return 'Modificado'
  return 'Guardado'
}

const savePesos = async () => {
  savingPesos.value = true
  try {
    const modifiedPesos = puestosPesos.value.filter(item => item.modified)
    let successCount = 0
    let errorCount = 0
    
    for (const peso of modifiedPesos) {
      // ✅ Usar el servicio real de aspectos
      const result = await aspectoService.updatePesoAspectoPuesto(
        peso.id, // puesto_id
        selectedAspecto.value.id, // aspecto_id
        peso.peso // peso
      )
      
      if (result.success) {
        peso.modified = false
        peso.originalPeso = peso.peso
        peso.tiene_peso_asignado = true // Ahora ya tiene peso asignado
        successCount++
      } else {
        console.error(`Error al actualizar peso del puesto ${peso.nombre}:`, result.message)
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
    showMessage('Error al guardar pesos', 'error')
  } finally {
    savingPesos.value = false
  }
}

// ✅ Actualizar clearForm para remover peso
const clearForm = () => {
  aspectoForm.value = {
    nombre: '',
    descripcion: '',
    activo: true
  }
}

// ✅ Actualizar editAspecto para remover peso
const editAspecto = (aspecto) => {
  editingAspecto.value = aspecto
  aspectoForm.value = {
    nombre: aspecto.nombre,
    descripcion: aspecto.descripcion,
    activo: aspecto.activo
  }
  showAddDialog.value = true
}


// Dialog y formulario
const showAddDialog = ref(false)
const editingAspecto = ref(null)
const formValid = ref(false)
const aspectoForm = ref({
  nombre: '',
  descripcion: '',
  peso: 1,
  activo: true
})

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Reglas de validación
const rules = {
  required: (value) => !!value || 'Este campo es requerido'
}

// Headers de la tabla - 
const headers = [
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

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

const loadAspectos = async () => {
  try {
    loadingMessage.value = 'Cargando aspectos...'
    
    // ✅ Usar el servicio real
    const result = await aspectoService.getAspectos()
    
    if (result.success) {
      aspectos.value = result.data
    } else {
      console.error('Error al cargar aspectos:', result.message)
      showMessage(result.message || 'Error al cargar aspectos', 'error')
    }
    
    dataLoadingStates.value.aspectos = true
    updateLoadingProgress()
    
    if (!isInitialLoading.value) {
      showMessage('Aspectos cargados correctamente', 'success')
    }
  } catch (error) {
    console.error('Error al cargar aspectos:', error)
    showMessage('Error al cargar aspectos', 'error')
    
    dataLoadingStates.value.aspectos = true
    updateLoadingProgress()
  }
}

const initializeData = async () => {
  await loadAspectos()
}

const refreshData = async () => {
  loading.value = true
  await loadAspectos()
  loading.value = false
}

const openDialog = () => {
  editingAspecto.value = null
  clearForm()
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  editingAspecto.value = null
}

const saveAspecto = async () => {
  saving.value = true
  
  try {
    if (!formValid.value) {
      showMessage('Por favor complete todos los campos', 'warning')
      return
    }

    const aspectoData = {
      nombre: aspectoForm.value.nombre,
      activo: aspectoForm.value.activo
    }

    let success = false
    let errorMessage = ''

    if (editingAspecto.value) {
      // Actualizar aspecto existente
      try {
        const result = await aspectoService.updateAspecto(editingAspecto.value.id, aspectoData)
        
        // ✅ Cambiar la condición para manejar success undefined
        if (result.success !== false && result.message) {
          const index = aspectos.value.findIndex(a => a.id === editingAspecto.value.id)
          if (index !== -1) {
            aspectos.value[index] = { ...aspectos.value[index], ...aspectoData }
          }
          showMessage('Aspecto actualizado correctamente', 'success')
          success = true
        } else {
          errorMessage = result.message || 'Error al actualizar aspecto'
        }
      } catch (error) {
        console.error('Error en updateAspecto:', error)
        errorMessage = error.response?.data?.message || error.message || 'Error al actualizar aspecto'
      }
    } else {
      // Crear nuevo aspecto
      try {
        const result = await aspectoService.createAspecto(aspectoData)
        console.log('Resultado completo:', result) // Para debug
        
        // ✅ CLAVE: Cambiar la condición aquí
        // Si hay message y no hay error explícito, considerarlo éxito
        if (result.message && result.message.includes('exitosamente')) {
          await loadAspectos() // Recargar la lista
          showMessage('Aspecto creado correctamente', 'success')
          success = true
        } else {
          errorMessage = result.message || 'Error al crear aspecto'
        }
      } catch (error) {
        console.error('Error en createAspecto:', error)
        errorMessage = error.response?.data?.message || error.message || 'Error al crear aspecto'
      }
    }
    
    // Mostrar error si lo hay
    if (errorMessage && !success) {
      showMessage(errorMessage, 'error')
    }
    
    // ✅ Solo cerrar el diálogo si la operación fue exitosa
    if (success) {
      closeDialog()
    }
    
  } catch (error) {
    console.error('Error general al guardar aspecto:', error)
    showMessage('Error inesperado al guardar aspecto', 'error')
  } finally {
    saving.value = false
  }
}

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
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
