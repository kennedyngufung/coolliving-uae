import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ---------------------------------------------------------------------------
// CoolLivingUAE — Vite Configuration
// Includes: React plugin + static prerendering for Google crawlability
// ---------------------------------------------------------------------------
// HOW PRERENDERING WORKS:
// After `npm run build`, run `npm run prerender` to generate static HTML
// files for every route. Googlebot then sees real HTML content instead of
// a blank <div id="root"></div> — critical for AdSense approval & SEO.
// ---------------------------------------------------------------------------

export default defineConfig({
  plugins: [
    react(),
  ],

  build: {
    // Output directory
    outDir: 'dist',
    // Inline assets smaller than 4kb
    assetsInlineLimit: 4096,
    // Generate source maps for debugging (disable in production if preferred)
    sourcemap: false,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },

  // Dev server settings
  server: {
    port: 5173,
    open: true,
  },

  // Preview server (after build)
  preview: {
    port: 4173,
  },
});
