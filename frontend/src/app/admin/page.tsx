import { ErrorState } from "@/components/common/ErrorState";
import { getAdminCompanies } from "@/features/admin/api";
import type { AdminCompanyStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let companies: AdminCompanyStatus[] = [];
  let errorMessage: string | null = null;

  try {
    companies = await getAdminCompanies();
  } catch (caughtError) {
    errorMessage =
      caughtError instanceof Error
        ? caughtError.message
        : "Không tải được dữ liệu admin.";
  }

  if (errorMessage) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <ErrorState message={errorMessage} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-normal text-zinc-950">
          Admin data status
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          MVP skeleton for company ingestion and source readiness.
        </p>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Ticker</th>
              <th className="px-5 py-3 font-medium">Company</th>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Source</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {companies.map((company) => (
              <tr key={company.companyId}>
                <td className="px-5 py-4 font-semibold text-zinc-950">
                  {company.ticker}
                </td>
                <td className="px-5 py-4 text-zinc-700">{company.companyName}</td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                    {company.dataStatus}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                    {company.sourceStatus}
                  </span>
                </td>
                <td className="px-5 py-4 text-zinc-500">
                  {company.lastUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
