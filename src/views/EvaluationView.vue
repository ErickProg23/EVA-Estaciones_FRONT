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
            <p class="text-body-2 text-grey-400 mb-0" v-if="datosEvaluacion?.estacion?.nombre">
              {{ datosEvaluacion.estacion.nombre }} - {{ datosEvaluacion.total_empleados || 0 }} empleados en {{ datosEvaluacion.total_puestos || 0 }} puestos
            </p>
          </div>
          <v-chip color="green" variant="outlined">
            {{ aspectosEvaluacion.length }} aspectos
          </v-chip>
        </div>

        <!-- Vista de selección de puesto -->
        <div v-if="!puestoSeleccionado">
          <v-card dark color="#2d2d2d" class="mb-4">
            <v-card-title class="py-3">
              <v-icon class="mr-2" color="green">mdi-briefcase</v-icon>
              Selecciona un puesto para evaluar
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col 
                  v-for="puesto in datosEvaluacion?.puestos_con_empleados || []" 
                  :key="puesto.puesto_id"
                  cols="12" 
                  md="6" 
                  lg="4"
                >
                  <v-card 
                    dark 
                    color="#353535" 
                    hover 
                    @click="seleccionarPuesto(puesto)"
                    class="cursor-pointer transition-all"
                  >
                    <v-card-text class="pa-4">
                      <div class="d-flex align-center justify-space-between mb-3">
                        <h3 class="text-h6 font-weight-bold text-white">
                          {{ puesto.puesto_nombre }}
                        </h3>
                        <v-chip color="green" size="small">
                          {{ puesto.empleados.length }}
                        </v-chip>
                      </div>
                      
                      <div class="empleados-preview">
                        <div 
                          v-for="empleado in puesto.empleados.slice(0, 3)" 
                          :key="empleado.id"
                          class="d-flex align-center mb-2"
                        >
                          <v-avatar size="24" color="green" class="mr-2">
                            <span class="text-caption">{{ getInitials(empleado.nombre) }}</span>
                          </v-avatar>
                          <span class="text-body-2">{{ empleado.nombre }}</span>
                          <v-chip 
                            v-if="!empleado.activo" 
                            color="red" 
                            size="x-small" 
                            class="ml-2"
                          >
                            Inactivo
                          </v-chip>
                        </div>
                        <div v-if="puesto.empleados.length > 3" class="text-caption text-grey-400">
                          +{{ puesto.empleados.length - 3 }} más...
                        </div>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </div>

        <!-- Vista de evaluación por empleado -->
        <div v-else>
          <!-- Breadcrumb y navegación -->
          <v-card dark color="#1e1e1e" class="mb-4">
            <v-card-text class="py-3">
              <div class="d-flex align-center justify-space-between">
                <!-- Progreso del puesto -->
                <div class="flex-grow-1">
                  <div class="d-flex align-center justify-space-between mb-2">
                    <h4 class="text-h6 text-white">{{ puestoSeleccionado.puesto_nombre }}</h4>
                    <span class="text-caption text-grey-400">
                      Empleado {{ empleadoIndex + 1 }} de {{ puestoSeleccionado.empleados.length }}
                    </span>
                  </div>
                  
                  <!-- Barra de progreso del puesto completo -->
                  <v-progress-linear
                    :model-value="progresoPuesto"
                    color="blue"
                    height="8"
                    rounded
                    class="mb-2"
                  ></v-progress-linear>
                  
                  <div class="text-caption text-grey-400 text-center">
                    {{ empleadosCompletados }} de {{ puestoSeleccionado.empleados.length }} empleados evaluados
                  </div>
                </div>
                
                <!-- Navegación automática -->
                <div class="ml-4">
                  <v-btn
                    v-if="!todosEmpleadosCompletados"
                    color="green"
                    @click="siguienteEmpleado"
                    :disabled="!evaluacionCompleta"
                  >
                    <v-icon left>mdi-arrow-right</v-icon>
                    {{ empleadoIndex === puestoSeleccionado.empleados.length - 1 ? 'Finalizar Puesto' : 'Siguiente' }}
                  </v-btn>
                  
                  <v-btn
                    v-else
                    color="success"
                    @click="finalizarPuesto"
                  >
                    <v-icon left>mdi-check-all</v-icon>
                    Puesto Completado
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Evaluación del empleado actual -->
          <v-card dark color="#2d2d2d" v-if="empleadoActual">
            <v-card-title class="py-3">
              <div class="d-flex align-center justify-space-between w-100">
                <div class="d-flex align-center">
                  <v-avatar color="green" class="mr-3">
                    <span>{{ getInitials(getEmpleadoActual()?.nombre || '') }}</span>
                  </v-avatar>
                  <div>
                    <h3 class="text-h6 font-weight-bold text-white mb-1">
                      {{ getEmpleadoActual()?.nombre }}
                    </h3>
                    <p class="text-body-2 text-grey-400 mb-0">
                      Empleado #{{ getEmpleadoActual()?.num_empleado }}
                    </p>
                  </div>
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
            
            <!-- Reemplaza la sección de evaluación con esto -->
            <v-card-text class="pa-2">
              <div class="ultra-compact-evaluation">
                <!-- Header minimalista -->
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-subtitle-1 text-white font-weight-medium">
                    {{ puestoSeleccionado.empleados.find(emp => emp.id === empleadoActual)?.nombre }}
                  </span>
                  <v-chip size="x-small" color="green" variant="outlined">
                    {{ Math.round(progresoEvaluacion) }}%
                  </v-chip>
                </div>

                <!-- Grid ultra compacto -->
                <div class="aspects-ultra-grid">
                  <div 
                    v-for="(aspecto, index) in aspectosEvaluacion" 
                    :key="aspecto.aspecto_id"
                    class="aspect-ultra-row"
                  >
                    <!-- Nombre y peso en una línea -->
                    <div class="aspect-info-inline">
                      <span class="aspect-name-compact">{{ aspecto.aspecto_nombre }}</span>
                      <span class="aspect-weight-compact">({{ aspecto.peso }}%)</span>
                    </div>
                    
                    <!-- Rating inline -->
                    <v-btn-toggle
                      :model-value="evaluaciones[empleadoActual]?.[aspecto.aspecto_id]"
                      color="primary"
                      variant="outlined"
                      density="compact"
                      mandatory
                      class="rating-inline"
                      @update:model-value="updateEvaluacion(aspecto.aspecto_id, $event)"
                    >
                      <v-btn 
                        v-for="rating in 6" 
                        :key="rating - 1"
                        :value="rating - 1"
                        size="x-small"
                        class="rating-btn-ultra"
                        :class="{
                          'selected-rating': evaluaciones[empleadoActual]?.[aspecto.aspecto_id] === (rating - 1)
                        }"
                      >
                        {{ rating - 1 }}
                      </v-btn>
                    </v-btn-toggle>
                  </div>
                </div>

                <!-- Comentarios inline -->
                <v-textarea
                  v-model="comentarios[empleadoActual]"
                  label="Comentarios"
                  rows="2"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="mt-2 compact-textarea"
                ></v-textarea>
              </div>
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
        </div>
        
        <!-- Mensaje cuando no hay datos -->
        <v-card dark color="#2d2d2d" v-if="!datosEvaluacion && !isInitialLoading">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey">mdi-account-search</v-icon>
            <p class="text-h6 mt-4 mb-0">No hay datos de evaluación disponibles</p>
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
import { stationService, empleadoService, evaluacionService, aspectoService } from '@/services/apiService'



// Estados de carga
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)

// Datos principales
const datosEvaluacion = ref(null)
const aspectosEvaluacion = ref([]) // Ahora se cargan dinámicamente por puesto
const usuario_id = sessionStorage.getItem('usuario_id')


// Estados de navegación
const puestoSeleccionado = ref(null)
const empleadoActual = ref(null)
const empleadoIndex = ref(0)

// Evaluaciones y comentarios (organizados por empleado)
const evaluaciones = ref({})
const comentarios = ref({})

// Estados de guardado
const guardandoBorrador = ref(false)
const finalizando = ref(false)

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Computed
const empleadosDelPuesto = computed(() => {
  if (!puestoSeleccionado.value) return []
  
  return puestoSeleccionado.value.empleados
    .filter(emp => emp.activo) // Solo empleados activos
    .map(emp => ({
      title: `${emp.nombre} - #${emp.num_empleado}`,
      value: emp.id
    }))
})

const progresoEvaluacion = computed(() => {
  if (!empleadoActual.value) return 0
  
  const evaluacionesEmpleado = evaluaciones.value[empleadoActual.value] || {}
  const totalAspectos = aspectosEvaluacion.value.length
  const aspectosEvaluados = Object.keys(evaluacionesEmpleado).length
  return totalAspectos > 0 ? (aspectosEvaluados / totalAspectos) * 100 : 0
})

const evaluacionCompleta = computed(() => {
  if (!empleadoActual.value) return false
  
  // ✅ Validar que aspectosEvaluacion sea un array
  if (!Array.isArray(aspectosEvaluacion.value)) {
    console.warn('aspectosEvaluacion no es un array:', aspectosEvaluacion.value)
    return false
  }
  
  const evaluacionesEmpleado = evaluaciones.value[empleadoActual.value] || {}
  return aspectosEvaluacion.value.every(aspecto => 
    evaluacionesEmpleado[aspecto.aspecto_id] !== undefined
  )
})

// Métodos
const getInitials = (nombre) => {
  if (!nombre) return ''
  return nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const getEmpleadoActual = () => {
  if (!puestoSeleccionado.value || !empleadoActual.value) return null
  return puestoSeleccionado.value.empleados.find(emp => emp.id === empleadoActual.value)
}

// Método para cargar aspectos por puesto
const loadAspectosPorPuesto = async (puestoId) => {
  try {
    console.log('🔍 Cargando aspectos para puesto:', puestoId)
    
    const result = await aspectoService.getAspectosPorPuesto(puestoId)
    
    console.log('📦 Respuesta aspectos:', result)

    const aspectos = result.data.aspectos || []
    aspectosEvaluacion.value = aspectos

    console.log('✅ Aspectos asignados:', aspectosEvaluacion.value)


    
  } catch (error) {
    console.error('💥 Error al cargar aspectos:', error)
    showMessage('Error de conexión al cargar aspectos', 'error')
    aspectosEvaluacion.value = []
  }
}

const seleccionarPuesto = async (puesto) => {
  puestoSeleccionado.value = puesto
  
  // Cargar aspectos específicos del puesto
  await loadAspectosPorPuesto(puesto.puesto_id)
  
  // Seleccionar el primer empleado activo
  const primerEmpleadoActivo = puesto.empleados.find(emp => emp.activo)
  if (primerEmpleadoActivo) {
    empleadoActual.value = primerEmpleadoActivo.id
    empleadoIndex.value = puesto.empleados.findIndex(emp => emp.id === primerEmpleadoActivo.id)
  }
}

const volverAPuestos = () => {
  puestoSeleccionado.value = null
  empleadoActual.value = null
  empleadoIndex.value = 0
}

const empleadoAnterior = () => {
  if (empleadoIndex.value > 0) {
    empleadoIndex.value--
    const empleado = puestoSeleccionado.value.empleados[empleadoIndex.value]
    empleadoActual.value = empleado.id
  }
}

const empleadoSiguiente = () => {
  if (empleadoIndex.value < puestoSeleccionado.value.empleados.length - 1) {
    empleadoIndex.value++
    const empleado = puestoSeleccionado.value.empleados[empleadoIndex.value]
    empleadoActual.value = empleado.id
  }
}

const updateEvaluacion = (aspectoId, valor) => {
  if (!empleadoActual.value) return
  
  if (!evaluaciones.value[empleadoActual.value]) {
    evaluaciones.value[empleadoActual.value] = {}
  }
  
  evaluaciones.value[empleadoActual.value][aspectoId] = valor
}

const loadDatosEvaluacion = async () => {
  try {

    // Reemplaza con tu servicio real
    const result = await evaluacionService.get_empleados_by_usuario_estacion(usuario_id)

    
    if (result.success) {
      // Asignar los datos correctamente
      datosEvaluacion.value = {
        estacion: result.data.estacion,
        usuario: result.data.usuario,
        puestos_con_empleados: result.data.puestos_con_empleados,
        total_empleados: result.data.total_empleados,
        total_puestos: result.data.total_puestos
      }
      
    } else {
      console.error('❌ Error en el servicio:', result.message)
      showMessage('Error al cargar los datos de evaluación', 'error')
    }
  } catch (error) {
    console.error('💥 Error al cargar datos de evaluación:', error)
    showMessage('Error de conexión al cargar los datos', 'error')
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
    
    // Limpiar evaluación del empleado actual
    if (empleadoActual.value) {
      delete evaluaciones.value[empleadoActual.value]
      delete comentarios.value[empleadoActual.value]
    }
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
  loadingMessage.value = 'Cargando datos de evaluación...'
  loadingProgress.value = 50
  
  await loadDatosEvaluacion()
  loadingProgress.value = 100
  
  setTimeout(() => {
    isInitialLoading.value = false
  }, 500)
}

// Watchers
watch(empleadoActual, (newVal) => {
  if (newVal && puestoSeleccionado.value) {
    const index = puestoSeleccionado.value.empleados.findIndex(emp => emp.id === newVal)
    if (index !== -1) {
      empleadoIndex.value = index
    }
  }
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

.cursor-pointer {
  cursor: pointer;
}

.transition-all {
  transition: all 0.3s ease;
}

.empleados-preview {
  max-height: 120px;
  overflow-y: auto;
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
.evaluation-grid::-webkit-scrollbar,
.empleados-preview::-webkit-scrollbar {
  width: 6px;
}

.evaluation-grid::-webkit-scrollbar-track,
.empleados-preview::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.evaluation-grid::-webkit-scrollbar-thumb,
.empleados-preview::-webkit-scrollbar-thumb {
  background: #4caf50;
  border-radius: 3px;
}

.evaluation-grid::-webkit-scrollbar-thumb:hover,
.empleados-preview::-webkit-scrollbar-thumb:hover {
  background: #66bb6a;
}

.aspect-weight {
  font-size: 0.75rem;
  color: #b0b0b0;
  margin-top: 4px;
  text-align: center;
}

.rating-btn.rating-excellent {
  border-color: #4caf50 !important;
}

.rating-btn.rating-good {
  border-color: #ff9800 !important;
}

.rating-btn.rating-poor {
  border-color: #f44336 !important;
}

.v-btn-toggle .v-btn.v-btn--active.rating-excellent {
  background-color: #4caf50 !important;
  color: white !important;
}

.v-btn-toggle .v-btn.v-btn--active.rating-good {
  background-color: #ff9800 !important;
  color: white !important;
}

.v-btn-toggle .v-btn.v-btn--active.rating-poor {
  background-color: #f44336 !important;
  color: white !important;
}

.compact-evaluation {
  max-height: 70vh;
  overflow-y: auto;
}

.aspects-compact-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.aspect-compact-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  min-height: 48px;
}

.aspect-compact-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.08);
}

.aspect-name {
  flex: 1;
  display: flex;
  align-items: center;
}

.aspect-rating-compact {
  flex-shrink: 0;
}

.rating-btn-compact {
  min-width: 32px !important;
  height: 32px !important;
  margin: 0 1px;
}

/* Responsive para pantallas pequeñas */
@media (max-width: 768px) {
  .aspect-compact-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .aspect-rating-compact {
    align-self: stretch;
  }
}
</style>

<style scoped>

.ultra-compact-evaluation {
  max-height: 75vh;
  overflow-y: auto;
}

.aspects-ultra-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.aspect-ultra-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
  min-height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.aspect-ultra-row:hover {
  background: rgba(255, 255, 255, 0.08);
}

.aspect-info-inline {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 12px;
}

.aspect-name-compact {
  font-size: 0.875rem;
  color: white;
  font-weight: 500;
}

.aspect-weight-compact {
  font-size: 0.75rem;
  color: #90CAF9;
  font-weight: 400;
}

.rating-inline {
  flex-shrink: 0;
}

.rating-btn-ultra {
  min-width: 28px !important;
  height: 28px !important;
  margin: 0 1px !important;
  font-size: 0.75rem !important;
  font-weight: 600 !important;
}

/* Mejorar visibilidad de selección */
.rating-btn-ultra.selected-rating {
  background: #4CAF50 !important;
  color: white !important;
  border: 2px solid #2E7D32 !important;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4) !important;
  transform: scale(1.05);
}

/* Colores por rating */
.rating-btn-ultra[value="0"].selected-rating,
.rating-btn-ultra[value="1"].selected-rating,
.rating-btn-ultra[value="2"].selected-rating {
  background: #F44336 !important;
  border-color: #C62828 !important;
  box-shadow: 0 0 8px rgba(244, 67, 54, 0.4) !important;
}

.rating-btn-ultra[value="3"].selected-rating {
  background: #FF9800 !important;
  border-color: #E65100 !important;
  box-shadow: 0 0 8px rgba(255, 152, 0, 0.4) !important;
}

.rating-btn-ultra[value="4"].selected-rating,
.rating-btn-ultra[value="5"].selected-rating {
  background: #4CAF50 !important;
  border-color: #2E7D32 !important;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.4) !important;
}

/* Hover effects */
.rating-btn-ultra:hover {
  transform: scale(1.1);
  transition: all 0.2s ease;
}

.compact-textarea {
  font-size: 0.875rem;
}

.compact-textarea .v-field__input {
  min-height: 40px !important;
}

/* Responsive */
@media (max-width: 768px) {
  .aspect-ultra-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 8px;
  }
  
  .aspect-info-inline {
    margin-right: 0;
    margin-bottom: 4px;
  }
  
  .rating-inline {
    align-self: stretch;
  }
}
</style>
