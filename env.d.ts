/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_NINJAS_KEY: string;
    readonly VITE_GITHUB_TOKEN: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }