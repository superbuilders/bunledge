/**
 * Login header with logo and title.
 */

import { TimebackLogo } from './TimebackLogo'

export function LoginHeader() {
	return (
		<div className="flex flex-col items-center space-y-6 mb-8">
			<div className="h-20 w-20 flex items-center justify-center">
				<TimebackLogo size={80} />
			</div>
			<div className="space-y-4 text-center">
				<h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">Bunledge</h1>
				<div className="flex flex-col items-center space-y-2">
					<div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
						<span className="h-1 w-1 rounded-full bg-zinc-200" />
						FastAPI + Auth0 Demo
					</div>
					<div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
						<span className="h-1 w-1 rounded-full bg-zinc-200" />
						Real-time activity tracking
					</div>
				</div>
			</div>
		</div>
	)
}
