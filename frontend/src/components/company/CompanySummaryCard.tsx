import type { Company } from "@/lib/types";

function websiteLabel(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return value;
  }
}

export function CompanySummaryCard({ company }: { company: Company }) {
  const websiteName = company.website ? websiteLabel(company.website) : null;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-950">Tổng quan</h2>
      <p className="mt-3 text-sm leading-7 text-zinc-600">
        {company.description}
      </p>
      {company.website ? (
        <p className="mt-5 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
          Website chính thức:{" "}
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-emerald-800 hover:underline"
          >
            {websiteName}
          </a>
        </p>
      ) : null}
    </section>
  );
}
