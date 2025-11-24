<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Bombas"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-fuel"
    />

    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="green">mdi-fuel</v-icon>
                  Gestión de Bombas
                </h1>
                <p class="text-grey-400 ma-0">Listado de bombas del sistema EVA</p>
              </div>
              <v-btn 
                color="info" 
                variant="outlined"
                @click="refreshData"
                :loading="loading"
                class="text-none"
              >
                <v-icon left>mdi-refresh</v-icon>
                Actualizar
              </v-btn>
              <v-btn 
                color="success"
                class="text-none ml-3"
                @click="bulkDialog = true"
              >
                <v-icon left>mdi-plus</v-icon>
                Agregar Bombas
              </v-btn>
            </div>

            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-expansion-panels variant="accordion">
                  <v-expansion-panel v-for="st in groupedStations" :key="st.name">
                    <v-expansion-panel-title>{{ st.name }} ({{ st.total }})</v-expansion-panel-title>
                    <v-expansion-panel-text>
                      <v-expansion-panels variant="accordion">
                        <v-expansion-panel v-for="pr in st.products" :key="pr.name">
                          <v-expansion-panel-title>{{ pr.name }} ({{ pr.items.length }})</v-expansion-panel-title>
                          <v-expansion-panel-text>
                            <v-data-table
                              density="compact"
                              :headers="groupHeaders"
                              :items="pr.items"
                              class="transparent"
                              :loading="loading"
                            >
                              <template #item.activo="{ item }">
                                <v-chip :color="getStatusColor(item.activo)" size="small" variant="flat">
                                  {{ getStatusText(item.activo) }}
                                </v-chip>
                              </template>
                            </v-data-table>
                          </v-expansion-panel-text>
                        </v-expansion-panel>
                      </v-expansion-panels>
                    </v-expansion-panel-text>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
            </v-card>
            <v-dialog v-model="bulkDialog" max-width="500">
              <v-card color="#2d2d2d" dark class="pa-4">
                <v-card-title class="text-h6 pb-2">
                  Agregar Bombas
                </v-card-title>
                <v-divider class="mb-4"></v-divider>
                <v-card-text class="pa-0">
                  <v-row dense>
                    <v-col cols="12" class="mb-3">
                      <v-select
                        v-model="selectedEstacionId"
                        :items="estacionesItems"
                        label="Estación"
                        variant="outlined"
                        density="comfortable"
                        clearable
                      />
                    </v-col>
                    <v-col cols="12" class="mb-3">
                      <v-select
                        v-model="selectedProductoId"
                        :items="productosItems"
                        label="Producto"
                        variant="outlined"
                        density="comfortable"
                        clearable
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-model.number="cantidadBombas"
                        type="number"
                        min="1"
                        label="Cantidad"
                        variant="outlined"
                        density="comfortable"
                        placeholder="Ej. 10"
                      />
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions class="mt-2">
                  <v-spacer></v-spacer>
                  <v-btn text @click="bulkDialog = false">Cancelar</v-btn>
                  <v-btn
                    color="green"
                    class="text-none"
                    @click="submitBulkCreate"
                    :loading="loading"
                    :disabled="!selectedEstacionId || !selectedProductoId || (cantidadBombas ?? 0) < 1"
                  >Agregar</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <v-snackbar v-model="snackbar" :timeout="4000" :color="snackbarColor" location="bottom right">
      {{ snackbarMsg }}
      <template #actions>
        <v-btn text @click="snackbar = false">Cerrar</v-btn>
      </template>
    </v-snackbar>
  </div>
  
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { bombaService, stationService, productoService } from '@/services/apiService'
import apiClient from '@/services/apiService'

const loading = ref(false)
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({ bombas: false })
const snackbar = ref(false)
const snackbarMsg = ref('')
const snackbarColor = ref('success')

const bombas = ref([])

const bulkDialog = ref(false)
const selectedEstacionId = ref(null)
const cantidadBombas = ref(1)

const estaciones = ref([])
const estacionesItems = computed(() => estaciones.value.map(e => ({ title: e.nombre, value: e.id })))

const productos = ref([])
const selectedProductoId = ref(null)
const productosItems = computed(() => {
  const allowed = ['Magna', 'Premium', 'Diesel']
  const order = new Map(allowed.map((n, i) => [n, i]))
  return productos.value
    .filter(p => allowed.includes(String(p?.nombre)))
    .sort((a, b) => (order.get(a.nombre) ?? 99) - (order.get(b.nombre) ?? 99))
    .map(p => ({ title: p.nombre, value: p.id }))
})
const usuarioId = sessionStorage.getItem('usuario_id')

const groupHeaders = [
  { title: 'Número', key: 'numero_bomba', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true }
]

const updateLoadingProgress = () => {
  const completedTasks = Object.values(dataLoadingStates.value).filter(Boolean).length
  const totalTasks = Object.keys(dataLoadingStates.value).length
  loadingProgress.value = Math.round((completedTasks / totalTasks) * 100)
  if (completedTasks === totalTasks) {
    setTimeout(() => { isInitialLoading.value = false }, 400)
  }
}

const loadBombas = async () => {
  try {
    loadingMessage.value = 'Cargando bombas...'
    loading.value = true
    const res = await bombaService.getBombas()
    if (res.success) {
      bombas.value = res.data
    } else {
      bombas.value = []
    }
    dataLoadingStates.value.bombas = true
    updateLoadingProgress()
  } catch (error) {
    dataLoadingStates.value.bombas = true
    updateLoadingProgress()
    snackbarColor.value = 'error'
    snackbarMsg.value = 'Error al cargar bombas'
    snackbar.value = true
  } finally {
    loading.value = false
  }
}




const groupedStations = computed(() => {
  const stations = {}
  for (const b of bombas.value) {
    const sName = b?.estacion?.nombre ?? `Estación ${b?.estacion_id ?? ''}`
    const pName = b?.producto?.nombre ?? `Producto ${b?.producto_id ?? ''}`
    if (!stations[sName]) stations[sName] = {}
    if (!stations[sName][pName]) stations[sName][pName] = []
    stations[sName][pName].push(b)
  }
  return Object.entries(stations).map(([sName, productsMap]) => ({
    name: sName,
    total: Object.values(productsMap).reduce((acc, arr) => acc + arr.length, 0),
    products: Object.entries(productsMap).map(([pName, items]) => ({ name: pName, items }))
  }))
})




const getStatusColor = (activo) => {
  return activo ? 'success' : 'error'
}

const getStatusText = (activo) => {
  return activo ? 'Activo' : 'Inactivo'
}

const refreshData = async () => {
  await loadBombas()
}

const initializeData = async () => {
  loadingProgress.value = 0
  await loadBombas()
}

const loadEstaciones = async () => {
  try {
    const res = await stationService.getEstaciones()
    if (res.success) estaciones.value = res.data
  } catch (e) { snackbarColor.value = 'error'; snackbarMsg.value = 'Error al cargar estaciones'; snackbar.value = true }
}

const loadProductos = async () => {
  try {
    const res = await productoService.getProductosByUsuarioEstacion(usuarioId)
    if (res.success) productos.value = Array.isArray(res.data) ? res.data : res.data.productos || []
  } catch (e) { snackbarColor.value = 'error'; snackbarMsg.value = 'Error al cargar productos'; snackbar.value = true }
}

const submitBulkCreate = async () => {
  if (!selectedEstacionId.value || !selectedProductoId.value || (cantidadBombas.value ?? 0) < 1) return
  loading.value = true
  try {
    const targetEstacionId = Number(selectedEstacionId.value)
    const targetProductoId = Number(selectedProductoId.value)
    const total = Number(cantidadBombas.value)

    const existingNumbers = new Set(
      bombas.value
        .filter(b => Number(b?.estacion_id) === targetEstacionId)
        .map(b => Number(b?.numero_bomba))
        .filter(n => !Number.isNaN(n))
    )

    let created = 0
    let next = existingNumbers.size ? Math.max(...existingNumbers) + 1 : 1

    while (created < total) {
      while (existingNumbers.has(next)) next++
      try {
        await apiClient.post('/api/newBomba', {
          numero_bomba: next,
          estacion_id: targetEstacionId,
          producto_id: targetProductoId,
          activo: true
        })
        existingNumbers.add(next)
        created++
        next++
      } catch (err) {
        next++
      }
    }

    bulkDialog.value = false
    await refreshData()
    if (created === total) {
      snackbarColor.value = 'success'
      snackbarMsg.value = `Se crearon ${created} bombas`
    } else if (created > 0) {
      snackbarColor.value = 'warning'
      snackbarMsg.value = `Se crearon ${created} de ${total} bombas`
    } else {
      snackbarColor.value = 'error'
      snackbarMsg.value = 'No se pudo crear bombas'
    }
    snackbar.value = true
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initializeData()
  loadEstaciones()
  loadProductos()
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.5s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.v-data-table { background: transparent !important; }
.v-data-table :deep(.v-data-table__wrapper) { background: transparent; }
.v-data-table :deep(th) { background: #1e1e1e !important; color: white !important; border-bottom: 1px solid #333 !important; }
.v-data-table :deep(td) { border-bottom: 1px solid #333 !important; padding: 8px 10px; font-size: 0.85rem; }
.v-data-table :deep(th) { padding: 8px 10px !important; }
.v-data-table :deep(tr:hover) { background: rgba(255, 255, 255, 0.05) !important; }
</style>