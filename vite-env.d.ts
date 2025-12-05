interface ImportMetaEnv {
  readonly VITE_BACKEND_URL: string;
  readonly API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
