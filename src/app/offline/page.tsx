import Link from 'next/link'

export const metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <main className="page-shell">
      <section className="editorial-empty-state mx-auto max-w-2xl space-y-5 text-center">
        <p className="page-kicker">Offline</p>
        <h1 className="page-title">This recipe is not saved offline yet.</h1>
        <p className="page-intro">
          Previously viewed recipes can open without a connection. Reconnect and
          open this recipe once to make it available for next time.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/recipes" className="btn-primary">
            Open saved recipes
          </Link>
          <Link href="/favorites" className="btn-secondary">
            View favorites
          </Link>
        </div>
      </section>
    </main>
  )
}
