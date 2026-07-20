<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Reportes"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-chart-line"
    />
    
    <!-- Contenido principal -->
    <div v-else class="fade-in">
      <v-container fluid class="pa-6">
        <v-row>
          <v-col cols="12">
            <!-- Header principal -->
            <div class="d-flex align-center justify-space-between mb-6">
              <div>
                <h1 class="text-h4 font-weight-bold text-white mb-2">
                  <v-icon class="mr-3" color="green">mdi-chart-line</v-icon>
                  Reportes de Estaciones
                </h1>
                <p class="text-grey-400 ma-0">Análisis de calificaciones promedio por mes y estación</p>
              </div>
              <v-btn 
                color="green" 
                size="large" 
                @click="exportData"
                class="text-none"
                :loading="exporting"
              >
                <v-icon left>mdi-download</v-icon>
                Exportar Datos
              </v-btn>
            </div>

            <!-- Filtros -->
            <v-card dark color="#2d2d2d" class="mb-4">
              <v-card-title>
                <v-icon left color="orange">mdi-filter</v-icon>
                Filtros de Análisis
              </v-card-title>
              <v-card-text>
                <v-row align="center">
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedYear"
                      :items="yearOptions"
                      label="Año"
                      variant="outlined"
                      density="compact"
                      hide-details
                      @update:model-value="loadReportData"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedMonth"
                      :items="monthOptions"
                      item-title="text"
                      item-value="value"
                      label="Mes"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      @update:model-value="loadReportData"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedEstacion"
                      :items="estacionOptions"
                      item-title="text"
                      item-value="value"
                      label="Estación"
                      variant="outlined"
                      density="compact"
                      hide-details
                      @update:model-value="loadReportData"
                    ></v-select>
                  </v-col>
                  <v-col cols="12" md="3">
                    <v-select
                      v-model="selectedPuesto"
                      :items="puestoOptions"
                      item-title="text"
                      item-value="value"
                      label="Puesto"
                      variant="outlined"
                      density="compact"
                      hide-details
                      clearable
                      @update:model-value="loadReportData"
                    ></v-select>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Estadísticas Generales -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-card dark color="#2d2d2d">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="green" class="mb-2">mdi-chart-line-variant</v-icon>
                    <h3 class="text-h4 font-weight-bold text-green">{{ estadisticas.promedioGeneral }}</h3>
                    <p class="text-grey-400 ma-0">Promedio General</p>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card dark color="#2d2d2d">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="blue" class="mb-2">mdi-account-group</v-icon>
                    <h3 class="text-h4 font-weight-bold text-blue">{{ estadisticas.totalEvaluaciones }}</h3>
                    <p class="text-grey-400 ma-0">Total Evaluaciones</p>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="12" md="4">
                <v-card dark color="#2d2d2d">
                  <v-card-text class="text-center">
                    <v-icon size="48" color="purple" class="mb-2">mdi-briefcase</v-icon>
                    <h3 class="text-h4 font-weight-bold text-purple">{{ estadisticas.puestosEvaluados }}</h3>
                    <p class="text-grey-400 ma-0">Puestos Evaluados</p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Gráficas -->
            <v-row>
              <!-- Gráfica de Tendencia Mensual -->
              <v-col cols="12" lg="12">
                <v-card dark color="#2d2d2d">
                  <v-card-title>
                    <v-icon left color="blue">mdi-chart-line</v-icon>
                    {{ selectedMonth ? `Calificaciones Individuales - ${getMonthName(selectedMonth)} ${selectedYear}` : 'Tendencia de Calificaciones por Mes' }}
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-container" style="height: 400px;">
                      <canvas ref="lineChartRef" id="lineChart"></canvas>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Segunda fila de gráficas -->
            <v-row class="mt-4">
              <!-- Gráfica de Barras por Puesto -->
              <v-col cols="12" lg="6">
                <v-card dark color="#2d2d2d">
                  <v-card-title>
                    <v-icon left color="orange">mdi-chart-bar</v-icon>
                    Calificaciones por Puesto
                  </v-card-title>
                  <v-card-text>
                    <div class="chart-container" style="height: 350px;">
                      <canvas ref="barChartRef" id="barChart"></canvas>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <!-- Tabla de Detalles -->
              <v-col cols="12" lg="6">
                <v-card dark color="#2d2d2d">
                  <v-card-title>
                    <v-icon left color="purple">mdi-table</v-icon>
                    Detalles de Evaluaciones
                  </v-card-title>
                  <v-card-text class="pa-0">
                    <v-data-table
                      :headers="tableHeaders"
                      :items="filteredData"
                      :items-per-page="5"
                      class="transparent"
                      :loading="loading"
                      loading-text="Cargando datos..."
                      density="compact"
                    >
                      <!-- Template para calificación -->
                      <template #item.promedio="{ item }">
                        <v-chip
                          :color="getScoreColor(item.promedio)"
                          size="small"
                          variant="flat"
                        >
                          {{ item.promedio }}
                        </v-chip>
                      </template>
                      
                      <!-- Template para mes -->
                      <template #item.mes="{ item }">
                        {{ getMonthName(item.mes) }} {{ item.año }}
                      </template>

                      <template #item.actions="{ item }">
                        <v-btn
                          color="primary"
                          variant="text"
                          size="small"
                          class="text-none"
                          @click="openDetailDialog(item)"
                        >
                          <v-icon start>mdi-eye-outline</v-icon>
                          Ver detalle
                        </v-btn>
                      </template>
                    </v-data-table>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top right"
    >
      {{ snackbarMessage }}
      <template #actions>
        <v-btn
          color="white"
          variant="text"
          @click="showSnackbar = false"
        >
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>

    <v-dialog
      v-model="detailDialog"
      max-width="1180"
      class="report-detail-dialog"
    >
      <v-card
        color="#222222"
        class="report-detail-card"
      >
        <v-card-title class="d-flex align-center justify-space-between py-4">
          <div class="d-flex align-center ga-3">
            <v-avatar
              size="42"
              color="primary"
              variant="tonal"
            >
              <v-icon>mdi-account-search-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold text-white">Detalle de evaluación</div>
              <div class="text-caption text-grey-lighten-1">
                {{ selectedDetail?.empleado_nombre || 'Sin empleado' }}
              </div>
            </div>
          </div>
          <v-btn
            icon
            variant="text"
            @click="detailDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <div v-if="detailLoading" class="py-8">
            <v-skeleton-loader
              type="heading, paragraph, article, table"
              color="transparent"
            />
          </div>

          <div v-else class="detail-content">
            <div class="detail-hero">
              <div class="detail-hero__main">
                <div class="detail-label">Periodo evaluado</div>
                <div class="detail-hero__title">{{ detailPeriod }}</div>
                <div class="detail-hero__meta">
                  <v-chip size="small" color="white" variant="tonal">
                    Capturada el {{ detailCaptureDate }}
                  </v-chip>
                  <v-chip size="small" color="primary" variant="tonal">
                    Evaluación #{{ detailEvaluacionId }}
                  </v-chip>
                </div>
              </div>

              <div class="detail-score-card">
                <div class="detail-score-card__label">Resultado final</div>
                <div class="detail-score-card__value">{{ detailAverage }}</div>
                <div class="detail-score-card__meta">{{ detailPercentage }} de cumplimiento</div>
                <v-chip
                  :color="getScoreColor(detailAverageNumber)"
                  size="small"
                  variant="flat"
                  class="font-weight-bold"
                >
                  Calificación final
                </v-chip>
              </div>
            </div>

            <div class="detail-body-grid">
              <div class="detail-section">
                <div class="detail-section__title">Información general</div>
                <div class="detail-info-grid">
                  <div class="detail-block">
                    <div class="detail-label">Empleado</div>
                    <div class="detail-value">{{ detailEmpleadoNombre }}</div>
                  </div>
                  <div class="detail-block">
                    <div class="detail-label">Puesto</div>
                    <div class="detail-value">{{ detailPuestoNombre }}</div>
                  </div>
                  <div class="detail-block">
                    <div class="detail-label">Estación</div>
                    <div class="detail-value">{{ detailEstacionNombre }}</div>
                  </div>
                  <div class="detail-block">
                    <div class="detail-label">Evaluaciones registradas</div>
                    <div class="detail-value">{{ selectedDetail?.total_evaluaciones ?? 0 }}</div>
                    <div class="detail-meta">Ligadas al periodo mostrado</div>
                  </div>
                </div>

                <div class="detail-section detail-section--compact">
                  <div class="detail-section__title">Indicadores</div>
                  <div class="detail-metrics-grid">
                    <div class="detail-block detail-block--metric">
                      <div class="detail-label">Porcentaje final</div>
                      <div class="detail-value">{{ detailPercentage }}</div>
                      <div class="detail-meta">Resultado global</div>
                    </div>
                    <div class="detail-block detail-block--metric">
                      <div class="detail-label">Faltas</div>
                      <div class="detail-value">{{ detailFaltas }}</div>
                      <div class="detail-meta">Registradas en la evaluación</div>
                    </div>
                    <div class="detail-block detail-block--metric">
                      <div class="detail-label">Incapacidad</div>
                      <div class="detail-value">{{ detailIncapacidad }}</div>
                      <div class="detail-meta">Días reportados</div>
                    </div>
                  </div>
                </div>

                <div class="detail-section detail-section--compact">
                  <div class="detail-section__title">Comentario</div>
                  <div class="detail-block comment-block">
                    <div class="detail-comment">{{ detailComentario }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="detail-section__title">Desglose por aspecto</div>
                <div class="detail-block detail-block--aspects">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="detail-meta detail-meta--header">Aspectos evaluados</div>
                    <v-chip size="small" color="primary" variant="tonal">
                      {{ detailDetalles.length }} aspectos
                    </v-chip>
                  </div>

                  <div v-if="detailDetalles.length === 0" class="detail-empty">
                    No hay desglose disponible para esta evaluación.
                  </div>

                  <div v-else class="detail-aspects">
                    <div
                      v-for="detalle in detailDetalles"
                      :key="`${detalle.aspecto_id}-${detalle.aspecto_nombre}`"
                      class="detail-aspect-row"
                    >
                      <div>
                        <div class="detail-aspect-name">{{ detalle.aspecto_nombre }}</div>
                        <div class="detail-aspect-meta">Peso {{ formatDetailNumber(detalle.peso) }}</div>
                      </div>
                      <div class="detail-aspect-metrics">
                        <v-chip size="small" color="info" variant="tonal">
                          Calif. {{ formatDetailNumber(detalle.calificacion) }}
                        </v-chip>
                        <v-chip size="small" color="secondary" variant="tonal">
                          Pond. {{ formatDetailNumber(detalle.ponderado) }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider />

        <v-card-actions class="px-6 py-4 justify-end">
          <v-btn
            color="primary"
            variant="flat"
            class="text-none"
            prepend-icon="mdi-download"
            :loading="detailExporting"
            :disabled="detailLoading || !selectedDetail"
            @click="downloadDetailPdf"
          >
            Descargar evaluación
          </v-btn>
          <v-btn
            variant="text"
            @click="detailDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import LoadingWave from '@/components/LoadingWave.vue'
import { evaluacionService, stationService, puestoService, reporteService } from '@/services/apiService.js'

// Registrar Chart.js
Chart.register(...registerables)

// ===== REACTIVE DATA =====
const isInitialLoading = ref(true)
const loadingMessage = ref('Inicializando...')
const loadingProgress = ref(0)
const loading = ref(false)
const exporting = ref(false)

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const detailDialog = ref(false)
const selectedDetail = ref(null)
const detailLoading = ref(false)
const detailData = ref(null)
const detailExporting = ref(false)

// Filtros
const selectedYear = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const selectedEstacion = ref(null)
const selectedPuesto = ref(null)

// Datos
const estaciones = ref([])
const puestos = ref([])
const reportData = ref([])
const estadisticas = ref({
  promedioGeneral: '0.0',
  totalEvaluaciones: 0,
  estacionesActivas: 0,
  puestosEvaluados: 0
})

// Referencias de gráficas
const lineChartRef = ref(null)
const doughnutChartRef = ref(null)
const barChartRef = ref(null)

// Instancias de gráficas
let lineChart = null
let doughnutChart = null
let barChart = null

// Estados de carga
const dataLoadingStates = ref({
  estaciones: false,
  puestos: false,
  reportes: false
})

// ===== COMPUTED PROPERTIES =====
const yearOptions = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i)
  }
  return years
})

const monthOptions = computed(() => [
  { text: 'Enero', value: 1 },
  { text: 'Febrero', value: 2 },
  { text: 'Marzo', value: 3 },
  { text: 'Abril', value: 4 },
  { text: 'Mayo', value: 5 },
  { text: 'Junio', value: 6 },
  { text: 'Julio', value: 7 },
  { text: 'Agosto', value: 8 },
  { text: 'Septiembre', value: 9 },
  { text: 'Octubre', value: 10 },
  { text: 'Noviembre', value: 11 },
  { text: 'Diciembre', value: 12 }
])

// Aplicar filtros seleccionados al dataset
const matchesFilters = (item) => {
  const itemYear = Number(item.año ?? item.anio)
  const itemMonth = Number(item.mes)

  if (selectedYear.value && itemYear !== Number(selectedYear.value)) return false
  if (selectedMonth.value && itemMonth !== Number(selectedMonth.value)) return false
  if (selectedEstacion.value && item.estacion_id !== Number(selectedEstacion.value)) return false
  if (selectedPuesto.value && item.puesto_id !== Number(selectedPuesto.value)) return false

  return true
}

const filteredData = computed(() => reportData.value.filter(matchesFilters))

const estacionOptions = computed(() => {
  return estaciones.value
    .filter(estacion => estacion.nombre !== 'TODAS')
    .map(estacion => ({ text: estacion.nombre, value: estacion.id }))
})

const puestoOptions = computed(() => {
  const options = [{ text: 'Todos los puestos', value: null }]
  puestos.value.forEach(puesto => {
    options.push({ text: puesto.nombre, value: puesto.id })
  })
  return options
})

// Headers de la tabla
const tableHeaders = [
  { title: 'Mes', key: 'mes', sortable: true },
  { title: 'Empleado', key: 'empleado_nombre', sortable: true },
  { title: 'Estación', key: 'estacion_nombre', sortable: true },
  { title: 'Puesto', key: 'puesto_nombre', sortable: true },
  { title: 'Promedio', key: 'promedio', sortable: true },
  { title: 'Evaluaciones', key: 'total_evaluaciones', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'end' }
]

// ===== METHODS =====
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

const showMessage = (message, color = 'success') => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

const getScoreColor = (score) => {
  if (score >= 4) return 'success'
  if (score >= 3) return 'warning'
  return 'error'
}

const getMonthName = (month) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]
  return months[month - 1] || 'Desconocido'
}

const formatCaptureDate = (value) => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatDetailNumber = (value) => {
  const num = Number(value ?? 0)
  return num.toFixed(2)
}

const sanitizeFileNamePart = (value) => {
  return String(value || 'sin-dato')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const openDetailDialog = async (item) => {
  selectedDetail.value = item
  detailDialog.value = true
  detailLoading.value = true
  detailData.value = null

  const payload = {
    empleado_id: item.empleado_id,
    mes: item.mes,
    anio: item.año ?? item.anio
  }

  const result = await reporteService.getDetalleEvaluacionIndividual(payload)
  if (result.success) {
    detailData.value = result.data
  } else {
    showMessage(result.message || 'No se pudo cargar el detalle individual', 'warning')
  }

  detailLoading.value = false
}

const detailPeriod = computed(() => {
  if (!selectedDetail.value) return 'Sin periodo'
  const month = Number(detailData.value?.evaluacion?.mes ?? selectedDetail.value.mes)
  const year = Number(detailData.value?.evaluacion?.anio ?? selectedDetail.value.año ?? selectedDetail.value.anio)
  return `${getMonthName(month)} ${year || ''}`.trim()
})

const detailCaptureDate = computed(() => formatCaptureDate(detailData.value?.evaluacion?.fecha_evaluacion ?? selectedDetail.value?.fecha_evaluacion))

const detailAverageNumber = computed(() => Number(detailData.value?.evaluacion?.calificacion_final ?? selectedDetail.value?.promedio ?? 0))

const detailAverage = computed(() => {
  const value = detailAverageNumber.value
  return value.toFixed(2)
})

const detailPercentage = computed(() => `${formatDetailNumber(detailData.value?.evaluacion?.porcentaje_final ?? 0)}%`)
const detailComentario = computed(() => detailData.value?.evaluacion?.comentario || 'Sin comentario registrado')
const detailFaltas = computed(() => detailData.value?.evaluacion?.faltas ?? 0)
const detailIncapacidad = computed(() => detailData.value?.evaluacion?.incapacidad ?? 0)
const detailDetalles = computed(() => Array.isArray(detailData.value?.detalles) ? detailData.value.detalles : [])

const detailEmpleadoNombre = computed(() => detailData.value?.empleado?.nombre || selectedDetail.value?.empleado_nombre || 'Sin nombre')
const detailEmpleadoId = computed(() => detailData.value?.empleado?.id ?? selectedDetail.value?.empleado_id ?? 'N/D')
const detailPuestoNombre = computed(() => detailData.value?.empleado?.puesto_nombre || selectedDetail.value?.puesto_nombre || 'Sin puesto')
const detailPuestoId = computed(() => detailData.value?.empleado?.puesto_id ?? selectedDetail.value?.puesto_id ?? 'N/D')
const detailEstacionNombre = computed(() => detailData.value?.empleado?.estacion_nombre || selectedDetail.value?.estacion_nombre || 'Sin estación')
const detailEstacionId = computed(() => detailData.value?.empleado?.estacion_id ?? selectedDetail.value?.estacion_id ?? 'N/D')
const detailEvaluacionId = computed(() => detailData.value?.evaluacion?.id ?? selectedDetail.value?.id ?? 'N/D')

const downloadDetailPdf = async () => {
  if (!selectedDetail.value) return

  detailExporting.value = true
  try {
    if (!detailData.value) {
      const result = await reporteService.getDetalleEvaluacionIndividual({
        empleado_id: selectedDetail.value.empleado_id,
        mes: selectedDetail.value.mes,
        anio: selectedDetail.value.año ?? selectedDetail.value.anio
      })

      if (result.success) {
        detailData.value = result.data
      } else {
        showMessage(result.message || 'No se pudo cargar el detalle para exportar', 'warning')
        return
      }
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const primaryColor = [46, 125, 50]
    const textColor = [33, 33, 33]
    const subtleColor = [97, 97, 97]

    doc.setFillColor(...primaryColor)
    doc.rect(0, 0, 210, 24, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.setTextColor(255, 255, 255)
    doc.text('Evaluacion Individual', 14, 15)

    doc.setTextColor(...textColor)
    doc.setFontSize(12)
    doc.text(`Empleado: ${detailEmpleadoNombre.value}`, 14, 36)
    doc.setFontSize(10)
    doc.setTextColor(...subtleColor)
    doc.text(`Periodo evaluado: ${detailPeriod.value}`, 14, 43)
    doc.text(`Fecha de captura: ${detailCaptureDate.value}`, 14, 49)

    doc.setTextColor(...textColor)
    doc.setFontSize(10)
    doc.text(`Puesto: ${detailPuestoNombre.value}`, 14, 60)
    doc.text(`Estacion: ${detailEstacionNombre.value}`, 105, 60)
    doc.text(`Calificacion final: ${detailAverage.value}`, 14, 66)
    doc.text(`Porcentaje final: ${detailPercentage.value}`, 105, 66)
    doc.text(`Faltas: ${detailFaltas.value}`, 14, 72)
    doc.text(`Incapacidad: ${detailIncapacidad.value}`, 105, 72)

    doc.setFont('helvetica', 'bold')
    doc.text('Comentario', 14, 84)
    doc.setFont('helvetica', 'normal')
    const comentario = doc.splitTextToSize(detailComentario.value, 180)
    doc.text(comentario, 14, 90)

    const commentHeight = Math.max(12, comentario.length * 5)
    const tableStartY = 92 + commentHeight

    autoTable(doc, {
      startY: tableStartY,
      head: [['Aspecto', 'Peso', 'Calificacion', 'Ponderado']],
      body: detailDetalles.value.map((detalle) => ([
        detalle.aspecto_nombre || 'Sin aspecto',
        formatDetailNumber(detalle.peso),
        formatDetailNumber(detalle.calificacion),
        formatDetailNumber(detalle.ponderado)
      ])),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 2.5
      },
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: { left: 14, right: 14 }
    })

    const finalY = doc.lastAutoTable?.finalY || tableStartY + 20
    doc.setFontSize(8)
    doc.setTextColor(...subtleColor)
    doc.text('Generado desde EVA - Reportes de evaluacion', 14, finalY + 12)

    const fileName = `evaluacion_${sanitizeFileNamePart(detailEmpleadoNombre.value)}_${sanitizeFileNamePart(detailPeriod.value)}.pdf`
    doc.save(fileName)
    showMessage('PDF descargado correctamente', 'success')
  } catch (error) {
    console.error('Error al descargar evaluacion individual:', error)
    showMessage('Error al generar el PDF de la evaluacion', 'error')
  } finally {
    detailExporting.value = false
  }
}

// Cargar datos iniciales
const loadEstaciones = async () => {
  try {
    loadingMessage.value = 'Cargando estaciones...'
    const result = await stationService.getEstaciones()
    
    if (result.success) {
      estaciones.value = result.data
      const storedId = Number(sessionStorage.getItem('estacion_id'))
      const ids = estaciones.value.filter(e => e.nombre !== 'TODAS').map(e => e.id)
      if (storedId && ids.includes(storedId)) {
        selectedEstacion.value = storedId
      } else {
        selectedEstacion.value = ids[0] ?? null
      }
    } else {
      showMessage('Error al cargar estaciones', 'error')
    }
    
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  } catch (error) {
    console.error('Error al cargar estaciones:', error)
    showMessage('Error al conectar con el servidor', 'error')
    dataLoadingStates.value.estaciones = true
    updateLoadingProgress()
  }
}

const loadPuestos = async () => {
  try {
    loadingMessage.value = 'Cargando puestos...'
    const result = await puestoService.getPuestos()
    
    if (result.success) {
      puestos.value = result.puestos || []
    } else {
      showMessage('Error al cargar puestos', 'error')
    }
    
    dataLoadingStates.value.puestos = true
    updateLoadingProgress()
  } catch (error) {
    console.error('Error al cargar puestos:', error)
    showMessage('Error al conectar con el servidor', 'error')
    dataLoadingStates.value.puestos = true
    updateLoadingProgress()
  }
}

// Función para cargar datos de reportes (simulada por ahora)
const loadReportData = async () => {
  try {
    loading.value = true
    loadingMessage.value = 'Cargando datos de reportes...'
    
    // Preparar filtros basados en las selecciones del usuario
    const filtros = {}
    if (selectedYear.value) filtros.año = selectedYear.value
    if (selectedMonth.value) filtros.mes = selectedMonth.value
    if (selectedEstacion.value) filtros.estacion_id = selectedEstacion.value
    if (selectedPuesto.value) filtros.puesto_id = selectedPuesto.value
    
    // Llamar al servicio de reportes
    const result = await reporteService.getReportesEstaciones(filtros)
    
    if (result.success) {
      reportData.value = result.data
      
      // Calcular estadísticas
      calculateStatistics()
      
      // Actualizar gráficas
      await nextTick()
      updateCharts()
      
      if (!isInitialLoading.value) {
        showMessage('Datos de reportes cargados correctamente', 'success')
      }
    } else {
      console.error('Error al cargar reportes:', result.message)
      showMessage(result.message || 'Error al cargar datos de reportes', 'error')
      reportData.value = [] // Limpiar datos en caso de error
    }
    
    dataLoadingStates.value.reportes = true
    updateLoadingProgress()
    
  } catch (error) {
    console.error('Error al cargar reportes:', error)
    showMessage('Error al conectar con el servidor', 'error')
    reportData.value = [] // Limpiar datos en caso de error
    dataLoadingStates.value.reportes = true
    updateLoadingProgress()
  } finally {
    loading.value = false
  }
}


// Calcular estadísticas
const calculateStatistics = () => {
  const data = filteredData.value
  if (data.length === 0) {
    estadisticas.value = {
      promedioGeneral: '0.0',
      totalEvaluaciones: 0,
      estacionesActivas: 0,
      puestosEvaluados: 0
    }
    return
  }
  const totalPromedio = data.reduce((sum, item) => sum + parseFloat(item.promedio), 0)
  const totalEvaluaciones = data.reduce((sum, item) => sum + (item.total_evaluaciones || 0), 0)
  const estacionesUnicas = new Set(data.map(item => item.estacion_id))
  const puestosUnicos = new Set(data.map(item => item.puesto_id))
  estadisticas.value = {
    promedioGeneral: (totalPromedio / data.length).toFixed(1),
    totalEvaluaciones,
    estacionesActivas: estacionesUnicas.size,
    puestosEvaluados: puestosUnicos.size
  }
}

// Actualizar gráficas - MEJORADA
const updateCharts = () => {
  try {
    console.log('Actualizando gráficas con datos:', reportData.value)
    updateLineChart()
    updateBarChart()
  } catch (error) {
    console.error('Error al actualizar gráficas:', error)
    showMessage('Error al actualizar gráficas', 'error')
  }
}

// Gráfica de línea (tendencia mensual) - MEJORADA
const updateLineChart = () => {
  const ctx = document.getElementById('lineChart')
  if (!ctx) return

  if (lineChart) {
    lineChart.destroy()
  }

  const dataSrc = filteredData.value
  if (!dataSrc || dataSrc.length === 0) {
    console.log('No hay datos para mostrar en el gráfico de barras')
    return
  }

  // Si hay un mes seleccionado, mostrar calificaciones individuales por empleado
  if (selectedMonth.value) {
    console.log('=== DEBUG: Datos completos ===', reportData.value)
    
    const monthData = dataSrc

    console.log('=== DEBUG: Datos del mes seleccionado ===', monthData)

    if (monthData.length === 0) {
      console.log('No hay datos para el mes seleccionado')
      return
    }

    // Agrupar por empleado y calcular promedio de calificaciones
  const empleadoData = {}
  monthData.forEach(item => {
    const empleado = item.empleado_nombre || 'Sin nombre'
    const calificacion = parseFloat(item.promedio) || 0
    
    console.log('=== DEBUG: Procesando empleado ===', {
      empleado,
      calificacion_original: item.promedio,
      calificacion_parseada: calificacion
    })
    
    if (!empleadoData[empleado]) {
      empleadoData[empleado] = {
        calificaciones: [],
        estacion: item.estacion_nombre || 'Sin estación',
        puesto: item.puesto_nombre || 'Sin puesto'
      }
    }
    empleadoData[empleado].calificaciones.push(calificacion)
    })

    console.log('=== DEBUG: Datos agrupados por empleado ===', empleadoData)

    // Calcular promedio por empleado
    const labels = []
    const data = []
    const backgroundColors = []
    const borderColors = []
    
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
      '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
      '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ]

    Object.entries(empleadoData).forEach(([empleado, info], index) => {
      const promedio = info.calificaciones.reduce((sum, cal) => sum + cal, 0) / info.calificaciones.length
      console.log('=== DEBUG: Calculando promedio ===', {
        empleado,
        calificaciones: info.calificaciones,
        promedio
      })
      
      labels.push(empleado)
      data.push(promedio)  // Mantener como número
      backgroundColors.push(colors[index % colors.length] + '80')
      borderColors.push(colors[index % colors.length])
    })

    console.log('=== DEBUG: Datos finales para el gráfico ===', {
      labels,
      data,
      backgroundColors,
      borderColors
    })

    lineChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: `Calificaciones Individuales - ${getMonthName(selectedMonth.value)}`,
          data: data,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
          barThickness: 40,  // Agregar grosor específico
          maxBarThickness: 60  // Máximo grosor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            },
            position: 'top'
          },
          tooltip: {
            callbacks: {
              title: function(context) {
                return `Empleado: ${context[0].label}`
              },
              label: function(context) {
                const empleado = context.label
                const info = empleadoData[empleado]
                return [
                  `Calificación Promedio: ${context.parsed.y.toFixed(2)}%`,
                  `Estación: ${info.estacion}`,
                  `Puesto: ${info.puesto}`,
                  `Evaluaciones: ${info.calificaciones.length}`
                ]
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff',
              maxRotation: 45
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return value + '%'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    })
    
    console.log('=== DEBUG: Gráfico creado ===', lineChart)
  } else {
    // Mostrar tendencia general por mes (gráfico de líneas)
    const monthlyData = {}
    
    dataSrc.forEach(item => {
      if (!item.año || !item.mes) return
      
      const date = new Date(item.año, item.mes - 1)
      const monthKey = `${date.getFullYear()}-${String(date.getDate()).padStart(2, '0')}`
      const monthName = getMonthName(date.getMonth() + 1)
      const calificacion = parseFloat(item.promedio) || 0
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          name: monthName,
          calificaciones: [],
          year: date.getFullYear()
        }
      }
      monthlyData[monthKey].calificaciones.push(calificacion)
    })

    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        label: `${data.name} ${data.year}`,
        promedio: data.calificaciones.reduce((sum, cal) => sum + cal, 0) / data.calificaciones.length
      }))

    if (sortedMonths.length === 0) {
      console.log('No hay datos mensuales para mostrar')
      return
    }

    lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedMonths.map(month => month.label),
        datasets: [{
          label: 'Tendencia General de Calificaciones',
          data: sortedMonths.map(month => month.promedio.toFixed(2)),
          borderColor: '#36A2EB',
          backgroundColor: '#36A2EB20',
          tension: 0.4,
          fill: true,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#36A2EB',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            },
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `Calificación Promedio: ${context.parsed.y}%`
              }
            }
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#ffffff',
              maxRotation: 45
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return value + '%'
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        }
      }
    })
  }
}

// Gráfico de barras horizontal (por estación) - MEJORADO
const updateDoughnutChart = () => {
  if (doughnutChart) {
    doughnutChart.destroy()
  }

  const ctx = doughnutChartRef.value?.getContext('2d')
  if (!ctx) return

  const dataSrc = filteredData.value
  if (!dataSrc || dataSrc.length === 0) {
    console.log('No hay datos para la gráfica por estación')
    return
  }

  const stationAgg = {}
  dataSrc.forEach(item => {
    const name = String(item.estacion_nombre || 'Sin estación')
    const val = parseFloat(item.promedio)
    if (Number.isFinite(val)) {
      if (!stationAgg[name]) stationAgg[name] = { sum: 0, count: 0 }
      stationAgg[name].sum += val
      stationAgg[name].count += 1
    }
  })

  const entries = Object.entries(stationAgg).map(([name, { sum, count }]) => ({
    name,
    promedio: parseFloat((sum / count).toFixed(2)),
    evaluaciones: count
  }))

  if (entries.length === 0) {
    console.log('No hay datos válidos para procesar')
    return
  }

  entries.sort((a, b) => b.promedio - a.promedio)
  const top = entries.slice(0, 10)
  const labels = top.map(e => e.name)
  const data = top.map(e => e.promedio)

  doughnutChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Promedio por Estación',
        data,
        backgroundColor: '#4CAF50',
        borderColor: '#2E7D32',
        borderWidth: 1
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const entry = top[context.dataIndex]
              return [
                `Promedio: ${context.parsed.x.toFixed(2)}`,
                `Evaluaciones: ${entry.evaluaciones}`
              ]
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 5,
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

// Gráfica de barras (por puesto) - MEJORADA
const updateBarChart = () => {
  if (barChart) {
    barChart.destroy()
  }
  
  const ctx = barChartRef.value?.getContext('2d')
  if (!ctx) return
  
  const dataSrc = filteredData.value
  if (!dataSrc || dataSrc.length === 0) {
    console.log('No hay datos para la gráfica de barras')
    return
  }

  const puestoData = {}
  dataSrc.forEach(item => {
    // Validar que el item tiene los campos necesarios
    if (item.puesto_nombre && item.promedio !== undefined && item.promedio !== null) {
      const puestoNombre = item.puesto_nombre.toString()
      if (!puestoData[puestoNombre]) {
        puestoData[puestoNombre] = []
      }
      const promedio = parseFloat(item.promedio)
      if (!isNaN(promedio)) {
        puestoData[puestoNombre].push(promedio)
      }
    }
  })
  
  // Verificar que tenemos datos procesados
  if (Object.keys(puestoData).length === 0) {
    console.log('No hay datos válidos para procesar en la gráfica de barras')
    return
  }

  const labels = Object.keys(puestoData)
  const data = Object.values(puestoData).map(values => 
    parseFloat((values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1))
  )
  
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Promedio por Puesto',
        data,
        backgroundColor: '#FF9800',
        borderColor: '#F57C00',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#ffffff'
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: '#ffffff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
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
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      }
    }
  })
}

// Exportar datos
const exportData = async () => {
  exporting.value = true
  try {
    if (!selectedMonth.value) {
      showMessage('Selecciona un mes para exportar Calificaciones Individuales', 'warning')
      return
    }

    const src = filteredData.value
    if (!Array.isArray(src) || src.length === 0) {
      showMessage('No hay datos para exportar con los filtros actuales', 'warning')
      return
    }

    const agg = {}
    for (const item of src) {
      const empleado = item.empleado_nombre || 'Sin nombre'
      const val = parseFloat(item.promedio)
      if (!Number.isFinite(val)) continue
      if (!agg[empleado]) {
        agg[empleado] = {
          sum: 0,
          count: 0,
          estacion: item.estacion_nombre || '',
          puesto: item.puesto_nombre || ''
        }
      }
      agg[empleado].sum += val
      agg[empleado].count += 1
    }

    const rows = Object.entries(agg)
      .map(([empleado, info]) => {
        const promedio = info.count ? (info.sum / info.count) : 0
        return {
          año: Number(selectedYear.value) || '',
          mes: getMonthName(Number(selectedMonth.value)),
          empleado,
          promedio: promedio.toFixed(2),
          evaluaciones: info.count,
          estacion: info.estacion,
          puesto: info.puesto
        }
      })
      .sort((a, b) => String(a.empleado).localeCompare(String(b.empleado)))

    if (rows.length === 0) {
      showMessage('No hay calificaciones individuales válidas para exportar', 'warning')
      return
    }

    const escapeCsv = (value) => {
      if (value === null || value === undefined) return ''
      const s = String(value)
      if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
      return s
    }

    const header = ['Año', 'Mes', 'Empleado', 'Promedio (%)', 'Evaluaciones', 'Estación', 'Puesto']
    const lines = [header.join(',')]
    for (const r of rows) {
      lines.push([
        r.año,
        r.mes,
        r.empleado,
        r.promedio,
        r.evaluaciones,
        r.estacion,
        r.puesto
      ].map(escapeCsv).join(','))
    }

    const csv = '\ufeff' + lines.join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const filename = `calificaciones_individuales_${Number(selectedYear.value) || ''}_${String(selectedMonth.value).padStart(2, '0')}.csv`
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)

    showMessage('CSV exportado correctamente', 'success')
  } catch (error) {
    console.error('Error al exportar:', error)
    showMessage('Error al exportar CSV', 'error')
  } finally {
    exporting.value = false
  }
}

// Inicialización
const initializeData = async () => {
  loadingMessage.value = 'Inicializando sistema de reportes...'
  loadingProgress.value = 0
  
  try {
    await loadEstaciones()
    await Promise.allSettled([
      loadPuestos()
    ])
    await loadReportData()
  } catch (error) {
    console.error('Error al inicializar datos:', error)
    showMessage('Error al cargar datos del sistema', 'error')
    isInitialLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.fade-in {
  animation: fadeIn 0.5s ease-in;
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

.chart-container {
  position: relative;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}

.transparent {
  background: transparent !important;
}

.transparent >>> .v-data-table__wrapper {
  background: transparent;
}

.transparent >>> .v-data-table-header {
  background: transparent;
}

.transparent >>> .v-data-table-rows-no-data {
  background: transparent;
}

.report-detail-card {
  background:
    linear-gradient(180deg, #252525, #181818) !important;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 26px 80px rgba(0, 0, 0, 0.48);
}

.report-detail-dialog :deep(.v-overlay__scrim) {
  background: rgba(0, 0, 0, 0.7);
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.detail-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px;
  gap: 14px;
  align-items: stretch;
}

.detail-hero__main,
.detail-score-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-hero__main {
  background: linear-gradient(135deg, rgba(46, 125, 50, 0.16), rgba(255, 255, 255, 0.03));
}

.detail-hero__title {
  font-size: 1.6rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
}

.detail-hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.detail-score-card {
  background: linear-gradient(180deg, rgba(76, 175, 80, 0.18), rgba(255, 255, 255, 0.03));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 6px;
}

.detail-score-card__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.68);
}

.detail-score-card__value {
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1;
  color: #ffffff;
}

.detail-score-card__meta {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.74);
}

.detail-section__title {
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(255, 255, 255, 0.58);
  margin-bottom: 6px;
}

.detail-section--compact {
  margin-top: 14px;
}

.detail-body-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr);
  gap: 16px;
  align-items: start;
}

.detail-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.detail-metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.detail-block {
  height: 100%;
  padding: 14px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(43, 43, 43, 0.98), rgba(31, 31, 31, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.detail-block--metric {
  min-height: 104px;
}

.detail-block--aspects {
  min-height: 100%;
}

.detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.62);
  margin-bottom: 6px;
}

.detail-value {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffffff;
}

.detail-meta {
  margin-top: 6px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.85rem;
}

.detail-meta--header {
  margin-top: 0;
}

.comment-block {
  min-height: 100%;
  height: 100%;
}

.detail-comment {
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.6;
  white-space: pre-wrap;
  font-size: 0.96rem;
}

.detail-empty {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.92rem;
  padding: 12px 0 4px;
}

.detail-aspects {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.detail-aspect-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.detail-aspect-name {
  font-weight: 700;
  color: #ffffff;
}

.detail-aspect-meta {
  margin-top: 4px;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.62);
}

.detail-aspect-metrics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .detail-hero {
    grid-template-columns: 1fr;
  }

  .detail-body-grid,
  .detail-info-grid,
  .detail-metrics-grid {
    grid-template-columns: 1fr;
  }

  .detail-aspects {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .detail-hero__title {
    font-size: 1.35rem;
  }

  .detail-score-card__value {
    font-size: 1.7rem;
  }

  .detail-aspect-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-aspect-metrics {
    justify-content: flex-start;
  }
}
</style>
