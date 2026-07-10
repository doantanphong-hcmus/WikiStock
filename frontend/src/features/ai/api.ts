"use client";

import { apiPost } from "@/lib/api";
import type { AiAskRequest, AiAskResponse } from "@/lib/types";

export function askAi(payload: AiAskRequest) {
  return apiPost<AiAskResponse, AiAskRequest>("/ai/ask", payload);
}
