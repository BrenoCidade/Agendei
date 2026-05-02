import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL: normalizedApiBaseUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register');
    const hasStoredToken = Boolean(localStorage.getItem('access_token'));

    if (error.response?.status === 401 && hasStoredToken && !isAuthRequest) {
      localStorage.removeItem('access_token');

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Nao foi possivel concluir a solicitacao.',
) {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Sem conexao com o servidor. Confira sua internet e tente novamente.';
    }

    const data = error.response.data as
      | { message?: string | string[] }
      | undefined;

    if (Array.isArray(data?.message) && data.message.length > 0) {
      return data.message[0];
    }

    if (typeof data?.message === 'string' && data.message.trim()) {
      return data.message;
    }

    if (error.response.status >= 500) {
      return 'O servidor falhou ao processar a solicitacao. Tente novamente em instantes.';
    }
  }

  return fallback;
}

export function isUnauthorizedError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
