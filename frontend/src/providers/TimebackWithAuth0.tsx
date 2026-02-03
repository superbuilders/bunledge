/**
 * Timeback Provider with Auth0 Integration
 *
 * Creates a TimebackClient that automatically attaches Auth0 Bearer tokens
 * to all Timeback API requests using the `bearer` plugin.
 */
import { useAuth0 } from '@auth0/auth0-react'
import { bearer, TimebackClient } from '@timeback/sdk/client'
import { TimebackProvider } from '@timeback/sdk/react'
import { useMemo } from 'react'

interface TimebackWithAuth0Props {
	children: React.ReactNode
}

/**
 * Wraps TimebackProvider with Auth0 token injection.
 *
 * Creates a TimebackClient configured with the `bearer` plugin
 * that fetches tokens from Auth0's `getAccessTokenSilently`.
 */
export function TimebackWithAuth0({ children }: TimebackWithAuth0Props) {
	const { getAccessTokenSilently, isAuthenticated } = useAuth0()

	const client = useMemo(() => {
		if (!isAuthenticated) return undefined

		return new TimebackClient({
			plugins: bearer({
				getToken: () => getAccessTokenSilently(),
			}),
		})
	}, [isAuthenticated, getAccessTokenSilently])

	return <TimebackProvider client={client}>{children}</TimebackProvider>
}
