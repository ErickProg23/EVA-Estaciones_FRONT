<template>
  <div>
    <!-- App Bar -->
    <v-app-bar
      color="#2d2d2d"
      dark
      elevation="4"
      border="0"
      class="custom-app-bar"
    >
      <v-app-bar-title class="d-flex align-center">
        <v-icon class="mr-2" color="green">mdi-account-group</v-icon>
        Gestión de Usuarios
      </v-app-bar-title>
      
      <v-spacer></v-spacer>
      
      <!-- Botón para agregar usuario -->
      <v-btn color="green" variant="outlined" class="mr-2" @click="showAddDialog = true">
        <v-icon left>mdi-plus</v-icon>
        Nuevo Usuario
      </v-btn>
      
      <!-- Botón de búsqueda -->
      <v-btn icon class="mr-2">
        <v-icon>mdi-magnify</v-icon>
      </v-btn>
    </v-app-bar>

    <!-- Contenido principal -->
    <v-main class="main-content">
      <v-container fluid class="pa-6">
        <!-- Barra de búsqueda y filtros -->
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              prepend-inner-icon="mdi-magnify"
              label="Buscar usuarios..."
              variant="outlined"
              dark
              hide-details
              clearable
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedRole"
              :items="roles"
              label="Filtrar por rol"
              variant="outlined"
              dark
              hide-details
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              label="Estado"
              variant="outlined"
              dark
              hide-details
              clearable
            ></v-select>
          </v-col>
        </v-row>

        <!-- Tabla de usuarios -->
        <v-row>
          <v-col cols="12">
            <v-card dark color="#2d2d2d" class="content-card">
              <v-card-title class="d-flex align-center justify-space-between">
                <div class="d-flex align-center">
                  <v-icon left color="blue">mdi-account-group</v-icon>
                  Lista de Usuarios
                </div>
                <v-chip color="green" variant="outlined">
                  {{ filteredUsers.length }} usuarios
                </v-chip>
              </v-card-title>
              
              <v-card-text>
                <v-data-table
                    :headers="headers"
                    :items="filteredUsers"
                    :search="search"
                    class="elevation-1"
                    :items-per-page="10"
                    >
                    <template >
                        <v-toolbar flat>
                        <v-toolbar-title>Gestión de Usuarios</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" @click="openDialog()">
                            <v-icon left>mdi-plus</v-icon>
                            Nuevo Usuario
                        </v-btn>
                        </v-toolbar>
                    </template>

                    <template v-slot:['item.active']="{ item }">
                        <v-chip :color="item.active ? 'success' : 'error'" small>
                        {{ item.active ? 'Activo' : 'Inactivo' }}
                        </v-chip>
                    </template>

                    <template v-slot:['item.role']="{ item }">
                        <v-chip :color="getRoleColor(item.role)" small>
                        {{ item.role }}
                        </v-chip>
                    </template>

                    <template v-slot:['item.actions']="{ item }">
                        <v-icon small class="mr-2" @click="editUser(item)">
                        mdi-pencil
                        </v-icon>
                        <v-icon small @click="deleteUser(item)">
                        mdi-delete
                        </v-icon>
                    </template>

                    <template v-slot:['item.permissions']="{ item }">
                        <v-chip-group>
                        <v-chip v-for="permission in item.permissions" :key="permission" x-small>
                            {{ permission }}
                        </v-chip>
                        </v-chip-group>
                    </template>
                </v-data-table>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
    
    <!-- Dialog para agregar/editar usuario -->
    <v-dialog v-model="showAddDialog" max-width="600px">
      <v-card dark color="#2d2d2d">
        <v-card-title>
          <v-icon left color="green">mdi-account-plus</v-icon>
          {{ editingUser ? 'Editar Usuario' : 'Nuevo Usuario' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="userForm" v-model="formValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.name"
                  label="Nombre completo"
                  variant="outlined"
                  dark
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="userForm.email"
                  label="Email"
                  variant="outlined"
                  dark
                  :rules="[rules.required, rules.email]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.role"
                  :items="roles"
                  label="Rol"
                  variant="outlined"
                  dark
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="userForm.status"
                  :items="statusOptions"
                  label="Estado"
                  variant="outlined"
                  dark
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
              <v-col cols="12" v-if="!editingUser">
                <v-text-field
                  v-model="userForm.password"
                  label="Contraseña"
                  type="password"
                  variant="outlined"
                  dark
                  :rules="[rules.required, rules.minLength]"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="closeDialog">
            Cancelar
          </v-btn>
          <v-btn 
            color="green" 
            variant="outlined" 
            @click="saveUser"
            :disabled="!formValid"
            :loading="saving"
          >
            {{ editingUser ? 'Actualizar' : 'Crear' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Snackbar para mensajes -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      timeout="3000"
      location="top"
    >
      {{ snackbarMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="showSnackbar = false">
          Cerrar
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Estado del componente
const _loading = ref(false)
const saving = ref(false)
const showAddDialog = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')
const searchQuery = ref('')
const selectedRole = ref(null)
const selectedStatus = ref(null)
const editingUser = ref(null)
const formValid = ref(false)

// Datos de ejemplo
const users = ref([
  {
    id: 1,
    name: 'Juan Pérez',
    email: 'juan.perez@eva.com',
    role: 'Administrador',
    status: 'Activo',
    lastLogin: new Date('2024-01-15T10:30:00'),
    avatar: null
  },
  {
    id: 2,
    name: 'María García',
    email: 'maria.garcia@eva.com',
    role: 'Operador',
    status: 'Activo',
    lastLogin: new Date('2024-01-14T15:45:00'),
    avatar: null
  },
  {
    id: 3,
    name: 'Carlos López',
    email: 'carlos.lopez@eva.com',
    role: 'Supervisor',
    status: 'Inactivo',
    lastLogin: new Date('2024-01-10T09:15:00'),
    avatar: null
  }
])

// Formulario de usuario
const userForm = ref({
  name: '',
  email: '',
  role: '',
  status: 'Activo',
  password: ''
})

// Opciones
const roles = ['Administrador', 'Supervisor', 'Operador', 'Visualizador']
const statusOptions = ['Activo', 'Inactivo']

// Headers de la tabla
const headers = [
  { title: 'Usuario', key: 'name', sortable: true },
  { title: 'Rol', key: 'role', sortable: true },
  { title: 'Estado', key: 'status', sortable: true },
  { title: 'Última conexión', key: 'lastLogin', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Reglas de validación
const rules = {
  required: value => !!value || 'Este campo es requerido',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Email inválido'
  },
  minLength: value => value.length >= 6 || 'Mínimo 6 caracteres'
}

// Computed
const filteredUsers = computed(() => {
  let filtered = users.value
  
  if (searchQuery.value) {
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  if (selectedRole.value) {
    filtered = filtered.filter(user => user.role === selectedRole.value)
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(user => user.status === selectedStatus.value)
  }
  
  return filtered
})

// Métodos
const getRoleColor = (role) => {
  const colors = {
    'Administrador': 'red',
    'Supervisor': 'orange',
    'Operador': 'blue',
    'Visualizador': 'grey'
  }
  return colors[role] || 'grey'
}

/*/const formatDate = (date) => {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}/*/

const editUser = (user) => {
  editingUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    password: ''
  }
  showAddDialog.value = true
}

const deleteUser = (user) => {
  if (confirm(`¿Estás seguro de eliminar al usuario ${user.name}?`)) {
    const index = users.value.findIndex(u => u.id === user.id)
    if (index > -1) {
      users.value.splice(index, 1)
      showMessage('Usuario eliminado correctamente', 'success')
    }
  }
}

const saveUser = async () => {
  saving.value = true
  
  try {
    // Simular llamada a API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    if (editingUser.value) {
      // Actualizar usuario existente
      const index = users.value.findIndex(u => u.id === editingUser.value.id)
      if (index > -1) {
        users.value[index] = {
          ...users.value[index],
          name: userForm.value.name,
          email: userForm.value.email,
          role: userForm.value.role,
          status: userForm.value.status
        }
      }
      showMessage('Usuario actualizado correctamente', 'success')
    } else {
      // Crear nuevo usuario
      const newUser = {
        id: Date.now(),
        name: userForm.value.name,
        email: userForm.value.email,
        role: userForm.value.role,
        status: userForm.value.status,
        lastLogin: new Date(),
        avatar: null
      }
      users.value.push(newUser)
      showMessage('Usuario creado correctamente', 'success')
    }
    
    closeDialog()
  } catch (error) {
    showMessage('Error al guardar usuario', 'error')
  } finally {
    saving.value = false
  }
}

const closeDialog = () => {
  showAddDialog.value = false
  editingUser.value = null
  userForm.value = {
    name: '',
    email: '',
    role: '',
    status: 'Activo',
    password: ''
  }
}

const showMessage = (message, color) => {
  snackbarMessage.value = message
  snackbarColor.value = color
  showSnackbar.value = true
}

// Lifecycle
onMounted(() => {
  // Aquí podrías cargar usuarios desde una API
  showMessage('Módulo de usuarios cargado', 'success')
})
</script>

<style scoped>
.main-content {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
}

.content-card {
  border-radius: 12px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.custom-app-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.custom-table {
  background: transparent !important;
}

.custom-table .v-data-table__wrapper {
  background: transparent;
}

.v-data-table-header {
  background: rgba(76, 175, 80, 0.1) !important;
}

.v-data-table-rows-no-data {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>