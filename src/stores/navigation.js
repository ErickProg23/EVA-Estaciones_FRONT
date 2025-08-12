import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  // Estado reactivo
  const drawer = ref(true)
  const rail = ref(false)
  const currentModule = ref('dashboard')
  const expandedGroups = ref(['administration']) // Grupos expandidos por defecto
  
  // Estructura jerárquica del menú
  const menuItems = ref([
    {
      title: 'Dashboard',
      icon: 'mdi-view-dashboard',
      value: 'dashboard',
      route: '/dashboard',
      type: 'item'
    },
    {
      title: 'Evaluación',
      icon: 'mdi-account-group',
      value: 'evaluation',
      route: '/evaluation/new',
      type: 'item'
    },
    {
      title: 'Administración',
      icon: 'mdi-cog',
      value: 'administration',
      type: 'group',
      children: [
        {
          title: 'Usuarios',
          icon: 'mdi-account-group',
          value: 'users',
          route: '/administration/users',
          type: 'item'
        },
        {
          title: 'Estaciones',
          icon: 'mdi-gas-station',
          value: 'stations',
          route: '/administration/stations',
          type: 'item'
        },
        {
          title: 'Personal',
          icon: 'mdi-account',
          value: 'personal',
          route: '/administration/personal',
          type: 'item'
        },
        {
          title: 'Puesto',
          icon: 'mdi-account-supervisor',
          value: 'puesto',
          route: '/administration/puesto',
          type: 'item'
        },
        {
          title: 'Asepectos',
          icon: 'mdi-format-list-bulleted',
          value: 'aspecto',
          route: '/administration/aspecto',
          type: 'item'
        }
      ]
    },
  ])
  
  // Acciones
  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }
  
  const toggleRail = () => {
    rail.value = !rail.value
  }
  
  const setCurrentModule = (module) => {
    currentModule.value = module
  }
  
  const toggleGroup = (groupValue) => {
    const index = expandedGroups.value.indexOf(groupValue)
    if (index > -1) {
      expandedGroups.value.splice(index, 1)
    } else {
      expandedGroups.value.push(groupValue)
    }
  }
  
  const isGroupExpanded = (groupValue) => {
    return expandedGroups.value.includes(groupValue)
  }
  
  // Getters
  const getCurrentModuleInfo = () => {
    // Buscar en items principales
    let item = menuItems.value.find(item => item.value === currentModule.value)
    
    // Si no se encuentra, buscar en children
    if (!item) {
      for (const menuItem of menuItems.value) {
        if (menuItem.children) {
          item = menuItem.children.find(child => child.value === currentModule.value)
          if (item) break
        }
      }
    }
    
    return item || { title: 'Dashboard', icon: 'mdi-view-dashboard' }
  }
  
  return {
    // Estado
    drawer,
    rail,
    currentModule,
    expandedGroups,
    menuItems,
    
    // Acciones
    toggleDrawer,
    toggleRail,
    setCurrentModule,
    toggleGroup,
    isGroupExpanded,
    getCurrentModuleInfo
  }
})