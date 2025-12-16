<template>
  <v-navigation-drawer
    v-model="navigationStore.drawer"
    permanent
    color="#1a1a1a"
    border="0"
    class="custom-drawer"
    :width="mobile ? 256 : 300"
  >
    <!-- Menú de navegación jerárquico -->
    <v-list density="compact" nav class="navigation-list">
      <template v-for="item in navigationStore.filteredMenuItems" :key="item.value">
        <!-- Items simples -->
        <v-list-item
          v-if="item.type === 'item'"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.value"
          :to="item.route"
          color="green"
          class="nav-item"
          @click="navigationStore.setCurrentModule(item.value)"
        >
          <template v-slot:append v-if="item.badge">
            <v-badge
              :content="item.badge"
              color="red"
              inline
            ></v-badge>
          </template>
        </v-list-item>
        
        <!-- Grupos con submenús -->
        <v-list-group
          v-else-if="item.type === 'group'"
          :value="item.value"
          fluid
        >
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              :prepend-icon="item.icon"
              :title="item.title"
              class="nav-group"
            ></v-list-item>
          </template>
          
          <v-list-item
            v-for="child in item.children"
            :key="child.value"
            :prepend-icon="child.icon"
            :title="child.title"
            :value="child.value"
            :to="child.route"
            color="green"
            class="nav-subitem"
            @click="navigationStore.setCurrentModule(child.value)"
          >
            <template v-slot:append v-if="child.badge">
              <v-badge
                :content="child.badge"
                color="red"
                inline
              ></v-badge>
            </template>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>

    <!-- Botón para expandir/contraer cuando está en modo rail -->
    <template v-slot:append>
      <div class="pa-2">
        <v-btn
          v-if="navigationStore.rail"
          icon="mdi-chevron-right"
          @click.stop="navigationStore.toggleRail()"
          variant="text"
          size="small"
        ></v-btn>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { useNavigationStore } from '@/stores/navigation'
import { useDisplay } from 'vuetify'
import { onMounted } from 'vue'

// Stores y composables
const navigationStore = useNavigationStore()
const { mobile } = useDisplay()

// Ajustar drawer según el tamaño de pantalla
onMounted(() => {
  if (mobile.value) {
    navigationStore.drawer = false
    navigationStore.rail = false
  }
})
</script>

<style scoped>
.custom-drawer {
  border-right: 1px solid rgba(255, 255, 255, 0.12) !important;
}

.logo-item {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  margin-bottom: 8px;
  padding-bottom: 16px;
}

.navigation-list {
  padding: 8px;
}

.nav-item {
  margin-bottom: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.nav-group {
  margin-bottom: 4px;
  border-radius: 8px;
  font-weight: 600;
}

.nav-subitem {
  margin-left: 16px;
  margin-bottom: 2px;
  border-radius: 6px;
  font-size: 0.875rem;
}

.nav-subitem:hover {
  background-color: rgba(76, 175, 80, 0.1);
}

.v-list-group__items .v-list-item {
  padding-inline-start: 56px !important;
}

.nav-item :deep(.v-list-item-title),
.nav-group :deep(.v-list-item-title),
.nav-subitem :deep(.v-list-item-title) {
  white-space: normal;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>