import { NextRequest, NextResponse } from "next/server";
import { callAI, type ChatMessage } from "@/lib/ai";

const HISTORY_LIMIT = 10;

export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "no messages" }, { status: 400 });
  }

  const trimmed = messages
    .map((m) => ({
      role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
      content: String(m.content || "").slice(0, 2000).trim(),
    }))
    .filter((m) => m.content.length > 0)
    .slice(-HISTORY_LIMIT);

  if (trimmed.length === 0) {
    return NextResponse.json({ error: "empty messages" }, { status: 400 });
  }

  try {
    const reply = await callAI(trimmed);
    return NextResponse.json({ reply });
  } catch (e) {
    console.error("[chat] provider failed", e);
    return NextResponse.json(
      {
        error:
          "Hopper couldn't reach the model just now. Try again in a moment, or use the contact form and JJ will reply directly.",
      },
      { status: 502 }
    );
  }
}