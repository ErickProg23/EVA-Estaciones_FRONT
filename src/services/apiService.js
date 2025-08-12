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
  }
}

// Exportar cliente base para casos especiales
export default apiClient
