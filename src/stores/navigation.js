import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  // Estado reactivo
  const drawer = ref(true)
  const rail = ref(false)
  const currentModule = ref('dashboard')
  const expandedGroups = ref(['administration', 'reports']) // Grupos expandidos por defecto

  
  // Estructura jerárquica del menú
  const menuItems = ref([
    {
      title: 'Dashboard',
      icon: 'mdi-view-dashboard',
      value: 'dashboard',
      route: '/dashboard',
      type: 'item',
      allowedRoles: ['ADMIN', 'Encargado', 'Capital humano']
    },
    {
      title: 'Evaluación',
      icon: 'mdi-account-group',
      value: 'evaluation',
      route: '/evaluation/new',
      type: 'item',
      allowedRoles: ['ADMIN', 'Encargado', 'Capital humano']
    },
    {
      title: 'Tickets',
      icon: 'mdi-ticket',
      value: 'tickets',
      route: '/tickets',
      type: 'item',
      allowedRoles: ['ADMIN', 'Encargado']
    },
    {
      title: 'Reportes',
      icon: 'mdi-chart-line',
      value: 'reports',
      type: 'group',
      allowedRoles: ['ADMIN', 'Capital humano'],
      children:[
        {
          title: 'Rendimiento',
          icon: 'mdi-chart-line',
          value: 'reports-stations',
          route: '/reports/stations',
          type: 'item',
          allowedRoles: ['ADMIN', 'Capital humano'],
        },
      ]
    },
    {
      title: 'Administración',
      icon: 'mdi-cog',
      value: 'administration',
      type: 'group',
      allowedRoles: ['ADMIN', 'Capital humano'],
      children: [
        {
          title: 'Usuarios',
          icon: 'mdi-account-group',
          value: 'users',
          route: '/administration/users',
          type: 'item',
          allowedRoles: ['ADMIN']
        },
        {
          title: 'Estaciones',
          icon: 'mdi-gas-station',
          value: 'stations',
          route: '/administration/stations',
          type: 'item',
          allowedRoles: ['ADMIN', 'Capital humano']
        },
        {
          title: 'Personal',
          icon: 'mdi-account',
          value: 'personal',
          route: '/administration/personal',
          type: 'item',
          allowedRoles: ['ADMIN', 'Capital humano']
        },
        {
          title: 'Puesto',
          icon: 'mdi-account-supervisor',
          value: 'puesto',
          route: '/administration/puesto',
          type: 'item',
          allowedRoles: ['ADMIN', 'Capital humano']
        },
        {
          title: 'Aspectos',
          icon: 'mdi-format-list-bulleted',
          value: 'aspecto',
          route: '/administration/aspecto',
          type: 'item',
          allowedRoles: ['ADMIN']
        }
      ]
    },
  ])

  // Función para obtener el rol actual del usuario
  const getCurrentUserRole = () => {
    const rolId = sessionStorage.getItem('rol_id')
    // Mapear rol_id a nombre de rol (ajusta según tu sistema)
    const roleMap = {
      '1': 'ADMIN',
      '2': 'Capital humano', 
      '3': 'Encargado'
    }
    return roleMap[rolId] || null
  }
  
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

  // Función para verificar si el usuario tiene acceso a un item
  const hasAccess = (item) => {
    if (!item.allowedRoles) return true // Si no hay restricciones, permitir acceso
    const userRole = getCurrentUserRole()
    return userRole && item.allowedRoles.includes(userRole)
  }

  // Computed para obtener items filtrados por rol
  const filteredMenuItems = computed(() => {
    const filterItems = (items) => {
      return items.filter(item => {
        if (!hasAccess(item)) return false
        
        // Si es un grupo, filtrar también sus hijos
        if (item.type === 'group' && item.children) {
          const filteredChildren = filterItems(item.children)
          // Solo mostrar el grupo si tiene hijos visibles
          if (filteredChildren.length === 0) return false
          item.children = filteredChildren
        }
        
        return true
      })
    }
    
    return filterItems([...menuItems.value])
  })
  
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
    filteredMenuItems,

    
    // Acciones
    toggleDrawer,
    toggleRail,
    setCurrentModule,
    toggleGroup,
    isGroupExpanded,
    getCurrentModuleInfo,
    hasAccess,
    getCurrentUserRole
  }
})