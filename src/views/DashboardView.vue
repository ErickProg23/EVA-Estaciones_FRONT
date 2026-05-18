<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Dashboard"
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
              Dashboard
            </h1>
            <p class="text-grey-400 ma-0">Bienvenido, {{ nombre }}</p>
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
                Tendencia de calificación promedio
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
                Distribución de empleados por puesto
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
import { ref, onMounted, computed, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import { evaluacionService, stationService, userService, dashboardService } from '@/services/apiService.js'

// Registrar Chart.js
Chart.register(...registerables)

// ===== REACTIVE DATA =====
const nombre = ref('')
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

// Datos para gráficos
const datosEmpleados = ref(null)
const datosRendimientoMensual = ref(null)

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
    isInitialLoading.value = true
    loadingProgress.value = 0
    loadingMessage.value = 'Iniciando carga...'
    
    const rolId = sessionStorage.getItem('rol_id')
    
    loadingProgress.value = 25
    loadingMessage.value = 'Cargando datos del usuario...'
    
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
      
      // 🎯 CREAR GRÁFICOS DESPUÉS DE QUE EL LOADING TERMINE
      setTimeout(() => {
        if (datosEmpleados.value) {
          console.log('🎨 Creando gráficos después del loading...')
          crearGraficosEncargado(datosEmpleados.value)
        }
        if (datosRendimientoMensual.value) {
          console.log('🎨 Creando gráfico de líneas con rendimiento mensual...')
          crearGraficosEncargado(datosRendimientoMensual.value)
        }
      }, 300) // Dar tiempo extra para que el DOM se renderice
      
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
      const raw = Array.isArray(actividad.data) ? actividad.data : (actividad.data?.data || [])
      const mapped = mapActividad(raw)
      actividadReciente.value = mapped && mapped.length ? mapped : []
      console.log('📝 Actividades mapeadas:', actividadReciente.value)
    }
    
    // Cargar alertas del periodo y atrasos
    const alertasSrv = await dashboardService.getAlertas(usuarioId)
    if (alertasSrv.success) {
      generarAlertas(alertasSrv)
    }
    
    // Datos para gráficos
    const empleados = await dashboardService.getEmpleadosEnEstacion(usuarioId)
    if (empleados.success) {
      datosEmpleados.value = empleados
    }
    
    const rendimientoMensual = await dashboardService.getRendimientoMensual(usuarioId)
    if (rendimientoMensual.success) {
      datosRendimientoMensual.value = rendimientoMensual
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
  const rd = responseData?.data || {}
  const payload = rd.data || rd
  const nuevas = []
  const deadlineStr = payload?.deadline
  if (deadlineStr) {
    const now = new Date()
    const dl = new Date(String(deadlineStr).replace(' ', 'T'))
    const diffMs = dl.getTime() - now.getTime()
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    let color = 'info'
    let icon = 'mdi-clock-outline'
    let text = ''
    if (daysLeft > 6) {
      color = 'info'
      icon = 'mdi-calendar-check'
      text = `Periodo activo. Restan ${daysLeft} días (límite ${deadlineStr}).`
    } else if (daysLeft >= 3) {
      color = 'warning'
      icon = 'mdi-clock-alert'
      text = `Quedan ${daysLeft} días para completar evaluaciones (límite ${deadlineStr}).`
    } else if (daysLeft >= 1) {
      color = 'error'
      icon = 'mdi-clock-alert-outline'
      text = `Últimos ${daysLeft} día${daysLeft === 1 ? '' : 's'} para evaluar (límite ${deadlineStr}).`
    } else {
      color = 'error'
      icon = 'mdi-calendar-remove'
      text = `Periodo de evaluación vencido (límite ${deadlineStr}).`
    }
    nuevas.push({ id: 'periodo', message: text, color, icon })
  }
  const puestos = payload?.atrasos?.puestos || []
  const empleados = payload?.atrasos?.empleados || []
  puestos.forEach(p => nuevas.push({ id: `p-${p.puesto_id}`, message: `${p.puesto_nombre}: ${p.pendientes} pendientes`, color: 'warning', icon: 'mdi-alert' }))
  empleados.forEach(e => nuevas.push({ id: `e-${e.empleado_id}`, message: `Pendiente: ${e.empleado_nombre} (${e.puesto_nombre})`, color: 'error', icon: 'mdi-account-alert' }))
  alertas.value = nuevas
}

const formatActivityTime = (fecha) => {
  const d = new Date(String(fecha).replace(' ', 'T'))
  const now = new Date()
  const diffMs = now - d
  const min = Math.floor(diffMs / 60000)
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} h`
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  return d.toLocaleDateString('es-ES', opts)
}

const mapActividad = (arr) => {
  const a = Array.isArray(arr) ? arr : []
  return a.map(item => {
    const tipo = item.tipo || ''
    const isAlta = tipo === 'empleado_agregado'
    const isEval = tipo === 'evaluacion_completada' || item.calificacion !== undefined
    const title = isAlta ? 'Nuevo empleado agregado' : isEval ? 'Evaluación completada' : String(item.descripcion || 'Actividad')
    const subtitle = isAlta ? `${item.empleado_nombre || ''} - ${item.puesto_nombre || ''}` : isEval ? `${item.empleado_nombre || ''} - ${item.puesto_nombre || ''} · Calificación ${Number(item.calificacion ?? 0)}` : String(item.descripcion || '')
    const icon = isAlta ? 'mdi-account-plus' : isEval ? 'mdi-check' : 'mdi-information'
    const color = isAlta ? 'blue' : isEval ? 'success' : 'grey'
    return { id: item.id, title, subtitle, time: formatActivityTime(item.fecha), icon, color }
  })
}

const crearGraficosEncargado = async (responseData) => {
  console.log('🎯 Creando gráficos con:', responseData)
  
  // CORRECCIÓN: Los datos están doblemente anidados
  const data = responseData.data?.data || responseData.data || responseData
  
  // 🔍 DEBUG: Verificar estructura de datos
  console.log('📊 Datos extraídos para gráficos:', {
    tieneRendimientoPorPuesto: !!data.rendimientoPorPuesto,
    rendimientoPorPuesto: data.rendimientoPorPuesto,
    tienePromedioMensual: !!data.promedioMensual,
    promedioMensual: data.promedioMensual
  })
  
  // ⏳ ESPERAR MÚLTIPLES TICKS PARA ASEGURAR QUE EL DOM ESTÉ LISTO
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 100)) // Esperar 100ms adicionales
  
  // 🔍 VALIDACIÓN EXHAUSTIVA DE CANVAS
  console.log('🎨 Estado de canvas:', {
    lineChartRef: {
      exists: !!lineChartRef.value,
      type: typeof lineChartRef.value,
      tagName: lineChartRef.value?.tagName,
      hasGetContext: typeof lineChartRef.value?.getContext === 'function'
    },
    doughnutChartRef: {
      exists: !!doughnutChartRef.value,
      type: typeof doughnutChartRef.value,
      tagName: doughnutChartRef.value?.tagName,
      hasGetContext: typeof doughnutChartRef.value?.getContext === 'function'
    }
  })
  
  
  
  // ✅ CREAR GRÁFICO DE LÍNEAS CON VALIDACIÓN MEJORADA
  const mensualArray = Array.isArray(data?.promedioMensual)
    ? data.promedioMensual
    : (Array.isArray(data) ? data : (Array.isArray(data?.meses) ? data.meses : []))
  if (lineChartRef.value && typeof lineChartRef.value.getContext === 'function' && mensualArray && mensualArray.length > 0) {
    try {
      const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
      const labels = mensualArray.map(item => meses[(Number(item.mes) || 1) - 1] || `Mes ${item.mes}`)
      const valores = mensualArray.map(item => {
        const raw = item.promedio ?? item.promedio_calificacion ?? item.calificacion_promedio ?? item.promedioCalificacion ?? item.promedio_mensual
        const num = Number(raw)
        return Number.isFinite(num) ? num : 0
      })
      const ctx = lineChartRef.value.getContext('2d')
      if (ctx) {
        if (lineChart) { lineChart.destroy(); lineChart = null }
        lineChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Calificación promedio por Mes',
              data: valores,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#ffffff' } } },
            scales: {
              x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
              y: {
                beginAtZero: true,
                min: 0,
                max: 100,
                ticks: {
                  color: '#ffffff',
                  callback: function(value) {
                    return value + '%'
                  }
                },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
              }
            }
          }
        })
      }
    } catch (error) {
      console.error('❌ Error creando gráfico de líneas:', error)
    }
  } else {
    console.log('⚠️ No se puede crear gráfico de líneas:', {
      canvas: !!lineChartRef.value,
      hasGetContext: typeof lineChartRef.value?.getContext === 'function',
      datos: Array.isArray(mensualArray) ? mensualArray.length : 0
    })
  }
  
  // ✅ CREAR GRÁFICO CIRCULAR CON VALIDACIÓN MEJORADA
  if (doughnutChartRef.value && typeof doughnutChartRef.value.getContext === 'function') {
    try {
      const ctx = doughnutChartRef.value.getContext('2d')
      if (!ctx) {
        console.error('❌ No se pudo obtener el contexto 2D del canvas')
        return
      }
      
      const empleadosArray = Array.isArray(data)
        ? data
        : (
            Array.isArray(data?.empleados_por_puesto) ? data.empleados_por_puesto :
            Array.isArray(data?.empleados) ? data.empleados :
            Array.isArray(data?.data) ? data.data :
            Object.values(data || {}).filter(v => v && typeof v === 'object' && 'puesto_nombre' in v && 'total_empleados' in v)
          )

      if (empleadosArray && empleadosArray.length > 0) {
        const labels = empleadosArray.map(item => item.puesto_nombre)
        const valores = empleadosArray.map(item => Number(item.total_empleados) || 0)
        
        console.log('🍩 Creando gráfico circular con:', { labels, valores })
        
        doughnutChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: valores,
              backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#795548'],
              borderColor: '#1e1e1e',
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { 
                  color: '#ffffff',
                  padding: 20,
                  usePointStyle: true,
                  font: {
                    size: 12
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed;
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${label}: ${value} empleados (${percentage}%)`;
                  }
                }
              }
            },
            cutout: '60%',
            animation: {
              animateRotate: true,
              duration: 1000
            }
          }
        })
        console.log('✅ Gráfico circular creado exitosamente')
      } else {
        console.log('⚠️ Dataset sin empleados para distribución, se omite actualización del donut')
      }
    } catch (error) {
      console.error('❌ Error creando gráfico circular:', error)
    }
  } else {
    console.log('⚠️ No se puede crear gráfico circular:', {
      canvas: !!doughnutChartRef.value,
      context: doughnutChartRef.value?.getContext ? 'OK' : 'NO',
      tagName: doughnutChartRef.value?.tagName || 'undefined'
    })
  }
}


// ===== LIFECYCLE =====
onMounted(() => {
  nombre.value = sessionStorage.getItem('nombre') || 'Nombre'
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