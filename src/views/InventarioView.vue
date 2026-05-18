<template>
  <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Inventario"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-view-dashboard"
    />

  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-2">
              <v-icon class="mr-3" color="green">mdi-clipboard-list</v-icon>
              Inventario de Estación
            </h1>
            <p class="text-grey-400 ma-0">Gestión de existencias y conteos</p>
          </div>
          
          <!-- Selector de Estación (Solo ADMIN) -->
          <div v-if="isAdmin" style="width: 300px">
            <v-select
              v-model="selectedStationId"
              :items="stations"
              item-title="nombre"
              item-value="id"
              label="Filtrar por Estación"
              variant="outlined"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-store"
              @update:model-value="loadInventory"
              bg-color="#2d2d2d"
            ></v-select>
          </div>
          <div v-else class="text-h6 text-green">
             {{ stationName }}
          </div>
        </div>

        <v-card dark color="#2d2d2d">
          <v-data-table
            :headers="headers"
            :items="inventory"
            :loading="loading"
            class="transparent"
            density="comfortable"
            no-data-text="No hay materiales asignados o seleccionados"
          >
             <template #item.stock="{ item }">
                <v-chip :color="getStockColor(item)" size="small" class="font-weight-bold">
                  {{ item.stock }}
                </v-chip>
             </template>
             
             <template #item.acciones="{ item }">
               <v-btn
                 color="success"
                 variant="tonal"
                 size="small"
                 prepend-icon="mdi-pencil"
                 @click="openUpdateDialog(item)"
               >
                 Actualizar
               </v-btn>
             </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogo Actualizar Stock -->
    <v-dialog v-model="dialog" max-width="400px">
      <v-card color="#2d2d2d">
        <v-card-title class="text-h6 pa-4">
          Actualizar Stock
        </v-card-title>
        <v-card-subtitle class="px-4 text-info">
          {{ selectedItem?.nombre }}
        </v-card-subtitle>
        <v-card-text class="pt-4">
           <div class="text-center mb-4">
             <div class="text-caption text-grey">Stock Actual</div>
             <div class="text-h4 font-weight-bold">{{ selectedItem?.stock }}</div>
             <div class="text-caption">{{ selectedItem?.unidad }}</div>
           </div>
           
           <v-text-field
             v-model.number="newStock"
             label="Nuevo Conteo Real"
             type="number"
             variant="outlined"
             min="0"
             class="mb-2"
           ></v-text-field>

           <v-text-field
             v-if="isAdmin"
             v-model.number="newMinStock"
             label="Stock Mínimo Requerido"
             type="number"
             variant="outlined"
             min="0"
             hint="Cantidad mínima antes de alerta"
             persistent-hint
           ></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="success" variant="elevated" @click="saveStock" :loading="saving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { stationService, materialService, dashboardService } from '@/services/apiService'

const rolId = sessionStorage.getItem('rol_id')
const isAdmin = computed(() => rolId === '1')

const stations = ref([])
const selectedStationId = ref(null)
const stationName = ref('')
const inventory = ref([])
const loading = ref(false)

const dialog = ref(false)
const selectedItem = ref(null)
const newStock = ref(0)
const newMinStock = ref(0)
const saving = ref(false)
const isInitialLoading = ref(true)
const loadingMessage = ref('Cargando Inventario EVA')
const loadingProgress = ref(0)

const headers = [
  { title: 'Material', key: 'nombre' },
  { title: 'Unidad', key: 'unidad' },
  { title: 'Stock Mínimo', key: 'stock_minimo', align: 'center' },
  { title: 'Stock Actual', key: 'stock', align: 'center' },
  { title: 'Acciones', key: 'acciones', align: 'end', sortable: false }
]

onMounted(async () => {
  isInitialLoading.value = true
  loadingProgress.value = 5
  loadingMessage.value = 'Validando inventario...'
  setTimeout(() => {
    loadingProgress.value = 100
    loadingMessage.value = 'Inventario cargado con éxito'
    setTimeout(() => {
      isInitialLoading.value = false
    }, 250)
  }, 2500)
  if (isAdmin.value) {
    await loadStations()
  } else {
    await loadUserStation()
  }
})

async function loadStations() {
  try {
    const res = await stationService.getEstaciones()
    if (res.success) {
      stations.value = res.data.filter(s => s.id !== 1) // Excluir TODAS
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadUserStation() {
  try {
    const userId = sessionStorage.getItem('usuario_id')
    const info = await dashboardService.getInfoEstacion(userId)
    if (info.success && info.data) {
        // Manejar estructura anidada: info.data (servicio) -> info.data.data (backend response) -> estacion
        const responseData = info.data.data || info.data
        const estId = responseData.estacion?.id || responseData.estacion_id || responseData.id
        
        console.log('Estación detectada:', estId, responseData)

        if (estId) {
          selectedStationId.value = estId
          stationName.value = responseData.estacion?.nombre || 'Mi Estación'
          await loadInventory()
        }
    }
  } catch (e) {
    console.error(e)
  }
}

async function loadInventory() {
  if (!selectedStationId.value) return
  loading.value = true
  try {
    const res = await materialService.getMaterialesEstacion(selectedStationId.value)
    if (res.success) {
      inventory.value = res.data
    } else {
      inventory.value = []
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function openUpdateDialog(item) {
  selectedItem.value = item
  newStock.value = item.stock
  newMinStock.value = item.stock_minimo || 1
  dialog.value = true
}

async function saveStock() {
  if (!selectedStationId.value || !selectedItem.value) return
  
  saving.value = true
  try {
    const res = await materialService.updateStock({
      estacion_id: selectedStationId.value,
      material_id: selectedItem.value.material_id || selectedItem.value.id,
      cantidad: newStock.value,
      stock_minimo: newMinStock.value,
      tipo: 'absoluto'
    })
    
    if (res.success) {
      dialog.value = false
      await loadInventory()
    }
  } catch (e) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

function getStockColor(item) {
  if (item.stock === 0) return 'error'
  if (item.stock < (item.stock_minimo || 5)) return 'warning'
  return 'success'
}
</script>