<template>
  <div v-if="show" class="loading-overlay">
    <div class="loading-container">
      <div class="wave-loading">
        <div class="wave-circle wave-1"></div>
        <div class="wave-circle wave-2"></div>
        <div class="wave-circle wave-3"></div>
        <div class="wave-circle wave-4"></div>
        <div class="wave-center">
          <v-icon size="40" color="white">{{ icon }}</v-icon>
        </div>
      </div>
      <div class="loading-content">
        <h2 class="loading-title">{{ title }}</h2>
        <p class="loading-subtitle">{{ message }}</p>
        <div v-if="showProgress" class="loading-progress">
          <v-progress-linear
            :model-value="progress"
            color="green"
            height="4"
            rounded
          ></v-progress-linear>
          <span class="progress-text">{{ progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Cargando Sistema EVA'
  },
  message: {
    type: String,
    default: 'Inicializando...'
  },
  progress: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  icon: {
    type: String,
    default: 'mdi-loading'
  }
})
</script>

<style scoped>
/* Todos los estilos CSS de la animación de ondas aquí */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-container {
  text-align: center;
  color: white;
}

.wave-loading {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wave-circle {
  position: absolute;
  border: 2px solid rgba(76, 175, 80, 0.3);
  border-radius: 50%;
  animation: wave-expand 2s infinite ease-out;
}

.wave-1 {
  width: 40px;
  height: 40px;
  animation-delay: 0s;
  border-color: rgba(76, 175, 80, 0.8);
}

.wave-2 {
  width: 60px;
  height: 60px;
  animation-delay: 0.3s;
  border-color: rgba(76, 175, 80, 0.6);
}

.wave-3 {
  width: 80px;
  height: 80px;
  animation-delay: 0.6s;
  border-color: rgba(76, 175, 80, 0.4);
}

.wave-4 {
  width: 100px;
  height: 100px;
  animation-delay: 0.9s;
  border-color: rgba(76, 175, 80, 0.2);
}

.wave-center {
  position: relative;
  z-index: 10;
  width: 60px;
  height: 60px;
  background: linear-gradient(45deg, #4caf50, #81c784);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  animation: center-pulse 2s infinite ease-in-out;
}

@keyframes wave-expand {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

@keyframes center-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 30px rgba(76, 175, 80, 0.8);
  }
}

.loading-content {
  max-width: 400px;
}

.loading-title {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #4caf50, #81c784);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-subtitle {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

.loading-progress {
  margin-bottom: 1rem;
}

.progress-text {
  display: block;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.7;
}
</style>