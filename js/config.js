const prodSameOrigin = (typeof window !== 'undefined'
  && typeof window.location?.origin === 'string'
  && window.location.origin.includes('vercel.app'))
  ? '/api'
  : 'https://betting-tracker-backend.vercel.app/api';

const defaultApiBase = prodSameOrigin;
export const API_BASE_URL = (typeof process !== 'undefined' && process.env?.API_BASE_URL) || defaultApiBase;
