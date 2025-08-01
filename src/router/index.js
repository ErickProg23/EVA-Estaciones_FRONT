import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import UsersView from '../views/UsersView.vue'
import StationsView from '../views/StationsView.vue'
import PersonalView from '../views/PersonalView.vue'
import PuestoView from '../views/PuestoView.vue'

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
    meta: { requiresAuth: true }
  },
  {
    path: '/administration',
    redirect: '/administration/users'
  },
  {
    path: '/administration/users',
    name: 'users',
    component: UsersView,
    meta: { requiresAuth: true }
  },
  {
    path: '/administration/stations',
    name: 'stations',
    component: StationsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/administration/personal',
    name: 'personal',
    component: PersonalView,
    meta: { requiresAuth: true }
  },
  {
    path: '/administration/puesto',
    name: 'puesto',
    component: PuestoView,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = sessionStorage.getItem('isAuthenticated')
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else if (to.name === 'login' && isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router