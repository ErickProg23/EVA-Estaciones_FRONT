<template>

  <div class="fade-in">
    <v-container fluid class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold text-white mb-2">
            <v-icon class="mr-3" color="green">mdi-oil</v-icon>
            Productos
          </h1>
          <p class="text-grey-400 ma-0">
            Catálogo de productos de combustible
            <span v-if="isAdmin && selectedEstacionNombre">· {{ selectedEstacionNombre }}</span>
          </p>
        </div>
      </div>

      <LoadingWave
        v-if="loading && showLoadingOverlay"
        :show="loading && showLoadingOverlay"
        title="Cargando Productos"
        message="Obteniendo catálogo de productos"
        icon="mdi-oil"
      />

      <v-card dark color="#2d2d2d">
        <v-card-text class="pa-0">
          <v-progress-linear
            v-if="loading && !showLoadingOverlay"
            indeterminate
            color="green"
            height="2"
          />

          <div class="pa-4 pb-0 d-flex flex-wrap ga-3">
            <v-select
              v-if="isAdmin"
              v-model="selectedEstacionId"
              :items="estacionOptions"
              label="Estación"
              prepend-inner-icon="mdi-gas-station"
              class="flex-grow-1"
            />
            <v-text-field
              v-model="search"
              label="Buscar"
              prepend-inner-icon="mdi-magnify"
              class="flex-grow-1"
            />
          </div>

          <v-data-table
            :headers="headers"
            :items="filteredItems"
            :items-per-page="10"
            :loading="loading"
            class="custom-table"
          >
            <template #item.activo="{ item }">
              <v-chip :color="item.activo ? 'green' : 'red'" variant="tonal" size="small">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>
            <template #item.precio="{ item }">
              <span class="text-white">$ {{ formatPrecio(item.precio) }}</span>
            </template>
            <template #item.actions="{ item }">
              <v-btn
                color="green"
                variant="tonal"
                size="small"
                class="text-none"
                @click="openEdit(item)"
              >
                <v-icon left size="18">mdi-pencil</v-icon>
                Editar precio
              </v-btn>
            </template>
          </v-data-table>

          <v-alert
            v-if="message.text"
            :type="message.type"
            variant="tonal"
            class="mt-4"
            closable
            @click:close="message.text = ''"
          >
            <v-icon>{{ message.icon }}</v-icon>
            {{ message.text }}
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Diálogo editar precio -->
      <v-dialog v-model="showDialog" max-width="420px" persistent>
        <v-card dark color="#2d2d2d">
          <v-card-title class="text-h6">
            <v-icon left color="green">mdi-currency-usd</v-icon>
            Editar precio
          </v-card-title>
          <v-card-text>
            <p class="text-grey-400 mb-4">
              Producto: <span class="text-white font-weight-bold">{{ selectedProducto?.nombre }}</span>
            </p>
            <v-text-field
              v-model.number="newPrecio"
              label="Nuevo precio"
              type="number"
              step="0.01"
              prepend-inner-icon="mdi-currency-usd"
              variant="outlined"
              :rules="[rules.required, rules.nonNegative]"
              required
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="outlined" color="grey" class="text-none" @click="closeDialog">
              Cancelar
            </v-btn>
            <v-btn :loading="saving" color="green" class="text-none" @click="savePrecio">
              Guardar
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { productoService, stationService } from '@/services/apiService'

const loading = ref(true)
const showLoadingOverlay = ref(false)
const saving = ref(false)
const search = ref('')
const productos = ref([])
const productosCache = ref({})

// Mensajes para alertas
const message = ref({ text: '', type: 'success', icon: 'mdi-check-circle' })

const headers = [
  { title: 'ID', key: 'id', align: 'start', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Precio', key: 'precio', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const usuarioId = sessionStorage.getItem('usuario_id')
const rolId = sessionStorage.getItem('rol_id')
const isAdmin = computed(() => String(rolId ?? '') === '1')

const estaciones = ref([])
const selectedEstacionId = ref(null)

const estacionOptions = computed(() => {
  return estaciones.value
    .filter(e => e && e.nombre !== 'TODAS')
    .map(e => ({ title: e.nombre, value: e.id }))
})

const selectedEstacionNombre = computed(() => {
  if (!selectedEstacionId.value) return ''
  const est = estaciones.value.find(e => String(e.id) === String(selectedEstacionId.value))
  return est?.nombre || ''
})

const filteredItems = computed(() => {
  const term = search.value?.toLowerCase() || ''
  return productos.value.filter(p => {
    const nombre = String(p.nombre || '').toLowerCase()
    const precioStr = String(p.precio ?? '').toLowerCase()
    const idStr = String(p.id ?? '').toLowerCase()
    return nombre.includes(term) || precioStr.includes(term) || idStr.includes(term)
  })
})

const formatPrecio = (val) => {
  const n = Number(val ?? 0)
  return n.toFixed(2)
}

// Diálogo edición
const showDialog = ref(false)
const selectedProducto = ref(null)
const newPrecio = ref(null)

const openEdit = (producto) => {
  selectedProducto.value = producto
  newPrecio.value = Number(producto.precio ?? 0)
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  selectedProducto.value = null
  newPrecio.value = null
}

const rules = {
  required: (v) => (v === 0 || !!v) || 'Este campo es requerido',
  nonNegative: (v) => Number(v) >= 0 || 'Debe ser mayor o igual a 0',
}

const loadProductos = async ({ forceRefresh = false, showOverlay = false } = {}) => {
  const cacheKey = isAdmin.value && selectedEstacionId.value ? `estacion:${selectedEstacionId.value}` : `usuario:${usuarioId || 'na'}`
  if (!forceRefresh && productosCache.value[cacheKey]) {
    productos.value = productosCache.value[cacheKey]
    return
  }

  showLoadingOverlay.value = !!showOverlay
  loading.value = true
  try {
    const res = isAdmin.value && selectedEstacionId.value
      ? await productoService.getProductosByEstacion(selectedEstacionId.value)
      : await productoService.getProductosByUsuarioEstacion(usuarioId)
    if (res.success) {
      productos.value = res.data
      productosCache.value = { ...productosCache.value, [cacheKey]: res.data }
    } else {
      productos.value = []
      message.value = { text: res.message || 'No se pudieron obtener productos', type: 'error', icon: 'mdi-alert-circle' }
    }
  } catch (err) {
    console.error('Error al cargar productos:', err)
    message.value = { text: 'Error de conexión al cargar productos', type: 'error', icon: 'mdi-alert-circle' }
  } finally {
    loading.value = false
    showLoadingOverlay.value = false
  }
}

const savePrecio = async () => {
  if (!selectedProducto.value) return
  saving.value = true
  message.value.text = ''
  try {
    const res = await productoService.updatePrecioProducto(
      selectedProducto.value.id,
      Number(newPrecio.value),
      usuarioId,
      isAdmin.value ? selectedEstacionId.value : null
    )
    if (res.success) {
      message.value = { text: res.message || 'Precio actualizado correctamente', type: 'success', icon: 'mdi-check-circle' }
      await loadProductos({ forceRefresh: true, showOverlay: false })
      closeDialog()
    } else {
      message.value = { text: res.message || 'No se pudo actualizar el precio', type: 'error', icon: 'mdi-alert-circle' }
    }
  } catch (err) {
    console.error('Error al actualizar precio:', err)
    message.value = { text: 'Error de conexión al actualizar precio', type: 'error', icon: 'mdi-alert-circle' }
  } finally {
    saving.value = false
  }
}

const loadEstaciones = async () => {
  try {
    const res = await stationService.getEstaciones()
    if (res.success) estaciones.value = Array.isArray(res.data) ? res.data : []
  } catch {}
}

onMounted(async () => {
  if (isAdmin.value) {
    await loadEstaciones()
    const stored = sessionStorage.getItem('estacion_id')
    selectedEstacionId.value = stored ? Number(stored) : (estacionOptions.value[0]?.value ?? null)
  }
  await loadProductos({ forceRefresh: true, showOverlay: true })
})

watch(selectedEstacionId, async () => {
  if (!isAdmin.value) return
  await loadProductos({ forceRefresh: false, showOverlay: false })
})
</script>

<style scoped>
.fade-in { animation: fadeIn 0.4s ease-in; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

.custom-table { background: transparent !important; }
.custom-table .v-data-table__wrapper { background: transparent; }
.custom-table .v-table { width: 100%; }
</style>
