/**
 * Component that gates activity tracking based on verification status.
 */

import type { TimebackVerificationState } from '@timeback/sdk/react'
import {
	ActivityForm,
	type ActivityConfig,
	type ActivityMetrics,
	type ActivityState,
	type CourseInfo,
} from './ActivityForm'
import { Spinner } from './ui/Spinner'

export interface ActivityGateProps {
	timebackVerification: TimebackVerificationState
	isReady: boolean
	activityState: ActivityState
	elapsedMs: number
	course: CourseInfo
	config: ActivityConfig
	metrics: ActivityMetrics
	onConfigChange: (config: Partial<ActivityConfig>) => void
	onMetricsChange: (metrics: Partial<ActivityMetrics>) => void
	onStart: () => void
	onPause: () => void
	onResume: () => void
	onEnd: () => void
	onReset: () => void
}

export function ActivityGate({
	timebackVerification,
	isReady,
	activityState,
	elapsedMs,
	course,
	config,
	metrics,
	onConfigChange,
	onMetricsChange,
	onStart,
	onPause,
	onResume,
	onEnd,
	onReset,
}: ActivityGateProps) {
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

	if (isReady) {
		return (
			<ActivityForm
				state={activityState}
				elapsedMs={elapsedMs}
				course={course}
				config={config}
				metrics={metrics}
				onConfigChange={onConfigChange}
				onMetricsChange={onMetricsChange}
				onStart={onStart}
				onPause={onPause}
				onResume={onResume}
				onEnd={onEnd}
				onReset={onReset}
			/>
		)
	}

	return (
		<div className="flex items-center justify-center gap-3 py-8">
			<Spinner />
			<span className="text-zinc-400 text-sm">Loading activity tracker</span>
		</div>
	)
}
