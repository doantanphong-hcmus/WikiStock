import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ ticker: string }>;
};

export default async function CompanyAiPage({ params }: PageProps) {
  const { ticker } = await params;
  const companyCode = ticker.toUpperCase();

  redirect(`/ai?company=${encodeURIComponent(companyCode)}`);
}
