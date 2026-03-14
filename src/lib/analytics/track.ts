import { ANALYTICS_EVENTS, type AnalyticsEventPayloadMap } from './events'
import { pushEvent } from './pushEvent'

export function trackSignInCompleted(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.SIGN_IN_COMPLETED]
) {
  pushEvent(ANALYTICS_EVENTS.SIGN_IN_COMPLETED, payload)
}

export function trackRecipeView(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.RECIPE_VIEW]
) {
  pushEvent(ANALYTICS_EVENTS.RECIPE_VIEW, payload)
}

export function trackRecipeSearch(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.RECIPE_SEARCH]
) {
  pushEvent(ANALYTICS_EVENTS.RECIPE_SEARCH, payload)
}

export function trackFavoriteAdded(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.FAVORITE_ADDED]
) {
  pushEvent(ANALYTICS_EVENTS.FAVORITE_ADDED, payload)
}

export function trackFavoriteRemoved(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.FAVORITE_REMOVED]
) {
  pushEvent(ANALYTICS_EVENTS.FAVORITE_REMOVED, payload)
}

export function trackShoppingItemAdded(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.SHOPPING_ITEM_ADDED]
) {
  pushEvent(ANALYTICS_EVENTS.SHOPPING_ITEM_ADDED, payload)
}

export function trackShoppingItemToggled(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.SHOPPING_ITEM_TOGGLED]
) {
  pushEvent(ANALYTICS_EVENTS.SHOPPING_ITEM_TOGGLED, payload)
}

export function trackShoppingItemRemoved(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.SHOPPING_ITEM_REMOVED]
) {
  pushEvent(ANALYTICS_EVENTS.SHOPPING_ITEM_REMOVED, payload)
}

export function trackAdminRecipeCreated(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.ADMIN_RECIPE_CREATED]
) {
  pushEvent(ANALYTICS_EVENTS.ADMIN_RECIPE_CREATED, payload)
}

export function trackAdminRecipeUpdated(
  payload: AnalyticsEventPayloadMap[typeof ANALYTICS_EVENTS.ADMIN_RECIPE_UPDATED]
) {
  pushEvent(ANALYTICS_EVENTS.ADMIN_RECIPE_UPDATED, payload)
}
