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
            <v-btn color="secondary" class="mr-2" @click="downloadPDF" prepend-icon="mdi-file-pdf-box">
              Exportar PDF
            </v-btn>
            <v-btn color="primary" @click="saveTotals" prepend-icon="mdi-content-save">
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
          <template #item.difLecturas="{ item }">
            {{ formatNumber(diferenciaLecturasPump(keyPump(item))) }}
          </template>
          <template #item.difPesos="{ item }">
            $ {{ formatMoney(diferenciaLecturasPump(keyPump(item)) * precioProductoId(productoId(item))) }}
          </template>
        </v-data-table>

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

const bombas = ref([])
const difLecturasApi = reactive({})       // key -> número (API)
const preciosPorProducto = reactive({ 1: 0, 2: 0, 3: 0 })
const nexusTotales = reactive({ 1: 0, 2: 0, 3: 0 })

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
    sum += diferenciaLecturasPump(keyPump(p)) * precioProductoId(pid)
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
  { title: 'Diferencia total lecturas', key: 'difLecturas' },
  { title: 'Pesos $', key: 'difPesos' },
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

function diferenciaLecturasPump(key) {
  const api = Number(difLecturasApi[key] ?? 0)
  return Number.isFinite(api) ? api : 0
}


const totalDifLecturas = computed(() => {
  let sum = 0
  for (const p of currentPumps.value) sum += diferenciaLecturasPump(keyPump(p))
  return sum
})

const totalDifLecturasAll = computed(() => {
  let sum = 0
  for (const p of bombas.value) sum += diferenciaLecturasPump(keyPump(p))
  return sum
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
    // Reset difLecturasApi before filling
    Object.keys(difLecturasApi).forEach(k => delete difLecturasApi[k])
    
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${String(it.numero_bomba)}`
      difLecturasApi[key] = Number(it.dif_lecturas ?? 0)
    }
  } catch (e) {}
}

async function loadNexusTotales() {
  if (!estacionId) return
  try {
    const res = await bombaService.getComparativaTotales(estacionId, fechaSeleccionada.value, turnoSeleccionado.value)
    if (res.success && res.detalles) {
      nexusTotales[1] = res.detalles['1']?.nexus || 0
      nexusTotales[2] = res.detalles['2']?.nexus || 0
      nexusTotales[3] = res.detalles['3']?.nexus || 0
      
      // Restore saved prices to ensure historical accuracy
      if (res.detalles['1']?.precio) preciosPorProducto[1] = res.detalles['1'].precio
      if (res.detalles['2']?.precio) preciosPorProducto[2] = res.detalles['2'].precio
      if (res.detalles['3']?.precio) preciosPorProducto[3] = res.detalles['3'].precio
    } else if (res.success && res.nexus_totales) {
      nexusTotales[1] = res.nexus_totales['1'] || 0
      nexusTotales[2] = res.nexus_totales['2'] || 0
      nexusTotales[3] = res.nexus_totales['3'] || 0
    } else {
      resetNexusTotales()
    }
  } catch (e) {
    resetNexusTotales()
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
      const difL = diferenciaLecturasPump(key)
      const precio = precioProductoId(pid)
      const difP = difL * precio
      return [
        `Bomba ${p.numero_bomba}`,
        formatNumber(difL),
        `$ ${formatMoney(difP)}`
      ]
    })

    autoTable(doc, {
      startY: y,
      head: [['Bomba', 'Dif. Lecturas', 'Importe']],
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
      const difL = diferenciaLecturasPump(key)
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
          nexus: nexus,
          dif_lect: difLect,
          precio: precio,
          dif_pesos: difPesos
      }
  }

  const data = {
    estacion_id: estacionId,
    fecha: fechaSeleccionada.value,
    turno: turnoSeleccionado.value,
    detalles: detalles
  }

  const res = await bombaService.saveComparativaTotales(data)
  if (res.success) {
    mensaje.value = { text: 'Totales guardados correctamente', type: 'success', icon: 'mdi-check' }
  } else {
    mensaje.value = { text: res.message || 'Error al guardar', type: 'error', icon: 'mdi-alert' }
  }
}

watch([fechaSeleccionada, turnoSeleccionado], async () => {
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
</style>