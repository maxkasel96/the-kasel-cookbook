import { PageHeader, PageShell, Skeleton } from "@/components/ui/primitives";

export default function AdminRecipesLoading() {
  return (
    <PageShell variant="wide">
      <PageHeader title="Recipes" />
      <Skeleton className="h-96 w-full" />
    </PageShell>
  );
}
