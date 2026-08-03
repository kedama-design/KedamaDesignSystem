import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'] },
    rollupOptions: { external: ['react', 'react-dom', 'react/jsx-runtime'] },
  },
});
