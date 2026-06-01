<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Tickets"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-ticket"
    />

    <!-- Contenido principal -->
    <div v-else class="fade-in">
      <v-container v-if="!isInitialLoading" fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <!-- Header principal -->
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="green">mdi-ticket</v-icon>
                  {{ isAdmin ? 'Gestión de Tickets' : 'Mis Tickets' }}
                </h1>
                <p class="text-grey-400 ma-0">
                  {{ isAdmin ? 'Administra todos los tickets del sistema' : 'Gestiona los tickets de tu estación' }}
                </p>
              </div>
              <div class="d-flex gap-2">
                <v-btn 
                  color="blue" 
                  size="large" 
                  class="text-none"
                  @click="refreshTickets"
                  :loading="loading"
                >
                  <v-icon left>mdi-refresh</v-icon>
                  Actualizar
                </v-btn>
                <v-btn 
                  v-if="!isAdmin"
                  color="green" 
                  size="large" 
                  @click="openTicketDialog()"
                  class="text-none"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Nuevo Ticket
                </v-btn>

              </div>
            </div>

            <!-- Estadísticas (solo para ADMIN) -->
            <v-card v-if="isAdmin" dark color="#2d2d2d" class="mb-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-box</v-icon>
                Estadísticas de Tickets
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-3">
                      <v-icon size="32" color="blue" class="mb-2">mdi-ticket-outline</v-icon>
                      <div class="text-h5 font-weight-bold">{{ stats.total || 0 }}</div>
                      <div class="text-caption">Total Tickets</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-3">
                      <v-icon size="32" color="orange" class="mb-2">mdi-clock-outline</v-icon>
                      <div class="text-h5 font-weight-bold">{{ stats.pendientes || 0 }}</div>
                      <div class="text-caption">Pendientes</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-3">
                      <v-icon size="32" color="yellow" class="mb-2">mdi-progress-wrench</v-icon>
                      <div class="text-h5 font-weight-bold">{{ stats.en_proceso || 0 }}</div>
                      <div class="text-caption">En Proceso</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-3">
                      <v-icon size="32" color="green" class="mb-2">mdi-check-circle</v-icon>
                      <div class="text-h5 font-weight-bold">{{ stats.resueltos || 0 }}</div>
                      <div class="text-caption">Resueltos</div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Filtros y búsqueda -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" :md="isAdmin ? 3 : 4">
                    <v-select
                      v-model="selectedStatus"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por estado"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" :md="isAdmin ? 3 : 4">
                    <v-select
                      v-model="selectedPriority"
                      :items="priorityOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por prioridad"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col cols="12" :md="isAdmin ? 3 : 4">
                    <v-select
                      v-model="selectedCategory"
                      :items="categoryOptions"
                      item-title="title"
                      item-value="value"
                      label="Filtrar por categoría"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col>
                  <v-col v-if="isAdmin" cols="12" md="3">
                    <v-select
                      v-model="selectedStation"
                      :items="estaciones"
                      item-title="nombre"
                      item-value="id"
                      label="Filtrar por estación"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-select>
                  </v-col
                ></v-row>
              </v-card-text>
            </v-card>

            <!-- Tabla de tickets -->
            <v-card dark color="#2d2d2d">
              <v-card-text class="pa-0">
                <v-data-table
                  :headers="headers"
                  :items="filteredTickets"
                  :search="search"
                  :items-per-page="10"
                  class="transparent"
                  :loading="loading"
                  loading-text="Cargando tickets..."
                  no-data-text="No hay tickets disponibles para mostrar"
                >
                  <!-- Template para cuando no hay datos -->
                  <template #no-data>
                    <div class="text-center pa-4">
                      <v-icon size="64" color="grey" class="mb-4">mdi-ticket-outline</v-icon>
                      <h3 class="text-grey-400 mb-2">No hay tickets disponibles</h3>
                      <p class="text-grey-500">
                        {{ isAdmin ? 'No se han creado tickets en el sistema' : 'No tienes tickets asignados a tu estación' }}
                      </p>
                      <v-btn 
                        v-if="!isAdmin"
                        color="blue" 
                        class="mt-3"
                        @click="openTicketDialog()"
                      >
                        <v-icon left>mdi-plus</v-icon>
                        Crear primer ticket
                      </v-btn>
                    </div>
                  </template>
                  <!-- Template para estado -->
                  <template #item.estado_texto="{ item }">
                    <v-chip
                      :color="getStatusColor(item.estado)"
                      size="small"
                      variant="flat"
                    >
                      {{ item.estado_texto }}
                    </v-chip>
                  </template>

                  <!-- Template para prioridad -->
                  <template #item.prioridad_texto="{ item }">
                    <v-chip
                      :color="getPriorityColor(item.prioridad)"
                      size="small"
                      variant="flat"
                    >
                      {{ item.prioridad_texto }}
                    </v-chip>
                  </template>

                  <!-- Template para fecha -->
                  <template #item.fecha_creacion="{ item }">
                    {{ formatDate(item.fecha_creacion) }}
                  </template>

                  <!-- Template para acciones -->
                  <template #item.actions="{ item }">
                    <div class="d-flex gap-1">
                      <!-- ✅ Todos pueden VER tickets -->
                      <v-btn
                        icon="mdi-eye"
                        size="small"
                        color="blue"
                        variant="text"
                        @click="viewTicket(item)"
                      ></v-btn>
                      
                      <!-- ✅ CAMBIO: Solo admins pueden EDITAR -->
                      <v-btn
                        v-if="isAdmin"
                        icon="mdi-pencil"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="editTicket(item)"
                      ></v-btn>
                      
                      <!-- ✅ Solo admins pueden ELIMINAR -->
                      <v-btn
                        v-if="isAdmin"
                        icon="mdi-delete"
                        size="small"
                        color="red"
                        variant="text"
                        @click="deleteTicket(item)"
                      ></v-btn>
                    </div>
                  </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Dialog para crear/editar ticket -->
    <v-dialog v-model="showTicketDialog" max-width="800px" persistent>
      <v-card dark color="#2d2d2d">
        <v-card-title class="custom-app-bar">
          <span class="text-h5">
            <v-icon class="mr-2">mdi-ticket</v-icon>
            {{ editingTicket ? 'Editar Ticket' : 'Nuevo Ticket' }}
          </span>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="ticketFormRef" v-model="formValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="ticketForm.titulo"
                  label="Título del ticket"
                  variant="outlined"
                  dark
                  required
                  :rules="[v => !!v || 'El título es requerido']"
                ></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="ticketForm.descripcion"
                  label="Descripción"
                  variant="outlined"
                  dark
                  required
                  rows="4"
                  :rules="[v => !!v || 'La descripción es requerida']"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="ticketForm.prioridad"
                  :items="priorityOptions"
                  item-title="title"
                  item-value="value"
                  label="Prioridad"
                  variant="outlined"
                  dark
                  required
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-model="ticketForm.categoria"
                  :items="categoryOptions"
                  item-title="title"
                  item-value="value"
                  label="Categoría"
                  variant="outlined"
                  dark
                  required
                ></v-select>
              </v-col>
              <v-col cols="12">
                <v-select
                  v-if="mostrarReparaciones"
                  v-model="ticketForm.reparacion"
                  :items="reparacionOptions"
                  item-title="title"
                  item-value="value"
                  label="Equipo a reparar"
                  variant="outlined"
                  dark
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeTicketDialog">
            Cancelar
          </v-btn>
          <v-btn 
            color="blue" 
            variant="outlined" 
            @click="saveTicket"
            :disabled="!formValid"
            :loading="saving"
          >
            {{ editingTicket ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para ver detalles del ticket -->
    <v-dialog v-model="showViewDialog" max-width="800px">
      <v-card dark color="#2d2d2d">
        <v-card-title class="custom-app-bar">
          <span class="text-h5">
            <v-icon class="mr-2">mdi-ticket-outline</v-icon>
            Ticket #{{ viewingTicket?.id }}
          </span>
          <v-spacer></v-spacer>
          <v-chip
            :color="getStatusColor(viewingTicket?.estado)"
            variant="flat"
          >
            {{ getStatusText(viewingTicket?.estado) }}
          </v-chip>
        </v-card-title>
        
        <v-card-text v-if="viewingTicket">
          <!-- Mensaje informativo para no-admins -->
          <v-alert
            v-if="!isAdmin"
            type="info"
            variant="tonal"
            class="mb-4"
          >
            <v-icon>mdi-information</v-icon>
            Solo puedes visualizar este ticket. Para modificaciones, contacta al área de sistemas.
          </v-alert>

          <v-row>
            <!-- Contenido principal -->
            <v-col cols="12" md="8">
              <div class="mb-4">
                <h3 class="text-h6 mb-3">{{ viewingTicket.titulo }}</h3>
                <p class="text-body-1 text-grey-300">{{ viewingTicket.descripcion }}</p>
              </div>
              <v-card dark color="#1a1a1a" class="mt-3">
                <v-card-title class="text-subtitle-1">Seguimiento</v-card-title>
                <v-card-text>
                  <div v-if="commentLoading" class="text-grey-400">Cargando comentarios...</div>
                  <div v-else>
                    <div v-if="comments.length === 0" class="text-grey">Sin comentarios</div>
                    <div v-else class="d-flex flex-column gap-2">
                      <div v-for="c in comments" :key="c.id" class="pa-2 rounded" style="background:#2d2d2d;">
                        <div class="d-flex justify-space-between">
                          <div class="text-caption text-grey-400">
                            {{ c.usuario?.nombre || c.autor?.nombre || 'Usuario' }}
                          </div>
                          <div class="text-caption text-grey-500">
                            {{ formatDate(c.fecha || c.created_at || c.fecha_creacion) }}
                          </div>
                        </div>
                        <div class="text-body-2 mt-1">
                          {{ c.comentario || c.texto || c.mensaje }}
                        </div>
                      </div>
                    </div>
                    <v-divider class="my-3"></v-divider>
                    <v-textarea
                      v-model="newComment"
                      label="Agregar comentario"
                      variant="outlined"
                      dark
                      rows="3"
                      :disabled="commentSaving"
                    ></v-textarea>
                    <v-btn
                      color="blue"
                      variant="outlined"
                      class="mt-2"
                      :disabled="!newComment || commentSaving"
                      :loading="commentSaving"
                      @click="postComment"
                    >
                      Responder
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <!-- Panel de información -->
            <v-col cols="12" md="4">
              <v-card dark color="#1a1a1a">
                <v-card-title class="text-subtitle-1">Información</v-card-title>
                <v-card-text>
                  <div class="mb-3">
                    <div class="text-caption text-grey-400">Prioridad</div>
                    <v-chip 
                      :color="getPriorityColor(viewingTicket.prioridad)"
                      size="small"
                    >
                      {{ getPriorityText(viewingTicket.prioridad) }}
                    </v-chip>
                  </div>
                  
                  <div class="mb-3">
                    <div class="text-caption text-grey-400">Estación</div>
                    <div class="text-body-2">{{ ticketStationName || '-' }}</div>
                  </div>
                  
                  <div class="mb-3">
                    <div class="text-caption text-grey-400">Creado por</div>
                    <div class="text-body-2">{{ ticketCreatorName || '-' }}</div>
                  </div>
                  
                  <div class="mb-3">
                    <div class="text-caption text-grey-400">Fecha creación</div>
                    <div class="text-body-2">{{ formatDate(viewingTicket.fecha_creacion) }}</div>
                  </div>
                  
                  <div v-if="viewingTicket.fecha_resolucion" class="mb-3">
                    <div class="text-caption text-grey-400">Fecha resolución</div>
                    <div class="text-body-2">{{ formatDate(viewingTicket.fecha_resolucion) }}</div>
                  </div>

                  <div v-if="mostrarReparacionesDetalle" class="mb-3">
                    <div class="text-caption text-grey-400">Reparación</div>
                    <div class="text-body-2">{{ getReparacionText(viewingTicket.reparacion) }}</div>
                  </div>
                </v-card-text>
              </v-card>
              
              <!-- Acciones -->
              <v-card dark color="#1a1a1a" class="mt-3">
                <v-card-title class="text-subtitle-1">Acciones</v-card-title>
                <v-card-text>
                  <v-select
                    v-model="viewingTicket.estado"
                    :items="statusOptions"
                    item-title="title"
                    item-value="value"
                    label="Estado"
                    variant="outlined"
                    dark
                    :disabled="!isAdmin"
                    @update:model-value="updateTicketStatus"
                    class="mb-3"
                  ></v-select>
                  
                  <v-btn 
                    v-if="isAdmin"
                    color="orange" 
                    variant="outlined" 
                    @click="editFromView"
                    block
                  >
                    <v-icon left>mdi-pencil</v-icon>
                    Editar
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeViewDialog">
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmación para eliminar ticket -->
    <v-dialog v-model="showDeleteDialog" max-width="500px">
      <v-card dark color="#2d2d2d">
        <v-card-title class="d-flex align-center">
          <v-icon color="red" class="mr-3" size="28">mdi-alert-circle</v-icon>
          <span class="text-h6">Confirmar eliminación</span>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <div class="text-center mb-4">
            <v-icon color="red" size="64" class="mb-3">mdi-delete-forever</v-icon>
          </div>
          
          <div class="text-center">
            <p class="text-h6 mb-2">¿Estás seguro de eliminar este ticket?</p>
            <p class="text-body-1 text-grey-400 mb-3">
              <strong>Ticket #{{ ticketToDelete?.id }}</strong><br>
              {{ ticketToDelete?.titulo }}
            </p>
            <v-alert type="warning" variant="outlined" class="text-left">
              <v-icon slot="prepend">mdi-warning</v-icon>
              Esta acción no se puede deshacer. Toda la información del ticket se perderá permanentemente.
            </v-alert>
          </div>
        </v-card-text>
        
        <v-card-actions class="px-6 pb-4">
          <v-btn 
            color="grey" 
            variant="outlined"
            @click="showDeleteDialog = false"
            :disabled="deleting"
            block
            class="mr-2"
          >
            <v-icon left>mdi-cancel</v-icon>
            Cancelar
          </v-btn>
          <v-btn 
            color="red" 
            variant="flat"
            @click="confirmDelete"
            :loading="deleting"
            block
            class="ml-2"
          >
            <v-icon left>mdi-delete</v-icon>
            Eliminar definitivamente
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

import { ticketService, stationService, userService } from '@/services/apiService'

// Estado del componente
const loading = ref(false)
const saving = ref(false)
const showTicketDialog = ref(false)
const showViewDialog = ref(false)
const showDeleteDialog = ref(false)
const ticketToDelete = ref(null)
const deleting = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const search = ref('')
const selectedStatus = ref(null)
const selectedPriority = ref(null)
const selectedCategory = ref(null)
const selectedStation = ref(null)
const editingTicket = ref(null)
const viewingTicket = ref(null)
const formValid = ref(false)

// Estados de carga inicial
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const dataLoadingStates = ref({
  tickets: false,
  estaciones: false,
  usuarios: false,
  stats: false
})

// Datos
const tickets = ref([])
const estaciones = ref([])
const tecnicos = ref([])
const stats = ref({})

// Seguimiento de comentarios
const comments = ref([])
const commentLoading = ref(false)
const commentSaving = ref(false)
const newComment = ref('')

// Formulario de ticket
const ticketForm = ref({
  titulo: '',
  descripcion: '',
  categoria: 'equipos',
  prioridad: 2, // ✅ CAMBIO: Usar valor numérico (2 = Media)
  estacion_id: null,
  creador_id: null
})

const ticketFormRef = ref(null)


// Obtener información del usuario actual
const currentUser = computed(() => {
  // Construir el objeto usuario desde los datos individuales del sessionStorage
  const usuarioId = sessionStorage.getItem('usuario_id')
  const username = sessionStorage.getItem('username')
  const rolId = sessionStorage.getItem('rol_id')
  const estacionId = sessionStorage.getItem('estacion_id')
  const isAuthenticated = sessionStorage.getItem('isAuthenticated')
  
  // Verificar que los datos esenciales existan
  if (!usuarioId || !isAuthenticated || isAuthenticated !== 'true') {
    return null
  }
  
  // Retornar el objeto usuario construido
  return {
    id: parseInt(usuarioId),
    username: username,
    rol_id: parseInt(rolId),
    estacion_id: parseInt(estacionId)
  }
})

const userRole = computed(() => {
  return sessionStorage.getItem('rol_id')
})

const isAdmin = computed(() => {
  return userRole.value === '1'
})

const userStation = computed(() => {
  return currentUser.value?.estacion_id
})

// Opciones
const statusOptions = [
  { value: 1, title: 'Pendiente' },
  { value: 2, title: 'En Proceso' },
  { value: 3, title: 'Resuelto' }
]

const priorityOptions = [
  { value: 1, title: 'Baja' },
  { value: 2, title: 'Media' },
  { value: 3, title: 'Alta' },
]

const categoryOptions = [
  {value: 'terminales', title: 'Terminales'},
  { value: 'equipos', title: 'Equipos' },
  { value: 'internet', title: 'Internet' },
  { value: 'nexus', title: 'Nexus' },
  { value: 'programas', title: 'Programas'},
  { value: 'reparacion', title: 'Reparacion'},
]

const reparacionOptions = [
  { value: 'terminales', title: 'Terminales'},
  { value: 'impresora', title: 'Impresora' },
  { value: 'camara', title: 'Camara' },
  { value: 'tablet', title: 'Tablets' },
  { value: 'otro', title: 'Otro'}
]

const mostrarReparaciones = computed(() => {
  return ticketForm.value.categoria === 'reparacion'
})

const mostrarReparacionesDetalle = computed(() => {
  const cat = String(viewingTicket.value?.categoria ?? '').toLowerCase()
  return cat === 'reparacion'
})

const ticketStationName = computed(() => {
  const t = viewingTicket.value
  if (!t) return ''
  const fromTicket = t.estacion?.nombre || t.estacion_nombre || t.estacionName || ''
  if (fromTicket) return fromTicket
  const estId = t.estacion_id
  const match = estaciones.value.find(e => Number(e.id) === Number(estId))
  return match?.nombre || ''
})

const ticketCreatorName = computed(() => {
  const t = viewingTicket.value
  if (!t) return ''
  return (
    t.usuario?.nombre ||
    t.creador?.nombre ||
    t.usuario_nombre ||
    t.creador_nombre ||
    t.creador?.usuario ||
    ''
  )
})

const ticketAssignedName = computed(() => {
  const t = viewingTicket.value
  if (!t) return ''
  return (
    t.tecnico?.nombre ||
    t.asignado?.nombre ||
    t.asignado_nombre ||
    ''
  )
})

const getReparacionText = (value) => {
  const v = String(value ?? '')
  if (!v) return '-'
  const opt = reparacionOptions.find(o => String(o.value) === v)
  return opt?.title || v
}

// Headers de la tabla
const headers = computed(() => {
  const baseHeaders = [
    { title: 'ID', key: 'id', sortable: true },
    { title: 'Título', key: 'titulo', sortable: true },
    { title: 'Descripción', key: 'descripcion', sortable: true },
    { title: 'Estado', key: 'estado_texto', sortable: true },
    { title: 'Prioridad', key: 'prioridad_texto', sortable: true },
    { title: 'Categoría', key: 'categoria_texto', sortable: true },
  ]
  
  if (isAdmin.value) {
    baseHeaders.push(
      { title: 'Creado por', key: 'creador.nombre', sortable: true },
    )
  }
  
  baseHeaders.push(
    { title: 'Fecha Creación', key: 'fecha_creacion', sortable: true },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
  )
  
  return baseHeaders
})

// Tickets filtrados
const filteredTickets = computed(() => {
  let filtered = tickets.value
  
  // ✅ ELIMINADO: No filtrar por estacion_id para no-admins
  // El backend ya filtra por creador_id automáticamente
  
  if (selectedStatus.value) {
    filtered = filtered.filter(ticket => {
      const st = Number(ticket.estado)
      const normalized = st === 4 ? 3 : st
      return normalized === Number(selectedStatus.value)
    })
  }
  
  if (selectedPriority.value) {
    filtered = filtered.filter(ticket => ticket.prioridad === selectedPriority.value)
  }
  
  // Solo los admins pueden filtrar por estación
  if (selectedStation.value && isAdmin.value) {
    filtered = filtered.filter(ticket => ticket.estacion_id === selectedStation.value)
  }
  
  if (selectedCategory.value) {
    filtered = filtered.filter(ticket => ticket.categoria === selectedCategory.value)
  }
  
  return filtered
})

// Funciones de utilidad
const getStatusColor = (status) => {
  const s = String(status ?? '')
  const normalized = s === '4' ? '3' : s
  const colors = {
    '1': 'grey',
    '2': 'orange',
    '3': 'green'
  }
  return colors[normalized] || 'grey'
}

const getStatusText = (status) => {
  const s = String(status ?? '')
  const normalized = s === '4' ? '3' : s
  const texts = {
    '1': 'Pendiente',
    '2': 'En Proceso',
    '3': 'Resuelto'
  }
  return texts[normalized] || normalized
}

const getPriorityColor = (priority) => {
  const colors = {
    '1': 'green',
    '2': 'orange',
    '3': 'red',
  }
  return colors[priority] || 'grey'
}

const getPriorityText = (priority) => {
  const p = String(priority ?? '')
  const key = p.toLowerCase()
  const texts = {
    '1': 'Baja',
    '2': 'Media',
    '3': 'Alta',
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  }
  return texts[key] || p
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const canEditTicket = (ticket) => {
  // ✅ CAMBIO: Solo los administradores (rol_id = 1) pueden editar tickets
  return isAdmin.value
}

// Funciones de carga de datos
const updateLoadingProgress = () => {
  const completedTasks = Object.values(dataLoadingStates.value).filter(Boolean).length
  const totalTasks = Object.keys(dataLoadingStates.value).length
  loadingProgress.value = Math.round((completedTasks / totalTasks) * 100)
  
  if (completedTasks === totalTasks) {
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500)
  }
}

const loadTickets = async () => {
  try {
    loadingMessage.value = 'Cargando tickets...'
    let result

    if (isAdmin.value) {
      result = await ticketService.getTickets()
    } else {
      const usuarioId = currentUser.value?.id
      if (!usuarioId) {
        tickets.value = []
        showMessage('Error: Usuario no autenticado', 'error')
        return
      }
      result = await ticketService.getTicketsByUsuario(usuarioId)
    }

    if (result.success) {
      // ✅ NUEVO: Usar directamente la estructura del backend
      const ticketsArray = result.data.data || result.data || []
      
      // ✅ SIMPLIFICADO: Solo mapear estados y prioridades, mantener estructura original
      const processedTickets = Array.isArray(ticketsArray) ? ticketsArray.map(ticket => {
        // Mapear estados numéricos a texto para mostrar
        const estadoNum = Number(ticket.estado)
        const normalizedEstado = estadoNum === 4 ? 3 : estadoNum
        const estadoTexto = {
          1: 'Pendiente',
          2: 'En Proceso', 
          3: 'Resuelto'
        }[normalizedEstado] || 'Pendiente'
        
        // Mapear prioridades numéricas a texto para mostrar
        const prioridadTexto = {
          1: 'Baja',
          2: 'Media',
          3: 'Alta',
        }[ticket.prioridad] || 'Media'
        
        const categoriaTexto = {
          terminales: 'Terminales',
          internet: 'Internet',
          reparacion: 'Reparacion',
          programas: 'Programas',
          nexus: 'Nexus',
          otro: 'Otro',
        }[ticket.categoria] || 'Sin categoría'
        return {
          ...ticket,
          estado: normalizedEstado,
          // Agregar campos de texto para mostrar en la tabla
          estado_texto: estadoTexto,
          prioridad_texto: prioridadTexto,
          categoria_texto: categoriaTexto
        }
      }) : []
      
      tickets.value = processedTickets
    } else {
      tickets.value = []
      showMessage(result.error || 'Error al cargar tickets', 'error')
    }
  } catch (error) {
    console.error('Error al cargar tickets:', error)
    tickets.value = []
    showMessage('Error al cargar tickets', 'error')
  } finally {
    dataLoadingStates.value.tickets = true
    updateLoadingProgress()
  }
}

const loadEstaciones = async () => {
  try {
    loadingMessage.value = 'Cargando estaciones...'
    const result = await stationService.getEstaciones()
    
    if (result.success) {
      estaciones.value = result.data
    }
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
  } finally {
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  }
}

const loadUsuarios = async () => {
  try {
    loadingMessage.value = 'Cargando usuarios...'
    const result = await userService.getUsuarios()
    
    if (result.success) {
      // Filtrar solo técnicos para asignación
      tecnicos.value = result.data.filter(user => user.rol_id === 2 || user.rol_id === 3)
    }
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
  } finally {
    dataLoadingStates.value.usuarios = true
    updateLoadingProgress()
  }
}

const loadStats = async () => {
  if (!isAdmin.value) {
    dataLoadingStates.value.stats = true
    updateLoadingProgress()
    return
  }
  
  try {
    loadingMessage.value = 'Cargando estadísticas...'
    const result = await ticketService.getTicketStats()
    
    if (result.success) {
      const payload = result?.data?.data || result?.data || {}
      const porEstado = payload?.por_estado && typeof payload.por_estado === 'object' ? payload.por_estado : {}

      const total = Number(payload.total_tickets ?? payload.total ?? 0)
      const pendientes = Number(porEstado.abierto ?? payload.pendientes ?? 0)
      const enProceso = Number(porEstado.en_progreso ?? payload.en_proceso ?? 0)
      const resueltosBase = Number(porEstado.resuelto ?? payload.resueltos ?? 0)
      const cerrados = Number(porEstado.cerrado ?? 0)

      stats.value = {
        total: Number.isFinite(total) ? total : 0,
        pendientes: Number.isFinite(pendientes) ? pendientes : 0,
        en_proceso: Number.isFinite(enProceso) ? enProceso : 0,
        resueltos: Number.isFinite(resueltosBase + cerrados) ? (resueltosBase + cerrados) : 0
      }
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  } finally {
    dataLoadingStates.value.stats = true
    updateLoadingProgress()
  }
}

const refreshTickets = async () => {
  loading.value = true
  try {
    await loadTickets()
    if (isAdmin.value) await loadStats()
    showMessage('Listado de tickets actualizado', 'success')
  } catch (error) {
    console.error('Error al actualizar tickets:', error)
    showMessage('Error al actualizar tickets', 'error')
  } finally {
    loading.value = false
  }
}

// Funciones de diálogo
const openTicketDialog = (ticket = null) => {
  editingTicket.value = ticket
  
  // Usar nextTick para asegurar que la reactividad se mantenga
  nextTick(() => {
    if (ticket) {
      // Asignar cada propiedad individualmente para mantener reactividad
      ticketForm.value.titulo = ticket.titulo || ''
      ticketForm.value.descripcion = ticket.descripcion || ''
      ticketForm.value.categoria = ticket.categoria || 'equipos'
      ticketForm.value.prioridad = ticket.prioridad || 'Media'
      ticketForm.value.estacion_id = ticket.estacion_id || null
      ticketForm.value.creador_id = ticket.creador_id || null

    } else {
      // Limpiar formulario para nuevo ticket
      ticketForm.value.titulo = ''
      ticketForm.value.descripcion = ''
      ticketForm.value.categoria = 'equipos'
      ticketForm.value.prioridad = 'Media'
      ticketForm.value.estacion_id = isAdmin.value ? null : userStation.value
      ticketForm.value.creador_id = currentUser.value?.id || null
    }
  })
  
  showTicketDialog.value = true
}

const closeTicketDialog = () => {
  showTicketDialog.value = false
  editingTicket.value = null
  formValid.value = false
  
  // Usar nextTick para limpiar después de cerrar el diálogo
  nextTick(() => {
    ticketForm.value.titulo = ''
    ticketForm.value.descripcion = ''
    ticketForm.value.categoria = 'equipos'
    ticketForm.value.prioridad = 'Media'
    ticketForm.value.estacion_id = isAdmin.value ? null : userStation.value
    ticketForm.value.creador_id = currentUser.value?.id || null
  })
}

const viewTicket = async (ticket) => {
  viewingTicket.value = ticket
  commentLoading.value = true
  await loadComments(ticket.id)
  commentLoading.value = false
  showViewDialog.value = true
}

const loadComments = async (ticketId) => {
  try {
    const result = await ticketService.getTicketComments(ticketId)
    const arr = result.success ? (Array.isArray(result.data) ? result.data : result.data?.data || []) : []
    comments.value = arr
  } catch (error) {
    comments.value = []
  }
}

const postComment = async () => {
  if (!newComment.value || !viewingTicket.value) return
  if (!currentUser.value?.id) {
    showMessage('Error: Usuario no autenticado', 'error')
    return
  }
  commentSaving.value = true
  try {
    const result = await ticketService.addComment(viewingTicket.value.id, newComment.value)
    if (result.success) {
      newComment.value = ''
      await loadComments(viewingTicket.value.id)
      showMessage('Comentario agregado', 'success')
    } else {
      showMessage(result.error || 'Error al agregar comentario', 'error')
    }
  } catch (error) {
    showMessage('Error al agregar comentario', 'error')
  } finally {
    commentSaving.value = false
  }
}

const closeViewDialog = () => {
  showViewDialog.value = false
  viewingTicket.value = null
}

const editTicket = (ticket) => {
  openTicketDialog(ticket)
}

const editFromView = () => {
  closeViewDialog()
  openTicketDialog(viewingTicket.value)
}

// Funciones CRUD
const saveTicket = async () => {
  if (!formValid.value) return
  
  // Verificar que el usuario esté autenticado
  if (!currentUser.value) {
    showMessage('Error: Usuario no autenticado', 'error')
    return
  }
  
  saving.value = true
  try {
    let result
    
    if (editingTicket.value) {
      result = await ticketService.updateTicket(editingTicket.value.id, ticketForm.value)
    } else {
      // Agregar usuario_id al crear ticket
      const ticketData = {
        ...ticketForm.value,
        usuario_id: currentUser.value.id
      }
      result = await ticketService.createTicket(ticketData)
    }
    
    if (result.success) {
      showMessage(editingTicket.value ? 'Ticket actualizado' : 'Ticket creado', 'success')
      closeTicketDialog()
      await loadTickets()
      if (isAdmin.value) await loadStats()
    } else {
      showMessage(result.error || 'Error al guardar ticket', 'error')
    }
  } catch (error) {
    console.error('Error al guardar ticket:', error)
    showMessage('Error al guardar ticket', 'error')
  } finally {
    saving.value = false
  }
}

const updateTicketStatus = async (newStatus) => {
  try {
    const result = await ticketService.updateTicketStatus(viewingTicket.value.id, newStatus)
    
    if (result.success) {
      showMessage('Estado actualizado', 'success')
      await loadTickets()
      if (isAdmin.value) await loadStats()
    } else {
      showMessage(result.error || 'Error al actualizar estado', 'error')
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error)
    showMessage('Error al actualizar estado', 'error')
  }
}


const deleteTicket = async (ticket) => {
  ticketToDelete.value = ticket
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (!ticketToDelete.value) return
  
  deleting.value = true
  try {
    const result = await ticketService.deleteTicket(ticketToDelete.value.id)
    
    if (result.success) {
      showMessage('Ticket eliminado correctamente', 'success')
      await loadTickets()
      if (isAdmin.value) await loadStats()
    } else {
      showMessage(result.error || 'Error al eliminar ticket', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar ticket:', error)
    showMessage('Error al eliminar ticket', 'error')
  } finally {
    deleting.value = false
    showDeleteDialog.value = false
    ticketToDelete.value = null
  }
}

// Función para mostrar mensajes
const showMessage = (message, type = 'info') => {
  snackbarMessage.value = message
  snackbarColor.value = type
  showSnackbar.value = true
}

// Inicialización
const initializeData = async () => {
  await Promise.all([
    loadTickets(),
    loadEstaciones(),
    loadUsuarios(),
    loadStats()
  ])
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.8s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.custom-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.gap-2 {
  gap: 8px;
}

.gap-1 {
  gap: 4px;
}
</style>