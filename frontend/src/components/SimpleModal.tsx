/**
 * Simple modal component.
 */

import { useEffect, type ReactNode } from 'react'

export interface SimpleModalProps {
	open: boolean
	title: string
	onClose: () => void
	children: ReactNode
}

/**
 * Simple modal with backdrop and escape key support.
 */
export function SimpleModal({ open, title, onClose, children }: SimpleModalProps) {
	useEffect(() => {
		if (!open) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [open, onClose])

	if (!open) return null

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-6"
			onClick={onClose}
		>
			<div
				className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-zinc-100"
				onClick={e => e.stopPropagation()}
			>
				<div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100">
					<h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors"
					>
						Close
					</button>
				</div>
				<div className="p-8 max-h-[70vh] overflow-y-auto">{children}</div>
			</div>
		</div>
	)
}
