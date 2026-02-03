/**
 * View shown when user is authenticated.
 */

import { useCallback, useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { type Activity, useTimeback, useTimebackVerification, useTimebackProfile } from '@timeback/sdk/react'

import { ActivityGate } from './ActivityGate'
import { AuthenticatedHeader, type User } from './AuthenticatedHeader'
import { ProfileModal } from './ProfileModal'
import { useTimebackLaunchFlag } from '../hooks/useTimebackLaunchFlag'
import type { ActivityConfig, ActivityMetrics, ActivityState, CourseInfo } from './ActivityForm'

/**
 * Course info from timeback.config.json.
 */
const COURSE: CourseInfo = { code: 'BUNLEDGE-V0-MATH' }

export interface AuthenticatedViewProps {
	onLogout: () => void
}

export function AuthenticatedView({ onLogout }: AuthenticatedViewProps) {
	const [edgeUser, setEdgeUser] = useState<User | undefined>(undefined)
	const [edgeError, setEdgeError] = useState<string | undefined>(undefined)

	const { getAccessTokenSilently } = useAuth0()

	const [isUserModalOpen, setIsUserModalOpen] = useState(false)

	const timeback = useTimeback()
	const { state: timebackVerification } = useTimebackVerification()
	const launchedFromTimeback = useTimebackLaunchFlag()
	const { state: profileState, canFetch, fetchProfile } = useTimebackProfile()

	const profile = profileState.status === 'loaded' ? profileState.profile : undefined
	const profileLoading = profileState.status === 'loading'
	const profileError = profileState.status === 'error' ? profileState.message : undefined

	const [activity, setActivity] = useState<Activity | undefined>(undefined)
	const [activityState, setActivityState] = useState<ActivityState>('idle')
	const [elapsedMs, setElapsedMs] = useState(0)

	const [config, setConfig] = useState<ActivityConfig>({
		activityId: 'bunledge_lesson_1',
		activityName: 'Introduction to Bunledge - Lesson 1',
	})

	const [metrics, setMetrics] = useState<ActivityMetrics>({
		correctQuestions: 8,
		totalQuestions: 10,
		masteredUnits: 0,
		xpEarned: '',
	})

	// Fetch edge user
	useEffect(() => {
		let cancelled = false

		void (async () => {
			try {
				const token = await getAccessTokenSilently()
				if (cancelled) return

				const res = await fetch('/api/users/me', {
					headers: { Authorization: `Bearer ${token}` },
				})
				if (!res.ok) throw new Error(`/api/users/me failed (${res.status})`)

				const u = (await res.json()) as User
				if (!cancelled) setEdgeUser(u)
			} catch (err) {
				if (!cancelled) {
					setEdgeError(err instanceof Error ? err.message : 'Failed to fetch user')
				}
			}
		})()

		return () => {
			cancelled = true
		}
	}, [getAccessTokenSilently])

	useEffect(() => {
		if (!activity) return
		if (activityState !== 'active' && activityState !== 'paused') return

		const interval = setInterval(() => {
			setElapsedMs(activity.elapsedMs)
		}, 100)

		return () => clearInterval(interval)
	}, [activity, activityState])

	const handleConfigChange = useCallback((partial: Partial<ActivityConfig>) => {
		setConfig(prev => ({ ...prev, ...partial }))
	}, [])

	const handleMetricsChange = useCallback((partial: Partial<ActivityMetrics>) => {
		setMetrics(prev => ({ ...prev, ...partial }))
	}, [])

	const handleStart = useCallback(() => {
		if (!timeback) return
		if (timebackVerification.status !== 'verified') return
		if (activityState !== 'idle') return

		const a = timeback.activity.start({
			id: config.activityId,
			name: config.activityName,
			course: { code: COURSE.code },
		})

		setActivity(a)
		setActivityState('active')
		setElapsedMs(0)
	}, [timeback, timebackVerification.status, activityState, config])

	const handlePause = useCallback(() => {
		if (!activity || activityState !== 'active') return
		activity.pause()
		setActivityState('paused')
	}, [activity, activityState])

	const handleResume = useCallback(() => {
		if (!activity || activityState !== 'paused') return
		activity.resume()
		setActivityState('active')
	}, [activity, activityState])

	const handleEnd = useCallback(async () => {
		if (!activity) return
		if (activityState !== 'active' && activityState !== 'paused') return

		setActivityState('submitting')

		try {
			await activity.end({
				totalQuestions: metrics.totalQuestions,
				correctQuestions: metrics.correctQuestions,
				...(metrics.xpEarned !== '' && { xpEarned: metrics.xpEarned }),
				...(metrics.masteredUnits > 0 && { masteredUnits: metrics.masteredUnits }),
			})
			setActivityState('submitted')
		} catch (error) {
			console.error('Failed to end activity:', error)
			setActivityState(activity.isPaused ? 'paused' : 'active')
		}
	}, [activity, activityState, metrics])

	const handleReset = useCallback(() => {
		setActivity(undefined)
		setActivityState('idle')
		setElapsedMs(0)
	}, [])

	const isReady = timebackVerification.status === 'verified' && !!timeback

	return (
		<div className="space-y-8">
			<AuthenticatedHeader
				edgeUser={edgeUser}
				edgeError={edgeError}
				launchedFromTimeback={launchedFromTimeback}
				timebackVerification={timebackVerification}
				onOpenProfile={() => setIsUserModalOpen(true)}
				onLogout={onLogout}
			/>

			<ProfileModal
				open={isUserModalOpen}
				onClose={() => setIsUserModalOpen(false)}
				timebackVerification={timebackVerification}
				edgeUser={edgeUser}
				profile={profile}
				profileLoading={profileLoading}
				profileError={profileError}
				canFetchProfile={canFetch}
				onFetchProfile={fetchProfile}
			/>

			<ActivityGate
				timebackVerification={timebackVerification}
				isReady={isReady}
				activityState={activityState}
				elapsedMs={elapsedMs}
				course={COURSE}
				config={config}
				metrics={metrics}
				onConfigChange={handleConfigChange}
				onMetricsChange={handleMetricsChange}
				onStart={handleStart}
				onPause={handlePause}
				onResume={handleResume}
				onEnd={handleEnd}
				onReset={handleReset}
			/>
		</div>
	)
}
