import type { AiAskResponse } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";

export function AiAnswerCard({ answer }: { answer: AiAskResponse | null }) {
  if (!answer) {
    return (
      <EmptyState
        title="Chưa có câu trả lời"
        message="Gửi một câu hỏi để kiểm tra bridge backend -> ai-service."
      />
    );
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
          {answer.isConfident ? "Confident" : "Demo/Fallback"}
        </span>
      </div>
      <p className="mt-4 text-sm leading-7 text-zinc-700">{answer.answer}</p>
      {answer.limitations ? (
        <p className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          {answer.limitations}
        </p>
      ) : null}
      <div className="mt-5 space-y-3">
        <h2 className="text-sm font-semibold text-zinc-950">Citations</h2>
        {answer.citations.length ? (
          <ul className="space-y-3">
            {answer.citations.map((citation) => (
              <li key={citation.citationId} className="rounded-md border border-zinc-200 p-3">
                <a
                  href={citation.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-emerald-800"
                >
                  {citation.docTitle}
                </a>
                {citation.locationRef ? (
                  <p className="mt-1 text-xs text-zinc-500">{citation.locationRef}</p>
                ) : null}
                <p className="mt-2 text-sm text-zinc-600">{citation.excerpt}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">Chưa có citation cho câu trả lời này.</p>
        )}
      </div>
    </section>
  );
}
