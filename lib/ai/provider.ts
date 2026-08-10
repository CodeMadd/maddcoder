import { MockProvider } from "@/lib/ai/mock";

export type AIRole = "system" | "user" | "assistant";
export type AIMessage = { role: AIRole; content: string };

export type MockHint = { task: string; payload?: unknown };

export type CompletionRequest = {
  system?: string;
  messages: AIMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
  // Consumed only by the development MockProvider so it can produce
  // deterministic, grounded output. Real providers ignore this.
  mock?: MockHint;
};

export type CompletionResult = {
  text: string;
  tokensUsed: number;
};

export interface AIProvider {
  readonly name: string;
  complete(req: CompletionRequest): Promise<CompletionResult>;
}

function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  constructor(
    private apiKey: string,
    private model = process.env.OPENAI_MODEL || "gpt-4o-mini",
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const messages = [
      ...(req.system ? [{ role: "system", content: req.system }] : []),
      ...req.messages,
    ];
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: req.temperature ?? 0.4,
        max_tokens: req.maxTokens ?? 1200,
        ...(req.json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI request failed (${res.status})`);
    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content ?? "",
      tokensUsed: data.usage?.total_tokens ?? 0,
    };
  }
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  constructor(
    private apiKey: string,
    private model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const system = [
      req.system,
      req.json ? "Respond with a single valid JSON object and nothing else." : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        system,
        max_tokens: req.maxTokens ?? 1200,
        temperature: req.temperature ?? 0.4,
        messages: req.messages.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic request failed (${res.status})`);
    const data = await res.json();
    const text = (data.content ?? [])
      .map((c: { text?: string }) => c.text ?? "")
      .join("");
    return {
      text,
      tokensUsed:
        (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
    };
  }
}

class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  constructor(
    private apiKey: string,
    private model = process.env.GEMINI_MODEL || "gemini-1.5-flash",
  ) {}

  async complete(req: CompletionRequest): Promise<CompletionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    const contents = req.messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: req.system
          ? { parts: [{ text: req.system }] }
          : undefined,
        generationConfig: {
          temperature: req.temperature ?? 0.4,
          maxOutputTokens: req.maxTokens ?? 1200,
          ...(req.json ? { responseMimeType: "application/json" } : {}),
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini request failed (${res.status})`);
    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("") ?? "";
    return {
      text,
      tokensUsed: data.usageMetadata?.totalTokenCount ?? estimateTokens(text),
    };
  }
}

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const which = (process.env.AI_PROVIDER || "mock").toLowerCase();

  switch (which) {
    case "openai":
      if (process.env.OPENAI_API_KEY)
        cached = new OpenAIProvider(process.env.OPENAI_API_KEY);
      break;
    case "anthropic":
      if (process.env.ANTHROPIC_API_KEY)
        cached = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
      break;
    case "gemini":
      if (process.env.GEMINI_API_KEY)
        cached = new GeminiProvider(process.env.GEMINI_API_KEY);
      break;
  }

  // Default / fallback: deterministic mock provider (no API key required).
  if (!cached) cached = new MockProvider();
  return cached;
}

/**
 * Parse a JSON completion safely. Tolerates code fences and surrounding prose.
 */
export function parseJSON<T>(text: string): T {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "");
  const start = trimmed.indexOf("{");
  const arrStart = trimmed.indexOf("[");
  const from =
    arrStart >= 0 && (arrStart < start || start < 0) ? arrStart : start;
  if (from < 0) throw new Error("No JSON found in AI response");
  const slice = trimmed.slice(from);
  return JSON.parse(slice) as T;
}
