
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // URL fornecida pelo usuário para o backend Google Apps Script
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyGEPpqT9EZGcq0TUACUA71YnNkS-e4AAi0-QA7QsxgfHGUuRq_3rRGzYyCxS_swyh_/exec";

  return {
    plugins: [react()],
    define: {
      // Isso permite que 'process.env.API_KEY' funcione no código do cliente
      // sem precisar mudar para import.meta.env, mantendo compatibilidade com as regras.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Prioriza a variável de ambiente se existir, senão usa a URL hardcoded fornecida
      'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || GOOGLE_SCRIPT_URL),
    },
  };
});
