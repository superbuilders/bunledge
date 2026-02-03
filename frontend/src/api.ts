/**
 * Authenticated API client that adds Bearer token to requests.
 */

type FetchOptions = RequestInit & {
	token?: string
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
	const { token, headers, ...rest } = options

	const response = await fetch(endpoint, {
		...rest,
		headers: {
			'Content-Type': 'application/json',
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...headers,
		},
	})

	if (!response.ok) {
		const error = await response.json().catch(() => ({ detail: 'Request failed' }))
		throw new Error(error.detail || `HTTP ${response.status}`)
	}

	if (response.status === 204) {
		return undefined as T
	}

	return response.json()
}

/**
 * Hook-friendly API functions
 */
export const api = {
	get: <T>(endpoint: string, token?: string) => apiFetch<T>(endpoint, { method: 'GET', token }),

	post: <T>(endpoint: string, data: unknown, token?: string) =>
		apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(data), token }),

	put: <T>(endpoint: string, data: unknown, token?: string) =>
		apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(data), token }),

	delete: <T>(endpoint: string, token?: string) => apiFetch<T>(endpoint, { method: 'DELETE', token }),
}
