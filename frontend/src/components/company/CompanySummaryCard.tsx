import type { Company } from "@/lib/types";

export function CompanySummaryCard({ company }: { company: Company }) {
  return (
    <section className="grid gap-5 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:grid-cols-[1.5fr_1fr]">
      <div>
        <h2 className="text-lg font-semibold text-zinc-950">Tổng quan</h2>
        <p className="mt-3 text-sm leading-7 text-zinc-600">{company.description}</p>
      </div>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="font-medium text-zinc-500">CEO</dt>
          <dd className="mt-1 text-zinc-950">{company.ceo}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Website</dt>
          <dd className="mt-1">
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-emerald-800"
            >
              {company.website}
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Nguồn</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {company.sources.map((source) => (
              <span
                key={source}
                className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800"
              >
                {source}
              </span>
            ))}
          </dd>
        </div>
      </dl>
    </section>
  );
}
