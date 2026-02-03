'use client'

export type ShoppingListItem = {
  id: string
  ingredient_text: string
  is_checked: boolean
  recipe_id?: string | null
  recipe_title?: string | null
  created_at: string
}

type ShoppingListResponse = {
  items: ShoppingListItem[]
}

type ShoppingListItemResponse = {
  item: ShoppingListItem
}

const handleResponse = async (response: Response) => {
  if (response.ok) return response.json()
  let message = 'Unable to update shopping list.'
  try {
    const data = await response.json()
    if (data?.error) {
      message = data.error
    }
  } catch {
    // Ignore JSON parsing errors.
  }
  throw new Error(message)
}

export async function fetchShoppingList() {
  const response = await fetch('/api/shopping-list', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  const data = (await handleResponse(response)) as ShoppingListResponse
  return data.items
}

export async function createShoppingListItem(payload: {
  ingredientText: string
  recipeId?: string
  recipeTitle?: string
}) {
  const response = await fetch('/api/shopping-list', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await handleResponse(response)) as ShoppingListItemResponse
  return data.item
}

export async function updateShoppingListItem(
  id: string,
  payload: { isChecked?: boolean }
) {
  const response = await fetch(`/api/shopping-list/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = (await handleResponse(response)) as ShoppingListItemResponse
  return data.item
}

export async function deleteShoppingListItem(id: string) {
  const response = await fetch(`/api/shopping-list/${id}`, {
    method: 'DELETE',
  })
  await handleResponse(response)
}

export async function clearShoppingList() {
  const response = await fetch('/api/shopping-list', {
    method: 'DELETE',
  })
  await handleResponse(response)
}
