// API Configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Google OAuth Configuration
export const GOOGLE_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
export const GOOGLE_CLIENT_ID_SUFFIX = '.apps.googleusercontent.com';

// API Endpoints
const getAuthEndpoint = (path: string) => `${API_URL}/api/auth${path}`;
const getApiEndpoint = (path: string) => `${API_URL}/api${path}`;

export const AUTH_ENDPOINTS = {
  GOOGLE_LOGIN: getAuthEndpoint('/google'),
  LOGOUT: getAuthEndpoint('/logout'),
  PROFILE: getApiEndpoint('/profile'),
} as const;

