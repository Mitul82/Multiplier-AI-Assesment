import axios, { type AxiosRequestConfig } from 'axios';

export interface User {
    id: string;
    name: string;
    email: string;
}

export interface Session {
    token: string;
    user: User;
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

interface ApiErrorResponse {
    detail?: unknown;
}

export class ApiError extends Error {
    readonly status?: number;

    constructor(
        message: string,
        status?: number,
    ) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

const client = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

client.interceptors.request.use((config) => {
    const token = window.localStorage.getItem('accessToken');
    if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
});

function getErrorMessage(error: unknown): ApiError {
    if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const detail = error.response?.data?.detail;
        const message = typeof detail === 'string'
            ? detail
            : Array.isArray(detail)
                ? detail
                    .map((item) => (
                        typeof item === 'object' &&
                        item !== null &&
                        'msg' in item &&
                        typeof item.msg === 'string'
                            ? item.msg
                            : null
                    ))
                    .filter((item): item is string => item !== null)
                    .join(' ')
                : error.response?.status === 422
                    ? 'Please check the information you entered.'
                    : error.response
                        ? 'Something went wrong. Please try again.'
                        : 'Unable to connect to the server. Make sure the API is running.';

        return new ApiError(message, error.response?.status);
    }

    return new ApiError('An unexpected error occurred.');
}

async function request<T>(
    config: AxiosRequestConfig,
): Promise<T> {
    try {
        const response = await client.request<T>(config);
        return response.data;
    } catch (error) {
        throw getErrorMessage(error);
    }
}

export function signIn(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>({
        method: 'post',
        url: '/auth/login',
        data: { email, password },
    });
}

export function signUp(
    name: string,
    email: string,
    password: string,
): Promise<AuthResponse> {
    return request<AuthResponse>({
        method: 'post',
        url: '/auth/signup',
        data: { name, email, password },
    });
}

export function getSavedUrls(): Promise<SavedUrl[]> {
    return request<SavedUrl[]>({
        method: 'get',
        url: '/urls',
    });
}

export function saveUrl(url: string): Promise<SavedUrl> {
    return request<SavedUrl>({
        method: 'post',
        url: '/urls',
        data: { url },
    });
}
