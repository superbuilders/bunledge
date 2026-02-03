import { Auth0Provider } from '@auth0/auth0-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { TimebackSignIn } from './pages/TimebackSignIn.tsx'
import { TimebackWithAuth0 } from './providers/TimebackWithAuth0.tsx'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE

/**
 * Auth0 provider wrapper that integrates with React Router.
 * Handles redirect after login using appState.returnTo
 */
function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate()

	return (
		<Auth0Provider
			domain={auth0Domain}
			clientId={auth0ClientId}
			authorizationParams={{
				redirect_uri: window.location.origin,
				audience: auth0Audience,
			}}
			onRedirectCallback={appState => {
				navigate(appState?.returnTo || '/', { replace: true })
			}}
		>
			{children}
		</Auth0Provider>
	)
}

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<BrowserRouter>
			<Auth0ProviderWithNavigate>
				<TimebackWithAuth0>
					<Routes>
						<Route path="/" element={<App />} />
						<Route path="/timeback/signin" element={<TimebackSignIn />} />
					</Routes>
				</TimebackWithAuth0>
			</Auth0ProviderWithNavigate>
		</BrowserRouter>
	</StrictMode>,
)
