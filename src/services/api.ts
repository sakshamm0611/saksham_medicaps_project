export interface UserSafe {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  conflictSeats?: string[];
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('imovies_token');
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('imovies_token');
      localStorage.removeItem('imovies_user');
      window.dispatchEvent(new Event('auth_change'));
    }
    const err = new Error(data.message || 'API request failed') as Error & { status: number; data: any };
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}
