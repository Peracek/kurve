import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name].js',
        chunkFileNames: 'js/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'css/[name][extname]';
          }
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(assetInfo.name.split('.').at(-1))) {
            return 'images/[name][extname]';
          }
          return 'assets/[name][extname]';
        },
      },
    },
  },
});
