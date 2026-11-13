import { Suspense } from "react";
import { Spinner } from "@/components/ui";
import View from "./view";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <View id={id} />;
}

export default function Page({ params }: PageProps<"/beneficiaires/[id]">) {
  return (
    <Suspense fallback={<Spinner />}>
      <Content params={params} />
    </Suspense>
  );
}
