import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [solidPlugin()],
  build: {
    outDir: 'dist', // Carpeta donde se va a generar el build
    assetsDir: 'assets', // Directorio para los assets
    sourcemap: true, // Mapas de fuente para facilitar la depuración
    emptyOutDir: true, // Limpiar la carpeta de salida antes de cada build
  },
  server: {
    port: 3001, // Asegúrate de que el puerto esté libre
    proxy: {
      '/api': 'http://localhost:3000', // Ajusta esto si necesitas redirigir algunas peticiones
    },
  },
});
