import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
=======
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
>>>>>>> 51dd1296afdfe4165c436e45bab868124b455a9c
})
