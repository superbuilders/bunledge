import type { Activity, ActivityProgress } from '../lib/api'

export interface HomeViewProps {
	activities: Activity[]
	progressMap: Map<number, ActivityProgress>
	onSelectActivity: (activity: Activity) => void
	onCreateActivity: () => void
}

function getStatusLabel(progress: ActivityProgress | undefined): string {
	if (!progress) return 'Not started'
	switch (progress.status) {
		case 'in_progress':
			return 'In progress'
		case 'paused':
			return 'Paused'
		case 'completed':
			return 'Completed'
		default:
			return 'Not started'
	}
}

function getStatusColor(progress: ActivityProgress | undefined): string {
	if (!progress) return 'bg-gray-100 text-gray-600'
	switch (progress.status) {
		case 'in_progress':
			return 'bg-blue-100 text-blue-700'
		case 'paused':
			return 'bg-yellow-100 text-yellow-700'
		case 'completed':
			return 'bg-green-100 text-green-700'
		default:
			return 'bg-gray-100 text-gray-600'
	}
}

export function HomeView({ activities, progressMap, onSelectActivity, onCreateActivity }: HomeViewProps) {
	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<h2 className="text-xl font-semibold text-gray-800">Your Activities</h2>
				<button
					onClick={onCreateActivity}
					className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
				>
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
						<line x1="12" y1="5" x2="12" y2="19" />
						<line x1="5" y1="12" x2="19" y2="12" />
					</svg>
					New
				</button>
			</div>

			{activities.length === 0 ? (
				<div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
					<p className="text-gray-500 mb-4">No activities yet.</p>
					<button
						onClick={onCreateActivity}
						className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 transition-colors"
					>
						Create your first activity
					</button>
				</div>
			) : (
				<div className="space-y-3">
					{activities.map(activity => {
						const progress = progressMap.get(activity.id)
						return (
							<button
								key={activity.id}
								onClick={() => onSelectActivity(activity)}
								className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
							>
								<div className="flex items-center justify-between">
									<div>
										<h3 className="font-medium text-gray-900">{activity.name}</h3>
										<p className="text-sm text-gray-500">{activity.course_code}</p>
									</div>
									<span
										className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(progress)}`}
									>
										{getStatusLabel(progress)}
									</span>
								</div>
							{progress && progress.total_questions > 0 && (
								<div className="mt-2 text-sm text-gray-600">
									{progress.correct_questions}/{progress.total_questions} correct
								</div>
							)}
							{progress?.run_id && (
								<div className="mt-1 text-xs text-zinc-400 font-mono">
									runId: {progress.run_id.slice(0, 8)}...
								</div>
							)}
						</button>
						)
					})}
				</div>
			)}
		</div>
	)
}
