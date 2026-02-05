/**
 * View shown when user is authenticated.
 *
 * Demonstrates resumable activities with runId correlation:
 * 1. Home view shows list of activities with their status
 * 2. Selecting an activity starts/resumes it with the same runId
 * 3. Progress is saved to backend including runId
 * 4. Activity completion is handled client-side via activity.end(metrics)
 *    which sends to /api/timeback/activity/submit — no backend activity.record()
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { type Activity, useTimeback, useTimebackVerification, useTimebackProfile } from '@timeback/sdk/react'

import { AuthenticatedHeader } from './AuthenticatedHeader'
import { ProfileModal } from './ProfileModal'
import { EndActivityModal } from './EndActivityModal'
import { QuestionAnswerer } from './QuestionAnswerer'
import { HomeView } from './HomeView'
import { TimebackGate } from './TimebackGate'
import { useTimebackLaunchFlag } from '../hooks/useTimebackLaunchFlag'
import { useCurrentUser } from '../hooks/useCurrentUser'
import {
	activityApi,
	type Activity as BackendActivity,
	type ActivityProgress,
	type ActivityProgressUpdate,
} from '../lib/api'

export type AppView = 'home' | 'activity'
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
	xpEarned: number
}

/**
 * Course info from timeback.config.json.
 */
const COURSE: CourseInfo = { code: 'BUNLEDGE-V0-MATH' }

export interface AuthenticatedViewProps {
	onLogout: () => void
}

export function AuthenticatedView({ onLogout }: AuthenticatedViewProps) {
	const { getAccessTokenSilently } = useAuth0()
	const { user, userError } = useCurrentUser(getAccessTokenSilently)

	const [isUserModalOpen, setIsUserModalOpen] = useState(false)

	const timeback = useTimeback()
	const { state: timebackVerification } = useTimebackVerification()
	const launchedFromTimeback = useTimebackLaunchFlag()
	const { state: profileState, canFetch, fetchProfile } = useTimebackProfile()

	const profile = profileState.status === 'loaded' ? profileState.profile : undefined
	const profileLoading = profileState.status === 'loading'
	const profileError = profileState.status === 'error' ? profileState.message : undefined

	const [view, setView] = useState<AppView>('home')
	const [allActivities, setAllActivities] = useState<BackendActivity[]>([])
	const [allProgress, setAllProgress] = useState<ActivityProgress[]>([])

	const [backendActivity, setBackendActivity] = useState<BackendActivity | undefined>(undefined)
	const [backendProgress, setBackendProgress] = useState<ActivityProgress | undefined>(undefined)
	const [activity, setActivity] = useState<Activity | undefined>(undefined)
	const [activityState, setActivityState] = useState<ActivityState>('idle')
	const [elapsedMs, setElapsedMs] = useState(0)
	const [windowMs, setWindowMs] = useState(0)

	const [config, setConfig] = useState<ActivityConfig>({
		activityId: 'bunledge_lesson_1',
		activityName: 'Introduction to Bunledge - Lesson 1',
	})

	const [metrics, setMetrics] = useState<ActivityMetrics>({
		correctQuestions: 0,
		totalQuestions: 0,
		masteredUnits: 0,
		xpEarned: 0,
	})

	const [isEndModalOpen, setIsEndModalOpen] = useState(false)

	// Load all activities and progress on mount
	useEffect(() => {
		async function loadData() {
			try {
				const token = await getAccessTokenSilently()
				const [activities, progress] = await Promise.all([
					activityApi.listActivities(token),
					activityApi.listMyProgress(token),
				])
				setAllActivities(activities)
				setAllProgress(progress)
			} catch (err) {
				console.error('Failed to load activities:', err)
			}
		}
		loadData()
	}, [getAccessTokenSilently])

	// Poll elapsed time from the SDK activity
	useEffect(() => {
		if (!activity) return
		if (activityState !== 'active' && activityState !== 'paused') return

		const interval = setInterval(() => {
			setElapsedMs(activity.totalActiveMs)
			setWindowMs(activity.elapsedMs)
		}, 100)

		return () => clearInterval(interval)
	}, [activity, activityState])

	const saveProgressToBackend = useCallback(
		async (update: ActivityProgressUpdate) => {
			if (!backendActivity) return

			try {
				const token = await getAccessTokenSilently()
				const updated = await activityApi.updateProgress(backendActivity.id, update, token)
				setBackendProgress(updated)
			} catch (err) {
				console.error('Failed to save progress:', err)
			}
		},
		[backendActivity, getAccessTokenSilently],
	)

	// Auto-start SDK activity when backend progress exists but no SDK activity
	useEffect(() => {
		if (!timeback || timebackVerification.status !== 'verified') return
		if (activity) return
		if (!backendProgress) return
		if (activityState === 'idle' || activityState === 'submitted') return

		// Pass existing runId to correlate events across sessions
		const a = timeback.activity.start({
			id: config.activityId,
			name: config.activityName,
			course: { code: COURSE.code },
			runId: backendProgress.run_id ?? undefined,
		})

		setActivity(a)
		setActivityState('active')
		void saveProgressToBackend({ status: 'in_progress', run_id: a.runId })
	}, [
		activity,
		activityState,
		backendProgress,
		config.activityId,
		config.activityName,
		saveProgressToBackend,
		timeback,
		timebackVerification.status,
	])

	const handleAnswerQuestion = useCallback(
		(isCorrect: boolean) => {
			if (activityState !== 'active' && activityState !== 'paused') return

			const nextTotal = metrics.totalQuestions + 1
			const nextCorrect = metrics.correctQuestions + (isCorrect ? 1 : 0)

			setMetrics(prev => ({
				...prev,
				totalQuestions: nextTotal,
				correctQuestions: nextCorrect,
			}))

			void saveProgressToBackend({
				status: 'in_progress',
				total_questions: nextTotal,
				correct_questions: nextCorrect,
				mastered_units: metrics.masteredUnits,
				xp_earned: metrics.xpEarned,
				elapsed_ms: activity?.totalActiveMs ?? elapsedMs,
			})
		},
		[
			activity,
			activityState,
			elapsedMs,
			metrics.correctQuestions,
			metrics.masteredUnits,
			metrics.totalQuestions,
			metrics.xpEarned,
			saveProgressToBackend,
		],
	)

	const handleStart = useCallback(async () => {
		if (!timeback) return
		if (timebackVerification.status !== 'verified') return
		if (activityState !== 'idle') return

		try {
			const token = await getAccessTokenSilently()

			let activityDef: BackendActivity
			const activities = await activityApi.listActivities(token)
			const existing = activities.find(a => a.activity_id === config.activityId)

			if (existing) {
				activityDef = existing
			} else {
				activityDef = await activityApi.createActivity(
					{
						activity_id: config.activityId,
						name: config.activityName,
						course_code: COURSE.code,
					},
					token,
				)
			}

			const progress = await activityApi.startActivity(activityDef.id, token)
			setBackendActivity(activityDef)
			setBackendProgress(progress)

			// Start SDK activity — heartbeats begin automatically
			const a = timeback.activity.start({
				id: config.activityId,
				name: config.activityName,
				course: { code: COURSE.code },
				runId: progress.run_id ?? undefined,
			})

			// Store the runId in backend for future correlation
			await activityApi.updateProgress(activityDef.id, { run_id: a.runId }, token)

			setActivity(a)
			setActivityState('active')
			setElapsedMs(0)
			setWindowMs(0)
			setMetrics({
				correctQuestions: 0,
				totalQuestions: 0,
				masteredUnits: 0,
				xpEarned: 0,
			})
		} catch (err) {
			console.error('Failed to start activity:', err)
		}
	}, [timeback, timebackVerification.status, activityState, config, getAccessTokenSilently])

	const handleOpenEndModal = useCallback(() => {
		if (activityState === 'active' || activityState === 'paused') {
			setIsEndModalOpen(true)
		}
	}, [activityState])

	const handlePause = useCallback(async () => {
		if (!activity || activityState !== 'active') return

		activity.pause()
		setActivityState('paused')

		await saveProgressToBackend({
			status: 'paused',
			elapsed_ms: activity.totalActiveMs,
			correct_questions: metrics.correctQuestions,
			total_questions: metrics.totalQuestions,
			mastered_units: metrics.masteredUnits,
			xp_earned: metrics.xpEarned,
		})
	}, [activity, activityState, metrics, saveProgressToBackend])

	const handleResume = useCallback(async () => {
		if (!activity || activityState !== 'paused') return

		activity.resume()
		setActivityState('active')

		await saveProgressToBackend({ status: 'in_progress' })
	}, [activity, activityState, saveProgressToBackend])

	/**
	 * Submit and end the activity.
	 *
	 * 1. Flush remaining time via activity.end() (time-only, no completion event)
	 * 2. Save final state to backend with status='completed'
	 * 3. Backend calls timeback.activity.record() to emit the ActivityCompletedEvent
	 */
	const handleConfirmEnd = useCallback(
		async (finalMetrics: ActivityMetrics) => {
			if (!activity) return
			if (activityState !== 'active' && activityState !== 'paused') return

			setActivityState('submitting')
			setIsEndModalOpen(false)

			try {
				/**
				 * Attempt to flush any remaining time to Timeback.
				 *
				 * This does not emit a completion event; it simply ensures that the most accurate
				 * total time-on-task has been sent upstream before finalizing the activity.
				 * If this fails, the error is caught, as this is a best-effort operation.
				 */
				try {
					await activity.end()
				} catch (err) {
					console.warn('Failed to flush time to Timeback:', err)
				}

				/**
				 * Save the final state of the user's activity progress to the backend.
				 *
				 * This action triggers the backend to record the activity completion event
				 * using timeback.activity.record(), ensuring both metrics and completion
				 * status are stored for analytics and progress tracking.
				 *
				 * All relevant metrics are included to persist an accurate summary of
				 * the user's session at the moment they end the activity.
				 */
				await saveProgressToBackend({
					status: 'completed',
					elapsed_ms: activity.totalActiveMs,
					correct_questions: finalMetrics.correctQuestions,
					total_questions: finalMetrics.totalQuestions,
					mastered_units: finalMetrics.masteredUnits,
					xp_earned: finalMetrics.xpEarned,
				})

				setMetrics(finalMetrics)
				setActivityState('submitted')
			} catch (error) {
				console.error('Failed to end activity:', error)
				setActivityState('active')
			}
		},
		[activity, activityState, saveProgressToBackend],
	)

	const handleReset = useCallback(async () => {
		if (backendActivity) {
			try {
				const token = await getAccessTokenSilently()
				await activityApi.resetProgress(backendActivity.id, token)
			} catch (err) {
				console.error('Failed to reset progress:', err)
			}
		}

		setActivity(undefined)
		setBackendActivity(undefined)
		setBackendProgress(undefined)
		setActivityState('idle')
		setElapsedMs(0)
		setWindowMs(0)
		setMetrics({
			correctQuestions: 0,
			totalQuestions: 0,
			masteredUnits: 0,
			xpEarned: 0,
		})
	}, [backendActivity, getAccessTokenSilently])

	/**
	 * Go back to home, saving progress.
	 *
	 * Calls activity.end() without metrics — time-only flush, no completion event.
	 */
	const handleGoHome = useCallback(async () => {
		if (activity && (activityState === 'active' || activityState === 'paused')) {
			// Flush time only (no completion event)
			try {
				await activity.end()
			} catch (err) {
				console.warn('Failed to flush time to Timeback:', err)
			}

			await saveProgressToBackend({
				status: 'paused',
				elapsed_ms: activity.totalActiveMs,
				correct_questions: metrics.correctQuestions,
				total_questions: metrics.totalQuestions,
				mastered_units: metrics.masteredUnits,
				xp_earned: metrics.xpEarned,
			})
		}

		try {
			const token = await getAccessTokenSilently()
			const progress = await activityApi.listMyProgress(token)
			setAllProgress(progress)
		} catch (err) {
			console.error('Failed to reload progress:', err)
		}

		setActivity(undefined)
		setBackendActivity(undefined)
		setBackendProgress(undefined)
		setActivityState('idle')
		setElapsedMs(0)
		setWindowMs(0)
		setMetrics({ correctQuestions: 0, totalQuestions: 0, masteredUnits: 0, xpEarned: 0 })
		setView('home')
	}, [activity, activityState, metrics, saveProgressToBackend, getAccessTokenSilently])

	const handleSelectActivity = useCallback(
		async (selectedActivity: BackendActivity) => {
			if (!timeback || timebackVerification.status !== 'verified') return

			try {
				const token = await getAccessTokenSilently()

				// Start or resume progress
				await activityApi.startActivity(selectedActivity.id, token)
				const updatedProgress = await activityApi.updateProgress(
					selectedActivity.id,
					{ status: 'in_progress' },
					token,
				)

				setBackendActivity(selectedActivity)
				setBackendProgress(updatedProgress)
				setConfig({
					activityId: selectedActivity.activity_id,
					activityName: selectedActivity.name,
				})

				// Restore metrics from progress
				setMetrics({
					correctQuestions: updatedProgress.correct_questions,
					totalQuestions: updatedProgress.total_questions,
					masteredUnits: updatedProgress.mastered_units,
					xpEarned: updatedProgress.xp_earned ?? 0,
				})
				setElapsedMs(updatedProgress.elapsed_ms)

				// Start SDK activity — pass existing runId for correlation
				const a = timeback.activity.start({
					id: selectedActivity.activity_id,
					name: selectedActivity.name,
					course: { code: COURSE.code },
					runId: updatedProgress.run_id ?? undefined,
				})

				// Store the (possibly new) runId in backend
				await activityApi.updateProgress(selectedActivity.id, { run_id: a.runId }, token)

				setActivity(a)
				setActivityState('active')
				setView('activity')
			} catch (err) {
				console.error('Failed to start activity:', err)
			}
		},
		[timeback, timebackVerification.status, getAccessTokenSilently],
	)

	const handleCreateActivity = useCallback(async () => {
		if (!timeback || timebackVerification.status !== 'verified') return

		try {
			const token = await getAccessTokenSilently()

			// Create a new activity with a unique ID
			const newId = `lesson_${Date.now()}`
			const newActivity = await activityApi.createActivity(
				{
					activity_id: newId,
					name: `Lesson ${allActivities.length + 1}`,
					course_code: COURSE.code,
				},
				token,
			)

			// Refresh the activities list
			const activities = await activityApi.listActivities(token)
			setAllActivities(activities)

			// Start the new activity
			await handleSelectActivity(newActivity)
		} catch (err) {
			console.error('Failed to create activity:', err)
		}
	}, [timeback, timebackVerification.status, getAccessTokenSilently, allActivities.length, handleSelectActivity])

	const isReady = timebackVerification.status === 'verified' && !!timeback

	return (
		<div className="space-y-8">
			<AuthenticatedHeader
				user={user}
				userError={userError}
				launchedFromTimeback={launchedFromTimeback}
				timebackVerification={timebackVerification}
				onOpenProfile={() => setIsUserModalOpen(true)}
				onLogout={onLogout}
			/>

			<ProfileModal
				open={isUserModalOpen}
				onClose={() => setIsUserModalOpen(false)}
				timebackVerification={timebackVerification}
				user={user}
				profile={profile}
				profileLoading={profileLoading}
				profileError={profileError}
				canFetchProfile={canFetch}
				onFetchProfile={fetchProfile}
			/>

			<TimebackGate timebackVerification={timebackVerification} isReady={isReady}>
				{view === 'home' ? (
					<HomeView
						activities={allActivities}
						progressMap={new Map(allProgress.map(p => [p.activity_id, p]))}
						onSelectActivity={handleSelectActivity}
						onCreateActivity={handleCreateActivity}
					/>
				) : (
					<>
						<QuestionAnswerer
							state={activityState}
							metrics={metrics}
							elapsedMs={elapsedMs}
							windowMs={windowMs}
							runId={activity?.runId}
							onStart={handleStart}
							onAnswer={handleAnswerQuestion}
							onPause={handlePause}
							onResume={handleResume}
							onEnd={handleOpenEndModal}
							onReset={handleReset}
							onGoHome={handleGoHome}
						/>
						{backendActivity && (
							<EndActivityModal
								open={isEndModalOpen}
								activityName={backendActivity.name}
								metrics={metrics}
								elapsedMs={elapsedMs}
								onClose={() => setIsEndModalOpen(false)}
								onSubmit={handleConfirmEnd}
							/>
						)}
					</>
				)}
			</TimebackGate>
		</div>
	)
}
