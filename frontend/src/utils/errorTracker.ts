/**
 * Error tracking service wrapper using Sentry
 */
import * as Sentry from '@sentry/react'

/**
 * Track exception
 * @param error - The error to track
 * @param context - Additional context (user, component, etc.)
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureException(error, { contexts: { custom: context } })
  } else {
    // Fallback to console in development
    if (import.meta.env.DEV) {
      console.error('ErrorTracker:', error, context)
    }
  }
}

/**
 * Track message
 * @param message - Error message
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
  message: string,
  level: 'error' | 'warning' | 'info' = 'error',
  context?: Record<string, unknown>
): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.captureMessage(message, { level, contexts: { custom: context } })
  } else {
    // Fallback to console in development
    if (import.meta.env.DEV) {
      if (level === 'error') {
        console.error('ErrorTracker:', message, context)
      } else if (level === 'warning') {
        console.warn('ErrorTracker:', message, context)
      } else {
        console.info('ErrorTracker:', message, context)
      }
    }
  }
}

/**
 * Set user context for error tracking
 * @param user - Current user object
 */
export function setUser(user: { id: number; email: string; name: string } | null): void {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.setUser(
      user
        ? {
            id: String(user.id),
            email: user.email,
            username: user.name,
          }
        : null
    )
  }
}
