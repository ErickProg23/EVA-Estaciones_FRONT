<template>
  <!-- Encabezado y controles: fecha y turno -->
  <v-container fluid class="py-4">
    <v-card color="#2d2d2d" dark>
      <v-card-title class="text-h6">
        Lecturas manuales por bomba
      </v-card-title>

      <v-card-text>
        <div class="sticky-controls">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="fechaSeleccionada"
                type="date"
                label="Fecha"
                :max="todayStr"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="turnoSeleccionado"
                :items="turnos"
                label="Turno"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </div>

        <!-- Pestañas por producto para tablet -->
        <v-tabs
          v-model="selectedProduct"
          grow
          color="green"
          class="mb-4"
        >
          <v-tab value="Magna">Magna</v-tab>
          <v-tab value="Premium">Premium</v-tab>
          <v-tab value="Diesel">Diesel</v-tab>
        </v-tabs>

        <!-- Grilla 2 columnas en tablet -->
        <v-row>
          <v-col
            v-for="pump in currentPumps"
            :key="pump.id"
            cols="12"
            sm="6"
          >
            <v-card color="#3a3a3a" class="pump-card">
              <v-card-title class="py-2 text-body-2">{{ pumpLabel(pump) }}</v-card-title>
              <v-card-text>
                <v-text-field
                  :model-value="formatNumber(pumpStates[pump.id]?.inicio ?? 0)"
                  label="Inicio (auto)"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
                <v-text-field
                  v-model.number="pumpStates[pump.id].final"
                  type="number"
                  inputmode="decimal"
                  label="Final"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="getFinalError(pump.id)"
                />
                <v-text-field
                  :model-value="formatNumber(getDiferencia(pump.id))"
                  label="Diferencia"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-card-text>
              <v-card-actions>
                <v-btn
                  color="green"
                  class="text-none"
                  size="large"
                  block
                  :loading="guardando"
                  @click="guardarLecturaPump(pump)"
                >
                  Guardar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <v-alert
          v-if="mensaje.text"
          :type="mensaje.type"
          variant="tonal"
          class="mt-4"
          closable
          @click:close="mensaje.text = ''"
        >
          <v-icon class="mr-2">{{ mensaje.icon }}</v-icon>
          {{ mensaje.text }}
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { bombaService } from '@/services/apiService'

const todayStr = new Date().toISOString().split('T')[0]
const turnos = [1, 2, 3]

const fechaSeleccionada = ref(todayStr)
const turnoSeleccionado = ref(1)
const guardando = ref(false)
const mensaje = ref({ text: '', type: 'success', icon: 'mdi-check-circle' })

const usuarioId = sessionStorage.getItem('usuario_id')

const pumps = ref([])

const pumpsByProduct = computed(() => {
  const group = { Magna: [], Premium: [], Diesel: [] }
  for (const p of pumps.value) {
    const prod = normalizeProducto(p.producto)
    if (group[prod]) group[prod].push(p)
  }
  for (const k of Object.keys(group)) {
    group[k].sort((a, b) => Number(a.numero ?? 0) - Number(b.numero ?? 0))
  }
  return group
})

const currentPumps = computed(() => pumpsByProduct.value[selectedProduct.value] || [])

// Estado por bomba
const pumpStates = reactive({})
function ensurePumpState(id) {
  if (!pumpStates[id]) pumpStates[id] = { inicio: 0, final: null }
}

// Etiqueta de tarjeta
function pumpLabel(p) {
  return p.numero ? `Bomba ${p.numero}` : (p.nombre || p.id)
}

// Producto seleccionado para pestañas
const selectedProduct = ref('Magna')

// Validaciones y cálculos
function formatNumber(val) {
  const n = Number(val ?? 0)
  return n.toFixed(2)
}

function keyLSPump(pumpId, fecha, turno) {
  return `manual:pump:${pumpId}:${fecha}:${turno}`
}

function prevTurnoFecha(fecha, turno) {
  if (turno > 1) return { turno: turno - 1, fecha }
  const d = new Date(fecha)
  d.setDate(d.getDate() - 1)
  const prevDate = d.toISOString().split('T')[0]
  return { turno: 3, fecha: prevDate }
}

function cargarPrevLecturaPump(pumpId, fecha, turno) {
  const { turno: prevTurno, fecha: prevFechaStr } = prevTurnoFecha(fecha, turno)
  const raw = localStorage.getItem(keyLSPump(pumpId, prevFechaStr, prevTurno))
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function recalcularInicioPump(pumpId) {
  ensurePumpState(pumpId)
  const prev = cargarPrevLecturaPump(pumpId, fechaSeleccionada.value, turnoSeleccionado.value)
  pumpStates[pumpId].inicio = prev?.final ?? 0
}

function recalcularInicioAll() {
  pumps.value.forEach(p => {
    ensurePumpState(p.id)
    recalcularInicioPump(p.id)
  })
}

function getFinalError(pumpId) {
  ensurePumpState(pumpId)
  const val = pumpStates[pumpId].final
  if (val == null || val === '') return []
  const n = Number(val)
  if (Number.isNaN(n)) return ['Debe ser un número']
  if (n < pumpStates[pumpId].inicio) return ['El final no puede ser menor que el inicio']
  return []
}

function getDiferencia(pumpId) {
  ensurePumpState(pumpId)
  const n = Number(pumpStates[pumpId].final ?? 0)
  if (Number.isNaN(n)) return 0
  return Math.max(n - pumpStates[pumpId].inicio, 0)
}

async function guardarLecturaPump(pump) {
  ensurePumpState(pump.id)
  mensaje.value.text = ''
  const errors = getFinalError(pump.id)
  if (errors.length) {
    mensaje.value = { text: errors[0], type: 'error', icon: 'mdi-alert-circle' }
    return
  }
  guardando.value = true
  try {
    const data = {
      pumpId: pump.id,
      producto: normalizeProducto(pump.producto),
      fecha: fechaSeleccionada.value,
      turno: turnoSeleccionado.value,
      inicio: pumpStates[pump.id].inicio,
      final: Number(pumpStates[pump.id].final),
      diferencia: getDiferencia(pump.id),
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(keyLSPump(pump.id, data.fecha, data.turno), JSON.stringify(data))
    mensaje.value = { text: `Lectura guardada: ${pump.nombre}`, type: 'success', icon: 'mdi-check-circle' }
    recalcularInicioPump(pump.id)
  } catch (err) {
    console.error(err)
    mensaje.value = { text: 'Error al guardar la lectura', type: 'error', icon: 'mdi-alert-circle' }
  } finally {
    guardando.value = false
  }
}

async function loadBombas() {
  try {
    const res = await bombaService.getBombasByUsuarioEstacion(usuarioId)
    if (res.success) {
      pumps.value = Array.isArray(res.data) ? res.data : []
      pumps.value.forEach(p => ensurePumpState(p.id))
      recalcularInicioAll()
    } else {
      pumps.value = []
    }
  } catch (e) {
    console.error('Error al cargar bombas', e)
    pumps.value = []
  }
}

watch([fechaSeleccionada, turnoSeleccionado], () => {
  recalcularInicioAll()
})

watch(selectedProduct, () => {
  currentPumps.value.forEach(p => ensurePumpState(p.id))
  recalcularInicioAll()
})

onMounted(() => {
  loadBombas()
})
</script>

<style scoped>
/* Controles pegajosos (tablet) */
.sticky-controls {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #2d2d2d;
  padding-top: 8px;
  padding-bottom: 8px;
}

/* Tarjeta de bomba con más espacio táctil */
.pump-card {
  padding-bottom: 8px;
}

/* Mejora de tamaño de los inputs para tablet */
.pump-card :deep(.v-field__input) {
  font-size: 1.05rem;
}
</style>