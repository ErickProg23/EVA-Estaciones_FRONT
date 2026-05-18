import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'evaDark',
    themes: {
      evaDark: {
        dark: true,
        colors: {
          background: '#121212',
          surface: '#1E1E1E',
          primary: '#4CAF50',
          secondary: '#2D2D2D',
          accent: '#66BB6A',
          error: '#EF5350',
          info: '#29B6F6',
          success: '#4CAF50',
          warning: '#FFB300'
        },
        variables: {
          'border-color': '255,255,255',
          'border-opacity': 0.10,
          'high-emphasis-opacity': 0.92,
          'medium-emphasis-opacity': 0.72,
          'disabled-opacity': 0.46
        }
      }
    }
  },
  defaults: {
    VAppBar: {
      elevation: 2
    },
    VCard: {
      rounded: 'lg',
      elevation: 10
    },
    VBtn: {
      rounded: 'lg'
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto'
    }
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi
    }
  }
})
