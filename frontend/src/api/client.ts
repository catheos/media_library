const API_HOST = import.meta.env.VITE_API_HOST;

export class ApiException extends Error {
  status: number;
  data?: any;

  constructor(
    message: string,
    status: number,
    data?: any
  ) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.data = data;
  }
}

export const api = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
  };

  const response = await fetch(`${API_HOST}${endpoint}`, config);

  // Handle auth errors globally
  // ONLY logout if we sent a token and it was rejected (invalid/expired token)
  if ((response.status === 401 || response.status === 403) && token) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/users/login';
    throw new ApiException('Unauthorized', response.status);
  }

  // For non-2xx responses, throw an error with the response data
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An error occurred' }));
    throw new ApiException(
      errorData.error || `Request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }

  return response;
};