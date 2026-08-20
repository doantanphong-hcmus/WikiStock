import { EmptyState } from "@/components/common/EmptyState";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function RiskPage({ params }: PageProps) {
  const { ticker } = await params;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <EmptyState
        title={`Risk view cho ${ticker.toUpperCase()} đang ở skeleton`}
        message="Module này dành cho Product Owner và UI/UX chốt phạm vi ở vòng tiếp theo."
      />
    </div>
  );
}
