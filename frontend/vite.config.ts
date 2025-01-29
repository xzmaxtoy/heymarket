import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, options) => {
          // Log proxy errors
          proxy.on('error', (err, req, res) => {
            console.error('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', {
              method: req.method,
              url: req.url,
              headers: req.headers,
            });
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Proxy response:', {
              status: proxyRes.statusCode,
              headers: proxyRes.headers,
            });
          });
        },
      },
    },
  },
});