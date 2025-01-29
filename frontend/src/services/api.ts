import { supabase } from './supabase';

// Get auth token from Supabase session
const getAuthToken = async () => {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token;
};

// Base API request configuration
const createRequestConfig = async (config: RequestInit = {}): Promise<RequestInit> => {
  const token = await getAuthToken();
  return {
    ...config,
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    },
  };
};

// API request wrapper with authentication
export const apiRequest = async <T>(
  endpoint: string,
  config: RequestInit = {}
): Promise<T> => {
  const requestConfig = await createRequestConfig(config);
  const response = await fetch(`/api${endpoint}`, requestConfig);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Common API methods
export const api = {
  get: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export default api;