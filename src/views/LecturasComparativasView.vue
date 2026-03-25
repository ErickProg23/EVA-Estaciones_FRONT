<template>
  <v-container fluid class="py-4">
    <v-card color="#2d2d2d" dark>
      <v-card-title class="text-h6">Lecturas comparativas</v-card-title>
      <v-card-text>
        <v-row class="mb-2">
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
                hide-header
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

        <div class="section-title">Producto</div>
        <v-tabs v-model="selectedProduct" grow color="green" class="mb-2 product-tabs">
          <v-tab value="Magna">Magna</v-tab>
          <v-tab value="Premium">Premium</v-tab>
          <v-tab value="Diesel">Diesel</v-tab>
        </v-tabs>

        <v-row class="mb-2 nexus-inputs">
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="nexusTotales[1]"
              label="Nexus total $ — Magna"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="nexusTotales[2]"
              label="Nexus total $ — Premium"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model.number="nexusTotales[3]"
              label="Nexus total $ — Diesel"
              type="number"
              variant="outlined"
              density="compact"
              hide-details="auto"
            />
          </v-col>
        </v-row>

        <v-row class="mb-2 justify-end">
          <v-col cols="auto">
            <v-btn color="info" class="mr-2" @click="openHistory" prepend-icon="mdi-history">
              Histórico
            </v-btn>
            <v-btn color="secondary" class="mr-2" @click="downloadPDF" prepend-icon="mdi-file-pdf-box">
              Exportar PDF
            </v-btn>
            <v-btn
              color="primary"
              @click="saveTotals"
              prepend-icon="mdi-content-save"
              :loading="savingTotals"
              :disabled="!canSaveTotals"
            >
              Guardar Totales
            </v-btn>
          </v-col>
        </v-row>

        <v-row class="mb-2" align="stretch">
          <v-col cols="12" md="4">
            <v-card variant="tonal" color="info" class="pa-4 h-100 d-flex flex-column justify-center">
              <div class="text-subtitle-1 font-weight-bold mb-2">
                <v-icon start icon="mdi-gas-station" size="small"></v-icon>
                Totales {{ selectedProduct }}
              </div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-body-2">Dif. Lecturas</span>
                <span class="text-h6">{{ formatNumber(totalDifLecturas) }}</span>
              </div>
              <div class="d-flex justify-space-between align-center">
                <span class="text-body-2">Importe ($)</span>
                <span class="text-h6">$ {{ formatMoney(totalDifPesosProducto) }}</span>
              </div>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card variant="tonal" color="success" class="pa-4 h-100">
              <div class="text-subtitle-1 font-weight-bold mb-3">
                <v-icon start icon="mdi-chart-box-outline" size="small"></v-icon>
                Totales Globales
              </div>
              <v-row dense>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-uppercase opacity-70">Lecturas</div>
                  <div class="text-h6">{{ formatNumber(totalDifLecturasAll) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-uppercase opacity-70">Importe ($)</div>
                  <div class="text-h6">$ {{ formatMoney(totalDifPesosGlobal) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-uppercase opacity-70">Nexus</div>
                  <div class="text-h6">$ {{ formatMoney(nexusTotalGlobal) }}</div>
                </v-col>
                <v-col cols="6" sm="3">
                  <div class="text-caption text-uppercase opacity-70">Diferencia</div>
                  <div class="text-h6 font-weight-bold" :class="diferenciaPesosGlobal < 0 ? 'text-red-accent-2' : ''">
                    $ {{ formatMoney(diferenciaPesosGlobal) }}
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>



        <v-data-table
          :headers="tableHeaders"
          :items="currentPumps"
          class="transparent sticky-first-col"
          density="compact"
          hide-default-footer
          :items-per-page="-1"
        >
          <template #item.bomba="{ item }">
            {{ labelPump(item) }}
          </template>
          <template #item.inicial="{ item }">
            {{ formatNumber(volumenInicialPump(keyPump(item))) }}
          </template>
          <template #item.final="{ item }">
            {{ formatOptionalNumber(volumenFinalPump(keyPump(item))) }}
          </template>
          <template #item.difLecturas="{ item }">
            {{ formatNumber(diferenciaLecturasPumpUI(keyPump(item))) }}
          </template>
          <template #item.difPesos="{ item }">
            $ {{ formatMoney(diferenciaLecturasPumpUI(keyPump(item)) * precioProductoId(productoId(item))) }}
          </template>
        </v-data-table>


        <v-dialog v-model="showMsgDialog" max-width="420">
          <v-card color="#2d2d2d">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" :color="mensaje.type === 'success' ? 'green' : (mensaje.type === 'error' ? 'red' : 'orange')">{{ mensaje.icon }}</v-icon>
              Resultado
            </v-card-title>
            <v-card-text class="text-body-1">
              {{ mensaje.text }}
            </v-card-text>
            <v-card-actions class="justify-end">
              <v-btn color="primary" variant="elevated" @click="showMsgDialog = false">Aceptar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-dialog v-model="historyDialog" max-width="1000">
          <v-card color="#2d2d2d" dark>
            <v-card-title class="d-flex align-center justify-space-between">
              <span class="d-flex align-center">
                <v-icon class="mr-2" color="info">mdi-history</v-icon>
                Histórico de Totales
              </span>
              <v-btn icon variant="text" @click="historyDialog = false">
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-row class="mb-2" align="end">
                <v-col cols="12" sm="5">
                  <v-text-field
                    v-model="historyFrom"
                    label="Desde"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" sm="5">
                  <v-text-field
                    v-model="historyTo"
                    label="Hasta"
                    type="date"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" sm="2" class="d-flex justify-end">
                  <v-btn color="info" variant="elevated" :loading="historyLoading" @click="fetchHistory" prepend-icon="mdi-magnify">
                    Buscar
                  </v-btn>
                </v-col>
              </v-row>

              <v-data-table
                :headers="historyHeaders"
                :items="historyRows"
                :loading="historyLoading"
                density="compact"
                class="transparent"
                no-data-text="Sin registros guardados en el rango"
              >
                <template #item.nexus="{ item }">
                  $ {{ formatOptionalMoney(item.nexus) }}
                </template>
                <template #item.importe="{ item }">
                  <span v-if="item.importe != null">$ {{ formatOptionalMoney(item.importe) }}</span>
                  <span v-else>—</span>
                </template>
                <template #item.diferencia="{ item }">
                  <span v-if="item.diferencia != null">$ {{ formatOptionalMoney(item.diferencia) }}</span>
                  <span v-else>—</span>
                </template>
                <template #item.acciones="{ item }">
                  <v-btn size="small" color="primary" variant="tonal" @click="loadFromHistory(item)">
                    Cargar
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { bombaService, productoService } from '@/services/apiService'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const todayStr = new Date().toISOString().split('T')[0]
const turnos = [1, 2, 3]

const fechaSeleccionada = ref(todayStr)
const menuFecha = ref(false)
const pickerFecha = ref(new Date())
const turnoSeleccionado = ref(1)
const selectedProduct = ref('Magna')

const usuarioId = sessionStorage.getItem('usuario_id')
const estacionId = sessionStorage.getItem('estacion_id')

const mensaje = ref({ text: '', type: 'info', icon: 'mdi-information' })
const savingTotals = ref(false)
const lastSavedSignature = ref(null)
const showMsgDialog = ref(false)

const historyDialog = ref(false)
const historyLoading = ref(false)
const historyRows = ref([])
const historyFrom = ref(shiftYMD(todayStr, -7))
const historyTo = ref(todayStr)

const historyHeaders = [
  { title: 'Fecha', key: 'fecha', sortable: true },
  { title: 'Turno', key: 'turno', sortable: true },
  { title: 'Nexus (Total)', key: 'nexus', sortable: true },
  { title: 'Importe (Total)', key: 'importe', sortable: true },
  { title: 'Diferencia', key: 'diferencia', sortable: true },
  { title: 'Acciones', key: 'acciones', sortable: false }
]

const bombas = ref([])
const difLecturasApi = reactive({})       // key -> número (API)
const preciosPorProducto = reactive({ 1: 0, 2: 0, 3: 0 })
const nexusTotales = reactive({ 1: 0, 2: 0, 3: 0 })
const volInicialByPump = reactive({})
const volFinalByPump = reactive({})

function formatMoney(val) {
  const n = Number(val ?? 0)
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function precioProductoId(id) {
  return Number(preciosPorProducto[id] ?? 0)
}
const selectedProductId = computed(() => {
  return selectedProduct.value === 'Magna' ? 1 : selectedProduct.value === 'Premium' ? 2 : selectedProduct.value === 'Diesel' ? 3 : NaN
})
const precioSeleccionado = computed(() => precioProductoId(selectedProductId.value))
const totalDifPesosProducto = computed(() => totalDifLecturas.value * precioSeleccionado.value)

const totalDifPesosGlobal = computed(() => {
  let sum = 0
  for (const p of bombas.value) {
    const pid = productoId(p)
    sum += diferenciaLecturasPumpUI(keyPump(p)) * precioProductoId(pid)
  }
  return sum
})

const nexusTotalGlobal = computed(() => {
  return Number(nexusTotales[1] ?? 0) + Number(nexusTotales[2] ?? 0) + Number(nexusTotales[3] ?? 0)
})
const diferenciaPesosGlobal = computed(() => nexusTotalGlobal.value - totalDifPesosGlobal.value)

function normalizeProductoName(prod) {
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

function productoId(p) {
  const id = Number(p?.producto?.id ?? p?.producto_id ?? NaN)
  if (Number.isFinite(id)) return id
  const name = normalizeProductoName(p.producto)
  if (name === 'Magna') return 1
  if (name === 'Premium') return 2
  if (name === 'Diesel') return 3
  return NaN
}
function keyPump(p) {
  return `${p.estacion_id}:${productoId(p)}:${String(p.numero_bomba)}`
}
function labelPump(p) {
  return `Bomba ${p.numero_bomba} (${normalizeProductoName(p.producto)})`
}

const pumpsByProduct = computed(() => {
  const group = { Magna: [], Premium: [], Diesel: [] }
  for (const p of bombas.value) {
    const prod = normalizeProductoName(p.producto)
    if (group[prod]) group[prod].push(p)
  }
  for (const k of Object.keys(group)) {
    group[k].sort((a, b) => Number(a.numero_bomba ?? 0) - Number(b.numero_bomba ?? 0))
  }
  return group
})
const currentPumps = computed(() => pumpsByProduct.value[selectedProduct.value] || [])

const tableHeaders = [
  { title: 'Bomba', key: 'bomba' },
  { title: 'Volumen inicial', key: 'inicial' },
  { title: 'Volumen final', key: 'final' },
  { title: 'Diferencia total lecturas', key: 'difLecturas' },
  { title: 'Pesos', key: 'difPesos' },
]

function diffColor(val) {
  const v = Number(val ?? 0)
  const a = Math.abs(v)
  if (a === 0) return 'success'
  if (a < 5) return 'warning'
  return 'error'
}

function formatNumber(val) {
  const n = Number(val ?? 0)
  return n.toFixed(2)
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

function shiftYMD(ymd, days) {
  const d = new Date(`${String(ymd)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return String(ymd)
  d.setDate(d.getDate() + Number(days || 0))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function listYMD(from, to) {
  const a = new Date(`${String(from)}T00:00:00`)
  const b = new Date(`${String(to)}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return []
  const start = a <= b ? a : b
  const end = a <= b ? b : a
  const out = []
  const cur = new Date(start)
  while (cur <= end) {
    out.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-${String(cur.getDate()).padStart(2, '0')}`)
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function diffDays(from, to) {
  const a = new Date(`${String(from)}T00:00:00`)
  const b = new Date(`${String(to)}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return NaN
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

function formatOptionalMoney(val) {
  const n = Number(val ?? NaN)
  return Number.isFinite(n) ? formatMoney(n) : ''
}

function diferenciaLecturasPump(key) {
  const api = Number(difLecturasApi[key] ?? 0)
  return Number.isFinite(api) ? api : 0
}
function volumenInicialPump(key) {
  const v = Number(volInicialByPump[key] ?? NaN)
  return Number.isFinite(v) ? v : 0
}
function volumenFinalPump(key) {
  const v = Number(volFinalByPump[key] ?? NaN)
  return Number.isFinite(v) ? v : null
}
function formatOptionalNumber(val) {
  const n = Number(val ?? NaN)
  return Number.isFinite(n) ? formatNumber(n) : ''
}
function diferenciaLecturasPumpUI(key) {
  const finalV = Number(volFinalByPump[key] ?? NaN)
  if (Number.isFinite(finalV)) return finalV - volumenInicialPump(key)
  return 0
}


const totalDifLecturas = computed(() => {
  let sum = 0
  for (const p of currentPumps.value) sum += diferenciaLecturasPumpUI(keyPump(p))
  return sum
})

const totalDifLecturasAll = computed(() => {
  let sum = 0
  for (const p of bombas.value) sum += diferenciaLecturasPumpUI(keyPump(p))
  return sum
})

const currentTotalsSignature = computed(() => {
  if (!estacionId) return ''

  const detalles = {}
  const getDifLect = (pid) => {
    let sum = 0
    for (const p of bombas.value) {
      if (productoId(p) === pid) {
        sum += diferenciaLecturasPump(keyPump(p))
      }
    }
    return sum
  }

  for (const pid of [1, 2, 3]) {
    const difLect = getDifLect(pid)
    const precio = Number(preciosPorProducto[pid] ?? 0)
    const difPesos = difLect * precio
    const nexus = Number(nexusTotales[pid] ?? 0)

    detalles[pid] = {
      nexus: Number.isFinite(nexus) ? Number(nexus.toFixed(4)) : 0,
      dif_lect: Number.isFinite(difLect) ? Number(difLect.toFixed(4)) : 0,
      precio: Number.isFinite(precio) ? Number(precio.toFixed(4)) : 0,
      dif_pesos: Number.isFinite(difPesos) ? Number(difPesos.toFixed(4)) : 0
    }
  }

  return JSON.stringify({
    estacion_id: String(estacionId),
    fecha: fechaSeleccionada.value,
    turno: Number(turnoSeleccionado.value),
    detalles
  })
})

const canSaveTotals = computed(() => {
  const sig = currentTotalsSignature.value
  if (!sig) return false
  if (savingTotals.value) return false
  if (lastSavedSignature.value && sig === lastSavedSignature.value) return false
  return true
})

async function loadBombas() {
  try {
    const res = await bombaService.getBombasByUsuarioEstacion(usuarioId)
    bombas.value = res.success ? (Array.isArray(res.data) ? res.data : []) : []
  } catch (e) {
    bombas.value = []
  }
}

async function loadPrecios() {
  try {
    const res = await productoService.getProductosByUsuarioEstacion(usuarioId)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    for (const prod of list) {
      const pid = Number(prod.id ?? NaN)
      const precio = Number(prod.precio ?? 0)
      if (Number.isFinite(pid)) preciosPorProducto[pid] = precio
    }
  } catch (e) {}
}

function prevTurnoFecha(fecha, turno) {
  if (turno > 1) return { turno: turno - 1, fecha }
  const d = new Date(fecha)
  d.setDate(d.getDate() - 1)
  const prevDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return { turno: 3, fecha: prevDate }
}

async function loadDifLecturas() {
  if (!estacionId) return
  try {
    const res = await bombaService.getLecturasManualDiferencias(estacionId, fechaSeleccionada.value, turnoSeleccionado.value)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    Object.keys(difLecturasApi).forEach(k => delete difLecturasApi[k])
    Object.keys(volInicialByPump).forEach(k => delete volInicialByPump[k])
    
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${String(it.numero_bomba)}`
      difLecturasApi[key] = Number(it.dif_lecturas ?? 0)
      const inicial = Number(it.final_prev ?? NaN)
      if (Number.isFinite(inicial)) volInicialByPump[key] = inicial
    }
  } catch (e) {}
}

async function loadVolInicial() {
  if (!estacionId) return
  const { turno: prevTurno, fecha: prevFechaStr } = prevTurnoFecha(fechaSeleccionada.value, turnoSeleccionado.value)
  try {
    const res = await bombaService.getLecturasManualUltimas(estacionId, prevFechaStr, prevTurno)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    Object.keys(volInicialByPump).forEach(k => delete volInicialByPump[k])
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${String(it.numero_bomba)}`
      const lectura = Number(it.cantidad ?? it.lectura ?? it.final ?? 0)
      volInicialByPump[key] = lectura
    }
  } catch (e) {}
}

async function loadVolFinal() {
  if (!estacionId) return
  try {
    const res = await bombaService.getLecturasManualUltimas(estacionId, fechaSeleccionada.value, turnoSeleccionado.value)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    Object.keys(volFinalByPump).forEach(k => delete volFinalByPump[k])
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${String(it.numero_bomba)}`
      const lectura = Number(it.cantidad ?? it.lectura ?? it.final ?? 0)
      volFinalByPump[key] = lectura
    }
  } catch (e) {
    Object.keys(volFinalByPump).forEach(k => delete volFinalByPump[k])
  }
}

async function loadNexusTotales() {
  if (!estacionId) return
  try {
    const res = await bombaService.getComparativaTotales(estacionId, fechaSeleccionada.value, turnoSeleccionado.value)

    const detallesObj = res?.detalles && typeof res.detalles === 'object' ? res.detalles : {}
    const nexusObj = res?.nexus_totales && typeof res.nexus_totales === 'object' ? res.nexus_totales : {}
    const hasDetalles = Object.keys(detallesObj).length > 0
    const hasNexus = Object.keys(nexusObj).length > 0

    if (res.success && hasDetalles) {
      nexusTotales[1] = detallesObj['1']?.nexus || 0
      nexusTotales[2] = detallesObj['2']?.nexus || 0
      nexusTotales[3] = detallesObj['3']?.nexus || 0

      if (detallesObj['1']?.precio) preciosPorProducto[1] = detallesObj['1'].precio
      if (detallesObj['2']?.precio) preciosPorProducto[2] = detallesObj['2'].precio
      if (detallesObj['3']?.precio) preciosPorProducto[3] = detallesObj['3'].precio

      lastSavedSignature.value = currentTotalsSignature.value || lastSavedSignature.value
    } else if (res.success && hasNexus) {
      nexusTotales[1] = nexusObj['1'] || 0
      nexusTotales[2] = nexusObj['2'] || 0
      nexusTotales[3] = nexusObj['3'] || 0

      lastSavedSignature.value = currentTotalsSignature.value || lastSavedSignature.value
    } else {
      resetNexusTotales()
      lastSavedSignature.value = null
    }
  } catch (e) {
    resetNexusTotales()
    lastSavedSignature.value = null
  }
}

function downloadPDF() {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(16)
  doc.text('Reporte de Lecturas Comparativas', 14, 15)

  doc.setFontSize(10)
  doc.text(`Fecha: ${fechaSeleccionada.value}`, 14, 22)
  doc.text(`Turno: ${turnoSeleccionado.value}`, 60, 22)

  let y = 30

  // Iterate products: Magna (1), Premium (2), Diesel (3)
  const productIds = [1, 2, 3]
  const productNames = { 1: 'Magna', 2: 'Premium', 3: 'Diesel' }

  productIds.forEach(pid => {
    const pName = productNames[pid]
    const pumps = pumpsByProduct.value[pName] || []

    if (pumps.length === 0) return

    // Header for product
    doc.setFontSize(12)
    doc.setTextColor(0, 100, 0) // Dark green
    doc.text(pName, 14, y)
    y += 2

    const rows = pumps.map(p => {
      const key = keyPump(p)
      const inicial = volumenInicialPump(key)
      const finalV = Number(volFinalByPump[key] ?? NaN)
      const difL = Number.isFinite(finalV) ? finalV - inicial : 0
      const precio = precioProductoId(pid)
      const difP = difL * precio
      return [
        `Bomba ${p.numero_bomba}`,
        formatNumber(inicial),
        Number.isFinite(finalV) ? formatNumber(finalV) : '',
        formatNumber(difL),
        `$ ${formatMoney(difP)}`
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['Bomba', 'Inicial', 'Final', 'Dif. Lecturas', 'Importe']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [45, 45, 45] },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 5

    // Product Totals
    let sumDifL = 0
    let sumDifP = 0
    pumps.forEach(p => {
      const key = keyPump(p)
      const difL = diferenciaLecturasPumpUI(key)
      sumDifL += difL
      sumDifP += difL * precioProductoId(pid)
    })

    const nexus = Number(nexusTotales[pid] ?? 0)
    const diff = nexus - sumDifP

    // Mini table for product totals
    autoTable(doc, {
      startY: y,
      head: [['Total Lecturas', 'Total Importe', 'Nexus', 'Diferencia']],
      body: [[
        formatNumber(sumDifL),
        `$ ${formatMoney(sumDifP)}`,
        `$ ${formatMoney(nexus)}`,
        `$ ${formatMoney(diff)}`
      ]],
      theme: 'plain',
      styles: { fontSize: 9, fontStyle: 'bold' },
      columnStyles: {
        3: { textColor: diff < 0 ? [255, 0, 0] : [0, 0, 0] }
      },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10
  })

  // Global Totals
  if (y > 250) {
    doc.addPage()
    y = 20
  }
  
  doc.setFontSize(14)
  doc.setTextColor(0, 0, 0)
  doc.text('Totales Globales', 14, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [['Lecturas Totales', 'Importe Total', 'Nexus Total', 'Diferencia Global']],
    body: [[
      formatNumber(totalDifLecturasAll.value),
      `$ ${formatMoney(totalDifPesosGlobal.value)}`,
      `$ ${formatMoney(nexusTotalGlobal.value)}`,
      `$ ${formatMoney(diferenciaPesosGlobal.value)}`
    ]],
    theme: 'grid',
    styles: { fontSize: 10, fontStyle: 'bold', halign: 'center' },
    headStyles: { fillColor: [0, 128, 0] }, // Green
    columnStyles: {
      3: { textColor: diferenciaPesosGlobal.value < 0 ? [255, 0, 0] : [0, 0, 0] }
    },
    margin: { left: 14 }
  })

  doc.save(`Reporte_Lecturas_${fechaSeleccionada.value}_Turno${turnoSeleccionado.value}.pdf`)
}

async function saveTotals() {
  if (!estacionId) return

  const sig = currentTotalsSignature.value
  if (!sig) {
    mensaje.value = { text: 'No hay datos para guardar', type: 'warning', icon: 'mdi-alert' }
    showMsgDialog.value = true
    return
  }
  if (lastSavedSignature.value && sig === lastSavedSignature.value) {
    mensaje.value = { text: 'Ya se guardaron estos totales. No hay cambios por guardar.', type: 'info', icon: 'mdi-information' }
    showMsgDialog.value = true
    return
  }

  savingTotals.value = true
  try {
    const detalles = {}

    const getDifLect = (pid) => {
      let sum = 0
      for (const p of bombas.value) {
        if (productoId(p) === pid) {
          sum += diferenciaLecturasPump(keyPump(p))
        }
      }
      return sum
    }

    for (const pid of [1, 2, 3]) {
      const difLect = getDifLect(pid)
      const precio = Number(preciosPorProducto[pid] ?? 0)
      const difPesos = difLect * precio
      const nexus = Number(nexusTotales[pid] ?? 0)

      detalles[pid] = {
        nexus,
        dif_lect: difLect,
        precio,
        dif_pesos: difPesos
      }
    }

    const data = {
      estacion_id: estacionId,
      fecha: fechaSeleccionada.value,
      turno: turnoSeleccionado.value,
      detalles
    }

    const res = await bombaService.saveComparativaTotales(data)
    if (res.success) {
      lastSavedSignature.value = currentTotalsSignature.value
      mensaje.value = { text: 'Totales guardados correctamente', type: 'success', icon: 'mdi-check' }
      showMsgDialog.value = true
    } else {
      mensaje.value = { text: res.message || 'Error al guardar', type: 'error', icon: 'mdi-alert' }
      showMsgDialog.value = true
    }
  } catch (error) {
    mensaje.value = { text: error?.message || 'Error al guardar', type: 'error', icon: 'mdi-alert' }
    showMsgDialog.value = true
  } finally {
    savingTotals.value = false
  }
}

function openHistory() {
  historyDialog.value = true
  if (historyRows.value.length === 0) fetchHistory()
}

async function fetchHistory() {
  if (!estacionId) return

  const from = historyFrom.value
  const to = historyTo.value
  const span = diffDays(from, to)
  if (!Number.isFinite(span)) {
    mensaje.value = { text: 'Rango de fechas inválido', type: 'warning', icon: 'mdi-alert' }
    showMsgDialog.value = true
    return
  }
  if (span > 31) {
    mensaje.value = { text: 'El rango máximo es de 31 días', type: 'warning', icon: 'mdi-alert' }
    showMsgDialog.value = true
    return
  }

  historyLoading.value = true
  try {
    const days = listYMD(from, to)
    const rows = []

    for (const day of days) {
      for (const t of [1, 2, 3]) {
        const res = await bombaService.getComparativaTotales(estacionId, day, t)
        if (!res?.success) continue

        const detallesObj = res?.detalles && typeof res.detalles === 'object' ? res.detalles : {}
        const nexusObj = res?.nexus_totales && typeof res.nexus_totales === 'object' ? res.nexus_totales : {}
        const hasDetalles = Object.keys(detallesObj).length > 0
        const hasNexus = Object.keys(nexusObj).length > 0
        if (!hasDetalles && !hasNexus) continue

        let totalNexus = 0
        let totalImporte = 0
        let hasImporte = false

        for (const pid of ['1', '2', '3']) {
          const det = detallesObj[pid]
          if (det && typeof det === 'object') {
            const nx = Number(det.nexus ?? 0)
            const imp = Number(det.dif_pesos ?? NaN)
            if (Number.isFinite(nx)) totalNexus += nx
            if (Number.isFinite(imp)) {
              totalImporte += imp
              hasImporte = true
            }
          } else if (hasNexus) {
            const nx = Number(nexusObj[pid] ?? 0)
            if (Number.isFinite(nx)) totalNexus += nx
          }
        }

        rows.push({
          fecha: day,
          turno: t,
          nexus: totalNexus,
          importe: hasImporte ? totalImporte : null,
          diferencia: hasImporte ? (totalNexus - totalImporte) : null
        })
      }
    }

    rows.sort((a, b) => {
      if (a.fecha !== b.fecha) return String(b.fecha).localeCompare(String(a.fecha))
      return Number(b.turno) - Number(a.turno)
    })

    historyRows.value = rows
  } catch (error) {
    mensaje.value = { text: error?.message || 'Error al consultar historial', type: 'error', icon: 'mdi-alert' }
    showMsgDialog.value = true
  } finally {
    historyLoading.value = false
  }
}

function loadFromHistory(item) {
  fechaSeleccionada.value = String(item.fecha)
  turnoSeleccionado.value = Number(item.turno)
  historyDialog.value = false
}

watch([fechaSeleccionada, turnoSeleccionado], async () => {
  await loadVolInicial()
  await loadVolFinal()
  await loadDifLecturas()
  await loadNexusTotales()
})

watch(fechaSeleccionada, () => {
  // Removed resetNexusTotales here as it's handled in the combined watcher above
})
function resetNexusTotales() {
  nexusTotales[1] = 0
  nexusTotales[2] = 0
  nexusTotales[3] = 0
}

watch(selectedProduct, () => {
  // no-op, UI re-computa totals automáticamente
})

onMounted(async () => {
  await loadBombas()
  await loadPrecios()
  await loadVolInicial()
  await loadVolFinal()
  await loadDifLecturas()
  await loadNexusTotales()
})
</script>

<style scoped>
.pump-card { padding-bottom: 8px; }
.pump-card :deep(.v-field__input) { font-size: 1.05rem; }

.section-title { font-weight: 600; opacity: 0.9; margin-bottom: 4px; }
.product-tabs :deep(.v-tab) { text-transform: none; }

.summary-chips {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.nexus-inputs { margin-bottom: 8px; }
.totals-grid { margin-bottom: 8px; }
.totals-title { font-weight: 600; margin-bottom: 4px; }
.totals-line { font-size: 0.95rem; opacity: 0.9; }

.sticky-first-col :deep(th:first-child),
.sticky-first-col :deep(td:first-child) {
  position: sticky;
  left: 0;
  background: #2d2d2d;
  z-index: 1;
}
.sticky-first-col :deep(th:first-child) {
  color: #fff;
}
</style>
