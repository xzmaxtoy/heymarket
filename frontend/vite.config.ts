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
  build: {
    // Reduce build time by disabling source maps in production
    sourcemap: false,
    // Use esbuild for faster minification
    minify: 'esbuild',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize chunk splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom',
            '@mui/material',
            '@reduxjs/toolkit',
            'react-redux'
          ],
          // Group MUI components together
          mui: [
            '@mui/x-date-pickers',
            '@mui/icons-material'
          ]
        }
      }
    },
    // Limit the number of concurrent tasks
    target: 'esnext',
    // Optimize for modern browsers only
    cssCodeSplit: false
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
