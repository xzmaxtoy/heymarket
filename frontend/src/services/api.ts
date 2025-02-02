import { supabase } from './supabase';

// Get auth token from Supabase session
const getAuthToken = async () => {
  const session = await supabase.auth.getSession();
  return session.data.session?.access_token;
};

// Base API request configuration
const createRequestConfig = async (config: RequestInit = {}): Promise<RequestInit> => {
  const token = await getAuthToken();
  const apiKey = import.meta.env.VITE_API_KEY;
  
  // Get Heymarket IDs from environment
  const creatorId = import.meta.env.VITE_CREATOR_ID;
  const inboxId = import.meta.env.VITE_INBOX_ID;

  if (!apiKey) {
    console.warn('Missing API key in environment');
  }

  if (!creatorId || !inboxId) {
    console.warn('Missing Heymarket configuration:', { creatorId, inboxId });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey || token}`,
    'X-Creator-Id': creatorId,
    'X-Inbox-Id': inboxId,
    'X-Request-Id': requestId,
  };

  console.log('Request headers:', {
    ...headers,
    'Authorization': headers.Authorization ? 'Bearer [REDACTED]' : undefined,
  });

  return {
    ...config,
    headers: {
      ...config.headers,
      ...headers,
    },
  };
};

// API request wrapper with authentication
export const apiRequest = async <T>(
  endpoint: string,
  config: RequestInit = {}
): Promise<T> => {
  try {
    console.log(`API Request to ${endpoint}:`, {
      method: config.method,
      body: config.body ? JSON.parse(config.body as string) : undefined,
    });

    const requestConfig = await createRequestConfig(config);
    const response = await fetch(endpoint, requestConfig);

    console.log(`API Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error(`API Error from ${endpoint}:`, error);

      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your API key.');
      }

      throw new Error(error.message || `API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`API Success from ${endpoint}:`, {
      ...data,
      data: data.data ? '[REDACTED]' : undefined,
    });

    return data.data || data;
  } catch (error) {
    console.error(`API Error in ${endpoint}:`, error);
    throw error;
  }
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

  patch: <T>(endpoint: string, data: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

export default api;
