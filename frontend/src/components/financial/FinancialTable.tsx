import type { FinancialMetric, FinancialSummary } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";

const metricLabels: Array<Omit<FinancialMetric, "value">> = [
  { key: "revenue", label: "Doanh thu", unit: "VND" },
  { key: "netProfit", label: "Lợi nhuận sau thuế", unit: "VND" },
  { key: "totalAssets", label: "Tổng tài sản", unit: "VND" },
  { key: "liabilities", label: "Nợ phải trả", unit: "VND" },
  { key: "equity", label: "Vốn chủ sở hữu", unit: "VND" },
];

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

  const metrics = metricLabels.map((metric) => ({
    ...metric,
    value: financials[metric.key],
  }));

  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-5">
        <h2 className="text-lg font-semibold text-zinc-950">
          {financials.companyCode} Q{financials.quarter}/{financials.year}
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
            {metrics.map((metric) => (
              <tr key={metric.key}>
                <td className="px-5 py-4 font-medium text-zinc-800">
                  {metric.label}
                </td>
                <td className="px-5 py-4 text-right tabular-nums text-zinc-950">
                  {numberFormatter.format(metric.value)}
                </td>
                <td className="px-5 py-4 text-zinc-500">{metric.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
