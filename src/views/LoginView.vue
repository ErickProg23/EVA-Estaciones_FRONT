<template>
  <v-container fluid class="login-container d-flex align-center justify-center">
    <v-row justify="center" align="center" class="w-100">
      <v-col cols="12" sm="8" md="6" lg="4" xl="3">
        <v-card class="login-card mx-auto" elevation="12" :max-width="isMobile ? '100%' : '400'">
          <v-card-title class="text-center pa-6 pa-sm-8">
            <div class="d-flex flex-column align-center">
              <img
                  src="@/assets/logo.png"
                  alt="Logo"
                  class="mb-4 rounded"
                  :style="logoStyle"
              />
            </div>
          </v-card-title>
          
          <v-card-text class="pa-6 pa-sm-8">
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Usuario"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="green"
                class="mb-4 mb-sm-6"
                :rules="[rules.required]"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                :type="showPassword ? 'text' : 'password'"
                variant="outlined"
                color="green"
                class="mb-4 mb-sm-6"
                :rules="[rules.required]"
                @click:append-inner="showPassword = !showPassword"
                required
              ></v-text-field>
              
              <v-btn
                type="submit"
                color="green"
                size="large"
                block
                class="mb-4 py-3"
                :loading="loading"
                rounded
              >
                <v-icon left>mdi-login</v-icon>
                Iniciar Sesión
              </v-btn>
              
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
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

// ===== COMPOSABLES =====
const router = useRouter()
const { xs, sm } = useDisplay()

// ===== CONFIGURACIÓN API =====
const API_URL = process.env.VUE_APP_API_URL

// ===== REACTIVE DATA =====
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const showSnackbar = ref(false)
const snackbarMessage = ref('')
const snackbarColor = ref('success')

// ===== COMPUTED PROPERTIES =====
const isMobile = computed(() => xs.value || sm.value)

const logoStyle = computed(() => {
  const baseSize = isMobile.value ? 100 : 144
  const height = isMobile.value ? 72 : 104
  return `width: ${baseSize}px; height: ${height}px;`
})

// ===== VALIDATION RULES =====
const rules = {
  required: (value) => !!value || 'Este campo es requerido'
}

// ===== METHODS =====
const handleLogin = async () => {
  loading.value = true
  showSnackbar.value = false
  snackbarMessage.value = ''
  snackbarColor.value = 'success'
  
  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    })
    
    const data = await response.json()

    console.log(data)
    
    if (response.ok) {
      // Login exitoso
      snackbarMessage.value = data?.nombre ? `Bienvenido, ${data.nombre}` : 'Inicio de sesión exitoso'
      snackbarColor.value = 'success'
      showSnackbar.value = true
      
      sessionStorage.setItem('isAuthenticated', 'true')
      sessionStorage.setItem('username', username.value)
      sessionStorage.setItem('rol_id', data.rol_id)
      sessionStorage.setItem('estacion_id', data.estacion_id)
      sessionStorage.setItem('usuario_id', data.usuario_id)
      sessionStorage.setItem('nombre', data.nombre)

      if (data.token) {
        sessionStorage.setItem('token', data.token)
      }
      
      // Pequeña pausa para mostrar el snackbar antes de redirigir
      await new Promise(r => setTimeout(r, 700))
      const rolId = String(data.rol_id ?? sessionStorage.getItem('rol_id'))
      if (rolId === '4') {
        await router.push('/manuales/subir')
      } else if (rolId === '5') {
        await router.push('/solicitudes')
      } else if (rolId === '2') {
        await router.push('/reports/stations')
      } else {
        await router.push('/dashboard')
      }
      
    } else {
      // Error del servidor
      snackbarMessage.value = data.message || 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.'
      snackbarColor.value = 'error'
      showSnackbar.value = true
    }
  } catch (err) {
    snackbarMessage.value = 'Error de conexión con el servidor. Por favor, intenta nuevamente.'
    snackbarColor.value = 'error'
    showSnackbar.value = true
    console.error('Error de login:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  padding: 16px;
}

.login-card {
  background-color: #2d2d2d !important;
  border: 2px solid #4caf50;
  border-radius: 16px !important;
  width: 100%;
}

.login-card .v-card-title {
  background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
  border-radius: 16px 16px 0 0;
}

.v-text-field .v-field {
  background-color: #3d3d3d;
  border-radius: 12px;
}

.v-text-field .v-field--focused {
  border-color: #4caf50;
}

.v-text-field .v-label {
  color: #cccccc;
}

.v-text-field .v-field--focused .v-label {
  color: #4caf50;
}

.green--text {
  color: #4caf50 !important;
}

.v-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
}

/* Responsividad adicional */
@media (max-width: 600px) {
  .login-container {
    padding: 8px;
  }
  
  .login-card {
    margin: 0;
  }
}

@media (max-height: 600px) {
  .login-container {
    align-items: flex-start;
    padding-top: 20px;
  }
}
</style>