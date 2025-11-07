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
        <v-card class="pa-4" hover @click="seleccionarPuesto(p)">
          <div class="text-h6">{{ p.nombre }}</div>
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
import { evaluacionService } from '@/services/apiService'


const isLoading = ref(false)
const mensaje = ref('')
const mensajeTipo = ref('info')

const puestos = ref([]) // { nombre: string, cantidad: number }[]
const puestoSeleccionado = ref(null)
const empleadosPorPuesto = ref([]) // empleados del puesto seleccionado
const mapaPuestoEmpleados = ref({}) // { [puesto_nombre]: Empleado[] }

const headersEmpleados = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Número de empleado', key: 'num_empleado' },
  { title: 'Acciones', key: 'actions', sortable: false },
]

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

const seleccionarPuesto = (puesto) => {
  router.push({
    name: 'EvaluacionProceso',
    params: { puestoNombre: puesto.nombre }
  })
}

onMounted(() => {
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