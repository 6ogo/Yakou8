/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_NINJAS_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }