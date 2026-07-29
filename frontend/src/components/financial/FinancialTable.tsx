import type { FinancialSummary } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";

const numberFormatter = new Intl.NumberFormat("vi-VN");

export function FinancialTable({
  financials,
}: {
  financials: FinancialSummary | null;
}) {
  if (!financials) {
    return (
      <EmptyState
        title="Chưa có dữ liệu tài chính"
        message="Mock data hiện chưa có số liệu cho mã này."
      />
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-5">
        <h2 className="text-lg font-semibold text-zinc-950">
          {financials.ticker}{" "}
          {financials.periodType === "Q"
            ? `Q${financials.fiscalQuarter}/${financials.fiscalYear}`
            : financials.fiscalYear}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50 text-left text-zinc-500">
            <tr>
              <th className="px-5 py-3 font-medium">Chỉ tiêu</th>
              <th className="px-5 py-3 text-right font-medium">Giá trị</th>
              <th className="px-5 py-3 font-medium">Đơn vị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {financials.lineItems.map((lineItem) => (
              <tr key={lineItem.lineItemId}>
                <td className="px-5 py-4 font-medium text-zinc-800">
                  {lineItem.metric.metricName}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-zinc-950">
                  {numberFormatter.format(Number(lineItem.value))}
                </td>
                <td className="px-5 py-4 text-zinc-500">{lineItem.metric.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
