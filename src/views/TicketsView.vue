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
                  <v-icon class="mr-3" color="blue">mdi-ticket</v-icon>
                  {{ isAdmin ? 'Gestión de Tickets' : 'Mis Tickets' }}
                </h1>
                <p class="text-grey-400 ma-0">
                  {{ isAdmin ? 'Administra todos los tickets del sistema' : 'Gestiona los tickets de tu estación' }}
                </p>
              </div>
              <div class="d-flex gap-2">
                <v-btn 
                  v-if="!isAdmin"
                  color="blue" 
                  size="large" 
                  @click="openTicketDialog()"
                  class="text-none"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Nuevo Ticket
                </v-btn>
                <v-btn 
                  v-if="isAdmin"
                  color="green" 
                  size="large" 
                  @click="showStats = !showStats"
                  class="text-none"
                >
                  <v-icon left>mdi-chart-line</v-icon>
                  Estadísticas
                </v-btn>
              </div>
            </div>

            <!-- Estadísticas (solo para ADMIN) -->
            <v-card v-if="isAdmin && showStats" dark color="#2d2d2d" class="mb-4">
              <v-card-title>
                <v-icon class="mr-2">mdi-chart-box</v-icon>
                Estadísticas de Tickets
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-4">
                      <v-icon size="40" color="blue" class="mb-2">mdi-ticket-outline</v-icon>
                      <div class="text-h4 font-weight-bold">{{ stats.total || 0 }}</div>
                      <div class="text-caption">Total Tickets</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-4">
                      <v-icon size="40" color="orange" class="mb-2">mdi-clock-outline</v-icon>
                      <div class="text-h4 font-weight-bold">{{ stats.pendientes || 0 }}</div>
                      <div class="text-caption">Pendientes</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-4">
                      <v-icon size="40" color="yellow" class="mb-2">mdi-progress-wrench</v-icon>
                      <div class="text-h4 font-weight-bold">{{ stats.en_proceso || 0 }}</div>
                      <div class="text-caption">En Proceso</div>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-card dark color="#1a1a1a" class="text-center pa-4">
                      <v-icon size="40" color="green" class="mb-2">mdi-check-circle</v-icon>
                      <div class="text-h4 font-weight-bold">{{ stats.resueltos || 0 }}</div>
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
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="search"
                      label="Buscar tickets..."
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" md="3">
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
                  <v-col cols="12" md="3">
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
                  <v-col v-if="isAdmin" cols="12" md="2">
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
                  </v-col>
                </v-row>
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
                >
                  <!-- Template para estado -->
                  <template #item.estado="{ item }">
                    <v-chip
                      :color="getStatusColor(item.estado)"
                      size="small"
                      variant="flat"
                    >
                      {{ getStatusText(item.estado) }}
                    </v-chip>
                  </template>

                  <!-- Template para prioridad -->
                  <template #item.prioridad="{ item }">
                    <v-chip
                      :color="getPriorityColor(item.prioridad)"
                      size="small"
                      variant="flat"
                    >
                      {{ getPriorityText(item.prioridad) }}
                    </v-chip>
                  </template>

                  <!-- Template para fecha -->
                  <template #item.fecha_creacion="{ item }">
                    {{ formatDate(item.fecha_creacion) }}
                  </template>

                  <!-- Template para acciones -->
                  <template #item.actions="{ item }">
                    <div class="d-flex gap-1">
                      <v-btn
                        icon="mdi-eye"
                        size="small"
                        color="blue"
                        variant="text"
                        @click="viewTicket(item)"
                      ></v-btn>
                      <v-btn
                        v-if="canEditTicket(item)"
                        icon="mdi-pencil"
                        size="small"
                        color="orange"
                        variant="text"
                        @click="editTicket(item)"
                      ></v-btn>
                      <v-btn
                        v-if="isAdmin"
                        icon="mdi-account-plus"
                        size="small"
                        color="green"
                        variant="text"
                        @click="assignTicket(item)"
                      ></v-btn>
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
    <v-dialog v-model="showViewDialog" max-width="900px">
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
          <v-row>
            <v-col cols="12" md="8">
              <h3 class="mb-3">{{ viewingTicket.titulo }}</h3>
              <p class="text-grey-300 mb-4">{{ viewingTicket.descripcion }}</p>
              
              <!-- Comentarios -->
              <div class="mb-4">
                <h4 class="mb-2">Comentarios</h4>
                <div v-if="ticketComments.length === 0" class="text-grey-400">
                  No hay comentarios aún
                </div>
                <div v-else>
                  <v-card 
                    v-for="comment in ticketComments" 
                    :key="comment.id"
                    dark 
                    color="#1a1a1a" 
                    class="mb-2"
                  >
                    <v-card-text>
                      <div class="d-flex justify-space-between align-center mb-2">
                        <strong>{{ comment.usuario?.nombre }}</strong>
                        <small class="text-grey-400">{{ formatDate(comment.fecha_creacion) }}</small>
                      </div>
                      <p class="ma-0">{{ comment.comentario }}</p>
                    </v-card-text>
                  </v-card>
                </div>
              </div>
              
              <!-- Agregar comentario -->
              <v-textarea
                v-model="newComment"
                label="Agregar comentario"
                variant="outlined"
                rows="3"
                dark
              ></v-textarea>
              <v-btn 
                color="blue" 
                @click="addComment"
                :disabled="!newComment.trim()"
                class="mt-2"
              >
                Agregar Comentario
              </v-btn>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-card dark color="#1a1a1a">
                <v-card-title>Información</v-card-title>
                <v-card-text>
                  <div class="mb-2">
                    <strong>Prioridad:</strong>
                    <v-chip 
                      :color="getPriorityColor(viewingTicket.prioridad)"
                      size="small"
                      class="ml-2"
                    >
                      {{ getPriorityText(viewingTicket.prioridad) }}
                    </v-chip>
                  </div>
                  <div class="mb-2">
                    <strong>Estación:</strong> {{ viewingTicket.estacion?.nombre }}
                  </div>
                  <div class="mb-2">
                    <strong>Creado por:</strong> {{ viewingTicket.usuario?.nombre }}
                  </div>
                  <div class="mb-2">
                    <strong>Fecha creación:</strong> {{ formatDate(viewingTicket.fecha_creacion) }}
                  </div>
                  <div v-if="viewingTicket.tecnico" class="mb-2">
                    <strong>Asignado a:</strong> {{ viewingTicket.tecnico?.nombre }}
                  </div>
                  <div v-if="viewingTicket.fecha_resolucion" class="mb-2">
                    <strong>Fecha resolución:</strong> {{ formatDate(viewingTicket.fecha_resolucion) }}
                  </div>
                </v-card-text>
              </v-card>
              
              <!-- Acciones rápidas -->
              <v-card dark color="#1a1a1a" class="mt-4">
                <v-card-title>Acciones</v-card-title>
                <v-card-text>
                  <div class="d-flex flex-column gap-2">
                    <v-select
                      v-model="viewingTicket.estado"
                      :items="statusOptions"
                      item-title="title"
                      item-value="value"
                      label="Cambiar estado"
                      variant="outlined"
                      density="compact"
                      @update:model-value="updateTicketStatus"
                    ></v-select>
                    <v-btn 
                      v-if="canEditTicket(viewingTicket)"
                      color="orange" 
                      variant="outlined" 
                      @click="editFromView"
                      block
                    >
                      <v-icon left>mdi-pencil</v-icon>
                      Editar
                    </v-btn>
                  </div>
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
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const search = ref('')
const selectedStatus = ref(null)
const selectedPriority = ref(null)
const selectedStation = ref(null)
const editingTicket = ref(null)
const viewingTicket = ref(null)
const formValid = ref(false)
const showStats = ref(false)
const newComment = ref('')

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
const ticketComments = ref([])
const stats = ref({})

// Formulario de ticket
const ticketForm = ref({
  titulo: '',
  descripcion: '',
  prioridad: 'media',
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
  { value: 'pendiente', title: 'Pendiente' },
  { value: 'en_proceso', title: 'En Proceso' },
  { value: 'resuelto', title: 'Resuelto' },
  { value: 'cerrado', title: 'Cerrado' }
]

const priorityOptions = [
  { value: 'baja', title: 'Baja' },
  { value: 'media', title: 'Media' },
  { value: 'alta', title: 'Alta' },
  { value: 'critica', title: 'Crítica' }
]

const categoryOptions = [
  { value: 'hardware', title: 'Hardware' },
  { value: 'software', title: 'Software' },
  { value: 'red', title: 'Red' },
  { value: 'impresora', title: 'Impresora' },
  { value: 'otro', title: 'Otro' }
]

// Headers de la tabla
const headers = computed(() => {
  const baseHeaders = [
    { title: 'ID', key: 'id', sortable: true },
    { title: 'Título', key: 'titulo', sortable: true },
    { title: 'Estado', key: 'estado', sortable: true },
    { title: 'Prioridad', key: 'prioridad', sortable: true },
  ]
  
  if (isAdmin.value) {
    baseHeaders.push(
      { title: 'Estación', key: 'estacion.nombre', sortable: true },
      { title: 'Creado por', key: 'usuario.nombre', sortable: true },
      { title: 'Asignado a', key: 'tecnico.nombre', sortable: true }
    )
  }
  
  baseHeaders.push(
    { title: 'Fecha', key: 'fecha_creacion', sortable: true },
    { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
  )
  
  return baseHeaders
})

// Tickets filtrados
const filteredTickets = computed(() => {
  let filtered = tickets.value
  
  if (selectedStatus.value) {
    filtered = filtered.filter(ticket => ticket.estado === selectedStatus.value)
  }
  
  if (selectedPriority.value) {
    filtered = filtered.filter(ticket => ticket.prioridad === selectedPriority.value)
  }
  
  if (selectedStation.value && isAdmin.value) {
    filtered = filtered.filter(ticket => ticket.estacion_id === selectedStation.value)
  }
  
  return filtered
})

// Funciones de utilidad
const getStatusColor = (status) => {
  const colors = {
    'pendiente': 'orange',
    'en_proceso': 'yellow',
    'resuelto': 'green',
    'cerrado': 'grey'
  }
  return colors[status] || 'grey'
}

const getStatusText = (status) => {
  const texts = {
    'pendiente': 'Pendiente',
    'en_proceso': 'En Proceso',
    'resuelto': 'Resuelto',
    'cerrado': 'Cerrado'
  }
  return texts[status] || status
}

const getPriorityColor = (priority) => {
  const colors = {
    'baja': 'green',
    'media': 'yellow',
    'alta': 'orange',
    'critica': 'red'
  }
  return colors[priority] || 'grey'
}

const getPriorityText = (priority) => {
  const texts = {
    'baja': 'Baja',
    'media': 'Media',
    'alta': 'Alta',
    'critica': 'Crítica'
  }
  return texts[priority] || priority
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
  if (isAdmin.value) return true
  return ticket.usuario_id === currentUser.value?.id && ticket.estado !== 'cerrado'
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
      result = await ticketService.getTicketsByEstacion(userStation.value)
    }
    
    if (result.success) {
      tickets.value = result.data
    } else {
      showMessage(result.error || 'Error al cargar tickets', 'error')
    }
  } catch (error) {
    console.error('Error al cargar tickets:', error)
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
      stats.value = result.data
    }
  } catch (error) {
    console.error('Error al cargar estadísticas:', error)
  } finally {
    dataLoadingStates.value.stats = true
    updateLoadingProgress()
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
      ticketForm.value.prioridad = ticket.prioridad || 'media'
      ticketForm.value.estacion_id = ticket.estacion_id || null
      ticketForm.value.creador_id = ticket.creador_id || null

    } else {
      // Limpiar formulario para nuevo ticket
      ticketForm.value.titulo = ''
      ticketForm.value.descripcion = ''
      ticketForm.value.prioridad = 'media'
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
    ticketForm.value.prioridad = 'media'
    ticketForm.value.estacion_id = isAdmin.value ? null : userStation.value
    ticketForm.value.creador_id = currentUser.value?.id || null
  })
}

const viewTicket = async (ticket) => {
  viewingTicket.value = ticket
  await loadTicketComments(ticket.id)
  showViewDialog.value = true
}

const closeViewDialog = () => {
  showViewDialog.value = false
  viewingTicket.value = null
  ticketComments.value = []
  newComment.value = ''
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

const assignTicket = async (ticket) => {
  // Implementar lógica de asignación
  console.log('Asignar ticket:', ticket)
}

const deleteTicket = async (ticket) => {
  if (!confirm('¿Estás seguro de eliminar este ticket?')) return
  
  try {
    const result = await ticketService.deleteTicket(ticket.id)
    
    if (result.success) {
      showMessage('Ticket eliminado', 'success')
      await loadTickets()
      if (isAdmin.value) await loadStats()
    } else {
      showMessage(result.error || 'Error al eliminar ticket', 'error')
    }
  } catch (error) {
    console.error('Error al eliminar ticket:', error)
    showMessage('Error al eliminar ticket', 'error')
  }
}

const loadTicketComments = async (ticketId) => {
  try {
    const result = await ticketService.getTicketComments(ticketId)
    
    if (result.success) {
      ticketComments.value = result.data
    }
  } catch (error) {
    console.error('Error al cargar comentarios:', error)
  }
}

const addComment = async () => {
  if (!newComment.value.trim()) return
  
  try {
    const result = await ticketService.addComment(viewingTicket.value.id, newComment.value)
    
    if (result.success) {
      newComment.value = ''
      await loadTicketComments(viewingTicket.value.id)
      showMessage('Comentario agregado', 'success')
    } else {
      showMessage(result.error || 'Error al agregar comentario', 'error')
    }
  } catch (error) {
    console.error('Error al agregar comentario:', error)
    showMessage('Error al agregar comentario', 'error')
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