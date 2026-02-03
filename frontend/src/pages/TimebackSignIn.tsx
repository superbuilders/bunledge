import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * Timeback Sign In Page
 *
 * This page serves as the launch URL for Timeback integration.
 * When users are launched from an LMS or Timeback, they land here
 * and are automatically redirected to Auth0 for authentication.
 *
 * Flow:
 * 1. LMS/Timeback launches user to /timeback/signin
 * 2. If not authenticated → redirect to Auth0
 * 3. After Auth0 callback → redirect to main app (or specified return URL)
 */
export function TimebackSignIn() {
	const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()

	// Get optional return URL from query params
	const returnTo = searchParams.get('return_to') || '/'

	useEffect(() => {
		if (isLoading) return

		if (isAuthenticated) {
			// Already logged in - redirect to the app
			navigate(returnTo, { replace: true })
		} else {
			// Not logged in - trigger Auth0 login
			// After login, Auth0 will redirect back to origin, then we'll land here again
			// but this time isAuthenticated will be true
			loginWithRedirect({
				appState: { returnTo },
			})
		}
	}, [isAuthenticated, isLoading, loginWithRedirect, navigate, returnTo])

	// Show loading state while checking auth or redirecting
	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
			<p className="text-gray-600">Signing you in...</p>
		</div>
	)
}
