import type { ActivityMetrics, ActivityState } from './AuthenticatedView'
import { formatTime } from '../lib/utils'

interface QuestionAnswererProps {
	state: ActivityState
	metrics: ActivityMetrics
	elapsedMs: number
	onStart: () => void
	onAnswer: (isCorrect: boolean) => void
	onPause: () => void
	onResume: () => void
	onEnd: () => void
	onReset: () => void
}

function formatScore(metrics: ActivityMetrics): string {
	if (metrics.totalQuestions === 0) return '0%'
	return `${Math.round((metrics.correctQuestions / metrics.totalQuestions) * 100)}%`
}

export function QuestionAnswerer({
	state,
	metrics,
	elapsedMs,
	onStart,
	onAnswer,
	onPause,
	onResume,
	onEnd,
	onReset,
}: QuestionAnswererProps) {
	const isIdle = state === 'idle'
	const isSubmitted = state === 'submitted'
	const isSubmitting = state === 'submitting'
	const isPaused = state === 'paused'
	const isActive = state === 'active' || isPaused

	const score = formatScore(metrics)

	if (isIdle) {
		return (
			<div className="space-y-6 text-center">
				<div className="text-sm font-medium text-zinc-500 italic">No active session</div>
				<button
					onClick={onStart}
					className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-lg shadow-zinc-200"
				>
					Start New Activity
				</button>
			</div>
		)
	}

	if (isSubmitted) {
		return (
			<div className="space-y-6">
				<div className="p-6 bg-emerald-50/50 rounded-3xl border border-emerald-100 text-center">
					<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mb-3">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="3"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="20 6 9 17 4 12" />
						</svg>
					</div>
					<div className="text-lg font-bold text-emerald-900">Activity Complete!</div>
					<div className="text-sm font-medium text-emerald-600 mt-1">
						Final Score: {metrics.correctQuestions}/{metrics.totalQuestions} ({score})
					</div>
				</div>
				<button
					onClick={onReset}
					className="w-full h-14 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all active:scale-[0.98]"
				>
					Start Another Activity
				</button>
			</div>
		)
	}

	return (
		<div className="space-y-8">
			{/* Stats Dashboard */}
			<div className="grid grid-cols-2 gap-4">
				<div className="px-5 py-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
					<div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Score</div>
					<div className="flex items-baseline gap-1.5">
						<span className="text-xl font-bold text-zinc-900">
							{metrics.correctQuestions}/{metrics.totalQuestions}
						</span>
						<span className="text-sm font-medium text-zinc-500">({score})</span>
					</div>
				</div>
				<div className="px-5 py-4 bg-zinc-50/50 rounded-2xl border border-zinc-100">
					<div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Time</div>
					<div className="text-xl font-bold text-zinc-900 font-mono tracking-tight">
						{formatTime(elapsedMs)}
					</div>
				</div>
			</div>

			<div className="space-y-4">
				{/* Primary Actions */}
				<div className="grid grid-cols-2 gap-4">
					<button
						onClick={() => onAnswer(true)}
						disabled={!isActive || isSubmitting}
						className="group relative h-28 rounded-4xl bg-white border-2 border-emerald-100 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md"
					>
						<div className="flex flex-col items-center gap-2">
							<div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							</div>
							<span className="text-xs font-black uppercase tracking-widest">Right</span>
						</div>
					</button>
					<button
						onClick={() => onAnswer(false)}
						disabled={!isActive || isSubmitting}
						className="group relative h-28 rounded-4xl bg-white border-2 border-rose-100 text-rose-600 hover:border-rose-500 hover:bg-rose-50/30 transition-all active:scale-[0.96] disabled:opacity-50 disabled:pointer-events-none shadow-sm hover:shadow-md"
					>
						<div className="flex flex-col items-center gap-2">
							<div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</div>
							<span className="text-xs font-black uppercase tracking-widest">Wrong</span>
						</div>
					</button>
				</div>

				{/* Secondary Actions */}
				<div className="pt-6 flex gap-3">
					<button
						onClick={onEnd}
						disabled={isSubmitting}
						className="flex-1 h-14 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-zinc-100"
					>
						<span>End Activity</span>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M5 12h14M12 5l7 7-7 7" />
						</svg>
					</button>
					<button
						onClick={isPaused ? onResume : onPause}
						disabled={isSubmitting}
						className={`h-14 w-14 rounded-2xl border-2 font-bold text-sm transition-all active:scale-[0.96] disabled:opacity-50 flex items-center justify-center ${
							isPaused
								? 'border-emerald-200 text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50'
								: 'border-amber-200 text-amber-600 hover:border-amber-400 hover:bg-amber-50'
						}`}
						aria-label={isPaused ? 'Resume' : 'Pause'}
					>
						{isPaused ? (
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<path d="M8 5v14l11-7z" />
							</svg>
						) : (
							<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
								<rect x="6" y="4" width="4" height="16" />
								<rect x="14" y="4" width="4" height="16" />
							</svg>
						)}
					</button>
				</div>
			</div>
		</div>
	)
}
