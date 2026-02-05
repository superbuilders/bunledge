/**
 * Authenticated API client that adds Bearer token to requests.
 */

export type ActivityStatus = 'not_started' | 'in_progress' | 'paused' | 'completed'

export interface Activity {
	id: number
	activity_id: string
	name: string
	course_code: string
	created_at: string
}

export interface ActivityProgress {
	id: number
	user_id: number
	activity_id: number
	status: ActivityStatus
	run_id: string | null
	correct_questions: number
	total_questions: number
	mastered_units: number
	xp_earned: number | null
	elapsed_ms: number
	started_at: string | null
	updated_at: string
	completed_at: string | null
}

export interface ActivityProgressUpdate {
	status?: ActivityStatus
	run_id?: string
	correct_questions?: number
	total_questions?: number
	mastered_units?: number
	xp_earned?: number
	elapsed_ms?: number
}

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

export const activityApi = {
	listActivities: (token: string) => api.get<Activity[]>('/api/activities', token),

	createActivity: (data: { activity_id: string; name: string; course_code: string }, token: string) =>
		api.post<Activity>('/api/activities', data, token),

	listMyProgress: (token: string) => api.get<ActivityProgress[]>('/api/activities/progress/me', token),

	getProgress: (activityId: number, token: string) =>
		api.get<ActivityProgress>(`/api/activities/${activityId}/progress`, token),

	startActivity: (activityId: number, token: string) =>
		api.post<ActivityProgress>(`/api/activities/${activityId}/progress`, {}, token),

	updateProgress: (activityId: number, data: ActivityProgressUpdate, token: string) =>
		api.put<ActivityProgress>(`/api/activities/${activityId}/progress`, data, token),

	resetProgress: (activityId: number, token: string) =>
		api.delete<void>(`/api/activities/${activityId}/progress`, token),
}
