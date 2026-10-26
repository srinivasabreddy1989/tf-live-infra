export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET'
  const headers = new Headers(options?.headers)
  if (options?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const csrfResponse = await fetch('/api/auth/csrf', { credentials: 'include' })
    if (!csrfResponse.ok) throw new Error('Could not start a secure session. Please try again.')
    const csrfToken = await csrfResponse.json() as { token: string }
    headers.set('X-CSRF-TOKEN', csrfToken.token)
  }
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null
    throw new Error(body?.detail ?? body?.message ?? 'Request failed. Please try again.')
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
