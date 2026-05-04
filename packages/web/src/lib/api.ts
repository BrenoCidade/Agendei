import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiBaseUrl = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  withCredentials: true, // envia o cookie httpOnly em todas as requisições
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const requestUrl = String(error.config?.url ?? '');
    const isAuthOrProfileCheck =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/profile/me');

    if (error.response?.status === 401 && !isAuthOrProfileCheck) {
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
