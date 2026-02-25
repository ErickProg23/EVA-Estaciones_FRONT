<template>
  <div>
    <LoadingWave 
      v-if="isInitialLoading"
      :show="isInitialLoading"
      title="Cargando Roles"
      :message="loadingMessage"
      :progress="loadingProgress"
      icon="mdi-shield-account"
      animation-type="particles"
    />
    <div v-else>
      <v-container fluid>
        <v-row class="mb-4">
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Buscar roles..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedStatus"
              :items="statusOptions"
              item-title="title"
              item-value="value"
              label="Filtrar por estado"
              variant="outlined"
              density="compact"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" md="3" class="text-right">
            <v-btn color="green" variant="flat" @click="openAddDialog">
              <v-icon class="mr-2">mdi-plus</v-icon>
              Agregar Rol
            </v-btn>
          </v-col>
        </v-row>

        <v-card elevation="2">
          <v-card-title>Roles</v-card-title>
          <v-data-table
            :items="filteredRoles"
            :headers="headers"
            density="comfortable"
            :loading="loading"
            loading-text="Cargando roles..."
            class="elevation-0"
          >
            <template #item.activo="{ item }">
              <v-chip :color="item.activo ? 'success' : 'error'" size="small" variant="flat">
                {{ item.activo ? 'Activo' : 'Inactivo' }}
              </v-chip>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <v-btn
                  size="small"
                  color="blue"
                  variant="text"
                  @click="openEditDialog(item)"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  size="small"
                  :color="item.activo ? 'error' : 'success'"
                  variant="text"
                  @click="toggleRoleStatus(item)"
                  :loading="saving && togglingId === item.id"
                >
                  <v-icon>{{ item.activo ? 'mdi-cancel' : 'mdi-check-circle' }}</v-icon>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </v-card>
      </v-container>

      <v-dialog v-model="showDialog" max-width="480px">
        <v-card>
          <v-card-title class="text-h6">
            {{ editingRole ? 'Editar Rol' : 'Nuevo Rol' }}
          </v-card-title>
          <v-card-text>
            <v-form v-model="formValid" @submit.prevent="saveRole">
              <v-text-field
                v-model="roleForm.nombre"
                label="Nombre del rol"
                variant="outlined"
                :rules="[rules.required]"
                required
              />
              <v-switch
                v-if="editingRole"
                v-model="roleForm.activo"
                label="Activo"
                color="green"
                hide-details
              />
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="closeDialog">Cancelar</v-btn>
            <v-btn
              color="green"
              variant="flat"
              :loading="saving"
              :disabled="!formValid"
              @click="saveRole"
            >
              {{ editingRole ? 'Actualizar' : 'Crear' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-snackbar
        v-model="showSnackbar"
        :color="snackbarColor"
        timeout="3000"
        location="top right"
      >
        {{ snackbarMessage }}
        <template #actions>
          <v-btn color="white" variant="text" @click="showSnackbar = false">Cerrar</v-btn>
        </template>
      </v-snackbar>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import LoadingWave from '@/components/LoadingWave.vue'
import { roleService } from '@/services/apiService'

// Estado general
const loading = ref(false)
const saving = ref(false)
const isInitialLoading = ref(true)
const loadingMessage = ref('Cargando roles...')
const loadingProgress = ref(0)

// Snackbar
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// Tabla y filtros
const roles = ref([])
const search = ref('')
const selectedStatus = ref(null)
const statusOptions = [
  { value: true, title: 'Activo' },
  { value: false, title: 'Inactivo' }
]

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false, align: 'center' }
]

// Diálogo
const showDialog = ref(false)
const editingRole = ref(null)
const formValid = ref(false)
const roleForm = ref({
  nombre: '',
  activo: true
})

// Reglas de validación
const rules = {
  required: v => !!v || 'Este campo es requerido'
}

// Utilidad snackbar
const showMessage = (msg, color = 'success') => {
  snackbarMessage.value = msg
  snackbarColor.value = color
  showSnackbar.value = true
}

// Carga inicial
const updateLoadingProgress = (pct = 100) => {
  loadingProgress.value = pct
  if (pct >= 100) {
    setTimeout(() => { isInitialLoading.value = false }, 300)
  }
}

const loadRoles = async () => {
  loading.value = true
  try {
    const result = await roleService.getRoles()
    roles.value = result.success ? result.data : []
    if (!result.success) showMessage(result.message || 'No se pudieron cargar roles', 'warning')
  } catch (e) {
    roles.value = []
    showMessage('Error al cargar roles', 'error')
  } finally {
    loading.value = false
    updateLoadingProgress(100)
  }
}

onMounted(() => {
  updateLoadingProgress(30)
  loadRoles()
})

// Filtro de roles
const filteredRoles = computed(() => {
  let arr = roles.value || []
  if (selectedStatus.value !== null && selectedStatus.value !== undefined) {
    arr = arr.filter(r => !!r.activo === selectedStatus.value)
  }
  if (search.value) {
    const s = search.value.toLowerCase()
    arr = arr.filter(r => (r.nombre || '').toLowerCase().includes(s) || String(r.id).includes(s))
  }
  return arr
})

// Diálogo acciones
const openAddDialog = () => {
  editingRole.value = null
  roleForm.value = { nombre: '', activo: true }
  showDialog.value = true
}

const openEditDialog = (role) => {
  editingRole.value = role
  roleForm.value = { nombre: role.nombre || '', activo: !!role.activo }
  showDialog.value = true
}

const closeDialog = () => {
  showDialog.value = false
  editingRole.value = null
}

const togglingId = ref(null)

const saveRole = async () => {
  if (!formValid.value) return
  saving.value = true
  try {
    if (editingRole.value) {
      const result = await roleService.updateRole(editingRole.value.id, { nombre: roleForm.value.nombre })
      if (result.success) {
        const idx = roles.value.findIndex(r => r.id === editingRole.value.id)
        if (idx !== -1) roles.value[idx].nombre = roleForm.value.nombre
        showMessage('Rol actualizado', 'success')
        closeDialog()
      } else {
        showMessage(result.message || 'Error al actualizar rol', 'error')
      }
    } else {
      const result = await roleService.createRole({ nombre: roleForm.value.nombre })
      if (result.success) {
        // Intentar agregar el nuevo rol devuelto; si no hay objeto, recargar
        const newRole = result.data?.rol || result.data || null
        if (newRole && newRole.id) {
          roles.value = [newRole, ...roles.value]
        } else {
          await loadRoles()
        }
        showMessage('Rol creado', 'success')
        closeDialog()
      } else {
        showMessage(result.message || 'Error al crear rol', 'error')
      }
    }
  } catch (e) {
    showMessage('Error de conexión', 'error')
  } finally {
    saving.value = false
  }
}

const toggleRoleStatus = async (role) => {
  if (!role) return
  togglingId.value = role.id
  saving.value = true
  try {
    const nuevoEstado = !role.activo
    const result = await roleService.setRoleStatus(role.id, nuevoEstado)
    if (result.success) {
      const idx = roles.value.findIndex(r => r.id === role.id)
      if (idx !== -1) roles.value[idx].activo = nuevoEstado
      showMessage(nuevoEstado ? 'Rol activado' : 'Rol desactivado', 'success')
    } else {
      showMessage(result.message || 'No se pudo actualizar el estado del rol', 'error')
    }
  } catch (e) {
    showMessage('Error al actualizar el estado', 'error')
  } finally {
    saving.value = false
    togglingId.value = null
  }
}
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>