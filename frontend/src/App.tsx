/**
 * Main App component.
 */

import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'

import { AuthenticatedView } from './components/AuthenticatedView'
import { UnauthenticatedView } from './components/UnauthenticatedView'

export function App() {
	const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0()
	const navigate = useNavigate()

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-zinc-50">
				<div className="text-zinc-400">Loading...</div>
			</div>
		)
	}

	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-[#fafafa] p-8 text-zinc-900">
			<main className="w-full max-w-lg rounded-[2.5rem] bg-white px-12 py-14 shadow-[0_24px_60px_rgba(0,0,0,0.04)] border border-zinc-100/80">
				{isAuthenticated ? (
					<AuthenticatedView
						onLogout={() => logout({ logoutParams: { returnTo: window.location.origin } })}
					/>
				) : (
					<UnauthenticatedView
						onLogin={() => loginWithRedirect()}
						onTimebackLaunch={() => navigate('/timeback/signin')}
					/>
				)}
			</main>
		</div>
	)
}

export default App
