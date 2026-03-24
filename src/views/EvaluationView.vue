<template>
  <v-container class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">
          <v-icon class="mr-3" color="green">mdi-briefcase</v-icon>
          Selección de Puesto
        </h1>
        <p class="text-grey-500 ma-0">Elige el puesto para continuar con la evaluación</p>
      </div>
      <v-btn color="primary" :loading="isLoading" @click="cargarPuestos">
        <v-icon left>mdi-refresh</v-icon>
        Recargar
      </v-btn>
    </div>

    <!-- Mensajes -->
    <v-alert
      v-if="mensaje"
      class="mb-4"
      :type="mensajeTipo"
      variant="tonal"
      density="comfortable"
      dark
    >
      {{ mensaje }}
    </v-alert>

    <!-- Lista de Puestos -->
    <v-row>
      <v-col
        v-for="p in puestos"
        :key="p.nombre"
        cols="12"
        sm="6"
        md="4"
      >
        <!-- Si está evaluado o está cargando/verificando, bloqueo el click -->
        <v-card class="pa-4" hover @click="seleccionarPuesto(p)">
          <div class="d-flex align-center justify-space-between">
            <div class="text-h6">{{ p.nombre }}</div>
            <v-chip v-if="p.evaluado" color="green" variant="tonal" size="small">Evaluado</v-chip>
          </div>
          <div class="text-caption text-grey">Empleados: {{ p.cantidad }}</div>
        </v-card>
      </v-col>
    </v-row>
    <!-- Tabla de empleados eliminada para navegar directo al proceso -->
    <v-card v-if="puestoSeleccionado" class="mt-6" color="#2d2d2d" dark>
      <v-card-title class="d-flex align-center justify-space-between">
        <div>
          <v-icon left color="green">mdi-clipboard-check</v-icon>
          Evaluación: {{ puestoSeleccionado.nombre }}
        </div>
        <v-chip color="purple" variant="tonal">
          {{ empleadoIndex + 1 }} / {{ empleadosPorPuesto.length }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <div v-if="empleadoActual" class="d-flex align-center justify-space-between">
          <div>
            <div class="text-h6 font-weight-bold">{{ empleadoActual.nombre }}</div>
            <div class="text-grey-400">No. empleado: {{ empleadoActual.num_empleado }}</div>
          </div>
          <v-chip color="success" variant="outlined" v-if="empleadoActual.activo">Activo</v-chip>
          <v-chip color="grey" variant="outlined" v-else>No activo</v-chip>
        </div>
        <div v-else class="text-grey-400">
          No hay empleados para este puesto.
        </div>
      </v-card-text>
      <v-card-actions class="justify-space-between">
        <div>
          <v-btn color="blue" variant="tonal" @click="anteriorEmpleado" :disabled="empleadoIndex === 0">
            <v-icon left>mdi-chevron-left</v-icon>
            Anterior
          </v-btn>
          <v-btn color="orange" variant="tonal" class="ml-2" @click="omitirEmpleado" :disabled="!empleadoActual">
            <v-icon left>mdi-skip-next</v-icon>
            Omitir
          </v-btn>
        </div>
        <div>
          <v-btn color="green" class="mr-2" @click="iniciarEvaluacionActual" :disabled="!empleadoActual">
            <v-icon left>mdi-clipboard-text</v-icon>
            Evaluar
          </v-btn>
          <v-btn color="blue" variant="tonal" @click="siguienteEmpleado" :disabled="empleadoIndex >= empleadosPorPuesto.length - 1">
            Siguiente
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
    <!-- Empleados del Puesto Seleccionado -->
    <v-card v-if="puestoSeleccionado" class="mt-6" color="#2d2d2d" dark>
      <v-card-title>
        <v-icon left color="green">mdi-account-multiple</v-icon>
        Empleados de {{ puestoSeleccionado.nombre }}
      </v-card-title>
      <v-card-text>
        <v-data-table
          :items="empleadosPorPuesto"
          :headers="headersEmpleados"
          class="elevation-1"
          density="comfortable"
        >
          <template #item.actions="{ item }">
            <v-btn color="green" size="small" @click="iniciarEvaluacion(item)">
              <v-icon left>mdi-clipboard-check</v-icon>
              Evaluar
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { evaluacionService, puestoService, reporteService, dashboardService } from '@/services/apiService'


const isLoading = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('info')

const puestos = ref([]) // { nombre: string, cantidad: number, evaluado?: boolean }[]
const puestoSeleccionado = ref(null)
const empleadosPorPuesto = ref([]) // empleados del puesto seleccionado
const mapaPuestoEmpleados = ref({}) // { [puesto_nombre]: Empleado[] }

// NUEVO: mapa nombre→id y estado de evaluado por puesto
const mapPuestoNombreToId = ref({}) // { [nombreLower]: id }
const puestosEvaluados = ref({})     // { [nombre]: boolean }

// Helper para obtener estación y fecha actual
const estacionIdSesion = () =>
  sessionStorage.getItem('estacion_id') ||
  sessionStorage.getItem('estacionId') ||
  sessionStorage.getItem('station_id')

const mesActual = () => new Date().getMonth() + 1
const añoActual = () => new Date().getFullYear()

// Cargar catálogo de puestos para resolver nombre→id
const cargarMapaPuestos = async () => {
  const res = await puestoService.getPuestos()
  if (res.success) {
    const map = {}
    for (const p of res.puestos || []) {
      map[String(p.nombre).toLowerCase()] = p.id
    }
    mapPuestoNombreToId.value = map
  }
}

// Marcar qué puestos ya tienen evaluación este mes en la estación
const marcarPuestosEvaluados = async () => {
  const estacionId = estacionIdSesion()
  if (!estacionId || puestos.value.length === 0) return

  const m = mesActual()
  const y = añoActual()
  const evaluadoPorNombre = {}

  for (const p of puestos.value) {
    const puestoId = mapPuestoNombreToId.value[String(p.nombre).toLowerCase()]
    if (!puestoId) {
      evaluadoPorNombre[p.nombre] = false
      continue
    }

    const resRep = await reporteService.getReportesEstaciones({
      estacion_id: estacionId,
      puesto_id: puestoId,
      mes: m,
      año: y
    })

    let registros = Array.isArray(resRep.data) ? resRep.data : []
    registros = registros.filter(item => {
      const okPuesto = String(item.puesto_id) === String(puestoId)
      const itemEstacionId = item.estacion_id ?? item.estacionId ?? item.station_id ?? item.estacion?.id ?? item.estacion?.estacion_id
      const okEstacion = String(itemEstacionId) === String(estacionId)
      const d = item.fecha_evaluacion ? new Date(item.fecha_evaluacion) : null
      const itemMes = d ? (d.getMonth() + 1) : (Number(item.mes) || null)
      const itemAnio = d ? d.getFullYear() : (Number(item.año) || null)
      const okFecha = itemMes === m && itemAnio === y
      return okPuesto && okEstacion && okFecha
    })

    evaluadoPorNombre[p.nombre] = registros.length > 0
  }

  puestosEvaluados.value = evaluadoPorNombre
  puestos.value = puestos.value.map(item => ({ ...item, evaluado: !!evaluadoPorNombre[item.nombre] }))
}

const headersEmpleados = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Número de empleado', key: 'num_empleado' },
  { title: 'Acciones', key: 'actions', sortable: false },
]

const periodoActivo = ref(true)
const diasRestantes = ref(0)
const deadline = ref('')

const loadPeriodoEvaluacion = async () => {
  const usuarioId = sessionStorage.getItem('usuario_id')
  try {
    const res = await dashboardService.getAlertas(usuarioId)
    const todayStr = new Date().toISOString().split('T')[0]
    const dlStr = `${todayStr} 23:59:59`
    const now = new Date()
    const dl = new Date(String(dlStr).replace(' ', 'T'))
    const diffMs = dl.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    diasRestantes.value = daysLeft
    deadline.value = dlStr
    periodoActivo.value = daysLeft > 0
    if (daysLeft > 0) {
      mensaje.value = `Periodo activo. Restan ${daysLeft} días para evaluar.`
      mensajeTipo.value = 'info'
    } else {
      mensaje.value = `Periodo de evaluación vencido. Límite ${dlStr}.`
      mensajeTipo.value = 'error'
    }
  } catch (e) {}
}

const cargarPuestos = async () => {
  try {
    isLoading.value = true
    mensaje.value = ''
    try {
      const usuarioId = sessionStorage.getItem('usuario_id')
      if (!usuarioId) {
        mensaje.value = 'No se encontró el usuario en sesión'
        mensajeTipo.value = 'warning'
        puestos.value = []
        return
      }

      const res = await evaluacionService.get_empleados_by_usuario_estacion(usuarioId)
      if (!res.success) {
        mensaje.value = res.message || 'Error al obtener empleados de la estación'
        mensajeTipo.value = 'error'
        puestos.value = []
        return
      }

      const data = res.data
      const lista = Array.isArray(data?.puestos_con_empleados) ? data.puestos_con_empleados : []

      // Construir mapa { puesto_nombre: empleados[] } y lista de tarjetas
      const grupos = new Map()
      const mapa = {}
      for (const item of lista) {
        const nombre = item.puesto_nombre || 'Puesto'
        const empleados = Array.isArray(item.empleados) ? item.empleados : []
        grupos.set(nombre, (grupos.get(nombre) || 0) + empleados.length)
        mapa[nombre] = empleados
      }
      mapaPuestoEmpleados.value = mapa

      puestos.value = Array.from(grupos.entries()).map(([nombre, cantidad]) => ({ nombre, cantidad }))

      if (puestos.value.length === 0) {
        mensaje.value = 'No hay puestos con empleados en tu estación.'
        mensajeTipo.value = 'info'
      } else {
        mensaje.value = `Se cargaron ${puestos.value.length} puestos.`
        mensajeTipo.value = 'success'
      }

      // NUEVO: marcar puestos evaluados este mes
      await cargarMapaPuestos()
      await marcarPuestosEvaluados()

    } catch (err) {
      console.error('Error al cargar puestos:', err)
      mensaje.value = 'Ocurrió un error al cargar los puestos.'
      mensajeTipo.value = 'error'
      puestos.value = []
    } finally {
      isLoading.value = false
    }
  } catch (err) {
    console.error('Error al cargar puestos:', err)
    mensaje.value = 'Ocurrió un error al cargar los puestos.'
    mensajeTipo.value = 'error'
    puestos.value = []
  } finally {
    isLoading.value = false
  }
}

// Índice y empleado actual para evaluación secuencial
const empleadoIndex = ref(0)
const empleadoActual = computed(() => empleadosPorPuesto.value[empleadoIndex.value] || null)

const router = useRouter()

const seleccionarPuesto = async (puesto) => {
  if (isLoading.value) {
    mensaje.value = 'Cargando estado de evaluaciones…'
    mensajeTipo.value = 'info'
    // Permitimos continuar aunque esté cargando
  }
  if (puesto.evaluado) {
    mensaje.value = `Ya existe una evaluación de ${puesto.nombre} para este mes.`
    mensajeTipo.value = 'info'
    return
  }
  if (!periodoActivo.value) {
    mensaje.value = `Periodo de evaluación vencido. Límite ${deadline.value || ''}.`
    mensajeTipo.value = 'error'
    return
  }
  const estacionId = estacionIdSesion()
  const m = mesActual()
  const y = añoActual()
  let puestoId = mapPuestoNombreToId.value[String(puesto.nombre).toLowerCase()]
  if (!puestoId) {
    await cargarMapaPuestos()
    puestoId = mapPuestoNombreToId.value[String(puesto.nombre).toLowerCase()]
  }
  if (!estacionId || !puestoId) {
    mensaje.value = 'No se pudo validar el estado del puesto. Intenta de nuevo.'
    mensajeTipo.value = 'warning'
    return
  }
  const resRep = await reporteService.getReportesEstaciones({
    estacion_id: estacionId,
    puesto_id: puestoId,
    mes: m,
    año: y
  })
  let registros = Array.isArray(resRep.data) ? resRep.data : []
  registros = registros.filter(item => {
    const okPuesto = String(item.puesto_id) === String(puestoId)
    const itemEstacionId = item.estacion_id ?? item.estacionId ?? item.station_id ?? item.estacion?.id ?? item.estacion?.estacion_id
    const okEstacion = String(itemEstacionId) === String(estacionId)
    const d = item.fecha_evaluacion ? new Date(item.fecha_evaluacion) : null
    const itemMes = d ? (d.getMonth() + 1) : (Number(item.mes) || null)
    const itemAnio = d ? d.getFullYear() : (Number(item.año) || null)
    const okFecha = itemMes === m && itemAnio === y
    return okPuesto && okEstacion && okFecha
  })
  if (registros.length > 0) {
    mensaje.value = `Ya existe una evaluación de ${puesto.nombre} para este mes.`
    mensajeTipo.value = 'info'
    return
  }
  router.push({ name: 'EvaluacionProceso', params: { puestoNombre: puesto.nombre } })
}

onMounted(async () => {
  await loadPeriodoEvaluacion()
  cargarPuestos()
})

const iniciarEvaluacion = (empleado) => {
  mensaje.value = `Listo para evaluar a ${empleado.nombre} (No. ${empleado.num_empleado})`
  mensajeTipo.value = 'info'
  // Aquí puedes navegar o abrir un diálogo de evaluación.
  // Por ejemplo, si tienes un router:
  // router.push({ name: 'EvaluacionEmpleado', params: { empleadoId: empleado.id, puesto: puestoSeleccionado.value.nombre } })
  // ... existing code ...
}

// Navegación uno por uno
const anteriorEmpleado = () => {
  if (empleadoIndex.value > 0) empleadoIndex.value -= 1
}

const siguienteEmpleado = () => {
  if (empleadoIndex.value < empleadosPorPuesto.value.length - 1) {
    empleadoIndex.value += 1
  }
}

// Omitir simplemente avanza
const omitirEmpleado = () => {
  siguienteEmpleado()
}

// Evaluar al empleado actual (puedes conectar al flujo real aquí)
const iniciarEvaluacionActual = () => {
  if (!empleadoActual.value) return
  iniciarEvaluacion(empleadoActual.value)
}
</script>

<style scoped>
.selectable-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  cursor: pointer;
}
.selectable-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.3);
}
.text-grey-500 { color: #9e9e9e; }
</style>
