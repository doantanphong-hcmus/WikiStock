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
          <dt className="font-medium text-zinc-500">Ban lãnh đạo</dt>
          <dd className="mt-1 space-y-1 text-zinc-950">
            {company.executives.length
              ? company.executives.map((executive) => (
                  <div key={executive.executiveId}>
                    {executive.fullName} - {executive.position}
                  </div>
                ))
              : "Chưa có dữ liệu"}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Website</dt>
          <dd className="mt-1">
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-800"
              >
                {company.website}
              </a>
            ) : (
              <span className="text-zinc-500">Chưa có dữ liệu</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">Metadata</dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              ID: {company.companyId}
            </span>
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
              Ngày niêm yết: {company.listingDate ?? "N/A"}
            </span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
