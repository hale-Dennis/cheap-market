import type { ApiResponse } from '@cheap-market/shared-types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function redirectToLogin() {
  const next = window.location.pathname + window.location.search;
  window.location.assign(`/login?next=${encodeURIComponent(next)}`);
}

/**
 * Calls the backend through the /api/v1 proxy and unwraps the ApiResponse envelope.
 * @param path Backend path below /api/v1, e.g. "/admin/farmers".
 * @throws ApiError with the backend's message on any non-2xx response.
 */
export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    // FormData bodies (file uploads) must let the browser set the multipart boundary.
    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
    response = await fetch(`/api/v1${path}`, {
      ...init,
      headers: isFormData ? init.headers : { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please try again.', 0);
  }

  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (response.status === 401) {
    redirectToLogin();
    throw new ApiError('Your session has expired. Please sign in again.', 401);
  }
  if (!response.ok) {
    throw new ApiError(
      body?.message ?? 'Something went wrong. Please try again.',
      response.status,
    );
  }
  return body?.data as T;
}
