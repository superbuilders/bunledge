/**
 * View shown when user is not authenticated.
 */

import { LoginHeader } from './LoginHeader'

export interface UnauthenticatedViewProps {
	onLogin: () => void
	onTimebackLaunch: () => void
}

export function UnauthenticatedView({ onLogin, onTimebackLaunch }: UnauthenticatedViewProps) {
	return (
		<div className="flex flex-col items-center justify-center py-6">
			<LoginHeader />
			<div className="w-full space-y-4">
				<button
					onClick={onLogin}
					className="w-full h-14 rounded-full bg-zinc-900 text-white font-semibold text-base hover:bg-zinc-800 transition-colors"
				>
					Log in
				</button>
				<button
					onClick={onTimebackLaunch}
					className="w-full h-14 rounded-full bg-white text-zinc-900 font-semibold text-base border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors"
				>
					Timeback launch URL → /timeback/signin
				</button>
				<p className="text-xs text-zinc-400 text-center">
					A simplified example using Auth0 React (PKCE) + Bearer tokens.
				</p>
			</div>
		</div>
	)
}
