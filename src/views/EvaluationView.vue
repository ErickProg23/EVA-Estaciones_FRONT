<template>
  <div class="evaluation-container">
    <!-- Pantalla de carga inicial -->
    <div v-if="loading" class="loading-screen">
      <v-progress-circular
        indeterminate
        color="success"
        size="64"
      ></v-progress-circular>
      <p class="mt-4 text-h6">{{ loadingMessage }}</p>
    </div>

    <!-- Contenido principal -->
    <div v-else class="main-content">
      <!-- Encabezado compacto -->
      <v-card dark color="#2d2d2d" class="mb-3" elevation="2">
        <v-card-text class="py-2">
          <div class="d-flex align-center justify-space-between">
            <div>
              <h3 class="text-h6 mb-1">Evaluación de Empleados</h3>
              <p class="text-caption text-grey-lighten-1 mb-0">
                {{ datosUsuario.estacion?.nombre || 'Estación' }} - {{ datosUsuario.usuario?.nombre || 'Usuario' }}
              </p>
            </div>
            <v-chip color="success" size="small" variant="outlined">
              {{ datosUsuario.total_empleados || 0 }} empleados
            </v-chip>
          </div>
        </v-card-text>
      </v-card>

      <!-- Banner de período de evaluación -->
      <v-alert
        v-if="periodoEvaluacion"
        :type="puedeEvaluar ? 'info' : 'warning'"
        :icon="puedeEvaluar ? 'mdi-calendar-check' : 'mdi-calendar-alert'"
        class="mb-4"
        prominent
      >
        <v-row align="center">
          <v-col>
            <div class="text-h6">
              {{ puedeEvaluar ? 'Período de Evaluación Activo' : 'Fuera del Período de Evaluación' }}
            </div>
            <div class="text-body-1">
              {{ mensajePerido }}
            </div>
            <div class="text-caption mt-1" v-if="puedeEvaluar">
              Fecha límite: {{ periodoEvaluacion.fechaLimite.toLocaleDateString('es-ES', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) }}
            </div>
          </v-col>
          <v-col cols="auto" v-if="puedeEvaluar">
            <v-chip
              :color="periodoEvaluacion.diasRestantes <= 3 ? 'error' : 'primary'"
              variant="elevated"
            >
              {{ periodoEvaluacion.diasRestantes }} días restantes
            </v-chip>
          </v-col>
        </v-row>
      </v-alert>

  
      <div v-if="!puestoSeleccionado">
        <v-row>
          <v-col
            v-for="puesto in datosUsuario.puestos_con_empleados"
            :key="puesto.puesto_id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              dark
              :color="puestosCompletados.has(puesto.puesto_id) ? '#1b5e20' : '#2d2d2d'"
              class="puesto-card"
              hover
              @click="seleccionarPuesto(puesto)"
            >
              <v-card-text class="text-center py-4 position-relative">
                <!-- Indicador de completado -->
                <v-icon
                  v-if="puestosCompletados.has(puesto.puesto_id)"
                  color="success"
                  size="24"
                  class="completion-badge"
                >
                  mdi-check-circle
                </v-icon>
                
                <v-icon size="48" color="success" class="mb-2">
                  mdi-account-group
                </v-icon>
                <h4 class="text-h6 mb-2">{{ puesto.puesto_nombre }}</h4>
                <v-chip color="success" size="small" variant="outlined">
                  {{ puesto.empleados.length }} empleados
                </v-chip>
                <v-chip
                  v-if="puestosCompletados.has(puesto.puesto_id)"
                  color="success"
                  size="small"
                  variant="flat"
                >
                  Completado
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Vista de evaluación por empleado -->
      <div v-else class="evaluation-view">
        <!-- Mini barra de progreso -->
        <v-card dark color="#2d2d2d" class="mb-2" elevation="1">
          <v-card-text class="py-2">
            <div class="d-flex align-center justify-space-between mb-2">
              <v-btn
                icon="mdi-arrow-left"
                size="small"
                color="success"
                variant="text"
                @click="volverAPuestos"
              ></v-btn>
              <div class="text-center">
                <p class="text-caption mb-0">{{ puestoSeleccionado.puesto_nombre }}</p>
                <p class="text-caption text-success">
                  {{ empleadoActualIndex + 1 }} de {{ puestoSeleccionado.empleados.length }}
                </p>
              </div>
              <v-chip color="success" size="x-small" variant="outlined">
                {{ Math.round(progresoGeneral) }}%
              </v-chip>
            </div>
            <v-progress-linear
              :model-value="progresoGeneral"
              color="success"
              height="4"
              rounded
            ></v-progress-linear>
          </v-card-text>
        </v-card>

        <!-- Tarjeta de empleado compacta -->
        <v-card dark color="#2d2d2d" class="mb-3" elevation="2">
          <v-card-text class="py-3">
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-avatar color="success" size="40" class="mr-3">
                  <span class="text-h6">{{ getInitials(empleadoActual.nombre) }}</span>
                </v-avatar>
                <div>
                  <h4 class="text-h6 mb-0">{{ empleadoActual.nombre }}</h4>
                  <p class="text-caption text-grey-lighten-1 mb-0">
                    #{{ empleadoActual.num_empleado }}
                  </p>
                </div>
              </div>
              <div class="d-flex gap-2">
                <v-btn
                  icon="mdi-chevron-left"
                  size="small"
                  color="success"
                  variant="outlined"
                  :disabled="empleadoActualIndex === 0"
                  @click="empleadoAnterior"
                ></v-btn>
                <v-btn
                  icon="mdi-chevron-right"
                  size="small"
                  color="success"
                  variant="outlined"
                  :disabled="empleadoActualIndex === puestoSeleccionado.empleados.length - 1"
                  @click="empleadoSiguiente"
                ></v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Banner de solo lectura - Movido fuera del bucle -->
      <v-alert
        v-if="modoSoloLectura"
        type="info"
        variant="tonal"
        class="mb-4"
        prominent
      >
        <v-icon>mdi-lock</v-icon>
        <strong>Evaluación Completada</strong>
        <div class="mt-2">
          Esta evaluación fue enviada el {{ new Date(fechaCompletado).toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
          }) }} y ya no puede ser modificada.
        </div>
      </v-alert>
      
      <!-- Grid de aspectos ultra-compacto -->
        <v-card dark color="#2d2d2d" class="mb-3" elevation="2">
          <v-card-text class="py-3">
            <div class="aspectos-grid">
              <div
                v-for="aspecto in aspectos"
                :key="aspecto.aspecto_id || aspecto.id"
                class="aspecto-row"
              >
                <div class="aspecto-info">
                  <span class="aspecto-nombre">{{ aspecto.aspecto_nombre || aspecto.nombre }}</span>
                  <v-chip size="x-small" color="success" variant="outlined" class="ml-2">
                    {{ aspecto.peso }}%
                  </v-chip>
                </div>
                
                <!-- Solo los botones de calificación deben estar aquí -->
                <div class="rating-buttons">
                  <v-btn
                    v-for="rating in [0, 1, 2, 3, 4, 5]"
                    :key="rating"
                    :color="getRatingColor(rating, evaluaciones[empleadoActual.id]?.[aspecto.aspecto_id || aspecto.id])"
                    :variant="evaluaciones[empleadoActual.id]?.[aspecto.aspecto_id || aspecto.id] === rating ? 'flat' : 'outlined'"
                    size="x-small"
                    class="rating-btn"
                    :disabled="modoSoloLectura"
                    @click="updateEvaluacion(aspecto.aspecto_id || aspecto.id, rating)"
                  >
                    {{ rating }}
                  </v-btn>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Sección de Vacaciones -->
        <v-card dark color="#2d2d2d" class="mb-3" elevation="2">
          <v-card-text class="py-3">
            <div class="d-flex align-center justify-space-between mb-3">
              <h4 class="text-subtitle-1 mb-0">
                <v-icon color="warning" class="mr-2">mdi-beach</v-icon>
                Vacaciones
              </h4>
            </div>
            
            <div class="vacaciones-section">
              <div class="d-flex align-center gap-4 mb-3">
                <v-switch
                  v-model="estuvoDeVacacionesActual"
                  color="warning"
                  density="compact"
                  hide-details
                  @change="updateVacaciones"
                >
                  <template #label>
                    <span class="text-body-2">¿Estuvo de vacaciones?</span>
                  </template>
                </v-switch>
              </div>
              
              <v-expand-transition>
                <div v-if="estuvoDeVacacionesActual">
                  <v-text-field
                    v-model.number="diasVacacionesActual"
                    label="Cantidad de días de vacaciones"
                    type="number"
                    variant="outlined"
                    density="compact"
                    min="1"
                    max="365"
                    hide-details
                    @input="updateVacaciones"
                  >
                    <template #prepend-inner>
                      <v-icon color="warning" size="small">mdi-calendar-clock</v-icon>
                    </template>
                  </v-text-field>
                </div>
              </v-expand-transition>
            </div>
          </v-card-text>
        </v-card>

        <!-- Campo de comentarios compacto (opcional) -->
        <v-card dark color="#2d2d2d" class="mb-3" elevation="1">
          <v-card-text class="py-2">
            <v-textarea
              v-model="comentarios[empleadoActual.id]"
              label="Comentarios (opcional)"
              variant="outlined"
              density="compact"
              rows="2"
              hide-details
              @input="guardarComentario"
            ></v-textarea>
          </v-card-text>
        </v-card>

        <!-- Botones de acción -->
        <div class="d-flex justify-space-between">
          <v-btn
            color="success"
            variant="outlined"
            @click="volverAPuestos"
          >
            <v-icon left>mdi-arrow-left</v-icon>
            Volver a Puestos
          </v-btn>
          
          <v-btn
            v-if="empleadoActualIndex === puestoSeleccionado.empleados.length - 1"
            color="success"
            @click="finalizarPuesto"
            :loading="guardando"
          >
            <v-icon left>mdi-check</v-icon>
            Finalizar Puesto
          </v-btn>
          <v-btn
            v-else
            color="success"
            @click="empleadoSiguiente"
          >
            Siguiente
            <v-icon right>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </div>
    </div>

    <!-- Diálogo de éxito -->
    <v-dialog v-model="showSuccessDialog" max-width="400" persistent>
      <v-card dark color="#2d2d2d">
        <v-card-text class="text-center py-6">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
          <h3 class="text-h5 mb-2">¡Puesto Completado!</h3>
          <p class="text-body-2 text-grey-lighten-1">
            Has evaluado exitosamente a todos los empleados del puesto
            <strong>{{ puestoCompletado?.puesto_nombre }}</strong>
          </p>
        </v-card-text>
        <v-card-actions class="justify-center pb-4">
          <v-btn color="success" @click="cerrarDialogoExito">
            Continuar
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
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { evaluacionService, puestoService, aspectoService } from '@/services/apiService'

// Estados de carga
const loading = ref(true)
const loadingMessage = ref('Cargando datos...')
const guardando = ref(false)

// Datos principales
const datosUsuario = ref({
  usuario: null,
  estacion: null,
  total_empleados: 0,
  total_puestos: 0,
  puestos_con_empleados: []
})

// Estados de navegación
const puestoSeleccionado = ref(null)
const empleadoActualIndex = ref(0)
const aspectos = ref([])
const puestosCompletados = ref(new Set()) // Nuevo estado para rastrear puestos completados

// Evaluaciones, comentarios y vacaciones
const evaluaciones = ref({})
const comentarios = ref({})
const vacaciones = ref({}) // Nuevo estado para vacaciones

// Estados de guardado
const showSuccessDialog = ref(false)
const puestoCompletado = ref(null)

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

const periodoEvaluacion = ref(null)
const puedeEvaluar = ref(false)
const mensajePerido = ref('')

// Computed
const empleadoActual = computed(() => {
  if (!puestoSeleccionado.value || !puestoSeleccionado.value.empleados) return null
  return puestoSeleccionado.value.empleados[empleadoActualIndex.value]
})

// Inicializar período de evaluación
const inicializarPeriodoEvaluacion = () => {
  periodoEvaluacion.value = calcularPeriodoEvaluacion()
  puedeEvaluar.value = periodoEvaluacion.value.estaEnPeriodoGracia
  
  if (periodoEvaluacion.value.estaEnPeriodoGracia) {
    mensajePerido.value = `Evaluando ${periodoEvaluacion.value.nombreMesAEvaluar} ${periodoEvaluacion.value.añoAEvaluar} - ${periodoEvaluacion.value.diasRestantes} días restantes`
  } else if (periodoEvaluacion.value.diasRestantes > 0) {
    mensajePerido.value = `Período de evaluación inicia en ${periodoEvaluacion.value.diasRestantes} días`
  } else {
    mensajePerido.value = 'Período de evaluación expirado'
  }
}


// Métodos
const getInitials = (nombre) => {
  if (!nombre) return 'E'
  const words = nombre.trim().split(' ')
  if (words.length === 1) return words[0].charAt(0).toUpperCase()
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
}

const getRatingColor = (rating, currentRating) => {
  if (currentRating === rating) {
    if (rating >= 4) return 'success'
    if (rating >= 2) return 'warning'
    return 'error'
  }
  return 'grey-darken-2'
}

const loadDatosEvaluacion = async () => {
  try {
    loadingMessage.value = 'Cargando empleados por estación...'
    
    // Obtener usuario_id desde sessionStorage
    const usuarioId = sessionStorage.getItem('usuario_id')
    if (!usuarioId) {
      showMessage('No se encontró información del usuario', 'error')
      return
    }

    const result = await evaluacionService.get_empleados_by_usuario_estacion(usuarioId)
    
    if (result.success && result.data.success) {
      datosUsuario.value = result.data
      
      // Verificar qué puestos están completados
      loadingMessage.value = 'Verificando estado de puestos...'
      
      for (const puesto of result.data.puestos_con_empleados) {
        try {
          console.log(`🔍 Verificando puesto: ${puesto.puesto_nombre} (ID: ${puesto.puesto_id})`)
          
          const evaluacionesResult = await evaluacionService.obtenerEvaluacionesPuesto(usuarioId, puesto.puesto_id)
          
          console.log(`📦 Respuesta para puesto ${puesto.puesto_id}:`, evaluacionesResult)
          
          // CORRECCIÓN: Acceder a result.data.data en lugar de result.data
          if (evaluacionesResult.success && evaluacionesResult.data && evaluacionesResult.data.data) {
            const datosEvaluacion = evaluacionesResult.data.data
            console.log(`📊 Datos de evaluación para puesto ${puesto.puesto_id}:`, datosEvaluacion)
            
            // Verificar si hay empleados con evaluaciones
            if (datosEvaluacion.empleados && datosEvaluacion.empleados.length > 0) {
              const tieneEvaluaciones = datosEvaluacion.empleados.some(empleado => {
                const hasEvals = empleado.evaluaciones && empleado.evaluaciones.length > 0
                console.log(`👤 Empleado ${empleado.empleado_nombre}: ${hasEvals ? 'Tiene evaluaciones' : 'Sin evaluaciones'}`)
                return hasEvals
              })
              
              if (tieneEvaluaciones) {
                puestosCompletados.value.add(puesto.puesto_id)
                console.log(`✅ Puesto ${puesto.puesto_nombre} marcado como completado`)
              } else {
                console.log(`❌ Puesto ${puesto.puesto_nombre} sin evaluaciones completadas`)
              }
            } else {
              console.log(`❌ No hay empleados en el puesto ${puesto.puesto_nombre}`)
            }
          } else {
            console.log(`❌ No se pudieron obtener evaluaciones para puesto ${puesto.puesto_id}`)
            console.log('📦 Estructura recibida:', evaluacionesResult)
          }
        } catch (error) {
          console.error(`💥 Error al verificar puesto ${puesto.puesto_id}:`, error)
        }
      }
      
      console.log('🏢 Puestos completados al cargar:', Array.from(puestosCompletados.value))
      showMessage('Datos cargados correctamente', 'success')
    } else {
      showMessage(result.message || 'Error al cargar datos', 'error')
    }
  } catch (error) {
    console.error('💥 Error al cargar datos:', error)
    showMessage('Error de conexión', 'error')
  } finally {
    loading.value = false
  }
}

const volverAPuestos = () => {
  puestoSeleccionado.value = null
  empleadoActualIndex.value = 0
  aspectos.value = []
}

const empleadoAnterior = () => {
  if (empleadoActualIndex.value > 0) {
    empleadoActualIndex.value--
  }
}

const empleadoSiguiente = () => {
  if (empleadoActualIndex.value < puestoSeleccionado.value.empleados.length - 1) {
    empleadoActualIndex.value++
  }
}

// Agregar nuevos estados para modo de solo lectura
const modoSoloLectura = ref(false)
const fechaCompletado = ref(null)
const evaluacionCompletada = ref(null)


// Función actualizada para verificar si el puesto está completado
const verificarEstadoPuesto = async (puesto) => {
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    
    // Primero intentar obtener las evaluaciones
    const result = await evaluacionService.obtenerEvaluacionesPuesto(usuarioId, puesto.puesto_id)
    
    console.log('🔍 Verificando estado del puesto:', result)
    
    if (result.success && result.data && result.data.data && result.data.data.empleados) {
      // Verificar si hay evaluaciones completadas (no borradores)
      const tieneEvaluacionesCompletas = result.data.data.empleados.some(empleado => 
        empleado.evaluaciones && empleado.evaluaciones.length > 0
      )
      
      console.log('✅ Tiene evaluaciones completas:', tieneEvaluacionesCompletas)
      
      if (tieneEvaluacionesCompletas) {
        // Cargar datos en modo de solo lectura
        await cargarDatosCompletados(puesto)
        return true
      }
    }
    
    // Si no hay evaluaciones completas, es editable
    modoSoloLectura.value = false
    fechaCompletado.value = null
    evaluacionCompletada.value = null
    return false
    
  } catch (error) {
    console.error('Error al verificar estado del puesto:', error)
    return false
  }
}

// Actualizar las funciones para prevenir edición en modo solo lectura
const updateEvaluacion = (aspectoId, rating) => {
  if (modoSoloLectura.value) {
    showMessage('Esta evaluación ya fue enviada y no puede ser modificada', 'warning')
    return
  }
  
  const empleadoId = empleadoActual.value.id
  if (!evaluaciones.value[empleadoId]) {
    evaluaciones.value[empleadoId] = {}
  }
  evaluaciones.value[empleadoId][aspectoId] = rating
  
  guardarBorrador()
}

const guardarComentario = () => {
  if (modoSoloLectura.value) {
    showMessage('Esta evaluación ya fue enviada y no puede ser modificada', 'warning')
    return
  }
  guardarBorrador()
}

const updateVacaciones = () => {
  if (modoSoloLectura.value) {
    showMessage('Esta evaluación ya fue enviada y no puede ser modificada', 'warning')
    return
  }
  guardarBorrador()
}

// Variables para controlar el auto-guardado
const autoSaveTimeout = ref(null)
const isSaving = ref(false)

// Función mejorada para auto-guardado
const guardarBorrador = async () => {
  // Cancelar timeout anterior si existe
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }

  // Establecer nuevo timeout para evitar múltiples llamadas
  autoSaveTimeout.value = setTimeout(async () => {
    if (isSaving.value) return // Evitar guardados simultáneos
    
    try {
      isSaving.value = true
      
      // Preparar datos para enviar
      const evaluacionData = {
        usuario_id: sessionStorage.getItem('usuario_id'),
        puesto_id: puestoSeleccionado.value.puesto_id,
        evaluaciones: evaluaciones.value,
        comentarios: comentarios.value,
        vacaciones: vacaciones.value,
        es_borrador: true // Indicar que es un borrador
      }
      
      console.log('Guardando borrador...', evaluacionData)
      
      const result = await evaluacionService.guardarBorrador(evaluacionData)
      
      if (result.success) {
        // Mostrar indicador sutil de guardado exitoso
        showMessage('Guardado automático', 'info')
      } else {
        console.error('Error al guardar borrador:', result.message)
      }
    } catch (error) {
      console.error('Error en auto-guardado:', error)
    } finally {
      isSaving.value = false
    }
  }, 2000) // Esperar 2 segundos después del último cambio
}

// Función actualizada para finalizar puesto
const finalizarPuesto = async () => {
  try {
    guardando.value = true
    
    // NUEVA VALIDACIÓN: Verificar período de evaluación
    if (!puedeEvaluar.value) {
      showMessage(
        `No se puede enviar la evaluación. ${periodoEvaluacion.value.mensaje}`, 
        'error'
      )
      return
    }
    
    // Validar que todos los empleados estén evaluados
    const empleadosIncompletos = puestoSeleccionado.value.empleados.filter(empleado => {
      const evalEmpleado = evaluaciones.value[empleado.id] || {}
      return Object.keys(evalEmpleado).length < aspectos.value.length
    })
    
    if (empleadosIncompletos.length > 0) {
      showMessage(`Faltan evaluaciones para ${empleadosIncompletos.length} empleado(s)`, 'warning')
      return
    }
    
    // Preparar datos finales
    const evaluacionData = {
      usuario_id: sessionStorage.getItem('usuario_id'),
      puesto_id: puestoSeleccionado.value.puesto_id,
      evaluaciones: evaluaciones.value,
      comentarios: comentarios.value,
      vacaciones: vacaciones.value,
      es_borrador: false, // Indicar que es la versión final
      fecha_finalizacion: new Date().toISOString(),
      // AGREGAR: Información del período de evaluación
      periodo_evaluacion: {
        mes: periodoEvaluacion.value.mesAEvaluar,
        año: periodoEvaluacion.value.añoAEvaluar,
        nombre_mes: periodoEvaluacion.value.nombreMesAEvaluar
      }
    }
    
    console.log('Finalizando evaluación del puesto...', evaluacionData)
    
    // Guardar evaluación final
    const result = await evaluacionService.finalizarEvaluacionPuesto(evaluacionData)
    
    if (result.success) {
      // Marcar el puesto como completado
      puestosCompletados.value.add(puestoSeleccionado.value.puesto_id)
      
      puestoCompletado.value = puestoSeleccionado.value
      showSuccessDialog.value = true
      
      showMessage('Evaluación del puesto finalizada correctamente', 'success')
    } else {
      showMessage(result.message || 'Error al finalizar evaluación', 'error')
    }
    
  } catch (error) {
    console.error('Error al finalizar puesto:', error)
    showMessage('Error al guardar evaluaciones', 'error')
  } finally {
    guardando.value = false
  }
}

// Función para cargar evaluaciones existentes (borradores)
const cargarEvaluacionesExistentes = async (puesto) => {
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    console.log('🔍 Cargando evaluaciones para:', { usuarioId, puestoId: puesto.puesto_id })
    
    const result = await evaluacionService.obtenerEvaluacionesPuesto(usuarioId, puesto.puesto_id)
    
    console.log('📦 Respuesta completa del servicio:', result)
    
    // CORRECCIÓN: Acceder a result.data.data
    if (result.success && result.data && result.data.data) {
      const datosEvaluacion = result.data.data
      console.log('✅ Datos del servicio:', datosEvaluacion)
      
      // Verificar si hay empleados en la respuesta
      if (datosEvaluacion.empleados && datosEvaluacion.empleados.length > 0) {
        console.log('👥 Empleados encontrados:', datosEvaluacion.empleados.length)
        
        // Procesar cada empleado
        datosEvaluacion.empleados.forEach((empleadoData, index) => {
          console.log(`👤 Procesando empleado ${index + 1}:`, empleadoData)
          
          const empleadoId = empleadoData.empleado_id
          
          // Inicializar estructuras si no existen
          if (!evaluaciones.value[empleadoId]) {
            evaluaciones.value[empleadoId] = {}
          }
          if (!comentarios.value[empleadoId]) {
            comentarios.value[empleadoId] = ''
          }
          if (!vacaciones.value[empleadoId]) {
            vacaciones.value[empleadoId] = {
              estuvoDeVacaciones: false,
              diasVacaciones: null
            }
          }
          
          // Cargar evaluaciones si existen
          if (empleadoData.evaluaciones && empleadoData.evaluaciones.length > 0) {
            console.log(`📊 Evaluaciones para empleado ${empleadoId}:`, empleadoData.evaluaciones)
            
            // Tomar la evaluación más reciente (primera en el array)
            const evaluacionReciente = empleadoData.evaluaciones[0]
            console.log('📈 Evaluación reciente:', evaluacionReciente)
            
            // Procesar aspectos de la evaluación
            if (evaluacionReciente.aspectos && evaluacionReciente.aspectos.length > 0) {
              console.log('🎯 Aspectos encontrados:', evaluacionReciente.aspectos)
              
              evaluacionReciente.aspectos.forEach(aspecto => {
                evaluaciones.value[empleadoId][aspecto.aspecto_id] = aspecto.calificacion
                console.log(`⭐ Aspecto ${aspecto.aspecto_id}: ${aspecto.calificacion}`)
              })
            }
            
            // Cargar comentario
            if (evaluacionReciente.comentario) {
              comentarios.value[empleadoId] = evaluacionReciente.comentario
              console.log('💬 Comentario cargado:', evaluacionReciente.comentario)
            }
            
            // Marcar el puesto como completado si tiene evaluaciones
            puestosCompletados.value.add(puesto.puesto_id)
            console.log('✅ Puesto marcado como completado:', puesto.puesto_id)
          } else {
            console.log(`❌ No hay evaluaciones para empleado ${empleadoId}`)
          }
        })
        
        console.log('📋 Estado final de evaluaciones:', evaluaciones.value)
        console.log('💭 Estado final de comentarios:', comentarios.value)
        console.log('🏢 Puestos completados:', Array.from(puestosCompletados.value))
        
        showMessage('Evaluaciones existentes cargadas correctamente', 'info')
      } else {
        console.log('❌ No se encontraron empleados en la respuesta')
        console.log('📦 Estructura de datos recibida:', datosEvaluacion)
      }
    } else {
      console.log('❌ No se encontraron evaluaciones existentes para este puesto')
      console.log('📦 Respuesta del servicio:', result)
    }
  } catch (error) {
    console.error('💥 Error al cargar evaluaciones existentes:', error)
    showMessage('Error al cargar evaluaciones existentes', 'warning')
  }
}

const cargarDatosCompletados = async (puesto) => {
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    const result = await evaluacionService.obtenerEvaluacionesPuesto(usuarioId, puesto.puesto_id)
    
    // CORRECCIÓN: Acceder a result.data.data
    if (result.success && result.data && result.data.data) {
      const datosEvaluacion = result.data.data
      
      // Marcar como modo de solo lectura
      modoSoloLectura.value = true
      
      // Procesar datos igual que en cargarEvaluacionesExistentes
      if (datosEvaluacion.empleados && datosEvaluacion.empleados.length > 0) {
        datosEvaluacion.empleados.forEach(empleadoData => {
          const empleadoId = empleadoData.empleado_id
          
          // Inicializar estructuras
          if (!evaluaciones.value[empleadoId]) {
            evaluaciones.value[empleadoId] = {}
          }
          if (!comentarios.value[empleadoId]) {
            comentarios.value[empleadoId] = ''
          }
          if (!vacaciones.value[empleadoId]) {
            vacaciones.value[empleadoId] = {
              estuvoDeVacaciones: false,
              diasVacaciones: null
            }
          }
          
          // Cargar datos de evaluación completada
          if (empleadoData.evaluaciones && empleadoData.evaluaciones.length > 0) {
            const evaluacionReciente = empleadoData.evaluaciones[0]
            
            // Cargar aspectos
            if (evaluacionReciente.aspectos) {
              evaluacionReciente.aspectos.forEach(aspecto => {
                evaluaciones.value[empleadoId][aspecto.aspecto_id] = aspecto.calificacion
              })
            }
            
            // Cargar comentario
            if (evaluacionReciente.comentario) {
              comentarios.value[empleadoId] = evaluacionReciente.comentario
            }
            
            // CORRECCIÓN: Establecer fecha de completado correctamente
            if (evaluacionReciente.fecha_evaluacion) {
              fechaCompletado.value = evaluacionReciente.fecha_evaluacion
              console.log('📅 Fecha de completado establecida:', evaluacionReciente.fecha_evaluacion)
            }
          }
        })
      }
      
      // Guardar datos de estadísticas si están disponibles
      if (datosEvaluacion.estadisticas) {
        evaluacionCompletada.value = {
          estadisticas: datosEvaluacion.estadisticas,
          puesto: datosEvaluacion.puesto
        }
      }
      
      console.log('Datos completados cargados:', {
        evaluaciones: evaluaciones.value,
        comentarios: comentarios.value,
        fechaCompletado: fechaCompletado.value,
        estadisticas: datosEvaluacion.estadisticas
      })
      
      return true
    }
    
    return false
  } catch (error) {
    console.error('Error al cargar datos completados:', error)
    return false
  }
}

// Actualizar la función seleccionarPuesto para cargar borradores
const seleccionarPuesto = async (puesto) => {

  if (!verificarPeriodoEvaluacion()) {
    return
  }

  try {
    loadingMessage.value = 'Cargando información del puesto...'
    loading.value = true
    
    puestoSeleccionado.value = puesto
    empleadoActualIndex.value = 0
    
    console.log('🎯 Seleccionando puesto:', puesto)
    
    // Cargar aspectos del puesto
    const aspectosResult = await aspectoService.getAspectosPorPuesto(puesto.puesto_id)
    if (aspectosResult.success) {
      aspectos.value = aspectosResult.data.aspectos
      console.log('📋 Aspectos cargados:', aspectos.value)
    }
    
    // Inicializar evaluaciones, comentarios y vacaciones para todos los empleados
    puesto.empleados.forEach(empleado => {
      if (!evaluaciones.value[empleado.id]) {
        evaluaciones.value[empleado.id] = {}
      }
      if (!comentarios.value[empleado.id]) {
        comentarios.value[empleado.id] = ''
      }
      if (!vacaciones.value[empleado.id]) {
        vacaciones.value[empleado.id] = {
          estuvoDeVacaciones: false,
          diasVacaciones: null
        }
      }
    })
    
    // CAMBIO: Usar verificarEstadoPuesto en lugar de la lógica antigua
    const estaCompletado = await verificarEstadoPuesto(puesto)
    
    if (estaCompletado) {
      console.log('🔒 Puesto en modo de solo lectura')
      showMessage('Este puesto ya fue completado - Solo lectura', 'info')
    } else {
      // Si no está completado, cargar evaluaciones existentes normalmente
      await cargarEvaluacionesExistentes(puesto)
      console.log('✏️ Puesto en modo editable')
    }
    
  } catch (error) {
    console.error('💥 Error al seleccionar puesto:', error)
    showMessage('Error al cargar información del puesto', 'error')
  } finally {
    loading.value = false
  }
}

const cerrarDialogoExito = () => {
  showSuccessDialog.value = false
  puestoCompletado.value = null
  volverAPuestos()
}

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const progresoGeneral = computed(() => {
  if (!puestoSeleccionado.value || !aspectos.value.length) return 0
  
  const totalEmpleados = puestoSeleccionado.value.empleados.length
  const totalAspectos = aspectos.value.length
  const totalEvaluaciones = totalEmpleados * totalAspectos
  
  let evaluacionesCompletadas = 0
  puestoSeleccionado.value.empleados.forEach(empleado => {
    const evalEmpleado = evaluaciones.value[empleado.id] || {}
    evaluacionesCompletadas += Object.keys(evalEmpleado).length
  })
  
  return (evaluacionesCompletadas / totalEvaluaciones) * 100
})

// Propiedades computadas para vacaciones
const estuvoDeVacacionesActual = computed({
  get() {
    if (!empleadoActual.value) return false
    return vacaciones.value[empleadoActual.value.id]?.estuvoDeVacaciones || false
  },
  set(value) {
    if (!empleadoActual.value) return
    if (!vacaciones.value[empleadoActual.value.id]) {
      vacaciones.value[empleadoActual.value.id] = {
        estuvoDeVacaciones: false,
        diasVacaciones: null
      }
    }
    vacaciones.value[empleadoActual.value.id].estuvoDeVacaciones = value
    if (!value) {
      vacaciones.value[empleadoActual.value.id].diasVacaciones = null
    }
    updateVacaciones()
  }
})

const diasVacacionesActual = computed({
  get() {
    if (!empleadoActual.value) return null
    return vacaciones.value[empleadoActual.value.id]?.diasVacaciones || null
  },
  set(value) {
    if (!empleadoActual.value) return
    if (!vacaciones.value[empleadoActual.value.id]) {
      vacaciones.value[empleadoActual.value.id] = {
        estuvoDeVacaciones: false,
        diasVacaciones: null
      }
    }
    vacaciones.value[empleadoActual.value.id].diasVacaciones = value
    updateVacaciones()
  }
})

const calcularPeriodoEvaluacion = () => {
  const ahora = new Date()
  const mesActual = ahora.getMonth() // 0-11
  const añoActual = ahora.getFullYear()
  
  // Calcular el mes anterior (mes a evaluar)
  let mesAEvaluar = mesActual - 1
  let añoAEvaluar = añoActual
  
  if (mesAEvaluar < 0) {
    mesAEvaluar = 11 // Diciembre
    añoAEvaluar = añoActual - 1
  }
  
  // Fecha de inicio del período de gracia (primer día del mes siguiente)
  const inicioGracia = new Date(añoActual, mesActual, 1)
  
  // Fecha límite (2 semanas después del inicio del mes)
  const fechaLimite = new Date(añoActual, mesActual, 15) // 14 días + 1
  
  return {
    mesAEvaluar: mesAEvaluar + 1, // 1-12 para mostrar
    añoAEvaluar,
    nombreMesAEvaluar: obtenerNombreMes(mesAEvaluar),
    inicioGracia,
    fechaLimite,
    estaEnPeriodoGracia: ahora >= inicioGracia && ahora <= fechaLimite,
    diasRestantes: Math.ceil((fechaLimite - ahora) / (1000 * 60 * 60 * 24))
  }
}

const obtenerNombreMes = (mes) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return meses[mes]
}

const verificarPeriodoEvaluacion = () => {
  const periodo = calcularPeriodoEvaluacion()
  
  if (!periodo.estaEnPeriodoGracia) {
    if (periodo.diasRestantes < 0) {
      showMessage('El período de evaluación ha expirado', 'warning')
      return false
    } else {
      showMessage('Aún no es el período de evaluación', 'info')
      return false
    }
  }
  
  return true
}

// Lifecycle
onMounted(async () => {
  // Inicializar período de evaluación
  inicializarPeriodoEvaluacion()
  
  // Cargar datos existentes
  await loadDatosEvaluacion()
  
  // Actualizar período cada minuto
  setInterval(() => {
    inicializarPeriodoEvaluacion()
  }, 60000)
})

// Limpiar timeout al desmontar el componente
onUnmounted(() => {
  if (autoSaveTimeout.value) {
    clearTimeout(autoSaveTimeout.value)
  }
})

// Watcher para empleado actual
watch(empleadoActual, (newEmpleado) => {
  if (newEmpleado) {
    console.log('Empleado actual:', newEmpleado.nombre)
  }
})
</script>

<style scoped>
.evaluation-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 16px;
}

.loading-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.puesto-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.puesto-card:hover {
  border-color: #4caf50;
  transform: translateY(-2px);
}

.completion-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 50%;
  padding: 4px;
}

.evaluation-view {
  max-width: 800px;
  margin: 0 auto;
}

.aspectos-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.aspecto-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #404040;
}

.aspecto-row:last-child {
  border-bottom: none;
}

.aspecto-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.aspecto-nombre {
  font-weight: 500;
  font-size: 14px;
}

.rating-buttons {
  display: flex;
  gap: 4px;
}

.rating-btn {
  min-width: 40px !important;
  width: 40px;
  height: 40px;
  font-size: 14px;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 600px) {
  .evaluation-container {
    padding: 8px;
  }
  
  .aspecto-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .rating-buttons {
    align-self: stretch;
    justify-content: space-between;
  }
  
  .rating-btn {
    flex: 1;
    max-width: 48px;
    height: 40px;
  }
}

.vacaciones-section {
  border-left: 3px solid #ff9800;
  padding-left: 12px;
  background: rgba(255, 152, 0, 0.05);
  border-radius: 0 4px 4px 0;
  margin-top: 16px;
}

.rating-btn:disabled {
  opacity: 0.7 !important;
  cursor: not-allowed !important;
}

.v-text-field--disabled,
.v-textarea--disabled,
.v-switch--disabled {
  opacity: 0.8;
}

.readonly-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 1;
}

</style>



