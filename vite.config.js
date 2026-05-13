import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  esbuild: {
    drop: ['debugger'],
    // Drop console.log in production — keeps error/warn for monitoring
    pure: ['console.log', 'console.info'],
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    // Inline small assets to reduce HTTP requests
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // Granular chunk splitting — nothing leaks into the initial bundle
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            // Feature-based app splitting
            if (id.includes('/pages/admin/'))       return 'feature-admin';
            if (id.includes('/pages/instructor/'))  return 'feature-instructor';
            if (id.includes('/pages/Landing'))      return 'feature-landing';
            if (id.includes('/pages/Discussions')|| id.includes('/LessonDiscussions')) return 'feature-discussions';
            if (id.includes('/pages/Assessment'))   return 'feature-assessment';
            if (id.includes('/pages/Progress'))     return 'feature-progress';
            if (id.includes('certificateGenerator')|| id.includes('jspdf') || id.includes('html2canvas')) return 'vendor-pdf';
            return; // let other app files be bundled normally
          }

          // Heavy async libs — never in initial bundle
          if (id.includes('@stomp/stompjs') || id.includes('sockjs-client')) return 'vendor-websocket';
          if (id.includes('jspdf') || id.includes('html2canvas'))            return 'vendor-pdf';
          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('rehype-')) return 'vendor-markdown';
          if (id.includes('framer-motion'))  return 'vendor-motion';
          if (id.includes('lucide-react'))   return 'vendor-icons';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (id.includes('axios'))          return 'vendor-http';
          // Core React runtime — kept as small as possible
          if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) return 'vendor-react';
          return 'vendor-misc';
        },
      }
    },
    chunkSizeWarningLimit: 800,
  },
})