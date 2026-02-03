/**
 * Hook to check if the user was launched from Timeback.
 *
 * This is a simple session marker set in the Auth0 redirect callback.
 * It is not a security boundary; verification happens server-side.
 */

import { useState } from 'react'

export function useTimebackLaunchFlag(): boolean {
	const [launched] = useState(() => sessionStorage.getItem('timeback_launch') === '1')
	return launched
}
