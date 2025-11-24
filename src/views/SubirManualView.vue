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
            :key="pump.numero_bomba"
            cols="12"
            sm="6"
          >
            <v-card color="#3a3a3a" class="pump-card">
              <v-card-title class="py-2 text-body-2">{{ pumpLabel(pump) }}</v-card-title>
              <v-card-text>
                <v-text-field
                  :model-value="formatNumber(pumpStates[pumpKey(pump)]?.inicio ?? 0)"
                  label="Inicio (auto)"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
                <v-text-field
                  v-model.number="pumpStates[pumpKey(pump)].final"
                  type="number"
                  inputmode="decimal"
                  label="Final"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="getFinalError(pumpKey(pump))"
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

function normalizeProducto(prod) {
  const id = typeof prod === 'object' && prod !== null ? Number(prod.id ?? NaN) : typeof prod === 'number' ? prod : NaN
  const name = typeof prod === 'object' && prod !== null ? String(prod.nombre ?? '').toLowerCase() : typeof prod === 'string' ? prod.toLowerCase() : ''
  if (!Number.isNaN(id)) {
    if (id === 1) return 'Magna'
    if (id === 2) return 'Premium'
    if (id === 3) return 'Diesel'
  }
  if (name.includes('magna')) return 'Magna'
  if (name.includes('premium')) return 'Premium'
  if (name.includes('diesel')) return 'Diesel'
  return 'Magna'
}

const pumpsByProduct = computed(() => {
  const group = { Magna: [], Premium: [], Diesel: [] }
  for (const p of pumps.value) {
    const prod = normalizeProducto(p.producto)
    if (group[prod]) group[prod].push(p)
  }
  for (const k of Object.keys(group)) {
    group[k].sort((a, b) => Number(a.numero_bomba ?? 0) - Number(b.numero_bomba ?? 0))
  }
  return group
})

const currentPumps = computed(() => pumpsByProduct.value[selectedProduct.value] || [])

// Estado por bomba
const pumpStates = reactive({})
function ensurePumpState(key) {
  if (!pumpStates[key]) pumpStates[key] = { inicio: 0, final: null }
}

function pumpKey(p) {
  const productoId = Number(p?.producto?.id ?? p?.producto_id ?? NaN)
  const estacionId = Number(p?.estacion_id ?? NaN)
  return `${estacionId}:${productoId}:${p.numero_bomba}`
}

// Etiqueta de tarjeta
function pumpLabel(p) {
  return p.numero_bomba ? `Bomba ${p.numero_bomba}` : (p.nombre || p.numero_bomba || p.id)
}

// Producto seleccionado para pestañas
const selectedProduct = ref('Magna')

// Validaciones y cálculos
function formatNumber(val) {
  const n = Number(val ?? 0)
  return n.toFixed(2)
}

function keyLSPump(pump, fecha, turno) {
  const productoId = Number(pump?.producto?.id ?? pump?.producto_id ?? NaN)
  const estacionId = Number(pump?.estacion_id ?? NaN)
  return `manual:pump:${estacionId}:${productoId}:${pump.numero_bomba}:${fecha}:${turno}`
}

function prevTurnoFecha(fecha, turno) {
  if (turno > 1) return { turno: turno - 1, fecha }
  const d = new Date(fecha)
  d.setDate(d.getDate() - 1)
  const prevDate = d.toISOString().split('T')[0]
  return { turno: 3, fecha: prevDate }
}

function cargarPrevLecturaPump(pump, fecha, turno) {
  const { turno: prevTurno, fecha: prevFechaStr } = prevTurnoFecha(fecha, turno)
  const raw = localStorage.getItem(keyLSPump(pump, prevFechaStr, prevTurno))
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

function recalcularInicioPump(pump) {
  const key = pumpKey(pump)
  ensurePumpState(key)
  const prev = cargarPrevLecturaPump(pump, fechaSeleccionada.value, turnoSeleccionado.value)
  pumpStates[key].inicio = prev?.final ?? 0
}

function recalcularInicioAll() {
  pumps.value.forEach(p => {
    ensurePumpState(pumpKey(p))
    recalcularInicioPump(p)
  })
}

function getFinalError(pumpNumero) {
  ensurePumpState(pumpNumero)
  const val = pumpStates[pumpNumero].final
  if (val == null || val === '') return []
  const n = Number(val)
  if (Number.isNaN(n)) return ['Debe ser un número']
  if (n < pumpStates[pumpNumero].inicio) return ['El final no puede ser menor que el inicio']
  return []
}



async function guardarLecturaPump(pump) {
  ensurePumpState(pumpKey(pump))
  mensaje.value.text = ''
  const errors = getFinalError(pumpKey(pump))
  if (errors.length) {
    mensaje.value = { text: errors[0], type: 'error', icon: 'mdi-alert-circle' }
    return
  }
  guardando.value = true
  try {
    const base = {
      lectura: Number(pumpStates[pumpKey(pump)].final),
      fecha: fechaSeleccionada.value,
      turno: turnoSeleccionado.value,
      estacion_id: pump.estacion_id,
      numero_bomba: pump.numero_bomba
    }
    const producto_id = Number(pump?.producto?.id ?? pump?.producto_id)
    let res = await bombaService.guardarLecturaManual({ ...base, producto_id })
    const errTxt = String(res?.data?.error || res?.message || '')
    if (!res.success && (errTxt.includes('producto_id') || errTxt.includes('unexpected'))) {
      res = await bombaService.guardarLecturaManual({ ...base, producto: normalizeProducto(pump.producto) })
    }
    if (res.success) {
      localStorage.setItem(keyLSPump(pump, base.fecha, base.turno), JSON.stringify({ ...base, producto_id }))
      mensaje.value = { text: `Lectura guardada`, type: 'success', icon: 'mdi-check-circle' }
      recalcularInicioPump(pump)
    } else {
      mensaje.value = { text: res.message || 'Error al guardar la lectura', type: 'error', icon: 'mdi-alert-circle' }
    }
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
      pumps.value.forEach(p => ensurePumpState(pumpKey(p)))
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
  currentPumps.value.forEach(p => ensurePumpState(pumpKey(p)))
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