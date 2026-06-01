<template>
  <v-container class="pa-6">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">
          <v-icon class="mr-2" color="green">mdi-clipboard-text</v-icon>
          Evaluación — {{ puestoNombre }}
        </h1>
        <p class="text-grey-500 ma-0">Proceso secuencial, inicia automáticamente</p>
      </div>
      <v-chip color="purple" variant="tonal">
        {{ indiceActual + 1 }} / {{ empleados.length }}
      </v-chip>
    </div>

    <!-- Diálogo de mensajes (reemplaza el v-alert superior) -->
    <v-dialog v-model="dialogOpen" max-width="520">
      <v-card :color="dialogColor" dark>
        <v-card-title class="text-h6">{{ dialogTitle }}</v-card-title>
        <v-card-text>{{ mensaje }}</v-card-text>
        <v-card-actions class="justify-end">
          <v-btn
            v-if="dialogShouldNavigate"
            color="white"
            variant="text"
            @click="onDialogAccept"
          >
            Aceptar
          </v-btn>
          <v-btn
            v-else
            color="white"
            variant="text"
            @click="dialogOpen = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
  </v-dialog>

    <!-- Se elimina el v-alert para no duplicar mensajes -->
    <!--
    <v-alert v-if="mensaje" :type="mensajeTipo" variant="tonal" class="mb-4" dark>
      {{ mensaje }}
    </v-alert>
    -->

    <v-card color="#2d2d2d" dark class="compact-card">
      <v-card-text>
        <div v-if="empleadoActual" class="d-flex align-center justify-space-between mb-4">
          <div>
            <div class="text-h6 font-weight-bold">{{ empleadoActual.nombre }}</div>
            <div class="text-grey-400">No. empleado: {{ empleadoActual.num_empleado }}</div>
            <div class="text-grey-400">Estado: {{ empleadoActual.activo ? 'Activo' : 'No activo' }}</div>
          </div>
          <v-chip color="success" variant="outlined" v-if="empleadoActual.activo">Activo</v-chip>
          <v-chip color="grey" variant="outlined" v-else>No activo</v-chip>
        </div>
  
        <div v-else class="text-grey-400">
          No hay empleados para este puesto.
        </div>
  
        <v-divider class="my-4" />
  
        <!-- Sección de aspectos (mantener) -->
        <div v-if="aspectos.length > 0">
          <!-- Relleno rápido eliminado -->
          <!-- Lista de aspectos con control compacto 0–5 -->
          <v-row v-for="item in aspectos" :key="item.id" class="aspect-row align-center py-2">
            <v-col cols="12" md="4">
              <div class="text-body-1">{{ item.nombre }}</div>
              <div class="text-caption text-grey">Peso: {{ item.peso }}</div>
            </v-col>
            <v-col cols="12" md="8">
              <div class="rating-row">
                <div class="rating-toggle">
                  <v-btn-toggle v-model="item.calificacion" mandatory density="compact" color="green">
                    <v-btn :value="0" size="small">0</v-btn>
                    <v-btn :value="1" size="small">1</v-btn>
                    <v-btn :value="2" size="small">2</v-btn>
                    <v-btn :value="3" size="small">3</v-btn>
                    <v-btn :value="4" size="small">4</v-btn>
                    <v-btn :value="5" size="small">5</v-btn>
                  </v-btn-toggle>
                </div>
                <v-chip class="ponderado-chip" color="indigo" variant="elevated">
                  <v-icon start size="16">mdi-scale-balance</v-icon>
                  <span class="ponderado-chip__label">Ponderado</span>
                  <span class="ponderado-chip__value">{{ computePonderado(item) }}</span>
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </div>

        <div v-else class="text-grey-400">
          No hay aspectos configurados para este puesto.
        </div>

        <!-- Mini sección de totales y porcentaje (al final) -->
        <v-divider class="my-4" />
        <div v-if="aspectos.length > 0" class="summary-chips mb-2 d-flex align-center justify-end">
          <v-chip class="mr-2" color="blue" variant="flat">Puntos: {{ totalPuntos }}</v-chip>
          <v-chip class="mr-2" color="green" variant="flat">Porcentaje: {{ porcentajeTotal }}%</v-chip>
        </div>

        <v-row class="mt-3" align="center">
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="faltas"
              label="Días de falta"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="comfortable"
              color="red"
              prepend-inner-icon="mdi-calendar-remove"
              :hint="'Solo enteros, mínimo 0'"
              persistent-hint
              @blur="sanitizeEntero('faltas')"
            />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="incapacidades"
              label="Días de incapacidad"
              type="number"
              min="0"
              step="1"
              variant="outlined"
              density="comfortable"
              color="orange"
              prepend-inner-icon="mdi-hospital-box"
              :hint="'Solo enteros, mínimo 0'"
              persistent-hint
              @blur="sanitizeEntero('incapacidades')"
            />
          </v-col>
        </v-row>

        <!-- Sección de comentarios -->
        <v-textarea
          v-model="comentarios"
          label="Comentarios"
          color="blue"
          auto-grow
          rows="3"
          class="mt-2"
        />
      </v-card-text>

      <v-divider />

      <!-- Controles del flujo -->
      <v-card-actions class="justify-space-between">
        <div>
          <v-btn color="blue" variant="tonal" @click="anterior" :disabled="indiceActual === 0">
            <v-icon left>mdi-chevron-left</v-icon>
            Anterior
          </v-btn>
        </div>
        <div>
          <!-- Evaluar: solo visible en el último empleado -->
          <v-btn
            v-if="esUltimoEmpleado"
            color="green"
            class="mr-2"
            @click="evaluarTodo"
            :disabled="!todosCalificadosGlobal || isSaving"
          >
            <v-icon left>mdi-clipboard-check</v-icon>
            Evaluar
          </v-btn>
          <v-btn
            v-if="!esUltimoEmpleado"
            color="blue"
            variant="tonal"
            @click="siguiente"
            :disabled="indiceActual >= empleados.length - 1 || !todasCalificadasEmpleadoActual"
          >
            Siguiente
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { evaluacionService, aspectoService, puestoService } from '@/services/apiService'  // ← Agregar estos servicios

const route = useRoute()
const router = useRouter()
const puestoNombre = route.params.puestoNombre

const empleados = ref([])
const indiceActual = ref(0)
const empleadoActual = computed(() => empleados.value[indiceActual.value] || null)
const mensaje = ref('')
const mensajeTipo = ref('info')
const isSaving = ref(false)  // ← Declarar este estado
const faltas = ref(0)
const incapacidades = ref(0)

// NUEVO: aspectos y totales
const aspectos = ref([]) // { id, nombre, peso, calificacion }
const puestoId = ref(null)
const comentarios = ref('') // ← nuevo


const aspectosBase = ref([])        // catálogo base del puesto
const evaluacionesPorEmpleado = ref({}) // cache: { [empleadoId]: { aspectos, comentarios, completado } }

// Estados del diálogo y función para abrirlo
const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogShouldNavigate = ref(false)
const dialogColor = ref('blue')

const openDialog = (tipo, titulo, texto, options = {}) => {
  mensajeTipo.value = tipo
  mensaje.value = texto
  dialogTitle.value = titulo || (tipo === 'success' ? 'Proceso exitoso' : 'Ocurrió un error')
  dialogColor.value = tipo === 'success' ? 'green' : tipo === 'error' ? 'red' : 'blue'
  dialogShouldNavigate.value = !!options.navigateOnAccept && tipo === 'success'
  dialogOpen.value = true
}

const onDialogAccept = () => {
  dialogOpen.value = false
  if (dialogShouldNavigate.value) {
    router.push({ name: 'evaluationNew' })
  }
}

const todasCalificadas = computed(() => {
  if (!empleadoActual.value || aspectos.value.length === 0) return false
  return aspectos.value.every(a => a.calificacion !== null && Number(a.calificacion) >= 0 && Number(a.calificacion) <= 5)
})

const puedeEvaluar = computed(() => {
  return !!empleadoActual.value && todasCalificadas.value && !isSaving.value
})

const puedeSiguiente = computed(() => {
  const emp = empleadoActual.value
  if (!emp) return false
  const estado = evaluacionesPorEmpleado.value[emp.id]
  return !!estado?.completado
})

const totalPuntos = computed(() => {
  return aspectos.value.reduce((sum, a) => sum + (Number(a.calificacion) || 0), 0)
})
const totalPonderado = computed(() => {
  return aspectos.value.reduce((sum, a) => sum + ((Number(a.calificacion) || 0) * (Number(a.peso) || 0)), 0).toFixed(2)
})
const totalMaxPonderado = computed(() => {
  return aspectos.value.reduce((sum, a) => sum + (5 * (Number(a.peso) || 0)), 0)
})
const porcentajeTotal = computed(() => {
  const max = totalMaxPonderado.value
  if (!max) return '0.00'
  const val = Number(totalPonderado.value) || 0
  return ((val / max) * 100).toFixed(2)
})

const computePonderado = (item) => {
  const pts = Number(item.calificacion) || 0
  const peso = Number(item.peso) || 0
  return (pts * peso).toFixed(2)
}

const penalizacionFaltas = computed(() => {
  // Por ejemplo, cada falta resta 2% del total
  const penalizacionPorDia = 2
  return faltas.value * penalizacionPorDia
})

const porcentajeTotalAjustado = computed(() => {
  let base = Number(porcentajeTotal.value) || 0
  let penalizacion = penalizacionFaltas.value
  let resultado = base - penalizacion
  if (resultado < 0) resultado = 0
  return resultado.toFixed(2)
})

const esUltimoEmpleado = computed(() => indiceActual.value >= empleados.value.length - 1)

const todasCalificadasEmpleadoActual = computed(() => {
  if (!empleadoActual.value || aspectos.value.length === 0) return false
  return aspectos.value.every(a => a.calificacion !== null && Number(a.calificacion) >= 0 && Number(a.calificacion) <= 5)
})

const empleadoTieneTodoCalificado = (emp) => {
  if (!emp) return false
  if (empleadoActual.value && emp.id === empleadoActual.value.id) {
    return aspectos.value.length > 0 &&
      aspectos.value.every(a => a.calificacion !== null && Number(a.calificacion) >= 0 && Number(a.calificacion) <= 5)
  }
  const estado = evaluacionesPorEmpleado.value[emp.id]
  if (!estado || !Array.isArray(estado.aspectos) || estado.aspectos.length === 0) return false
  return estado.aspectos.every(a => a.calificacion !== null && Number(a.calificacion) >= 0 && Number(a.calificacion) <= 5)
}

const todosCalificadosGlobal = computed(() => {
  if (!Array.isArray(empleados.value) || empleados.value.length === 0) return false
  return empleados.value.every(empleadoTieneTodoCalificado)
})

// Guarda/restaura el estado por empleado al navegar
const guardarEstadoEmpleadoActual = () => {
  const emp = empleadoActual.value
  if (!emp) return
  evaluacionesPorEmpleado.value[emp.id] = {
    aspectos: aspectos.value.map(a => ({ ...a })),
    comentarios: comentarios.value,
    faltas: Number(faltas.value) || 0,
    incapacidades: Number(incapacidades.value) || 0
  }
}

const cargarEstadoEmpleadoActual = () => {
  const emp = empleadoActual.value
  if (!emp) {
    aspectos.value = []
    comentarios.value = ''
    faltas.value = 0
    incapacidades.value = 0
    return
  }
  const estado = evaluacionesPorEmpleado.value[emp.id]
  if (estado) {
    aspectos.value = estado.aspectos.map(a => ({ ...a }))
    comentarios.value = estado.comentarios || ''
    faltas.value = Number(estado.faltas) || 0
    incapacidades.value = Number(estado.incapacidades) || 0
  } else {
    aspectos.value = aspectosBase.value.map(a => ({ ...a, calificacion: null }))
    comentarios.value = ''
    faltas.value = 0
    incapacidades.value = 0
  }
}

// Asegurar que el input sea entero >= 0
const sanitizeEntero = (field) => {
  const val = field === 'faltas' ? faltas.value : incapacidades.value
  const n = Number.isFinite(Number(val)) ? Math.max(0, Math.floor(Number(val))) : 0
  if (field === 'faltas') faltas.value = n
  else incapacidades.value = n
}

const anterior = () => {
  if (indiceActual.value > 0) {
    guardarEstadoEmpleadoActual()
    indiceActual.value -= 1
    cargarEstadoEmpleadoActual()
  }
}

const siguiente = () => {
  // Bloquear hasta que el empleado actual tenga todos los aspectos calificados
  if (!todasCalificadasEmpleadoActual.value) return
  if (indiceActual.value < empleados.value.length - 1) {
    guardarEstadoEmpleadoActual()
    indiceActual.value += 1
    cargarEstadoEmpleadoActual()
  }
}

// Enviar todas las evaluaciones por empleado al final (una por una)
const evaluarTodo = async () => {
  try {
    if (!esUltimoEmpleado.value || !todosCalificadosGlobal.value) return
    isSaving.value = true
    const usuarioId = sessionStorage.getItem('usuario_id')
    const estacionId = sessionStorage.getItem('estacion_id') || sessionStorage.getItem('estacionId') || sessionStorage.getItem('station_id')

    const errores = []
    for (const emp of empleados.value) {
      // Obtener estado del empleado: actual vs cache
      let estado = evaluacionesPorEmpleado.value[emp.id]
      if (empleadoActual.value && emp.id === empleadoActual.value.id) {
        estado = {
          aspectos: aspectos.value.map(a => ({ ...a })),
          comentarios: comentarios.value,
          faltas: Number(faltas.value) || 0,
          incapacidades: Number(incapacidades.value) || 0
        }
      }
      if (!estado || !estado.aspectos || estado.aspectos.length === 0) {
        errores.push(`Sin datos para ${emp.nombre}`)
        continue
      }

      // Calcular totales por empleado
      const totalPuntosEmp = estado.aspectos.reduce((sum, a) => sum + (Number(a.calificacion) || 0), 0)
      const totalPonderadoEmp = estado.aspectos.reduce((sum, a) => sum + ((Number(a.calificacion) || 0) * (Number(a.peso) || 0)), 0)
      const totalMaxPonderadoEmp = estado.aspectos.reduce((sum, a) => sum + (5 * (Number(a.peso) || 0)), 0)
      const porcentajeEmp = totalMaxPonderadoEmp ? ((totalPonderadoEmp / totalMaxPonderadoEmp) * 100).toFixed(2) : '0.00'

      const payload = {
        usuario_id: usuarioId,
        estacion_id: estacionId,
        puesto_id: puestoId.value,
        empleado_id: emp.id,
        evaluaciones: estado.aspectos.map(a => ({
          aspecto_id: a.id,
          calificacion: Number(a.calificacion) || 0,
          peso: Number(a.peso) || 0
        })),
        total_puntos: totalPuntosEmp,
        total_ponderado: totalPonderadoEmp.toFixed(2),
        porcentaje_total: porcentajeEmp,
        comentarios: estado.comentarios || '',
        faltas: Number(estado.faltas) || 0,
        incapacidad: Number(estado.incapacidades) || 0
      }

      const saveRes = await evaluacionService.finalizarEvaluacionPuesto(payload)
      if (!saveRes.success) {
        errores.push(saveRes.message || `Error con ${emp.nombre}`)
      }
    }

    if (errores.length > 0) {
      openDialog('error', 'Evaluación con errores', `Algunas evaluaciones fallaron: ${errores.join('; ')}`)
    } else {
      openDialog(
        'success',
        'Evaluación completada',
        'Todas las evaluaciones fueron registradas correctamente.',
        { navigateOnAccept: true }
      )
    }
  } catch (err) {
    console.error('Error en evaluarTodo:', err)
    openDialog('error', 'Error al enviar evaluaciones', err.message || 'Ocurrió un error al enviar las evaluaciones')
  } finally {
    isSaving.value = false
  }
}

// Cargar aspectos del puesto usando tu servicio
const cargarAspectosDelPuesto = async () => {
  try {
    if (!puestoId.value) {
      const puestosRes = await puestoService.getPuestos()
      if (puestosRes.success) {
        const match = (puestosRes.puestos || []).find(p => (p.nombre || '').toLowerCase() === String(puestoNombre).toLowerCase())
        puestoId.value = match?.id || null
      }
    }

    if (!puestoId.value) {
      console.warn('No se pudo resolver el puestoId para', puestoNombre)
      aspectosBase.value = []
      aspectos.value = []
      return
    }

    const aspRes = await aspectoService.getAspectosByPuesto(puestoId.value)
    if (!aspRes.success) {
      mensaje.value = aspRes.message || 'Error al cargar aspectos'
      mensajeTipo.value = 'error'
      aspectosBase.value = []
      aspectos.value = []
      return
    }
    const listaAspectos = Array.isArray(aspRes.data) ? aspRes.data : []
    aspectosBase.value = listaAspectos.map(a => ({
      id: a.id,
      nombre: a.nombre,
      peso: a.peso || 0,
      calificacion: null
    }))
    aspectos.value = aspectosBase.value.map(a => ({ ...a }))
  } catch (err) {
    console.error('Error cargando aspectos del puesto:', err)
    mensaje.value = 'Ocurrió un error al cargar los aspectos.'
    mensajeTipo.value = 'error'
    aspectosBase.value = []
    aspectos.value = []
  }
}

// Helper para resetear calificaciones cuando cambias de empleado
const resetCalificaciones = () => {
  aspectos.value = aspectos.value.map(a => ({ ...a, calificacion: null }))
}

const cargarEmpleadosDelPuesto = async () => {
  try {
    mensaje.value = ''
    const usuarioId = sessionStorage.getItem('usuario_id')
    const res = await evaluacionService.get_empleados_by_usuario_estacion(usuarioId)
    if (!res.success) {
      throw new Error(res.message || 'Error al obtener empleados de la estación')
    }

    const data = res.data
    const lista = Array.isArray(data?.puestos_con_empleados) ? data.puestos_con_empleados : []

    const grupo = lista.find(item => (item.puesto_nombre || '').toLowerCase() === String(puestoNombre).toLowerCase())
    const empleadosDelPuesto = Array.isArray(grupo?.empleados) ? grupo.empleados : []

    empleados.value = empleadosDelPuesto

    if (empleados.value.length === 0) {
      mensaje.value = 'No hay empleados para este puesto.'
      mensajeTipo.value = 'info'
    } else {
      mensaje.value = `Iniciando evaluación — ${empleados.value.length} empleados`
      mensajeTipo.value = 'success'
      indiceActual.value = 0
    }
  } catch (err) {
    console.error('Error cargando empleados del puesto:', err)
    mensaje.value = 'Ocurrió un error al cargar los empleados para evaluación.'
    mensajeTipo.value = 'error'
    empleados.value = []
  }
}

onMounted(async () => {
  await Promise.all([
    cargarEmpleadosDelPuesto(),
    cargarAspectosDelPuesto()
  ])
  cargarEstadoEmpleadoActual()
  // Cachear inmediatamente el estado inicial del empleado actual
  guardarEstadoEmpleadoActual()
})

// Guarda el estado cada vez que cambian las calificaciones/comentarios del empleado actual
watch(aspectos, () => {
  guardarEstadoEmpleadoActual()
}, { deep: true })

watch(comentarios, () => {
  guardarEstadoEmpleadoActual()
})

watch(faltas, () => {
  guardarEstadoEmpleadoActual()
})

watch(incapacidades, () => {
  guardarEstadoEmpleadoActual()
})

</script>

<style scoped>
.text-grey-500 { color: #9e9e9e; }

.rating-toggle { min-width: 0; }

.rating-toggle :deep(.v-btn-toggle),
.rating-toggle :deep(.v-btn-group) {
  display: flex;
  flex-wrap: nowrap !important;
  gap: 14px;
  background: transparent;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.rating-toggle :deep(.v-btn) {
  min-width: 42px;
  height: 32px;
  padding: 0 10px;
  border-radius: 10px;
  font-weight: 800;
  letter-spacing: 0;
  font-variant-numeric: tabular-nums;
  background: rgba(0, 0, 0, 0.18);
}

.rating-toggle :deep(.v-btn--active) {
  background: rgba(76, 175, 80, 0.22) !important;
  box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.35);
}

.rating-row { display: flex; align-items: center; gap: 12px; justify-content: space-between; width: 100%; }
.rating-row .rating-toggle { flex: 1 1 auto; min-width: 0; }
.rating-row .ponderado-chip { margin-left: auto; }

.ponderado-chip {
  min-width: 190px;
  justify-content: flex-start;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.35);
}

.ponderado-chip :deep(.v-chip__content) {
  width: 100%;
  gap: 8px;
}

.ponderado-chip__label {
  font-weight: 800;
  letter-spacing: 0.02em;
  opacity: 0.92;
}

.ponderado-chip__value {
  margin-left: auto;
  font-weight: 900;
  font-variant-numeric: tabular-nums;
}

.chips-col { gap: 8px; flex-wrap: wrap; }

.aspect-row {
  position: relative;
}

.aspect-row::after {
  content: "";
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.06);
}

.aspect-row:last-of-type::after {
  display: none;
}

/* Mobile: compact buttons and reduced gaps */
@media (max-width: 600px) {
  .compact-card .v-card-text { padding: 12px !important; }
  .aspect-row { padding-top: 6px; padding-bottom: 6px; }
  .aspect-row .v-col { padding-top: 4px !important; padding-bottom: 4px !important; }
  .aspect-row .text-body-1 { font-size: 0.95rem; }
  .aspect-row .text-caption { font-size: 0.75rem; }
  .rating-toggle :deep(.v-btn-toggle),
  .rating-toggle :deep(.v-btn-group) {
    gap: 8px;
  }
  .rating-toggle :deep(.v-btn) { min-width: 36px; height: 28px; padding: 0 8px; border-radius: 9px; }
  .rating-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  .rating-row .ponderado-chip { margin-left: 0; min-width: 100%; }
  .chips-col { text-align: left; margin-top: 2px; gap: 6px; }
  .summary-chips { flex-wrap: wrap; justify-content: flex-start; gap: 6px; }
  .summary-chips .v-chip { height: 28px; font-size: 0.8rem; }
}

@media (max-width: 1100px) {
  .rating-toggle :deep(.v-btn-toggle),
  .rating-toggle :deep(.v-btn-group) {
    gap: 10px;
  }

  .rating-toggle :deep(.v-btn) {
    min-width: 38px;
    padding: 0 9px;
  }
}

/* Desktop: a little more breathing room */
@media (min-width: 960px) {
  .rating-toggle { gap: 10px; }
  .rating-toggle :deep(.v-btn) { min-width: 48px; height: 36px; padding: 0 12px; }
  .chips-col { gap: 10px; }
}
</style>
