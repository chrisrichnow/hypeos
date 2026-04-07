import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // TODO: wire up Claude API (Anthropic SDK)
  // For now, return a stub response
  const lastMessage = messages[messages.length - 1]?.content ?? "";

  return NextResponse.json({
    reply: `Got it: "${lastMessage}" — AI coming soon.`,
  });
}
