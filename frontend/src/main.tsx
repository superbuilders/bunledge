import { Auth0Provider } from '@auth0/auth0-react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Auth0Provider
			domain={auth0Domain}
			clientId={auth0ClientId}
			authorizationParams={{
				redirect_uri: window.location.origin,
				audience: auth0Audience,
			}}
		>
			<App />
		</Auth0Provider>
	</StrictMode>,
)
