import { useEffect, useState } from 'react'
import type { User } from '../components/AuthenticatedHeader'

export function useCurrentUser(getAccessTokenSilently: () => Promise<string>) {
	const [user, setUser] = useState<User | undefined>(undefined)
	const [userError, setUserError] = useState<string | undefined>(undefined)

	useEffect(() => {
		let cancelled = false

		void (async () => {
			try {
				const token = await getAccessTokenSilently()
				if (cancelled) return

				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				})
				if (!res.ok) throw new Error(`/api/users/me failed (${res.status})`)

				const u = (await res.json()) as User
				if (!cancelled) setUser(u)
			} catch (err) {
				if (!cancelled) {
					setUserError(err instanceof Error ? err.message : 'Failed to fetch user')
				}
			}
		})()

		return () => {
			cancelled = true
		}
	}, [getAccessTokenSilently])

	return { user, userError }
}
