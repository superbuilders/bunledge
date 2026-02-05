/**
 * View shown when user is authenticated.
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
	xpEarned: number | ''
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

	const [config, setConfig] = useState<ActivityConfig>({
		activityId: 'bunledge_lesson_1',
		activityName: 'Introduction to Bunledge - Lesson 1',
	})

	const [metrics, setMetrics] = useState<ActivityMetrics>({
		correctQuestions: 0,
		totalQuestions: 0,
		masteredUnits: 0,
		xpEarned: '',
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

	useEffect(() => {
		if (!activity) return
		if (activityState !== 'active' && activityState !== 'paused') return

		const interval = setInterval(() => {
			setElapsedMs(activity.elapsedMs)
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

	useEffect(() => {
		if (!timeback || timebackVerification.status !== 'verified') return
		if (activity) return
		if (!backendProgress) return
		if (activityState === 'idle' || activityState === 'submitted') return

		const a = timeback.activity.start({
			id: config.activityId,
			name: config.activityName,
			course: { code: COURSE.code },
		})

		setActivity(a)
		setActivityState('active')
		void saveProgressToBackend({ status: 'in_progress' })
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
				...(metrics.xpEarned !== '' && { xp_earned: metrics.xpEarned as number }),
				elapsed_ms: activity?.elapsedMs ?? elapsedMs,
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

			const a = timeback.activity.start({
				id: config.activityId,
				name: config.activityName,
				course: { code: COURSE.code },
			})

			setActivity(a)
			setActivityState('active')
			setElapsedMs(0)
			setMetrics({
				correctQuestions: 0,
				totalQuestions: 0,
				masteredUnits: 0,
				xpEarned: '',
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
			elapsed_ms: activity.elapsedMs,
			correct_questions: metrics.correctQuestions,
			total_questions: metrics.totalQuestions,
			mastered_units: metrics.masteredUnits,
			...(metrics.xpEarned !== '' && { xp_earned: metrics.xpEarned as number }),
		})
	}, [activity, activityState, metrics, saveProgressToBackend])

	const handleResume = useCallback(async () => {
		if (!activity || activityState !== 'paused') return

		activity.resume()
		setActivityState('active')

		await saveProgressToBackend({ status: 'in_progress' })
	}, [activity, activityState, saveProgressToBackend])

	const handleConfirmEnd = useCallback(
		async (finalConfig: ActivityConfig, finalMetrics: ActivityMetrics) => {
			if (!activity) return
			if (activityState !== 'active' && activityState !== 'paused') return

			setActivityState('submitting')

			try {
				try {
					await activity.end()
				} catch (err) {
					console.warn('Failed to flush time to Timeback:', err)
				}

				await saveProgressToBackend({
					status: 'completed',
					elapsed_ms: activity.elapsedMs,
					correct_questions: finalMetrics.correctQuestions,
					total_questions: finalMetrics.totalQuestions,
					mastered_units: finalMetrics.masteredUnits,
					...(finalMetrics.xpEarned !== '' && { xp_earned: finalMetrics.xpEarned as number }),
				})

				setConfig(finalConfig)
				setMetrics(finalMetrics)
				setActivityState('submitted')
				setIsEndModalOpen(false)
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
		setMetrics({
			correctQuestions: 0,
			totalQuestions: 0,
			masteredUnits: 0,
			xpEarned: '',
		})
	}, [backendActivity, getAccessTokenSilently])

	const handleGoHome = useCallback(async () => {
		if (activity && (activityState === 'active' || activityState === 'paused')) {
			try {
				await activity.end()
			} catch (err) {
				console.warn('Failed to flush time to Timeback:', err)
			}

			await saveProgressToBackend({
				status: 'paused',
				elapsed_ms: activity.elapsedMs,
				correct_questions: metrics.correctQuestions,
				total_questions: metrics.totalQuestions,
				mastered_units: metrics.masteredUnits,
				...(metrics.xpEarned !== '' && { xp_earned: metrics.xpEarned as number }),
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
		setMetrics({ correctQuestions: 0, totalQuestions: 0, masteredUnits: 0, xpEarned: '' })
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
					xpEarned: updatedProgress.xp_earned ?? '',
				})
				setElapsedMs(updatedProgress.elapsed_ms)

				// Start a new timeback session
				const a = timeback.activity.start({
					id: selectedActivity.activity_id,
					name: selectedActivity.name,
					course: { code: COURSE.code },
				})

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
							onStart={handleStart}
							onAnswer={handleAnswerQuestion}
							onPause={handlePause}
							onResume={handleResume}
							onEnd={handleOpenEndModal}
							onReset={handleReset}
							onGoHome={handleGoHome}
						/>
						<EndActivityModal
							open={isEndModalOpen}
							config={config}
							metrics={metrics}
							elapsedMs={elapsedMs}
							onClose={() => setIsEndModalOpen(false)}
							onSubmit={handleConfirmEnd}
						/>
					</>
				)}
			</TimebackGate>
		</div>
	)
}
