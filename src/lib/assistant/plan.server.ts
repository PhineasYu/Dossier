import { NoObjectGeneratedError } from "ai";
import { createResponsesCall } from "./responses.server";
import { planSchema } from "../assistant-tasks";

export async function generateTaskPlan(request: Request, apiKey: string, messages: { role: "user" | "assistant"; content: string }[], instructions: string) {
  let blockedReason: string | null = null;
  // Capture safe upstream messages and terminal access blocks without retrying.
  const call = createResponsesCall(request, { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" }, messages, instructions);
  try {
    const output = await call.result.output;
    if (!output.answer.trim()) throw new Error("The assistant returned no answer.");
    return { output, blockedReason };
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error) && error.text) {
      try { return { output: planSchema.parse(JSON.parse(error.text)), blockedReason }; } catch { /* surface error below */ }
    }
    const upstream = error as { statusCode?: number; responseBody?: string; message?: string };
    let message = upstream.message ?? "The assistant could not prepare this request.";
    try {
      const parsed = JSON.parse(upstream.responseBody ?? "{}") as { message?: string; error?: { message?: string } };
      message = parsed.message ?? parsed.error?.message ?? message;
    } catch { /* keep safe message */ }
    if ([402,403].includes(upstream.statusCode ?? 0)) blockedReason = message;
    return { output: null, blockedReason, error: message };
  }
}