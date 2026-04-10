import { NextRequest, NextResponse } from "next/server";
import { createChatCompletion } from "@/lib/aiAnalyzer";
import type { ChatMessage } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json() as {
      messages: ChatMessage[];
      context: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages required." }, { status: 400 });
    }

    const stream = await createChatCompletion(messages, context || "");
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[/api/ai/chat]", err);
    return NextResponse.json({ error: "Chat failed." }, { status: 500 });
  }
}
