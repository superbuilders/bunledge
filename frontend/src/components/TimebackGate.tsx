import type { ReactNode } from 'react'
import type { TimebackVerificationState } from '@timeback/sdk/react'

import { Spinner } from './ui/Spinner'

interface TimebackGateProps {
	timebackVerification: TimebackVerificationState
	isReady: boolean
	children: ReactNode
}

export function TimebackGate({ timebackVerification, isReady, children }: TimebackGateProps) {
	if (timebackVerification.status === 'unverified') {
		return (
			<div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
				<div className="font-semibold text-sm">Timeback account required</div>
				<div className="text-xs mt-1 text-amber-700">
					This app is free for Timeback users. Please sign in with an account that exists in Timeback.
				</div>
			</div>
		)
	}

	if (!isReady) {
		return (
			<div className="flex items-center justify-center gap-3 py-8">
				<Spinner />
				<span className="text-zinc-400 text-sm">Loading activity tracker</span>
			</div>
		)
	}

	return <>{children}</>
}
