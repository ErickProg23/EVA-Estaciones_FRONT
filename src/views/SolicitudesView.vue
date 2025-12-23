<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-2">
              <v-icon class="mr-3" color="green">mdi-clipboard-list-outline</v-icon>
              Solicitudes de Material
            </h1>
            <p class="text-grey-400 ma-0">Gestión de solicitudes de insumos y materiales</p>
          </div>
          <div class="d-flex gap-2">
            <v-btn 
              color="blue" 
              variant="tonal"
              class="text-none mr-2"
              @click="loadSolicitudes"
              :loading="loading"
              prepend-icon="mdi-refresh"
            >
              Recargar
            </v-btn>
            <v-btn 
              color="green" 
              class="text-none"
              @click="dialog = true"
              prepend-icon="mdi-plus"
            >
              Nueva Solicitud
            </v-btn>
          </div>
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
            <template #item.fecha_solicitada="{ item }">
              {{ new Date(item.fecha_solicitada).toLocaleString() }}
            </template>
            <template #item.estado="{ item }">
              <v-chip
                :color="getStatusColor(item.estado)"
                size="small"
                class="font-weight-bold text-uppercase"
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
                  label="Comentarios"
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
          <v-btn color="green" variant="elevated" @click="save">Enviar Solicitud</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Detalles Solicitud -->
    <v-dialog v-model="detailsDialog" max-width="600px">
      <v-card color="#2d2d2d" v-if="selectedSolicitud">
        <v-card-title class="text-h5 pa-4 d-flex justify-space-between align-center">
          Detalles de Solicitud #{{ selectedSolicitud.id }}
          <v-chip :color="getStatusColor(selectedSolicitud.estado)" class="text-uppercase font-weight-bold">
            {{ selectedSolicitud.estado }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-list bg-color="transparent">
            <v-list-item>
              <template v-slot:prepend><v-icon color="green" class="mr-2">mdi-calendar</v-icon></template>
              <v-list-item-title>Fecha Solicitada</v-list-item-title>
              <v-list-item-subtitle class="text-white">{{ new Date(selectedSolicitud.fecha_solicitada).toLocaleString() }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend><v-icon color="green" class="mr-2">mdi-package-variant</v-icon></template>
              <v-list-item-title>Material</v-list-item-title>
              <v-list-item-subtitle class="text-white">{{ selectedSolicitud.material_nombre }} ({{ selectedSolicitud.cantidad }} {{ selectedSolicitud.unidad }})</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend><v-icon color="green" class="mr-2">mdi-gas-station</v-icon></template>
              <v-list-item-title>Estación</v-list-item-title>
              <v-list-item-subtitle class="text-white">{{ selectedSolicitud.usuario_id.estacion }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <template v-slot:prepend><v-icon color="green" class="mr-2">mdi-account</v-icon></template>
              <v-list-item-title>Solicitante</v-list-item-title>
              <v-list-item-subtitle class="text-white">{{ selectedSolicitud.usuario_nombre }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedSolicitud.comentario">
              <template v-slot:prepend><v-icon color="green" class="mr-2">mdi-comment-text</v-icon></template>
              <v-list-item-title>Comentarios</v-list-item-title>
              <v-list-item-subtitle class="text-white">{{ selectedSolicitud.comentario }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <!-- Acciones de gestión para ADMIN -->
          <div v-if="isAdmin && selectedSolicitud.estado.toLowerCase() === 'pendiente'" class="mt-4 pt-4 border-t">
            <v-textarea
              v-model="actionComment"
              label="Comentario de revisión (opcional)"
              variant="outlined"
              rows="2"
              class="mb-2"
            ></v-textarea>
            
            <div class="d-flex gap-2 justify-end">
              <v-btn color="error" variant="text" @click="updateStatus('rechazado')" :loading="updatingStatus">
                Rechazar
              </v-btn>
              <v-btn color="blue" variant="elevated" @click="updateStatus('aceptado')" :loading="updatingStatus">
                Aprobar Solicitud
              </v-btn>
            </div>
          </div>

          <!-- Acciones para ENCARGADO (Confirmar Recepción cuando está ACEPTADO) -->
          <div v-if="!isAdmin && selectedSolicitud.estado.toLowerCase() === 'aceptado'" class="mt-4 pt-4 border-t text-center">
             <div class="text-h6 mb-2 text-blue">
               <v-icon color="blue" size="large" class="mb-1">mdi-truck-delivery</v-icon>
               ¿Material Recibido?
             </div>
             <p class="text-caption text-grey mb-4">
               El administrador ya aprobó el envío. Al confirmar, la cantidad se sumará automáticamente a tu inventario.
             </p>
             <v-btn 
                color="success" 
                size="large" 
                variant="elevated" 
                @click="confirmarRecepcion" 
                :loading="updatingStatus"
                prepend-icon="mdi-check-circle"
              >
                Confirmar Recepción y Sumar Stock
              </v-btn>
          </div>

          <!-- Acciones de cancelación (solo pendiente) -->
          <div v-if="canCancel" class="mt-4 pt-4 border-t">
            <div class="d-flex align-center justify-space-between">
              <span class="text-caption text-grey">Puedes cancelar esta solicitud dentro de las primeras 24 horas.</span>
              <v-btn color="error" variant="outlined" @click="updateStatus('cancelado')" :loading="updatingStatus">
                Cancelar Solicitud
              </v-btn>
            </div>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0 justify-end" v-if="(!isAdmin && !canCancel) || selectedSolicitud.estado.toLowerCase() !== 'pendiente'">
          <v-btn color="grey" variant="text" @click="detailsDialog = false">Cerrar</v-btn>
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

const rolId = sessionStorage.getItem('rol_id')
const isAdmin = computed(() => rolId === '1') // 1 = ADMIN (Sistemas)
const isEncargado = computed(() => rolId === '3') // 3 = Encargado

// Calcular si la solicitud se puede cancelar (solo Encargado, estado pendiente, < 24 horas)
const canCancel = computed(() => {
  if (!isEncargado.value || !selectedSolicitud.value) return false
  if (selectedSolicitud.value.estado.toLowerCase() !== 'pendiente') return false
  
  const fechaSolicitud = new Date(selectedSolicitud.value.fecha_solicitada)
  const ahora = new Date()
  const diffHoras = (ahora - fechaSolicitud) / (1000 * 60 * 60)
  
  return diffHoras < 24
})
const detailsDialog = ref(false)
const selectedSolicitud = ref(null)
const actionComment = ref('')
const updatingStatus = ref(false)
const materialesDisponibles = ref([])
const loadingMateriales = ref(false)

const headers = [
  { title: 'ID', key: 'id', align: 'start' },
  { title: 'Fecha', key: 'fecha_solicitada' },
  { title: 'Material', key: 'material_nombre' },
  { title: 'Cantidad', key: 'cantidad' },
  { title: 'Unidad', key: 'unidad' },
  { title: 'Estación', key: 'estacion_nombre' },
  { title: 'Solicitante', key: 'usuario_nombre' },
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
  if (!estado) return 'grey'
  const s = estado.toLowerCase()
  switch (s) {
    case 'aceptado': 
    case 'aprobado': return 'info' // Cambiado a azul para diferenciar del final (verde)
    case 'entregado': return 'indigo'
    case 'finalizado': 
    case 'completado': return 'success'
    case 'pendiente': return 'warning'
    case 'rechazado': return 'error'
    case 'cancelado': return 'grey-darken-1'
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
    // Filtros eliminados según solicitud
    const res = await solicitudesService.getSolicitudes()
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
  selectedSolicitud.value = item
  actionComment.value = ''
  detailsDialog.value = true
}

async function confirmarRecepcion() {
  if (!selectedSolicitud.value) return
  updatingStatus.value = true
  try {
    // Usamos endpoint específico para confirmar y sumar stock
    await solicitudesService.post(`/api/solicitudes/${selectedSolicitud.value.id}/confirmar`)
    
    // Actualizar UI local
    const index = solicitudes.value.findIndex(s => s.id === selectedSolicitud.value.id)
    if (index !== -1) {
      solicitudes.value[index].estado = 'finalizado'
    }
    selectedSolicitud.value.estado = 'finalizado'
    detailsDialog.value = false // Cerrar dialogo tras éxito
  } catch (error) {
    console.error('Error confirmando recepción:', error)
  } finally {
    updatingStatus.value = false
  }
}

async function updateStatus(nuevoEstado) {
  if (!selectedSolicitud.value) return
  
  updatingStatus.value = true
  try {
    const res = await solicitudesService.updateSolicitudStatus(
      selectedSolicitud.value.id,
      nuevoEstado,
      actionComment.value
    )
    
    if (res.success) {
      detailsDialog.value = false
      await loadSolicitudes()
    } else {
      console.error('Error actualizando estado:', res.message)
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error)
  } finally {
    updatingStatus.value = false
  }
}
</script>

<style scoped>
.v-data-table { background: transparent !important; }
.v-data-table :deep(th) { background: #1e1e1e !important; color: white !important; }
.v-data-table :deep(tr:hover) { background: rgba(255, 255, 255, 0.05) !important; }
</style>