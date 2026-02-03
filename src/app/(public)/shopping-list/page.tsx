import ShoppingListClient from './ShoppingListClient'

export default function ShoppingListPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Shopping list
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Ingredients to pick up
        </h1>
        <p className="text-sm text-muted-foreground">
          Add items from recipes or type in anything you need.
        </p>
      </header>
      <ShoppingListClient />
    </main>
  )
}
