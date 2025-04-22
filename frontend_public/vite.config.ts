import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig({
  base: '/',
  plugins: [solidPlugin()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    emptyOutDir: true,
  },
  server: {
    host: 'localhost',
    port: 3002,
    // Configuración explícita de HMR WebSocket
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3002,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true, // <--- permite reenviar también conexiones WS para HMR
      },
    },
  },
});
