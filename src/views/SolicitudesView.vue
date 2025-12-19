<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-2">
              <v-icon class="mr-3" color="blue">mdi-clipboard-list-outline</v-icon>
              Solicitudes de Material
            </h1>
            <p class="text-grey-400 ma-0">Gestión de solicitudes de insumos y materiales</p>
          </div>
          <v-btn 
            color="primary" 
            class="text-none"
            @click="dialog = true"
            prepend-icon="mdi-plus"
          >
            Nueva Solicitud
          </v-btn>
        </div>

        <v-card dark color="#2d2d2d">
          <v-data-table
            :headers="headers"
            :items="solicitudes"
            :loading="loading"
            class="transparent"
            density="comfortable"
            no-data-text="No hay solicitudes registradas"
          >
            <template #item.estado="{ item }">
              <v-chip
                :color="getStatusColor(item.estado)"
                size="small"
                class="font-weight-bold"
              >
                {{ item.estado }}
              </v-chip>
            </template>
            <template #item.acciones="{ item }">
              <v-btn
                icon
                variant="text"
                size="small"
                color="info"
                @click="verDetalles(item)"
              >
                <v-icon>mdi-eye</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogo Nueva Solicitud -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card color="#2d2d2d">
        <v-card-title class="text-h5 pa-4">
          Nueva Solicitud de Material
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-autocomplete
                  v-model="editedItem.material"
                  :items="materialesDisponibles"
                  label="Material / Insumo"
                  placeholder="Buscar material..."
                  variant="outlined"
                  density="comfortable"
                  :loading="loadingMateriales"
                  no-data-text="No hay materiales disponibles"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="editedItem.cantidad"
                  label="Cantidad"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                  min="1"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="editedItem.comentarios"
                  label="Comentarios / Justificación"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="close">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="save">Guardar Solicitud</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { materialService, dashboardService, solicitudesService } from '@/services/apiService'

const loading = ref(false)
const dialog = ref(false)
const materialesDisponibles = ref([])
const loadingMateriales = ref(false)

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Fecha', key: 'fecha' },
  { title: 'Material', key: 'material' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Estado', key: 'estado' },
  { title: 'Acciones', key: 'acciones', sortable: false }
]

// Datos de ejemplo
const solicitudes = ref([])

const defaultItem = {
  material: null, // Ahora será un objeto o ID
  cantidad: 1,
  comentarios: ''
}

const editedItem = reactive({ ...defaultItem })

onMounted(async () => {
  await Promise.all([
    loadMateriales(),
    loadSolicitudes()
  ])
})

async function loadMateriales() {
  loadingMateriales.value = true
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    if (!usuarioId) {
      console.warn('No hay usuario_id en sesión')
      return
    }

    // Obtener info de estación para saber su ID
    const estacionInfo = await dashboardService.getInfoEstacion(usuarioId)
    
    // Extracción robusta del ID de estación
    let estacionId = null
    if (estacionInfo.success && estacionInfo.data) {
      estacionId = estacionInfo.data.estacion_id || estacionInfo.data.id || (estacionInfo.data.estacion?.id)
    }
    
    // Fallback: intentar obtener de sessionStorage si existe
    if (!estacionId) {
      const storedId = sessionStorage.getItem('estacion_id')
      if (storedId) estacionId = parseInt(storedId)
    }

    console.log('Cargando materiales para estación:', estacionId)

    if (estacionId) {
      // Cargar materiales de la estación actual
      const resEstacion = await materialService.getMaterialesEstacion(estacionId)
      
      // Cargar materiales globales (Estación 1)
      let resGlobal = { success: false, data: [] }
      if (estacionId !== 1) {
        resGlobal = await materialService.getMaterialesEstacion(1)
      }

      const materialesEstacion = resEstacion.success ? resEstacion.data : []
      const materialesGlobal = resGlobal.success ? resGlobal.data : []

      // Combinar: Globales primero, luego específicos (para priorizar configuración local si existiera)
      const map = new Map()
      
      materialesGlobal.forEach(m => map.set(m.material_id, m))
      materialesEstacion.forEach(m => map.set(m.material_id, m))
      
      materialesDisponibles.value = Array.from(map.values()).map(m => ({
        title: `${m.nombre} (${m.unidad})`,
        value: m.nombre, 
        original: m
      }))
    } else {
      console.error('No se pudo determinar el ID de la estación')
    }
  } catch (error) {
    console.error('Error cargando materiales', error)
  } finally {
    loadingMateriales.value = false
  }
}

function getStatusColor(estado) {
  switch (estado) {
    case 'Aprobado': return 'success'
    case 'Pendiente': return 'warning'
    case 'Rechazado': return 'error'
    default: return 'grey'
  }
}

function close() {
  dialog.value = false
  Object.assign(editedItem, defaultItem)
}

async function save() {
  if (!editedItem.material || !editedItem.cantidad) return

  loading.value = true
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    
    // Obtener ID de estación (reutilizamos lógica o guardamos en variable reactiva al cargar)
    // Para simplificar, obtenemos de nuevo o usamos un store si existiera
    const estacionInfo = await dashboardService.getInfoEstacion(usuarioId)
    const estacionId = estacionInfo.success && estacionInfo.data ? (estacionInfo.data.estacion_id || estacionInfo.data.id) : null

    // Encontrar ID del material seleccionado (editedItem.material tiene el nombre/valor del autocomplete)
    // Necesitamos el objeto original guardado en materialesDisponibles
    const materialSeleccionado = materialesDisponibles.value.find(m => m.value === editedItem.material)
    
    if (!materialSeleccionado) {
      console.error('Material no encontrado en lista')
      return
    }

    const payload = {
      usuario_id: usuarioId,
      estacion_id: estacionId,
      material_id: materialSeleccionado.original.material_id || materialSeleccionado.original.id, // Ajustar según venga del backend
      cantidad: editedItem.cantidad,
      comentarios: editedItem.comentarios,
      fecha_solicitud: new Date().toISOString().split('T')[0]
    }

    const res = await solicitudesService.createSolicitud(payload)
    
    if (res.success) {
      await loadSolicitudes() // Recargar lista
      close()
    } else {
      console.error('Error al crear solicitud:', res.message)
    }
  } catch (error) {
    console.error('Error guardando solicitud', error)
  } finally {
    loading.value = false
  }
}

async function loadSolicitudes() {
  loading.value = true
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    // Filtros iniciales: mostrar solicitudes del usuario o de su estación
    const res = await solicitudesService.getSolicitudes({ usuario_id: usuarioId })
    if (res.success) {
      solicitudes.value = res.data
    }
  } catch (error) {
    console.error('Error cargando solicitudes', error)
  } finally {
    loading.value = false
  }
}

function verDetalles(item) {
  console.log('Ver detalles', item)
  // Implementar vista de detalles
}
</script>

<style scoped>
.v-data-table { background: transparent !important; }
.v-data-table :deep(th) { background: #1e1e1e !important; color: white !important; }
.v-data-table :deep(tr:hover) { background: rgba(255, 255, 255, 0.05) !important; }
</style>