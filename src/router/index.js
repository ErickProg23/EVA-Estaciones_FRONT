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
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Encargado', 'Capital humano'] }
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
    path: '/administration/stations',
    name: 'stations',
    component: StationsView,
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
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
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano'] }
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
    meta: { requiresAuth: true, allowedRoles: ['ADMIN', 'Capital humano', 'Encargado'] }
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
    '3': 'Encargado'
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
    // Redirigir a dashboard si no tiene permisos
    next('/dashboard')
    return
  }
  
  next()
})

export default router