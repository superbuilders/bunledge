/**
 * Modal component displaying user profile information.
 */

import type { TimebackProfile } from '@timeback/sdk/client'
import type { TimebackVerificationState } from '@timeback/sdk/react'
import { SimpleModal } from './SimpleModal'
import type { User } from './AuthenticatedHeader'

export interface ProfileModalProps {
	open: boolean
	onClose: () => void
	timebackVerification: TimebackVerificationState
	edgeUser?: User
	profile?: TimebackProfile
	profileLoading: boolean
	profileError?: string
	canFetchProfile: boolean
	onFetchProfile: () => void
}

export function ProfileModal({
	open,
	onClose,
	timebackVerification,
	edgeUser,
	profile,
	profileLoading,
	profileError,
	canFetchProfile,
	onFetchProfile,
}: ProfileModalProps) {
	return (
		<SimpleModal open={open} title="Auth0/Bearer user" onClose={onClose}>
			<div className="space-y-8">
				<div className="space-y-2">
					<div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
						/api/timeback/user/verify
					</div>
					<pre className="text-sm bg-zinc-900 text-zinc-100 p-5 rounded-2xl overflow-auto max-h-40 font-mono">
						{JSON.stringify(timebackVerification, null, 2)}
					</pre>
				</div>

				<div className="space-y-4">
					<div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">/api/users/me</div>
					<pre className="text-sm bg-zinc-900 text-zinc-100 p-5 rounded-2xl overflow-auto max-h-60 font-mono">
						{JSON.stringify(edgeUser, null, 2)}
					</pre>
				</div>

				<div className="space-y-4 pt-4 border-t border-zinc-100">
					<div className="flex items-center justify-between">
						<div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
							Timeback Profile
						</div>
						<button
							onClick={onFetchProfile}
							disabled={!canFetchProfile || profileLoading}
							className="px-4 py-2 text-sm font-medium text-zinc-700 rounded-full border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 transition-colors disabled:opacity-50"
						>
							{profileLoading ? 'Loading...' : profile ? 'Refresh' : 'Fetch'}
						</button>
					</div>

					{timebackVerification.status === 'unverified' && (
						<p className="text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-xl">
							This account is not a Timeback user, so Timeback features are disabled.
						</p>
					)}

					{profileError && (
						<p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-xl">{profileError}</p>
					)}

					{profile && (
						<pre className="text-sm bg-zinc-50 text-zinc-700 p-5 rounded-2xl overflow-auto max-h-60 font-mono">
							{JSON.stringify(profile, null, 2)}
						</pre>
					)}
				</div>
			</div>
		</SimpleModal>
	)
}
