<template>
  <v-container fluid class="pa-6">
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-2">
              <v-icon class="mr-3" color="purple">mdi-package-variant-closed</v-icon>
              Gestión de Materiales
            </h1>
            <p class="text-grey-400 ma-0">Administración de catálogo y asignación de materiales</p>
          </div>
          <v-btn 
            color="primary" 
            class="text-none"
            @click="openCreateDialog"
            prepend-icon="mdi-plus"
          >
            Nuevo Material
          </v-btn>
        </div>

        <v-card dark color="#2d2d2d">
          <v-data-table
            :headers="headers"
            :items="materiales"
            :loading="loading"
            class="transparent"
            density="comfortable"
            no-data-text="No hay materiales registrados"
          >
            <template #item.estaciones="{ item }">
              <!-- La API no devuelve conteo directo, simplificamos visualización -->
              <span class="text-grey text-caption">Ver detalles</span>
            </template>
            
            <template #item.acciones="{ item }">
              <div class="d-flex">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="info"
                  @click="openEditDialog(item)"
                  class="mr-2"
                  title="Editar Material"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="purple"
                  @click="openAssignDialog(item)"
                  title="Asignar a Estaciones"
                >
                  <v-icon>mdi-store-cog</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialogo Crear/Editar Material -->
    <v-dialog v-model="dialog" max-width="500px">
      <v-card color="#2d2d2d">
        <v-card-title class="text-h5 pa-4">
          {{ editedItem.id ? 'Editar Material' : 'Nuevo Material' }}
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.nombre"
                  label="Nombre del Material"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="editedItem.unidad"
                  label="Unidad de Medida (ej. pza, kg, litro)"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="saveMaterial">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialogo Asignar a Estaciones -->
    <v-dialog v-model="assignDialog" max-width="600px">
      <v-card color="#2d2d2d">
        <v-card-title class="text-h5 pa-4">
          Asignar Material a Estaciones
        </v-card-title>
        <v-card-subtitle class="px-4 pb-2 text-info">
          Material: {{ selectedMaterial?.nombre }}
        </v-card-subtitle>
        <v-card-text>
          <div class="d-flex align-center px-4 py-2 mb-2 border-b">
             <v-checkbox-btn
                v-model="selectAll"
                color="purple"
                class="mr-2"
                @update:model-value="toggleSelectAll"
             ></v-checkbox-btn>
             <span class="text-caption text-grey">Seleccionar Todas las Estaciones</span>
          </div>
          <v-list bg-color="transparent" v-if="!loadingAssignments" max-height="400" class="overflow-y-auto">
            <v-list-item
              v-for="estacion in estacionesDisponibles"
              :key="estacion.id"
              class="mb-2"
            >
              <template v-slot:prepend>
                <v-checkbox-btn
                  v-model="selectedEstaciones"
                  :value="estacion.id"
                  color="purple"
                  @update:model-value="updateSelectAllState"
                ></v-checkbox-btn>
              </template>
              
              <div class="d-flex align-center w-100 justify-space-between">
                <v-list-item-title class="flex-grow-1">{{ estacion.nombre }}</v-list-item-title>
                
                <div v-if="selectedEstaciones.includes(estacion.id)" style="width: 120px" class="ml-4">
                  <v-text-field
                    v-model.number="minStockValues[estacion.id]"
                    label="Min Stock"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    min="0"
                    color="purple"
                    @click.stop
                  ></v-text-field>
                </div>
              </div>
            </v-list-item>
          </v-list>
          <div v-else class="d-flex justify-center pa-4">
            <v-progress-circular indeterminate color="purple"></v-progress-circular>
          </div>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="assignDialog = false">Cancelar</v-btn>
          <v-btn color="purple" variant="elevated" @click="saveAssignments" :loading="loadingAssignments">Guardar Asignaciones</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { stationService, materialService } from '@/services/apiService'

const loading = ref(false)
const dialog = ref(false)
const assignDialog = ref(false)
const loadingAssignments = ref(false)

const headers = [
  { title: 'Nombre', key: 'nombre' },
  { title: 'Unidad', key: 'unidad' },
  { title: 'Acciones', key: 'acciones', sortable: false, align: 'end' }
]

const materiales = ref([])
const estacionesDisponibles = ref([])

const defaultItem = {
  id: null,
  nombre: '',
  unidad: ''
}

const editedItem = reactive({ ...defaultItem })
const selectedMaterial = ref(null)
const selectedEstaciones = ref([])
const minStockValues = ref({})
const selectAll = ref(false)

onMounted(async () => {
  await Promise.all([
    loadEstaciones(),
    loadMateriales()
  ])
})

async function loadEstaciones() {
  try {
    const res = await stationService.getEstaciones()
    if (res.success) {
      // Filtrar la estación con ID 1 (TODAS) para evitar asignación global errónea
      estacionesDisponibles.value = res.data.filter(e => e.id !== 1)
    }
  } catch (error) {
    console.error('Error cargando estaciones', error)
  }
}

async function loadMateriales() {
  loading.value = true
  try {
    const res = await materialService.getMateriales()
    if (res.success) {
      materiales.value = res.data
    }
  } catch (error) {
    console.error('Error cargando materiales', error)
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  Object.assign(editedItem, defaultItem)
  dialog.value = true
}

function openEditDialog(item) {
  // Nota: El backend actual no tiene endpoint de editar, por ahora solo mostramos datos
  // Si se implementa PUT /materiales/<id>, aquí se usaría
  Object.assign(editedItem, item)
  // dialog.value = true // Descomentar cuando exista endpoint de edición
  alert('Edición no disponible en este momento')
}

async function openAssignDialog(item) {
  selectedMaterial.value = item
  assignDialog.value = true
  selectedEstaciones.value = []
  minStockValues.value = {}
  selectAll.value = false
  loadingAssignments.value = true
  
  try {
    const promises = estacionesDisponibles.value.map(estacion => 
      materialService.getMaterialesEstacion(estacion.id)
        .then(res => ({ id: estacion.id, materiales: res.success ? res.data : [] }))
    )
    
    const results = await Promise.all(promises)
    
    const asignadas = []
    results.forEach(res => {
      const match = res.materiales.find(m => m.material_id === item.id)
      if (match) {
        asignadas.push(res.id)
        minStockValues.value[res.id] = match.stock_minimo || 5
      } else {
        minStockValues.value[res.id] = 5
      }
    })
    selectedEstaciones.value = asignadas
    
    // Verificar si todas están seleccionadas
    updateSelectAllState()
    
  } catch (error) {
    console.error('Error cargando asignaciones', error)
  } finally {
    loadingAssignments.value = false
  }
}

function updateSelectAllState() {
  if (estacionesDisponibles.value.length > 0) {
    selectAll.value = selectedEstaciones.value.length === estacionesDisponibles.value.length
  }
}

function toggleSelectAll(val) {
  if (val) {
    selectedEstaciones.value = estacionesDisponibles.value.map(e => e.id)
  } else {
    selectedEstaciones.value = []
  }
}

function closeDialog() {
  dialog.value = false
  Object.assign(editedItem, defaultItem)
}

async function saveMaterial() {
  if (!editedItem.nombre || !editedItem.unidad) return
  
  try {
    // Solo creación soportada por ahora
    const res = await materialService.createMaterial({
      nombre: editedItem.nombre,
      unidad: editedItem.unidad
    })
    
    if (res.success) {
      await loadMateriales()
      closeDialog()
    }
  } catch (error) {
    console.error('Error guardando material', error)
  }
}

async function saveAssignments() {
  if (!selectedMaterial.value) return
  
  loadingAssignments.value = true
  try {
    // Detectar cambios:
    // Estaciones que están en selectedEstaciones pero NO estaban antes -> Asignar
    // Estaciones que NO están en selectedEstaciones pero SI estaban antes -> Desasignar
    
    // Recalcular estado actual para comparar (reutilizamos lógica de carga)
    // Nota: Para optimizar, podríamos guardar el estado inicial al abrir el diálogo
    
    // Simplificación: Iterar todas las estaciones disponibles
    for (const estacion of estacionesDisponibles.value) {
      const isSelected = selectedEstaciones.value.includes(estacion.id)
      
      // Consultar si ya lo tiene (podríamos optimizar esto con el estado cargado previamente)
      // Por simplicidad y robustez, mandamos la señal correspondiente
      
      if (isSelected) {
        await materialService.asignarMaterial({
          estacion_id: estacion.id,
          material_id: selectedMaterial.value.id,
          stock_minimo: minStockValues.value[estacion.id] || 5
        })
      } else {
        // Solo intentamos desasignar si sabemos que lo tenía, o intentamos ciegamente (la API podría devolver 404 si no existe, lo cual es manejable)
        await materialService.desasignarMaterial({
          estacion_id: estacion.id,
          material_id: selectedMaterial.value.id
        })
      }
    }
    
    assignDialog.value = false
    await loadMateriales() // Recargar para actualizar contadores si los hubiera
  } catch (error) {
    console.error('Error guardando asignaciones', error)
  } finally {
    loadingAssignments.value = false
  }
}
</script>

<style scoped>
.v-data-table { background: transparent !important; }
.v-data-table :deep(th) { background: #1e1e1e !important; color: white !important; }
.v-data-table :deep(tr:hover) { background: rgba(255, 255, 255, 0.05) !important; }
</style>