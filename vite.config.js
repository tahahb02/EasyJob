import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Le bundle monolithique faisait 2,48 Mo (633 ko gzip) et était téléchargé
    // en entier dès la page d'accueil, y compris pour un visiteur qui ne fait
    // que lire la landing page. La séparation manuelle ci-dessous isole les
    // bibliothèques lourdes ; le découpage par route se fait via React.lazy
    // dans src/App.jsx.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Regroupe les dépendances qui changent rarement, pour réutiliser le
        // cache navigateur entre deux déploiements.
        advancedChunks: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
            { name: 'router', test: /node_modules[\\/](react-router|react-router-dom)[\\/]/ },
            { name: 'charts', test: /node_modules[\\/](recharts|d3-[^\\/]+|victory-[^\\/]+)[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/ },
            { name: 'radix', test: /node_modules[\\/](@radix-ui|radix-ui)[\\/]/ },
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
      },
    },
  },
})
