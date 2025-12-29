import axios from 'axios'

const API_URL = process.env.VUE_APP_API_URL

// Configuración base de axios
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Interceptor para agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token')
    if (token) {
      config.headers.token = token
    }
    const usuarioId = sessionStorage.getItem('usuario_id')
    if (usuarioId) {
      config.headers['token_usuario_id'] = usuarioId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar respuestas y errores globalmente
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('token')
      // Aquí podrías redirigir al login si tienes router
      // router.push('/login')
    }
    return Promise.reject(error)
  }
)

// Servicios específicos
export const userService = {
  // Obtener usuarios
  getUsuarios: async () => {
    try {
      const response = await apiClient.get('/api/getUsuarios')
      console.log('Respuesta de usuarios:', response.data)
      
      // El backend devuelve {success: true, usuarios: [...]}
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data.usuarios || [],
          message: 'Usuarios obtenidos correctamente'
        }
      } else {
        return {
          success: false,
          data: [],
          message: 'No se encontraron usuarios'
        }
      }
    } catch (error) {
      console.error('Error en getUsuarios:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      }
    }
  },

  // Crear nuevo usuario
  createUsuario: async (userData) => {
    try {
      const response = await apiClient.post('/api/newUsuario', userData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },

  // Actualizar usuario (cuando implementes el endpoint)
  updateUsuario: async (id, userData) => {
    try {
      const response = await apiClient.put(`/api/updateUsuario/${id}`, userData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },

  // Eliminar usuario (cuando implementes el endpoint)
  deleteUsuario: async (id) => {
    try {
      const response = await apiClient.delete(`/api/deleteUsuario/${id}`)
      return {
        success: response.data.success,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  }
}

export const roleService = {
  // Obtener todos los roles
  getRoles: async () => {
    try {
      const response = await apiClient.get('/api/getRoles')
      console.log('Respuesta de roles:', response.data)
      
      // El backend devuelve directamente el array de roles
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        message: 'Roles obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error en getRoles:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      }
    }
  },
}

export const puestoService = {
  // Obtener todos los puestos
  getPuestos: async () => {
    try {
      const response = await apiClient.get('/api/getPuestos')
      console.log('Respuesta de puestos:', response.data)
      
      // CORRECCIÓN: El backend devuelve {puestos: [...], success: true}
      if (response.data && response.data.success) {
        return {
          success: true,
          puestos: response.data.puestos || [], // ← Cambiar aquí
          message: 'Puestos obtenidos correctamente'
        }
      } else {
        return {
          success: false,
          puestos: [], // ← Y aquí
          message: 'No se encontraron puestos'
        }
      }
    } catch (error) {
      console.error('Error en getPuestos:', error)
      return {
        success: false,
        puestos: [], // ← Y aquí también
        message: error.message || 'Error de conexión'
      }
    }
  },
  newPuesto: async (puestoData) => {
    try {
      const response = await apiClient.post('/api/newPuesto', puestoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },
  updatePuesto: async (id, puestoData) => {
    try {
      const response = await apiClient.put(`/api/updatePuesto/${id}`, puestoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },
  deletePuesto: async (id) => {
    try {
      const response = await apiClient.delete(`/api/deletePuesto/${id}`)
      return {
        success: response.data.success,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  }
}

export const stationService = {
  // Obtener todas las estaciones
  getEstaciones: async () => {
    try {
      const response = await apiClient.get('/api/getEstaciones')
      console.log('Respuesta de estaciones:', response.data)
      
      // El backend devuelve directamente el array de estaciones
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        message: 'Estaciones obtenidas correctamente'
      }
    } catch (error) {
      console.error('Error en getEstaciones:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      }
    }
  },

  // Crear nueva estación (para futuro)
  createEstacion: async (estacionData) => {
    try {
      const response = await apiClient.post('/api/createEstacion', estacionData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },

  deleteEstacion: async(estacionID) => {
    try {
      const response = await apiClient.put(`/api/deleteEstacion/${estacionID}`)
      return {
        success: response.data.success,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  }
}

export const empleadoService = {
  getEmpleados: async () => {
    try {
      const response = await apiClient.get('/api/getPersonal')
      console.log('Respuesta de empleados:', response.data)
      
      // El backend devuelve directamente el array de empleados
      return {
        success: true,
        personal: Array.isArray(response.data) ? response.data : [],
      }
    } catch (error) {
      console.error('Error en getEmpleados:', error)
      return {
        success: false,
        personal: [],

      }
    }
  },
  newEmpleado: async (empleadoData) => {
    try {
      const response = await apiClient.post('/api/newPersonal', empleadoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },
  updateEmpleado: async (id, empleadoData) => {
    try {
      const response = await apiClient.put(`/api/updateEmpleado/${id}`, empleadoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },
  deleteEmpleado: async (id) => {
    try {
      const response = await apiClient.put(`/api/deleteEmpleado/${id}`)
      return {
        success: response.data.success,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  }

}

// Agregar al final del archivo, antes de la exportación
// ✅ Agregar al aspectoService existente
export const aspectoService = {
  // Obtener todos los aspectos
  getAspectos: async () => {
    try {
      const response = await apiClient.get('/api/getAspectos')
      console.log('Respuesta de aspectos:', response.data)
      
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : [],
        message: 'Aspectos obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error en getAspectos:', error)
      return {
        success: false,
        data: [],
        message: error.message || 'Error de conexión'
      }
    }
  },

  // Crear nuevo aspecto
  createAspecto: async (aspectoData) => {
    try {
      const response = await apiClient.post('/api/newAspecto', aspectoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },

  // Actualizar aspecto
  updateAspecto: async (id, aspectoData) => {
    try {
      const response = await apiClient.put(`/api/updateAspecto/${id}`, aspectoData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message
      }
    } catch (error) {
      throw error
    }
  },

  // Obtener aspectos por puesto
  // Nuevo método para usar tu endpoint
  async getAspectosByPuesto(puestoId) {
    try {
      const response = await apiClient.get(`/api/getAspectosByPuesto/${puestoId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener aspectos del puesto'
      }
    }
  },
  
  async updatePesoAspectoPuesto(puestoId, aspectoId, peso) {
    try {
      const response = await apiClient.put('/api/updatePesoAspectoPuesto', {
        puesto_id: puestoId,
        aspecto_id: aspectoId,
        peso: peso
      })
      
      // ✅ Verificar la nueva estructura de respuesta
      if (response.data && response.data.success) {
        return {
          success: true,
          data: response.data,
          message: response.data.message || 'Peso procesado correctamente'
        }
      } else {
        return {
          success: false,
          message: response.data?.message || 'Error al procesar peso'
        }
      }
    } catch (error) {
      console.error('Error en updatePesoAspectoPuesto:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error de conexión al procesar peso'
      }
    }
  },

  async getAspectosPorPuesto(puestoId) {
    try {
      const response = await apiClient.get(`/api/getAspectosPorPuestoEspecifico/${puestoId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener aspectos del puesto'
      }
    }
  }
}

export const evaluacionService = {
    async get_empleados_by_usuario_estacion(usuario_id){
      try {
        const response = await apiClient.get(`/api/getEmpleadosByUsuarioEstacion/${usuario_id}`)
        return {
          success: true,
          data: response.data
        }
      } catch (error) {
        return {
          success: false,
          message: error.response?.data?.message || 'Error al obtener empleados de la estación'
        }
      }
    },
    async get_empleados_by_usuario_estacion(usuario_id){
    try {
      const response = await apiClient.get(`/api/getEmpleadosByUsuarioEstacion/${usuario_id}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener empleados de la estación'
      }
    }
  },

  // Nuevo: Guardar borrador de evaluación (auto-guardado)
  async guardarBorrador(evaluacionData) {
    try {
      const response = await apiClient.post('/api/guardarBorradorEvaluacion', evaluacionData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message || 'Borrador guardado correctamente'
      }
    } catch (error) {
      console.error('Error al guardar borrador:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al guardar borrador'
      }
    }
  },

  // Nuevo: Finalizar evaluación de puesto
  async finalizarEvaluacionPuesto(evaluacionData) {
    try {
      const response = await apiClient.post('/api/finalizarEvaluacionPuesto', evaluacionData)
      return {
        success: response.data.success,
        data: response.data,
        message: response.data.message || 'Evaluación finalizada correctamente'
      }
    } catch (error) {
      console.error('Error al finalizar evaluación:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Error al finalizar evaluación'
      }
    }
  },

  // Nuevo: Obtener evaluaciones guardadas (para cargar borradores)
  async obtenerEvaluacionesPuesto(usuarioId, puestoId) {
    try {
      const response = await apiClient.get(`/api/getEvaluacionesPuesto/${usuarioId}/${puestoId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener evaluaciones'
      }
    }
  }
}

export const ticketService = {
  // Obtener todos los tickets (solo para ADMIN)
  getTickets: async () => {
    try {
      const response = await apiClient.get('/tickets')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al obtener tickets:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener tickets'
      }
    }
  },

  // Obtener tickets por usuario
  getTicketsByUsuario: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/tickets/usuario/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al obtener tickets por usuario:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener tickets por usuario'
      }
    }
  },

  // Crear nuevo ticket
  createTicket: async (ticketData) => {
    try {
      const response = await apiClient.post('/tickets', ticketData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al crear ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al crear ticket'
      }
    }
  },

  // Obtener ticket por ID
  getTicketById: async (ticketId) => {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al obtener ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener ticket'
      }
    }
  },

  // Actualizar ticket
  updateTicket: async (ticketId, ticketData) => {
    try {
      const response = await apiClient.put(`/tickets/${ticketId}`, ticketData)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al actualizar ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar ticket'
      }
    }
  },

  // Actualizar estado del ticket
  updateTicketStatus: async (ticketId, estado) => {
    try {
      const response = await apiClient.patch(`/tickets/${ticketId}/estado`, { estado })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al actualizar estado del ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al actualizar estado del ticket'
      }
    }
  },

  // Asignar ticket a técnico (solo ADMIN)
  assignTicket: async (ticketId, tecnicoId) => {
    try {
      const response = await apiClient.patch(`/tickets/${ticketId}/asignar`, { tecnico_id: tecnicoId })
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al asignar ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al asignar ticket'
      }
    }
  },

  // Agregar comentario al ticket
  addComment: async (ticketId, comentario) => {
    try {
      const usuarioId = sessionStorage.getItem('usuario_id')
      const payload = usuarioId ? { comentario, usuario_id: parseInt(usuarioId) } : { comentario }
      const response = await apiClient.post(`/tickets/${ticketId}/comentarios`, payload)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al agregar comentario:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al agregar comentario'
      }
    }
  },

  // Obtener comentarios del ticket
  getTicketComments: async (ticketId) => {
    try {
      const response = await apiClient.get(`/tickets/${ticketId}/comentarios`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al obtener comentarios:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener comentarios'
      }
    }
  },

  // Obtener estadísticas de tickets (para ADMIN)
  getTicketStats: async () => {
    try {
      const response = await apiClient.get('/tickets/estadisticas')
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al obtener estadísticas:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al obtener estadísticas'
      }
    }
  },

  // Eliminar ticket (solo ADMIN)
  deleteTicket: async (ticketId) => {
    try {
      const response = await apiClient.delete(`/tickets/${ticketId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      console.error('Error al eliminar ticket:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Error al eliminar ticket'
      }
    }
  }
}

export const reporteService = {
  // Obtener reportes de estaciones con filtros
  getReportesEstaciones: async (filtros = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filtros.año) params.append('año', filtros.año)
      if (filtros.mes) params.append('mes', filtros.mes)
      if (filtros.estacion_id) params.append('estacion_id', filtros.estacion_id)
      if (filtros.puesto_id) params.append('puesto_id', filtros.puesto_id)
      
      const url = `/api/getReportesEstaciones${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      
      console.log('Respuesta de reportes:', response.data)
      
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.reportes || [],
        message: 'Reportes obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error en getReportesEstaciones:', error)
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Error de conexión'
      }
    }
  },

  // Obtener estadísticas generales de reportes
  getEstadisticasReportes: async (filtros = {}) => {
    try {
      const params = new URLSearchParams()
      
      if (filtros.año) params.append('año', filtros.año)
      if (filtros.mes) params.append('mes', filtros.mes)
      
      const url = `/api/getEstadisticasReportes${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      
      return {
        success: true,
        data: response.data,
        message: 'Estadísticas obtenidas correctamente'
      }
    } catch (error) {
      console.error('Error en getEstadisticasReportes:', error)
      return {
        success: false,
        data: {},
        message: error.response?.data?.message || error.message || 'Error de conexión'
      }
    }
  }
}

export const dashboardService = {
  // Obtener métricas específicas de la estación del encargado
  getMetricasEstacion: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getMetricasEstacion/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener métricas de la estación'
      }
    }
  },

  // Obtener información completa de la estación
  getInfoEstacion: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getInfoEstacion/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener información de la estación'
      }
    }
  },

  // Obtener evaluaciones pendientes de la estación
  getEvaluacionesPendientes: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getEvaluacionesPendientes/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener evaluaciones pendientes'
      }
    }
  },

  // Obtener actividad reciente de la estación
  getActividadReciente: async (usuarioId, limite = 10) => {
    try {
      const response = await apiClient.get(`/api/getActividadReciente/${usuarioId}?limite=${limite}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener actividad reciente'
      }
    }
  },

  // Obtener resumen de rendimiento de la estación
  getEmpleadosEnEstacion: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getEmpleadosEnEstacion/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener empleados en la estación'
      }
    }
  },

  getRendimientoMensual: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getRendimientoMensual/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener rendimiento mensual'
      }
    }
  },

  getAlertas: async (usuarioId) => {
    try {
      const response = await apiClient.get(`/api/getAlertas/${usuarioId}`)
      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Error al obtener alertas'
      }
    }
  }



}

// Exportar cliente base para casos especiales
export const productoService = {
  // Obtener todos los productos
  async getProductosByUsuarioEstacion(usuarioId) {
    try {
      const response = await apiClient.get(`/api/getProductosByUsuarioEstacion/${usuarioId}`)
      const data = Array.isArray(response.data) ? response.data : response.data.productos || []
      return { success: true, data, message: 'Productos de la estación obtenidos' }
    } catch (error) {
      console.error('Error en getProductosByUsuarioEstacion:', error)
      return { success: false, data: [], message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async updatePrecioProducto(productoId, precio, usuarioId) {
    try {
      const response = await apiClient.put(`/api/updatePrecioProducto/${productoId}`, { precio, usuario_id: usuarioId })
      return { success: true, data: response.data, message: response.data?.message || 'Precio actualizado' }
    } catch (error) {
      console.error('Error en updatePrecioProducto:', error)
      return { success: false, message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  }
}

export const bombaService = {
  async getBombas() {
    try {
      const response = await apiClient.get('/api/getBombas')
      const data = Array.isArray(response.data) ? response.data : response.data.bombas || []
      return { success: true, data, message: 'Bombas obtenidas correctamente' }
    } catch (error) {
      console.error('Error en getBombas:', error)
      return { success: false, data: [], message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async getBombasByUsuarioEstacion(usuarioId) {
    try {
      const response = await apiClient.get(`/api/getBombasByUsuarioEstacion/${usuarioId}`)
      const data = Array.isArray(response.data) ? response.data : response.data.bombas || []
      return { success: true, data, message: 'Bombas de la estación obtenidas' }
    } catch (error) {
      console.error('Error en getBombasByUsuarioEstacion:', error)
      return { success: false, data: [], message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async guardarLecturaManual(lecturaData) {
    try {
      const response = await apiClient.post('/api/guardarLecturaManual', lecturaData)
      return { success: response.data?.success ?? true, data: response.data, message: response.data?.message || 'Lectura guardada correctamente' }
    } catch (error) {
      console.error('Error en guardarLecturaManual:', error)
      return { success: false, data: null, message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async getLecturasManualUltimas(estacionId, fecha, turno) {
    try {
      const params = new URLSearchParams()
      if (fecha) params.append('fecha', fecha)
      if (turno) params.append('turno', turno)
      const url = `/api/getLecturasManualUltimas/${estacionId}${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      const data = Array.isArray(response.data) ? response.data : response.data.lecturas || []
      return { success: true, data, message: 'Lecturas últimas obtenidas' }
    } catch (error) {
      console.error('Error en getLecturasManualUltimas:', error)
      return { success: false, data: [], message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async getLecturasManualDiferencias(estacionId, fecha, turno) {
    try {
      const params = new URLSearchParams()
      if (fecha) params.append('fecha', fecha)
      if (turno != null) params.append('turno', turno)
      const url = `/api/getLecturasManualDiferencias/${estacionId}${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      const data = Array.isArray(response.data) ? response.data : response.data.lecturas || []
      return { success: true, data, message: 'Lecturas diferencias obtenidas' }
    } catch (error) {
      console.error('Error en getLecturasManualDiferencias:', error)
      return { success: false, data: [], message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async saveComparativaTotales(data) {
    try {
      const response = await apiClient.post('/api/saveComparativaTotales', data)
      return { success: response.data?.success ?? true, message: response.data?.message || 'Totales guardados correctamente' }
    } catch (error) {
      console.error('Error en saveComparativaTotales:', error)
      return { success: false, message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  },

  async getComparativaTotales(estacionId, fecha, turno) {
    try {
      const params = new URLSearchParams()
      if (fecha) params.append('fecha', fecha)
      if (turno) params.append('turno', turno)
      const url = `/api/getComparativaTotales/${estacionId}${params.toString() ? '?' + params.toString() : ''}`
      const response = await apiClient.get(url)
      return { success: true, nexus_totales: response.data.nexus_totales || {}, detalles: response.data.detalles || {}, message: 'Totales obtenidos' }
    } catch (error) {
      console.error('Error en getComparativaTotales:', error)
      return { success: false, nexus_totales: {}, detalles: {}, message: error.response?.data?.message || error.message || 'Error de conexión' }
    }
  }
}

export const materialService = {
  // Obtener todos los materiales
  async getMateriales() {
    try {
      const response = await apiClient.get('/api/materiales/obtener')
      return {
        success: true,
        data: response.data,
        message: 'Materiales obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error en getMateriales:', error)
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Error de conexión'
      }
    }
  },

  // Crear nuevo material
  async createMaterial(materialData) {
    try {
      const response = await apiClient.post('/api/materiales/crear', materialData)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Material creado correctamente'
      }
    } catch (error) {
      console.error('Error en createMaterial:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al crear material'
      }
    }
  },

  // Obtener materiales asignados a una estación
  async getMaterialesEstacion(estacionId) {
    try {
      const response = await apiClient.get(`/api/materiales/estacion/${estacionId}`)
      return {
        success: true,
        data: response.data,
        message: 'Materiales de estación obtenidos correctamente'
      }
    } catch (error) {
      console.error('Error en getMaterialesEstacion:', error)
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Error de conexión'
      }
    }
  },

  // Asignar material a estación
  async asignarMaterial(data) {
    try {
      const response = await apiClient.post('/api/materiales/asignar', data)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Material asignado correctamente'
      }
    } catch (error) {
      console.error('Error en asignarMaterial:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al asignar material'
      }
    }
  },

  // Desasignar material de estación
  async desasignarMaterial(data) {
    try {
      const response = await apiClient.post('/api/materiales/desasignar', data)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Material desasignado correctamente'
      }
    } catch (error) {
      console.error('Error en desasignarMaterial:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al desasignar material'
      }
    }
  },

  // Actualizar stock de material en estación
  async updateStock(data) {
    try {
      const response = await apiClient.put('/api/materiales/stock', data)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Stock actualizado correctamente'
      }
    } catch (error) {
      console.error('Error en updateStock:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar stock'
      }
    }
  }
}

export const solicitudesService = {
  // Crear nueva solicitud
  async createSolicitud(solicitudData) {
    try {
      const response = await apiClient.post('/api/solicitudes/crear', solicitudData)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Solicitud creada correctamente'
      }
    } catch (error) {
      console.error('Error en createSolicitud:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al crear solicitud'
      }
    }
  },

  // Obtener solicitudes
  async getSolicitudes(params = {}) {
    try {
      // Construir query string con los parámetros recibidos
      const queryParams = new URLSearchParams()
      if (params.estacion_id) queryParams.append('estacion_id', params.estacion_id)
      if (params.usuario_id) queryParams.append('usuario_id', params.usuario_id)
      if (params.estado) queryParams.append('estado', params.estado)

      const queryString = queryParams.toString()
      const url = queryString ? `/api/solicitudes?${queryString}` : '/api/solicitudes'

      const response = await apiClient.get(url)
      return {
        success: true,
        data: Array.isArray(response.data) ? response.data : response.data.solicitudes || [],
        message: 'Solicitudes obtenidas correctamente'
      }
    } catch (error) {
      console.error('Error en getSolicitudes:', error)
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || error.message || 'Error al obtener solicitudes'
      }
    }
  },

  // Actualizar estado de solicitud
  async updateSolicitudStatus(id, estado, comentarios = '') {
    try {
      const response = await apiClient.put(`/api/solicitudes/${id}/estado`, { estado, comentarios })
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Estado actualizado correctamente'
      }
    } catch (error) {
      console.error('Error en updateSolicitudStatus:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al actualizar estado'
      }
    }
  },

  // Confirmar recepción (Nuevo Endpoint)
  async confirmarRecepcion(id) {
    try {
      const response = await apiClient.post(`/api/solicitudes/${id}/confirmar`)
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Recepción confirmada correctamente'
      }
    } catch (error) {
      console.error('Error en confirmarRecepcion:', error)
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Error al confirmar recepción'
      }
    }
  }
}
export default apiClient
