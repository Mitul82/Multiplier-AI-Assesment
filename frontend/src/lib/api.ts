export class ApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface SavedUrl {
  id: string;
  url: string;
  preview_url: string;
  preview_title: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: 'bearer';
  user: User;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, { ...options, headers });
  } catch {
    throw new Error('Unable to connect to the server. Make sure the API is running.');
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('The server returned an invalid response.');
  }

  if (!response.ok) {
    if (typeof body === 'object' && body !== null && 'detail' in body) {
      const { detail } = body;
      if (typeof detail === 'string') {
        throw new ApiError(detail, response.status);
      }
    }
    throw new ApiError(
      response.status === 422
        ? 'Please check the information you entered.'
        : 'Something went wrong. Please try again.',
      response.status,
    );
  }

  return body as T;
}

export function signIn(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export function getSavedUrls(token: string): Promise<SavedUrl[]> {
  return request<SavedUrl[]>('/urls', {}, token);
}

export function saveUrl(url: string, token: string): Promise<SavedUrl> {
  return request<SavedUrl>(
    '/urls',
    {
      method: 'POST',
      body: JSON.stringify({ url }),
    },
    token,
  );
}
