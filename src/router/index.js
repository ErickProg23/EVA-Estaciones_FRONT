import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import StationsView from '../views/StationsView.vue'
import PersonalView from '../views/PersonalView.vue'
import PuestoView from '../views/PuestoView.vue'
import AspectoView from '../views/AspectoView.vue'
import EvaluationView from '@/views/EvaluationView.vue'
import PesosPuestoView from '@/views/PesosPuestoView.vue'
import TicketsView from '@/views/TicketsView.vue'
import ReportsStationsView from '@/views/ReportsStationsView.vue'
import EvaluacionProcesoView from '@/views/EvaluacionProcesoView.vue'
import SubirManualView from '@/views/SubirManualView.vue'
import ProductosView from '@/views/ProductosView.vue'
import BombasView from '@/views/BombasView.vue'
import LecturasComparativasView from '@/views/LecturasComparativasView.vue'
import SolicitudesView from '@/views/SolicitudesView.vue'
import AdminMaterialView from '@/views/AdminMaterialView.vue'
import InventarioView from '@/views/InventarioView.vue'



const routes = [
  {
    path: '/',
    name: 'login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado'] }
  },
  {
    path: '/reports',
    redirect: '/reports/stations',
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
  },
  {
    path: '/reports/stations',
    name: 'reports-stations',
    component: ReportsStationsView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
  },
  {
    path: '/administration',
    redirect: '/administration/users',
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
  },
  {
    path: '/administration/users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN'] }
  },
  {
    path: '/administration/bombas',
    name: 'bombas',
    component: BombasView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Mantenimiento'] }
  },
  {
    path: '/administration/stations',
    name: 'stations',
    component: StationsView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN'] }
  },
  {
    path: '/administration/personal',
    name: 'personal',
    component: PersonalView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
  },
  {
    path: '/administration/puesto',
    name: 'puesto',
    component: PuestoView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN'] }
  },
  {
    path: '/administration/aspecto',
    name: 'aspecto',
    component: AspectoView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN'] }
  },
  {
    path: '/evaluation/new',
    name: 'evaluationNew',
    component: EvaluationView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado'] }
  },
  {
    path: '/pesos-puesto',
    name: 'PesosPuesto',
    component: PesosPuestoView,
    meta: {
      title: 'Configuración de Pesos por Puesto',
      requiresAuth: true,
      allowedRoles: ['ADMIN', 'Capital humano', 'Encargado']
    }
  },
  {
    path: '/tickets',
    name: 'tickets',
    component: TicketsView,
    meta: {
      requiresAuth: true,
      allowedRoles: ['ADMIN', 'Encargado'],
      title: 'Gestion de tickets'
    }
  },
  {
    path: '/evaluacion/proceso/:puestoNombre',
    name: 'EvaluacionProceso',
    component: EvaluacionProcesoView,
    props: true
  },
  {
    path: '/productos',
    name: 'productos',
    component: ProductosView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado'] }
  },
  {
    path: '/manuales/subir',
    name: 'subirManual',
    component: SubirManualView,
    meta: { requiresAuth: true, allowedRoles: ['Mantenimiento'] }
  },
  {
    path: '/manuales/comparativas',
    name: 'lecturasComparativas',
    component: LecturasComparativasView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado'] }
  },
  {
    path: '/solicitudes',
    name: 'solicitudes',
    component: SolicitudesView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado', 'Administrativo'] }
  },
  {
    path: '/admin/materiales',
    name: 'admin-materiales',
    component: AdminMaterialView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN'] }
  },
  {
    path: '/inventario',
    name: 'inventory',
    component: () => import('@/views/InventarioView.vue'),
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado', 'Administrativo'] }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

const hasRole = (allowedRoles) => {
  const rolId = sessionStorage.getItem('rol_id')
  const roleMap = {
    '1': 'ADMIN',
    '2': 'Capital humano', 
    '3': 'Encargado',
    '4': 'Mantenimiento',
    '5': 'Administrativo'
  }
  const userRole = roleMap[rolId]
  return userRole && allowedRoles.includes(userRole)
}

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true'
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
    return
  }
  
  // Verificar roles si están definidos
  if (to.meta.allowedRoles && !hasRole(to.meta.allowedRoles)) {
    const rolId = sessionStorage.getItem('rol_id')
    const defaultByRole = {
      '2': '/reports/stations',
      '4': '/manuales/subir',
      '5': '/solicitudes'
    }
    next(defaultByRole[rolId] || '/dashboard')
    return
  }
  
  next()
})

export default router