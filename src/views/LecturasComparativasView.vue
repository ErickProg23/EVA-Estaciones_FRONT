<template>
  <v-container fluid class="py-4">
    <v-card color="#2d2d2d" dark>
      <v-card-title class="text-h6">Lecturas comparativas</v-card-title>
      <v-card-text>
        <v-row class="mb-2">
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

        <v-tabs v-model="selectedProduct" grow color="green" class="mb-4">
          <v-tab value="Magna">Magna</v-tab>
          <v-tab value="Premium">Premium</v-tab>
          <v-tab value="Diesel">Diesel</v-tab>
        </v-tabs>

        <v-row>
          <v-col
            v-for="pump in currentPumps"
            :key="keyPump(pump)"
            cols="12"
            sm="6"
          >
            <v-card color="#3a3a3a" class="pump-card">
              <v-card-title class="py-2 text-body-2">{{ labelPump(pump) }}</v-card-title>
              <v-card-text>
                <v-text-field
                  :model-value="formatNumber(ultimaLectura(keyPump(pump)))"
                  label="Última guardada"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
                <v-text-field
                  v-model.number="encargadoInputs[keyPump(pump)]"
                  type="number"
                  inputmode="decimal"
                  label="Lectura encargado"
                  variant="outlined"
                  density="comfortable"
                />
                <v-text-field
                  :model-value="formatNumber(diferenciaPump(keyPump(pump)))"
                  label="Diferencia"
                  variant="outlined"
                  density="comfortable"
                  readonly
                />
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <v-row>
          <v-col cols="12" md="4">
            <v-alert variant="tonal" type="info">
              Total guardadas: {{ formatNumber(totalUltimas) }}
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert variant="tonal" type="success">
              Total encargado: {{ formatNumber(totalEncargado) }}
            </v-alert>
          </v-col>
          <v-col cols="12" md="4">
            <v-alert variant="tonal" type="warning">
              Diferencia total: {{ formatNumber(totalDiferencia) }}
            </v-alert>
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
const selectedProduct = ref('Magna')

const usuarioId = sessionStorage.getItem('usuario_id')
const estacionId = sessionStorage.getItem('estacion_id')

const mensaje = ref({ text: '', type: 'info', icon: 'mdi-information' })

const bombas = ref([])
const lecturasUltimas = reactive({})      // key -> número
const encargadoInputs = reactive({})      // key -> número

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
  return Number(p?.producto?.id ?? p?.producto_id ?? NaN)
}
function keyPump(p) {
  return `${p.estacion_id}:${productoId(p)}:${p.numero_bomba}`
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

function formatNumber(val) {
  const n = Number(val ?? 0)
  return n.toFixed(2)
}

function ultimaLectura(key) {
  const v = lecturasUltimas[key]
  return Number.isFinite(v) ? v : 0
}
function diferenciaPump(key) {
  const enc = Number(encargadoInputs[key] ?? 0)
  const ult = ultimaLectura(key)
  if (Number.isNaN(enc)) return 0
  return enc - ult
}

const totalUltimas = computed(() => {
  let sum = 0
  for (const p of currentPumps.value) sum += ultimaLectura(keyPump(p))
  return sum
})
const totalEncargado = computed(() => {
  let sum = 0
  for (const p of currentPumps.value) sum += Number(encargadoInputs[keyPump(p)] ?? 0)
  return sum
})
const totalDiferencia = computed(() => totalEncargado.value - totalUltimas.value)

async function loadBombas() {
  try {
    const res = await bombaService.getBombasByUsuarioEstacion(usuarioId)
    bombas.value = res.success ? (Array.isArray(res.data) ? res.data : []) : []
  } catch (e) {
    bombas.value = []
  }
}

async function loadUltimas() {
  if (!estacionId) return
  try {
    const res = await bombaService.getLecturasManualUltimas(estacionId, fechaSeleccionada.value, turnoSeleccionado.value)
    const list = res.success ? (Array.isArray(res.data) ? res.data : []) : []
    for (const it of list) {
      const key = `${it.estacion_id}:${it.producto_id}:${it.numero_bomba}`
      const lectura = Number(it.lectura ?? it.final ?? 0)
      lecturasUltimas[key] = lectura
      if (!(key in encargadoInputs)) encargadoInputs[key] = 0
    }
  } catch (e) {}
}

watch([fechaSeleccionada, turnoSeleccionado], async () => {
  await loadUltimas()
})

watch(selectedProduct, () => {
  // no-op, UI re-computa totals automáticamente
})

onMounted(async () => {
  await loadBombas()
  await loadUltimas()
})
</script>

<style scoped>
.pump-card { padding-bottom: 8px; }
.pump-card :deep(.v-field__input) { font-size: 1.05rem; }
</style>