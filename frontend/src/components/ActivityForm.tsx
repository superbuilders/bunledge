/**
 * Granular activity tracking form for testing different activity scenarios.
 */

export type ActivityState = 'idle' | 'active' | 'paused' | 'submitting' | 'submitted'

export interface ActivityConfig {
	activityId: string
	activityName: string
}

export interface CourseInfo {
	code: string
}

export interface ActivityMetrics {
	correctQuestions: number
	totalQuestions: number
	masteredUnits: number
	xpEarned: number | ''
}

export interface ActivityFormProps {
	state: ActivityState
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

function formatTime(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000)
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60
	return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function ActivityForm(props: ActivityFormProps) {
	const {
		state,
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
	} = props

	const isIdle = state === 'idle'
	const isActive = state === 'active'
	const isPaused = state === 'paused'
	const isSubmitting = state === 'submitting'
	const isSubmitted = state === 'submitted'
	const isRunning = isActive || isPaused

	const canEditConfig = isIdle
	const canEditMetrics = !isSubmitted && !isSubmitting

	const scorePercentage =
		metrics.totalQuestions > 0 ? Math.round((metrics.correctQuestions / metrics.totalQuestions) * 100) : 0

	const timeDisplay = formatTime(elapsedMs)

	return (
		<div className="space-y-5">
			{/* Status indicator */}
			<div className="flex items-center justify-between px-4 py-3 bg-zinc-50 rounded-xl">
				<div className="flex items-center gap-2">
					<div
						className={`h-2.5 w-2.5 rounded-full ${
							isSubmitted
								? 'bg-zinc-300'
								: isPaused
									? 'bg-amber-500'
									: isRunning
										? 'bg-emerald-500 animate-pulse'
										: 'bg-zinc-300'
						}`}
					/>
					<span className="text-sm font-medium text-zinc-600">
						{isSubmitted
							? 'Submitted'
							: isSubmitting
								? 'Submitting...'
								: isPaused
									? 'Paused'
									: isActive
										? 'Tracking'
										: 'Ready to start'}
					</span>
				</div>
				{isRunning && (
					<div className="flex items-baseline gap-1.5">
						<span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Score</span>
						<span className="text-sm font-bold text-zinc-700 font-mono">{scorePercentage}%</span>
					</div>
				)}
			</div>

			{/* Activity Configuration */}
			<div className="space-y-3">
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							Activity ID
						</label>
						<input
							type="text"
							value={config.activityId}
							onChange={e => onConfigChange({ activityId: e.target.value })}
							disabled={!canEditConfig}
							className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							Course
							<span className="ml-1.5 text-[9px] font-normal normal-case tracking-normal text-zinc-300">
								from config
							</span>
						</label>
						<input
							type="text"
							value={course.code}
							disabled
							className="w-full h-10 rounded-lg border border-dashed border-zinc-200 px-3 text-sm font-mono font-medium text-zinc-500 bg-zinc-50 cursor-not-allowed"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
						Activity Name
					</label>
					<input
						type="text"
						value={config.activityName}
						onChange={e => onConfigChange({ activityName: e.target.value })}
						disabled={!canEditConfig}
						className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100"
					/>
				</div>
			</div>

			{/* Metrics */}
			<div className="space-y-3">
				<div className="grid grid-cols-3 gap-3">
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							Correct
						</label>
						<input
							type="number"
							value={metrics.correctQuestions}
							onChange={e => onMetricsChange({ correctQuestions: Number(e.target.value) })}
							disabled={!canEditMetrics}
							min="0"
							className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Total</label>
						<input
							type="number"
							value={metrics.totalQuestions}
							onChange={e => onMetricsChange({ totalQuestions: Number(e.target.value) })}
							disabled={!canEditMetrics}
							min="1"
							className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100"
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Units</label>
						<input
							type="number"
							value={metrics.masteredUnits}
							onChange={e => onMetricsChange({ masteredUnits: Number(e.target.value) })}
							disabled={!canEditMetrics}
							min="0"
							className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100"
						/>
					</div>
				</div>

				<div className="space-y-1.5">
					<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
						XP Earned (optional)
					</label>
					<input
						type="number"
						value={metrics.xpEarned}
						onChange={e =>
							onMetricsChange({
								xpEarned: e.target.value === '' ? '' : Number(e.target.value),
							})
						}
						disabled={!canEditMetrics}
						placeholder="Auto-calculated"
						min="0"
						className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white disabled:opacity-50 disabled:bg-zinc-100 placeholder:text-zinc-400"
					/>
				</div>
			</div>

			{/* Actions */}
			<div className="pt-2">
				{isSubmitted ? (
					<div className="flex gap-2">
						<div className="flex-1 h-12 rounded-xl bg-emerald-100 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2">
							<span>✓</span>
							<span>Submitted</span>
						</div>
						<button
							onClick={onReset}
							className="h-12 px-5 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors"
						>
							New Activity
						</button>
					</div>
				) : (
					<div className="flex gap-2">
						{isIdle ? (
							<button
								onClick={onStart}
								disabled={!config.activityId}
								className="flex-1 h-12 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								Start Activity
							</button>
						) : (
							<>
								<button
									onClick={onEnd}
									disabled={isSubmitting}
									className={`flex-1 h-12 rounded-xl text-white font-semibold text-sm transition-colors disabled:opacity-50 ${
										isPaused ? 'bg-amber-500 hover:bg-amber-600' : 'bg-rose-600 hover:bg-rose-700'
									}`}
								>
									{isSubmitting ? 'Submitting...' : `End (${timeDisplay})`}
								</button>
								{!isSubmitting && (
									<button
										onClick={isPaused ? onResume : onPause}
										className="h-12 w-12 rounded-xl bg-white border border-zinc-200 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-center"
										aria-label={isPaused ? 'Resume' : 'Pause'}
									>
										{isPaused ? (
											<svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor">
												<path d="M0 0L14 8L0 16V0Z" />
											</svg>
										) : (
											<svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
												<rect width="4" height="14" />
												<rect x="8" width="4" height="14" />
											</svg>
										)}
									</button>
								)}
							</>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
