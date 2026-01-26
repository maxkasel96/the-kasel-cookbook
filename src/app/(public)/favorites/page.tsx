import FavoritesClient from './FavoritesClient'

export default function FavoritesPage() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Favorites
        </p>
        <h1 className="text-3xl font-semibold text-foreground">
          Your favorite recipes
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep a short list of recipes you want to cook again.
        </p>
      </header>
      <FavoritesClient />
    </main>
  )
}
