declare global {
  namespace NodeJS {
    interface ProcessEnv {
      STMP_HOST?: string;
      STMP_PORT?: string;
      STMP_USERNAME?: string;
      STMP_PASSWORD?: string;
      INBOUND_EMAIL?: string;
    }
  }
}

export {};
