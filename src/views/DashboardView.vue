<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Dashboard EVA"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-view-dashboard"
    />
    
    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <!-- Header -->
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 font-weight-bold text-white mb-2">
              <v-icon class="mr-3" color="green">mdi-view-dashboard</v-icon>
              Dashboard EVA
            </h1>
            <p class="text-grey-400 ma-0">Bienvenido, {{ username }}</p>
          </div>
          <v-chip color="success" variant="outlined">
            <v-icon left>mdi-clock</v-icon>
            {{ fechaActual }}
          </v-chip>
        </div>

        <!-- Tarjetas de Resumen -->
          <v-row class="mb-6">
          <v-col cols="12" sm="6" md="4" v-for="metric in metricas" :key="metric.title">
            <v-card dark color="#2d2d2d" class="metric-card">
              <v-card-text>
                <div class="d-flex align-center">
                  <v-icon :color="metric.color" size="40">{{ metric.icon }}</v-icon>
                  <div class="ml-4">
                    <h3 class="text-h4 font-weight-bold">{{ metric.value }}</h3>
                    <p class="text-grey-400 mb-0">{{ metric.title }}</p>
                    <v-chip v-if="metric.trend" :color="metric.trendColor" size="x-small" class="mt-1">
                      <v-icon left size="12">{{ metric.trendIcon }}</v-icon>
                      {{ metric.trend }}
                    </v-chip>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Gráficos -->
        <v-row class="mb-6">
          <v-col cols="12" md="8">
            <v-card dark color="#2d2d2d">
              <v-card-title>
                <v-icon left color="blue">mdi-chart-line</v-icon>
                Tendencia de Evaluaciones
              </v-card-title>
              <v-card-text>
                <canvas ref="lineChartRef" height="300"></canvas>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card dark color="#2d2d2d">
              <v-card-title>
                <v-icon left color="orange">mdi-chart-donut</v-icon>
                Distribución por Estación
              </v-card-title>
              <v-card-text>
                <canvas ref="doughnutChartRef" height="300"></canvas>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Actividad Reciente y Alertas -->
        <v-row>
          <v-col cols="12" md="8">
            <v-card dark color="#2d2d2d">
              <v-card-title>
                <v-icon left color="green">mdi-history</v-icon>
                Actividad Reciente
              </v-card-title>
              <v-card-text>
                <v-list dark>
                  <v-list-item v-for="activity in actividadReciente" :key="activity.id">
                    <template v-slot:prepend>
                      <v-avatar :color="activity.color" size="32">
                        <v-icon>{{ activity.icon }}</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ activity.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ activity.subtitle }}</v-list-item-subtitle>
                    <template v-slot:append>
                      <span class="text-caption text-grey-400">{{ activity.time }}</span>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="4">
            <v-card dark color="#2d2d2d">
              <v-card-title>
                <v-icon left color="red">mdi-alert</v-icon>
                Alertas
                <v-chip color="red" size="x-small" class="ml-2">{{ alertas.length }}</v-chip>
              </v-card-title>
              <v-card-text>
                <v-alert v-for="alert in alertas" :key="alert.id" 
                  :color="alert.color" variant="tonal" class="mb-2">
                  <v-icon>{{ alert.icon }}</v-icon>
                  {{ alert.message }}
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Chart, registerables } from 'chart.js'
import { evaluacionService, stationService, userService, dashboardService } from '@/services/apiService.js'

// Registrar Chart.js
Chart.register(...registerables)

// ===== REACTIVE DATA =====
const username = ref('')
const isInitialLoading = ref(true)
const loadingMessage = ref('Cargando dashboard...')
const loadingProgress = ref(0)

// Datos del dashboard
const metricas = ref([
  {
    title: 'Estaciones Activas',
    value: '0',
    icon: 'mdi-map-marker-multiple',
    color: 'green',
  },
  {
    title: 'Empleados Activos',
    value: '0',
    icon: 'mdi-account-group',
    color: 'orange',
  },
  {
    title: 'Promedio General',
    value: '0.0',
    icon: 'mdi-star',
    color: 'yellow',
  }
])

const actividadReciente = ref([
  {
    id: 1,
    title: 'Evaluación completada',
    subtitle: 'Juan Pérez - Estación Norte',
    time: 'Hace 2 horas',
    icon: 'mdi-check',
    color: 'success'
  },
  {
    id: 2,
    title: 'Nuevo empleado agregado',
    subtitle: 'María García - Estación Sur',
    time: 'Hace 4 horas',
    icon: 'mdi-account-plus',
    color: 'blue'
  }
])

const alertas = ref([
  {
    id: 1,
    message: '5 evaluaciones pendientes por vencer',
    color: 'warning',
    icon: 'mdi-clock-alert'
  },
  {
    id: 2,
    message: '2 tickets sin resolver',
    color: 'error',
    icon: 'mdi-ticket-alert'
  }
])

// AGREGAR ESTAS DOS LÍNEAS:
const lineChartRef = ref(null)
const doughnutChartRef = ref(null)

// Variables para almacenar las instancias de los gráficos
let lineChart = null
let doughnutChart = null

// ===== COMPUTED PROPERTIES =====
const fechaActual = computed(() => {
  return new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

// ===== METHODS =====
const cargarDatos = async () => {
  try {
    loadingMessage.value = 'Cargando métricas...'
    loadingProgress.value = 25
    
    // Cargar datos según el rol del usuario
    const rolId = sessionStorage.getItem('rol_id')
    
    if (rolId === '1') { // ADMIN
      await cargarDatosAdmin()
    } else { // Encargado
      await cargarDatosEncargado()
    }
    
    loadingProgress.value = 75
    loadingMessage.value = 'Finalizando...'
    
    
    loadingProgress.value = 100
    
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500)
    
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error)
    isInitialLoading.value = false
  }
}

const cargarDatosAdmin = async () => {
  // Implementar carga de datos para admin
  // Usar los servicios existentes: stationService, userService, etc.
}

const cargarDatosEncargado = async () => {
  try {
    const usuarioId = sessionStorage.getItem('usuario_id')
    console.log('Cargando datos para usuario:', usuarioId)
    
    // Cargar métricas principales
    const metricas = await dashboardService.getMetricasEstacion(usuarioId)
    console.log('Respuesta de métricas:', metricas)
    if (metricas.success) {
      actualizarMetricas(metricas) // Pasar todo el objeto de respuesta
    }
    
    // Cargar actividad reciente
    const actividad = await dashboardService.getActividadReciente(usuarioId)
    if (actividad.success) {
      actividadReciente.value = actividad.data
    }
    
    // Cargar evaluaciones pendientes para alertas
    const pendientes = await dashboardService.getEvaluacionesPendientes(usuarioId)
    if (pendientes.success) {
      generarAlertas(pendientes) // Pasar todo el objeto de respuesta
    }
    
    // Cargar datos para gráficos
    const rendimiento = await dashboardService.getRendimientoEstacion(usuarioId)
    if (rendimiento.success) {
      crearGraficosEncargado(rendimiento) // Pasar todo el objeto de respuesta
    }
    
  } catch (error) {
    console.error('Error al cargar datos del encargado:', error)
  }
}

// Agregar estas funciones antes de onMounted
const actualizarMetricas = (responseData) => {
  console.log('Actualizando métricas con:', responseData)
  
  // CORRECCIÓN: Los datos están doblemente anidados
  const data = responseData.data?.data || responseData.data || responseData
  
  if (data) {
    metricas.value[0].value = '1'  // Estaciones Activas (1 para encargado)
    metricas.value[1].value = data.empleadosActivos?.toString() || '0'  // Empleados Activos
    metricas.value[2].value = data.promedioCalificacion?.toString() || '0.0'  // Promedio General
    
    console.log('Empleados activos asignados:', data.empleadosActivos)
    console.log('Métricas actualizadas:', metricas.value)
  } else {
    console.error('No se encontraron datos en la respuesta:', responseData)
  }
}

const generarAlertas = (responseData) => {
  console.log('Generando alertas con:', responseData)
  
  // Los datos de alertas vienen como un array en responseData.data
  const alertasData = responseData.data || []
  const nuevasAlertas = []
  
  // Procesar evaluaciones pendientes del array
  if (Array.isArray(alertasData) && alertasData.length > 0) {
    alertasData.forEach((evaluacion, index) => {
      nuevasAlertas.push({
        id: index + 1,
        message: `Evaluación pendiente: ${evaluacion.empleado_nombre} (${evaluacion.puesto_nombre})`,
        color: evaluacion.dias_vencido > 0 ? 'error' : 'warning',
        icon: evaluacion.dias_vencido > 0 ? 'mdi-alert-circle' : 'mdi-clock-alert'
      })
    })
  }
  
  alertas.value = nuevasAlertas
  console.log('Alertas generadas:', alertas.value)
}

const crearGraficosEncargado = (responseData) => {
  console.log('Creando gráficos con:', responseData)
  
  const data = responseData.data || responseData
  
  // Destruir gráficos existentes si existen
  if (lineChart) {
    lineChart.destroy()
  }
  if (doughnutChart) {
    doughnutChart.destroy()
  }
  
  // Crear gráfico de líneas con datos reales
  if (lineChartRef.value && data.promedioMensual) {
    const labels = data.promedioMensual.map(item => {
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return meses[item.mes - 1] || `Mes ${item.mes}`
    })
    const valores = data.promedioMensual.map(item => item.promedio)
    
    lineChart = new Chart(lineChartRef.value, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Promedio Mensual',
          data: valores,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        },
        scales: {
          x: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            ticks: { color: '#ffffff' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        }
      }
    })
  }
  
  // Crear gráfico circular con rendimiento por puesto
  if (doughnutChartRef.value && data.rendimientoPorPuesto) {
    const labels = data.rendimientoPorPuesto.map(item => item.puesto)
    const valores = data.rendimientoPorPuesto.map(item => item.empleados)
    
    doughnutChart = new Chart(doughnutChartRef.value, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: valores,
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#ffffff' }
          }
        }
      }
    })
  }
}


// ===== LIFECYCLE =====
onMounted(() => {
  username.value = sessionStorage.getItem('username') || 'Usuario'
  cargarDatos()
})
</script>

<style scoped>
.metric-card {
  transition: transform 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
}

.fade-in {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>