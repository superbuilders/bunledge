/**
 * Timeback Sign In Page
 *
 * This page serves as the launch URL for Timeback integration.
 * When users are launched from an LMS or Timeback, they land here
 * and are automatically redirected to Auth0 for authentication.
 */

import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function TimebackSignIn() {
	const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()
	const navigate = useNavigate()

	useEffect(() => {
		if (isLoading) return

		if (isAuthenticated) {
			navigate('/', { replace: true })
		} else {
			loginWithRedirect({
				appState: { returnTo: '/', launch: 'timeback' },
			})
		}
	}, [isAuthenticated, isLoading, loginWithRedirect, navigate])

	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50">
			<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-600" />
			<p className="text-zinc-400">Signing you in...</p>
		</div>
	)
}
