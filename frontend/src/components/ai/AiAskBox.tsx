"use client";

import { FormEvent, useState } from "react";
import { askAi } from "@/features/ai/api";
import type { AiAskResponse } from "@/lib/types";
import { AiAnswerCard } from "./AiAnswerCard";
import { ErrorState } from "@/components/common/ErrorState";

export function AiAskBox({ companyCode }: { companyCode: string }) {
  const [query, setQuery] = useState(
    `Tình hình doanh thu và lợi nhuận của ${companyCode} có điểm gì đáng chú ý?`,
  );
  const [answer, setAnswer] = useState<AiAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await askAi({
        companyCode,
        query,
        filters: {
          year: 2025,
          documentTypes: ["financial_statement", "annual_report"],
        },
      });
      setAnswer(result);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Không thể gửi câu hỏi AI.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <label className="text-sm font-semibold text-zinc-950" htmlFor="ai-query">
          Câu hỏi cho {companyCode}
        </label>
        <textarea
          id="ai-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={7}
          className="mt-3 w-full resize-none rounded-md border border-zinc-300 bg-white p-3 text-sm leading-6 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="mt-4 h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isLoading ? "Đang gửi" : "Gửi câu hỏi"}
        </button>
        {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
      </form>

      <AiAnswerCard answer={answer} />
    </div>
  );
}
