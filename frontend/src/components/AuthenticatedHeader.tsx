/**
 * Header component for authenticated view.
 */

import type { TimebackVerificationState } from '@timeback/sdk/react'
import { Spinner } from './ui/Spinner'

export interface User {
	id: number
	name?: string | null
	email?: string | null
}

export interface AuthenticatedHeaderProps {
	edgeUser?: User
	edgeError?: string
	launchedFromTimeback: boolean
	timebackVerification: TimebackVerificationState
	onOpenProfile: () => void
	onLogout: () => void
}

export function AuthenticatedHeader({
	edgeUser,
	edgeError,
	launchedFromTimeback,
	timebackVerification,
	onOpenProfile,
	onLogout,
}: AuthenticatedHeaderProps) {
	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-4">
				<h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Activity Demo</h1>
				<div className="flex items-center gap-4 shrink-0">
					<button
						onClick={onOpenProfile}
						className="px-5 py-2.5 text-sm font-medium text-zinc-700 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors whitespace-nowrap"
					>
						View Profile
					</button>
					<button
						onClick={onLogout}
						className="text-sm text-zinc-400 hover:text-zinc-600 transition-colors whitespace-nowrap"
					>
						Sign out
					</button>
				</div>
			</div>
			<div className="flex items-center gap-2">
				{edgeUser ? (
					<p className="text-zinc-400 text-lg">{edgeUser.name ?? edgeUser.email ?? `User #${edgeUser.id}`}</p>
				) : (
					<Spinner color="text-zinc-300" />
				)}
				{launchedFromTimeback && (
					<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
						<svg
							width="10"
							height="10"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<polyline points="12 6 12 12 16 14" />
						</svg>
						Timeback
					</span>
				)}
			</div>
			{edgeError && <p className="text-sm text-red-500">{edgeError}</p>}
			{timebackVerification.status === 'error' && (
				<p className="text-sm text-red-500">{timebackVerification.message}</p>
			)}
		</div>
	)
}
