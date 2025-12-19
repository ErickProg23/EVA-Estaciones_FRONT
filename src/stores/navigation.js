import { defineStore } from 'pinia'
import { title } from 'process'
import { ref, computed } from 'vue'

export const useNavigationStore = defineStore('navigation', () => {
  // Estado reactivo
  const drawer = ref(false)
  const rail = ref(false)
  const currentModule = ref('dashboard')
  const expandedGroups = ref(['administration', 'reports', 'manuales']) // Grupos expandidos por defecto
  
  // ✅ AGREGAR: Variable reactiva para el rol del usuario
  const currentUserRole = ref(null)

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
        },
        {
          title: 'Bombas',
          icon: 'mdi-fuel',
          value: 'bombas',
          route: '/administration/bombas',
          type: 'item',
          allowedRoles: ['ADMIN', 'Mantenimiento']
        }
      ]
    },
    {
      title: 'Manuales',
      icon: 'mdi-file-document-multiple',
      value: 'manuales',
      type: 'group',
      children: [
        {
          title: 'Lecturas comparativas',
          icon: 'mdi-clipboard-list',
          value: 'manuales-comparativas',
          route: '/manuales/comparativas',
          type: 'item',
          allowedRoles: ['ADMIN', 'Encargado']
        },
        {
          title: 'Productos',
          icon: 'mdi-oil',
          value: 'manuales-productos',
          route: '/productos',
          type: 'item',
          allowedRoles: ['ADMIN', 'Encargado']
        },
        {
          title: 'Lecturas manuales',
          icon: 'mdi-file-document',
          value: 'manuales-subir',
          route: '/manuales/subir',
          type: 'item',
          allowedRoles: ['Mantenimiento']
        }
      ]
    },
    {
      title: 'Solicitudes',
      icon: 'mdi-clipboard-check',
      value: 'solicitudes-group',
      type: 'group',
      allowedRoles: ['ADMIN', 'Encargado'],
      children: [
        {
          title: 'Mis Solicitudes',
          icon: 'mdi-clipboard-list',
          value: 'solicitudes',
          route: '/solicitudes',
          type: 'item',
          allowedRoles: ['ADMIN', 'Encargado']
        },
        {
          title: 'Gestión de Materiales',
          icon: 'mdi-package-variant-closed',
          value: 'admin-materiales',
          route: '/admin/materiales',
          type: 'item',
          allowedRoles: ['ADMIN']
        }
      ]
    }
  ])

  // Función para obtener el rol actual del usuario
  // ✅ MODIFICAR: Función para obtener y actualizar el rol actual del usuario
  const getCurrentUserRole = () => {
    const rolId = sessionStorage.getItem('rol_id')
    const roleMap = {
      '1': 'ADMIN',
      '2': 'Capital humano', 
      '3': 'Encargado',
      '4': 'Mantenimiento'
    }
    const role = roleMap[rolId] || null
    currentUserRole.value = role
    return role
  }
  
  // ✅ AGREGAR: Función para forzar actualización del rol
  const updateUserRole = () => {
    getCurrentUserRole()
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

  // ✅ MODIFICAR: Función para verificar si el usuario tiene acceso a un item
  const hasAccess = (item) => {
    if (!item.allowedRoles) return true
    const rolId = sessionStorage.getItem('rol_id')
    const roleMap = {
      '1': 'ADMIN',
      '2': 'Capital humano',
      '3': 'Encargado',
      '4': 'Mantenimiento'
    }
    const userRole = currentUserRole.value ?? roleMap[rolId] ?? null
    return userRole && item.allowedRoles.includes(userRole)
  }

  // ✅ MODIFICAR: Computed para obtener items filtrados por rol
  const filteredMenuItems = computed(() => {
    const _role = currentUserRole.value
    const cloneAndFilter = (items) => {
      const result = []
      for (const item of items) {
        if (!hasAccess(item)) continue
        if (item.type === 'group' && Array.isArray(item.children)) {
          const children = cloneAndFilter(item.children)
          if (children.length === 0) continue
          result.push({ ...item, children })
        } else {
          result.push({ ...item })
        }
      }
      return result
    }
    return cloneAndFilter(menuItems.value)
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
    currentUserRole, // ✅ AGREGAR

    
    // Acciones
    toggleDrawer,
    toggleRail,
    setCurrentModule,
    toggleGroup,
    isGroupExpanded,
    getCurrentModuleInfo,
    hasAccess,
    getCurrentUserRole,
    updateUserRole // ✅ AGREGAR
  }
})