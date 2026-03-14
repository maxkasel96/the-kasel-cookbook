export const ANALYTICS_EVENTS = {
  SIGN_IN_COMPLETED: 'sign_in_completed',
  RECIPE_VIEW: 'recipe_view',
  RECIPE_SEARCH: 'recipe_search',
  FAVORITE_ADDED: 'favorite_added',
  FAVORITE_REMOVED: 'favorite_removed',
  SHOPPING_ITEM_ADDED: 'shopping_item_added',
  SHOPPING_ITEM_TOGGLED: 'shopping_item_toggled',
  SHOPPING_ITEM_REMOVED: 'shopping_item_removed',
  ADMIN_RECIPE_CREATED: 'admin_recipe_created',
  ADMIN_RECIPE_UPDATED: 'admin_recipe_updated',
} as const

export type AnalyticsEventName =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export type SignInCompletedPayload = {
  method: 'google'
}

export type RecipeViewPayload = {
  recipe_id: string
  recipe_title: string
  recipe_slug: string
  category?: string
  tags?: string[]
}

export type RecipeSearchPayload = {
  search_term: string
  results_count?: number
  category?: string
  tags?: string[]
}

export type FavoriteAddedPayload = {
  recipe_id: string
  recipe_title: string
  recipe_slug: string
  category?: string
  tags?: string[]
}

export type FavoriteRemovedPayload = {
  recipe_id: string
  recipe_title: string
  recipe_slug: string
  category?: string
  tags?: string[]
}

export type ShoppingItemAddedPayload = {
  item_name: string
  source: 'recipe' | 'manual'
  quantity?: number
  unit?: string
  recipe_id?: string
  recipe_title?: string
  recipe_slug?: string
}

export type ShoppingItemToggledPayload = {
  item_name: string
  completed: boolean
}

export type ShoppingItemRemovedPayload = {
  item_name: string
}

export type AdminRecipeCreatedPayload = {
  recipe_id?: string
  recipe_title: string
  recipe_slug?: string
  publish_status: 'draft' | 'published'
}

export type AdminRecipeUpdatedPayload = {
  recipe_id: string
  recipe_title: string
  recipe_slug: string
  publish_status: 'draft' | 'published'
}

export type AnalyticsEventPayloadMap = {
  [ANALYTICS_EVENTS.SIGN_IN_COMPLETED]: SignInCompletedPayload
  [ANALYTICS_EVENTS.RECIPE_VIEW]: RecipeViewPayload
  [ANALYTICS_EVENTS.RECIPE_SEARCH]: RecipeSearchPayload
  [ANALYTICS_EVENTS.FAVORITE_ADDED]: FavoriteAddedPayload
  [ANALYTICS_EVENTS.FAVORITE_REMOVED]: FavoriteRemovedPayload
  [ANALYTICS_EVENTS.SHOPPING_ITEM_ADDED]: ShoppingItemAddedPayload
  [ANALYTICS_EVENTS.SHOPPING_ITEM_TOGGLED]: ShoppingItemToggledPayload
  [ANALYTICS_EVENTS.SHOPPING_ITEM_REMOVED]: ShoppingItemRemovedPayload
  [ANALYTICS_EVENTS.ADMIN_RECIPE_CREATED]: AdminRecipeCreatedPayload
  [ANALYTICS_EVENTS.ADMIN_RECIPE_UPDATED]: AdminRecipeUpdatedPayload
}
