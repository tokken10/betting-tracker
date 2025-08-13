const defaultApiBase = 'https://betting-tracker-backend.vercel.app/api';
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.API_BASE_URL) || defaultApiBase;
