import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Fetch user's memories to inject into system prompt
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let memoryBlock = "";
  if (user) {
    const { data: memories } = await supabase
      .from("memories")
      .select("name, type, body")
      .eq("user_id", user.id)
      .order("created_at");

    if (memories && memories.length > 0) {
      memoryBlock =
        "\n\n## What you know about the user\n" +
        memories.map((m) => `[${m.type}] ${m.name}: ${m.body}`).join("\n");
    }
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a personal AI assistant built into HypeOS — the user's personal operating system. Be concise, direct, and helpful. No fluff." +
      memoryBlock,
    messages,
  });

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
