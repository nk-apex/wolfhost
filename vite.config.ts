import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info', 'console.warn', 'console.error', 'console.trace'],
        passes: 2,
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_private/,
        },
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Separate large libraries into their own chunks
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion';
            }
            if (id.includes('react-router-dom')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query') || id.includes('@hookform')) {
              return 'react-libraries';
            }
            // Default vendor chunk
            return 'vendor';
          }
          // Component chunk
          if (id.includes('components/ui')) {
            return 'ui-components';
          }
        },
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 700,
  },

  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  preview: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: true,
  },
}));
