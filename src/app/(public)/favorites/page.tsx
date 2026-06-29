import { PageHeader, PageShell } from '@/components/ui/primitives'
import FavoritesClient from './FavoritesClient'

export default function FavoritesPage() {
  return (
    <PageShell variant="wide">
      <PageHeader title="Favorites" />
      <FavoritesClient />
    </PageShell>
  )
}
