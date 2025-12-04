import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Isso permite que 'process.env.API_KEY' funcione no código do cliente
      // sem precisar mudar para import.meta.env, mantendo compatibilidade com as regras.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL),
    },
  };
});