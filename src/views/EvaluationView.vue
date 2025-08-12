<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Evaluación"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-clipboard-check"
      animation-type="particles"
    />

    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <!-- Header compacto -->
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h1 class="text-h5 font-weight-bold text-white mb-1">
              <v-icon class="mr-2" color="green">mdi-clipboard-check</v-icon>
              Evaluación de Personal
            </h1>
          </div>
          <v-chip color="green" variant="outlined">
            {{ aspectosEvaluacion.length }} aspectos
          </v-chip>
        </div>

        <!-- Filtros compactos -->
        <v-card dark color="#2d2d2d" class="mb-4">
          <v-card-text class="py-3">
            <v-row align="center" dense>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedEstacion"
                  :items="estacionOptions"
                  item-title="title"
                  item-value="value"
                  label="Estación"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedEmpleado"
                  :items="empleadoOptions"
                  item-title="title"
                  item-value="value"
                  label="Empleado"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="!selectedEstacion"
                ></v-select>
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="selectedTipoEvaluacion"
                  :items="tiposEvaluacion"
                  item-title="title"
                  item-value="value"
                  label="Tipo de Evaluación"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Evaluación compacta -->
        <v-card dark color="#2d2d2d" v-if="selectedEmpleado">
          <v-card-title class="py-3">
            <div class="d-flex align-center justify-space-between w-100">
              <div>
                <v-icon class="mr-2" color="green">mdi-account</v-icon>
                {{ getEmpleadoNombre(selectedEmpleado) }}
              </div>
              <v-progress-linear
                :model-value="progresoEvaluacion"
                color="green"
                height="6"
                rounded
                class="ml-4"
                style="max-width: 200px;"
              ></v-progress-linear>
            </div>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-0">
            <!-- Lista compacta de aspectos -->
            <div class="evaluation-grid">
              <div 
                v-for="(aspecto, index) in aspectosEvaluacion" 
                :key="aspecto.id"
                class="aspect-row"
                :class="{ 'aspect-row--alternate': index % 2 === 1 }"
              >
                <div class="aspect-info">
                  <span class="aspect-title">{{ aspecto.nombre }}</span>
                  <span class="aspect-description">{{ aspecto.descripcion }}</span>
                </div>
                
                <div class="aspect-rating">
                  <!-- Rating compacto con botones -->
                  <v-btn-toggle
                    v-model="evaluaciones[aspecto.id]"
                    color="green"
                    variant="outlined"
                    density="compact"
                    mandatory
                  >
                    <v-btn 
                      v-for="rating in 6" 
                      :key="rating - 1"
                      :value="rating - 1"
                      size="small"
                      class="rating-btn"
                    >
                      {{ rating - 1 }}
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </div>
            </div>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <!-- Comentarios compactos -->
          <v-card-text>
            <v-textarea
              v-model="comentarios"
              label="Comentarios adicionales"
              variant="outlined"
              rows="3"
              counter="500"
              maxlength="500"
              hide-details="auto"
            ></v-textarea>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <!-- Acciones -->
          <v-card-actions class="pa-4">
            <v-spacer></v-spacer>
            <v-btn
              color="grey"
              variant="outlined"
              @click="guardarBorrador"
              :loading="guardandoBorrador"
            >
              <v-icon left>mdi-content-save-outline</v-icon>
              Guardar Borrador
            </v-btn>
            <v-btn
              color="green"
              @click="finalizarEvaluacion"
              :loading="finalizando"
              :disabled="!evaluacionCompleta"
            >
              <v-icon left>mdi-check</v-icon>
              Finalizar Evaluación
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- Mensaje cuando no hay empleado seleccionado -->
        <v-card dark color="#2d2d2d" v-else>
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey">mdi-account-search</v-icon>
            <p class="text-h6 mt-4 mb-0">Selecciona un empleado para comenzar la evaluación</p>
          </v-card-text>
        </v-card>
      </v-container>
    </div>

    <!-- Snackbar -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import LoadingWave from '@/components/LoadingWave.vue'
import { stationService, empleadoService } from '@/services/apiService'

// Estados de carga
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)

// Datos
const estaciones = ref([])
const empleados = ref([])
const aspectosEvaluacion = ref([
  // Datos de ejemplo - estos vendrán del servicio
  { id: 1, nombre: 'Puntualidad', descripcion: 'Cumplimiento de horarios' },
  { id: 2, nombre: 'Calidad del trabajo', descripcion: 'Estándar de trabajo realizado' },
  { id: 3, nombre: 'Trabajo en equipo', descripcion: 'Colaboración con compañeros' },
  { id: 4, nombre: 'Comunicación', descripcion: 'Habilidades comunicativas' },
  { id: 5, nombre: 'Iniciativa', descripción: 'Proactividad en tareas' },
  { id: 6, nombre: 'Responsabilidad', descripcion: 'Cumplimiento de responsabilidades' },
  { id: 7, nombre: 'Adaptabilidad', descripcion: 'Flexibilidad ante cambios' },
  { id: 8, nombre: 'Conocimiento técnico', descripcion: 'Dominio de herramientas' }
])

// Filtros
const selectedEstacion = ref(null)
const selectedEmpleado = ref(null)
const selectedTipoEvaluacion = ref('mensual')

// Evaluación
const evaluaciones = ref({})
const comentarios = ref('')

// Estados de guardado
const guardandoBorrador = ref(false)
const finalizando = ref(false)

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Usuario actual
const currentUserEstacionId = ref(null)

// Computed
const estacionOptions = computed(() => {
  if (!currentUserEstacionId.value) {
    return estaciones.value.map(estacion => ({
      title: estacion.nombre,
      value: estacion.id
    }))
  }
  
  // Solo la estación del usuario actual
  const estacionUsuario = estaciones.value.find(estacion => 
    estacion.id === currentUserEstacionId.value
  )
  
  return estacionUsuario ? [{
    title: estacionUsuario.nombre,
    value: estacionUsuario.id
  }] : []
})

const empleadoOptions = computed(() => {
  if (!selectedEstacion.value) return []
  
  return empleados.value
    .filter(emp => emp.estacion_id === selectedEstacion.value)
    .map(emp => ({
      title: `${emp.nombre} - ${emp.puesto}`,
      value: emp.id
    }))
})

const tiposEvaluacion = [
  { title: 'Evaluación Mensual', value: 'mensual' },
  { title: 'Evaluación Trimestral', value: 'trimestral' },
  { title: 'Evaluación Anual', value: 'anual' }
]

const progresoEvaluacion = computed(() => {
  const totalAspectos = aspectosEvaluacion.value.length
  const aspectosEvaluados = Object.keys(evaluaciones.value).length
  return totalAspectos > 0 ? (aspectosEvaluados / totalAspectos) * 100 : 0
})

const evaluacionCompleta = computed(() => {
  return aspectosEvaluacion.value.every(aspecto => 
    evaluaciones.value[aspecto.id] !== undefined
  )
})

// Métodos
const getEmpleadoNombre = (empleadoId) => {
  const empleado = empleados.value.find(emp => emp.id === empleadoId)
  return empleado ? empleado.nombre : ''
}

const loadEstaciones = async () => {
  try {
    const result = await stationService.getEstaciones()
    if (result.success) {
      estaciones.value = result.data.filter(est => est.nombre !== 'TODAS')
    }
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
  }
}

const loadEmpleados = async () => {
  try {
    const result = await empleadoService.getEmpleados()
    if (result.success) {
      let empleadosData = result.personal || []
      
      // Filtrar por estación del usuario si no es admin
      if (currentUserEstacionId.value) {
        empleadosData = empleadosData.filter(emp => 
          emp.estacion_id === currentUserEstacionId.value
        )
      }
      
      empleados.value = empleadosData
    }
  } catch (error) {
    console.error('Error al cargar empleados:', error)
  }
}

const guardarBorrador = async () => {
  guardandoBorrador.value = true
  try {
    // Aquí implementarías la llamada al servicio
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulación
    showMessage('Borrador guardado correctamente', 'success')
  } catch (error) {
    showMessage('Error al guardar borrador', 'error')
  } finally {
    guardandoBorrador.value = false
  }
}

const finalizarEvaluacion = async () => {
  finalizando.value = true
  try {
    // Aquí implementarías la llamada al servicio
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simulación
    showMessage('Evaluación finalizada correctamente', 'success')
    
    // Limpiar formulario
    evaluaciones.value = {}
    comentarios.value = ''
    selectedEmpleado.value = null
  } catch (error) {
    showMessage('Error al finalizar evaluación', 'error')
  } finally {
    finalizando.value = false
  }
}

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const initializeData = async () => {
  currentUserEstacionId.value = parseInt(sessionStorage.getItem('estacion_id'))
  
  loadingMessage.value = 'Cargando estaciones...'
  await loadEstaciones()
  loadingProgress.value = 50
  
  loadingMessage.value = 'Cargando empleados...'
  await loadEmpleados()
  loadingProgress.value = 100
  
  setTimeout(() => {
    isInitialLoading.value = false
  }, 500)
}

// Watchers
watch(selectedEstacion, () => {
  selectedEmpleado.value = null
  evaluaciones.value = {}
  comentarios.value = ''
})

watch(selectedEmpleado, () => {
  evaluaciones.value = {}
  comentarios.value = ''
})

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

.evaluation-grid {
  max-height: 60vh;
  overflow-y: auto;
}

.aspect-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #404040;
  transition: background-color 0.2s;
}

.aspect-row:hover {
  background-color: #353535;
}

.aspect-row--alternate {
  background-color: #323232;
}

.aspect-info {
  flex: 1;
  min-width: 0;
}

.aspect-title {
  display: block;
  font-weight: 500;
  color: #ffffff;
  margin-bottom: 2px;
}

.aspect-description {
  display: block;
  font-size: 0.875rem;
  color: #b0b0b0;
}

.aspect-rating {
  margin-left: 16px;
}

.rating-btn {
  min-width: 36px !important;
  width: 36px;
  height: 32px;
}

/* Scrollbar personalizado */
.evaluation-grid::-webkit-scrollbar {
  width: 6px;
}

.evaluation-grid::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.evaluation-grid::-webkit-scrollbar-thumb {
  background: #4caf50;
  border-radius: 3px;
}

.evaluation-grid::-webkit-scrollbar-thumb:hover {
  background: #66bb6a;
}
</style>