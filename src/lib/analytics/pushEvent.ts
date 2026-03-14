import type { AnalyticsEventName, AnalyticsEventPayloadMap } from './events'

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
  }
}

export function pushEvent<TEventName extends AnalyticsEventName>(
  event: TEventName,
  payload: AnalyticsEventPayloadMap[TEventName]
) {
  if (typeof window === 'undefined') {
    return
  }

  window.dataLayer = window.dataLayer || []

  const eventPayload = {
    event,
    ...payload,
  }

  window.dataLayer.push(eventPayload)

  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics] dataLayer push', eventPayload)
  }
}
