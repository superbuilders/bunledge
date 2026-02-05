import { useEffect, useState } from 'react'

import { SimpleModal } from './SimpleModal'
import { formatTime } from '../lib/utils'

interface ActivityMetrics {
	correctQuestions: number
	totalQuestions: number
	masteredUnits: number
	xpEarned: number
}

interface EndActivityModalProps {
	open: boolean
	activityName: string
	metrics: ActivityMetrics
	elapsedMs: number
	onClose: () => void
	onSubmit: (metrics: ActivityMetrics) => void
}

export function EndActivityModal({
	open,
	activityName,
	metrics,
	elapsedMs,
	onClose,
	onSubmit,
}: EndActivityModalProps) {
	const [draftMetrics, setDraftMetrics] = useState<ActivityMetrics>(metrics)

	useEffect(() => {
		if (open) {
			setDraftMetrics(metrics)
		}
	}, [open, metrics])

	return (
		<SimpleModal open={open} title="End Activity" onClose={onClose}>
			<div className="space-y-5">
				<div className="space-y-1.5">
					<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
						Activity
					</label>
					<div className="px-3 py-2 rounded-lg bg-zinc-50 text-sm font-medium text-zinc-700">
						{activityName}
					</div>
				</div>

				<div className="flex items-center justify-between px-4 py-3 bg-zinc-50 rounded-xl">
					<div className="text-sm font-medium text-zinc-600">Elapsed</div>
					<div className="text-sm font-semibold text-zinc-700 font-mono">{formatTime(elapsedMs)}</div>
				</div>

				<div className="space-y-3">
					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1.5">
							<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
								Correct
							</label>
							<input
								type="number"
								value={draftMetrics.correctQuestions}
								onChange={e =>
									setDraftMetrics(prev => ({ ...prev, correctQuestions: Number(e.target.value) }))
								}
								min="0"
								className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
								Total
							</label>
							<input
								type="number"
								value={draftMetrics.totalQuestions}
								onChange={e =>
									setDraftMetrics(prev => ({ ...prev, totalQuestions: Number(e.target.value) }))
								}
								min="0"
								className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white"
							/>
						</div>
						<div className="space-y-1.5">
							<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
								Units
							</label>
							<input
								type="number"
								value={draftMetrics.masteredUnits}
								onChange={e =>
									setDraftMetrics(prev => ({ ...prev, masteredUnits: Number(e.target.value) }))
								}
								min="0"
								className="w-full h-12 rounded-lg border border-zinc-200 px-3 text-lg font-semibold text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white"
							/>
						</div>
					</div>

					<div className="space-y-1.5">
						<label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
							XP Earned
						</label>
						<input
							type="number"
							value={draftMetrics.xpEarned}
							onChange={e =>
								setDraftMetrics(prev => ({
									...prev,
									xpEarned: Number(e.target.value),
								}))
							}
							min="0"
							className="w-full h-10 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-900 bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:bg-white"
						/>
					</div>
				</div>

				<div className="flex gap-2 pt-2">
					<button
						onClick={onClose}
						className="flex-1 h-12 rounded-xl bg-zinc-100 text-zinc-700 font-semibold text-sm hover:bg-zinc-200 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={() => onSubmit(draftMetrics)}
						className="flex-1 h-12 rounded-xl bg-zinc-900 text-white font-semibold text-sm hover:bg-zinc-800 transition-colors"
					>
						Submit Activity
					</button>
				</div>
			</div>
		</SimpleModal>
	)
}
