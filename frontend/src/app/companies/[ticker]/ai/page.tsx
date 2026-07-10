import { AiAskBox } from "@/components/ai/AiAskBox";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function CompanyAiPage({ params }: PageProps) {
  const { ticker } = await params;
  const companyCode = ticker.toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-6 py-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          AI analysis
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-zinc-950">
          Hỏi AI về {companyCode}
        </h1>
      </section>
      <AiAskBox companyCode={companyCode} />
    </div>
  );
}
