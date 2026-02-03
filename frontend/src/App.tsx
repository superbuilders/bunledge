import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'
import { api } from './api'

interface UserResponse {
	id: number
	email: string | null
	name: string | null
	auth0_sub: string
	created_at: string
}

function App() {
	const { isAuthenticated, isLoading, user, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()
	const [apiResponse, setApiResponse] = useState<UserResponse | null>(null)
	const [apiLoading, setApiLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const callProtectedApi = async () => {
		setApiLoading(true)
		setError(null)
		try {
			const token = await getAccessTokenSilently()
			const data = await api.get<UserResponse>('/api/users/me', token)
			setApiResponse(data)
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setApiLoading(false)
		}
	}

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<p className="text-lg">Loading...</p>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
			<h1 className="text-3xl font-bold">Bunledge</h1>

			{!isAuthenticated ? (
				<button
					onClick={() => loginWithRedirect()}
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
				>
					Log In
				</button>
			) : (
				<>
					<div className="text-center">
						<p className="text-lg">Welcome, {user?.name || user?.email}!</p>
						<p className="text-sm text-gray-600">{user?.email}</p>
					</div>

					<div className="flex gap-4">
						<button
							onClick={callProtectedApi}
							disabled={apiLoading}
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
						>
							{apiLoading ? 'Loading...' : 'Get My Profile (API)'}
						</button>
						<button
							onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
							className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
						>
							Log Out
						</button>
					</div>

					{error && <p className="text-red-500">Error: {error}</p>}

					{apiResponse && (
						<div className="p-4 bg-gray-100 rounded max-w-md">
							<h3 className="font-semibold mb-2">API Response (from database):</h3>
							<pre className="text-sm overflow-auto">{JSON.stringify(apiResponse, null, 2)}</pre>
						</div>
					)}
				</>
			)}
		</div>
	)
}

export default App
