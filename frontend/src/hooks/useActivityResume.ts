import { useEffect, useRef } from 'react'
import { activityApi, type Activity as BackendActivity, type ActivityProgress } from '../lib/api'

type ActivityState = 'idle' | 'active' | 'paused' | 'submitting' | 'submitted'

interface ActivityConfig {
	activityId: string
	activityName: string
}

interface ActivityMetrics {
	correctQuestions: number
	totalQuestions: number
	masteredUnits: number
	xpEarned: number | ''
}

interface UseActivityResumeArgs {
	getAccessTokenSilently: () => Promise<string>
	setBackendActivity: (activity: BackendActivity | undefined) => void
	setBackendProgress: (progress: ActivityProgress | undefined) => void
	setConfig: (config: ActivityConfig) => void
	setMetrics: (metrics: ActivityMetrics) => void
	setElapsedMs: (elapsedMs: number) => void
	setActivityState: (state: ActivityState) => void
	backendStatusToFrontend: (status: ActivityProgress['status']) => ActivityState
}

export function useActivityResume({
	getAccessTokenSilently,
	setBackendActivity,
	setBackendProgress,
	setConfig,
	setMetrics,
	setElapsedMs,
	setActivityState,
	backendStatusToFrontend,
}: UseActivityResumeArgs) {
	const initialLoadDone = useRef(false)

	useEffect(() => {
		if (initialLoadDone.current) return

		let cancelled = false

		void (async () => {
			try {
				const token = await getAccessTokenSilently()
				if (cancelled) return

				const progressList = await activityApi.listMyProgress(token)
				if (cancelled) return

				const activeProgress = progressList.find(p => p.status === 'in_progress' || p.status === 'paused')

				if (activeProgress) {
					const activities = await activityApi.listActivities(token)
					const activityDef = activities.find(a => a.id === activeProgress.activity_id)

					if (activityDef && !cancelled) {
						setBackendActivity(activityDef)
						setBackendProgress(activeProgress)
						setConfig({
							activityId: activityDef.activity_id,
							activityName: activityDef.name,
						})
						setMetrics({
							correctQuestions: activeProgress.correct_questions,
							totalQuestions: activeProgress.total_questions,
							masteredUnits: activeProgress.mastered_units,
							xpEarned: activeProgress.xp_earned ?? '',
						})
						setElapsedMs(activeProgress.elapsed_ms)
						setActivityState(backendStatusToFrontend(activeProgress.status))
					}
				}

				initialLoadDone.current = true
			} catch (err) {
				console.error('Failed to load activity progress:', err)
				initialLoadDone.current = true
			}
		})()

		return () => {
			cancelled = true
		}
	}, [
		backendStatusToFrontend,
		getAccessTokenSilently,
		setActivityState,
		setBackendActivity,
		setBackendProgress,
		setConfig,
		setElapsedMs,
		setMetrics,
	])
}
