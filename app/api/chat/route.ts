import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileBlock = "";
  let contextBlock = "";
  let memoryBlock = "";

  if (user) {
    const [{ data: profile }, { data: contextFiles }, { data: memories }] = await Promise.all([
      supabase
        .from("profiles")
        .select("name, occupation, school, employer")
        .eq("id", user.id)
        .single(),
      supabase
        .from("files")
        .select("path, content")
        .eq("user_id", user.id)
        .like("path", "context/%")
        .order("path"),
      supabase
        .from("memories")
        .select("name, type, body")
        .eq("user_id", user.id)
        .order("created_at"),
    ]);

    if (profile) {
      const parts = [
        profile.name && `Name: ${profile.name}`,
        profile.occupation && `Role: ${profile.occupation}`,
        profile.school && `School: ${profile.school}`,
        profile.employer && `Employer: ${profile.employer}`,
      ].filter(Boolean);

      if (parts.length > 0) {
        profileBlock = "\n\n## About the user\n" + parts.join("\n");
      }
    }

    if (contextFiles && contextFiles.length > 0) {
      const filled = contextFiles.filter((f) => f.content?.trim());
      if (filled.length > 0) {
        contextBlock =
          "\n\n## User's context files\n" +
          filled.map((f) => `### ${f.path}\n${f.content}`).join("\n\n");
      }
    }

    if (memories && memories.length > 0) {
      memoryBlock =
        "\n\n## Saved memories\n" +
        memories.map((m) => `[${m.type}] ${m.name}: ${m.body}`).join("\n");
    }
  }

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a personal AI assistant built into HypeOS — the user's personal operating system. You have context about who they are. Be concise, direct, and helpful. Use their name naturally but not on every message. No fluff." +
      profileBlock +
      contextBlock +
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
