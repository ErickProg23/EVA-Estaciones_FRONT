<template>
  <!-- Encabezado y controles: fecha y turno -->
  <v-container fluid class="py-4">
    <v-card color="#2d2d2d" dark>
      <v-card-title class="text-h6">
        Lecturas
      </v-card-title>

      <v-card-text>
        <div class="sticky-controls">
          <v-row>
            <v-col cols="12" md="6">
              <v-menu
                v-model="menuFecha"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y
              >
                <template #activator="{ props }">
                  <v-text-field
                    v-bind="props"
                    :model-value="fechaSeleccionada"
                    label="Fecha"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    readonly
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker
                  v-model="pickerFecha"
                  :max="todayStr"
                  color="green"
                  @update:modelValue="val => { fechaSeleccionada = toYMD(val); menuFecha = false }"
                />
              </v-menu>
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

        <v-row>
          <v-col cols="12">
            <div class="text-subtitle-2 mb-2">Selecciona una bomba</div>
            <v-slide-group
              v-model="selectedPumpKey"
              show-arrows
              class="pump-selector"
            >
              <v-slide-group-item
                v-for="p in currentPumps"
                :key="pumpKey(p)"
                :value="pumpKey(p)"
              >
                <template #default="{ toggle }">
                  <v-btn
                    class="ma-2 pump-selector__btn"
                    size="x-large"
                    rounded="xl"
                    variant="tonal"
                    :color="pumpSelectorColor(p)"
                    @click="toggle"
                  >
                    <v-icon start v-if="selectedPumpKey === pumpKey(p)">mdi-pencil</v-icon>
                    <v-icon start v-else-if="pumpIsComplete(p)">mdi-check-circle</v-icon>
                    <v-icon start v-else>mdi-gas-station</v-icon>
                    {{ pumpLabel(p) }}
                  </v-btn>
                </template>
              </v-slide-group-item>
            </v-slide-group>
          </v-col>

          <v-col cols="12" v-if="selectedPump && selectedPumpStateKey">
            <v-card color="#3a3a3a" class="pump-card">
              <v-card-title class="py-2 text-body-2">{{ pumpLabel(selectedPump) }}</v-card-title>
              <v-card-text>
                <v-text-field
                  :model-value="formatNumber(pumpStates[selectedPumpStateKey]?.inicio ?? 0)"
                  label="Inicio (auto)"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
                <v-chip
                  v-if="limiteMaxLitrosSelected != null"
                  class="mb-3"
                  color="info"
                  size="small"
                  variant="tonal"
                >
                  Límite máx: {{ formatNumber(limiteMaxLitrosSelected) }} L
                </v-chip>
                <v-text-field
                  v-model="pumpStates[selectedPumpStateKey].final"
                  type="text"
                  inputmode="numeric"
                  label="Final"
                  :rules="reglaFinal(selectedPumpStateKey)"
                  variant="outlined"
                  density="comfortable"
                  :error-messages="getFinalError(selectedPumpStateKey)"
                  :messages="getFinalWarning(selectedPumpStateKey)"
                  :append-inner-icon="getFinalWarning(selectedPumpStateKey).length ? 'mdi-alert' : undefined"
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div class="bottom-actions">
          <v-btn
            color="green"
            class="text-none"
            size="x-large"
            block
            :loading="guardando"
            :disabled="!puedeGuardarProducto"
            @click="guardarLecturasProducto"
          >
            Guardar lecturas de {{ selectedProduct }}
          </v-btn>
          <div class="helper" v-if="productoStats.total">
            <span v-if="productoStats.faltantes">Faltan {{ productoStats.faltantes }} lecturas</span>
            <span v-else-if="productoStats.errores">Hay {{ productoStats.errores }} lecturas inválidas</span>
            <span v-else>Listo para guardar {{ productoStats.total }} lecturas</span>
          </div>
        </div>

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
import { bombaService, stationService } from '@/services/apiService'

const todayStr = new Date().toISOString().split('T')[0]
const turnos = ref([1, 2, 3])

const fechaSeleccionada = ref(todayStr)
const menuFecha = ref(false)
const pickerFecha = ref(new Date())
const turnoSeleccionado = ref(1)
const guardando = ref(false)
const mensaje = ref({ text: '', type: 'success', icon: 'mdi-check-circle' })
let messageTimer = null

const usuarioId = sessionStorage.getItem('usuario_id')
const estacionId = sessionStorage.getItem('estacion_id')

const pumps = ref([])
const estaciones = ref([])
const limitesMaxLitrosPorProductoId = ref({})
const limitesMaxLitrosPorTipo = ref({})
const productoTipoByProductoId = ref({})
const productoIdByTipo = ref({})

async function loadTurnosFromEstacion() {
  const estId = Number(estacionId ?? NaN)
  if (!Number.isFinite(estId)) return
  try {
    const res = await stationService.getEstaciones()
    if (res.success) estaciones.value = Array.isArray(res.data) ? res.data : []
  } catch {}

  const est = estaciones.value.find(e => Number(e?.id) === estId)
  const maxTurno = Number(est?.max_turno ?? est?.turnos_disponibles ?? NaN)
  const resolvedMax = Number.isFinite(maxTurno) && maxTurno >= 1 ? maxTurno : 3
  turnos.value = Array.from({ length: resolvedMax }, (_, i) => i + 1)
  if (!turnos.value.includes(turnoSeleccionado.value)) turnoSeleccionado.value = turnos.value[0]
}

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

function detectTipoFromText(text) {
  const s = String(text ?? '').toLowerCase()
  if (!s) return ''
  if (s.includes('magna')) return 'Magna'
  if (s.includes('premium')) return 'Premium'
  if (s.includes('diesel')) return 'Diesel'
  return ''
}

function extractProductoIdFromPump(p) {
  const idDirect = Number(p?.producto?.id ?? p?.producto?.producto_id ?? p?.producto_id ?? NaN)
  if (Number.isFinite(idDirect)) return idDirect
  const idFromProductoField = Number((typeof p?.producto === 'string' || typeof p?.producto === 'number') ? p.producto : NaN)
  return Number.isFinite(idFromProductoField) ? idFromProductoField : NaN
}

function reglaFinal(key){
  return [
    v => (v != null && String(v).trim() !== '') || 'Valor requerido',
    v => {
      const n = parseLectura(v)
      if (!Number.isFinite(n)) return true
      const inicio = Number(pumpStates[key].inicio ?? 0)
      return n >= inicio || `Debe ser mayor o igual a ${formatNumber(inicio)}`
    }
  ]
}


function productoIdFromPump(p) {
  const extracted = extractProductoIdFromPump(p)
  if (Number.isFinite(extracted)) return extracted
  const tipo = detectTipoFromText(p?.producto?.nombre ?? p?.producto) || normalizeProducto(p?.producto)
  const mapped = Number(productoIdByTipo.value?.[tipo] ?? NaN)
  return Number.isFinite(mapped) ? mapped : NaN
}

function productoIdFromPumpStateKey(key) {
  const parts = String(key ?? '').split(':')
  const id = Number(parts[1] ?? NaN)
  return Number.isFinite(id) ? id : NaN
}

function rebuildProductoTipoByProductoId() {
  const tipoById = {}
  const idByTipo = {}
  for (const p of pumps.value) {
    const pid = extractProductoIdFromPump(p)
    if (!Number.isFinite(pid)) continue
    const tipo = detectTipoFromText(p?.producto?.nombre ?? p?.producto) || ''
    if (!tipo) continue
    tipoById[pid] = tipo
    if (!Number.isFinite(Number(idByTipo[tipo] ?? NaN))) idByTipo[tipo] = pid
  }
  productoTipoByProductoId.value = tipoById
  productoIdByTipo.value = idByTipo
}

function computeLimitesTipoFromIds() {
  const out = {}
  const byId = limitesMaxLitrosPorProductoId.value || {}
  const tipoById = productoTipoByProductoId.value || {}
  for (const [pidStr, limVal] of Object.entries(byId)) {
    const pid = Number(pidStr)
    const lim = Number(limVal)
    if (!Number.isFinite(pid) || !Number.isFinite(lim)) continue
    const tipo = tipoById[pid]
    if (!tipo) continue
    out[tipo] = Number.isFinite(out[tipo]) ? Math.max(out[tipo], lim) : lim
  }
  return out
}

function limiteMaxLitrosForKey(key) {
  const productoId = productoIdFromPumpStateKey(key)
  if (!Number.isFinite(productoId)) return NaN
  const direct = Number(limitesMaxLitrosPorProductoId.value?.[productoId] ?? NaN)
  if (Number.isFinite(direct)) return direct
  const tipo = productoTipoByProductoId.value?.[productoId]
  if (!tipo) return NaN
  const byTipo = Number(limitesMaxLitrosPorTipo.value?.[tipo] ?? NaN)
  return Number.isFinite(byTipo) ? byTipo : NaN
}

function getFinalWarning(pumpStateKey) {
  if (!pumpStateKey) return []
  ensurePumpState(pumpStateKey)
  const raw = pumpStates[pumpStateKey].final
  if (raw == null || raw === '') return []
  const n = parseLectura(raw)
  if (!Number.isFinite(n)) return []
  const inicio = Number(pumpStates[pumpStateKey].inicio ?? 0)
  const limite = limiteMaxLitrosForKey(pumpStateKey)
  if (!Number.isFinite(limite) || limite <= 0) return []
  const diff = n - inicio
  if (Number.isFinite(diff) && diff > limite) return [`Advertencia: diferencia ${formatNumber(diff)} supera el límite ${formatNumber(limite)}`]
  return []
}

async function loadLimitesMaxLitros() {
  if (!usuarioId) return
  try {
    const res = await bombaService.getConfiguracionesLitrosUsuario(usuarioId)
    if (!res.success) return
    const configuraciones = Array.isArray(res.data?.configuraciones) ? res.data.configuraciones : []
    const productos = Array.isArray(res.data?.productos) ? res.data.productos : []
    const productoNombreById = {}
    for (const p of productos) {
      const pid = Number(p?.id ?? NaN)
      if (!Number.isFinite(pid)) continue
      productoNombreById[pid] = String(p?.nombre ?? '')
    }

    if (productos.length) {
      const tipoById = { ...(productoTipoByProductoId.value || {}) }
      const idByTipo = { ...(productoIdByTipo.value || {}) }
      for (const p of productos) {
        const pid = Number(p?.id ?? NaN)
        if (!Number.isFinite(pid)) continue
        const tipo = detectTipoFromText(p?.nombre) || ''
        if (!tipo) continue
        tipoById[pid] = tipo
        if (!Number.isFinite(Number(idByTipo[tipo] ?? NaN))) idByTipo[tipo] = pid
      }
      productoTipoByProductoId.value = tipoById
      productoIdByTipo.value = idByTipo
    }

    const map = {}
    const byTipoFromConfig = {}
    for (const c of configuraciones) {
      const productoId = Number(c?.producto_id ?? c?.producto ?? NaN)
      const limite = Number(c?.limite_max_litros ?? NaN)
      if (Number.isFinite(productoId) && Number.isFinite(limite)) map[productoId] = limite

      const tipoRaw =
        c?.producto_tipo ??
        c?.producto_nombre ??
        c?.producto_titulo ??
        c?.producto_texto ??
        (Number.isFinite(productoId) ? productoNombreById[productoId] : null) ??
        null
      if (Number.isFinite(limite) && tipoRaw != null) {
        const tipo = detectTipoFromText(String(tipoRaw)) || ''
        if (tipo) {
          byTipoFromConfig[tipo] = Number.isFinite(byTipoFromConfig[tipo]) ? Math.max(byTipoFromConfig[tipo], limite) : limite
        }
      }
    }
    limitesMaxLitrosPorProductoId.value = map

    const byTipoFromPumps = computeLimitesTipoFromIds()
    const merged = { ...byTipoFromPumps }
    for (const [tipo, lim] of Object.entries(byTipoFromConfig)) {
      const current = Number(merged[tipo] ?? NaN)
      merged[tipo] = Number.isFinite(current) ? Math.max(current, Number(lim)) : Number(lim)
    }
    limitesMaxLitrosPorTipo.value = merged
  } catch {}
}

const pumpsByProduct = computed(() => {
  const group = { Magna: [], Premium: [], Diesel: [] }
  for (const p of pumps.value) {
    const pid = extractProductoIdFromPump(p)
    const prod =
      (Number.isFinite(pid) ? productoTipoByProductoId.value?.[pid] : '') ||
      detectTipoFromText(p?.producto?.nombre ?? p?.producto) ||
      normalizeProducto(p.producto)
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

const prevLecturas = reactive({})
async function loadPrevLecturas() {
  if (!estacionId) return
  const { turno: prevTurno, fecha: prevFechaStr } = prevTurnoFecha(fechaSeleccionada.value, turnoSeleccionado.value)
  try {
    const res = await bombaService.getLecturasManualUltimas(estacionId, prevFechaStr, prevTurno)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${String(it.numero_bomba)}`
      const lectura = Number(it.cantidad ?? it.lectura ?? it.final ?? 0)
      prevLecturas[key] = lectura
    }
  } catch {}
}

function pumpKey(p) {
  const productoId = productoIdFromPump(p)
  const estacionId = Number(p?.estacion_id ?? NaN)
  return `${estacionId}:${productoId}:${p.numero_bomba}`
}

// Etiqueta de tarjeta
function pumpLabel(p) {
  return p.numero_bomba ? `Bomba ${p.numero_bomba}` : (p.nombre || p.numero_bomba || p.id)
}

function numeroVisibleBomba(p) {
  const primary = Number(p?.numero_bomba)
  if (Number.isFinite(primary)) return primary
  const alt = Number(p?.numero ?? p?.num ?? NaN)
  if (Number.isFinite(alt)) return alt
  const name = String(p?.nombre ?? '')
  const m = name.match(/\d+/)
  if (m) return Number(m[0])
  const idNum = Number(p?.id ?? NaN)
  return Number.isFinite(idNum) ? idNum : NaN
}

// Producto seleccionado para pestañas
const selectedProduct = ref('Magna')
const selectedPumpKey = ref('')

const selectedPump = computed(() => {
  const arr = currentPumps.value
  if (!arr.length) return null
  if (!selectedPumpKey.value) return null
  return arr.find(p => pumpKey(p) === selectedPumpKey.value) || null
})

const selectedPumpStateKey = computed(() => {
  return selectedPump.value ? selectedPumpKey.value : ''
})

const limiteMaxLitrosSelected = computed(() => {
  const lim = limiteMaxLitrosForKey(selectedPumpStateKey.value)
  return Number.isFinite(lim) && lim > 0 ? lim : null
})

function pumpIsComplete(p) {
  const key = pumpKey(p)
  ensurePumpState(key)
  const raw = pumpStates[key].final
  const n = parseLectura(raw)
  return raw != null && raw !== '' && Number.isFinite(n) && n > 0 && getFinalError(key).length === 0
}

function pumpSelectorColor(p) {
  const key = pumpKey(p)
  if (selectedPumpKey.value === key) return 'green'
  if (pumpIsComplete(p)) return 'green-darken-2'
  if (getFinalWarning(key).length) return 'amber-darken-2'
  return 'grey-darken-1'
}

// Validaciones y cálculos
function formatNumber(val) {
  const n = Number(val ?? 0)
  return n.toFixed(2)
}

function parseLectura(val) {
  const s = String(val ?? '').replace(/[\,\s]/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

function toYMD(val) {
  try {
    const d = val instanceof Date ? val : new Date(val)
    if (Number.isNaN(d.getTime())) return todayStr
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  } catch {
    return todayStr
  }
}

function keyLSPump(pump, fecha, turno) {
  const productoId = productoIdFromPump(pump)
  const estacionId = Number(pump?.estacion_id ?? NaN)
  return `manual:pump:${estacionId}:${productoId}:${pump.numero_bomba}:${fecha}:${turno}`
}

function prevTurnoFecha(fecha, turno) {
  const maxTurno = Math.max(...(turnos.value.length ? turnos.value : [3]))
  if (turno > 1) return { turno: turno - 1, fecha }
  const d = new Date(fecha)
  d.setDate(d.getDate() - 1)
  const prevDate = d.toISOString().split('T')[0]
  return { turno: maxTurno, fecha: prevDate }
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
  const prevVal = prevLecturas[key]
  if (Number.isFinite(prevVal)) {
    pumpStates[key].inicio = Number(prevVal)
    return
  }
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
  const raw = pumpStates[pumpNumero].final
  if (raw == null || raw === '') return []
  const n = parseLectura(raw)
  if (!Number.isFinite(n)) return ['Debe ser un número']
  const inicio = Number(pumpStates[pumpNumero].inicio ?? 0)
  if (n < inicio) return [`Debe ser mayor o igual a ${formatNumber(inicio)}`]
  return []
}

const productoStats = computed(() => {
  const arr = currentPumps.value
  let faltantes = 0
  let errores = 0
  for (const p of arr) {
    const key = pumpKey(p)
    ensurePumpState(key)
    const raw = pumpStates[key].final
    const n = parseLectura(raw)
    if (raw == null || raw === '' || !Number.isFinite(n) || n <= 0) faltantes++
    else if (getFinalError(key).length) errores++
  }
  return { total: arr.length, faltantes, errores }
})

const puedeGuardarProducto = computed(() => productoStats.value.total > 0 && productoStats.value.faltantes === 0 && productoStats.value.errores === 0)

async function guardarLecturasProducto() {
  mensaje.value.text = ''
  const stats = productoStats.value
  if (stats.total === 0) {
    mensaje.value = { text: 'No hay bombas para este producto', type: 'error', icon: 'mdi-alert-circle' }
    return
  }
  if (stats.faltantes > 0) {
    mensaje.value = { text: 'Completa todas las lecturas antes de guardar', type: 'error', icon: 'mdi-alert-circle' }
    return
  }
  if (stats.errores > 0) {
    mensaje.value = { text: 'Corrige las lecturas inválidas', type: 'error', icon: 'mdi-alert-circle' }
    return
  }
  guardando.value = true
  let ok = 0
  let fail = 0
  for (const pump of currentPumps.value) {
    try {
      const key = pumpKey(pump)
      const base = {
        lectura: parseLectura(pumpStates[key].final),
        fecha: fechaSeleccionada.value,
        turno: turnoSeleccionado.value,
        estacion_id: pump.estacion_id,
        numero_bomba: numeroVisibleBomba(pump)
      }
      const producto_id = productoIdFromPump(pump)
      let res = await bombaService.guardarLecturaManual({ ...base, producto_id })
      const errTxt = String(res?.data?.error || res?.message || '')
      if (!res.success && (errTxt.includes('producto_id') || errTxt.includes('unexpected'))) {
        res = await bombaService.guardarLecturaManual({ ...base, producto: normalizeProducto(pump.producto) })
      }
      if (res.success) {
        localStorage.setItem(keyLSPump(pump, base.fecha, base.turno), JSON.stringify({ ...base, producto_id }))
        recalcularInicioPump(pump)
        ok++
      } else {
        fail++
      }
    } catch (e) {
      console.error('Error guardando lectura', e)
      fail++
    }
  }
  if (fail === 0) {
    mensaje.value = { text: `Guardadas ${ok} lecturas de ${selectedProduct.value}`, type: 'success', icon: 'mdi-check-circle' }
    if (messageTimer) clearTimeout(messageTimer)
    messageTimer = setTimeout(() => { mensaje.value.text = '' }, 7000)
  } else {
    mensaje.value = { text: `Se guardaron ${ok} lecturas y fallaron ${fail}. Verifica producto y número de bomba.`, type: 'error', icon: 'mdi-alert-circle' }
  }
  guardando.value = false
}

async function loadBombas() {
  try {
    const res = await bombaService.getBombasByUsuarioEstacion(usuarioId)
    if (res.success) {
      pumps.value = Array.isArray(res.data) ? res.data : []
      rebuildProductoTipoByProductoId()
      limitesMaxLitrosPorTipo.value = {
        ...computeLimitesTipoFromIds(),
        ...(limitesMaxLitrosPorTipo.value || {})
      }
      pumps.value.forEach(p => ensurePumpState(pumpKey(p)))
      recalcularInicioAll()
      selectedPumpKey.value = ''
    } else {
      pumps.value = []
      selectedPumpKey.value = ''
    }
  } catch (e) {
    console.error('Error al cargar bombas', e)
    pumps.value = []
    selectedPumpKey.value = ''
  }
}

watch([fechaSeleccionada, turnoSeleccionado], async () => {
  pumps.value.forEach(p => {
    const key = pumpKey(p)
    ensurePumpState(key)
    pumpStates[key].final = 0
  })
  recalcularInicioAll()
})


watch(selectedProduct, () => {
  currentPumps.value.forEach(p => ensurePumpState(pumpKey(p)))
  recalcularInicioAll()
  selectedPumpKey.value = ''
})

onMounted(async () => {
  await loadTurnosFromEstacion()
  await loadBombas()
  await loadLimitesMaxLitros()
  await loadPrevLecturas()
  recalcularInicioAll()
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

.bottom-actions {
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: #2d2d2d;
  padding: 8px 0 12px;
}

.helper {
  margin-top: 6px;
  color: #c8c8c8;
  font-size: 0.9rem;
}

.pump-selector :deep(.v-slide-group__content) {
  padding: 4px 0;
}

.pump-selector__btn {
  min-width: 170px;
  height: 64px;
  font-size: 1.05rem;
  letter-spacing: 0.2px;
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
