import { PageHeader, PageShell, Skeleton } from "@/components/ui/primitives";

export default function CreateRecipeLoading() {
  return (
    <PageShell variant="editor">
      <PageHeader title="Create recipe" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-[36rem] w-full" />
    </PageShell>
  );
}
