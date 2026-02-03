'use client'

import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'

import {
  clearShoppingList,
  createShoppingListItem,
  deleteShoppingListItem,
  fetchShoppingList,
  updateShoppingListItem,
  type ShoppingListItem,
} from '@/lib/shopping-list-client'

export default function ShoppingListClient() {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newItem, setNewItem] = useState('')
  const [pendingIds, setPendingIds] = useState<Record<string, boolean>>({})
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    let isActive = true
    const load = async () => {
      try {
        const data = await fetchShoppingList()
        if (isActive) {
          setItems(data)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Unable to load items.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      isActive = false
    }
  }, [])

  const checkedCount = useMemo(
    () => items.filter((item) => item.is_checked).length,
    [items]
  )

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = newItem.trim()
    if (!trimmed) {
      setError('Enter an ingredient to add.')
      return
    }
    setError(null)
    setNewItem('')
    try {
      const created = await createShoppingListItem({
        ingredientText: trimmed,
      })
      setItems((prev) => [...prev, created])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add item.')
    }
  }

  const handleToggle = async (item: ShoppingListItem) => {
    setPendingIds((prev) => ({ ...prev, [item.id]: true }))
    setError(null)
    const nextChecked = !item.is_checked
    setItems((prev) =>
      prev.map((entry) =>
        entry.id === item.id ? { ...entry, is_checked: nextChecked } : entry
      )
    )
    try {
      await updateShoppingListItem(item.id, { isChecked: nextChecked })
    } catch (err) {
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === item.id ? { ...entry, is_checked: item.is_checked } : entry
        )
      )
      setError(err instanceof Error ? err.message : 'Unable to update item.')
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev }
        delete next[item.id]
        return next
      })
    }
  }

  const handleRemove = async (itemId: string) => {
    setPendingIds((prev) => ({ ...prev, [itemId]: true }))
    setError(null)
    const previous = items
    setItems((prev) => prev.filter((item) => item.id !== itemId))
    try {
      await deleteShoppingListItem(itemId)
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Unable to remove item.')
    } finally {
      setPendingIds((prev) => {
        const next = { ...prev }
        delete next[itemId]
        return next
      })
    }
  }

  const handleClear = async () => {
    if (!items.length) return
    const confirmed = window.confirm(
      'Clear the entire shopping list? This cannot be undone.'
    )
    if (!confirmed) return
    setIsClearing(true)
    setError(null)
    const previous = items
    setItems([])
    try {
      await clearShoppingList()
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Unable to clear list.')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl border border-muted/60 bg-muted/10 p-4"
        onSubmit={handleAdd}
      >
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Add ingredient
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={newItem}
            onChange={(event) => setNewItem(event.target.value)}
            placeholder="e.g. 2 lemons"
            className="w-full flex-1 rounded-full border border-muted/60 bg-background px-4 py-2 text-sm text-foreground shadow-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-foreground px-6 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90"
          >
            Add to list
          </button>
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {items.length} items · {checkedCount} checked
        </div>
        <button
          type="button"
          onClick={handleClear}
          disabled={!items.length || isClearing}
          className="rounded-full border border-muted/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          Clear list
        </button>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading shopping list…</p>
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((item) => {
            const isPending = Boolean(pendingIds[item.id])
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-muted/60 bg-background p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <label className="flex flex-1 items-start gap-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={item.is_checked}
                    onChange={() => handleToggle(item)}
                    disabled={isPending}
                    className="mt-1 h-4 w-4 rounded border-muted/60 text-foreground"
                  />
                  <span className={item.is_checked ? 'line-through opacity-60' : ''}>
                    {item.ingredient_text}
                    {item.recipe_title ? (
                      <span className="mt-1 block text-xs text-muted-foreground">
                        From {item.recipe_title}
                      </span>
                    ) : null}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  disabled={isPending}
                  className="rounded-full border border-muted/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition hover:border-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Remove
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Your shopping list is empty. Add ingredients to get started.
        </p>
      )}
    </div>
  )
}
